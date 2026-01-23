package cli

import (
	"fmt"
	"log"

	"github.com/shadowdara/finder/cli/color"
	"github.com/shadowdara/finder/loader"
	"github.com/shadowdara/finder/search"
	"github.com/shadowdara/finder/structure"
	"github.com/shadowdara/finder/templates"
)

const version = "0.3.0"

func HandleCommand(args []string) {
	// Argument count check
	if len(args) < 2 {
		fmt.Printf("%sPlease provide at least one argument (or use 'help').%s\n",
			color.Red, color.Reset)
		return
	}

	outputtype := "normal"

	for _, arg := range args {
		// JSON
		if arg == "--json" {
			outputtype = "json"

			// Clear
		} else if arg == "--clear" {
			outputtype = "clear"
		}
	}

	if outputtype != "clear" {
		fmt.Printf("%sStruct Finder v%s%s\n",
			color.Green, version, color.Reset)
	}

	switch args[1] {

	// --------------------------
	// HELP
	// --------------------------
	case "help":
		printHelp()
		return

	// --------------------------
	// List all available JSON5 Templates
	// --------------------------
	case "list":
		list()
		return

	// --------------------------
	// Check all available JSON5 Templates
	// --------------------------
	case "check":
		check()
		return

	// --------------------------
	// LOAD CUSTOM FILE
	// --------------------------
	case "-f":
		if len(args) < 3 {
			fmt.Printf("%sMissing file path for -f option.%s\n",
				color.Red, color.Reset)
			return
		}

		fmt.Println("Loading custom JSON file...")
		content, err := loader.LoadFile(args[2])
		if err != nil {
			fmt.Printf("%sError loading file: %v%s\n",
				color.Red, err, color.Reset)
			return
		}

		search.Find(structure.LoadJSON5(content), outputtype)
		return

	// --------------------------
	// JSON DIRECT FROM ARGUMENT
	// --------------------------
	case "-c":
		if len(args) < 3 {
			fmt.Printf("%sMissing JSON string for -c option.%s\n",
				color.Red, color.Reset)
			return
		}

		fmt.Println("Loading JSON from command-line argument...")
		search.Find(structure.LoadJSON5(args[2]), outputtype)
		return
	}

	// Default: Treat argument as a template name / file
	data, err := templates.JSONtemplateLoader(args[1])
	if err != nil {
		log.Fatalf("%sCould not read JSON template: %v%s\n",
			color.Red, err, color.Reset)
	}

	// Searching for the Folderstruct
	if outputtype != "clear" {
		fmt.Printf("Searching for %s ...\n", args[1])
	}
	search.Find(structure.LoadJSON5(string(data)), outputtype)
}

func printHelp() {
	fmt.Println("Finder Help")
	fmt.Println("More info at:")
	fmt.Println("https://github.com/ShadowDara/finder")
	fmt.Println("\nCustom Folder:")
	fmt.Println("  - Windows → %AppData%\\finder")
	fmt.Println("  - Linux   → ~/.config/finder")
	fmt.Println("  - MacOS   → ~/Library/Application Support/finder")
	fmt.Println("\nCommand Line Args")
	fmt.Println("  -f         Load a Custom JSON File")
	fmt.Println("  -c         Load JSON from the next commandline Argument")
	fmt.Println("  --json     Displays the output in the Terminal as JSON")
	fmt.Println("  --clear    Displays the output in the Terminal without any other printing")
	fmt.Println("\nAlready blocked names for templates")
	fmt.Println("  - check    Check all templates if their syntax is correct")
	fmt.Println("  - help     Display this help Message")
	fmt.Println("  - list     List all Templates Files")
}

// TODO
// Open all available Templates and print in the Terminal
func list() {
	fmt.Println("List available Templates:")

	// Default Templates
	fmt.Println("Default Templates:")
	templates, dataerror := templates.LoadAll()
	if dataerror != nil {
		fmt.Println("Error!")
		return
	}
	for _, templ := range templates {
		fmt.Printf("%s\t", templ)
	}

	// Custom Templates
	fmt.Println("\nCustom Templates:")
	fmt.Println("soon")
}

// TODO
// Open All available Templates and load them and check if the JSON Loader
// crashes
func check() {
	fmt.Println("Checking all Templates ...")

	// Checking Default Templates
	fmt.Println("Checking Default Templates:")
	template, dataerror := templates.LoadAll()
	if dataerror != nil {
		fmt.Println("Error!")
		return
	}
	for _, templ := range template {
		fmt.Printf("%s\t", templ)

		// Default: Treat argument as a template name / file
		data, err := templates.JSONtemplateLoader(templ)
		if err != nil {
			log.Fatalf("%sCould not read JSON template: %v%s\n",
				color.Red, err, color.Reset)
		}

		structure.LoadJSON5(string(data))
	}
}
