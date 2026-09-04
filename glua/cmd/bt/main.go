package main

import (
	"fmt"
	"os"

	"github.com/shadowdara/finder/glua/internal/bt/config"
	conf "github.com/shadowdara/finder/glua/internal/bt/config"
	"github.com/shadowdara/finder/glua/internal/bt/core"
	"github.com/shadowdara/finder/glua/internal/bt/gitrepo"
	"github.com/shadowdara/finder/glua/internal/bt/scriptcompiler"
	"github.com/shadowdara/finder/pub/argparser"
)

func ParseArgs() {
	// Main Command
	root := argparser.NewCommand("bt", "a simple build helping tool", false)

	root.String("tag", "", "Tag you want to add to a Git Repo", false, "t")
	root.Bool("bin", false, "Add the script shortcuts to your terminal path", false)
	// root.Bool("compile", false, "Compile the Scripts from the Config File", false)

	compileCMD := argparser.NewCommand("compile", "Compile the Scripts from json file", false)
	goinstall := argparser.NewCommand("goinstall", "Install a go programm with CGO", false)
	executeCMD := argparser.NewCommand("x", "Execute on of the scripts", false)
	executeCMD.PassThrough = true

	gitrepoCMD := argparser.NewCommand("gitrepo", "pack/restore nested .git folders of sub-repositories", false)
	packCMD := argparser.NewCommand("pack", "Pack a git repo into a base64 file", false)
	restoreCMD := argparser.NewCommand("restore", "restore a git repo from a base64 file", false)
	packCMD.String("output", "./git-archives", "Output directory", false, "o")
	packCMD.Bool("encrypt", false, "Encrypt the archive with AES-256", false)
	packCMD.Bool("base64", false, "Also encode the archive as Base64", false)
	restoreCMD.Bool("decrypt", false, "Decrypt the archive", false)
	gitrepoCMD.AddSubcommand(packCMD)
	gitrepoCMD.AddSubcommand(restoreCMD)

	root.AddSubcommand(goinstall)
	root.AddSubcommand(compileCMD)
	root.AddSubcommand(executeCMD)
	root.AddSubcommand(gitrepoCMD)

	cmd := root.Parse(os.Args[1:])

	var config = config.LoadConfig()

	switch cmd {
	case goinstall:
		{
			core.RunGoInstall()
			return
		}
	case compileCMD:
		{
			scriptcompiler.CompileScripts(config)
			return
		}
	case executeCMD:
		{
			if len(executeCMD.Args) == 0 {
				executeCMD.PrintHelp()
				return
			}

			if err := core.Execute(executeCMD.Args); err != nil {
				fmt.Println("Error:", err)
			}
			return
		}
	case packCMD:
		{
			if len(packCMD.Args) == 0 {
				if err := gitrepo.PackInteractive(); err != nil {
					fmt.Println("Error:", err)
				}
				return
			}

			root := packCMD.Args[0]
			if err := gitrepo.Pack(gitrepo.PackOptions{
				Root: root, Output: packCMD.GetString("output"),
				Encrypt: packCMD.GetBool("encrypt"), Base64: packCMD.GetBool("base64"),
			}); err != nil {
				fmt.Println("Error:", err)
			}
			return
		}
	case restoreCMD:
		{
			if len(restoreCMD.Args) < 2 {
				if err := gitrepo.RestoreInteractive(); err != nil {
					fmt.Println("Error:", err)
				}
				return
			}

			if err := gitrepo.Restore(gitrepo.RestoreOptions{
				Archive: restoreCMD.Args[0], Destination: restoreCMD.Args[1],
				Decrypt: restoreCMD.GetBool("decrypt"),
			}); err != nil {
				fmt.Println("Error:", err)
			}
			return
		}
	}

	// Add a Tag to a Git Repo
	res := cmd.GetString("tag")
	if res != "" {
		core.Addtag(res)
		return
	}

	// add script Path
	if cmd.GetBool("bin") == true {
		scriptcompiler.Addpath()
		return
	}

	switch cmd {
	default:
		conf.Banner()
		fmt.Println("Buildtool Version " + core.GetVersion() + " by Shadowdara")
		cmd.PrintHelp()
	}
}

func main() {
	ParseArgs()
}
