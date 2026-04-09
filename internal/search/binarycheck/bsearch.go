package binarycheck

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/shadowdara/finder/pub/goansi"
)

// Function to get all Executables, optionally filtered by name (case-insensitive substring)
func GetallExetuables(filter ...string) {
	var nameFilter string
	if len(filter) > 0 {
		nameFilter = filter[0]
	}

	pathEnv := os.Getenv("PATH")
	dirs := filepath.SplitList(pathEnv)

	fmt.Println("[finder] PATH-Verzeichnisse (normalisiert):")
	// for _, dir := range dirs {
	// 	cleanDir := filepath.Clean(dir)
	// 	fmt.Println("  ", cleanDir)
	// }

	for _, dir := range dirs {
		cleanDir := filepath.Clean(dir)
		entries, err := os.ReadDir(cleanDir)
		if err != nil {
			continue // Ordner evtl. nicht zugreifbar
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			fullPath := filepath.Join(cleanDir, entry.Name())

			info, err := entry.Info()
			if err != nil {
				continue
			}

			key := entry.Name()
			match := false
			if nameFilter != "" {
				// Windows: prüfe auch Basename ohne Extension und alle Executable-Extensions
				if runtime.GOOS == "windows" {
					base := key
					ext := filepath.Ext(key)
					if ext != "" {
						base = key[:len(key)-len(ext)]
					}
					// Prüfe: exakter Basename, Substring im Namen, Substring im Basename
					if containsIgnoreCase(key, nameFilter) || containsIgnoreCase(base, nameFilter) {
						match = true
					} else {
						// Wenn Filter exakt, prüfe alle Executable-Extensions
						exts := []string{".exe", ".bat", ".cmd", ".com", ".ps1"}
						for _, e := range exts {
							if base+e == nameFilter || containsIgnoreCase(base+e, nameFilter) {
								match = true
								break
							}
						}
					}
				} else {
					// Unix: wie gehabt
					if containsIgnoreCase(key, nameFilter) {
						match = true
					}
				}
			} else {
				match = true // kein Filter -> alles ausgeben
			}

			if isExecutable(info) && match {
				fmt.Println(fullPath)
			}
		}
	}
}

// Helper: case-insensitive substring
func containsIgnoreCase(s, substr string) bool {
	return len(substr) == 0 || (len(s) > 0 && (stringContainsFold(s, substr)))
}

func stringContainsFold(s, substr string) bool {
	return len(substr) == 0 || (len(s) > 0 && (indexFold(s, substr) >= 0))
}

func indexFold(s, substr string) int {
	return indexFoldHelper([]rune(s), []rune(substr))
}

func indexFoldHelper(s, substr []rune) int {
	n := len(substr)
	if n == 0 {
		return 0
	}
	for i := 0; i+n <= len(s); i++ {
		if equalFold(s[i:i+n], substr) {
			return i
		}
	}
	return -1
}

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

func toLower(r rune) rune {
	if r >= 'A' && r <= 'Z' {
		return r + ('a' - 'A')
	}
	return r
}

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

		// Windows: bekannte Extensions immer prüfen
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

	if !found {
		fmt.Printf("%sBinary %s not found%s\n", goansi.RED, name, goansi.END)
		os.Exit(1)
	}
}

// Function to check if a file is a executable
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
