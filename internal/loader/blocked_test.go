package loader

import (
	"testing"
)

func TestGetBlockedTemplateNames_ReturnsMap(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	if blocked == nil {
		t.Fatalf("expected non-nil map, got nil")
	}

	if len(blocked) == 0 {
		t.Fatalf("expected non-empty blocked names map")
	}
}

func TestGetBlockedTemplateNames_ContainsExpectedKeys(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	expectedKeys := []string{"check", "help", "list"}

	for _, key := range expectedKeys {
		if _, exists := blocked[key]; !exists {
			t.Errorf("expected blocked key %q not found in map", key)
		}
	}
}

func TestGetBlockedTemplateNames_CheckKey(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	desc, exists := blocked["check"]
	if !exists {
		t.Fatalf("check key not found")
	}

	expectedDesc := "Check all templates if their syntax is correct"
	if desc != expectedDesc {
		t.Errorf("expected description %q for check, got %q", expectedDesc, desc)
	}
}

func TestGetBlockedTemplateNames_HelpKey(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	desc, exists := blocked["help"]
	if !exists {
		t.Fatalf("help key not found")
	}

	expectedDesc := "Display this help Message"
	if desc != expectedDesc {
		t.Errorf("expected description %q for help, got %q", expectedDesc, desc)
	}
}

func TestGetBlockedTemplateNames_ListKey(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	desc, exists := blocked["list"]
	if !exists {
		t.Fatalf("list key not found")
	}

	expectedDesc := "List all Templates Files"
	if desc != expectedDesc {
		t.Errorf("expected description %q for list, got %q", expectedDesc, desc)
	}
}

func TestGetBlockedTemplateNames_SizeThree(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	if len(blocked) != 3 {
		t.Errorf("expected exactly 3 blocked names, got %d", len(blocked))
	}
}

func TestGetBlockedTemplateNames_NoEmptyDescriptions(t *testing.T) {
	blocked := GetBlockedTemplateNames()

	for key, desc := range blocked {
		if desc == "" {
			t.Errorf("blocked key %q has empty description", key)
		}
	}
}

func TestGetBlockedTemplateNames_ConsistentBetweenCalls(t *testing.T) {
	blocked1 := GetBlockedTemplateNames()
	blocked2 := GetBlockedTemplateNames()

	if len(blocked1) != len(blocked2) {
		t.Fatalf("inconsistent blocked names map size between calls")
	}

	for key, desc1 := range blocked1 {
		desc2, exists := blocked2[key]
		if !exists || desc1 != desc2 {
			t.Errorf("inconsistent blocked names between calls for key %q", key)
		}
	}
}
