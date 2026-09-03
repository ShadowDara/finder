package main

import (
	"os"

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

	// Port
	root.Number("port", 0, "Change the Server Port", false, "p")

	// Parse the Arguments
	cmd := root.Parse(os.Args[1:])

	newconf.port = int(cmd.GetNumber("port"))

	return newconf
}
