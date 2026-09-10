// CLi package for finder, not for the other binaries

package cli

import (
	"fmt"
	"log"
	"os"

	"github.com/shadowdara/finder/pub/argparser"
	"github.com/shadowdara/finder/pub/fsd"

	"github.com/shadowdara/finder/internal/cache"
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
		"a simple go program to find your files via file structures", "Check out github for more infos or the finder website:\nhttps://github.com/shadowdara/finder\nhttps://shadowdara.github.io/finder", false)

	// Add option for JSON Output
	root.GlobalBool("json", false, "Enable JSON Output", "j")

	// Verbose
	root.GlobalBool("verbose", false, "Enable Verbose Mode", "vv")

	// Create Cache
	root.Bool("create-cache", false, "Create the Cache", false, "cc")

	// Load Cache
	root.Bool("cache", false, "Use the already existing Cache", false, "c")

	// view cache count
	root.Bool("count", false, "View the count of how many entries where found", false)

	// Create Cache DB
	root.Bool("create-cache-db", false, "Create a Git DB from the cache data", false, "ccd")

	// Add Version Command
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", "", false, "-v", "v", "version")

	// Temaplte Command
	templateCmd := argparser.NewCommand("template",
		"to search for a template - for the case that the name for a template is overwritten by another argument name",
		"", false, "tpl")

	// Create Cache
	templateCmd.Bool("create-cache", false, "Create the Cache", false, "cc")

	// Load Cache
	templateCmd.Bool("cache", false, "Use the already existing Cache", false, "c")

	// Create Cache DB
	templateCmd.Bool("create-cache-db", false, "Create a Git DB from the cache data", false, "ccd")

	// view cache count
	templateCmd.Bool("count", false, "View the count of how many entries where found", false)

	// Check Command
	checkCmd := argparser.NewCommand("check",
		"to check all available Templates if their syntax is correct", "", false)

	// list, ls Command
	listCmd := argparser.NewCommand("list",
		"list all available templates", "", false, "ls")

	// tags, tag Command
	tagsCmd := argparser.NewCommand("tags",
		"show all tags in the console", "", false, "tag")

	// Tag Search
	tagSearchCmd := argparser.NewCommand("-t",
		"search for tags with the next argument", "", false)

	// BinarySearch
	binarySearchCmd := argparser.NewCommand(
		"-b", "search for executables in path", "", false)

	// Config Path
	configpathCmd := argparser.NewCommand("cp", "Get the path to the global config", "", false)

	// Cache Size Command
	cacheSizeCmd := argparser.NewCommand("cache-size", "Calculates the Size of the Finder Cache and prints it to the console", "", false, "cachesize", "cs")

	root.AddSubcommand(versionCmd)
	root.AddSubcommand(templateCmd)
	root.AddSubcommand(checkCmd)
	root.AddSubcommand(listCmd)
	root.AddSubcommand(tagsCmd)
	root.AddSubcommand(tagSearchCmd)
	root.AddSubcommand(binarySearchCmd)
	root.AddSubcommand(configpathCmd)
	root.AddSubcommand(cacheSizeCmd)

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
	case configpathCmd:
		fmt.Printf("%s\n", path+"/"+"config.json5")
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

	case cacheSizeCmd:
		{
			path, err := cache.GetCachePath()
			if err != nil {
				fmt.Println("Error getting cache path:", err)
				os.Exit(1)
			}

			size, err := fsd.DirSize(path)
			if err != nil {
				fmt.Println("Error calculating cache size:", err)
				os.Exit(1)
			}

			// Optional JSON output via the global -j/--json flag.
			if finderconfig.OutputType == "json" {
				fmt.Printf("{\"cache_size_bytes\": %d, \"cache_size_mb\": %.2f}\n", size, float64(size)/(1024*1024))
			} else {
				fmt.Printf("Cache Size: %.2f MB\n", float64(size)/(1024*1024))
			}
			os.Exit(0)
		}

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
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), config.CreateCacheDB, cmd.GetBool("count"))
	default:
		if len(cmd.Args) <= 0 {
			Banner()
			root.PrintHelp()
			return
		}

		// Search the Template
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), config.CreateCacheDB, cmd.GetBool("count"))
	}
}
