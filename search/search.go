package search

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/shadowdara/finder/structure"
)

// getRootPath returns the search root depending on the operating system.
// On Windows it returns the root of the current drive (C:\), on Unix-like
// systems it returns "/". This helper centralizes platform-specific
// behaviour used by the search routines.
func getRootPath() string {
	if runtime.GOOS == "windows" {
		return "C:\\"
	}
	return "/"
}

// Find searches the filesystem for directories that match the provided
// Folder template. Results are printed to stdout according to rttype:
// - "normal": human readable output with header and footer
// - "json": a JSON array is emitted to stdout
// - "clear": only paths are printed (useful for scripting)
func Find(folderstruct structure.Folder, rttype string) {
	if rttype != "clear" {
		fmt.Printf("Description: %s\n", folderstruct.Description)
	}

	matches := findMatchingFolders(getRootPath(), folderstruct)

	// Normalize Windows backslashes to forward slashes for consistent output
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
		if err := enc.Encode(matches); err != nil {
			fmt.Println("JSON encoding error:", err)
		}
	case "clear":
		for _, m := range matches {
			fmt.Println(m)
		}
	}
}
