#!/bin/bash
set -e

echo "Installing @shadowdara/seg..."

if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm is required but was not found."
    exit 1
fi

npm install -g @shadowdara/seg@0.2.4 --allow-scripts
