package search

import (
	"fmt"

	"github.com/shadowdara/finder/structure"

	"runtime"
)

// GetRootPath gibt das Root-Verzeichnis je nach OS zurück
func getRootPath() string {
	if runtime.GOOS == "windows" {
		return "C:\\" // Windows root
	}
	return "/" // Linux/macOS root
}

func Find(folderstruct structure.Folder) {
	matches := findMatchingFolders(getRootPath(), folderstruct)
	for _, m := range matches {
		fmt.Println("Found:", m)
	}
}
