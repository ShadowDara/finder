// Package structure definiert die Folder-Template-Datenstruktur, mit der
// beschrieben wird, welche Dateien und Unterordner in einem passenden
// Verzeichnis vorhanden sein müssen. Diese Strukturen sind direkt das
// JSON5-Schema der Template-Dateien (templates/*.json5).
package structure

import (
	"encoding/json"
	"log"

	"github.com/shadowdara/finder/pub/json5"
)

// Folder repräsentiert die JSON-Struktur eines Verzeichnis-Templates.
// Alle Felder sind exportiert und mit JSON-Tags versehen, damit
// encoding/json die Daten nach dem JSON5-Preprocessing dekodieren kann.
//
// Matching behavior (see also internal/search/helper.go):
//   - Name:      Ordner-Namensmuster (exakt oder Glob) — wie vor Regex
//   - NameRegex: optionales Regex-Muster für den Ordnernamen
//   - Files:     Pflicht-, verbotene oder optionale Dateien
//   - Folders:   benötigte Unterordner (rekursiv verschachtelbar)
//   - Command/InvertCommand: optionale Shell-Prüfung nach dem Match
//   - Size:      Gesamtgrößen-Beschränkung des Ordners
//   - Checksums: exakte Hash-Übereinstimmung für Dateien
//
// Die übrigen Felder (MinVersion, Description, Tags, mdnote, author,
// authors) sind nur für Anzeige/Filterung relevant und fließen nicht
// in die Match-Entscheidung ein.
type Folder struct {
	// Used to detect templates requiring an older Finder version and warn the user
	MinVersion    string   `json:"min_version,omitempty"`
	Description   string   `json:"description"`
	Name          string   `json:"name"`
	NameRegex     string   `json:"name_regex,omitempty"`
	Folders       []Folder `json:"folders"`
	Files         Files    `json:"files"`          // Nur der Dateiname (plus optionale Constraints)
	Command       string   `json:"command"`        // Optionales Kommando zur Nachprüfung nach dem Fund
	InvertCommand bool     `json:"invert_command"` // true → Kommando muss fehlschlagen (Exit != 0)
	Tags          []string `json:"tags"`           // Tags zum Sortieren/Finden der Templates
	DataSize      Size     `json:"size,omitempty"`
	// Optionaler Markdown-Hinweis. Gespeichert als einzeiliger String
	// (Whitespace inkl. Zeilenumbrüche wird zu einfachen Leerzeichen
	// reduziert), damit beliebiger Inhalt die reine JSON-Serialisierung
	// übersteht. Angezeigt z.B. in der Web-UI / dem Community-Hub.
	MarkdownNote string   `json:"mdnote,omitempty"`
	Author       string   `json:"author,omitempty"`
	Authors      []string `json:"authors,omitempty"`
}

// NewFolder erzeugt eine minimale Folder-Instanz mit sinnvollen
// Standardwerten (leere Listen, keine Constraints, Version "0.0.0").
func NewFolder(foldername string) Folder {
	return Folder{
		MinVersion:    "0.0.0",
		Description:   "",
		Name:          foldername,
		NameRegex:     "",
		Folders:       []Folder{},
		Files:         Files{},
		Command:       "",
		InvertCommand: false,
		Tags:          []string{},
		DataSize:      NewSize(),
		MarkdownNote:  "",
		Author:        "",
		Authors:       []string{},
	}
}

// LoadJSON5 akzeptiert einen JSON5-ähnlichen String, führt einen
// leichten Vorverarbeitungsschritt aus (json5.PreprocessJSON5) und
// unmarshalled das Ergebnis in eine Folder-Struktur.
//
// WICHTIG: Bei nicht behebbaren Parse-Fehlern beendet die Funktion das
// Programm mit Exit-Code != 0 (log.Fatalf) — das spiegelt das
// ursprüngliche Projektverhalten wider und hält die CLI-Ausgabe einfach.
// Für „weiche” Validierung (z.B. `finder check`/`finder validate`)
// wird stattdessen direkt json.Unmarshal verwendet (siehe internal/cli).
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
