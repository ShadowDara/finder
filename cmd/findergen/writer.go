package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"
)

// App hält Status und Konfiguration
type App struct {
	serverRunning bool
	lastActivity  time.Time
}

// ===================
// Methoden
// ===================

func (a *App) monitorIdle() {
	for {
		time.Sleep(time.Minute)
		if time.Since(a.lastActivity) > 10*time.Second {
			log.Println("Idle: standby mode (Server könnte hier pausieren)")
			// TODO: Ressourcen freigeben oder Server stoppen
		}
	}
}

func (a *App) consoleLoop() {
	reader := bufio.NewReader(os.Stdin)
	fmt.Println("\nType 'help' for more infos\n")

	for {
		//fmt.Print("> ")
		input, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				log.Println("EOF - Programm existed.")
				os.Exit(0)
			}
			log.Printf("Error while reading the Input: %v\n", err)
			continue
		}

		text := strings.TrimSpace(input)
		a.lastActivity = time.Now()

		if text == "" {
			continue
		}

		// quit := core.ParseArgs([]string{text}, &a.serverRunning)
		// if quit {
		// 	os.Exit(0)
		// }
	}
}
