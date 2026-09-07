package main

import (
	"fmt"
	"log"
	"os"

	"github.com/shadowdara/finder/public/scratch"
)

func main() {
	if err := scratchWorkflow(); err != nil {
		log.Fatal(err)
	}
}

func scratchWorkflow() error {
	project, err := scratch.ParseFile("simple/project.json")
	// project, err := scratch.ParseFile("Monster-Clicker/project.json")
	if err != nil {
		return err
	}

	fmt.Printf("Compiling Scratch Project Version %s\n\n", project.Meta.Semver)
	fmt.Printf("Targets: %d\n\n", len(project.Targets))

	for _, target := range project.Targets {
		if target.IsStage {
			continue
		}

		fmt.Println("Target:", target.Name)

		for id, block := range target.Blocks {
			if !block.TopLevel {
				continue
			}

			script := scratch.ParseScript(
				target.Blocks,
				id,
			)

			scratch.PrintNode(script.Blocks[0], "  ")

			generator := scratch.NewCPPGenerator()

			cpp := generator.Generate(script)

			// fmt.Println()
			// fmt.Println("========== GENERATED C++ ==========")
			// fmt.Println(cpp)
			// fmt.Println("===================================")

			err = os.WriteFile("export/main.cpp", []byte(cpp), 0644)
			if err != nil {
				panic(err)
			}
		}
	}

	return nil
}
