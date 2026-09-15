package query

import (
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
)

// MatchPattern implements Finder's 3-tier name matcher exactly as described
// in AGENTS.md: exact string equality, then Go regex, then glob fallback.
func MatchPattern(pattern, name string) bool {
	if pattern == name {
		return true
	}
	if re, err := regexp.Compile(pattern); err == nil {
		if re.MatchString(name) {
			return true
		}
	}
	if ok, err := path.Match(pattern, name); err == nil && ok {
		return true
	}
	return false
}

// FSContext implements Context against a real directory on disk.
type FSContext struct {
	Dir string
}

func NewFSContext(dir string) *FSContext {
	return &FSContext{Dir: dir}
}

func (c *FSContext) entries() ([]os.DirEntry, error) {
	return os.ReadDir(c.Dir)
}

func (c *FSContext) MatchFile(pattern string) (bool, error) {
	entries, err := c.entries()
	if err != nil {
		return false, err
	}
	for _, e := range entries {
		if !e.IsDir() && MatchPattern(pattern, e.Name()) {
			return true, nil
		}
	}
	return false, nil
}

func (c *FSContext) MatchFolder(pattern string) (bool, error) {
	entries, err := c.entries()
	if err != nil {
		return false, err
	}
	for _, e := range entries {
		if e.IsDir() && MatchPattern(pattern, e.Name()) {
			return true, nil
		}
	}
	return false, nil
}

func (c *FSContext) MatchName(pattern string) (bool, error) {
	return MatchPattern(pattern, filepath.Base(c.Dir)), nil
}

func (c *FSContext) DirSizeBytes() (int64, error) {
	var total int64
	err := filepath.Walk(c.Dir, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			total += info.Size()
		}
		return nil
	})
	return total, err
}

func (c *FSContext) FileSizeBytes(pattern string) (int64, bool, error) {
	entries, err := c.entries()
	if err != nil {
		return 0, false, err
	}
	for _, e := range entries {
		if e.IsDir() || !MatchPattern(pattern, e.Name()) {
			continue
		}
		info, err := e.Info()
		if err != nil {
			return 0, false, err
		}
		return info.Size(), true, nil
	}
	return 0, false, nil
}

func (c *FSContext) CountFiles(pattern string) (int, error) {
	entries, err := c.entries()
	if err != nil {
		return 0, err
	}
	n := 0
	for _, e := range entries {
		if !e.IsDir() && MatchPattern(pattern, e.Name()) {
			n++
		}
	}
	return n, nil
}

func (c *FSContext) RunCommand(cmdline string) (bool, error) {
	cmd := exec.Command("sh", "-c", cmdline)
	cmd.Dir = c.Dir
	err := cmd.Run()
	if err == nil {
		return true, nil
	}
	if _, ok := err.(*exec.ExitError); ok {
		return false, nil
	}
	return false, err
}

func (c *FSContext) FileHash(pattern, algo string) (string, bool, error) {
	entries, err := c.entries()
	if err != nil {
		return "", false, err
	}
	for _, e := range entries {
		if e.IsDir() || !MatchPattern(pattern, e.Name()) {
			continue
		}
		f, err := os.Open(filepath.Join(c.Dir, e.Name()))
		if err != nil {
			return "", false, err
		}
		defer f.Close()
		switch algo {
		case "sha256":
			h := sha256.New()
			if _, err := io.Copy(h, f); err != nil {
				return "", false, err
			}
			return hex.EncodeToString(h.Sum(nil)), true, nil
		case "sha512":
			h := sha512.New()
			if _, err := io.Copy(h, f); err != nil {
				return "", false, err
			}
			return hex.EncodeToString(h.Sum(nil)), true, nil
		default:
			return "", false, fmt.Errorf("unbekannter Hash-Algorithmus %q", algo)
		}
	}
	return "", false, nil
}
