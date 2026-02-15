package cli

import (
	"fmt"
	"log"
	"os"
	"text/tabwriter"

	"github.com/shadowdara/finder/internal/cli/color"
	"github.com/shadowdara/finder/internal/loader"
	"github.com/shadowdara/finder/internal/search"
	"github.com/shadowdara/finder/internal/structure"
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
	// Load user templates and attempt to find the requested template
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		log.Fatalf("%sCould not load templates: %v%s\n", color.Red, err, color.Reset)
	}

	// Try to load with user templates first (they can override built-in ones)
	data, err := templates.JSONtemplateLoaderWithUserTemplates(args[1], userTemplates)
	if err != nil {
		// Template not found - provide helpful error message
		fmt.Printf("%sTemplate '%s' not found.%s\n", color.Red, args[1], color.Reset)
		fmt.Printf("Available templates: %s\n", color.Yellow)
		for i, t := range templateNames {
			if i > 0 {
				fmt.Print(", ")
			}
			fmt.Print(t)
		}
		fmt.Printf("%s\n", color.Reset)
		return
	}

	if outputtype != "clear" {
		fmt.Printf("Searching for %s ...\n", args[1])
	}
	search.Find(structure.LoadJSON5(string(data)), outputtype)
}

// list prints available built-in and custom templates, showing where they're
// loaded from and distinguishing between built-in and user-defined templates.
func list() {
	fmt.Println("List available Templates:")

	_, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatesList, err := templates.LoadAll()
	if err != nil {
		fmt.Println("Error loading templates!")
		return
	}

	templatecount := len(templatesList)

	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// Separate built-in from custom templates
	builtInTemplates := []string{}
	customTemplates := []string{}

	for _, templ := range templatesList {
		if _, isCustom := userTemplates[templ]; isCustom {
			customTemplates = append(customTemplates, templ)
		} else {
			builtInTemplates = append(builtInTemplates, templ)
		}
	}

	// Print built-in templates
	fmt.Printf("%sBuilt-in Templates (%d):%s\n", color.Green, len(builtInTemplates), color.Reset)
	for _, templ := range builtInTemplates {
		fmt.Printf("  %s%s%s\n", color.Cyan, templ, color.Reset)
	}

	// Print custom templates if any
	if len(customTemplates) > 0 {
		fmt.Printf("\n%sCustom Templates (%d):%s\n", color.Green, len(customTemplates), color.Reset)
		for _, templ := range customTemplates {
			fmt.Printf("  %s%s%s  (from ~/.finder/templates/ or ./.finder/templates/)\n", color.Cyan, templ, color.Reset)
		}
		fmt.Printf("\n%sHint:%s Place your custom templates in:\n", color.Yellow, color.Reset)
		fmt.Printf("  - $HOME/.finder/templates/\n")
		fmt.Printf("  - ./.finder/templates/\n")
	} else {
		fmt.Printf("\n%sNo custom templates found. Add them to:~/.finder/templates/ or ./.finder/templates/%s\n", color.Yellow, color.Reset)
	}
}

// check parses all built-in and custom templates to validate that the JSON5
// loader accepts them (useful for debugging or CI checks).
func check() {
	fmt.Println("Checking all Templates ...")

	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatecount := len(templateNames)

	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// use tabwriter to align columns instead of manual tabs
	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	fmt.Fprintln(w, "Name\tDescription\tSource")
	
	for _, templ := range templateNames {
		// Check for blocked Templated by the blocked names
		blockednames := loader.GetBlockedTemplateNames()

		for k := range blockednames {
			if templ == k {
				fmt.Fprintf(w, "%s%s (BLOCKED)%s\t%s\t%s\n", color.Red, templ, color.Reset, "---", "---")
				continue
			}
		}

		// Try to load with user templates first
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			fmt.Fprintf(w, "%s%s (ERROR)%s\t%s\t%s\n", color.Red, templ, color.Reset, "Error loading", "---")
			continue
		}

		folder := structure.LoadJSON5(string(data))
		
		// Determine source (built-in or custom)
		source := "Built-in"
		if _, isCustom := userTemplates[templ]; isCustom {
			source = fmt.Sprintf("%sCustom%s", color.Green, color.Reset)
		}

		fmt.Fprintf(w, "%s%s%s\t%s\t%s\n", color.Cyan, templ, color.Reset, folder.Description, source)
	}

	w.Flush()
	fmt.Printf("%sFinished Checking!%s\n", color.Green, color.Reset)
}
