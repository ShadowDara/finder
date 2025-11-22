package cli

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/cli/color"
	"github.com/shadowdara/finder/loader"
	"github.com/shadowdara/finder/search"
	"github.com/shadowdara/finder/structure"
	"github.com/shadowdara/finder/templates"

	"log"
)

const version = "0.1.0"

func Handle_command(args []string) {
	fmt.Printf("%sStruct Finder v%s%s\n", color.Green, version, color.Reset)

	// System Argument Check
	if len(os.Args) < 2 {
		fmt.Printf("%sPlease start with atleast one argument or start with help.%s", color.Red, color.Reset)
		return
	}

	// Help Message
	if os.Args[1] == "help" {
		printHelp()
		return
	}

	if len(os.Args) >= 3 {
		if os.Args[1] == "-f" {
			// Load Custom JSON File
			fmt.Println("Load Custom JSON File")

			// Check for file
			content, err := loader.LoadFile(os.Args[2])
			if err != nil {
				panic(err)
			}

			// Use Content as JSON
			search.Find(structure.LoadJSON5(content))

			// End After
			return
		} else if os.Args[1] == "-c" {
			// Load JSON from Argh
			fmt.Println("Load JSON from the Command Line Argument")

			// Use Argh 2
			search.Find(structure.LoadJSON5(os.Args[2]))

			// End After
			return
		}
	}

	// Load Arg 1
	data, err := templates.JSONtemplateLoader(os.Args[1])
	if err != nil {
		log.Fatalf("%sCould not read the JSON File%s", color.Red, color.Reset)
	}

	// Search the struct
	fmt.Printf("Searchin for %s\n", os.Args[1])
	search.Find(structure.LoadJSON5(string(data)))
}

// Function to print a Help Message
func printHelp() {
	fmt.Println("Help for Finder")
	fmt.Println("Check for more Infos: ")
	fmt.Println("https://github.com/ShadowDara/finder")
}
