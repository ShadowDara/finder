package main

import (
	"fmt"
	"log"
	"os"

	"github.com/shadowdara/finder/public/scratch"
	"github.com/shadowdara/finder/public/scratch/config"
)

func main() {
	conf, _ := config.Load("scratch.config.yaml")

	if err := scratchWorkflow(conf); err != nil {
		log.Fatal(err)
	}
}

func scratchWorkflow(conf config.Config) error {
	project, err := scratch.ParseFile(conf.Indir + "/project.json")
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

		err := scratch.CompileTargetAssets(
			target,
			"simple",
			conf.CacheDir+"/assets",
		)

		if err != nil {
			log.Fatal(err)
		}
	}

	fmt.Println()

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

			err = os.WriteFile(conf.ScriptPath, []byte(scratch.GenShellScript(cpp, conf)), 0644)
			if err != nil {
				panic(err)
			}

			fmt.Println()
			fmt.Println("Generated new project shell script")
		}
	}

	return nil
}
