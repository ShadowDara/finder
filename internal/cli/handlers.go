package cli

import (
	"fmt"

	"github.com/shadowdara/finder/internal/loader"
	"github.com/shadowdara/finder/internal/search"
	"github.com/shadowdara/finder/internal/structure"
)

// handleFileLoad loads a custom JSON/JSON5 file
func handleFileLoad(opts *CLIOptions) error {
	filePath, err := opts.GetFileArg()
	if err != nil {
		return err
	}

	fmt.Println("Loading custom JSON file...")
	content, err := loader.LoadFile(filePath)
	if err != nil {
		return fmt.Errorf("error loading file: %v", err)
	}

	search.Find(structure.LoadJSON5(content), opts.OutputType)
	return nil
}

// handleDirectLoad loads JSON directly from command-line argument
func handleDirectLoad(opts *CLIOptions) error {
	jsonStr, err := opts.GetDirectLoadArg()
	if err != nil {
		return err
	}

	fmt.Println("Loading JSON from command-line argument...")
	search.Find(structure.LoadJSON5(jsonStr), opts.OutputType)
	return nil
}
