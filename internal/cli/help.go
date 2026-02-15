package cli

import (
	"fmt"
	"github.com/shadowdara/finder/internal/loader"

	"os"
	"text/tabwriter"
)

// printHelp writes a short usage help page to stdout. It is intentionally
// simple and human-focused; for automated help extraction one could add
// structured flags in the future.
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
	
	blockednames := loader.GetBlockedTemplateNames()

	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)

	for k, v := range blockednames {
		fmt.Fprintf(w, "  - %s\t%s\n", k, v)
	}

	w.Flush()
}
