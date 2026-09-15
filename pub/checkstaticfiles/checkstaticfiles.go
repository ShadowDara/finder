package checkstaticfiles

import (
	"log"

	"github.com/shadowdara/finder/pub/checkstaticfiles/core"
)

func Checkfiles(data []byte, settings int) {
	log.Println("Checking required files...")
	core.Main(data, settings)

	// Function is not ready yet
	//check_gitginore(settings)
}

// option to create an .gitignore file
func check_gitginore(settings int) {
	if core.Checksettings(settings, 0) {
		// Check if gitignore file exists
	}
}
