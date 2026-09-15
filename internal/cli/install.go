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

// UserLockPath liefert den Pfad zur Lockfile im UserRoot.
func UserLockPath() (string, error) {
	path, err := templates.GetCustomPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(path, "filepkg.lock.json"), nil
}

// installPathForURL bildet den relativen Zielpfad unterhalb von
// ~/.finder/templates/ aus einer URL ab. Aus
//
//	https://shadowdara.github.io/test/template.json5
//
// wird
//
//	shadowdara.github.io/test/template.json5
//
// damit der Name dem Pfad entspricht und `finder` ihn über genau
// diesen Pfad wiederfindet und aufrufbar ist. Ein Port im Host wird
// durch einen Unterstrich ersetzt (Windows erlaubt kein ':' im
// Dateinamen):
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
	// Windows-kompatibel machen: ':' ist im Dateinamen verboten.
	name = strings.ReplaceAll(name, ":", "_")
	return name, nil
}

// normalizeSourceURL ergänzt eine fehlende http(s)-Kennung und
// liefert die volle, verwendbare URL zurück.
func normalizeSourceURL(rawURL string) string {
	trimmed := strings.TrimSpace(rawURL)
	if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
		return "http://" + trimmed
	}
	return trimmed
}

// Install lädt ein Template per URL (oder Namen aus der Built-in
// Registry) über die filepkg-Library in ~/.finder/templates/ ab.
// Der Zielname entspricht der URL (Host + Pfad), sodass das
// installierte Template später über genau diesen Namen aufrufbar ist.
func Install(installTemplate string) error {
	installTemplate = strings.TrimSpace(installTemplate)
	if installTemplate == "" {
		return fmt.Errorf("install: kein Template-Name oder keine URL angegeben")
	}

	// Bestimme Quelle + Zielname
	sourceURL := installTemplate
	relName := templates.TrimTemplateExt(installTemplate)
	looksLikeURL := strings.Contains(relName, "/") || strings.Contains(relName, ".")

	if !looksLikeURL {
		// Kein Pfad / keine URL → Built-in Registry-Name
		sourceURL = fmt.Sprintf("https://raw.githubusercontent.com/shadowdara/finder/main/templates/%s.json5", relName)
		relName = "shadowdara.github.io/registry/" + relName
	} else {
		// Echte URL (auch ohne http://) → Zielname = Host + Pfad
		name, err := installPathForURL(normalizeSourceURL(installTemplate))
		if err != nil {
			return fmt.Errorf("install: %v", err)
		}
		relName = name
	}

	// Quelle normalisieren: immer volle http(s)-URL für die Lockfile
	sourceURL = normalizeSourceURL(sourceURL)

	// WICHTIG: Der Zielname darf NIE auf eine Template-Extension enden —
	// er wird später mit + ".json5" als Dateiname verwendet.
	// installPathForURL liefert ggf. den Pfad inkl. Extension (aus der URL),
	// daher hier bereinigen.
	relName = templates.TrimTemplateExt(relName)

	// Zielverzeichnis: ~/.finder/installed/templates/
	customPath, err := templates.GetInstalledTemplatePath()
	if err != nil {
		return fmt.Errorf("install: Home-Pfad nicht ermittelbar: %v", err)
	}

	// Lockfile: ~/.finder/filepkg.lock.json (Ordner muss existieren!)
	lockPath, err := UserLockPath()
	if err != nil {
		return fmt.Errorf("install: Lockfile-Pfad nicht ermittelbar: %v", err)
	}

	// Ordner sicherstellen (Lockfile liegt in ~/.finder/)
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o755); err != nil {
		return fmt.Errorf("install: Ordner %s anlegen: %v", filepath.Dir(lockPath), err)
	}

	// filepkg-Manager: Dateien landen als Unterpfade in installed/templates/,
	// die Lockfile liegt im .finder/ Root.
	m := filepkg.New(customPath, lockPath)
	m.Client = filepkg.DefaultClient()

	// Existiert die Datei schon (gleicher relName)? Dann überspringen.
	if exists, _ := m.IsLocked(relName + ".json5"); exists || fileExists(filepath.Join(customPath, filepath.FromSlash(relName)+".json5")) {
		fmt.Printf("%sTemplate '%s' ist bereits installiert.%s\n", color.Yellow, relName, color.Reset)
		return nil
	}

	// Herunterladen + in Lockfile nachverfolgen (filepkg berechnet
	// den SHA-256-Hash und speichert ihn).
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

// InstallAll installiert alle Templates aus der Lockfile
// (~/.finder/filepkg.lock.json) in das installierte
// Template-Verzeichnis. Templates, deren Server nicht erreichbar ist
// (oder die aus anderen Gründen nicht geladen werden können), werden
// übersprungen — der Rest wird trotzdem installiert.
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

		// Bereits auf der Platte vorhanden → überspringen.
		if fileExists(filepath.Join(customPath, filepath.FromSlash(name))) {
			fmt.Printf("%sTemplate '%s' ist bereits installiert.%s\n", color.Yellow, name, color.Reset)
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		if _, err := m.Pull(ctx, name); err != nil {
			cancel()
			// Server nicht erreichbar o.ä. → überspringen und weitermachen.
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

// fileExists prüft, ob eine Datei existiert.
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// ListInstalled zeigt alle installierten Templates aus
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

// Uninstall entfernt ein Template (per Name oder URL) aus
// ~/.finder/installed/templates/ (inkl. Lockfile-Eintrag).
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

	// Lockfile-Eintrag entfernen
	removed, _ := m.Remove(relName + ".json5")

	// Datei auf der Platte entfernen
	filePath := filepath.Join(customPath, filepath.FromSlash(relName)+".json5")
	osErr := os.Remove(filePath)

	if !removed && osErr != nil {
		return fmt.Errorf("uninstall: Template '%s' ist kein benutzerdefiniertes Template", relName)
	}

	fmt.Printf("%sUninstalled template '%s'%s\n", color.Green, relName, color.Reset)
	return nil
}

// UninstallAll entfernt ALLE installierten Templates aus
// ~/.finder/installed/templates/ — inklusive Lockfile-Einträgen.
// Ist nichts installiert, wird das gemeldet, ohne Fehler.
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

		// Lockfile-Eintrag entfernen
		if _, err := m.Remove(name); err != nil {
			fmt.Printf("%suninstall: '%s': %v%s\n", color.Red, name, err, color.Reset)
			continue
		}

		// Datei auf der Platte entfernen
		filePath := filepath.Join(customPath, filepath.FromSlash(name))
		if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
			fmt.Printf("%suninstall: '%s': %v%s\n", color.Red, name, err, color.Reset)
			continue
		}

		fmt.Printf("%sUninstalled template '%s'%s\n", color.Green, name, color.Reset)
	}
	return nil
}
