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
