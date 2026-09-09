package mcapp

// import (
// 	"fmt"
// 	"log"
// )

// // ParseArgs interpretiert Befehle.
// // Rückgabewert: true = Programm beenden
// func ParseArgs(args []string, serverRunning *bool) bool {
// 	if len(args) == 0 {
// 		return false
// 	}

// 	cmd := args[0]

// 	switch cmd {
// 	case "exit", "quit", "0":
// 		Stop()
// 		log.Println("Programm existed.")
// 		return true

// 	case "status":
// 		fmt.Println("=================================================")
// 		fmt.Println("Status Response")
// 		if *serverRunning {
// 			fmt.Println("HTTP Server is running")
// 		} else {
// 			fmt.Println("HTTP Server is off")
// 		}
// 		fmt.Println("=================================================")

// 	case "clean":
// 		fmt.Println("Should delete caches\nimplemented soon")

// 	case "server", "1":
// 		if *serverRunning {
// 			log.Println("HTTP Server läuft bereits.")
// 		} else {
// 			go Server()
// 			*serverRunning = true
// 			log.Println("HTTP Server starting.")
// 		}

// 	case "serverstop":
// 		if *serverRunning {
// 			Stop()
// 			*serverRunning = false
// 			log.Println("HTTP Server gestoppt.")
// 		} else {
// 			log.Println("HTTP Server ist nicht aktiv.")
// 		}

// 	case "open", "2":
// 		if !*serverRunning {
// 			log.Println("HTTP Server is not running - Starting")
// 			go Server()
// 			*serverRunning = true
// 		}
// 		log.Println("Opening Browser on http://127.0.0.1:4413")
// 		go OpenBrowser("http://127.0.0.1:4413")

// 	case "help":
// 		fmt.Println("Verfügbare Befehle:")
// 		fmt.Println("  status       - zeigt den aktuellen Status")
// 		fmt.Println("  server (1)   - startet den HTTP Server")
// 		fmt.Println("  serverstop   - stoppt den HTTP Server")
// 		fmt.Println("  open (2)     - öffnet die UI im Browser")
// 		fmt.Println("  exit, quit   - beendet das Programm")
// 		fmt.Println(
// 			`  worlds       - searches for all MC worlds on your computer and
//                  and caches then -> only in default paths
//   worlds-f     - searches for all MC worlds on your computer and
//   worlds-full    and caches then -> in all paths
//   clean        - to delete all the cache files`)

// 	case "worlds":
// 		go func() {
// 			log.Println("Searching for Worlds in default paths...")
// 			var worlds = SearchWorlds()
// 			log.Println("Worlds Found: ", worlds)
// 			SaveWorlds(worlds)
// 			log.Println("Finished Searching for Worlds")
// 		}()

// 	case "worlds-f", "worlds-full":
// 		go func() {
// 			log.Println("Searching for Worlds everywhere...")
// 			var worlds = SearchWorlds(true)
// 			log.Println("Worlds Found: ", worlds)
// 			SaveWorlds(worlds)
// 			log.Println("Finished Searching for Worlds")
// 		}()

// 	default:
// 		log.Printf("Unbekanntes Kommando: %s\n", cmd)
// 	}

// 	return false
// }
