package loader

import (
    "os"
    "path/filepath"
    "testing"
)

func TestLoadFile(t *testing.T) {
    dir := t.TempDir()
    fname := filepath.Join(dir, "test.txt")
    content := []byte("hello world")
    if err := os.WriteFile(fname, content, 0644); err != nil {
        t.Fatalf("write temp file: %v", err)
    }

    got, err := LoadFile(fname)
    if err != nil {
        t.Fatalf("LoadFile returned error: %v", err)
    }
    if got != string(content) {
        t.Fatalf("unexpected content: got %q want %q", got, string(content))
    }
}
