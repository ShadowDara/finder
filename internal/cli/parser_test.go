package cli

import (
	"testing"
)

// TestParseCLI_MissingCommand tests error handling for missing command
func TestParseCLI_MissingCommand(t *testing.T) {
	_, err := ParseCLI([]string{"finder"})
	if err == nil {
		t.Errorf("expected error for missing command")
	}
}

// TestParseCLI_Help tests parsing various help command syntaxes
func TestParseCLI_Help(t *testing.T) {
	helpCommands := []string{"help", "h", "-h", "--help"}

	for _, cmd := range helpCommands {
		opts, err := ParseCLI([]string{"finder", cmd})
		if err != nil {
			t.Errorf("unexpected error for '%s': %v", cmd, err)
			continue
		}

		if !opts.IsHelp() {
			t.Errorf("expected IsHelp() to be true for command '%s'", cmd)
		}
	}
}

// TestParseCLI_List tests parsing list command variants
func TestParseCLI_List(t *testing.T) {
	listCommands := []string{"list", "ls"}

	for _, cmd := range listCommands {
		opts, err := ParseCLI([]string{"finder", cmd})
		if err != nil {
			t.Errorf("unexpected error for '%s': %v", cmd, err)
			continue
		}

		if !opts.IsList() {
			t.Errorf("expected IsList() to be true for command '%s'", cmd)
		}
	}
}

// TestParseCLI_Check tests parsing check command
func TestParseCLI_Check(t *testing.T) {
	opts, err := ParseCLI([]string{"finder", "check"})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if !opts.IsCheck() {
		t.Errorf("expected IsCheck() to be true")
	}
}

// TestParseCLI_FileLoadCommand tests -f and --file command parsing
func TestParseCLI_FileLoadCommand(t *testing.T) {
	fileCommands := []string{"-f", "--file"}

	for _, cmd := range fileCommands {
		opts, err := ParseCLI([]string{"finder", cmd, "/path/to/file.json5"})
		if err != nil {
			t.Errorf("unexpected error for '%s': %v", cmd, err)
			continue
		}

		if !opts.IsFileLoad() {
			t.Errorf("expected IsFileLoad() to be true for command '%s'", cmd)
		}

		filePath, err := opts.GetFileArg()
		if err != nil {
			t.Errorf("unexpected error getting file arg: %v", err)
		}

		if filePath != "/path/to/file.json5" {
			t.Errorf("expected file path '/path/to/file.json5', got: %s", filePath)
		}
	}
}

// TestParseCLI_FileLoadMissingArg tests error when -f has no file path
func TestParseCLI_FileLoadMissingArg(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "-f"})
	_, err := opts.GetFileArg()
	if err == nil {
		t.Errorf("expected error when file path is missing")
	}
}

// TestParseCLI_DirectLoadCommand tests -c and --config command parsing
func TestParseCLI_DirectLoadCommand(t *testing.T) {
	jsonStr := `{"name": "test", "files": []}`
	directCommands := []string{"-c", "--config"}

	for _, cmd := range directCommands {
		opts, err := ParseCLI([]string{"finder", cmd, jsonStr})
		if err != nil {
			t.Errorf("unexpected error for '%s': %v", cmd, err)
			continue
		}

		if !opts.IsDirectLoad() {
			t.Errorf("expected IsDirectLoad() to be true for command '%s'", cmd)
		}

		json, err := opts.GetDirectLoadArg()
		if err != nil {
			t.Errorf("unexpected error getting direct load arg: %v", err)
		}

		if json != jsonStr {
			t.Errorf("expected JSON string to be preserved")
		}
	}
}

// TestParseCLI_DirectLoadMissingArg tests error when -c has no JSON
func TestParseCLI_DirectLoadMissingArg(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "-c"})
	_, err := opts.GetDirectLoadArg()
	if err == nil {
		t.Errorf("expected error when JSON string is missing")
	}
}

// TestParseCLI_TemplateSearch tests parsing template name as command
func TestParseCLI_TemplateSearch(t *testing.T) {
	opts, err := ParseCLI([]string{"finder", "react"})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if !opts.IsTemplateSearch() {
		t.Errorf("expected IsTemplateSearch() to be true")
	}

	templateName := opts.GetTemplateName()
	if templateName != "react" {
		t.Errorf("expected template name 'react', got: %s", templateName)
	}
}

// TestParseCLI_OutputTypeJSON tests --json flag parsing
func TestParseCLI_OutputTypeJSON(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "list", "--json"})
	if opts.OutputType != "json" {
		t.Errorf("expected output type 'json', got: %s", opts.OutputType)
	}
}

// TestParseCLI_OutputTypeClear tests --clear flag parsing
func TestParseCLI_OutputTypeClear(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "check", "--clear"})
	if opts.OutputType != "clear" {
		t.Errorf("expected output type 'clear', got: %s", opts.OutputType)
	}
}

// TestParseCLI_OutputTypeNormal tests default output type
func TestParseCLI_OutputTypeNormal(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "help"})
	if opts.OutputType != "normal" {
		t.Errorf("expected output type 'normal', got: %s", opts.OutputType)
	}
}

// TestParseCLI_VerboseFlag tests --verbose flag parsing
func TestParseCLI_VerboseFlag(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "list", "--verbose"})
	if !opts.Verbose {
		t.Errorf("expected Verbose to be true")
	}

	optsNoVerbose, _ := ParseCLI([]string{"finder", "list"})
	if optsNoVerbose.Verbose {
		t.Errorf("expected Verbose to be false")
	}
}

// TestParseCLI_MultipleFlags tests parsing multiple flags together
func TestParseCLI_MultipleFlags(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "react", "--json", "--verbose"})
	if opts.OutputType != "json" {
		t.Errorf("expected output type 'json', got: %s", opts.OutputType)
	}
	if !opts.Verbose {
		t.Errorf("expected Verbose to be true")
	}
	if !opts.IsTemplateSearch() {
		t.Errorf("expected template search command")
	}
}

// TestParseCLI_CommandPrecedence tests that command is properly extracted
func TestParseCLI_CommandPrecedence(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "-f", "file.json", "--json"})
	if !opts.IsFileLoad() {
		t.Errorf("expected file load command to take precedence")
	}
}

// TestParseCLI_RemainingArgs tests that remaining arguments are captured
func TestParseCLI_RemainingArgs(t *testing.T) {
	opts, _ := ParseCLI([]string{"finder", "-f", "file1.json", "file2.json", "--json"})
	filePath, _ := opts.GetFileArg()
	if filePath != "file1.json" {
		t.Errorf("expected first arg 'file1.json', got: %s", filePath)
	}
	if len(opts.Args) < 1 {
		t.Errorf("expected Args to contain remaining arguments")
	}
}

// TestRouteCommand tests command routing logic
func TestRouteCommand_HelpRoute(t *testing.T) {
	opts := &CLIOptions{Command: "help"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for help command")
	}
}

func TestRouteCommand_ListRoute(t *testing.T) {
	opts := &CLIOptions{Command: "list"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for list command")
	}
}

func TestRouteCommand_CheckRoute(t *testing.T) {
	opts := &CLIOptions{Command: "check"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for check command")
	}
}

func TestRouteCommand_FileLoadRoute(t *testing.T) {
	opts := &CLIOptions{Command: "-f"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for file load command")
	}
}

func TestRouteCommand_DirectLoadRoute(t *testing.T) {
	opts := &CLIOptions{Command: "-c"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for direct load command")
	}
}

func TestRouteCommand_TemplateSearchRoute(t *testing.T) {
	opts := &CLIOptions{Command: "react"}
	handler := routeCommand(opts)
	if handler == nil {
		t.Errorf("expected handler for template search command")
	}
}

func TestRouteCommand_UnknownRoute(t *testing.T) {
	opts := &CLIOptions{Command: ""}
	handler := routeCommand(opts)
	if handler != nil {
		t.Errorf("expected no handler for empty command")
	}
}

// TestParseCLI_Tags tests parsing tags command
func TestParseCLI_Tags(t *testing.T) {
    tagsCommands := []string{"tags", "tag"}

    for _, cmd := range tagsCommands {
        opts, err := ParseCLI([]string{"finder", cmd})
        if err != nil {
            t.Errorf("unexpected error for '%s': %v", cmd, err)
            continue
        }

        if !opts.IsTags() {
            t.Errorf("expected IsTags() to be true for command '%s'", cmd)
        }
    }
}

// TestRouteCommand_TagsRoute tests routing to tags handler
func TestRouteCommand_TagsRoute(t *testing.T) {
    opts := &CLIOptions{Command: "tags"}
    handler := routeCommand(opts)
    if handler == nil {
        t.Errorf("expected handler for tags command")
    }
}
