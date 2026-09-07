package export

import "embed"

// FS contains the files used as the generated project template.
//
//go:embed samfile LICENSE minishell.html package.json CMakeSettings.json CMakeLists.txt README.txt clone.sh src/*.cpp src/*.hpp
var FS embed.FS
