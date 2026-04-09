package argparser

import (
	"fmt"
	"os"
	"strings"

	"text/tabwriter"
)

// Flag represents a single CLI option.
//
// A flag can either be a string or a boolean value.
//
// Examples:
//
//	--name=John
//	--verbose
//
// Supported features:
//   - Long flags: --name
//   - Short aliases: -n
//   - Required flags
type Flag struct {
	Name     string   // Primary name of the flag (e.g. "name" → --name)
	Aliases  []string // Short aliases (e.g. "n" → -n)
	Usage    string   // Description shown in help output
	Required bool     // Whether the flag must be provided

	StringValue string // Value for string flags
	BoolValue   bool   // Value for boolean flags
	IsBool      bool   // Flag type (true = bool, false = string)
	Set         bool   // Indicates whether the flag was explicitly set
}

// Command represents a CLI command.
//
// Features:
//   - Subcommands (e.g. git commit)
//   - Command-specific flags
//   - Aliases for commands
//   - Positional arguments
type Command struct {
	Name        string              // Command name
	Hidden      bool                // If true, command is hidden from help output
	Aliases     []string            // Alternative names (e.g. "rm" for "remove")
	Description string              // Description shown in help output
	Flags       map[string]*Flag    // Registered flags
	Subcommands map[string]*Command // Registered subcommands
	Parent      *Command            // Parent command (used to build full path)
	Args        []string            // Positional arguments
}

// NewCommand creates a new Command.
//
// Parameters:
//
//	name     → command name
//	desc     → description for help output
//	hidden   → whether the command should be hidden
//	aliases  → optional aliases
func NewCommand(name, desc string, hidden bool, aliases ...string) *Command {
	cmd := &Command{
		Name:        name,
		Hidden:      hidden,
		Aliases:     aliases,
		Description: desc,
		Flags:       make(map[string]*Flag),
		Subcommands: make(map[string]*Command),
	}

	// Optional: automatically add a help flag
	// cmd.Bool("help", false, "Show help", false, "h")

	return cmd
}

// String registers a string flag for the command.
//
// Example:
//
//	cmd.String("name", "", "Your name", true, "n")
//
// CLI usage:
//
//	--name John
//	--name=John
//	-n John
func (c *Command) String(name, def, usage string, required bool, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:        name,
		Aliases:     aliases,
		Usage:       usage,
		Required:    required,
		StringValue: def,
		IsBool:      false,
	}
}

// Bool registers a boolean flag.
//
// Example:
//
//	cmd.Bool("verbose", false, "Enable verbose mode", false, "v")
//
// CLI usage:
//
//	--verbose
//	-v
func (c *Command) Bool(name string, def bool, usage string, required bool, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:      name,
		Aliases:   aliases,
		Usage:     usage,
		Required:  required,
		BoolValue: def,
		IsBool:    true,
	}
}

// AddSubcommand adds a subcommand to the current command.
//
// Example:
//
//	root.AddSubcommand(commitCmd)
//
// Result:
//
//	app commit
func (c *Command) AddSubcommand(sub *Command) {
	sub.Parent = c
	c.Subcommands[sub.Name] = sub
}

// findFlag searches for a flag by name or alias.
func (c *Command) findFlag(key string) *Flag {
	for _, f := range c.Flags {
		if f.Name == key {
			return f
		}
		for _, a := range f.Aliases {
			if a == key {
				return f
			}
		}
	}
	return nil
}

// Parse processes CLI arguments.
//
// Features:
//   - Recursive subcommand parsing
//   - Long flags (--name)
//   - Short flags (-n)
//   - Inline values (--name=John)
//   - Positional arguments
//
// Returns:
//
//	The final command (important when using subcommands)
func (c *Command) Parse(args []string) *Command {

	// Check if first argument is a subcommand
	if len(args) > 0 {
		input := args[0]

		for _, sub := range c.Subcommands {
			if sub.Name == input {
				return sub.Parse(args[1:])
			}
			for _, alias := range sub.Aliases {
				if alias == input {
					return sub.Parse(args[1:])
				}
			}
		}
	}

	// No subcommand → parse flags and args
	for i := 0; i < len(args); i++ {
		arg := args[i]

		// Long flags (--flag or --flag=value)
		if strings.HasPrefix(arg, "--") {
			key := strings.TrimPrefix(arg, "--")

			// Format: --key=value
			if strings.Contains(key, "=") {
				parts := strings.SplitN(key, "=", 2)
				key = parts[0]
				value := parts[1]

				if f := c.findFlag(key); f != nil && !f.IsBool {
					f.StringValue = value
					f.Set = true
				}
				continue
			}

			// Format: --key value
			if f := c.findFlag(key); f != nil {
				if f.IsBool {
					f.BoolValue = true
					f.Set = true
				} else if i+1 < len(args) {
					f.StringValue = args[i+1]
					f.Set = true
					i++
				}
				continue
			}
		}

		// Short flags (-k)
		if strings.HasPrefix(arg, "-") && len(arg) == 2 {
			key := strings.TrimPrefix(arg, "-")

			if f := c.findFlag(key); f != nil {
				if f.IsBool {
					f.BoolValue = true
					f.Set = true
				} else if i+1 < len(args) {
					f.StringValue = args[i+1]
					f.Set = true
					i++
				}
				continue
			}
		}

		// Not a flag → positional argument
		c.Args = append(c.Args, arg)
	}

	// Handle help flag
	if f := c.findFlag("help"); f != nil && f.BoolValue {
		c.PrintHelp()
		os.Exit(0)
	}

	// Validate required flags
	c.validateRequired()

	return c
}

// GetString returns the value of a string flag.
func (c *Command) GetString(name string) string {
	if f := c.findFlag(name); f != nil {
		return f.StringValue
	}
	return ""
}

// GetBool returns the value of a boolean flag.
func (c *Command) GetBool(name string) bool {
	if f := c.findFlag(name); f != nil {
		return f.BoolValue
	}
	return false
}

// PrintHelp prints a formatted help message.
//
// Includes:
//   - Usage
//   - Description
//   - Subcommands
//   - Flags
func (c *Command) PrintHelp() {
	full := c.fullCommandPath()

	fmt.Printf("Usage:\n  %s [options]\n\n", full)

	if c.Description != "" {
		fmt.Println(c.Description)
		fmt.Println()
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)

	// Subcommands
	if len(c.Subcommands) > 0 {
		fmt.Fprintln(w, "Subcommands:")
		for _, sub := range c.Subcommands {
			if sub.Hidden {
				continue
			}

			aliasStr := ""
			if len(sub.Aliases) > 0 {
				aliasStr = fmt.Sprintf(" (%s)", strings.Join(sub.Aliases, ", "))
			}

			fmt.Fprintf(w, "  %s%s\t%s\n",
				sub.Name,
				aliasStr,
				sub.Description,
			)
		}
		fmt.Fprintln(w)
	}

	// Flags
	if len(c.Flags) > 0 {
		fmt.Fprintln(w, "Options:")
		for _, f := range c.Flags {
			aliasStr := ""
			if len(f.Aliases) > 0 {
				aliasStr = fmt.Sprintf(" (-%s)", strings.Join(f.Aliases, ", -"))
			}

			req := ""
			if f.Required {
				req = " [required]"
			}

			fmt.Fprintf(w, "  --%s%s%s\t%s\n",
				f.Name,
				aliasStr,
				req,
				f.Usage,
			)
		}
		fmt.Fprintln(w)
	}

	w.Flush()
}

// fullCommandPath builds the full command path.
//
// Example:
//
//	app user create
func (c *Command) fullCommandPath() string {
	if c.Parent == nil {
		return os.Args[0]
	}
	return c.Parent.fullCommandPath() + " " + c.Name
}

// validateRequired ensures all required flags are set.
func (c *Command) validateRequired() {
	for _, f := range c.Flags {
		if f.Required && !f.Set {
			fmt.Printf("Missing required flag: --%s\n\n", f.Name)
			c.PrintHelp()
			os.Exit(1)
		}
	}
}
