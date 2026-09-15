package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

func creategofile() {
	inputFile := "checkstaticfiles.output.json"

	jsonData, err := os.ReadFile(inputFile)
	if err != nil {
		panic(fmt.Errorf("error while reading the JSON file: %w", err))
	}

	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	_, err = gz.Write(jsonData)
	if err != nil {
		panic(fmt.Errorf("error while compressing: %w", err))
	}
	gz.Close()

	compressed := buf.Bytes()

	f, err := os.Create(*Output)
	if err != nil {
		panic(fmt.Errorf("error while creating %s: %w", *Output, err))
	}
	defer f.Close()

	fmt.Fprintf(f, "package %s\n\n", *Pkg)

	

	fmt.Fprintf(f, "%s", calculate_settings())
	fmt.Fprintf(f, "\n\n// Generated with checkstaticfiles\n// https://github.com/ShadowDara/checkstaticfiles\n// %s contains gzip data from %q\n", *Var, filepath.Base(inputFile))
	fmt.Fprintf(f, "var %s = []byte{\n", *Var)

	for i, b := range compressed {
		if i%12 == 0 {
			fmt.Fprintf(f, "    ")
		}
		fmt.Fprintf(f, "0x%02x", b)
		if i < len(compressed)-1 {
			fmt.Fprintf(f, ", ")
		}
		if (i+1)%12 == 0 {
			fmt.Fprintln(f)
		}
	}
	fmt.Fprint(f, "}")

	fmt.Printf("✔ Go file %s with var %s created (%d bytes, gzip)\n", *Output, *Var, len(compressed))
}

func calculate_settings() string {
	var settings int
	// 1 = ContentMode
	if (p.ContentMode == true) {
		settings += 1
	}

	return "var Chechstaticfiles_settings int = " + strconv.Itoa(settings)
}
