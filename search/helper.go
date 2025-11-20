package search

import (
	"io/fs"
	"os"
	"path/filepath"

	"github.com/shadowdara/finder/structure"
)

// Prüft, ob ein Verzeichnis mit dem Template übereinstimmt
func matchFolderTemplate(path string, template structure.Folder) bool {
	entries, err := os.ReadDir(path)
	if err != nil {
		return false
	}

	// Dateien prüfen
	filesMap := map[string]bool{}
	dirsMap := map[string]bool{}
	for _, e := range entries {
		if e.IsDir() {
			dirsMap[e.Name()] = true
		} else {
			filesMap[e.Name()] = true
		}
	}

	// Dateien prüfen
	for _, f := range template.Files {
		if !filesMap[f] {
			return false
		}
	}

	// Unterordner prüfen
	for _, folder := range template.Folders {
		// Wildcard für Unterordnername
		if folder.Name != "*" && !dirsMap[folder.Name] {
			return false
		}
	}

	return true
}

func findMatchingFolders(root string, template structure.Folder) []string {
	var matches []string

	filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			return nil
		}

		if matchFolderTemplate(path, template) {
			matches = append(matches, path)
		}
		return nil
	})

	return matches
}
