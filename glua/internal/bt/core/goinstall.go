package core

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// function to install a binary with cgo with zig as the compiler
func RunGoInstall() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Install Path: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)

	cmd := exec.Command("go", "install", name)

	// add new vars
	cmd.Env = append(os.Environ(),
		"CC=zig cc",
		"CXX=zig c++",
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		fmt.Println("Error: ", err)
	}
}

func Execute(args []string) error {
	cmd := exec.Command(args[0], args[1:]...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
