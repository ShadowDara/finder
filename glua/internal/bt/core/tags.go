package core

import (
	"fmt"
	"os/exec"
)

// Function to add a Tag to a git repo and push it
func Addtag(tag string) {
	cmd := exec.Command("git", "tag", tag)

	err := cmd.Run()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	cmd = exec.Command("git", "push", "origin", tag)

	err = cmd.Run()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	fmt.Printf("Pushed Tag %s to Github\n", tag)
}
