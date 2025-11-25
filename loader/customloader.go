package loader

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

const PROGRAM_NAME = "finder"

// LoadCustomJSON lädt eine Datei <name>.json5 aus dem AppData-Finder-Ordner.
// Rückgabe entspricht genau JSONtemplateLoader:
//
//	[]byte → Inhalt
//	error  → nil, wenn gefunden
func LoadCustomJSON(name string) ([]byte, error) {
	configPath, err := getAppDataPath()
	if err != nil {
		return nil, err
	}

	// AppData Ordner automatisch erstellen (falls nicht existiert)
	if err := os.MkdirAll(configPath, 0755); err != nil {
		return nil, err
	}

	filename := name + ".json5"
	fullPath := filepath.Join(configPath, filename)

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("could not read custom json file '%s': %w", filename, err)
	}

	return data, nil
}

// Ermittelt den plattformabhängigen AppData-Pfad
// Windows → %AppData%\finder
// Linux   → ~/.config/finder
// macOS   → ~/Library/Application Support/finder
func getAppDataPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", errors.New("could not determine user home directory")
	}

	switch runtime.GOOS {
	case "windows":
		appData := os.Getenv("APPDATA")
		if appData == "" {
			return "", errors.New("APPDATA not set")
		}
		return filepath.Join(appData, PROGRAM_NAME), nil

	case "linux":
		return filepath.Join(home, ".config", PROGRAM_NAME), nil

	case "darwin":
		return filepath.Join(home, "Library", "Application Support", PROGRAM_NAME), nil
	}

	return "", errors.New("unsupported OS")
}
