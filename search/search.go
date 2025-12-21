package search

import (
	"fmt"
	"os"

	"path/filepath"

	"github.com/shadowdara/finder/structure"

	"encoding/json"
	"runtime"
)

// GetRootPath gibt das Root-Verzeichnis je nach OS zurück
func getRootPath() string {
	if runtime.GOOS == "windows" {
		return "C:\\" // Windows root
	}
	return "/" // Linux/macOS root
}

func Find(folderstruct structure.Folder, rttype string) {
	// fmt.Printf("Searching for %s...\n", folderstruct.Name)
	if rttype != "clear" {
		fmt.Printf("Description: %s\n", folderstruct.Description)
	}

	matches := findMatchingFolders(getRootPath(), folderstruct)

	// Pfade Windows-sicher machen
	// Change \\ to /
	for i, m := range matches {
		matches[i] = filepath.ToSlash(m)
	}

	switch rttype {
	case "normal":
		fmt.Println("# Found:")
		for _, m := range matches {
			fmt.Println(m)
		}
		fmt.Println("# End of the List")

	case "json":
		enc := json.NewEncoder(os.Stdout)
		// enc.SetIndent("", "  ") // optional pretty print
		if err := enc.Encode(matches); err != nil {
			fmt.Println("JSON encoding error:", err)
		}

	case "clear":
		for _, m := range matches {
			fmt.Println(m)
		}
	}
}
