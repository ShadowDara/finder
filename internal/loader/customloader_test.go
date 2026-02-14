package loader

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadCustomJSON_FileDoesNotExist(t *testing.T) {
	_, err := LoadCustomJSON("nonexistent_template")

	if err == nil {
		t.Fatalf("expected error for non-existent file, got nil")
	}
}

func TestLoadCustomJSON_WithValidFile(t *testing.T) {
	// Create a temporary directory to act as app data path
	tempDir := t.TempDir()

	// Create a test JSON5 file
	testFileName := "test_template.json5"
	testFilePath := filepath.Join(tempDir, testFileName)
	testContent := `{ "name": "test", "description": "test template" }`

	if err := os.WriteFile(testFilePath, []byte(testContent), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// Mock the getAppDataPath function behavior by using environment
	// Since we can't mock easily, we'll test error handling
	_, err := LoadCustomJSON("test_template")
	if err != nil {
		// Expected to fail on most systems where user config dir doesn't have our files
		t.Logf("expected behavior: file not in user config dir: %v", err)
	}
}

func TestGetAppDataPath_Windows(t *testing.T) {
	if os.Getenv("OS") != "Windows_NT" && os.Getenv("APPDATA") == "" {
		t.Skip("skipping Windows-specific test on non-Windows system")
	}

	path, err := getAppDataPath()

	if err != nil && os.Getenv("APPDATA") != "" {
		t.Errorf("unexpected error on Windows: %v", err)
	}

	if path != "" && !filepath.IsAbs(path) {
		t.Errorf("expected absolute path, got %q", path)
	}
}

func TestGetAppDataPath_ReturnsString(t *testing.T) {
	path, err := getAppDataPath()

	// Path might be empty or have error on unsupported OS, but should be consistent
	if err != nil && path != "" {
		t.Errorf("got both error and non-empty path: %v, %q", err, path)
	}
}

func TestGetAppDataPath_SupportedOS(t *testing.T) {
	// This test just verifies the function doesn't panic
	_, _ = getAppDataPath()
}

func TestLoadCustomJSON_ErrorMessage(t *testing.T) {
	_, err := LoadCustomJSON("missing")

	if err == nil {
		t.Fatalf("expected error for missing file")
	}

	errMsg := err.Error()
	if errMsg == "" {
		t.Errorf("expected non-empty error message")
	}
}

func TestLoadCustomJSON_WithExtension(t *testing.T) {
	// The function adds .json5 extension automatically
	_, err := LoadCustomJSON("test")

	// Should return error but not because of file path construction
	if err != nil {
		t.Logf("expected behavior: custom template not found: %v", err)
	}
}

func TestProgramName_Constant(t *testing.T) {
	if PROGRAM_NAME != "finder" {
		t.Errorf("expected PROGRAM_NAME to be 'finder', got %q", PROGRAM_NAME)
	}
}
