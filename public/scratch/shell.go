package scratch

import (
	"fmt"

	"github.com/shadowdara/finder/public/scratch/config"
)

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
`, conf.Outdir, ScratchRuntime, ScratchRuntimeH, ScratchSprite, ScratchSpriteH, CMakeLists, CloneScript, README, cpp)

	return shells
}
