package cli

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/cli/color"
	"github.com/shadowdara/finder/search"
	"github.com/shadowdara/finder/structure"
	"github.com/shadowdara/finder/templates"

	"log"
)

func Handle_command(args []string) {
	fmt.Printf("%sStruct Finder%s\n", color.Green, color.Reset)

	// System Argument Check
	if len(os.Args) < 2 {
		fmt.Printf("%sPlease start with one argument atleast or start with help.%s", color.Red, color.Reset)
		return
	}

	// Help Message
	if os.Args[1] == "help" {
		printHelp()
	}

	if len(os.Args) < 3 {
		if os.Args[1] == "custom" {
			// Load Custom JSON File
			// search.Find()

			// Check for file

			// Use as JSON Source
			search.Find(structure.LoadJSON5(os.Args[2]))
		}
	}

	// Load Arg 1
	data, err := templates.JSONtemplateLoader(os.Args[1])
	if err != nil {
		log.Printf("%sCould not read the JSON File%s", color.Red, color.Reset)
	}

	// Search the struct
	fmt.Printf("Searchin for %s\n", os.Args[1])
	search.Find(structure.LoadJSON5(string(data)))
}

// Function to print a Help Message
func printHelp() {
	fmt.Println("Help for Finder")
	fmt.Println("Check: ")
	fmt.Println("https://github.com/ShadowDara/finder")
}
