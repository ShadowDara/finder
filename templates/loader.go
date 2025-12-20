// JSON Loader for the program

package templates

import (
	"embed"
)

//go:embed *.json5
var templates embed.FS

// Returns the JSON Data when found and a Boolean for worked or not
// as the 2nd Return Value
func JSONtemplateLoader(name string) ([]byte, error) {
	// Dateiname zusammenbauen
	path := name + ".json5"

	// Datei aus FS lesen
	data, err := templates.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Return
	return data, nil
}

// Function returns all file names
func LoadAll() ([]string, error) {
	// Read all files in the embed FS
	files, err := templates.ReadDir(".")
	if err != nil {
		return nil, err
	}

	var fileNames []string
	for _, file := range files {
		// Only include regular files (ignore directories)
		if !file.IsDir() {
			name := file.Name()
			// Remove ".json5" extension
			if len(name) > 6 && name[len(name)-6:] == ".json5" {
				fileNames = append(fileNames, name[:len(name)-6])
			}
		}
	}

	return fileNames, nil
}
