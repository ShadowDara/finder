package argparser

import (
	"fmt"
	"os"
	"strings"

	"text/tabwriter"
)

type Flag struct {
	Name     string
	Aliases  []string
	Usage    string
	Required bool

	StringValue string
	BoolValue   bool
	IsBool      bool
	Set         bool
}

// Struct for a Command
type Command struct {
	Name        string
	Hidden      bool
	Aliases     []string
	Description string
	Flags       map[string]*Flag
	Subcommands map[string]*Command
	Parent      *Command
	Args        []string
}

// Function to create a new Command
func NewCommand(name, desc string, hidden bool, aliases ...string) *Command {
	cmd := &Command{
		Name:        name,
		Hidden:      hidden,
		Aliases:     aliases,
		Description: desc,
		Flags:       make(map[string]*Flag),
		Subcommands: make(map[string]*Command),
	}

	// cmd.Bool("help", false, "Show help", false, "h")

	return cmd
}

// Function to add a String Value to the Current Command
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

// Function to add a Boolean Value to the Current Command
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

// Function to register a Subcommand at the End
func (c *Command) AddSubcommand(sub *Command) {
	sub.Parent = c
	c.Subcommands[sub.Name] = sub
}

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

// Function to Parse all the Arguments
func (c *Command) Parse(args []string) *Command {

	if len(args) > 0 {
		input := args[0]

		// Prüfe Subcommands + Aliases
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

	// Kein Subcommand → normal parsen
	for i := 0; i < len(args); i++ {
		arg := args[i]

		// Flags
		if strings.HasPrefix(arg, "--") {
			key := strings.TrimPrefix(arg, "--")

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

		// Short flags
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

		// 👇 Wenn kein Flag → positional argument
		c.Args = append(c.Args, arg)
	}

	// help
	if f := c.findFlag("help"); f != nil && f.BoolValue {
		c.PrintHelp()
		os.Exit(0)
	}

	c.validateRequired()
	return c
}

// Function to check a String in the Command
func (c *Command) GetString(name string) string {
	if f := c.findFlag(name); f != nil {
		return f.StringValue
	}
	return ""
}

// Function to check a Bool in the Command
func (c *Command) GetBool(name string) bool {
	if f := c.findFlag(name); f != nil {
		return f.BoolValue
	}
	return false
}

// Function to print a Help Message from all the Commands
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

func (c *Command) fullCommandPath() string {
	if c.Parent == nil {
		return os.Args[0]
	}
	return c.Parent.fullCommandPath() + " " + c.Name
}

func (c *Command) validateRequired() {
	for _, f := range c.Flags {
		if f.Required && !f.Set {
			fmt.Printf("Missing required flag: --%s\n\n", f.Name)
			c.PrintHelp()
			os.Exit(1)
		}
	}
}
