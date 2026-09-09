#!/bin/bash

echo "curl -fsSL https://raw.githubusercontent.com/ShadowDara/finder/refs/heads/main/install.sh | sh"

docker build -f Dockerfile.ubuntu -t finderinstall .
docker run --rm -it finderinstall
