package main

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type Data struct {
	ContentMode bool     	`yaml:"contentmode"`
	Paths 		[]string 	`yaml:"paths"`
}

type EncodedFile struct {
	Path    string // Relativer Pfad
	Content string // base64-kodierter Inhalt
}

var p Data

// Globale Flag-Variablen als Pointer
var (
	Pkg    *string
	Output *string
	Var    *string
)

func init() {
	// Flags definieren (Pointer speichern)
	Pkg = flag.String("package", "main", "name of the Go-Package")
	Output = flag.String("output", "checkstaticfiles.data.go", "Destination for the go files")
	Var = flag.String("variable", "CheckstaticfilesOutputJSONGz", "Place where the Data-array is saved!")
}

func main() {
	flag.Parse()

	fmt.Print("Generating:\n\nData selected:")
	fmt.Println("- Package:", *Pkg)
	fmt.Println("- Output-File:", *Output)
	fmt.Println("- Data Variable:", *Var)

	if flag.NArg() > 0 {
		fmt.Println("More Arguments:", flag.Args())
	}

	paths := CheckConfig()
	Generate(paths)
}

func CheckConfig() []string {
	wd, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	log.Println("Executing folder:", wd, "\n")

	data, err := os.ReadFile("checkstaticfiles.config.yaml")
	if err != nil {
		panic(err)
	}

	err = yaml.Unmarshal(data, &p)
	if err != nil {
		panic(err)
	}

	return p.Paths
}

func Generate(inputPaths []string) {
	var results []EncodedFile

	for _, path_old := range inputPaths {
		// Converting the paths from \\ to /
		path := filepath.ToSlash(path_old)

		info, err := os.Stat(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error while checking %s: %v\n", path, err)
			continue
		}

		if info.IsDir() {
			filepath.WalkDir(path, func(p string, d fs.DirEntry, err error) error {
				if err != nil {
					return err
				}
				if !d.IsDir() {
					ef, err := encodeFile(p)
					if err == nil {
						results = append(results, ef)
					} else {
						fmt.Fprintf(os.Stderr, "Error while reading %s: %v\n", p, err)
					}
				}
				return nil
			})
		} else {
			ef, err := encodeFile(path)
			if err == nil {
				results = append(results, ef)
			} else {
				fmt.Fprintf(os.Stderr, "Error while reading %s: %v\n", path, err)
			}
		}
	}

	jsonData, err := json.Marshal(results)
	// Compress JSON without Indextation
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error while JSON-Encoding: %v\n", err)
		return
	}

	err = os.WriteFile("checkstaticfiles.output.json", jsonData, 0644)
	if err != nil {
		panic(err)
	}

	creategofile()
}

func encodeFile(path string) (EncodedFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return EncodedFile{}, err
	}

	encoded := base64.StdEncoding.EncodeToString(data)

	return EncodedFile{
		Path:    path,
		Content: encoded,
	}, nil
}
