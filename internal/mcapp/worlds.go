package mcapp

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/fsd"
)

type World struct {
	Path         string `json:"path"`
	IconPath     string `json:"icon"`
	Size         int64  `json:"size,omitempty"`
	LastModified string `json:"last_modified,omitempty"`
}

func normalizeWorldIconPath(p string) string {
	normalized := filepath.ToSlash(p)
	normalized = strings.ReplaceAll(normalized, "\\", "/")
	for strings.Contains(normalized, "//") {
		normalized = strings.ReplaceAll(normalized, "//", "/")
	}
	return normalized
}

func makeWorld(dir string) World {
	// Basisverzeichnis der Welt

	// Icon-Pfad in der Welt
	icon := filepath.Join(dir, "icon.png")

	// Zielordner im Webcache
	webcacheDir, err := GetCachePath()
	if err != nil {
		fmt.Println("Fehler beim Abrufen des Webcache-Pfads:", err)
		return World{}
	}
	os.MkdirAll(webcacheDir, os.ModePerm)

	iconsDir := filepath.Join(webcacheDir, "icons")

	if err := os.MkdirAll(iconsDir, 0o755); err != nil {
		fmt.Println("Fehler beim Erstellen des Icon-Verzeichnisses:", err)
		return World{}
	}

	// Eindeutiger Dateiname: Ordnername + Hash vom Pfad
	base := filepath.Base(dir) // Ordnername
	safeBase := strings.ReplaceAll(base, " ", "_")

	h := sha1.Sum([]byte(dir))           // Hash vom kompletten Verzeichnis-Pfad
	hashPart := fmt.Sprintf("%x", h[:6]) // kurze Hash-Version (12 Hex-Zeichen)

	fileName := fmt.Sprintf("%s_%s.png", safeBase, hashPart)
	iconTarget := filepath.Join(iconsDir, fileName)

	fmt.Println(icon)
	fmt.Println(iconTarget)

	// Icon kopieren, wenn es existiert
	if _, err := os.Stat(icon); err != nil {
		fmt.Printf("Icon nicht gefunden: %s (%v)\n", icon, err)
	} else {
		fmt.Printf("Icon gefunden: %s\n", icon)

		if _, err := os.Stat(iconTarget); os.IsNotExist(err) {
			fmt.Printf("Kopiere nach: %s\n", iconTarget)

			if err := fsd.CopyFile(icon, iconTarget); err != nil {
				fmt.Printf("Fehler beim Kopieren: %v\n", err)
			}
		} else if err != nil {
			fmt.Printf("Fehler beim Prüfen des Ziel-Icons: %v\n", err)
		} else {
			fmt.Printf("Icon existiert bereits: %s\n", iconTarget)
		}
	}

	// relative Pfad
	relPath, err := filepath.Rel(webcacheDir, iconTarget)
	if err != nil {
		fmt.Println("Fehler beim Berechnen des relativen Pfads:", err)
		relPath = filepath.Base(iconTarget) // Fallback
	}
	relPath = normalizeWorldIconPath(relPath)

	info, err := os.Stat(dir)
	if err != nil {
		fmt.Println("Error getting file info:", err)
	}

	size, err := fsd.DirSize(dir)
	if err != nil {
		fmt.Println("Fehler:", err)
	}

	return World{
		Path:         dir,
		IconPath:     relPath,
		Size:         size,
		LastModified: info.ModTime().Format("2006-01-02 15:04:05"),
	}
}

// Save these to a file
func SaveWorlds(paths []string) {
	cachePath, err := GetCachePath()
	if err != nil {
		fmt.Println("Fehler beim Abrufen des benutzerdefinierten Pfads:", err)
		return
	}
	os.MkdirAll(cachePath, os.ModePerm)

	filePath := filepath.Join(cachePath, "worlds.json")
	file, err := os.Create(filePath)
	if err != nil {
		fmt.Println("Fehler beim Erstellen der Datei:", err)
		return
	}
	defer file.Close()

	// Pfade in Structs umwandeln
	var worlds []World
	for _, p := range paths {
		worlds = append(worlds, makeWorld(p))
	}

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(worlds); err != nil {
		fmt.Println("Fehler beim Schreiben der JSON:", err)
	}
}

// Welten laden
func LoadWorlds() []World {
	dir, err := GetCachePath()
	if err != nil {
		fmt.Println("Fehler beim Abrufen des benutzerdefinierten Pfads:", err)
		return nil
	}
	filePath := filepath.Join(dir, "worlds.json")

	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Fehler beim Öffnen der Datei:", err)
		return nil
	}
	defer file.Close()

	var worlds []World
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&worlds); err != nil {
		fmt.Println("Fehler beim Einlesen der JSON:", err)
		return nil
	}

	return worlds
}

func GetCachePath() (string, error) {
	path, err := templates.GetCustomPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(path, "webcache"), nil
}
