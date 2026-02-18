package structure

// Package structure defines the Folder template data-structure used to
// describe the files and subfolders that should be present in a match.

import (
	"encoding/json"
	"log"

	"github.com/shadowdara/finder/internal/loader/json5"
)

// Folder represents the JSON structure used to describe a directory
// template. Fields are exported and annotated so encoding/json can
// decode them after the lightweight JSON5 preprocessing step.
type Folder struct {
	Description   string   `json:"description"`
	Name          string   `json:"name"`
	Folders       []Folder `json:"folders"`
	Files         Files    `json:"files"`        // Only the filename for now
	Command       string   `json:"command"`      // Optional command to execute after finding directory
	InvertCommand bool     `json:invert_command` // To change if return code 0 or 1 is required. False is equal to 0
	Tags          []string `json:tags`           // tags to sort the Templates
}

// NewFolder constructs a minimal Folder instance with reasonable defaults.
func NewFolder(foldername string) Folder {
	return Folder{
		Description:   "",
		Name:          foldername,
		Folders:       []Folder{},
		Files:         Files{},
		Command:       "",
		InvertCommand: false,
		Tags:          []string{},
	}
}

// LoadJSON5 accepts a JSON5-like string, runs a lightweight
// preprocessing step and unmarshals the result into a Folder. On
// unrecoverable parse errors the function exits the program with a
// non-zero status via log.Fatalf — this mirrors the original project
// behaviour and keeps the command-line UX simple.
func LoadJSON5(data string /*, filename string */) Folder {
	var f Folder

	normalizedData := json5.PreprocessJSON5(data)

	err := json.Unmarshal([]byte(normalizedData), &f)
	if err != nil {
		log.Fatalf("Error while parsing JSON5 file: %v", err)
	}

	if err := f.Files.Validate(); err != nil {
		log.Fatalf("Invalid template: %v", err)
	}

	return f
}
