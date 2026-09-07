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
	project, err := scratch.ParseFile("Monster-CLicker/project.json")
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
}
