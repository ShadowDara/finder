package search

import (
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"

	"github.com/shadowdara/finder/internal/structure"
)

// matchFolderTemplate checks whether the directory at dirPath matches the
// provided template. Matching includes name pattern, required files and
// required subfolders. Wildcards in template fields are supported via
// path.Match.
func matchFolderTemplate(dirPath string, template structure.Folder) bool {
	// Check folder name if provided
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

	// Maps for quick lookups
	filesMap := map[string]bool{}
	dirsMap := map[string]bool{}

	for _, e := range entries {
		if e.IsDir() {
			dirsMap[e.Name()] = true
		} else {
			filesMap[e.Name()] = true
		}
	}

	// Check files with existence logic
	for _, file := range template.Files {
		exists := matchAny(filesMap, file.Name)

		switch file.Existence {
		case "required", "":
			if !exists {
				return false
			}
		case "forbidden":
			if exists {
				return false
			}
		case "optional":
			if !exists {
				continue
			}
		}

		// Größenprüfung nur wenn Datei existiert
		if exists && (file.DataSize.Min > 0 || file.DataSize.Max > 0) {
			for name := range filesMap {
				ok, _ := path.Match(file.Name, name)
				if ok {
					info, err := os.Stat(filepath.Join(dirPath, name))
					if err != nil {
						return false
					}
					if !checkSize(info.Size(), file.DataSize) {
						return false
					}
				}
			}
		}
	}

	// Check required subfolders (supports wildcards)
	for _, folder := range template.Folders {
		pattern := folder.Name
		if !matchAny(dirsMap, pattern) {
			return false
		}
	}

	// Check folder size constraint
	if template.DataSize.Min > 0 || template.DataSize.Max > 0 {
		dirSize := getDirSize(dirPath)
		if !checkSize(dirSize, template.DataSize) {
			return false
		}
	}

	return true
}

// matchAny returns true if at least one entry in the provided map matches
// the pattern. Exact match is checked first, then path.Match is used for
// wildcard matching.
func matchAny(entries map[string]bool, pattern string) bool {
	if entries[pattern] {
		return true
	}

	for name := range entries {
		ok, _ := path.Match(pattern, name)
		if ok {
			return true
		}
	}

	return false
}

// executeCommand runs a shell command in dirPath. The function returns
// true when the command should be considered successful for filtering
// purposes. An empty command is considered successful. If the command
// fails but produced output (e.g. some commands write to stderr), this
// helper treats that as success to allow commands like git status --porcelain
// to signal repository state.
func executeCommand(dirPath string, command string, invert_command bool) bool {
	// Get the wanted return Vale from the Template
	returnVal := 0
	if invert_command {
		returnVal = 1
	}

	if command == "" {
		return true
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/c", command)
	} else {
		cmd = exec.Command("sh", "-c", command)
	}
	cmd.Dir = dirPath

	output, err := cmd.Output()
	if err != nil {
		if len(output) > returnVal {
			return true
		}
		return false
	}

	return len(output) > returnVal
}

// findMatchingFolders searches recursively under root and returns a list of
// directories that match the given template. It uses matchFolderTemplate
// and executeCommand to filter results.
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
			if executeCommand(path, template.Command, template.InvertCommand) {
				matches = append(matches, path)
			}
		}
		return nil
	})

	return matches
}

// convertToBytes converts a value with unit (B, KB, MB, GB) into bytes.
func convertToBytes(value int, unit string) int64 {
	switch unit {
	case "KB":
		return int64(value) * 1024
	case "MB":
		return int64(value) * 1024 * 1024
	case "GB":
		return int64(value) * 1024 * 1024 * 1024
	default: // Bytes
		return int64(value)
	}
}

// checkSize validates a size against a Size constraint.
func checkSize(actual int64, constraint structure.Size) bool {
	if constraint.Min > 0 {
		min := convertToBytes(constraint.Min, constraint.Min_size_type)
		if actual < min {
			return false
		}
	}

	if constraint.Max > 0 {
		max := convertToBytes(constraint.Max, constraint.Max_size_type)
		if actual > max {
			return false
		}
	}

	return true
}

// getDirSize calculates total size of directory recursively.
func getDirSize(dir string) int64 {
	var total int64

	filepath.Walk(dir, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() {
			total += info.Size()
		}
		return nil
	})

	return total
}
