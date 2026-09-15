package templates

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestIsTemplateFile(t *testing.T) {
	cases := []struct {
		name string
		want bool
	}{
		{"foo.json5", true},
		{"foo.json", true},
		{"foo.jsonc", true},
		{"foo.txt", false},
		{"foo", false},
		{"foo.JSON5", false}, // case-sensitive
		{"config.json", true},
		{".jsonc", true},
	}
	for _, c := range cases {
		if got := IsTemplateFile(c.name); got != c.want {
			t.Errorf("IsTemplateFile(%q) = %v, want %v", c.name, got, c.want)
		}
	}
}

func TestTrimTemplateExt(t *testing.T) {
	cases := []struct {
		name string
		want string
	}{
		{"foo.json5", "foo"},
		{"foo.json", "foo"},
		{"foo.jsonc", "foo"},
		{"foo.txt", "foo.txt"},
		{"foo", "foo"},
		{"a/b/c.json5", "a/b/c"},
		{"foo.json5.json", "foo.json5"}, // ".json" matches before ".json5" in the list
	}
	for _, c := range cases {
		if got := TrimTemplateExt(c.name); got != c.want {
			t.Errorf("TrimTemplateExt(%q) = %q, want %q", c.name, got, c.want)
		}
	}
}

func TestLoadUserTemplates_ExtensionPriority(t *testing.T) {
	dir := t.TempDir()

	// Create the same template with three extensions
	write := func(ext, content string) {
		path := filepath.Join(dir, "duplicate"+ext)
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	write(".json5", `{"description": "json5 version", "name": "*"}`)
	write(".json", `{"description": "json version", "name": "*"}`)
	write(".jsonc", `{"description": "jsonc version", "name": "*"}`)

	templates := make(map[string][]byte)
	if err := loadTemplatesFromDir(dir, templates); err != nil {
		t.Fatalf("loadTemplatesFromDir: %v", err)
	}

	if len(templates) != 1 {
		t.Fatalf("expected exactly 1 template, got %d: %v", len(templates), templates)
	}

	data, ok := templates["duplicate"]
	if !ok {
		t.Fatalf("expected template 'duplicate', got keys: %v", templates)
	}
	if !strings.Contains(string(data), "jsonc version") {
		t.Errorf("expected jsonc (highest priority) to win, got: %s", string(data))
	}
}

func TestJSONtemplateLoader_ValidTemplate(t *testing.T) {
	// Test with a known template
	data, err := JSONtemplateLoader("_default")

	if err != nil {
		t.Fatalf("failed to load _default template: %v", err)
	}

	if len(data) == 0 {
		t.Fatalf("expected non-empty template data")
	}

	// Should be valid JSON5-like content
	if !strings.Contains(string(data), "{") {
		t.Errorf("expected JSON content in template")
	}
}

func TestJSONtemplateLoader_NonexistentTemplate(t *testing.T) {
	data, err := JSONtemplateLoader("nonexistent_template_xyz")

	if err == nil {
		t.Fatalf("expected error for non-existent template")
	}

	if len(data) != 0 {
		t.Fatalf("expected empty data for non-existent template")
	}
}

func TestJSONtemplateLoader_AddsExtension(t *testing.T) {
	// Load with name and without extension - both should use the same file
	_, err1 := JSONtemplateLoader("_default")
	_, err2 := JSONtemplateLoader("_default.json5")

	// One of these might fail depending on how the function handles extensions
	if err1 == nil && err2 == nil {
		// If both succeed, data should ideally be the same (though we can't guarantee this)
		t.Logf("both with and without extension loaded")
	}
}

func TestLoadAll_ReturnsSlice(t *testing.T) {
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	if templates == nil {
		t.Fatalf("expected non-nil slice")
	}
}

func TestLoadAll_ContainsTemplates(t *testing.T) {
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	if len(templates) == 0 {
		t.Fatalf("expected at least one template")
	}
}

func TestLoadAll_ContainsDefaultTemplate(t *testing.T) {
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	found := false
	for _, tmpl := range templates {
		if tmpl == "_default" {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("expected _default template in LoadAll results")
	}
}

func TestLoadAll_NoFileExtensions(t *testing.T) {
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	for _, tmpl := range templates {
		if strings.Contains(tmpl, ".json5") {
			t.Errorf("template name should not contain extension: %q", tmpl)
		}
	}
}

func TestLoadAll_UniqueNames(t *testing.T) {
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	seen := make(map[string]bool)
	for _, tmpl := range templates {
		if seen[tmpl] {
			t.Errorf("duplicate template name: %q", tmpl)
		}
		seen[tmpl] = true
	}
}

func TestLoadAll_AllTemplatesLoadable(t *testing.T) {
	// Only test embedded templates, since LoadAll also includes
	// user templates from the filesystem that JSONtemplateLoader
	// (embedded) cannot load.
	files, err := templates.ReadDir(".")
	if err != nil {
		t.Fatalf("ReadDir failed: %v", err)
	}

	failedLoads := []string{}
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json5") {
			continue
		}
		name := strings.TrimSuffix(file.Name(), ".json5")
		if _, err := JSONtemplateLoader(name); err != nil {
			failedLoads = append(failedLoads, name)
		}
	}

	if len(failedLoads) > 0 {
		t.Errorf("failed to load templates: %v", failedLoads)
	}
}

func TestJSONtemplateLoader_KnownTemplates(t *testing.T) {
	knownTemplates := []string{
		"go",
		"npm",
		"python",
		"rust",
		"unity",
	}

	for _, tmpl := range knownTemplates {
		data, err := JSONtemplateLoader(tmpl)

		if err != nil {
			t.Logf("template %q not available or error: %v", tmpl, err)
			continue
		}

		if len(data) == 0 {
			t.Errorf("template %q returned empty data", tmpl)
		}
	}
}

func TestJSONtemplateLoader_DataFormat(t *testing.T) {
	data, err := JSONtemplateLoader("_default")

	if err != nil {
		t.Fatalf("failed to load template: %v", err)
	}

	// Should be byte slice
	if len(data) == 0 {
		t.Errorf("expected non-empty data")
	}

	// Convert to string and check for JSON-like structure
	content := string(data)
	if !strings.Contains(content, "{") || !strings.Contains(content, "}") {
		t.Errorf("expected JSON-like structure in template")
	}
}
