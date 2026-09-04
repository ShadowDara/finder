package argparser

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"text/tabwriter"

	"github.com/shadowdara/finder/pub/goansi"
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

	NumberValue int64  // Value for Integer flags
	StringValue string // Value for string flags
	BoolValue   bool   // Value for boolean flags
	IsBool      bool   // Flag type (true = bool, false = ???)
	IsNumber    bool   // Flag type (true = number, false = ???)
	IsString    bool   // Flag type (true = string, false = ???)
	Set         bool   // Indicates whether the flag was explicitly set

	Global bool
}

// Command represents a CLI command.
//
// Features:
//   - Subcommands (e.g. git commit)
//   - Command-specific flags
//   - Aliases for commands
//   - Positional arguments
type Command struct {
	Name        string   // Command name
	Hidden      bool     // If true, command is hidden from help output
	Aliases     []string // Alternative names (e.g. "rm" for "remove")
	Description string   // Description shown in help output

	Flags       map[string]*Flag    // Registered flags
	Subcommands map[string]*Command // Registered subcommands
	Parent      *Command            // Parent command (used to build full path)
	Args        []string            // Positional arguments
	PassThrough bool                 // If true, preserve all parsed arguments unchanged
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
	cmd.Bool("help", false, "Show help", false, "h")

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

// GlobalString registers a global string flag.
func (c *Command) GlobalString(name, def, usage string, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:        name,
		Aliases:     aliases,
		Usage:       usage,
		StringValue: def,
		IsString:    true,
		Global:      true,
		Required:    false,
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

// GlobalBool registers a global boolean flag.
func (c *Command) GlobalBool(name string, def bool, usage string, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:      name,
		Aliases:   aliases,
		Usage:     usage,
		BoolValue: def,
		IsBool:    true,
		Global:    true,
		Required:  false,
	}
}

// Number registers an integer flag for the command.
//
// Example:
//
//	cmd.Number("limit", 10, "Maximum number of results", false, "l")
func (c *Command) Number(name string, def int64, usage string, required bool, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:        name,
		Aliases:     aliases,
		Usage:       usage,
		Required:    required,
		NumberValue: def,
		IsNumber:    true,
	}
}

// GlobalNumber registers a global integer flag.
func (c *Command) GlobalNumber(name string, def int64, usage string, aliases ...string) {
	c.Flags[name] = &Flag{
		Name:        name,
		Aliases:     aliases,
		Usage:       usage,
		NumberValue: def,
		IsNumber:    true,
		Global:      true,
		Required:    false,
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

// findGlobalFlag searches the command hierarchy for a global flag.
//
// Only flags explicitly marked with Global=true are returned.
func (c *Command) findGlobalFlag(key string) *Flag {
	if c.Parent != nil {
		if f := c.Parent.findFlag(key); f != nil && f.Global {
			return f
		}

		if f := c.Parent.findGlobalFlag(key); f != nil {
			return f
		}
	}

	return nil
}

// findAvailableFlag searches for a flag available to this command.
//
// Local flags always have priority over global flags.
func (c *Command) findAvailableFlag(key string) *Flag {
	if f := c.findFlag(key); f != nil {
		return f
	}

	return c.findGlobalFlag(key)
}

// findSubcommand searches for a subcommand by name or alias.
func (c *Command) findSubcommand(key string) *Command {
	for _, sub := range c.Subcommands {
		if sub.Name == key {
			return sub
		}

		for _, alias := range sub.Aliases {
			if alias == key {
				return sub
			}
		}
	}

	return nil
}

// Parse processes CLI arguments.
//
// Global flags must appear after the command they belong to:
//
//	app user --verbose
//	app user create --verbose
//
// They do NOT work before the subcommand:
//
//	app --verbose user
func (c *Command) Parse(args []string) *Command {
	if c.PassThrough {
		c.Args = append(c.Args, args...)
		return c
	}

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

				if f := c.findAvailableFlag(key); f != nil && !f.IsBool {
					if f.IsNumber {
						if parsed, err := strconv.ParseInt(value, 10, 64); err == nil {
							f.NumberValue = parsed
							f.Set = true
						}
					} else {
						f.StringValue = value
						f.Set = true
					}
				}

				continue
			}

			// Format: --key value
			if f := c.findAvailableFlag(key); f != nil {
				if f.IsBool {
					f.BoolValue = true
					f.Set = true
				} else if i+1 < len(args) {
					value := args[i+1]

					if f.IsNumber {
						if parsed, err := strconv.ParseInt(value, 10, 64); err == nil {
							f.NumberValue = parsed
							f.Set = true
						}
					} else {
						f.StringValue = value
						f.Set = true
					}

					i++
				}

				continue
			}
		}

		// Short flags (-k)
		if strings.HasPrefix(arg, "-") && len(arg) == 2 {
			key := strings.TrimPrefix(arg, "-")

			if f := c.findAvailableFlag(key); f != nil {
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

		// Subcommand
		if sub := c.findSubcommand(arg); sub != nil {
			return sub.Parse(args[i+1:])
		}

		// Positional argument
		c.Args = append(c.Args, arg)
	}

	// Handle help flag.
	if f := c.findFlag("help"); f != nil && f.BoolValue {
		c.PrintHelp()
		os.Exit(0)
	}

	// Validate required flags.
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

// GetNumber returns the value of a number flag.
func (c *Command) GetNumber(name string) int64 {
	if f := c.findFlag(name); f != nil {
		return f.NumberValue
	}
	return 0
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
//
// PrintHelp prints a formatted help message.
func (c *Command) PrintHelp() {
	full := c.fullCommandPath()

	fmt.Printf(
		"%s%sUsage:%s\n  %s%s%s [subcommands] [options] [global options]\n\n",
		goansi.BOLD,
		goansi.UNDERLINED,
		goansi.END,
		goansi.BOLD,
		full,
		goansi.END,
	)

	if c.Description != "" {
		fmt.Println(c.Description)
		fmt.Println()
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)

	// Subcommands
	if len(c.Subcommands) > 0 {
		fmt.Fprintf(
			w,
			"%s%sSubcommands:%s\n",
			goansi.BOLD,
			goansi.UNDERLINED,
			goansi.END,
		)

		for _, sub := range c.Subcommands {
			if sub.Hidden {
				continue
			}

			aliasStr := ""

			if len(sub.Aliases) > 0 {
				aliasStr = fmt.Sprintf(
					" (%s)",
					strings.Join(sub.Aliases, ", "),
				)
			}

			fmt.Fprintf(
				w,
				"  %s%s%s%s\t%s\n",
				goansi.BOLD,
				sub.Name,
				aliasStr,
				goansi.END,
				sub.Description,
			)
		}

		fmt.Fprintln(w)
	}

	// Local options
	hasLocalFlags := false

	for _, f := range c.Flags {
		if !f.Global {
			hasLocalFlags = true
			break
		}
	}

	if hasLocalFlags {
		fmt.Fprintf(
			w,
			"%s%sOptions:%s\n",
			goansi.BOLD,
			goansi.UNDERLINED,
			goansi.END,
		)

		for _, f := range c.Flags {
			if f.Global {
				continue
			}

			c.printFlag(w, f)
		}

		fmt.Fprintln(w)
	}

	// Global options
	globalFlags := c.globalFlags()

	if len(globalFlags) > 0 {
		fmt.Fprintf(
			w,
			"%s%sGlobal Options:%s\n",
			goansi.BOLD,
			goansi.UNDERLINED,
			goansi.END,
		)

		for _, f := range globalFlags {
			c.printFlag(w, f)
		}

		fmt.Fprintln(w)
	}

	w.Flush()
}

// printFlag prints a single flag.
func (c *Command) printFlag(w *tabwriter.Writer, f *Flag) {
	aliasStr := ""

	if len(f.Aliases) > 0 {
		aliasStr = fmt.Sprintf(
			" (-%s)",
			strings.Join(f.Aliases, ", -"),
		)
	}

	req := ""

	if f.Required {
		req = " [required]"
	}

	fmt.Fprintf(
		w,
		"  %s--%s%s%s%s\t%s\n",
		goansi.BOLD,
		f.Name,
		aliasStr,
		req,
		goansi.END,
		f.Usage,
	)
}

// globalFlags returns all global flags inherited from parents.
func (c *Command) globalFlags() []*Flag {
	var result []*Flag

	var collect func(*Command)

	collect = func(cmd *Command) {
		if cmd == nil {
			return
		}

		collect(cmd.Parent)

		for _, f := range cmd.Flags {
			if f.Global {
				result = append(result, f)
			}
		}
	}

	collect(c)

	return result
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
