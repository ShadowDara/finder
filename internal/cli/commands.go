package cli

import (
	"fmt"

	"github.com/shadowdara/finder/pub/argparser"

	"github.com/shadowdara/finder/internal/config"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/search/binarycheck"
)

// HandleCommand is the main entry point for CLI command processing.
// It parses raw arguments into structured CLIOptions, then dispatches
// to the appropriate command handler based on the parsed options.
func HandleCommand(args []string) {
	var finderconfig config.Config

	finderconfig = config.NewConfig()

	// NEW
	root := argparser.NewCommand("finder",
		"a simple go program to find your files", false)

	// Add option for JSON Output
	// root.Bool("json", false, "Enable JSON Output", false)

	// Add Version Command
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", false, "-v", "v", "version")

	// Temaplte Command
	templateCmd := argparser.NewCommand("template",
		"to search for a template - for the case that the name for a template is overwritten by another argument name",
		false, "tpl")

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

	// BinarySearch
	binarySearchCmd := argparser.NewCommand(
		"-b", "search for executables in path", false)

	// help
	helpCmd := argparser.NewCommand("help",
		"shows help", true, "--help", "h", "-h")

	root.AddSubcommand(versionCmd)
	root.AddSubcommand(templateCmd)
	root.AddSubcommand(checkCmd)
	root.AddSubcommand(listCmd)
	root.AddSubcommand(tagsCmd)
	root.AddSubcommand(tagSearchCmd)
	root.AddSubcommand(binarySearchCmd)
	root.AddSubcommand(helpCmd)

	// Parse the Arguments
	cmd := root.Parse(args[1:])

	// Evaluate the Arguments
	switch cmd {
	case versionCmd:
		// Version
		fmt.Printf("%s\n", finderversion.Version)
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

	case binarySearchCmd:
		if len(cmd.Args) > 0 {
			binarycheck.CheckAllBinaries(cmd.Args[0])
			return
		} else {
			root.PrintHelp()
			return
		}

	case tagSearchCmd:
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Search for tags
		TagSearch(cmd.Args[0], finderconfig.OutputType, true)
	case templateCmd:
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], finderconfig.OutputType, true)
	default:
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], finderconfig.OutputType, true)
	}
}
