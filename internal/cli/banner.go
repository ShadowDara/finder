// banner.go contains Finder's ASCII-art logo.
package cli

import "fmt"

// Banner prints the ASCII-art "FINDER" logo to stdout.
// Called when finder is started without arguments.
func Banner() {
	text := ` ________ ___  ________   ________  _______   ________     
|\  _____\\  \|\   ___  \|\   ___ \|\  ___ \ |\   __  \    
\ \  \__/\ \  \ \  \\ \  \ \  \_|\ \ \   __/|\ \  \|\  \   
 \ \   __\\ \  \ \  \\ \  \ \  \ \\ \ \  \_|/_\ \   _  _\  
  \ \  \_| \ \  \ \  \\ \  \ \  \_\\ \ \  \_|\ \ \  \\  \| 
   \ \__\   \ \__\ \__\\ \__\ \_______\ \_______\ \__\\ _\ 
    \|__|    \|__|\|__| \|__|\|_______|\|_______|\|__|\|__|
`

	fmt.Println(text)
}
