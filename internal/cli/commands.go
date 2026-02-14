package cli

import (
	"fmt"
	"log"

	"github.com/shadowdara/finder/internal/cli/color"
	"github.com/shadowdara/finder/internal/loader"
	"github.com/shadowdara/finder/internal/search"
	"github.com/shadowdara/finder/pkg/structure"
	"github.com/shadowdara/finder/internal/templates"
)

const version = "0.3.0"

// HandleCommand parses the provided CLI arguments and dispatches the
// requested action. It prints user-facing messages to stdout/stderr and
// uses other packages (templates, loader, structure, search) to perform
// the actual work. The function intentionally operates on a raw
// argument slice so it can be called from tests or a different bootstrap.
func HandleCommand(args []string) {
	// Argument count check
	if len(args) < 2 {
		fmt.Printf("%sPlease provide at least one argument (or use 'help').%s\n",
			color.Red, color.Reset)
		return
	}

	outputtype := "normal"

	for _, arg := range args {
		if arg == "--json" {
			outputtype = "json"
		} else if arg == "--clear" {
			outputtype = "clear"
		}
	}

	if outputtype != "clear" {
		fmt.Printf("%sStruct Finder v%s%s\n", color.Green, version, color.Reset)
	}

	switch args[1] {
	case "help":
		printHelp()
		return
	case "list":
		list()
		return
	case "check":
		check()
		return
	case "-f":
		if len(args) < 3 {
			fmt.Printf("%sMissing file path for -f option.%s\n", color.Red, color.Reset)
			return
		}

		fmt.Println("Loading custom JSON file...")
		content, err := loader.LoadFile(args[2])
		if err != nil {
			fmt.Printf("%sError loading file: %v%s\n", color.Red, err, color.Reset)
			return
		}

		search.Find(structure.LoadJSON5(content), outputtype)
		return
	case "-c":
		if len(args) < 3 {
			fmt.Printf("%sMissing JSON string for -c option.%s\n", color.Red, color.Reset)
			return
		}

		fmt.Println("Loading JSON from command-line argument...")
		search.Find(structure.LoadJSON5(args[2]), outputtype)
		return
	}

	// Default: treat the first argument as a template name
	data, err := templates.JSONtemplateLoader(args[1])
	if err != nil {
		log.Fatalf("%sCould not read JSON template: %v%s\n", color.Red, err, color.Reset)
	}

	if outputtype != "clear" {
		fmt.Printf("Searching for %s ...\n", args[1])
	}
	search.Find(structure.LoadJSON5(string(data)), outputtype)
}

// list prints available built-in templates. Custom templates will be
// loaded from the user configuration directory in the future.
func list() {
	fmt.Println("List available Templates:")

	fmt.Println("Default Templates:")
	templatesList, err := templates.LoadAll()
	if err != nil {
		fmt.Println("Error in the builtin Templates!")
		return
	}
	for _, templ := range templatesList {
		fmt.Printf("%s\t", templ)
	}

	fmt.Println("\nCustom Templates:")
	fmt.Println("soon ...")
}

// check parses all built-in templates to validate that the JSON5 loader
// accepts them (useful for debugging or CI checks).
func check() {
	fmt.Println("Checking all Templates ...")

	fmt.Println("Checking all Default Templates:")
	templateNames, err := templates.LoadAll()
	if err != nil {
		fmt.Println("Error!")
		return
	}
	for _, templ := range templateNames {
		fmt.Printf("%s\t", templ)

		data, err := templates.JSONtemplateLoader(templ)
		if err != nil {
			log.Fatalf("%sCould not read JSON template: %v%s\n", color.Red, err, color.Reset)
		}

		structure.LoadJSON5(string(data))
	}
	fmt.Println("\nFinished Checking!")
}
