// Package fsd („File System Utilities”) enthält kleine, plattform-
// übergreifende Helfer rund um das Dateisystem:
//
//   - OpenFolder / OpenBrowser: Ordner bzw. URLs im System-Programm öffnen
//   - CopyFile / DirSize: Dateikopie und rekursive Größenberechnung
//   - GetBinaryDir: Verzeichnis des aktuell laufenden Binaries
package fsd

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// OpenFolder öffnet den angegebenen Ordner im nativen Dateimanager
// (Explorer unter Windows, Finder unter macOS, Standard-Dateimanager
// unter Linux). Unterstützte Plattformen: windows, darwin, linux.
func OpenFolder(path string) error {
	switch runtime.GOOS {
	case "windows":
		// Windows: `cmd /c start "" <pfad>` startet den Explorer
		cmd := exec.Command("cmd", "/c", "start", "", path)
		return cmd.Start()

	case "darwin":
		return exec.Command("open", path).Start()

	case "linux":
		return exec.Command("xdg-open", path).Start()

	default:
		return fmt.Errorf("OS %s wird nicht unterstützt", runtime.GOOS)
	}
}

// OpenBrowser öffnet eine URL im Standard-Webbrowser des Systems.
// Errors are intentionally ignored (fire-and-forget).
func OpenBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "darwin": // macOS
		cmd = "open"
		args = []string{url}
	default: // Linux
		cmd = "xdg-open"
		args = []string{url}
	}

	exec.Command(cmd, args...).Start()
}

// CopyFile kopiert src → dst (Byte für Byte) und synchronisiert den
// Inhalt danach auf die Platte (Sync). Eine bereits existierende
// Zieldatei wird übersprungen (no-op), nicht überschrieben.
func CopyFile(src, dst string) error {
	if _, err := os.Stat(dst); err == nil {
		// already exists → skip
		return nil
	}

	// Quelle öffnen
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("konnte Quelle nicht öffnen: %w", err)
	}
	defer sourceFile.Close()

	// Ziel anlegen (überschreibt falls existiert)
	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("konnte Ziel nicht anlegen: %w", err)
	}
	defer destFile.Close()

	// Inhalt kopieren
	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("fehler beim Kopieren: %w", err)
	}

	// sicherstellen, dass alles auf Platte geschrieben wurde
	err = destFile.Sync()
	if err != nil {
		return fmt.Errorf("fehler beim Sync: %w", err)
	}

	return nil
}

// DirSize berechnet die Gesamtgröße eines Verzeichnisses rekursiv
// (Summe aller Dateigrößen; Verzeichnisse selbst zählen nicht).
func DirSize(path string) (int64, error) {
	var size int64
	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})
	return size, err
}

// GetBinaryDir liefert das Verzeichnis, in dem das aktuell laufende
// Binary liegt (z.B. für relative Ressourcen-Pfade). Panikt bei Fehlern.
func GetBinaryDir() string {
	ex, err := os.Executable() // Pfad zum Binary
	if err != nil {
		panic(err)
	}
	return filepath.Dir(ex) // nur das Verzeichnis
}
