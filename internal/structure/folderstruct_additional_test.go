package structure

import (
	"testing"
)

func TestNewFolder_DefaultValues(t *testing.T) {
	f := NewFolder("test")

	if f.Name != "test" {
		t.Errorf("expected name 'test', got %q", f.Name)
	}

	if f.Description != "" {
		t.Errorf("expected empty description, got %q", f.Description)
	}

	if f.Folders == nil || len(f.Folders) != 0 {
		t.Errorf("expected empty folders slice")
	}

	if f.Files == nil || len(f.Files) != 0 {
		t.Errorf("expected empty files slice")
	}

	if f.Command != "" {
		t.Errorf("expected empty command, got %q", f.Command)
	}

	if f.InvertCommand != false {
		t.Errorf("expected InvertCommand to be false")
	}
}

func TestNewFolder_MultipleInstances(t *testing.T) {
	f1 := NewFolder("folder1")
	f2 := NewFolder("folder2")

	if f1.Name == f2.Name {
		t.Errorf("different instances should have different names")
	}
}

func TestLoadJSON5_EmptyTemplate(t *testing.T) {
	src := `{}`

	f := LoadJSON5(src)

	if f.Name != "" {
		t.Errorf("expected empty name, got %q", f.Name)
	}

	if f.Description != "" {
		t.Errorf("expected empty description, got %q", f.Description)
	}
}

func TestLoadJSON5_WithCommand(t *testing.T) {
	src := `{
		name: "test",
		command: "git status"
	}`

	f := LoadJSON5(src)

	if f.Command != "git status" {
		t.Errorf("expected command 'git status', got %q", f.Command)
	}
}

func TestLoadJSON5_WithInvertCommand(t *testing.T) {
	src := `{
		name: "test",
		invert_command: true
	}`

	f := LoadJSON5(src)

	if f.InvertCommand != true {
		t.Errorf("expected InvertCommand true, got %v", f.InvertCommand)
	}
}

func TestLoadJSON5_WithFiles(t *testing.T) {
	src := `{
		name: "test",
		files: ["file1.txt", "file2.txt", "file3.txt"]
	}`

	f := LoadJSON5(src)

	if len(f.Files) != 3 {
		t.Errorf("expected 3 files, got %d", len(f.Files))
	}

	expectedFiles := []string{"file1.txt", "file2.txt", "file3.txt"}
	for i, expected := range expectedFiles {
		if f.Files[i] != expected {
			t.Errorf("expected file %q at index %d, got %q", expected, i, f.Files[i])
		}
	}
}

func TestLoadJSON5_WithNestedFolders(t *testing.T) {
	src := `{
		name: "parent",
		folders: [
			{ name: "child1" },
			{ name: "child2", files: ["file.txt"] }
		]
	}`

	f := LoadJSON5(src)

	if len(f.Folders) != 2 {
		t.Errorf("expected 2 folders, got %d", len(f.Folders))
	}

	if f.Folders[0].Name != "child1" {
		t.Errorf("expected first child name 'child1', got %q", f.Folders[0].Name)
	}

	if f.Folders[1].Name != "child2" {
		t.Errorf("expected second child name 'child2', got %q", f.Folders[1].Name)
	}

	if len(f.Folders[1].Files) != 1 {
		t.Errorf("expected 1 file in second child, got %d", len(f.Folders[1].Files))
	}
}

func TestLoadJSON5_ComplexStructure(t *testing.T) {
	src := `{
		name: "npm-project",
		description: "A Node.js project with npm",
		files: ["package.json", "package-lock.json"],
		folders: [
			{
				name: "node_modules"
			},
			{
				name: "src",
				folders: [
					{ name: "components" }
				]
			}
		],
		command: "npm list",
		invert_command: false
	}`

	f := LoadJSON5(src)

	if f.Name != "npm-project" {
		t.Errorf("expected name 'npm-project'")
	}

	if f.Description != "A Node.js project with npm" {
		t.Errorf("expected specific description")
	}

	if len(f.Files) != 2 {
		t.Errorf("expected 2 files")
	}

	if len(f.Folders) != 2 {
		t.Errorf("expected 2 folders")
	}

	if len(f.Folders[1].Folders) != 1 {
		t.Errorf("expected nested folder structure")
	}
}

func TestLoadJSON5_UnquotedKeys(t *testing.T) {
	// Test that JSON5 unquoted keys are handled
	src := `{
		name: "test",
		description: "Test Description",
		files: []
	}`

	f := LoadJSON5(src)

	if f.Name != "test" {
		t.Errorf("expected unquoted key 'name' to work")
	}
}

func TestLoadJSON5_Comments(t *testing.T) {
	src := `{
		// This is a comment
		name: "test", /* block comment */
		description: "desc"
	}`

	f := LoadJSON5(src)

	if f.Name != "test" {
		t.Errorf("expected JSON5 with comments to parse correctly")
	}
}

func TestLoadJSON5_EmptyArrays(t *testing.T) {
	src := `{
		name: "test",
		files: [],
		folders: []
	}`

	f := LoadJSON5(src)

	if f.Files != nil && len(f.Files) != 0 {
		t.Errorf("expected empty or nil files array")
	}

	if f.Folders != nil && len(f.Folders) != 0 {
		t.Errorf("expected empty or nil folders array")
	}
}

func TestFolderStructure_DeepNesting(t *testing.T) {
	src := `{
		name: "level1",
		folders: [
			{
				name: "level2",
				folders: [
					{
						name: "level3",
						files: ["deep.txt"]
					}
				]
			}
		]
	}`

	f := LoadJSON5(src)

	if len(f.Folders) == 0 {
		t.Fatalf("expected nested structure")
	}

	level2 := f.Folders[0]
	if len(level2.Folders) == 0 {
		t.Fatalf("expected level 2 nesting")
	}

	level3 := level2.Folders[0]
	if level3.Name != "level3" {
		t.Errorf("expected level3 name")
	}

	if len(level3.Files) != 1 {
		t.Errorf("expected file in level 3")
	}
}
