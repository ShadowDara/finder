// Package templates provides access to the built-in JSON5 templates
// compiled into the binary using go:embed.
package templates

import (
	"embed"
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

// LoadAll returns the list of available built-in template names (without
// the .json5 suffix). The function ignores directories in the embed FS.
func LoadAll() ([]string, error) {
	files, err := templates.ReadDir(".")
	if err != nil {
		return nil, err
	}

	var fileNames []string
	for _, file := range files {
		if !file.IsDir() {
			name := file.Name()
			if len(name) > 6 && name[len(name)-6:] == ".json5" {
				fileNames = append(fileNames, name[:len(name)-6])
			}
		}
	}

	return fileNames, nil
}
