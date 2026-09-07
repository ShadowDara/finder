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

	fmt.Printf("Compiling Scratch Project Version %s\n", project.Meta.Semver)

	for _, target := range project.Targets {
		fmt.Println(target.Name)

		for id, block := range target.Blocks {
			fmt.Println(id, block.Opcode)
		}
	}

	for _, target := range project.Targets {
		for _, block := range buildScript(target.Blocks, "kGLFnWElQ@n}H$()yi)r") {
			fmt.Println(block.Opcode)
		}
	}

}

func buildScript(
	blocks map[string]scratch.Block,
	start string,
) []*scratch.Block {
	var result []*scratch.Block

	current := start

	for current != "" {
		block, ok := blocks[current]
		if !ok {
			break
		}

		result = append(result, &block)

		current = block.Next
	}

	return result
}
