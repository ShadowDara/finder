package main

import (
	"os"

	"github.com/shadowdara/finder/cli"
)

// main is the program entry point. It delegates to the CLI command
// handler using the raw os.Args slice. This file intentionally keeps
// the bootstrap minimal so most logic remains testable in packages.
func main() {
	// Run the command handler from the cli package.
	cli.HandleCommand(os.Args)
}
