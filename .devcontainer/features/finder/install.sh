#!/bin/bash
set -e

echo "Installing finder Version v0.3.18 ..."

# curl -fsSL https://raw.githubusercontent.com/ShadowDara/finder/refs/heads/main/install.sh -y --version v0.3.18 | sh
curl -fsSL https://raw.githubusercontent.com/ShadowDara/finder/refs/heads/main/install.sh -y --latest | sh
