package main

import (
    "os"

    "github.com/shadowdara/finder/cli"
)

// main is the program entrypoint for the finder CLI when built as
// a command under cmd/finder. Keeping the bootstrap minimal makes the
// core packages easy to test.
func main() {
    cli.HandleCommand(os.Args)
}
