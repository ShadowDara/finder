// install.go implements the commands around template installation:
//
//   - Install / InstallAll: download templates by URL (or registry name)
//   - ListInstalled:        show installed templates
//   - Uninstall / UninstallAll: remove installed templates
//
// Installed templates are stored under ~/.finder/installed/templates/;
// their sources are tracked in the lockfile (~/.finder/filepkg.lock.json).
// The download logic itself lives in pub/filepkg.
package cli

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/color"
	"github.com/shadowdara/finder/pub/filepkg"
)

// UserLockPath returns the path to the lockfile in the UserRoot.
func UserLockPath() (string, error) {
	path, err := templates.GetCustomPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(path, "filepkg.lock.json"), nil
}

// installPathForURL maps a URL to the relative target path under
// ~/.finder/templates/. From
//
//	https://shadowdara.github.io/test/template.json5
//
// it becomes
//
//	shadowdara.github.io/test/template.json5
//
// so the name matches the path and `finder` can look it up and invoke it
// via exactly that path. A port in the host is replaced by an underscore
// (Windows does not allow ':' in file names):
//
//	http://localhost:8765/test/template.json5
//	→ localhost_8765/test/template.json5
func installPathForURL(rawURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}
	if u.Host == "" {
		return "", fmt.Errorf("keine gültige URL: %s", rawURL)
	}
	name := u.Host + u.Path
	name = strings.TrimSuffix(name, "/")
	name = strings.TrimPrefix(name, "/")
	// Make it Windows-compatible: ':' is forbidden in file names.
	name = strings.ReplaceAll(name, ":", "_")
	return name, nil
}

// normalizeSourceURL prepends a missing http(s) scheme and returns the
// full, usable URL.
func normalizeSourceURL(rawURL string) string {
	trimmed := strings.TrimSpace(rawURL)
	if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
		return "http://" + trimmed
	}
	return trimmed
}

// Install downloads a template by URL (or by name from the built-in
// registry) via the filepkg library into ~/.finder/templates/.
// The target name matches the URL (host + path) so the installed
// template can later be invoked by exactly that name.
func Install(installTemplate string) error {
	installTemplate = strings.TrimSpace(installTemplate)
	if installTemplate == "" {
		return fmt.Errorf("install: kein Template-Name oder keine URL angegeben")
	}

	// Determine source + target name
	sourceURL := installTemplate
	relName := templates.TrimTemplateExt(installTemplate)
	looksLikeURL := strings.Contains(relName, "/") || strings.Contains(relName, ".")

	if !looksLikeURL {
		// No path / no URL → built-in registry name
		sourceURL = fmt.Sprintf("https://raw.githubusercontent.com/shadowdara/finder/main/templates/%s.json5", relName)
		relName = "shadowdara.github.io/registry/" + relName
	} else {
		// Real URL (even without http://) → target name = host + path
		name, err := installPathForURL(normalizeSourceURL(installTemplate))
		if err != nil {
			return fmt.Errorf("install: %v", err)
		}
		relName = name
	}

	// Normalize the source: always a full http(s) URL for the lockfile
	sourceURL = normalizeSourceURL(sourceURL)

	// IMPORTANT: the target name must NEVER end with a template extension —
	// it is later used with + ".json5" as the file name.
	// installPathForURL may return the path including the extension (from the URL),
	// so clean it here.
	relName = templates.TrimTemplateExt(relName)

	// Target directory: ~/.finder/installed/templates/
	customPath, err := templates.GetInstalledTemplatePath()
	if err != nil {
		return fmt.Errorf("install: Home-Pfad nicht ermittelbar: %v", err)
	}

	// Lockfile: ~/.finder/filepkg.lock.json (the folder must exist!)
	lockPath, err := UserLockPath()
	if err != nil {
		return fmt.Errorf("install: Lockfile-Pfad nicht ermittelbar: %v", err)
	}

	// Ensure the folder exists (the lockfile lives in ~/.finder/)
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o755); err != nil {
		return fmt.Errorf("install: Ordner %s anlegen: %v", filepath.Dir(lockPath), err)
	}

	// filepkg manager: files land as sub-paths in installed/templates/,
	// the lockfile lives in the .finder/ root.
	m := filepkg.New(customPath, lockPath)
	m.Client = filepkg.DefaultClient()

	// Does the file already exist (same relName)? Then skip.
	if exists, _ := m.IsLocked(relName + ".json5"); exists || fileExists(filepath.Join(customPath, filepath.FromSlash(relName)+".json5")) {
		fmt.Printf("%sTemplate '%s' ist bereits installiert.%s\n", color.Yellow, relName, color.Reset)
		return nil
	}

	// Download + track in the lockfile (filepkg computes the SHA-256
	// hash and stores it).
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := m.Add(filepkg.File{Name: relName + ".json5", URL: sourceURL}); err != nil {
		return fmt.Errorf("install: %v", err)
	}
	if _, err := m.Pull(ctx, relName+".json5"); err != nil {
		return fmt.Errorf("install: %v", err)
	}

	fmt.Printf("%sInstalled template '%s'%s\n", color.Green, relName, color.Reset)
	return nil
}

// InstallAll installs all templates from the lockfile
// (~/.finder/filepkg.lock.json) into the installed template directory.
// Templates whose server is unreachable (or that cannot be loaded for
// other reasons) are skipped — the rest is still installed.
func InstallAll() error {
	customPath, err := templates.GetInstalledTemplatePath()
	if err != nil {
		return fmt.Errorf("install: Home-Pfad nicht ermittelbar: %v", err)
	}
	lockPath, err := UserLockPath()
	if err != nil {
		return fmt.Errorf("install: Lockfile-Pfad nicht ermittelbar: %v", err)
	}

	m := filepkg.New(customPath, lockPath)
	m.Client = filepkg.DefaultClient()

	lf, err := m.LoadLock()
	if err != nil {
		return fmt.Errorf("install: %v", err)
	}
	if len(lf.Files) == 0 {
		fmt.Println("No templates in lockfile to install.")
		return nil
	}

	failed := 0
	for _, f := range lf.Files {
		name := f.Name

		// Already present on disk → skip.
		if fileExists(filepath.Join(customPath, filepath.FromSlash(name))) {
			fmt.Printf("%sTemplate '%s' ist bereits installiert.%s\n", color.Yellow, name, color.Reset)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		if _, err := m.Pull(ctx, name); err != nil {
			cancel()
			// Server unreachable or similar → skip and continue.
			fmt.Printf("%sÜbersprungen: Template '%s' (%v)%s\n", color.Yellow, name, err, color.Reset)
			failed++
			continue
		}
		cancel()
		fmt.Printf("%sInstalled template '%s'%s\n", color.Green, name, color.Reset)
	}

	if failed > 0 {
		fmt.Printf("%s%d Template(s) konnten nicht installiert werden (übersprungen).%s\n", color.Yellow, failed, color.Reset)
	}
	return nil
}

// fileExists checks whether a file exists.
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// ListInstalled shows all installed templates from
// ~/.finder/installed/templates/.
func ListInstalled() error {
	installed, err := templates.LoadInstalledTemplates()
	if err != nil {
		return fmt.Errorf("list-installed: %v", err)
	}

	if len(installed) == 0 {
		fmt.Println("No installed templates.")
		return nil
	}

	fmt.Println("Installed templates:")
	for name := range installed {
		fmt.Printf("  %s%s%s\n", color.Cyan, name, color.Reset)
	}
	return nil
}

// Uninstall removes a template (by name or URL) from
// ~/.finder/installed/templates/ (including the lockfile entry).
func Uninstall(templateName string) error {
	templateName = strings.TrimSpace(templateName)
	if templateName == "" {
		return fmt.Errorf("uninstall: kein Template-Name angegeben")
	}

	relName := templates.TrimTemplateExt(templateName)
	if strings.Contains(relName, "/") || strings.Contains(relName, ".") {
		name, err := installPathForURL(normalizeSourceURL(templateName))
		if err != nil {
			return fmt.Errorf("uninstall: %v", err)
		}
		relName = name
	}

	customPath, err := templates.GetInstalledTemplatePath()
	if err != nil {
		return fmt.Errorf("uninstall: Home-Pfad nicht ermittelbar: %v", err)
	}
	lockPath, err := UserLockPath()
	if err != nil {
		return fmt.Errorf("uninstall: Lockfile-Pfad nicht ermittelbar: %v", err)
	}

	m := filepkg.New(customPath, lockPath)

	// Remove the lockfile entry
	removed, _ := m.Remove(relName + ".json5")

	// Remove the file from disk
	filePath := filepath.Join(customPath, filepath.FromSlash(relName)+".json5")
	osErr := os.Remove(filePath)

	if !removed && osErr != nil {
		return fmt.Errorf("uninstall: Template '%s' ist kein benutzerdefiniertes Template", relName)
	}

	fmt.Printf("%sUninstalled template '%s'%s\n", color.Green, relName, color.Reset)
	return nil
}

// UninstallAll removes ALL installed templates from
// ~/.finder/installed/templates/ — including lockfile entries.
// If nothing is installed, that is reported without an error.
func UninstallAll() error {
	customPath, err := templates.GetInstalledTemplatePath()
	if err != nil {
		return fmt.Errorf("uninstall: Home-Pfad nicht ermittelbar: %v", err)
	}
	lockPath, err := UserLockPath()
	if err != nil {
		return fmt.Errorf("uninstall: Lockfile-Pfad nicht ermittelbar: %v", err)
	}

	m := filepkg.New(customPath, lockPath)

	lf, err := m.LoadLock()
	if err != nil {
		return fmt.Errorf("uninstall: %v", err)
	}
	if len(lf.Files) == 0 {
		fmt.Println("No installed templates.")
		return nil
	}

	for _, f := range lf.Files {
		name := f.Name

		// Remove the lockfile entry
		if _, err := m.Remove(name); err != nil {
			fmt.Printf("%suninstall: '%s': %v%s\n", color.Red, name, err, color.Reset)
			continue
		}

		// Remove the file from disk
		filePath := filepath.Join(customPath, filepath.FromSlash(name))
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			fmt.Printf("%suninstall: '%s': %v%s\n", color.Red, name, err, color.Reset)
			continue
		}

		fmt.Printf("%sUninstalled template '%s'%s\n", color.Green, name, color.Reset)
	}
	return nil
}
