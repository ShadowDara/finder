package db

import (
	"fmt"
	"os/exec"

	"github.com/shadowdara/finder/internal/templates"
)

func git(repoDir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = repoDir

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %v: %w\n%s", args, err, output)
	}

	return string(output), nil
}

// Safe the Git Database
func SaveDB() error {
	path, err := templates.GetCustomPath()
	if err != nil {
		return err
	}

	_, err = git(path, "init")
	if err != nil {
		return err
	}

	_, err = git(path, "add", ".")
	if err != nil {
		return err
	}

	_, err = git(path, "commit", "-m", "Safe Cache Data")
	if err != nil {
		return err
	}

	return nil
}
