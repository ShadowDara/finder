package structure

import (
    "testing"
)

func TestLoadJSON5_Simple(t *testing.T) {
    src := `{
        // a comment
        name: "example",
        description: "desc",
        files: ["a.txt", "b.txt"],
        folders: [{ name: "sub" }]
    }`

    f := LoadJSON5(src)

    if f.Name != "example" {
        t.Fatalf("unexpected name: %q", f.Name)
    }
    if f.Description != "desc" {
        t.Fatalf("unexpected description: %q", f.Description)
    }
    if len(f.Files) != 2 {
        t.Fatalf("expected 2 files, got %d", len(f.Files))
    }
    if len(f.Folders) != 1 || f.Folders[0].Name != "sub" {
        t.Fatalf("unexpected subfolder: %#v", f.Folders)
    }
}
