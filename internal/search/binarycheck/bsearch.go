// Package binarycheck stellt die "-b"-Suche bereit: Es durchsucht die
// PATH-Verzeichnisse nach ausführbaren Programmen und kann wahlweise
// alle oder nur passende (Namens-Filter) ausgeben — oder prüfen, ob ein
// bestimmtes Programm existiert.
package binarycheck

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/shadowdara/finder/pub/goansi"
)

// GetallExetuables lists all executable programs from the
// PATH directories. Optionally, a name filter can be provided
// (case-insensitive substring; on Windows additionally without
// extension and considering known executable extensions).
func GetallExetuables(filter ...string) {
	var nameFilter string
	if len(filter) > 0 {
		nameFilter = filter[0]
	}

	// PATH in Einzelverzeichnisse aufteilen (plattformkorrekt)
	pathEnv := os.Getenv("PATH")
	dirs := filepath.SplitList(pathEnv)

	fmt.Println("[finder] PATH-Verzeichnisse (normalisiert):")
	// Auskommentierte Debug-Ausgabe aller Verzeichnisse
	// for _, dir := range dirs {
	// 	cleanDir := filepath.Clean(dir)
	// 	fmt.Println("  ", cleanDir)
	// }

	// Jedes PATH-Verzeichnis nach ausführbaren Dateien durchsuchen
	for _, dir := range dirs {
		cleanDir := filepath.Clean(dir)
		entries, err := os.ReadDir(cleanDir)
		if err != nil {
			continue // Ordner evtl. nicht lesbar → überspringen
		}

		for _, entry := range entries {
			// Subdirectories are not executable files
			if entry.IsDir() {
				continue
			}

			fullPath := filepath.Join(cleanDir, entry.Name())

			// Fetch file info for executability checks
			info, err := entry.Info()
			if err != nil {
				continue
			}

			// Decide whether the entry matches the filter
			key := entry.Name()
			match := false
			if nameFilter != "" {
				// Windows: check basename without extension + all executable extensions
				if runtime.GOOS == "windows" {
					base := key
					ext := filepath.Ext(key)
					if ext != "" {
						base = key[:len(key)-len(ext)]
					}
					// Check: exact basename, substring in full name, substring in basename
					if containsIgnoreCase(key, nameFilter) || containsIgnoreCase(base, nameFilter) {
						match = true
					} else {
						// Windows-spezifisch: Wenn der Filter exakt ist, auch mit
						// angehängter Executable-Extension vergleichen
						exts := []string{".exe", ".bat", ".cmd", ".com", ".ps1"}
						for _, e := range exts {
							if base+e == nameFilter || containsIgnoreCase(base+e, nameFilter) {
								match = true
								break
							}
						}
					}
				} else {
					// Unix: simple substring comparison
					if containsIgnoreCase(key, nameFilter) {
						match = true
					}
				}
			} else {
				match = true // kein Filter → alles ausgeben
			}

			// Nur ausführbare Dateien, die zum Filter passen, ausgeben
			if isExecutable(info) && match {
				fmt.Println(fullPath)
			}
		}
	}
}

// Helper: enthält s den Substring substr (case-insensitive)?
// Leerer Substring gilt immer als enthalten.
func containsIgnoreCase(s, substr string) bool {
	return len(substr) == 0 || (len(s) > 0 && (stringContainsFold(s, substr)))
}

// stringContainsFold: case-insensitive Substring-Prüfung (Delegation an indexFold)
func stringContainsFold(s, substr string) bool {
	return len(substr) == 0 || (len(s) > 0 && (indexFold(s, substr) >= 0))
}

// indexFold sucht den ersten case-insensitiven Vorkommens-Index von substr in s.
func indexFold(s, substr string) int {
	return indexFoldHelper([]rune(s), []rune(substr))
}

// indexFoldHelper implementiert die eigentliche Substring-Suche auf Rune-Ebene.
func indexFoldHelper(s, substr []rune) int {
	n := len(substr)
	if n == 0 {
		return 0
	}
	// Fenster über s schieben und jedes Teilfenster case-insensitiv vergleichen
	for i := 0; i+n <= len(s); i++ {
		if equalFold(s[i:i+n], substr) {
			return i
		}
	}
	return -1
}

// equalFold vergleicht zwei Rune-Slices case-insensitiv (ASCII-Only).
func equalFold(s, t []rune) bool {
	if len(s) != len(t) {
		return false
	}
	for i := range s {
		if toLower(s[i]) != toLower(t[i]) {
			return false
		}
	}
	return true
}

// toLower wandelt einen ASCII-Großbuchstaben in Kleinbuchstaben um.
func toLower(r rune) rune {
	if r >= 'A' && r <= 'Z' {
		return r + ('a' - 'A')
	}
	return r
}

// CheckAllBinaries checks whether a particular program (name) is present
// somewhere in PATH and prints all matching paths. On Windows it also
// checks common executable extensions (.exe, .bat, ...). If not found,
// it prints an error and exits with code 1.
func CheckAllBinaries(name string) {
	pathEnv := os.Getenv("PATH")
	dirs := filepath.SplitList(pathEnv)

	found := false

	for _, dir := range dirs {
		// Direkt prüfen (z.B. Linux oder exakter Name)
		fullPath := filepath.Join(dir, name)
		if info, err := os.Stat(fullPath); err == nil {
			if !info.IsDir() && isExecutable(info) {
				fmt.Printf("%s\n", fullPath)
				found = true
			}
		}

		// Windows: bekannte Extensions immer zusätzlich prüfen
		if runtime.GOOS == "windows" {
			exts := []string{".exe", ".bat", ".cmd", ".com", ".ps1"}

			for _, ext := range exts {
				fullPathExt := filepath.Join(dir, name+ext)

				info, err := os.Stat(fullPathExt)
				if err != nil {
					continue
				}

				if !info.IsDir() {
					fmt.Printf("%s\n", fullPathExt)
					found = true
				}
			}
		}
	}

	// Not found → error message + exit code 1 (for scripts)
	if !found {
		fmt.Printf("%sBinary %s not found%s\n", goansi.RED, name, goansi.END)
		os.Exit(1)
	}
}

// isExecutable decides whether a file is considered executable.
//
// Windows: based on file extension (.exe, .bat, .cmd, .com, .ps1).
// Unix: based on the executable bit of file permissions (0o111).
func isExecutable(info os.FileInfo) bool {
	if runtime.GOOS == "windows" {
		ext := filepath.Ext(info.Name())
		switch ext {
		case ".exe", ".bat", ".cmd", ".com", "ps1":
			return true
		}
		return false
	}

	// Unix: executable bit prüfen
	return info.Mode()&0111 != 0
}
