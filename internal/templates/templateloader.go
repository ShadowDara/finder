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

// LoadUserTemplates loads custom templates from user directories and returns
// a map of template names to their raw bytes. User templates can be placed in:
//   - ~/.finder/templates/
//   - ./.finder/templates/ (current directory)
//   - X:\.finder\templates/ (on Windows, for each available drive X:)
// Returns empty map if no user templates found (not an error).
func LoadUserTemplates() (map[string][]byte, error) {
	userTemplates := make(map[string][]byte)

	// Try to load from home directory
	homeDir, err := os.UserHomeDir()
	if err == nil {
		homePath := filepath.Join(homeDir, ".finder", "templates")
		if err := loadTemplatesFromDir(homePath, userTemplates); err != nil {
			// Log but don't fail if home dir can't be read
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

// loadTemplatesFromDir scans a directory for .json5 files and loads them into
// the provided map. Silently returns if directory doesn't exist.
func loadTemplatesFromDir(dirPath string, templates map[string][]byte) error {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		// Directory doesn't exist or can't be read - but this is not necessarily an error
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		if !strings.HasSuffix(name, ".json5") {
			continue
		}

		// Read the file
		filePath := filepath.Join(dirPath, name)
		data, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Warning: could not read template %s: %v\n", filePath, err)
			continue
		}

		// Store with name without .json5 extension
		templateName := name[:len(name)-6]
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

// LoadAll returns the list of available template names (without the .json5
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
			if len(name) > 6 && name[len(name)-6:] == ".json5" {
				fileNames = append(fileNames, name[:len(name)-6])
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
			}
		}
	}

	return fileNames, nil
}

// LoadAllWithUserTemplates returns both the list of template names and a map
// of user-defined templates. This is more efficient than calling LoadAll() and
// LoadUserTemplates() separately.
func LoadAllWithUserTemplates() ([]string, map[string][]byte, error) {
	userTemplates, err := LoadUserTemplates()
	if err != nil {
		// Not a fatal error, just log and continue
		fmt.Fprintf(os.Stderr, "Warning: could not load user templates: %v\n", err)
	}

	names, err := LoadAll()
	if err != nil {
		return nil, nil, err
	}

	return names, userTemplates, nil
}
