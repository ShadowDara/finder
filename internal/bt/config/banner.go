package config

import "fmt"

func Banner() {
	text :=
		` ________  _________   
|\   __  \|\___   ___\ 
\ \  \|\ /\|___ \  \_| 
 \ \   __  \   \ \  \  
  \ \  \|\  \   \ \  \ 
   \ \_______\   \ \__\
    \|_______|    \|__|
`

	fmt.Println(text)
}
