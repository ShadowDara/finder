package search

import (
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/shadowdara/finder/internal/structure"
)

func TestMatchFolderTemplateAndFind(t *testing.T) {
	root := t.TempDir()

	// create structure: root/proj with files a.txt and subdir
	proj := filepath.Join(root, "proj")
	if err := os.MkdirAll(filepath.Join(proj, "sub"), 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(proj, "a.txt"), []byte("x"), 0644); err != nil {
		t.Fatalf("write: %v", err)
	}

	tpl := structure.Folder{
		Name:    "proj",
		Files:   structure.Files{{Name: "a.txt"}},
		Folders: []structure.Folder{{Name: "sub"}},
	}

	// matchFolderTemplate is in the same package so we can call it
	ok := matchFolderTemplate(proj, tpl)
	if !ok {
		t.Fatalf("expected matchFolderTemplate to match")
	}

	matches := findMatchingFolders(root, tpl)
	if len(matches) == 0 {
		t.Fatalf("expected findMatchingFolders to find at least one match")
	}
}

// TestMatchesPattern_ExactFastPath verifies that exact-name patterns with no
// regex/glob metacharacters use the map-lookup fast path.
//
// Note: an exact name like "config.json" contains '.' which is a valid regex
// metacharacter, so it always goes through the regex matcher (substring match,
// e.g. "config.json" regex-matches "config.json.bak"). This is long-standing
// Finder behaviour and is preserved unchanged.
func TestMatchesPattern_ExactFastPath(t *testing.T) {
	// Pattern without any metacharacter: exact-match fast path, never compiled.
	if !matchesPattern("config", "config") {
		t.Errorf(`exact name "config" should match itself`)
	}
	for _, name := range []string{"config2", "config.json", "conf"} {
		if matchesPattern("config", name) {
			t.Errorf(`exact pattern "config" should not match %q`, name)
		}
	}

	// No metacharacters means the pattern is not cached as a compiled regex.
	if _, ok := regexCache.Load("config"); ok {
		t.Errorf(`plain exact name "config" should not be cached as a pattern`)
	}
}

// TestMatchesPattern_StarWildcard verifies the "*" fast path always matches.
func TestMatchesPattern_StarWildcard(t *testing.T) {
	if !matchesPattern("*", "") {
		t.Errorf(`"*" should match empty name`)
	}
	if !matchesPattern("*", "anything-at-all") {
		t.Errorf(`"*" should match any name`)
	}
}

// TestMatchesPattern_GlobFallback verifies glob-only patterns still work
// through the glob fallback and get cached as non-regex.
func TestMatchesPattern_GlobFallback(t *testing.T) {
	// "*.ts" is not a valid regex, so it must fall back to glob matching.
	if !matchesPattern("*.ts", "index.ts") {
		t.Errorf(`"*.ts" should glob-match "index.ts"`)
	}
	if matchesPattern("*.ts", "index.js") {
		t.Errorf(`"*.ts" should not glob-match "index.js"`)
	}
}

// TestMatchesPattern_RegexCached verifies that regex patterns are cached so
// later calls skip compilation. It also guards against regressions that would
// recompile on every match.
func TestMatchesPattern_RegexCached(t *testing.T) {
	resetRegexCache()

	pattern := `^project-[0-9]+$`
	if !matchesPattern(pattern, "project-123") {
		t.Fatalf("expected regex pattern to match")
	}

	// The pattern must now be in the cache.
	if _, ok := regexCache.Load(pattern); !ok {
		t.Fatalf("expected regex pattern to be cached after first use")
	}
}

// TestPrecompilePatterns warms the cache for all patterns used by a template,
// including nested folders, before any matching happens. Plain exact names and
// glob-only patterns that are not valid regexes are skipped.
func TestPrecompilePatterns(t *testing.T) {
	resetRegexCache()

	tpl := structure.Folder{
		Name: `^project-[0-9]+$`,
		Files: structure.Files{
			{Name: `^main\.py$`},
			{Name: "package.json"},
		},
		Folders: []structure.Folder{
			{
				Name:  `^src[0-9]$`,
				Files: structure.Files{{Name: `^index\.(js|ts)$`}},
				Folders: []structure.Folder{
					{Name: "components"},
				},
			},
		},
	}

	precompilePatterns(tpl)

	for _, p := range []string{
		`^project-[0-9]+$`,
		`^main\.py$`,
		`^src[0-9]$`,
		`^index\.(js|ts)$`,
	} {
		if _, ok := regexCache.Load(p); !ok {
			t.Errorf("expected %q to be precompiled", p)
		}
	}

	// Plain exact names without metacharacters must NOT be compiled (they use
	// the map-lookup fast path).
	if _, ok := regexCache.Load("components"); ok {
		t.Errorf("exact name %q should not be cached as a pattern", "components")
	}

	// "package.json" contains '.', which IS a valid regex: it is precompiled
	// and used as a substring regex, exactly as before the change.
	if _, ok := regexCache.Load("package.json"); !ok {
		t.Errorf("expected %q to be cached ('.' is a regex metacharacter)", "package.json")
	}
}

func TestMatchFolderTemplate_Checksums(t *testing.T) {
	testDir := t.TempDir()
	content := []byte("finder hash checking")
	filePath := filepath.Join(testDir, "config.txt")
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		t.Fatalf("write: %v", err)
	}

	sha256Sum := sha256.Sum256(content)
	sha512Sum := sha512.Sum512(content)
	template := structure.Folder{
		Files: structure.Files{{
			Name: "config.txt",
			Checksums: structure.Checksum{
				Sha256: strings.ToUpper(hex.EncodeToString(sha256Sum[:])),
				Sha512: hex.EncodeToString(sha512Sum[:]),
			},
		}},
	}

	if !matchFolderTemplate(testDir, template) {
		t.Fatal("expected matching SHA-256 and SHA-512 checksums to pass")
	}

	template.Files[0].Checksums.Sha256 = "invalid"
	if matchFolderTemplate(testDir, template) {
		t.Fatal("expected invalid checksum to reject the folder")
	}
}
