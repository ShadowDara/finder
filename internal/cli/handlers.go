package cli

import (
	"fmt"
	"log"
	"os"
	"text/tabwriter"

	"github.com/shadowdara/finder/internal/loader"
	"github.com/shadowdara/finder/internal/search"
	"github.com/shadowdara/finder/internal/structure"
	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/internal/cli/color"
)


// HandlerFunc is the signature for command handlers
type HandlerFunc func(opts *CLIOptions) error


// handleHelp displays the help information
func handleHelp(opts *CLIOptions) error {
	printHelp()
	return nil
}


// handleList displays all available templates
func handleList(opts *CLIOptions) error {
	fmt.Println("List available Templates:")

	_, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatesList, err := templates.LoadAll()
	if err != nil {
		return fmt.Errorf("error loading templates: %v", err)
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

	return nil
}


// handleCheck validates all templates
func handleCheck(opts *CLIOptions) error {
	fmt.Println("Checking all Templates ...")

	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatecount := len(templateNames)
	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// use tabwriter to align columns
	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	fmt.Fprintln(w, "Name\tDescription\tSource")

	for _, templ := range templateNames {
		// Check for blocked templates
		blockednames := loader.GetBlockedTemplateNames()
		if _, isBlocked := blockednames[templ]; isBlocked {
			fmt.Fprintf(w, "%s%s (BLOCKED)%s\t%s\t%s\n", color.Red, templ, color.Reset, "---", "---")
			continue
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
	return nil
}


// handleFileLoad loads a custom JSON/JSON5 file
func handleFileLoad(opts *CLIOptions) error {
	filePath, err := opts.GetFileArg()
	if err != nil {
		return err
	}

	fmt.Println("Loading custom JSON file...")
	content, err := loader.LoadFile(filePath)
	if err != nil {
		return fmt.Errorf("error loading file: %v", err)
	}

	search.Find(structure.LoadJSON5(content), opts.OutputType)
	return nil
}


// handleDirectLoad loads JSON directly from command-line argument
func handleDirectLoad(opts *CLIOptions) error {
	jsonStr, err := opts.GetDirectLoadArg()
	if err != nil {
		return err
	}

	fmt.Println("Loading JSON from command-line argument...")
	search.Find(structure.LoadJSON5(jsonStr), opts.OutputType)
	return nil
}


// handleTemplateSearch loads and searches a template by name
func handleTemplateSearch(opts *CLIOptions) error {
	templateName := opts.GetTemplateName()

	// Load all templates (built-in + custom)
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		log.Fatalf("%sCould not load templates: %v%s\n", color.Red, err, color.Reset)
	}

	// Try to load with user templates first (they can override built-in ones)
	data, err := templates.JSONtemplateLoaderWithUserTemplates(templateName, userTemplates)
	if err != nil {
		// Template not found - provide helpful error message
		fmt.Printf("%sTemplate '%s' not found.%s\n", color.Red, templateName, color.Reset)
		fmt.Printf("Available templates: %s\n", color.Yellow)
		for i, t := range templateNames {
			if i > 0 {
				fmt.Print(", ")
			}
			fmt.Print(t)
		}
		fmt.Printf("%s\n", color.Reset)
		return nil
	}

	if opts.OutputType != "clear" {
		fmt.Printf("Searching for %s ...\n", templateName)
	}
	search.Find(structure.LoadJSON5(string(data)), opts.OutputType)
	return nil
}


// handleTags displays available tags or processes tag-related operations
func handleTags(opts *CLIOptions) error {
    if opts.Verbose {
        fmt.Println("Tags command - listing all available tags...")
    }

    // LOAD ALL TEMPLATES

	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Save all available tags to an tags array

	var tags []string = []string{}

	for _, templ := range templateNames {
		// Try to load with user templates first
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			fmt.Printf("%s%s (ERROR)%s\t%s\t%s\n", color.Red, templ, color.Reset, "Error loading", "---")
			continue
		}

		folder := structure.LoadJSON5(string(data))

		for _, tag := range folder.Tags {
			if (!contains(tags, tag)) {
				tags = append(tags, tag)
			}
		}
	}

	fmt.Println("Available Tags:")

	for _, tag := range tags {
		fmt.Printf(" - %s\n", tag)
	}

	// Print the tags array

    return nil
}


// Contains helper function
func contains(slice []string, s string) bool {
   	for _, v := range slice {
       	if v == s {
           	return true
       	}
   	}
   	return false
}
