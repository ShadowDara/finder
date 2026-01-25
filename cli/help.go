package cli

import (
	"fmt"
)

// Function to print help to the Terminal
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
