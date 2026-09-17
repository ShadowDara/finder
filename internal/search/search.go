package search

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	"github.com/shadowdara/finder/internal/cache"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/structure"
	"github.com/shadowdara/finder/pub/goansi"
	"github.com/shadowdara/finder/pub/version"
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

// Find searches the filesystem for directories that match the given
// Folder template.
//
// Result format (output_type):
//   - "normal": human-readable output with header/footer and statistics
//   - "json":   a JSON array (produced by the caller)
//   - "clear":  only the paths (ideal for shell pipelines)
//
// The search runs asynchronously: a goroutine is started for each root
// and results are collected via a channel, so every drive is scanned in
// parallel.
//
// Parameters:
//   - folderstruct: the loaded template to search for
//   - output_type:  output format ("normal", "json", "clear")
//   - name:         template name (for cache and status messages)
//   - doCache:      whether the results should be saved as cache
func Find(folderstruct structure.Folder, output_type string, name string, doCache bool) []string {
	// Header with description (not for machine output)
	if output_type != "clear" && output_type != "json" {
		fmt.Printf("Description: %s\n", folderstruct.Description)

		// Warning if the template is newer than the installed version
		if /*folderstruct.MinVersion != "0.0.0" && */ version.IsNewer(folderstruct.MinVersion, finderversion.Version) {
			fmt.Printf("%s[WARNING] Your Version of finder is maybe to old for this Template! Something could go wrong!%s\n", goansi.YELLOW, goansi.END)
		}
	}

	// Remember the start time for the duration statistic
	start := time.Now()

	// Precompile all regex patterns of the template once so the parallel
	// scan goroutines do not pay the compile cost on every call.
	precompilePatterns(folderstruct)

	roots := getSearchRoots()

	// Channel used to collect results from the goroutines
	resultsChan := make(chan []string)
	var wg sync.WaitGroup

	// Start a goroutine for each search root
	for _, root := range roots {
		wg.Add(1)
		go func(searchRoot string) {
			defer wg.Done()
			// Search this root and send hits through the channel
			matches := findMatchingFolders(searchRoot, folderstruct)
			if len(matches) > 0 {
				resultsChan <- matches
			}
		}(root)
	}

	// Wait for all scans in a separate goroutine, then close the
	// channel so the collection loop below ends.
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect all results from the channel
	matches := []string{}
	for results := range resultsChan {
		matches = append(matches, results...)
	}

	// Normalize Windows backslashes to forward slashes so the
	// output is consistent on all platforms
	for i, m := range matches {
		matches[i] = filepath.ToSlash(m)
	}

	// Calculate elapsed time and print statistics
	elapsed := time.Since(start).Seconds()
	if output_type != "clear" && output_type != "json" {
		fmt.Printf("Search by finder took: %.4f seconds\n", elapsed)
		fmt.Printf("Found: %.d Results\n", len(matches))
	}

	// Optional: store search results in the cache ("--create-cache")
	if doCache {
		cache.SaveCache(name, matches)

		if output_type != "clear" && output_type != "json" {
			fmt.Printf("Wrote Cache for template %s\n", name)
		}
	}

	return matches
}
