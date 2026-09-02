package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/shadowdara/finder/pub/json5"
)

func main() {
	srcDir := filepath.Clean("./templates")
	dstDir := filepath.Clean("./internal/templates")

	if _, err := os.Stat(srcDir); err != nil {
		if os.IsNotExist(err) {
			srcDir = dstDir
		} else {
			log.Fatalf("source directory check failed: %v", err)
		}
	}

	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		log.Fatalf("create destination directory: %v", err)
	}

	entries, err := os.ReadDir(srcDir)
	if err != nil {
		log.Fatalf("read source directory: %v", err)
	}

	count := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		if !strings.EqualFold(filepath.Ext(name), ".json5") {
			continue
		}

		srcPath := filepath.Join(srcDir, name)
		content, err := os.ReadFile(srcPath)
		if err != nil {
			log.Printf("read %s: %v", srcPath, err)
			continue
		}

		normalized := json5.PreprocessJSON5(string(content))

		var parsed any
		if err := json.Unmarshal([]byte(normalized), &parsed); err != nil {
			log.Printf("ignore invalid JSON5 in %s: %v", srcPath, err)
			continue
		}

		minified, err := json.Marshal(parsed)
		if err != nil {
			log.Printf("marshal %s: %v", srcPath, err)
			continue
		}

		// outName := strings.TrimSuffix(name, ".json5") + ".json"
		outPath := filepath.Join(dstDir, name)
		if err := os.WriteFile(outPath, minified, 0o644); err != nil {
			log.Printf("write %s: %v", outPath, err)
			continue
		}

		count++
		fmt.Printf("converted %s -> %s\n", name, outPath)
	}

	fmt.Printf("done: %d templates converted\n", count)
}
