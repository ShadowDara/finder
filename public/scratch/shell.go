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

cd $EXPORT_PATH

cat > $EXPORT_PATH/src/ScratchRuntime.cpp <<'EOF'
%s
EOF

cat > $EXPORT_PATH/src/ScratchRuntime.hpp <<'EOF'
%s
EOF

cat > $EXPORT_PATH/src/ScratchSprite.cpp <<'EOF'
%s
EOF

cat > $EXPORT_PATH/src/ScratchSprite.hpp <<'EOF'
%s
EOF

cat > $EXPORT_PATH/CMakeLists.txt <<'EOF'
%s
EOF

cat > $EXPORT_PATH/clone.sh <<'EOF'
%s
EOF

cat > $EXPORT_PATH/src/main.cpp <<'EOF'
%s
EOF

`, conf.Outdir, ScratchRuntime, ScratchRuntimeH, ScratchSprite, ScratchSpriteH, CMakeLists, CloneScript, cpp)

	return shells
}
