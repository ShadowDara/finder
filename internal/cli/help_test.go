package cli

import (
	"strings"
	"testing"
)

func TestPrintHelp_OutputContent(t *testing.T) {
	output := captureOutput(func() {
		printHelp()
	})

	expectedStrings := []string{
		"Finder Help",
		"https://github.com/ShadowDara/finder",
		"Custom Folder",
		"%AppData%\\finder",
		"~/.config/finder",
		"~/Library/Application Support/finder",
		"Command Line Args",
		"-f",
		"-c",
		"--json",
		"--clear",
		"blocked names for templates",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(output, expected) {
			t.Errorf("expected help output to contain %q, got: %s", expected, output)
		}
	}
}

func TestPrintHelp_PlatformPaths(t *testing.T) {
	output := captureOutput(func() {
		printHelp()
	})

	// Should contain all platform paths
	if !strings.Contains(output, "Windows") {
		t.Errorf("expected Windows path in help")
	}
	if !strings.Contains(output, "Linux") {
		t.Errorf("expected Linux path in help")
	}
	if !strings.Contains(output, "MacOS") {
		t.Errorf("expected MacOS path in help")
	}
}

func TestPrintHelp_BlockedNames(t *testing.T) {
	output := captureOutput(func() {
		printHelp()
	})

	blockedNames := []string{"check", "help", "list"}
	for _, name := range blockedNames {
		if !strings.Contains(output, name) {
			t.Errorf("expected blocked name %q in help output", name)
		}
	}
}

func TestPrintHelp_CommandLineArgs(t *testing.T) {
	output := captureOutput(func() {
		printHelp()
	})

	commandArgs := []string{
		"Load a Custom JSON File",
		"Load JSON from the next commandline Argument",
		"Displays the output in the Terminal as JSON",
		"Displays the output in the Terminal without any other printing",
	}

	for _, arg := range commandArgs {
		if !strings.Contains(output, arg) {
			t.Errorf("expected command line arg description %q in help", arg)
		}
	}
}
