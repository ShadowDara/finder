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

mkdir -p $EXPORT_PATH
mkdir -p $EXPORT_PATH/src

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

echo "Run clone.sh to get the remaining dependencies for CMake, or read README.txt"
echo ""
echo "to get started run"
echo ""
echo "cd $EXPORT_PATH && chmod +x clone.sh && ./clone.sh && cat README.txt"
`, conf.Outdir,
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
