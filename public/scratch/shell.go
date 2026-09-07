package scratch

import (
	"fmt"

	"github.com/shadowdara/finder/public/scratch/config"
	exporttemplate "github.com/shadowdara/finder/public/scratch/export"
)

func exportFile(path string) string {
	data, err := exporttemplate.FS.ReadFile(path)
	if err != nil {
		panic(fmt.Sprintf("read embedded export template %q: %v", path, err))
	}

	return string(data)
}

func GenShellScript(cpp string, conf config.Config) string {
	shells := fmt.Sprintf(`
#!/bin/bash

EXPORT_PATH=%s
IMPORT_PATH=%s
CACHEDIR=%s

# Clear
#rm -rf $EXPORT_PATH

mkdir -p $EXPORT_PATH
mkdir -p $EXPORT_PATH/src
mkdir -p $EXPORT_PATH/resources

touch $EXPORT_PATH/CMakeSettings.json
cat > $EXPORT_PATH/CMakeSettings.json <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/colors.hpp
cat > $EXPORT_PATH/src/colors.hpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/Logger.cpp
cat > $EXPORT_PATH/src/Logger.cpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/Logger.hpp
cat > $EXPORT_PATH/src/Logger.hpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchUI.cpp
cat > $EXPORT_PATH/src/ScratchUI.cpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchUI.hpp
cat > $EXPORT_PATH/src/ScratchUI.hpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchRuntime.cpp
cat > $EXPORT_PATH/src/ScratchRuntime.cpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchRuntime.hpp
cat > $EXPORT_PATH/src/ScratchRuntime.hpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchSprite.cpp
cat > $EXPORT_PATH/src/ScratchSprite.cpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/ScratchSprite.hpp
cat > $EXPORT_PATH/src/ScratchSprite.hpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/CMakeLists.txt
cat > $EXPORT_PATH/CMakeLists.txt <<'EOF'
%s
EOF

touch $EXPORT_PATH/clone.sh
cat > $EXPORT_PATH/clone.sh <<'EOF'
%s
EOF

touch $EXPORT_PATH/src/main.cpp
cat > $EXPORT_PATH/src/main.cpp <<'EOF'
%s
EOF

touch $EXPORT_PATH/README.txt
cat > $EXPORT_PATH/README.txt <<'EOF'
%s
EOF

# Copy Images and other files
cp -r $IMPORT_PATH/** $EXPORT_PATH/resources
cp -r $CACHEDIR/assets/** $EXPORT_PATH/resources

# Delete SVG Files
find ./$EXPORT_PATH/resources -type f -name "*.svg" -delete

echo "Run clone.sh to get the remaining dependencies for CMake, or read README.txt"
echo ""
echo "to get started run"
echo ""
echo "cd $EXPORT_PATH && chmod +x clone.sh && ./clone.sh && cat README.txt"
`,
		conf.Outdir,
		conf.Indir,
		conf.CacheDir,
		exportFile("CMakeSettings.json"),
		exportFile("src/colors.hpp"),
		exportFile("src/Logger.cpp"),
		exportFile("src/Logger.hpp"),
		exportFile("src/ScratchUI.cpp"),
		exportFile("src/ScratchUI.hpp"),
		exportFile("src/ScratchRuntime.cpp"),
		exportFile("src/ScratchRuntime.hpp"),
		exportFile("src/ScratchSprite.cpp"),
		exportFile("src/ScratchSprite.hpp"),
		exportFile("CMakeLists.txt"),
		exportFile("clone.sh"),
		cpp,
		exportFile("README.txt"))

	return shells
}
