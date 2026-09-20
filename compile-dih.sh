#!/bin/bash

set -e

OUTPUT="dih.exe"
SOURCE_DIR="cmd/dih"

SOURCES=$(find "$SOURCE_DIR" -type f -name '*.c')

echo "Building $SOURCES -> $OUTPUT..."

gcc $SOURCES -o "$OUTPUT"

echo "Build successful."
echo "Running $OUTPUT..."
echo ""

./"$OUTPUT" "$@"
