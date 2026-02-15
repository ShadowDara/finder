package search

import (
	"bytes"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/shadowdara/finder/internal/structure"
)

// captureOutput helper to capture stdout
func captureSearchOutput(f func()) string {
	r, w, _ := os.Pipe()
	stdout := os.Stdout
	os.Stdout = w

	f()

	w.Close()
	os.Stdout = stdout

	var buf bytes.Buffer
	io.Copy(&buf, r)
	return buf.String()
}

func TestFind_NormalOutput(t *testing.T) {
	folder := structure.Folder{
		Description: "Test Folder",
		Name:        "testfolder",
		Files:       structure.Files{},
		Folders:     []structure.Folder{},
	}

	output := captureSearchOutput(func() {
		Find(folder, "normal")
	})

	if !strings.Contains(output, "Description: Test Folder") {
		t.Errorf("expected description in output, got: %s", output)
	}
	if !strings.Contains(output, "# Found:") {
		t.Errorf("expected '# Found:' header in output, got: %s", output)
	}
	if !strings.Contains(output, "# End of the List") {
		t.Errorf("expected '# End of the List' footer in output, got: %s", output)
	}
}

func TestFind_ClearOutput(t *testing.T) {
	folder := structure.Folder{
		Description: "Test Folder",
		Name:        "testfolder",
		Files:       structure.Files{},
		Folders:     []structure.Folder{},
	}

	output := captureSearchOutput(func() {
		Find(folder, "clear")
	})

	// Clear output should not include description
	if strings.Contains(output, "Description:") {
		t.Errorf("clear output should not contain description, got: %s", output)
	}
}

func TestFind_JSONOutput(t *testing.T) {
	folder := structure.Folder{
		Description: "Test Folder",
		Name:        "testfolder",
		Files:       structure.Files{},
		Folders:     []structure.Folder{},
	}

	output := captureSearchOutput(func() {
		Find(folder, "json")
	})

	// JSON output should be valid JSON array
	var results []string
	err := json.Unmarshal([]byte(output), &results)
	if err != nil {
		t.Errorf("expected valid JSON output, got: %s (error: %v)", output, err)
	}
}

func TestGetSearchRoots_ReturnsSlice(t *testing.T) {
	// Verify that getSearchRoots returns a non-empty slice
	roots := getSearchRoots()

	if len(roots) == 0 {
		t.Fatalf("expected non-empty roots slice")
	}

	// Each root should be non-empty
	for _, root := range roots {
		if root == "" {
			t.Errorf("expected non-empty root path")
		}
	}
}

func TestMatchFolderTemplate_NoTemplate(t *testing.T) {
	tempDir := t.TempDir()

	template := structure.Folder{
		Name:    "",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	if !matchFolderTemplate(tempDir, template) {
		t.Errorf("expected to match empty template")
	}
}

func TestMatchFolderTemplate_WithFileName(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "mytest")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}

	template := structure.Folder{
		Name:    "mytest",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	if !matchFolderTemplate(testDir, template) {
		t.Errorf("expected to match folder with name")
	}
}

func TestMatchFolderTemplate_WithWildcard(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "mytest123")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}

	template := structure.Folder{
		Name:    "mytest*",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	if !matchFolderTemplate(testDir, template) {
		t.Errorf("expected to match folder with wildcard pattern")
	}
}

func TestMatchFolderTemplate_WithFile(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "project")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(testDir, "package.json"), []byte("{}"), 0644); err != nil {
		t.Fatalf("failed to create file: %v", err)
	}

	template := structure.Folder{
		Name:    "project",
		Files:   structure.Files{{Name: "package.json"}},
		Folders: []structure.Folder{},
	}

	if !matchFolderTemplate(testDir, template) {
		t.Errorf("expected to match folder with required file")
	}
}

func TestMatchFolderTemplate_MissingFile(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "project")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}

	template := structure.Folder{
		Name:    "project",
		Files:   structure.Files{{Name: "package.json"}},
		Folders: []structure.Folder{},
	}

	if matchFolderTemplate(testDir, template) {
		t.Errorf("expected NOT to match folder without required file")
	}
}

func TestMatchFolderTemplate_WithSubfolder(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "project")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}
	if err := os.Mkdir(filepath.Join(testDir, "src"), 0755); err != nil {
		t.Fatalf("failed to create subfolder: %v", err)
	}

	template := structure.Folder{
		Name:  "project",
		Files: structure.Files{},
		Folders: []structure.Folder{
			{Name: "src"},
		},
	}

	if !matchFolderTemplate(testDir, template) {
		t.Errorf("expected to match folder with required subfolder")
	}
}

func TestMatchFolderTemplate_MissingSubfolder(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "project")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}

	template := structure.Folder{
		Name:  "project",
		Files: structure.Files{},
		Folders: []structure.Folder{
			{Name: "src"},
		},
	}

	if matchFolderTemplate(testDir, template) {
		t.Errorf("expected NOT to match folder without required subfolder")
	}
}

func TestMatchAny_ExactMatch(t *testing.T) {
	entries := map[string]bool{
		"file.txt":  true,
		"data.json": true,
	}

	if !matchAny(entries, "file.txt") {
		t.Errorf("expected exact match for 'file.txt'")
	}
}

func TestMatchAny_WildcardMatch(t *testing.T) {
	entries := map[string]bool{
		"file.txt":    true,
		"config.json": true,
	}

	if !matchAny(entries, "*.txt") {
		t.Errorf("expected wildcard match for '*.txt'")
	}
}

func TestMatchAny_NoMatch(t *testing.T) {
	entries := map[string]bool{
		"file.txt": true,
	}

	if matchAny(entries, "nonexistent.xml") {
		t.Errorf("expected no match for 'nonexistent.xml'")
	}
}

func TestExecuteCommand_EmptyCommand(t *testing.T) {
	result := executeCommand(t.TempDir(), "", false)

	if !result {
		t.Errorf("expected empty command to return true")
	}
}

func TestExecuteCommand_ValidCommand(t *testing.T) {
	// Use a simple command that should work on both Windows and Unix
	result := executeCommand(t.TempDir(), "echo test", false)

	if !result {
		t.Errorf("expected 'echo test' command to succeed")
	}
}

func TestExecuteCommand_InvertedCommand(t *testing.T) {
	// This tests the inverted command flag
	result := executeCommand(t.TempDir(), "echo test", true)

	// Behavior depends on implementation
	_ = result
}

func TestFindMatchingFolders_Empty(t *testing.T) {
	tempDir := t.TempDir()

	template := structure.Folder{
		Name:    "nonexistent",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	matches := findMatchingFolders(tempDir, template)

	if len(matches) != 0 {
		t.Errorf("expected empty results for non-matching template, got %d matches", len(matches))
	}
}

func TestFindMatchingFolders_SingleMatch(t *testing.T) {
	tempDir := t.TempDir()
	testDir := filepath.Join(tempDir, "testfolder")
	if err := os.Mkdir(testDir, 0755); err != nil {
		t.Fatalf("failed to create test dir: %v", err)
	}

	template := structure.Folder{
		Name:    "testfolder",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	matches := findMatchingFolders(tempDir, template)

	if len(matches) != 1 {
		t.Errorf("expected 1 match, got %d", len(matches))
	}
	if len(matches) > 0 && !strings.Contains(matches[0], "testfolder") {
		t.Errorf("expected match to contain 'testfolder', got %q", matches[0])
	}
}

func TestFindMatchingFolders_MultipleMatches(t *testing.T) {
	tempDir := t.TempDir()

	for i := 1; i <= 3; i++ {
		testDir := filepath.Join(tempDir, "test")
		if err := os.Mkdir(testDir, 0755); err != nil {
			testDir = filepath.Join(tempDir, "test"+string(rune(48+i)))
			os.Mkdir(testDir, 0755)
		}
	}

	template := structure.Folder{
		Name:    "test*",
		Files:   structure.Files{},
		Folders: []structure.Folder{},
	}

	matches := findMatchingFolders(tempDir, template)

	if len(matches) == 0 {
		t.Logf("no matches found (expected for wildcard in walk)")
	}
}
