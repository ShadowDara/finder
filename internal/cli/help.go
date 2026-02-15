package cli

import (
	"fmt"
	"github.com/shadowdara/finder/internal/loader"

	"os"
	"text/tabwriter"
)

// printHelp writes a comprehensive help page to stdout with all available
// commands, flags, and options. It provides examples and explanations of
// how to use the Finder tool.
func printHelp() {
	fmt.Println("Finder Help")
	fmt.Println("More info at: https://github.com/ShadowDara/finder")
	fmt.Println()

	fmt.Println("COMMANDS")
	fmt.Println("========")

	w := tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)

	commands := []struct {
		name        string
		description string
	}{
		{"help, h, -h, --help", "Display this help information"},
		{"list, ls", "List all available templates (built-in and custom)"},
		{"check", "Validate all templates for syntax errors"},
		 {"tags, tag", "Display available tags for templates"},  // ← NEU
		{"<template-name>", "Detect project structure using specified template"},
	}

	for _, cmd := range commands {
		fmt.Fprintf(w, "  %s\t%s\n", cmd.name, cmd.description)
	}

	w.Flush()
	fmt.Println()

	fmt.Println("FILE & CONFIG OPERATIONS")
	fmt.Println("=======================")

	w = tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)

	operations := []struct {
		name        string
		description string
	}{
		{"-f, --file <path>", "Load structure from a custom JSON/JSON5 file"},
		{"-c, --config <json>", "Load structure from inline JSON string"},
	}

	for _, op := range operations {
		fmt.Fprintf(w, "  %s\t%s\n", op.name, op.description)
	}

	w.Flush()
	fmt.Println()

	fmt.Println("GLOBAL FLAGS")
	fmt.Println("============")

	w = tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)

	flags := []struct {
		name        string
		description string
	}{
		{"--json", "Output results as JSON (machine-readable)"},
		{"--clear", "Suppress header and metadata output"},
		{"--verbose", "Enable verbose output mode"},
	}

	for _, flag := range flags {
		fmt.Fprintf(w, "  %s\t%s\n", flag.name, flag.description)
	}

	w.Flush()
	fmt.Println()

	fmt.Println("CUSTOM TEMPLATES")
	fmt.Println("================")
	fmt.Println("Place custom templates in:")
	fmt.Println("  - $HOME/.finder/templates/       (User templates)")
	fmt.Println("  - ./.finder/templates/           (Project templates)")
	fmt.Println()
	fmt.Println("Custom templates are automatically discovered and can override built-in templates.")
	fmt.Println()

	fmt.Println("RESERVED COMMAND NAMES (Cannot be used as template names)")
	fmt.Println("=======================================================")

	blockednames := loader.GetBlockedTemplateNames()
	w = tabwriter.NewWriter(os.Stdout, 0, 8, 2, ' ', 0)

	for k, v := range blockednames {
		fmt.Fprintf(w, "  %s\t%s\n", k, v)
	}

	w.Flush()
}
