// helper.go contains all matching helpers of the search:
//
//   - matchesNamePattern / matchingFileNames / matchAny / matchesRegex:
//     name-based checks. The "name" field is matched exact-or-glob (as
//     before regex support); the separate "name_regex" field applies an
//     additional Go regex.
//   - compiledRegex / regexCache: compiled regex patterns with cache
//   - matchFolderTemplate: full template match for a folder
//     (name, files, subfolders, size, checksums)
//   - executeCommand: optional command requirement of the template
//   - convertToBytes / checkSize / getDirSize: size checks

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
	"regexp"
	"runtime"
	"strings"
	"sync"

	"github.com/shadowdara/finder/internal/structure"
)

// globMetaChars is the set of characters that make a "name" pattern
// interesting for glob (path.Match) matching: '*', '?', '[' and the
// escape backslash. Patterns containing none of them can only ever
// match by exact name, which is handled by fast paths elsewhere.
// Regex patterns live in the separate "name_regex" field and are never
// interpreted inside "name".
const globMetaChars = `*?[\`

// regexCache stores compiled patterns so that each distinct pattern is
// compiled at most once per process instead of on every matcher call.
// The value is either a *regexp.Regexp (pattern is a valid regex) or
// notRegexMarker (pattern is not a regex and must fall back to glob).
// A nil value means the pattern has not been looked up yet.
var regexCache sync.Map

// notRegexMarker marks cached patterns that failed to compile as regex.
type notRegexMarker struct{}

// compiledRegex returns the precompiled regexp for pattern, or nil if the
// pattern is not a valid regular expression.
func compiledRegex(pattern string) *regexp.Regexp {
	if v, ok := regexCache.Load(pattern); ok {
		if re, ok := v.(*regexp.Regexp); ok {
			return re
		}
		return nil
	}

	var stored any
	if re, err := regexp.Compile(pattern); err == nil {
		stored = re
	} else {
		stored = notRegexMarker{}
	}
	regexCache.Store(pattern, stored)

	if re, ok := stored.(*regexp.Regexp); ok {
		return re
	}
	return nil
}

// matchFolderTemplate checks whether the directory at dirPath matches the
// provided template. Matching includes name pattern, required files and
// required subfolders. The "name" field is matched exact-or-glob (as before
// regex support); an optional "name_regex" field applies an additional Go
// regular expression.
func matchFolderTemplate(dirPath string, template structure.Folder) bool {
	// Check folder name if provided
	dirName := filepath.Base(dirPath)

	if template.Name != "" {
		if !matchesNamePattern(template.Name, dirName) {
			return false
		}
	}
	if template.NameRegex != "" {
		if !matchesRegex(template.NameRegex, dirName) {
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
		matchingFiles := matchingFileNames(filesMap, file)
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
		if !matchFolderPattern(dirsMap, folder) {
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

// matchesNamePattern applies Finder's name matching for the "name" field:
// exact match first, then glob (path.Match). Regular expressions are NOT
// interpreted here — they belong in the separate "name_regex" field and are
// applied via matchesRegex. This restores the pre-regex behaviour of "name".
func matchesNamePattern(pattern string, name string) bool {
	if pattern == "" {
		return false
	}
	if pattern == "*" {
		return true
	}
	if pattern == name {
		return true
	}

	// Fast path: no glob metacharacters means this pattern can only ever
	// match by exact name, which was already checked above.
	if !strings.ContainsAny(pattern, globMetaChars) {
		return false
	}

	ok, err := path.Match(pattern, name)
	return err == nil && ok
}

// matchesRegex applies an anchored full-string match of a Go regular
// expression against name. Invalid regex patterns simply never match,
// so a template with a malformed name_regex fails closed.
func matchesRegex(pattern string, name string) bool {
	if pattern == "" {
		return false
	}
	re := compiledRegex(pattern)
	if re == nil {
		return false
	}
	return re.MatchString(name)
}

// matchFolderPattern returns true if at least one entry of the map matches
// the folder template constraints: exact/glob via Name, plus regex via
// NameRegex (both must be satisfied when both are set).
func matchFolderPattern(entries map[string]bool, folder structure.Folder) bool {
	for name := range entries {
		ok := true
		if folder.Name != "" {
			ok = ok && matchesNamePattern(folder.Name, name)
		}
		if folder.NameRegex != "" {
			ok = ok && matchesRegex(folder.NameRegex, name)
		}
		if ok {
			return true
		}
	}
	return false
}

// precompilePatterns compiles every regex pattern used by the template
// ("name_regex" fields) into regexCache before the search starts, so the
// parallel scan goroutines never pay the compile cost. Exact names and
// glob patterns are skipped (they do not need compilation).
func precompilePatterns(template structure.Folder) {
	if template.Name != "" {
		warmPattern(template.Name)
	}
	if template.NameRegex != "" {
		compiledRegex(template.NameRegex)
	}
	for _, file := range template.Files {
		warmPattern(file.Name)
		if file.NameRegex != "" {
			compiledRegex(file.NameRegex)
		}
	}
	for _, folder := range template.Folders {
		warmNestedPatterns(folder)
	}
}

// warmNestedPatterns precompiles the name and name_regex pattern of folder
// and, recursively, of all its nested folders and files.
func warmNestedPatterns(folder structure.Folder) {
	warmPattern(folder.Name)
	if folder.NameRegex != "" {
		compiledRegex(folder.NameRegex)
	}
	for _, file := range folder.Files {
		warmPattern(file.Name)
		if file.NameRegex != "" {
			compiledRegex(file.NameRegex)
		}
	}
	for _, sub := range folder.Folders {
		warmNestedPatterns(sub)
	}
}

// warmPattern compiles pattern only if it can ever be handled by glob
// matching (i.e. it is not a plain exact name). Because "name" is no longer
// regex-interpreted, only glob metacharacters trigger compilation; the
// "name_regex" fields are precompiled separately via compiledRegex.
func warmPattern(pattern string) {
	if pattern == "" || pattern == "*" {
		return
	}
	if !strings.ContainsAny(pattern, globMetaChars) {
		return
	}
	compiledRegex(pattern)
}

// matchingFileNames returns all file names from files that match the file
// constraint. Both "name" (exact/glob) and "name_regex" (regex) are applied;
// when both are set, both must match.
//
// Optimization: if the pattern contains NO glob metacharacters and no regex
// is set, only an exact map lookup is needed (instead of iterating over
// every entry).
func matchingFileNames(files map[string]bool, file structure.File) []string {
	// Fast path for exact names: plain map lookup instead of iterating every
	// entry through the pattern matcher. Only valid when no regex applies.
	if file.NameRegex == "" && file.Name != "" && !strings.ContainsAny(file.Name, globMetaChars) {
		if files[file.Name] {
			return []string{file.Name}
		}
		return nil
	}

	matching := make([]string, 0)
	for name := range files {
		match := true
		if file.Name != "" {
			match = matchesNamePattern(file.Name, name)
		}
		if file.NameRegex != "" {
			match = match && matchesRegex(file.NameRegex, name)
		}
		if match {
			matching = append(matching, name)
		}
	}
	return matching
}

// checkChecksums checks a file against optional SHA256/SHA512 hashes.
//
// Both hashes are computed in a single pass (MultiWriter). If both fields
// are empty, the check is considered passed. Comparisons are case-insensitive
// and use trimmed comparison values.
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

// matchAny returns true if at least ONE entry of the map matches the
// pattern. The pattern is interpreted as a "name" field value:
// exact match → glob. Regex patterns belong in "name_regex" and are
// handled via matchFolderPattern/matchesRegex instead.
func matchAny(entries map[string]bool, pattern string) bool {
	if entries[pattern] {
		return true
	}

	for name := range entries {
		if matchesNamePattern(pattern, name) {
			return true
		}
	}

	return false
}

// resetRegexCache clears the cached compiled patterns. Used by tests.
func resetRegexCache() {
	regexCache = sync.Map{}
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
