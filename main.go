package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/shadowdara/finder/cli"
)

func PrettyPrint(v any) {
	b, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println(string(b))
}

// Start the Programm
func main() {
	// Run the Command Hanlder
	cli.Handle_command(os.Args)
}
