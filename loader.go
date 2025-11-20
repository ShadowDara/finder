// JSON Loader for the program

package main

import (
	"embed"
)

//go:embed default/*.json5
var templates embed.FS

// Returns the JSON Data when found and a Boolean for worked or not
// as the 2nd Return Value
func JSONtemplateLoader(name string) ([]byte, error) {
	// Dateiname zusammenbauen
	path := "default/" + name + ".json5"

	// Datei aus FS lesen
	data, err := templates.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Return
	return data, nil
}
