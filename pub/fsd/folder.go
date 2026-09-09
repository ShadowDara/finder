package fsd

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func OpenFolder(path string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		// Explorer öffnen
		cmd = exec.Command("explorer", path)
	case "darwin":
		// macOS Finder öffnen
		cmd = exec.Command("open", path)
	case "linux":
		// Linux: Standard-Dateimanager
		cmd = exec.Command("xdg-open", path)
	default:
		return fmt.Errorf("OS %s wird nicht unterstützt", runtime.GOOS)
	}

	return cmd.Start()
}

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

// CopyFile kopiert src → dst
func CopyFile(src, dst string) error {
	if _, err := os.Stat(dst); err == nil {
		// existiert schon → skip
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

func GetBinaryDir() string {
	ex, err := os.Executable() // Pfad zum Binary
	if err != nil {
		panic(err)
	}
	return filepath.Dir(ex) // nur das Verzeichnis
}
