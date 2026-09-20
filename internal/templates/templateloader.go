// Package templates provides access to the built-in JSON5 templates
// compiled into the binary using go:embed, plus support for user-defined
// templates loaded from the filesystem at runtime.
package templates

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed *.json5
var templates embed.FS

// templateExtensions lists supported template file extensions in
// descending priority order. When multiple files share the same base
// name, the first matching extension wins (jsonc > json > json5).
var templateExtensions = []string{".jsonc", ".json", ".json5"}

// extPriority maps each supported template extension to its numeric
// priority. Higher value means higher priority.
var extPriority = map[string]int{
	".jsonc": 3,
	".json":  2,
	".json5": 1,
}

// IsTemplateFile returns true if the filename ends with a recognized
// template extension (.json5, .json, or .jsonc).
func IsTemplateFile(name string) bool {
	for _, ext := range templateExtensions {
		if strings.HasSuffix(name, ext) {
			return true
		}
	}
	return false
}

// TrimTemplateExt strips a recognized template extension (.json5, .json,
// or .jsonc) from the given name. If no recognized extension is found,
// the name is returned unchanged.
func TrimTemplateExt(name string) string {
	for _, ext := range templateExtensions {
		if strings.HasSuffix(name, ext) {
			return strings.TrimSuffix(name, ext)
		}
	}
	return name
}

// templateExt returns the recognized template extension of the given
// filename, or an empty string if the file does not have one.
func templateExt(name string) string {
	for _, ext := range templateExtensions {
		if strings.HasSuffix(name, ext) {
			return ext
		}
	}
	return ""
}

// JSONtemplateLoader returns the raw file bytes for a built-in template
// referenced by name (without the .json5 extension). It returns an error
// if the template does not exist or cannot be read from the embedded FS.
func JSONtemplateLoader(name string) ([]byte, error) {
	path := name + ".json5"
	data, err := templates.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return data, nil
}

// getAvailableDrives returns a list of available drive letters on Windows.
// On non-Windows systems, returns an empty list.
func getAvailableDrives() []string {
	if runtime.GOOS != "windows" {
		return []string{}
	}

	var drives []string
	// Check drives A-Z
	for i := 'A'; i <= 'Z'; i++ {
		drive := string(i) + ":"
		if _, err := os.Stat(drive); err == nil {
			drives = append(drives, drive)
		}
	}
	return drives
}

func GetCustomPath() (string, error) {
	// Try to load from home directory
	homeDir, err := os.UserHomeDir()
	if err == nil {
		return filepath.Join(homeDir, ".finder"), nil
	}
	return "nil", err
}

func GetCustomTemplatePath() (string, error) {
	// Try to load from home directory
	homeDir, err := os.UserHomeDir()
	if err == nil {
		return filepath.Join(homeDir, ".finder", "templates"), nil
	}
	return "nil", err
}

// GetInstalledTemplatePath returns the directory where templates
// installed via `finder install` are stored:
// ~/.finder/installed/templates/
func GetInstalledTemplatePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err == nil {
		return filepath.Join(homeDir, ".finder", "installed", "templates"), nil
	}
	return "nil", err
}

// LoadInstalledTemplates loads templates that were installed via
// `finder install` from ~/.finder/installed/templates/ (and the
// local ./.finder/installed/templates/). The map keys are the
// relative sub-path names without the file extension.
func LoadInstalledTemplates() (map[string][]byte, error) {
	installed := make(map[string][]byte)

	homeInstalled, err := GetInstalledTemplatePath()
	if err == nil {
		if err := loadTemplatesFromDir(homeInstalled, installed); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: could not read installed templates from %s: %v\n", homeInstalled, err)
		}
	}

	// Local project dir
	if err := loadTemplatesFromDir(".finder/installed/templates", installed); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not read installed templates from .finder/installed/templates: %v\n", err)
	}

	return installed, nil
}

// LoadUserTemplates loads CUSTOM templates from user directories and returns
// a map of template names to their raw bytes. Templates installed via
// `finder install` (in ~/.finder/installed/templates/) are NOT included
// here — use LoadInstalledTemplates() for those. User templates can be
// placed in:
//   - ~/.finder/templates/
//   - ./.finder/templates/ (current directory)
//   - X:\.finder\templates/ (on Windows, for each available drive X:)
//
// Returns empty map if no user templates found (not an error).
func LoadUserTemplates() (map[string][]byte, error) {
	userTemplates := make(map[string][]byte)

	homePath, err := GetCustomTemplatePath()
	if err == nil {
		if err := loadTemplatesFromDir(homePath, userTemplates); err != nil {
			fmt.Fprintf(os.Stderr, "Warning: could not read user templates from %s: %v\n", homePath, err)
		}
	}

	// Try to load from current directory (.finder/templates/)
	if err := loadTemplatesFromDir(".finder/templates", userTemplates); err != nil {
		// Log but don't fail if local dir can't be read
		fmt.Fprintf(os.Stderr, "Warning: could not read user templates from .finder/templates: %v\n", err)
	}

	// On Windows, also search on all available drives for .finder/templates/
	if runtime.GOOS == "windows" {
		drives := getAvailableDrives()
		for _, drive := range drives {
			drivePath := filepath.Join(drive, ".finder", "templates")
			if err := loadTemplatesFromDir(drivePath, userTemplates); err != nil {
				// Log but don't fail - directory might not exist
				// Only log if it's not a "not found" error to reduce noise
				if !os.IsNotExist(err) {
					fmt.Fprintf(os.Stderr, "Warning: could not read user templates from %s: %v\n", drivePath, err)
				}
			}
		}
	}

	return userTemplates, nil
}

// loadTemplatesFromDir scans a directory for template files (.json5, .json,
// or .jsonc) and loads them into the provided map, recursively descending
// into subdirectories. Template names are stored relative to the scanned
// root with forward slashes and without the file extension, so templates
// installed under sub-paths (e.g. via `finder install`) become addressable
// names like "host/path/template". The map keys use the exact name under
// which they were stored. Directories named "node_modules", ".git" and
// ".finder" are skipped. Silently returns if directory doesn't exist.
// When the same base name exists with multiple extensions, the highest
// priority extension wins (jsonc > json > json5).
func loadTemplatesFromDir(dirPath string, templates map[string][]byte) error {
	extTracker := make(map[string]string)
	return loadTemplatesFromDirRoot(dirPath, dirPath, templates, extTracker)
}

// loadTemplatesFromDirRoot is the recursive implementation.
// rootDir is the top-level directory from which relative names are computed;
// dirPath is the directory currently being scanned.
// extTracker maps template base names to the extension that was used to
// store them, so that higher-priority extensions can override lower ones.
func loadTemplatesFromDirRoot(dirPath, rootDir string, templates map[string][]byte, extTracker map[string]string) error {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		// Directory doesn't exist or can't be read - but this is not necessarily an error
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, entry := range entries {
		relPath := filepath.Join(dirPath, entry.Name())

		if entry.IsDir() {
			// Skip hidden/irrelevant dirs
			switch entry.Name() {
			case "node_modules", ".git", ".finder":
				continue
			}
			if err := loadTemplatesFromDirRoot(relPath, rootDir, templates, extTracker); err != nil {
				fmt.Fprintf(os.Stderr, "Warning: could not read user templates from %s: %v\n", relPath, err)
			}
			continue
		}

		name := entry.Name()
		ext := templateExt(name)
		if ext == "" {
			continue
		}

		// Read the file
		filePath := relPath
		data, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Warning: could not read template %s: %v\n", filePath, err)
			continue
		}

		// Store with name relative to the ROOT directory, without the file
		// extension. Use forward slashes so the name is portable.
		rel, err := filepath.Rel(rootDir, filePath)
		if err != nil {
			rel = name
		}
		rel = filepath.ToSlash(rel)
		rel = strings.TrimPrefix(rel, "/")

		templateName := strings.TrimSuffix(rel, ext)

		// Only keep this file if its extension has higher priority than
		// what was previously stored for the same base name.
		if existingExt, ok := extTracker[templateName]; ok {
			if extPriority[ext] <= extPriority[existingExt] {
				continue
			}
		}
		extTracker[templateName] = ext
		templates[templateName] = data
	}

	return nil
}

// JSONtemplateLoaderWithUserTemplates attempts to load a template, checking
// user-defined templates first, then falling back to built-in templates.
// This allows user templates to override built-in ones.
func JSONtemplateLoaderWithUserTemplates(name string, userTemplates map[string][]byte) ([]byte, error) {
	// Check user templates first
	if data, exists := userTemplates[name]; exists {
		return data, nil
	}

	// Fall back to built-in templates
	return JSONtemplateLoader(name)
}

// LoadAll returns the list of available template names (without the file
// suffix), including both built-in and custom templates. User templates are
// appended after built-in templates. The function ignores directories in the
// embed FS and filesystem directories.
func LoadAll() ([]string, error) {
	var fileNames []string

	// Load built-in templates
	files, err := templates.ReadDir(".")
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if !file.IsDir() {
			name := file.Name()
			if IsTemplateFile(name) {
				fileNames = append(fileNames, TrimTemplateExt(name))
			}
		}
	}

	// Load user templates
	userTemplates, err := LoadUserTemplates()
	if err == nil {
		// Add user template names (avoid duplicates with built-ins)
		builtInSet := make(map[string]bool)
		for _, name := range fileNames {
			builtInSet[name] = true
		}

		for name := range userTemplates {
			if !builtInSet[name] {
				fileNames = append(fileNames, name)
				builtInSet[name] = true
			}
		}
	}

	// Load installed templates (from `finder install`)
	installed, err := LoadInstalledTemplates()
	if err == nil {
		seen := make(map[string]bool, len(fileNames))
		for _, name := range fileNames {
			seen[name] = true
		}
		for name := range installed {
			if !seen[name] {
				fileNames = append(fileNames, name)
				seen[name] = true
			}
		}
	}

	return fileNames, nil
}

// LoadAllWithUserTemplates returns both the list of template names and a map
// of user-defined templates. This is more efficient than calling LoadAll() and
// LoadUserTemplates() separately. The returned map includes installed
// templates (from ~/.finder/installed/templates/) so that they can be found
// by name during a search.
func LoadAllWithUserTemplates() ([]string, map[string][]byte, error) {
	userTemplates, err := LoadUserTemplates()
	if err != nil {
		// Not a fatal error, just log and continue
		fmt.Fprintf(os.Stderr, "Warning: could not load user templates: %v\n", err)
	}
	if userTemplates == nil {
		userTemplates = make(map[string][]byte)
	}

	// Include installed templates so searches can find them
	installed, err := LoadInstalledTemplates()
	if err == nil {
		for name, data := range installed {
			userTemplates[name] = data
		}
	}

	names, err := LoadAll()
	if err != nil {
		return nil, nil, err
	}

	return names, userTemplates, nil
}
