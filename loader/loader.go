package loader

import (
	"os"
)

// LoadFile liest eine Datei vollständig ein und gibt den Inhalt als String zurück.
func LoadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
