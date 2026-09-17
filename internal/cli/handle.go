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

// View a Template
func View(searchTemplate string) string {
	// Replace the template name with a user-defined alias, if present
	searchTemplate = ResolveAlias(searchTemplate)

	// Load all template names (built-in + custom) — used for error output
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	templateName := searchTemplate
	if err != nil {
		log.Fatalf("%sCould not load templates: %v%s\n", color.Red, err, color.Reset)
	}

	// Load the template — user templates take precedence over built-ins
	data, err := templates.JSONtemplateLoaderWithUserTemplates(templateName, userTemplates)
	if err != nil {
		// Template not found: helpful error message listing all available templates
		fmt.Printf("%sTemplate '%s' not found.%s\n", color.Red, templateName, color.Reset)
		fmt.Printf("Available templates: %s\n", color.Yellow)
		for i, t := range templateNames {
			if i > 0 {
				fmt.Print(", ")
			}
			fmt.Print(t)
		}
		fmt.Printf("%s\n", color.Reset)
		return ""
	}

	return string(data)

}

// Search is the main search function: it searches the filesystem for
// folders that match the given template.
//
// Flow:
//  1. Load cache if useCache is set → no live search needed
//  2. Resolve the template name alias (if any)
//  3. Load template data (built-in + user templates, user takes precedence)
//  4. Execute search.Find() and print the results
//  5. Optionally create a cache or git database
//
// Parameters:
//   - searchTemplate: name of the template to search for
//   - OutputType: "normal", "clear" or "json"
//   - Verbose: show additional debug output
//   - createCache: save the search result as cache
//   - useCache: load the existing cache instead of searching
//   - createCacheDB: create a git database from the cache
//   - cachecount: print only the number of hits
func Search(searchTemplate string, OutputType string, Verbose bool, createCache bool, useCache bool, createCacheDB bool, cachecount bool) error {
	// Cache mode: no live search, load the data from the cache instead
	if useCache {
		data, err := cache.LoadCache(searchTemplate)
		if err != nil {
			fmt.Println("Could not load the cache")
			return err
		}

		PrintResults(data.Paths, OutputType, cachecount)

		return nil
	}

	// In verbose mode show additional program information
	if Verbose {
		fmt.Printf("%sStruct Finder %s%s - Buildtime: %s\n", color.Green, finderversion.Version, color.Reset, finderversion.BuildTime)
	}

	// Replace the template name with a user-defined alias, if present
	searchTemplate = ResolveAlias(searchTemplate)

	// Load all template names (built-in + custom) — used for error output
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	templateName := searchTemplate
	if err != nil {
		log.Fatalf("%sCould not load templates: %v%s\n", color.Red, err, color.Reset)
	}

	// Load the template — user templates take precedence over built-ins
	data, err := templates.JSONtemplateLoaderWithUserTemplates(templateName, userTemplates)
	if err != nil {
		// Template not found: helpful error message listing all available templates
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

	// Show a status message only for "normal" output
	// ("clear" and "json" produce pure machine output)
	if OutputType != "clear" && OutputType != "json" {
		fmt.Printf("Searching for %s ...\n", templateName)
	}

	// Live search in the filesystem: parse the structure and find matching folders
	matches := search.Find(structure.LoadJSON5(string(data)), OutputType, templateName, createCache)
	PrintResults(matches, OutputType, cachecount)

	// Optional: save the git cache database ("--create-cache-db")
	if createCacheDB {
		db.SaveDB()
		if OutputType != "clear" && OutputType != "json" {
			fmt.Println("Saved Git Cache DB")
		}
	}

	return nil
}

// PrintResults prints a list of found paths in the requested format.
//
// Formats:
//   - count=true: only the number of hits ("5" or {"count":5} for JSON)
//   - "normal": headed/footed list with "# Found:" / "# End of the List"
//   - "json":   JSON array of the found paths (escape-safe via encoder)
//   - "clear":  plain path list without decorations (for shell pipelines)
func PrintResults(matches []string, OutputType string, count bool) {
	// Print only the hit count when the "--count" flag is set
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

	// Print the full list in the matching format
	switch OutputType {
	case "normal":
		fmt.Println("# Found:")
		for _, m := range matches {
			fmt.Println(m)
		}
		fmt.Println("# End of the List")
	case "json":
		// Use the JSON encoder so strings are properly quoted/escaped
		enc := json.NewEncoder(os.Stdout)
		if err := enc.Encode(matches); err != nil {
			fmt.Println("JSON encoding error:", err)
		}
	case "clear":
		// Plain path output (one path per line, no markers)
		for _, m := range matches {
			fmt.Println(m)
		}
	}
}

// TagSearch finds all templates that contain a specific tag and shows
// them in a table (template name, tags, source).
//
// With OutputType="json" a JSON array of the hits is printed instead;
// the JSON mode is suitable for scripts.
func TagSearch(searchTag string, OutputType string, Verbose bool) error {
	// Verbose: show version and search status
	if Verbose {
		fmt.Printf("%sStruct Finder v%s%s\n", color.Green, finderversion.Version, color.Reset)
		fmt.Printf("Searching for templates with tag '%s'...\n", searchTag)
	}

	// Load all templates (built-in + custom)
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Result list: template name, tags and source (Built-in/Custom)
	matchingTemplates := []struct {
		name   string
		tags   []string
		source string
	}{}

	// Check each template whether it contains the searched tag
	for _, templ := range templateNames {
		// Load the template (user templates take precedence)
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			if Verbose {
				fmt.Printf("%sWarning: Could not load template '%s'%s\n", color.Yellow, templ, color.Reset)
			}
			continue
		}

		// Load the template structure to read its tags
		folder := structure.LoadJSON5(string(data))

		// Check whether one of the tags matches the searched one
		for _, tag := range folder.Tags {
			if tag == searchTag {
				source := "Built-in"
				if _, isCustom := userTemplates[templ]; isCustom {
					source = "Custom"
				}

				// Add the hit to the result list and
				// end the inner loop (only once per template)
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

	// No hits: print a hint instead of an error
	if len(matchingTemplates) == 0 {
		fmt.Printf("%sNo templates found with tag '%s'%s\n", color.Yellow, searchTag, color.Reset)
		return nil
	}

	if OutputType == "json" {
		// JSON output: manually formatted since the structure is nested
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
		// Tabular output with tabwriter for clean columns
		fmt.Printf("%sTemplates with tag '%s' (%d found):%s\n", color.Green, searchTag, len(matchingTemplates), color.Reset)
		fmt.Println()

		w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
		fmt.Fprintf(w, "%sTemplate%s\tTags\t%sSource%s\n",
			color.Yellow, color.Reset, color.Yellow, color.Reset)

		for _, tmpl := range matchingTemplates {
			// Build the tags as comma-separated string
			tagStr := ""
			for i, tag := range tmpl.tags {
				if i > 0 {
					tagStr += ", "
				}
				tagStr += tag
			}

			// Color the source: Custom = green, Built-in/Installed = cyan
			var sourceColor string
			if tmpl.source == "Custom" {
				sourceColor = fmt.Sprintf("%s%s%s", color.Green, tmpl.source, color.Reset)
			} else {
				sourceColor = fmt.Sprintf("%s%s%s", color.Cyan, tmpl.source, color.Reset)
			}

			// Output: name, tags, source
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

// Check validates all available templates (built-in, custom, installed)
// for syntax and schema errors and shows a table with the status of
// each template.
//
// Special notes:
//   - Blocked templates (blocklist) are marked as "BLOCKED"
//   - Templates with errors end the check with exit code 1
//   - structure.LoadJSON5 is NOT used here (it would abort via
//     log.Fatalf), instead each template is parsed manually so that
//     every broken template gets reported individually.
func Check() error {

	fmt.Println("Checking all Templates ...")

	// Load all template names + user templates
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Load installed templates so the source is displayed correctly
	installedTemplates, err := templates.LoadInstalledTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	templatecount := len(templateNames)
	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// tabwriter for neatly aligned table columns
	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	fmt.Fprintf(w, "%sName%s\t%sSource%s\tDescription\n", goansi.WHITE, goansi.END, goansi.WHITE, goansi.END)

	// Flag: did at least one template fail?
	failed := false
	for _, templ := range templateNames {
		// Check the blocklist: skip blocked templates right away
		blockednames := loader.GetBlockedTemplateNames()
		if _, isBlocked := blockednames[templ]; isBlocked {
			fmt.Fprintf(w, "%s%s (BLOCKED)%s\t%s\t%s\n", color.Red, templ, color.Reset, "---", "---")
			continue
		}

		// Load the template (user templates take precedence)
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			fmt.Fprintf(w, "%s%s (ERROR)%s\t%s\t%s\n", color.Red, templ, color.Reset, "Error loading", "---")
			failed = true
			continue
		}

		// Parse manually instead of structure.LoadJSON5: LoadJSON5 would
		// call log.Fatalf on an error and abort the whole check without
		// naming the affected template.
		validJSON := json.Valid(data)
		normalized := string(data)
		if !validJSON {
			// Not plain JSON → JSON5 preprocessing, then parse as JSON
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

		// Additionally run the file validation of the structure
		if err := folder.Files.Validate(); err != nil {
			fmt.Fprintf(w, "%s%s (ERROR)%s\t%s%s%s\n",
				color.Red, templ, color.Reset,
				"Invalid template: ", err, color.Reset)
			failed = true
			continue
		}

		// Determine the source: built-in / installed / custom
		source := goansi.WHITE + "Built-in" + goansi.END
		if _, isInstalled := installedTemplates[templ]; isInstalled {
			source = fmt.Sprintf("%sInstalled%s", color.Magenta, color.Reset)
		} else if _, isCustom := userTemplates[templ]; isCustom {
			source = fmt.Sprintf("%sCustom%s", color.Green, color.Reset)
		}

		// Valid template: add name, source and description to the table
		fmt.Fprintf(w, "%s%s%s\t%s\t%s\n", color.Cyan, templ,
			color.Reset, source, folder.Description)
	}

	w.Flush()

	// At least one error → non-silent exit code 1 (for CI/scripts)
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
	// In JSON mode no status messages on stdout (pure machine output)
	if OutputType != "json" {
		fmt.Printf("%sValidating %d Template(s)%s\n", color.Yellow, templatecount, color.Reset)
	}

	// No arguments → usage hint (also possible as JSON error object)
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

	// Result list for all validated files — used for the JSON output
	failed := false

	// Result structure for a single validated template
	// (JSON tags determine the output format for "--json")
	type validateResult struct {
		File    string `json:"file"`
		Source  string `json:"source"`
		Valid   bool   `json:"valid"`
		Error   string `json:"error,omitempty"`
		JSON5   bool   `json:"json5,omitempty"` // true if the JSON5 preprocessor was needed
		Warning string `json:"warning,omitempty"`
	}
	results := []validateResult{}

	// Table output (only in non-JSON mode)
	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)
	if OutputType != "json" {
		fmt.Fprintf(w, "%sFile%s\t%sResult%s\tWarning\n", goansi.WHITE, goansi.END, goansi.WHITE, goansi.END)
	}

	// Validate each passed argument one after another
	for _, arg := range args {
		// The template name can contain sub-paths, e.g.
		// `localhost_8765/test/template` for installed templates.
		// The alias is resolved before any filesystem/template lookup.
		resolved := ResolveAlias(arg)
		name := resolved
		name = templates.TrimTemplateExt(name)
		displayName := arg
		if resolved != arg {
			displayName = fmt.Sprintf("%s -> %s", arg, resolved)
		}
		res := validateResult{File: displayName}

		// Obtain the content: prefer a file on disk (if a path was
		// passed), otherwise look up built-in/custom template names.
		var data []byte
		fromName := false
		if _, err := os.Stat(arg); err == nil {
			// Argument is a file path → read it directly
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
			// No path → load the template by name
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

		// Check whether the content is directly valid JSON (without JSON5 preprocessing)
		validJSON := json.Valid([]byte(content))

		// Load into the folder structure to find schema/validation errors.
		// We unmarshal manually (instead of structure.LoadJSON5, which
		// would call log.Fatalf on bad input and abort the whole
		// command) so every file gets reported.
		normalized := content
		if !validJSON {
			normalized = json5.PreprocessJSON5(content)
		}

		var folder structure.Folder
		if err := json.Unmarshal([]byte(normalized), &folder); err != nil {
			// JSON/JSON5 syntax error
			res.Valid = false
			res.Error = err.Error()
			results = append(results, res)
			if OutputType != "json" {
				fmt.Fprintf(w, "%s%s%s\t%sINVALID%s\t%s%v%s\n", color.Red, displayName, color.Reset, color.Red, color.Reset, "---", err, color.Reset)
			}
			failed = true
			continue
		}

		// Schema validation of the file constraints
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

		// Determine the template source: "File" (path passed) or
		// "Built-in"/"Installed"/"Custom" (name passed)
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

		// Warning when the JSON5 preprocessor was needed (not plain JSON)
		warning := ""
		if !validJSON {
			warning = "Template is not plain JSON - it needs the JSON5 preprocessor to be parsed"
		}

		// Successfully validated → record the result
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
		// Overall result as ONE JSON object on stdout (machine-readable)
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

	// On at least one error exit with code 1 (CI-friendly)
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

// List shows all available templates grouped by source:
// Built-in, Installed (loaded via `finder install`) and Custom
// (own templates in ~/.finder/templates/ or ./.finder/templates/).
func List() error {
	fmt.Println("List available Templates:")

	// Load user templates (for custom detection)
	_, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Load installed templates
	installedTemplates, err := templates.LoadInstalledTemplates()
	if err != nil {
		fmt.Printf("%sWarning: Error loading installed templates: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Load all built-in templates
	templatesList, err := templates.LoadAll()
	if err != nil {
		return fmt.Errorf("error loading templates: %v", err)
	}

	templatecount := len(templatesList)
	fmt.Printf("%sFound %d Templates%s\n", color.Yellow, templatecount, color.Reset)

	// Planned grouping: built-in / custom / installed kept separate
	builtInTemplates := []string{}
	customTemplates := []string{}
	installedNames := []string{}

	// Installed templates have their own section and are NOT part of
	// the custom templates in `finder list`.
	for name := range installedTemplates {
		installedNames = append(installedNames, name)
	}

	// Assign each template to the correct list
	for _, templ := range templatesList {
		if _, ok := installedTemplates[templ]; ok {
			continue // shown separately further below
		}
		if _, isCustom := userTemplates[templ]; isCustom {
			customTemplates = append(customTemplates, templ)
		} else {
			builtInTemplates = append(builtInTemplates, templ)
		}
	}

	// Section: built-in templates
	fmt.Printf("%sBuilt-in Templates (%d):%s\n", color.Green, len(builtInTemplates), color.Reset)
	for _, templ := range builtInTemplates {
		fmt.Printf("  %s%s%s\n", color.Cyan, templ, color.Reset)
	}

	// Section: installed templates (from `finder install`)
	if len(installedNames) > 0 {
		fmt.Printf("\n%sInstalled Templates (%d):%s\n", color.Green, len(installedNames), color.Reset)
		for _, templ := range installedNames {
			fmt.Printf("  %s%s%s  (from ~/.finder/installed/templates/)\n", color.Magenta, templ, color.Reset)
		}
	}

	// Section: user-defined templates (if any)
	if len(customTemplates) > 0 {
		fmt.Printf("\n%sCustom Templates (%d):%s\n", color.Green, len(customTemplates), color.Reset)
		for _, templ := range customTemplates {
			fmt.Printf("  %s%s%s  (from ~/.finder/templates/ or ./.finder/templates/)\n", color.Cyan, templ, color.Reset)
		}
		fmt.Printf("\n%sHint:%s Place your custom templates in:\n", color.Yellow, color.Reset)
		fmt.Printf("  - $HOME/.finder/templates/\n")
		fmt.Printf("  - ./.finder/templates/\n")
	} else {
		// No custom templates → show a tip where to put them
		fmt.Printf("\n%sNo custom templates found. Add them to:~/.finder/templates/ or ./.finder/templates/%s\n", color.Yellow, color.Reset)
	}

	return nil
}

// Tags collects all tags used across all templates (without duplicates)
// and prints them line by line to the console.
func Tags() error {
	// Load all templates (built-in + custom)
	templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
	if err != nil {
		fmt.Printf("%sWarning: %v%s\n", color.Yellow, err, color.Reset)
	}

	// Collect all unique tags in a string slice
	var tags []string = []string{}

	// Go through each template and gather its tags
	for _, templ := range templateNames {
		// Load the template (user templates take precedence)
		data, err := templates.JSONtemplateLoaderWithUserTemplates(templ, userTemplates)
		if err != nil {
			fmt.Printf("%s%s (ERROR)%s\t%s\t%s\n", color.Red,
				templ, color.Reset, "Error loading", "---")
			continue
		}

		// Load the template structure to access the tags field
		folder := structure.LoadJSON5(string(data))

		// Adopt newly found tags only once (deduplication)
		for _, tag := range folder.Tags {
			if !contains(tags, tag) {
				tags = append(tags, tag)
			}
		}
	}

	// Display all unique tags
	fmt.Println("Available Tags:")

	for _, tag := range tags {
		fmt.Printf(" - %s\n", tag)
	}

	return nil
}

// contains is a small helper: checks whether a string occurs in a slice
// (linear search, specifically for tag deduplication).
func contains(slice []string, s string) bool {
	for _, v := range slice {
		if v == s {
			return true
		}
	}
	return false
}
