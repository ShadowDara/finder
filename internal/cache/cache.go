package cache

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/shadowdara/finder/internal/templates"
)

type CacheFile struct {
	Timestamp string   `json:"date"`
	Paths     []string `json:"locations"`
}

// Get the Cache Path
// ~/.finder/cache
func GetCachePath() (string, error) {
	path, err := templates.GetCustomPath()
	if err != nil {
		return "", err
	}

	return filepath.Join(path, "cache"), nil
}

func saveJSON(path string, data any) error {
	// Ordner erstellen
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	// JSON erzeugen
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	// Datei schreiben
	return os.WriteFile(path, jsonData, 0644)
}

// Save the Cache data
// - name: name of the template file
// - paths: paths which where found for the template
func SaveCache(name string, paths []string) error {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	cachepath, err := GetCachePath()
	if err != nil {
		return err
	}

	path := filepath.Join(cachepath, name+".json")

	var cache CacheFile

	cache.Timestamp = timestamp
	cache.Paths = paths

	return saveJSON(path, cache)
}

// Load the Cache data, name is the of the template
func LoadCache(name string) (CacheFile, error) {
	var cacheVal CacheFile

	cachepath, err := GetCachePath()
	if err != nil {
		return cacheVal, err
	}

	path := filepath.Join(cachepath, name+".json")

	data, err := os.ReadFile(path)
	if err != nil {
		return cacheVal, err
	}

	if err := json.Unmarshal(data, &cacheVal); err != nil {
		return cacheVal, err
	}

	return cacheVal, nil
}
