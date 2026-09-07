package main

import (
	"fmt"
	"log"

	"github.com/shadowdara/finder/public/scratch"
)

func main() {
	if err := scratchWorkflow(); err != nil {
		log.Fatal(err)
	}
}

func scratchWorkflow() error {
	project, err := scratch.ParseFile("simple/project.json")
	if err != nil {
		return err
	}

	fmt.Printf("Compiling Scratch Project Version %s\n\n", project.Meta.Semver)
	fmt.Printf("Targets: %d\n\n", len(project.Targets))

	for _, target := range project.Targets {
		fmt.Println("================================")
		fmt.Println("Target:", target.Name)
		fmt.Println("Blocks:", len(target.Blocks))
		fmt.Println("Costumes:", len(target.Costumes))
		fmt.Println("Sounds:", len(target.Sounds))
		fmt.Println("================================")

		// Stage erstmal überspringen
		if target.IsStage {
			continue
		}

		fmt.Println()

		// Alle Script-Starts finden
		for id, block := range target.Blocks {
			if !block.TopLevel {
				continue
			}

			// Scratch-Block in unseren AST umwandeln
			script := scratch.ParseScript(
				target.Blocks,
				id,
			)

			fmt.Println("Script:", id)

			for _, node := range script.Blocks {
				scratch.PrintNode(node, "  ")
			}

			fmt.Println()
		}
	}

	return nil
}
