package mcapp

import "testing"

func TestNormalizeWorldIconPath(t *testing.T) {
	p := `icons\\my_world_abc123.png`
	got := normalizeWorldIconPath(p)
	if got != "icons/my_world_abc123.png" {
		t.Fatalf("normalizeWorldIconPath() = %q, want %q", got, "icons/my_world_abc123.png")
	}
}
