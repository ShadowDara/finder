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

func main() {
	cli.Handle_command(os.Args)

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

}
