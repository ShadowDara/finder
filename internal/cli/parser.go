package cli

import (
	"fmt"
)

// CLIOptions holds all parsed command-line flags and options
type CLIOptions struct {
	Command    string // The main command (help, list, check, -f, -c, or template name)
	Args       []string // Remaining arguments
	OutputType string // "normal", "json", or "clear"
	Verbose    bool
}

// ParseCLI parses raw command-line arguments into a structured CLIOptions object.
// Returns an error if arguments are invalid, or nil if parsing succeeded.
func ParseCLI(args []string) (*CLIOptions, error) {
	opts := &CLIOptions{
		OutputType: "normal",
		Args:       []string{},
	}

	// Need at least: program_name command
	if len(args) < 2 {
		return nil, fmt.Errorf("missing command")
	}

	// First pass: scan for global flags
	for _, arg := range args[1:] {
		switch arg {
		case "--json":
			opts.OutputType = "json"
		case "--clear":
			opts.OutputType = "clear"
		case "--verbose":
			opts.Verbose = true
		}
	}

	// Second pass: extract the main command (non-flag argument at position 1)
	opts.Command = args[1]

	// Third pass: collect remaining arguments for the command
	if len(args) > 2 {
		opts.Args = args[2:]
	}

	return opts, nil
}

// IsHelp checks if the user requested help
func (o *CLIOptions) IsHelp() bool {
	return o.Command == "help" || o.Command == "h" || o.Command == "-h" || o.Command == "--help"
}

// IsList checks if the user requested list command
func (o *CLIOptions) IsList() bool {
	return o.Command == "list" || o.Command == "ls"
}

// IsCheck checks if the user requested check command
func (o *CLIOptions) IsCheck() bool {
	return o.Command == "check"
}

// IsFileLoad checks if the user wants to load a custom file
func (o *CLIOptions) IsFileLoad() bool {
	return o.Command == "-f" || o.Command == "--file"
}

// IsDirectLoad checks if the user wants to load JSON directly from command line
func (o *CLIOptions) IsDirectLoad() bool {
	return o.Command == "-c" || o.Command == "--config"
}

// IsTemplateSearch checks if the command is a template name (not a special command)
func (o *CLIOptions) IsTemplateSearch() bool {
	return !o.IsHelp() && !o.IsList() && !o.IsCheck() && !o.IsFileLoad() && !o.IsDirectLoad()
}

// GetFileArg returns the file path for -f command, or error if missing
func (o *CLIOptions) GetFileArg() (string, error) {
	if len(o.Args) < 1 {
		return "", fmt.Errorf("missing file path for -f option")
	}
	return o.Args[0], nil
}

// GetDirectLoadArg returns the JSON string for -c command, or error if missing
func (o *CLIOptions) GetDirectLoadArg() (string, error) {
	if len(o.Args) < 1 {
		return "", fmt.Errorf("missing JSON string for -c option")
	}
	return o.Args[0], nil
}

// GetTemplateName returns the template name for a template search
func (o *CLIOptions) GetTemplateName() string {
	return o.Command
}
