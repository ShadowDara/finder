#!/bin/bash
set -e

echo "Installing Fling..."

mkdir -p /tmp/flinginstall

git clone --depth=1 https://github.com/ShadowDara/fling.git /tmp/flinginstall

cd /tmp/flinginstall

g++ -O3 -march=native -mtune=native -flto -DNDEBUG   $(find . -path './cpp/rustffi' -prune -o -path './cpp/wasm' -prune -o -path './test' -prune -o -path './wasm' -prune -o -name '*.cpp' -print)   -o fling

install -m 755 fling /usr/local/bin/fling

rm -rf /tmp/flinginstall

echo "Fling installed: $(command -v fling)"
