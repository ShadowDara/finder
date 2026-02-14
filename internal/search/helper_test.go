package search

import (
    "os"
    "path/filepath"
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
        Name: "proj",
        Files: []string{"a.txt"},
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
