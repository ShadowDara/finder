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

    // Check required files (supports wildcards)
    for _, pattern := range template.Files {
        if !matchAny(filesMap, pattern) {
            return false
        }
    }

    // Check required subfolders (supports wildcards)
    for _, folder := range template.Folders {
        pattern := folder.Name
        if !matchAny(dirsMap, pattern) {
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
func executeCommand(dirPath string, command string) bool {
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
        if len(output) > 0 {
            return true
        }
        return false
    }

    return len(output) > 0
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
            if executeCommand(path, template.Command) {
                matches = append(matches, path)
            }
        }
        return nil
    })

    return matches
}
