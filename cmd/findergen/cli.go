package main

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/pub/argparser"
)

type Conf struct {
	port int
}

func parseCliArgs() Conf {
	// Create Arg Parser

	var newconf Conf

	// NEW
	root := argparser.NewCommand("findergen",
		"the http server for finder to create and view templates", false)

	// Add Version Command
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", false, "-v", "v", "version")

	// Port
	root.Number("port", 0, "Change the Server Port", false, "p")

	root.AddSubcommand(versionCmd)

	// Parse the Arguments
	cmd := root.Parse(os.Args[1:])

	newconf.port = int(cmd.GetNumber("port"))

	switch cmd {
	case versionCmd:
		{
			fmt.Println(finderversion.Version)
		}
	}

	return newconf
}
