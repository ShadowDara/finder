package main

import (
	"fmt"
	"log"

	"github.com/shadowdara/finder/public/scratch"
)

func main() {
	scratchWorkflow()
}

func scratchWorkflow() {
	project, err := scratch.ParseFile("simple/project.json")
	// project, err := scratch.ParseFile("Monster-Clicker/project.json")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Targets:", len(project.Targets))

	for _, target := range project.Targets {
		fmt.Println("Target:", target.Name)
		fmt.Println("Blocks:", len(target.Blocks))
		fmt.Println("Costumes:", len(target.Costumes))
		fmt.Println("Sounds:", len(target.Sounds))
	}

	fmt.Printf("\n")

	fmt.Printf("Compiling Scratch Project Version %s\n", project.Meta.Semver)

	fmt.Printf("\n")

	for _, target := range project.Targets {
		fmt.Println(target.Name)

		for id, block := range target.Blocks {
			fmt.Println(id, block.Opcode)
		}
	}

	fmt.Printf("\n")

	for _, target := range project.Targets {
		out := findScripts(target)

		for _, name := range out {
			for _, block := range getScript(target, name) {
				fmt.Println(block.Opcode)
			}

			fmt.Printf("\n")
		}
	}

	fmt.Printf("\n")

	for _, target := range project.Targets {
		if target.IsStage {
			continue
		}

		fmt.Println(target.Name)

		for id, block := range target.Blocks {
			if !block.TopLevel {
				continue
			}

			script := scratch.ParseScript(target.Blocks, id)

			for _, node := range script.Blocks {
				scratch.PrintNode(node, "  ")
			}
		}
	}
}

// generate the scratch script
func getScript(target scratch.Target, startID string) []scratch.Block {
	var script []scratch.Block

	currentID := startID

	for currentID != "" {
		block, ok := target.Blocks[currentID]
		if !ok {
			break
		}

		script = append(script, block)

		currentID = block.Next
	}

	return script
}

// Search for the start scripts
// (when green flag clicked etc)
func findScripts(target scratch.Target) []string {
	var scripts []string

	for id, block := range target.Blocks {
		if block.TopLevel {
			scripts = append(scripts, id)
		}
	}

	return scripts
}
