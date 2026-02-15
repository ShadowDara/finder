package search

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/shadowdara/finder/internal/structure"
)

// getSearchRoots returns the search roots depending on the operating system.
// On Windows it returns all available drive letters (C:\, D:\, etc.),
// on Unix-like systems it returns "/". This helper centralizes platform-specific
// behaviour used by the search routines.
func getSearchRoots() []string {
	if runtime.GOOS == "windows" {
		var roots []string
		// Check all possible drive letters from A: to Z:
		for letter := 'A'; letter <= 'Z'; letter++ {
			drive := string(letter) + ":\\"
			if _, err := os.Stat(drive); err == nil {
				roots = append(roots, drive)
			}
		}
		return roots
	}
	return []string{"/"}
}

// Find searches the filesystem for directories that match the
// provided
// Folder template. Results are printed to stdout according
// to output_type:
// - "normal": human readable output with header and footer
// - "json": a JSON array is emitted to stdout
// - "clear": only paths are printed (useful for scripting)
//
// Search is performed asynchronously across all available drives/roots
// for improved performance, especially with multiple drives.
func Find(folderstruct structure.Folder, output_type string) {
	if output_type != "clear" {
		fmt.Printf("Description: %s\n", folderstruct.Description)
	}

	roots := getSearchRoots()

	// Use a channel to collect results from goroutines
	resultsChan := make(chan []string)
	var wg sync.WaitGroup

	// Start a goroutine for each search root
	for _, root := range roots {
		wg.Add(1)
		go func(searchRoot string) {
			defer wg.Done()
			// Search this root and send results back through the channel
			matches := findMatchingFolders(searchRoot, folderstruct)
			if len(matches) > 0 {
				resultsChan <- matches
			}
		}(root)
	}

	// Wait for all goroutines to complete in a separate goroutine,
	// then close the channel so the loop below will exit
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect all results from the channel
	var matches []string
	for results := range resultsChan {
		matches = append(matches, results...)
	}

	// Normalize Windows backslashes to forward slashes for consistent output
	for i, m := range matches {
		matches[i] = filepath.ToSlash(m)
	}

	switch output_type {
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
