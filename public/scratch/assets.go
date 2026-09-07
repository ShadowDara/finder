package scratch

import (
	"fmt"
	"image"
	"image/png"
	"math"
	"os"
	"path/filepath"

	"github.com/srwiley/oksvg"
	"github.com/srwiley/rasterx"
)

func CompileTargetAssets(
	target Target,
	projectDir string,
	outputDir string,
) error {
	for _, costume := range target.Costumes {
		fmt.Println("Costume:", costume.Name)
		fmt.Println("Format:", costume.DataFormat)
		fmt.Println("Asset:", costume.MD5Ext)

		input := filepath.Join(
			projectDir,
			costume.MD5Ext,
		)

		if _, err := os.Stat(input); err != nil {
			return fmt.Errorf(
				"costume not found: %s",
				input,
			)
		}

		outputName := costume.MD5Ext
		if costume.DataFormat == "svg" {
			outputName = costume.AssetID + ".png"
		}

		output := filepath.Join(outputDir, outputName)

		if costume.DataFormat != "svg" {
			if err := os.MkdirAll(outputDir, 0755); err != nil {
				return fmt.Errorf("create asset directory: %w", err)
			}

			if err := copyFile(input, output); err != nil {
				return fmt.Errorf("copy costume %q: %w", costume.Name, err)
			}

			continue
		}

		fmt.Println("SVG:", input)
		fmt.Println("PNG:", output)

		// Stage backdrops use the virtual stage size. Sprite costumes keep
		// their natural SVG dimensions so Scratch rotation centers remain valid.
		width, height := 480, 360
		if !target.IsStage {
			icon, readErr := oksvg.ReadIcon(input, 0)
			if readErr != nil {
				return fmt.Errorf("read sprite SVG %q: %w", costume.Name, readErr)
			}
			width = maxInt(1, int(math.Ceil(icon.ViewBox.W)))
			height = maxInt(1, int(math.Ceil(icon.ViewBox.H)))
		}

		// SVG -> PNG
		err := SVGToPNG(
			input,
			output,
			width,
			height,
		)

		if err != nil {
			return fmt.Errorf(
				"convert costume %q: %w",
				costume.Name,
				err,
			)
		}

		fmt.Println("✓ converted")
		fmt.Println()
	}

	for _, sound := range target.Sounds {
		input := filepath.Join(projectDir, sound.MD5Ext)
		if _, err := os.Stat(input); err != nil {
			return fmt.Errorf("sound not found: %s", input)
		}

		output := filepath.Join(outputDir, sound.MD5Ext)
		if err := os.MkdirAll(outputDir, 0755); err != nil {
			return fmt.Errorf("create sound asset directory: %w", err)
		}
		if err := copyFile(input, output); err != nil {
			return fmt.Errorf("copy sound %q: %w", sound.Name, err)
		}
	}

	return nil
}

func maxInt(left, right int) int {
	if left > right {
		return left
	}
	return right
}

func copyFile(input, output string) error {
	data, err := os.ReadFile(input)
	if err != nil {
		return err
	}

	return os.WriteFile(output, data, 0644)
}

func SVGToPNG(
	input string,
	output string,
	width int,
	height int,
) error {
	icon, err := oksvg.ReadIcon(input, 0)
	if err != nil {
		return fmt.Errorf("read svg: %w", err)
	}

	// Ursprüngliche SVG-Größe
	srcW := icon.ViewBox.W
	srcH := icon.ViewBox.H

	// Faktor, der das komplette SVG innerhalb von width × height hält
	scale := math.Min(
		float64(width)/srcW,
		float64(height)/srcH,
	)

	dstW := srcW * scale
	dstH := srcH * scale

	// Zentrieren
	x := (float64(width) - dstW) / 2
	y := (float64(height) - dstH) / 2

	icon.SetTarget(
		x,
		y,
		dstW,
		dstH,
	)

	img := image.NewRGBA(
		image.Rect(0, 0, width, height),
	)

	scanner := rasterx.NewScannerGV(
		width,
		height,
		img,
		img.Bounds(),
	)

	dasher := rasterx.NewDasher(
		width,
		height,
		scanner,
	)

	icon.Draw(dasher, 1)

	if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil {
		return fmt.Errorf("create output directory: %w", err)
	}

	file, err := os.Create(output)
	if err != nil {
		return fmt.Errorf("create png: %w", err)
	}
	defer file.Close()

	if err := png.Encode(file, img); err != nil {
		return fmt.Errorf("encode png: %w", err)
	}

	return nil
}
