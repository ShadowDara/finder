// CLi package for finder, not for the other binaries

package cli

import (
	"fmt"
	"log"

	"github.com/shadowdara/finder/pub/argparser"

	"github.com/shadowdara/finder/internal/config"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/search/binarycheck"
	"github.com/shadowdara/finder/internal/templates"
)

// HandleCommand is the main entry point for CLI command processing.
// It parses raw arguments into structured CLIOptions, then dispatches
// to the appropriate command handler based on the parsed options.
func HandleCommand(args []string) {
	var finderconfig config.Config

	finderconfig = config.NewConfig()

	path, err := templates.GetCustomPath()
	if err != nil {
		log.Fatalln(err)
	}

	// Config in the UserRoot
	config := config.LoadConfig(path + "/" + "config.json5")

	// NEW
	root := argparser.NewCommand("finder",
		"a simple go program to find your files via file structures", false)

	// Add option for JSON Output
	root.Bool("json", false, "Enable JSON Output", false, "j")

	// Verbose
	root.Bool("verbose", false, "Enable Verbose Mode", false, "vv")

	// Create Cache
	root.Bool("create-cache", false, "Create the Cache", false, "cc")

	// Load Cache
	root.Bool("cache", false, "Use the already existing Cache", false, "c")

	// Create Cache DB
	root.Bool("create-cache-db", false, "Create a Git DB from the cache data", false, "ccd")

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

	if cmd.GetBool("json") {
		finderconfig.OutputType = "json"
	}

	cachearg := cmd.GetBool("create-cache")

	if !config.Cache {
		config.Cache = cachearg
	}

	cachedbarg := cmd.GetBool("create-cache-db")

	if !config.CreateCacheDB {
		config.CreateCacheDB = cachedbarg
	}

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
		Banner()
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
		TagSearch(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"))
	case templateCmd:
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), cmd.GetBool("create-cache-db"))
	default:
		if len(cmd.Args) <= 0 {
			Banner()
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), cmd.GetBool("create-cache-db"))
	}
}
