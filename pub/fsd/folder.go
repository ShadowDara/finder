package fsd

import (
	"fmt"
	"os/exec"
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
