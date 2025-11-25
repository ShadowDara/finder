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

const version = "0.1.0"

func HandleCommand(args []string) {
	fmt.Printf("%sStruct Finder v%s%s\n", color.Green, version, color.Reset)

	// Argument count check
	if len(args) < 2 {
		fmt.Printf("%sPlease provide at least one argument (or use 'help').%s\n", color.Red, color.Reset)
		return
	}

	switch args[1] {

	// --------------------------
	// HELP
	// --------------------------
	case "help":
		printHelp()
		return

	// --------------------------
	// LOAD CUSTOM FILE
	// --------------------------
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

		search.Find(structure.LoadJSON5(content))
		return

	// --------------------------
	// JSON DIRECT FROM ARGUMENT
	// --------------------------
	case "-c":
		if len(args) < 3 {
			fmt.Printf("%sMissing JSON string for -c option.%s\n", color.Red, color.Reset)
			return
		}

		fmt.Println("Loading JSON from command-line argument...")
		search.Find(structure.LoadJSON5(args[2]))
		return
	}

	// Default: Treat argument as a template name / file
	data, err := templates.JSONtemplateLoader(args[1])
	if err != nil {
		log.Fatalf("%sCould not read JSON template: %v%s\n", color.Red, err, color.Reset)
	}

	fmt.Printf("Searching for %s...\n", args[1])
	search.Find(structure.LoadJSON5(string(data)))
}

func printHelp() {
	fmt.Println("Finder Help")
	fmt.Println("More info at:")
	fmt.Println("https://github.com/ShadowDara/finder")
	fmt.Println("\nCustom Folder:")
	fmt.Println("Windows → %AppData%\\finder")
	fmt.Println("Linux   → ~/.config/finder")
	fmt.Println("macOS   → ~/Library/Application Support/finder")
}
