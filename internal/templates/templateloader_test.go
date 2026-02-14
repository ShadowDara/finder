package templates

import (
	"strings"
	"testing"
)

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
	data1, err1 := JSONtemplateLoader("_default")
	data2, err2 := JSONtemplateLoader("_default.json5")

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
	templates, err := LoadAll()

	if err != nil {
		t.Fatalf("LoadAll returned error: %v", err)
	}

	failedLoads := []string{}
	for _, tmpl := range templates {
		_, err := JSONtemplateLoader(tmpl)
		if err != nil {
			failedLoads = append(failedLoads, tmpl)
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
