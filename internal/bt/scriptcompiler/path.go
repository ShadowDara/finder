package scriptcompiler

import (
	"fmt"

	"github.com/shadowdara/finder/pub/goansi"
)

func Addpath() {
	fmt.Println(goansi.Green("Add the BIN Path to your Shell\n"))
	fmt.Println(goansi.Red("# Bash"))
	fmt.Println("export PATH=\"$PWD/.samengine/bin:$PATH\n")
	fmt.Println(goansi.Red("# Powershell"))
	fmt.Println("$env:PATH = \"$PWD\\.samengine\\bin;\" + $env:PATH\n")
	fmt.Println(goansi.Red("# CMD"))
	fmt.Println("set PATH=%CD%\\.samengine\\bin;%PATH%\n")
}
