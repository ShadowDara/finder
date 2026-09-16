// Package cli implements the command-line interface of the Finder project.
//
// This package is used ONLY by the main binary (cmd/finder) — not by
// findergen, csf, or tester.
//
// Responsibilities:
//   - Parse CLI arguments (via pub/argparser)
//   - Dispatch subcommands (search, check, list, validate, install, ...)
//   - Load the configuration from ~/.finder/config.json5
//   - Print results in different formats (normal/json/clear)
//
// The file commands.go contains the argument parsing and dispatch,
// while handle.go provides the actual command implementations.
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

// HandleCommand is the main entry point for CLI processing.
//
// Called from cmd/finder/main.go with os.Args.
// The function:
//  1. Creates an empty config structure (config.NewConfig)
//  2. Loads the user-defined config from ~/.finder/config.json5
//  3. Defines all subcommands and options with the argparser
//  4. Parses the arguments and dispatches to the matching handler function
//
// Flow: args → argparser.Parse → switch on cmd → handler function
func HandleCommand(args []string) {
	// Default settings — overridden by the config file and CLI flags
	var finderconfig config.Config

	// Initialize config with defaults (OutputType="normal", Cache=false, etc.)
	finderconfig = config.NewConfig()

	// Resolve the user root path (~/.finder/ or ./.finder/).
	// All user-defined data (templates, config, lockfile) lives there.
	path, err := templates.GetCustomPath()
	if err != nil {
		log.Fatalln(err)
	}

	// Load the configuration from config.json5 in the UserRoot.
	// If the file does not exist, defaults are used.
	config := config.LoadConfig(path + "/" + "config.json5")

	// === Build the command tree ===
	// root is the top-level command ("finder"). All other commands
	// are registered as subcommands beneath it.
	root := argparser.NewCommand("finder",
		"a simple go program to find your files via file structures", "Check out github for more infos or the finder website:\nhttps://github.com/shadowdara/finder\nhttps://shadowdara.github.io/finder", false)

	// Global boolean options — apply to ALL subcommands.
	// "-j" / "--json": output as JSON instead of human-readable
	root.GlobalBool("json", false, "Enable JSON Output", "j")

	// "-vv" / "--verbose": additional debug output
	root.GlobalBool("verbose", false, "Enable Verbose Mode", "vv")

	// === Root options (cache management) ===
	// "--create-cache" / "--cc": create a fresh cache of search results
	root.Bool("create-cache", false, "Create the Cache", false, "cc")

	// "--cache" / "--c": use the existing cache instead of searching live
	root.Bool("cache", false, "Use the already existing Cache", false, "c")

	// "--count": show only the number of hits (not the names)
	root.Bool("count", false, "View the count of how many entries where found", false)

	// "--create-cache-db" / "--ccd": create a git database from cache data
	root.Bool("create-cache-db", false, "Create a Git DB from the cache data", false, "ccd")

	// === Register subcommands ===
	// versionCmd: show the Finder version ("finder --version" / "finder v")
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", "", false, "-v", "v", "version")

	// templateCmd: explicit template search ("finder template <name>").
	// Useful when the template name collides with another argument name.
	templateCmd := argparser.NewCommand("template",
		"to search for a template - for the case that the name for a template is overwritten by another argument name",
		"", false, "tpl")

	// Also make the cache options available for templateCmd
	templateCmd.Bool("create-cache", false, "Create the Cache", false, "cc")
	templateCmd.Bool("cache", false, "Use the already existing Cache", false, "c")
	templateCmd.Bool("create-cache-db", false, "Create a Git DB from the cache data", false, "ccd")
	templateCmd.Bool("count", false, "View the count of how many entries where found", false)

	// checkCmd: check ALL available templates for syntax errors
	checkCmd := argparser.NewCommand("check",
		"to check all available Templates if their syntax is correct", "", false)

	// validateCmd: validate a SINGLE template (file path or name)
	validateCmd := argparser.NewCommand("validate",
		"to validate a single finder template file", "", false, "val")

	// listCmd: list all available templates (built-in + custom + installed)
	listCmd := argparser.NewCommand("list",
		"list all available templates", "", false, "ls")

	// tagsCmd: show all tags used across templates
	tagsCmd := argparser.NewCommand("tags",
		"show all tags in the console", "", false, "tag")

	// tagSearchCmd: search for templates with a specific tag ("finder -t node")
	tagSearchCmd := argparser.NewCommand("-t",
		"search for tags with the next argument", "", false)

	// binarySearchCmd: search for executables in the system PATH
	binarySearchCmd := argparser.NewCommand(
		"-b", "search for executables in path", "", false)

	// configpathCmd: show the path to the global configuration file
	configpathCmd := argparser.NewCommand("cp", "Get the path to the global config", "", false)

	// cacheSizeCmd: calculate and print the size of the Finder cache
	cacheSizeCmd := argparser.NewCommand("cache-size", "Calculates the Size of the Finder Cache and prints it to the console", "", false, "cachesize", "cs")

	// installCmd: install a template from the web (URL or registry name)
	installCmd := argparser.NewCommand("install", "Install a template from the web", "", false, "i")

	// listInstalledCmd: list all installed (downloaded) templates
	listInstalledCmd := argparser.NewCommand("list-installed", "List all installed templates", "", false, "installed", "li")

	// uninstallCmd: remove an installed template again
	uninstallCmd := argparser.NewCommand("uninstall", "Uninstall a custom template", "", false, "uni")

	// === Aliases (user-defined short names for templates) ===
	// Aliases are stored in ~/.finder/aliases.json.
	// Example: "finder alias myvue shadowdara.github.io/test/template" → "finder myvue"
	aliasCmd := argparser.NewCommand("alias", "Create an alias for a template (findable via alias)", "", false)
	unaliasCmd := argparser.NewCommand("unalias", "Remove an alias created with alias", "", false, "alias-remove")
	aliasesCmd := argparser.NewCommand("aliases", "List all template aliases", "", false, "alias-list")

	// View COmmand
	// to view a template in the command line
	viewCMD := argparser.NewCommand("view", "View a template in the command line", "", false)

	// Register all subcommands on the root — the argparser then knows
	// the whole command tree and can map the arguments correctly.
	root.AddSubcommand(versionCmd)
	root.AddSubcommand(templateCmd)
	root.AddSubcommand(checkCmd)
	root.AddSubcommand(validateCmd)
	root.AddSubcommand(listCmd)
	root.AddSubcommand(tagsCmd)
	root.AddSubcommand(tagSearchCmd)
	root.AddSubcommand(binarySearchCmd)
	root.AddSubcommand(configpathCmd)
	root.AddSubcommand(cacheSizeCmd)
	root.AddSubcommand(installCmd)
	root.AddSubcommand(listInstalledCmd)
	root.AddSubcommand(uninstallCmd)
	root.AddSubcommand(aliasCmd)
	root.AddSubcommand(unaliasCmd)
	root.AddSubcommand(aliasesCmd)
	root.AddSubcommand(viewCMD)

	// Parse the arguments: args[0] is "finder" itself — pass args[1:]
	// The result is the subcommand that matches the first argument.
	cmd := root.Parse(args[1:])

	// Evaluate global flags — they apply to all subcommands.
	// If "--json" is set, switch output to JSON mode.
	if cmd.GetBool("json") {
		finderconfig.OutputType = "json"
	}

	// Cache flags: if the config still has Cache=false, use the CLI value.
	// Config values take precedence if set in config.json5.
	cachearg := cmd.GetBool("create-cache")
	if !config.Cache {
		config.Cache = cachearg
	}

	// Cache-DB flag: creates a git-based database from the cache.
	cachedbarg := cmd.GetBool("create-cache-db")
	if !config.CreateCacheDB {
		config.CreateCacheDB = cachedbarg
	}

	// === Dispatch: the parsed subcommand is mapped to the matching
	// handler function in handle.go via a switch statement. ===
	switch cmd {
	case configpathCmd:
		fmt.Printf("%s\n", path+"/"+"config.json5")
	case versionCmd:
		// Show the current Finder version (from internal/finderversion)
		fmt.Printf("%s\n", finderversion.Version)
	case checkCmd:
		// Check all templates for syntax errors
		Check()
	case validateCmd:
		// Validate one or more templates — the name or path is passed in
		Validate(cmd.Args, finderconfig.OutputType)
	case listCmd:
		// List all available templates (built-in, installed, custom)
		List()
	case tagsCmd:
		// Show all tags found in templates
		Tags()

	case viewCMD:
		if len(cmd.Args) <= 0 {
			fmt.Errorf("You have to submit a template name after <view>")
		}

		View(cmd.Args[0])

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

			// Optional: JSON output when the global "-j/--json" flag is set
			if finderconfig.OutputType == "json" {
				fmt.Printf("{\"cache_size_bytes\": %d, \"cache_size_mb\": %.2f}\n", size, float64(size)/(1024*1024))
			} else {
				// Human-readable size in megabytes
				fmt.Printf("Cache Size: %.2f MB\n", float64(size)/(1024*1024))
			}
			os.Exit(0)
		}

	case installCmd:
		// Without arguments: install ALL templates from the lockfile (sync)
		if len(cmd.Args) <= 0 {
			if err := InstallAll(); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
			return
		}

		// Install a single template: "finder install <url-or-name>"
		Install(cmd.Args[0])
	case listInstalledCmd:
		// List all installed (downloaded) templates
		ListInstalled()
	case uninstallCmd:
		// Without arguments: remove all installed templates
		if len(cmd.Args) <= 0 {
			if err := UninstallAll(); err != nil {
				fmt.Println(err)
				os.Exit(1)
			}
			return
		}

		// Uninstall a single template: "finder uninstall <name>"
		Uninstall(cmd.Args[0])
	case aliasCmd:
		// Create a new alias: "finder alias myvue shadowdara.github.io/test/template"
		// cmd.Args contains everything after "alias" (PassThrough behavior)
		if len(cmd.Args) < 2 {
			fmt.Println("Usage: finder alias <alias> <template>")
			fmt.Println("  Example: finder alias myvue shadowdara.github.io/test/template")
			fmt.Println("  Then: finder myvue  (resolves to the template)")
			fmt.Println("  Start-Path: finder alias s/ shadowdara.github.io/templates/")
			fmt.Println("  Then: finder s/test  (resolves to shadowdara.github.io/templates/test)")
			return
		}
		if err := AddAlias(cmd.Args[0], cmd.Args[1]); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	case unaliasCmd:
		if len(cmd.Args) <= 0 {
			fmt.Println("Usage: finder unalias <alias>")
			return
		}
		if err := RemoveAlias(cmd.Args[0]); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	case aliasesCmd:
		if err := ListAliases(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	case binarySearchCmd:
		// Binary search: check whether a specific program is available in PATH
		if len(cmd.Args) > 0 {
			binarycheck.CheckAllBinaries(cmd.Args[0])
			return
		} else {
			// No argument → show help
			root.PrintHelp()
			return
		}

	case tagSearchCmd:
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Tag search: find all templates that contain the given tag
		TagSearch(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"))
	case templateCmd:
		// Explicit template search: "finder template <name>"
		if len(cmd.Args) <= 0 {
			root.PrintHelp()
			return
		}

		// Search for the template and find matching folders in the filesystem
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), config.CreateCacheDB, cmd.GetBool("count"))
	default:
		// Default case: if no subcommand was recognized,
		// the first argument is treated as a template name.
		// Without arguments, the banner + help is shown.
		if len(cmd.Args) <= 0 {
			Banner()
			root.PrintHelp()
			return
		}

		// Search for the template (identical to templateCmd)
		Search(cmd.Args[0], finderconfig.OutputType, cmd.GetBool("verbose"), config.Cache, cmd.GetBool("cache"), config.CreateCacheDB, cmd.GetBool("count"))
	}
}
