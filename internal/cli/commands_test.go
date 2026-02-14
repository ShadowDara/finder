package cli

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"
)

// captureOutput captures stdout during function execution
func captureOutput(f func()) string {
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

func TestHandleCommand_HelpFlag(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "help"})
	})

	if !strings.Contains(output, "Finder Help") {
		t.Errorf("expected help output, got: %s", output)
	}
}

func TestHandleCommand_ListFlag(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "list"})
	})

	if !strings.Contains(output, "List available Templates") {
		t.Errorf("expected list output with templates info, got: %s", output)
	}
}

func TestHandleCommand_CheckFlag(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "check"})
	})

	if !strings.Contains(output, "Checking all Templates") {
		t.Errorf("expected check output, got: %s", output)
	}
	if !strings.Contains(output, "Finished Checking") {
		t.Errorf("expected finished message, got: %s", output)
	}
}

func TestHandleCommand_NoArguments(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder"})
	})

	if !strings.Contains(output, "Please provide at least one argument") {
		t.Errorf("expected error message for no arguments, got: %s", output)
	}
}

func TestHandleCommand_MissingFilePathForF(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "-f"})
	})

	if !strings.Contains(output, "Missing file path for -f option") {
		t.Errorf("expected missing file path error, got: %s", output)
	}
}

func TestHandleCommand_MissingJSONForC(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "-c"})
	})

	if !strings.Contains(output, "Missing JSON string for -c option") {
		t.Errorf("expected missing JSON error, got: %s", output)
	}
}

func TestHandleCommand_InvalidFilePath(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "-f", "/non/existent/path/file.json5"})
	})

	if !strings.Contains(output, "Error loading file") {
		t.Errorf("expected error loading file message, got: %s", output)
	}
}

func TestHandleCommand_JSONOutputFlag(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "help", "--json"})
	})

	// When using --json flag, it should still process normally
	if !strings.Contains(output, "Finder Help") {
		t.Errorf("expected help output with --json flag, got: %s", output)
	}
}

func TestHandleCommand_ClearOutputFlag(t *testing.T) {
	output := captureOutput(func() {
		HandleCommand([]string{"finder", "help", "--clear"})
	})

	// With --clear flag, it should not print the version
	if strings.Contains(output, "Struct Finder v") {
		t.Errorf("expected no version output with --clear flag, got: %s", output)
	}
}

func TestHandleCommand_WithCustomJSON(t *testing.T) {
	customJSON := `{
		"name": "test",
		"description": "test template",
		"files": ["file.txt"],
		"folders": []
	}`

	output := captureOutput(func() {
		HandleCommand([]string{"finder", "-c", customJSON, "--clear"})
	})

	// With custom JSON, it should process and output results
	if strings.Contains(output, "Error") && !strings.Contains(output, "End of the List") {
		t.Errorf("expected valid processing or found list, got: %s", output)
	}
}

func TestList(t *testing.T) {
	output := captureOutput(func() {
		list()
	})

	if !strings.Contains(output, "List available Templates") {
		t.Errorf("expected template list header, got: %s", output)
	}
	if !strings.Contains(output, "Default Templates") {
		t.Errorf("expected default templates section, got: %s", output)
	}
}

func TestCheck(t *testing.T) {
	output := captureOutput(func() {
		check()
	})

	if !strings.Contains(output, "Checking all Templates") {
		t.Errorf("expected checking message, got: %s", output)
	}
	if !strings.Contains(output, "Finished Checking") {
		t.Errorf("expected finished message, got: %s", output)
	}
}
