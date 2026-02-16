package cli

import (
	"fmt"

	"github.com/shadowdara/finder/color"
)

const version = "0.3.4"

// HandleCommand is the main entry point for CLI command processing.
// It parses raw arguments into structured CLIOptions, then dispatches
// to the appropriate command handler based on the parsed options.
func HandleCommand(args []string) {
	// Parse CLI arguments
	opts, err := ParseCLI(args)
	if err != nil {
		fmt.Printf("finder: %sError: %v. Use 'help' for usage information.%s\n",
			color.Red, err, color.Reset)
		return
	}

	// Print header unless in "clear" mode
	if opts.OutputType != "clear" {
		fmt.Printf("%sStruct Finder v%s%s\n", color.Green, version, color.Reset)
	}

	// Dispatch to appropriate handler based on command
	handler := routeCommand(opts)
	if handler == nil {
		fmt.Printf("%sUnknown command '%s'. Use 'help' for usage information.%s\n",
			color.Yellow, opts.Command, color.Reset)
		return
	}

	// Execute the handler
	if err := handler(opts); err != nil {
		fmt.Printf("%sError: %v%s\n", color.Red, err, color.Reset)
		return
	}
}

// routeCommand returns the appropriate handler function for the given command options.
// Returns nil if no matching handler is found.
func routeCommand(opts *CLIOptions) HandlerFunc {
	switch {
	case opts.IsHelp():
		return handleHelp
	case opts.IsList():
		return handleList
	case opts.IsCheck():
		return handleCheck
	case opts.IsTagsSearch():
		return handleTagSearch
	case opts.IsTags():
		return handleTags
	case opts.IsFileLoad():
		return handleFileLoad
	case opts.IsDirectLoad():
		return handleDirectLoad
	case opts.IsTemplateSearch():
		return handleTemplateSearch
	default:
		return nil
	}
}
