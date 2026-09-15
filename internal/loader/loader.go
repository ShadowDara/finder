// Package loader stellt einfache Datei-Ladefunktionen bereit.
//
// Historisch enthielt es auch die Logik zum Laden benutzerdefinierter
// Templates aus dem OS-spezifischen Konfigurationsverzeichnis — dieser
// Teil wurde entfernt bzw. auskommentiert (siehe customloader.go).
package loader

import (
	"os"
)

// LoadFile liest die Datei am angegebenen Pfad und gibt ihren Inhalt als
// String zurück. Bei Lesefehlern wird ein nicht-nil-Fehler geliefert.
func LoadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
