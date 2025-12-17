package structure

// File for Code for the Datastructures

import (
	"log"

	"encoding/json"

	"github.com/shadowdara/finder/loader/json5"
)

// Type for a Folder
type Folder struct {
	Description string   `json:"description"`
	Name        string   `json:"name"`
	Folders     []Folder `json:"folders"`
	Files       []string `json:"files"` // Only the filename for now
}

// Constructor function with default values
func NewFolder(foldername string) Folder {
	return Folder{
		Description: "",
		Name:        foldername, // default name
		Folders:     []Folder{}, // empty list of subfolders
		Files:       []string{}, // empty list of files
	}
}

// Funktion to load a JSON5 File
func LoadJSON5(data string) Folder {
	var f Folder

	// Vorverarbeitung der JSON5-Daten (Optional)
	// Falls du zusätzliche Logik zur Normalisierung von JSON5-Daten brauchst (z.B. für Wildcards oder Fehlerbehandlung)
	normalizedData := json5.PreprocessJSON5(data)

	// Unmarshal JSON5 mit dem `finder/json5` Modul
	err := json.Unmarshal([]byte(normalizedData), &f)
	if err != nil {
		log.Fatalf("Error while parsing JSON5: %v", err)
	}
	return f
}
