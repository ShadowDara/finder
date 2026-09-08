package search

import (
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"

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
		matchingFiles := matchingFileNames(filesMap, file.Name)
		exists := len(matchingFiles) > 0

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

		// Size and checksum constraints apply only to existing matching files.
		if exists && (file.DataSize.Min > 0 || file.DataSize.Max > 0 ||
			file.Checksums.Sha256 != "" || file.Checksums.Sha512 != "") {
			matchedConstraints := false
			for _, name := range matchingFiles {
				info, err := os.Stat(filepath.Join(dirPath, name))
				if err != nil || !checkSize(info.Size(), file.DataSize) {
					continue
				}

				if !checkChecksums(filepath.Join(dirPath, name), file.Checksums) {
					continue
				}

				matchedConstraints = true
				break
			}

			if !matchedConstraints {
				return false
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

func matchingFileNames(files map[string]bool, pattern string) []string {
	matching := make([]string, 0)
	for name := range files {
		ok, err := path.Match(pattern, name)
		if err == nil && ok {
			matching = append(matching, name)
		}
	}
	return matching
}

func checkChecksums(filePath string, checksums structure.Checksum) bool {
	if checksums.Sha256 == "" && checksums.Sha512 == "" {
		return true
	}

	file, err := os.Open(filePath)
	if err != nil {
		return false
	}
	defer file.Close()

	sha256Hash := sha256.New()
	sha512Hash := sha512.New()
	if _, err := io.Copy(io.MultiWriter(sha256Hash, sha512Hash), file); err != nil {
		return false
	}

	if checksums.Sha256 != "" && !strings.EqualFold(
		hex.EncodeToString(sha256Hash.Sum(nil)), strings.TrimSpace(checksums.Sha256),
	) {
		return false
	}

	return checksums.Sha512 == "" || strings.EqualFold(
		hex.EncodeToString(sha512Hash.Sum(nil)), strings.TrimSpace(checksums.Sha512),
	)
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
