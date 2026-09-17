// filestruct.go definiert das Datenmodell für die Datei-Constraints
// eines Templates (das "files"-Feld) sowie die Checksum-Prüfung.
package structure

import (
	"encoding/json"

	"fmt"
)

// The "existence" keyword supports the following values:
//
//	required  → the file MUST exist (default)
//	forbidden → the file MUST NOT exist
//	optional  → the file may exist but is not required
//	            (ignored during the match decision)

// File describes a single file requirement in the template:
// a name pattern plus optional existence, size, and hash constraints.
type File struct {
	Name      string   `json:"name"`
	NameRegex string   `json:"name_regex,omitempty"`
	Existence string   `json:"existence,omitempty"`
	DataSize  Size     `json:"size,omitempty"`
	Checksums Checksum `json:"checksums,omitempty"`
}

// Checksum holds optional SHA256/SHA512 hashes. When provided,
// an existing file must match them exactly (case-insensitive, with
// trimmed values). Empty fields mean "no check".
type Checksum struct {
	Sha256 string `json:"sha256"`
	Sha512 string `json:"sha512"`
}

// Files ist eine Liste von File-Constraints (= das "files"-Feld eines
// Templates). Es unterstützt beide Formate:
//
//	alt:  ["package.json", "README.md"]          → alles required
//	neu:  [{name: "*.go", existence: "required"}]
type Files []File

// UnmarshalJSON lässt Files beide Formate akzeptieren:
//
//  1. Zuerst wird versucht, als []string (alte Form) zu lesen — jedes
//     Element wird dabei zu einer required-File.
//  2. Schlägt das fehl, wird als []File (neue Form) gelesen.
//  3. Beides geht nicht → Fehler "invalid files format".
func (f *Files) UnmarshalJSON(data []byte) error {
	// Versuch: alte Form ([]string)
	var oldFormat []string
	if err := json.Unmarshal(data, &oldFormat); err == nil {
		for _, name := range oldFormat {
			*f = append(*f, File{
				Name:      name,
				Existence: "required",
			})
		}
		return nil
	}

	// Versuch: neue Form ([]File)
	var newFormat []File
	if err := json.Unmarshal(data, &newFormat); err == nil {
		*f = newFormat
		return nil
	}

	return fmt.Errorf("invalid files format")
}

// Validate prüft die Datei-Liste auf doppelte Einträge (gleicher Name),
// die zu einem mehrdeutigen Template führen würden.
func (f *Files) Validate() error {
	seen := make(map[string]bool)

	for _, file := range *f {
		if seen[file.Name] {
			return fmt.Errorf("duplicate file entry: %s", file.Name)
		}
		seen[file.Name] = true
	}

	return nil
}
