package scratch

import (
	"fmt"
	"image"
	"image/png"
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

		if costume.DataFormat != "svg" {
			continue
		}

		// SVG-Datei im Scratch-Projekt
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

		// PNG-Dateiname
		output := filepath.Join(
			outputDir,
			target.Name+"_"+costume.Name+".png",
		)

		fmt.Println("SVG:", input)
		fmt.Println("PNG:", output)

		// SVG -> PNG
		err := SVGToPNG(
			input,
			output,
			480,
			360,
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

	return nil
}

func SVGToPNG(
	input string,
	output string,
	width int,
	height int,
) error {
	icon, err := oksvg.ReadIcon(
		input,
		0,
	)
	if err != nil {
		return fmt.Errorf("read svg: %w", err)
	}

	icon.SetTarget(
		0,
		0,
		float64(width),
		float64(height),
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

	icon.Draw(
		dasher,
		1,
	)

	if err := os.MkdirAll(
		filepath.Dir(output),
		0755,
	); err != nil {
		return fmt.Errorf(
			"create output directory: %w",
			err,
		)
	}

	file, err := os.Create(output)
	if err != nil {
		return fmt.Errorf(
			"create png: %w",
			err,
		)
	}
	defer file.Close()

	if err := png.Encode(file, img); err != nil {
		return fmt.Errorf(
			"encode png: %w",
			err,
		)
	}

	return nil
}
