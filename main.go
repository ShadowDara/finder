package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/shadowdara/finder/search"
	"github.com/shadowdara/finder/structure"
)

func PrettyPrint(v any) {
	b, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println(string(b))
}

func main() {
	fmt.Println("Struct Finder")

	// 	json1 := `
	// {
	//     "name": "*",

	//     "folders": [{
	//         "name": ".git"

	//     }]
	// }
	// `

	// 	json2 := `
	// // A default struct to find git Repositories
	// {
	//     "name": "*",
	//     // "files": ["*"],
	//     "folders": [{
	//         "name": ".git"
	//         // "files":
	//         // "folders":
	//     }]
	// }
	// `

	// 	// Problem: null wird hier zu empty string
	// 	// Problem: not there wird zu null
	// 	json3 := `
	// {
	//     "name": null,
	//     "folders": []
	// }
	// `

	// 	kk := structure.LoadJSON5(json1)
	// 	PrettyPrint(kk)

	// 	hh := structure.LoadJSON5(json2)
	// 	PrettyPrint(hh)

	// 	hgh := structure.LoadJSON5(json3)
	// 	PrettyPrint(hgh)

	// System Argument Check
	if len(os.Args) < 2 {
		fmt.Println("Please start with one argument atleast or start with help.")
		return
	}

	// Help Message
	if os.Args[1] == "help" {
		printHelp()
	}

	if len(os.Args) < 3 {
		if os.Args[1] == "custom" {
			// Load Custom JSON File
			// search.Find()

			// Check for file

			// Use as JSON Source
			search.Find(structure.LoadJSON5(os.Args[2]))
		}
	}

	// Load Arg 1
	data, err := JSONtemplateLoader(os.Args[1])
	if err != nil {
		log.Println("Could not read the JSON File")
	}

	// Search the struct
	fmt.Printf("Searchin for %s\n", os.Args[1])
	search.Find(structure.LoadJSON5(string(data)))
}

func printHelp() {
	fmt.Println("Help for Finder")
	fmt.Println("Check: ")
	fmt.Println("https://github.com/ShadowDara/finder")
}
