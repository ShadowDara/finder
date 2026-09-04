package scriptcompiler

import (
	"os"

	"github.com/shadowdara/finder/glua/internal/bt/config"
)

func CompileScripts(cfg config.Config) {
	path := ".samengine/bin"

	// Ordner komplett löschen (falls vorhanden)
	err := os.RemoveAll(path)
	if err != nil {
		panic(err)
	}

	// Ordner neu erstellen
	err = os.MkdirAll(path, 0755)
	if err != nil {
		panic(err)
	}

	for name, cmd := range cfg.ProjectScripts {
		// Bash
		err := os.WriteFile(".samengine/bin/"+name, []byte(compile_bash(cmd)), 0644)
		if err != nil {
			panic(err)
		}

		// CMD
		err = os.WriteFile(".samengine/bin/"+name+".bat", []byte(compile_cmd(cmd)), 0644)
		if err != nil {
			panic(err)
		}

		// Powershell
		err = os.WriteFile(".samengine/bin/"+name+".ps1", []byte(compile_powershell(cmd)), 0644)
		if err != nil {
			panic(err)
		}
	}
}

func compile_bash(command string) string {
	s := "#!/bin/bash\n\n" +
		command + " \"$@\"" + "\n"
	return s
}

func compile_cmd(command string) string {
	s := "@echo off\n\n" +
		command + " %*" + "\n"
	return s
}

func compile_powershell(command string) string {
	s := "#!/usr/bin/env pwsh\n\n" +
		"& " + command + " @args" + "\n"
	return s
}
