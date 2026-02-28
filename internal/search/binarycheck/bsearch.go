package binarycheck

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/shadowdara/finder/pub/goansi"
)

// Function to check if a Binary is in the Path
func CheckBinary(name string) {
	path, err := exec.LookPath(name)
	if err != nil {
		fmt.Printf("%sBinary %s not found%s\n", goansi.RED, name, goansi.END)
		os.Exit(1)
		return
	}

	fmt.Printf("Binary %s found at: %s\n", name, path)
}

// Function to get all Executables
func GetallExetuables() {
	pathEnv := os.Getenv("PATH")
	dirs := filepath.SplitList(pathEnv)

	seen := make(map[string]bool)

	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue // Ordner evtl. nicht zugreifbar
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			fullPath := filepath.Join(dir, entry.Name())

			info, err := entry.Info()
			if err != nil {
				continue
			}

			if isExecutable(info) {
				if !seen[entry.Name()] {
					// fmt.Println(entry.Name())
					fmt.Println(fullPath)
					seen[entry.Name()] = true
				}
			}
		}
	}
}

// Function to check if a file is a executable
func isExecutable(info os.FileInfo) bool {
	if runtime.GOOS == "windows" {
		ext := filepath.Ext(info.Name())
		switch ext {
		case ".exe", ".bat", ".cmd", ".com":
			return true
		}
		return false
	}

	// Unix: executable bit prüfen
	return info.Mode()&0111 != 0
}
