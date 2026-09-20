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
// glob metacharacters use the map-lookup fast path.
func TestMatchesNamePattern_ExactFastPath(t *testing.T) {
	// Pattern without any glob metacharacter: exact-match fast path.
	if !matchesNamePattern("config", "config") {
		t.Errorf(`exact name "config" should match itself`)
	}
	for _, name := range []string{"config2", "config.json", "conf"} {
		if matchesNamePattern("config", name) {
			t.Errorf(`exact pattern "config" should not match %q`, name)
		}
	}
}

// TestMatchesPattern_StarWildcard verifies the "*" fast path always matches.
func TestMatchesNamePattern_StarWildcard(t *testing.T) {
	if !matchesNamePattern("*", "") {
		t.Errorf(`"*" should match empty name`)
	}
	if !matchesNamePattern("*", "anything-at-all") {
		t.Errorf(`"*" should match any name`)
	}
}

// TestMatchesPattern_GlobFallback verifies glob patterns still work
// through path.Match.
func TestMatchesNamePattern_GlobFallback(t *testing.T) {
	if !matchesNamePattern("*.ts", "index.ts") {
		t.Errorf(`"*.ts" should glob-match "index.ts"`)
	}
	if matchesNamePattern("*.ts", "index.js") {
		t.Errorf(`"*.ts" should not glob-match "index.js"`)
	}
}

// TestMatchesRegex_Basic verifies that name_regex patterns are compiled
// and cached, and that they match correctly.
func TestMatchesRegex_Basic(t *testing.T) {
	resetRegexCache()

	pattern := `^project-[0-9]+$`
	if !matchesRegex(pattern, "project-123") {
		t.Fatalf("expected regex pattern to match")
	}
	if matchesRegex(pattern, "project-abc") {
		t.Fatalf("expected regex pattern not to match alpha names")
	}

	// The pattern must now be in the cache.
	if _, ok := regexCache.Load(pattern); !ok {
		t.Fatalf("expected regex pattern to be cached after first use")
	}
}

// TestMatchesRegex_InvalidRegex verifies that an invalid regex never matches.
func TestMatchesRegex_InvalidRegex(t *testing.T) {
	if matchesRegex("[invalid", "anything") {
		t.Errorf("invalid regex should never match")
	}
}

// TestPrecompilePatterns warms the cache for all patterns used by a template,
// including nested folders, before any matching happens. Plain exact names and
// glob-only patterns are not cached as regex; "name_regex" fields are compiled.
func TestPrecompilePatterns(t *testing.T) {
	resetRegexCache()

	tpl := structure.Folder{
		Name:      "*",
		NameRegex: `^project-[0-9]+$`,
		Files: structure.Files{
			{Name: "package.json", NameRegex: `^main\.py$`},
		},
		Folders: []structure.Folder{
			{
				Name:      "*",
				NameRegex: `^src[0-9]$`,
				Files:     structure.Files{{NameRegex: `^index\.(js|ts)$`}},
				Folders: []structure.Folder{
					{Name: "components"},
				},
			},
		},
	}

	precompilePatterns(tpl)

	// "name_regex" fields and file "name_regex" must be cached as compiled regex.
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

	// Plain exact names without glob metacharacters must NOT be compiled.
	if _, ok := regexCache.Load("components"); ok {
		t.Errorf("exact name %q should not be cached as a pattern", "components")
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
