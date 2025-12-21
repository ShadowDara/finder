package search

// Prüft, ob ein Verzeichnis mit dem Template übereinstimmt
import (
	"io/fs"
	"os"
	"path"
	"path/filepath"

	"github.com/shadowdara/finder/structure"
)

func matchFolderTemplate(dirPath string, template structure.Folder) bool {
	// Ordnername prüfen
	dirName := filepath.Base(dirPath)

	if template.Name != "" {
		ok, err := path.Match(template.Name, dirName)
		if err != nil || !ok {
			return false
		}
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return false
	}

	// Maps für schnellen Zugriff
	filesMap := map[string]bool{}
	dirsMap := map[string]bool{}

	for _, e := range entries {
		if e.IsDir() {
			dirsMap[e.Name()] = true
		} else {
			filesMap[e.Name()] = true
		}
	}

	// Dateien prüfen (mit Wildcards)
	for _, pattern := range template.Files {
		if !matchAny(filesMap, pattern) {
			return false
		}
	}

	// Ordner prüfen (mit Wildcards)
	for _, folder := range template.Folders {
		pattern := folder.Name
		if !matchAny(dirsMap, pattern) {
			return false
		}
	}

	return true
}

// Prüft, ob mind. ein Eintrag zur Wildcard passt
func matchAny(entries map[string]bool, pattern string) bool {
	// Exakte Übereinstimmung
	if entries[pattern] {
		return true
	}

	// Wildcard-Match
	for name := range entries {
		ok, _ := path.Match(pattern, name)
		if ok {
			return true
		}
	}

	return false
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
