#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Diese Verzeichnisse sollen gelöscht werden
REMOVE_DIRS=(
    "cache"
    "webcache"
    "installed"
    "bin"
)

# Diese Verzeichnisse bleiben bewusst erhalten
KEEP_DIRS=(
    "templates"
)

echo "Uninstall from: $SCRIPT_DIR"

for dir in "${REMOVE_DIRS[@]}"; do
    target="$SCRIPT_DIR/$dir"

    if [[ -d "$target" ]]; then
        echo "Removing: $target"
        rm -rf -- "$target"
    else
        echo "Not found: $target"
    fi
done

echo "Uninstall finder finished."
