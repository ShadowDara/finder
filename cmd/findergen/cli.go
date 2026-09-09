package main

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/internal/cache"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/mcapp"
	"github.com/shadowdara/finder/pub/argparser"
	"github.com/shadowdara/finder/pub/fsd"
)

type Conf struct {
	port int
}

func parseCliArgs() Conf {
	// Create Arg Parser

	var newconf Conf

	// NEW
	root := argparser.NewCommand("findergen",
		"the http server for finder to create and view templates", "Check out github for more infos or the finder website:\nhttps://github.com/shadowdara/finder\nhttps://shadowdara.github.io/finder", false)

	// Add Version Command
	versionCmd := argparser.NewCommand(
		"--version", "to get the Version of the Program", "", false, "-v", "v", "version")

	// Collect worlds from finder cache for minecraft worlds
	worldsCmd := argparser.NewCommand("worlds", "Collects all Minecraft Worlds from the Finder Cache and creates a JSON file for the WebUI", "", false, "w")

	// Cache Size Command
	cacheSizeCmd := argparser.NewCommand("cache-size", "Calculates the Size of the Finder Cache and prints it to the console", "", false, "cachesize", "cs")

	// Port
	root.Number("port", 0, "Change the Server Port", false, "p")

	root.AddSubcommand(versionCmd)
	root.AddSubcommand(worldsCmd)
	root.AddSubcommand(cacheSizeCmd)

	// Parse the Arguments
	cmd := root.Parse(os.Args[1:])

	newconf.port = int(cmd.GetNumber("port"))

	switch cmd {
	case versionCmd:
		{
			fmt.Println(finderversion.Version)
			os.Exit(0)
		}

	case worldsCmd:
		{
			worlds, err := cache.LoadCache("minecraftworld")
			if err != nil {
				fmt.Println("Error loading worlds:", err)
				os.Exit(1)
			}

			mcapp.SaveWorlds(worlds.Paths)

			os.Exit(0)
		}
	case cacheSizeCmd:
		{
			path, err := cache.GetCachePath()
			if err != nil {
				fmt.Println("Error getting cache path:", err)
				os.Exit(1)
			}

			size, err := fsd.DirSize(path)
			if err != nil {
				fmt.Println("Error calculating cache size:", err)
				os.Exit(1)
			}

			fmt.Printf("Cache Size: %.2f MB\n", float64(size)/(1024*1024))
			os.Exit(0)
		}
	}

	return newconf
}
