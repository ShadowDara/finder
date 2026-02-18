package cli

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/pub/argparser"
)

const version = "0.3.6"

// HandleCommand is the main entry point for CLI command processing.
// It parses raw arguments into structured CLIOptions, then dispatches
// to the appropriate command handler based on the parsed options.
func HandleCommand() {
	// NEW
	root := argparser.NewCommand("finder",
		"a simple go program to find your files", false)

	// Add option for JSON Output
	// root.Bool("json", false, "Enable JSON Output", false)

	// Add Version Command
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", false, "-v")

	// Check Command
	checkCmd := argparser.NewCommand("check",
		"to check all available Templates if their syntax is correct", false)

	// list, ls Command
	listCmd := argparser.NewCommand("list",
		"list all available templates", false, "ls")

	// tags, tag Command
	tagsCmd := argparser.NewCommand("tags",
		"show all tags in the console", false, "tag")

	// Tag Search
	tagSearchCmd := argparser.NewCommand("-t",
		"search for tags with the next argument", false)

	// help
	helpCmd := argparser.NewCommand("help",
		"shows help", true, "--help", "h", "-h")

	root.AddSubcommand(versionCmd)
	root.AddSubcommand(checkCmd)
	root.AddSubcommand(listCmd)
	root.AddSubcommand(tagsCmd)
	root.AddSubcommand(helpCmd)
	root.AddSubcommand(tagSearchCmd)

	// Parse the Arguments
	cmd := root.Parse(os.Args[1:])

	// Evaluate the Arguments
	switch cmd {
	case versionCmd:
		// Version
		fmt.Printf("%s\n", version)
	case checkCmd:
		// Check
		Check()
	case listCmd:
		// List
		List()
	case tagsCmd:
		// Tags
		Tags()
	case helpCmd:
		// Help
		root.PrintHelp()

	case tagSearchCmd:
		if len(cmd.Args) == 0 {
			root.PrintHelp()
			return
		}

		// Search for tags
		TagSearch(cmd.Args[0], "normal", true)
	default:
		if len(cmd.Args) == 0 {
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], "normal", true)
	}
}
