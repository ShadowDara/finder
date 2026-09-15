package cli

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"text/tabwriter"

	"github.com/shadowdara/finder/internal/cache"
	"github.com/shadowdara/finder/internal/cache/db"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/loader"
	"github.com/shadowdara/finder/internal/search"
	"github.com/shadowdara/finder/internal/structure"
	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/color"
	"github.com/shadowdara/finder/pub/goansi"
	"github.com/shadowdara/finder/pub/json5"
)

// Function to search for a Template
func Search(searchTemplate string, OutputType string, Verbose bool, createCache bool, useCache bool, createCacheDB bool, cachecount bool) error {
	if useCache {
		data, err := cache.LoadCache(searchTemplate)
		if err != nil {
			fmt.Println("Could not load the cache")
			return err
		}

		PrintResults(data.Paths, OutputType, cachecount)

		return nil
	}

	if Verbose {
		fmt.Printf("%sStruct Finder %s%s - Buildtime: %s\n", color.Green, finderversion.Version, color.Reset, finderversion.BuildTime)
	}

	searchTemplate = ResolveAlias(searchTemplate)

	// Load all templates (built-in + custom)
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	templateName := searchTemplate
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

	if OutputType != "clear" && OutputType != "json" {
		fmt.Printf("Searching for %s ...\n", templateName)
	}
	matches := search.Find(structure.LoadJSON5(string(data)), OutputType, templateName, createCache)
	PrintResults(matches, OutputType, cachecount)

	// Safe Git Database
	if createCacheDB {
		db.SaveDB()
		if OutputType != "clear" && OutputType != "json" {
			fmt.Println("Saved Git Cache DB")
		}
	}

	return nil
}

func PrintResults(matches []string, OutputType string, count bool) {
	if count {
		switch OutputType {
		case "json":
			{
				fmt.Printf("{\"count\": %d}\n", len(matches))
			}
		default:
			{
				fmt.Printf("%d", len(matches))
			}
		}

		return
	}

	// Print
	switch OutputType {
	case "normal":
		fmt.Println("# Found:")
		for _, m := range matches {
			fmt.Println(m)
		}
		fmt.Println("# End of the List")
	case "json":
		enc := json.NewEncoder(os.Stdout)
		if err := enc.Encode(matches); err != nil {
			fmt.Println("JSON encoding error:", err)
		}
	case "clear":
		for _, m := range matches {
			fmt.Println(m)
		}
	}
}

// Function to search for tags
func TagSearch(searchTag string, OutputType string, Verbose bool) error {
	if Verbose {
		fmt.Printf("%sStruct Finder v%s%s\n", color.Green, finderversion.Version, color.Reset)
		fmt.Printf("Searching for templates with tag '%s'...\n", searchTag)
	}

	// Load all templates
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Find templates with the requested tag
	matchingTemplates := []struct {
		name   string
		tags   []string
		source string
	}{}

	for _, templ := range templateNames {
		// Try to load with user templates first
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			if Verbose {
				fmt.Printf("%sWarning: Could not load template '%s'%s\n", color.Yellow, templ, color.Reset)
			}
			continue
		}

		folder := structure.LoadJSON5(string(data))

		// Check if this template has the searched tag
		for _, tag := range folder.Tags {
			if tag == searchTag {
				source := "Built-in"
				if _, isCustom := userTemplates[templ]; isCustom {
					source = "Custom"
				}

				matchingTemplates = append(matchingTemplates, struct {
					name   string
					tags   []string
					source string
				}{
					name:   templ,
					tags:   folder.Tags,
					source: source,
				})
				break
			}
		}
	}

	// Display results
	if len(matchingTemplates) == 0 {
		fmt.Printf("%sNo templates found with tag '%s'%s\n", color.Yellow, searchTag, color.Reset)
		return nil
	}

	if OutputType == "json" {
		// JSON output
		fmt.Printf("[")
		for i, tmpl := range matchingTemplates {
			if i > 0 {
				fmt.Printf(",")
			}
			fmt.Printf(`{"name":"%s","tags":[`, tmpl.name)
			for j, tag := range tmpl.tags {
				if j > 0 {
					fmt.Printf(",")
				}
				fmt.Printf(`"%s"`, tag)
			}
			fmt.Printf(`],"source":"%s"}`, tmpl.source)
		}
		fmt.Printf("]\n")
	} else {
		// Normal output
		fmt.Printf("%sTemplates with tag '%s' (%d found):%s\n", color.Green, searchTag, len(matchingTemplates), color.Reset)
		fmt.Println()

		w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
		fmt.Fprintf(w, "%sTemplate%s\tTags\t%sSource%s\n",
			color.Yellow, color.Reset, color.Yellow, color.Reset)

		for _, tmpl := range matchingTemplates {
			// Tags als kommagetrennten String bauen
			tagStr := ""
			for i, tag := range tmpl.tags {
				if i > 0 {
					tagStr += ", "
				}
				tagStr += tag
			}

			// Source einfärben
			var sourceColor string
			if tmpl.source == "Custom" {
				sourceColor = fmt.Sprintf("%s%s%s", color.Green, tmpl.source, color.Reset)
			} else {
				sourceColor = fmt.Sprintf("%s%s%s", color.Cyan, tmpl.source, color.Reset)
			}

			// Ausgabe
			fmt.Fprintf(
				w,
				"%s%s%s\t%s\t%s\n",
				color.Cyan,
				tmpl.name,
				color.Reset,
				tagStr,
				sourceColor,
			)
		}

		w.Flush()
	}

	return nil
}

// handleCheck validates all templates
func Check() error {

	fmt.Println("Checking all Templates ...")

	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	installedTemplates, err := templates.LoadInstalledTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatecount := len(templateNames)
	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// use tabwriter to align columns
	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	fmt.Fprintf(w, "%sName%s\t%sSource%s\tDescription\n", goansi.WHITE, goansi.END, goansi.WHITE, goansi.END)

	failed := false
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
			failed = true
			continue
		}

		// Parse manually instead of structure.LoadJSON5 (which would
		// log.Fatalf and abort the whole check without telling us
		// which template failed and why).
		validJSON := json.Valid(data)
		normalized := string(data)
		if !validJSON {
			normalized = json5.PreprocessJSON5(normalized)
		}

		var folder structure.Folder
		if err := json.Unmarshal([]byte(normalized), &folder); err != nil {
			fmt.Fprintf(w, "%s%s (ERROR)%s\t%s%s%s\n",
				color.Red, templ, color.Reset,
				"Error parsing: ", err, color.Reset)
			failed = true
			continue
		}

		if err := folder.Files.Validate(); err != nil {
			fmt.Fprintf(w, "%s%s (ERROR)%s\t%s%s%s\n",
				color.Red, templ, color.Reset,
				"Invalid template: ", err, color.Reset)
			failed = true
			continue
		}

		// Determine source (built-in / installed / custom)
		source := goansi.WHITE + "Built-in" + goansi.END
		if _, isInstalled := installedTemplates[templ]; isInstalled {
			source = fmt.Sprintf("%sInstalled%s", color.Magenta, color.Reset)
		} else if _, isCustom := userTemplates[templ]; isCustom {
			source = fmt.Sprintf("%sCustom%s", color.Green, color.Reset)
		}

		fmt.Fprintf(w, "%s%s%s\t%s\t%s\n", color.Cyan, templ,
			color.Reset, source, folder.Description)
	}

	w.Flush()

	if failed {
		fmt.Printf("%sFinished Checking with Errors!%s\n", color.Red, color.Reset)
		os.Exit(1)
	}
	fmt.Printf("%sFinished Checking!%s\n", color.Green, color.Reset)
	return nil
}

// Validate checks a single finder template file for correctness.
// The file can be passed as a path (relative or absolute) or as a
// template name (built-in or custom). If the file is not valid JSON
// but becomes valid after the JSON5 preprocessing step, a warning is
// printed to inform the user that the template depends on the JSON5
// preprocessor.
//
// OutputType controls the result format: "json" produces a single
// machine readable JSON object on stdout, any other value produces the
// human readable table. In JSON mode the process still exits non-zero
// if any template failed validation.
func Validate(args []string, OutputType string) error {
	templatecount := len(args)
	if OutputType != "json" {
		fmt.Printf("%sValidating %d Template(s)%s\n", color.Yellow, templatecount, color.Reset)
	}

	if templatecount <= 0 {
		if OutputType == "json" {
			out := struct {
				Valid bool   `json:"valid"`
				Count int    `json:"count"`
				Error string `json:"error"`
				Usage string `json:"usage"`
			}{
				Valid: false,
				Count: 0,
				Error: "no templates given",
				Usage: "finder validate <template-file-or-name> [more files ...]",
			}
			json.NewEncoder(os.Stdout).Encode(out)
			os.Exit(1)
		}
		fmt.Println("Usage: finder validate <template-file-or-name> [more files ...]")
		return nil
	}

	// Load user templates so custom template names can be resolved and
	// so we can detect whether a name refers to a built-in template.
	_, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	installedTemplates, err := templates.LoadInstalledTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	failed := false
	// result of a single template validation
	type validateResult struct {
		File    string `json:"file"`
		Source  string `json:"source"`
		Valid   bool   `json:"valid"`
		Error   string `json:"error,omitempty"`
		JSON5   bool   `json:"json5,omitempty"` // true when JSON5 preprocessor was needed
		Warning string `json:"warning,omitempty"`
	}
	results := []validateResult{}

	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	if OutputType != "json" {
		fmt.Fprintf(w, "%sFile%s\t%sResult%s\tWarning\n", goansi.WHITE, goansi.END, goansi.WHITE, goansi.END)
	}

	for _, arg := range args {
		// The template name can contain sub-paths like
		// `localhost_8765/test/template` (installed templates).
		// Resolve an alias before any filesystem/template lookup.
		resolved := ResolveAlias(arg)
		name := resolved
		name = templates.TrimTemplateExt(name)
		displayName := arg
		if resolved != arg {
			displayName = fmt.Sprintf("%s -> %s", arg, resolved)
		}
		res := validateResult{File: displayName}

		// Resolve the template contents: prefer a file on disk
		// (path given), otherwise fall back to built-in/custom
		// template lookup by name.
		var data []byte
		fromName := false
		if _, err := os.Stat(arg); err == nil {
			data, err = os.ReadFile(arg)
			if err != nil {
				res.Valid = false
				res.Error = fmt.Sprintf("error reading: %v", err)
				results = append(results, res)
				if OutputType != "json" {
					fmt.Fprintf(w, "%s%s%s\t%sError reading: %v%s\t%s\n", color.Red, displayName, color.Reset, color.Red, err, color.Reset, "---")
				}
				failed = true
				continue
			}
		} else {
			data, err = templates.JSONtemplateLoaderWithUserTemplates(name, userTemplates)
			if err != nil {
				res.Valid = false
				res.Error = fmt.Sprintf("not found: %v", err)
				results = append(results, res)
				if OutputType != "json" {
					fmt.Fprintf(w, "%s%s%s\t%sNOT FOUND%s\t%s\n", color.Red, displayName, color.Reset, color.Red, err, color.Reset)
				}
				failed = true
				continue
			}
			fromName = true
		}

		content := string(data)

		// Check whether the raw content is valid JSON (no JSON5 preprocessor needed)
		validJSON := json.Valid([]byte(content))

		// Load into the folder structure to catch schema/validation
		// errors. We unmarshal manually (instead of structure.LoadJSON5,
		// which would log.Fatalf on bad input and abort the whole
		// command) so every file gets reported.
		normalized := content
		if !validJSON {
			normalized = json5.PreprocessJSON5(content)
		}

		var folder structure.Folder
		if err := json.Unmarshal([]byte(normalized), &folder); err != nil {
			res.Valid = false
			res.Error = err.Error()
			results = append(results, res)
			if OutputType != "json" {
				fmt.Fprintf(w, "%s%s%s\t%sINVALID%s\t%s%v%s\n", color.Red, displayName, color.Reset, color.Red, color.Reset, "---", err, color.Reset)
			}
			failed = true
			continue
		}

		if err := folder.Files.Validate(); err != nil {
			res.Valid = false
			res.Error = err.Error()
			results = append(results, res)
			if OutputType != "json" {
				fmt.Fprintf(w, "%s%s%s\t%sINVALID%s\t%s%v%s\n", color.Red, displayName, color.Reset, color.Red, color.Reset, "---", err, color.Reset)
			}
			failed = true
			continue
		}

		source := "Built-in"
		if fromName {
			if _, isInstalled := installedTemplates[name]; isInstalled {
				source = "Installed"
			} else if _, isCustom := userTemplates[name]; isCustom {
				source = "Custom"
			}
		} else {
			source = "File"
		}

		warning := ""
		if !validJSON {
			warning = "Template is not plain JSON - it needs the JSON5 preprocessor to be parsed"
		}

		res.Valid = true
		res.Source = source
		res.JSON5 = !validJSON
		res.Warning = warning
		results = append(results, res)

		if OutputType != "json" {
			fmt.Fprintf(w, "%s%s%s\t%sOK%s (%s)\t%s%s%s\n",
				color.Cyan, displayName, color.Reset,
				color.Green, color.Reset, source,
				color.Yellow, warning, color.Reset)
		}
	}

	if OutputType == "json" {
		// Single JSON object on stdout (machine readable).
		out := struct {
			Valid   bool             `json:"valid"`
			Count   int              `json:"count"`
			Results []validateResult `json:"results"`
		}{
			Valid:   !failed,
			Count:   len(results),
			Results: results,
		}
		if err := json.NewEncoder(os.Stdout).Encode(out); err != nil {
			fmt.Println("JSON encoding error:", err)
		}
	} else {
		w.Flush()
	}

	if failed {
		if OutputType == "json" {
			os.Exit(1)
		}
		fmt.Printf("%sValidation failed!%s\n", color.Red, color.Reset)
		os.Exit(1)
	}

	if OutputType != "json" {
		fmt.Printf("%sValidation complete. All Templates are valid!%s\n", color.Green, color.Reset)
	}
	return nil
}

// handleList displays all available templates
func List() error {
	fmt.Println("List available Templates:")

	_, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	installedTemplates, err := templates.LoadInstalledTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading installed templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatesList, err := templates.LoadAll()
	if err != nil {
		return fmt.Errorf("error loading templates: %v", err)
	}

	templatecount := len(templatesList)
	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// Separate built-in / custom / installed templates
	builtInTemplates := []string{}
	customTemplates := []string{}
	installedNames := []string{}

	// Installed templates have their own section and are NOT part of
	// the custom templates shown in `finder list`.
	for name := range installedTemplates {
		installedNames = append(installedNames, name)
	}

	for _, templ := range templatesList {
		if _, ok := installedTemplates[templ]; ok {
			continue // shown separately below
		}
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

	// Print installed templates (from `finder install`)
	if len(installedNames) > 0 {
		fmt.Printf("\n%sInstalled Templates (%d):%s\n", color.Green, len(installedNames), color.Reset)
		for _, templ := range installedNames {
			fmt.Printf("  %s%s%s  (from ~/.finder/installed/templates/)\n", color.Magenta, templ, color.Reset)
		}
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

// handleTags displays available tags or processes tag-related operations
func Tags() error {
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
			fmt.Printf("%s%s (ERROR)%s\t%s\t%s\n", color.Red,
				templ, color.Reset, "Error loading", "---")
			continue
		}

		folder := structure.LoadJSON5(string(data))

		for _, tag := range folder.Tags {
			if !contains(tags, tag) {
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
