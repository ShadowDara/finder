// Finder
// a project made to search for other Stuff
// made by Shadowdara

// Test the Whole Project
//
// go test -coverprofile=coverage ./..
// go tool cover -html=coverage
//

package main

import (
    "os"

    "github.com/shadowdara/finder/internal/cli"
)

// main is the program entrypoint for the finder CLI when built as
// a command under cmd/finder. Keeping the bootstrap minimal makes the
// core packages easy to test.
func main() {
    cli.HandleCommand(os.Args)
}
