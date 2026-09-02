#!/usr/bin/env bash

set -e

REPO="shadowdara/finder"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

detect_os() {
    case "$(uname -s)" in
        Linux*) echo "linux" ;;
        Darwin*) echo "darwin" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)
            echo "Unsupported OS: $(uname -s)" >&2
            exit 1
            ;;
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "amd64" ;;
        arm64|aarch64) echo "arm64" ;;
        *)
            echo "Unsupported architecture: $(uname -m)" >&2
            exit 1
            ;;
    esac
}

OS="$(detect_os)"
ARCH="$(detect_arch)"

echo "Detecting platform..."
echo "  OS:   $OS"
echo "  Arch: $ARCH"

VERSION="$(
    curl -fsSL \
        "https://api.github.com/repos/${REPO}/releases/latest" |
    grep '"tag_name":' |
    sed -E 's/.*"([^"]+)".*/\1/'
)"

if [ -z "$VERSION" ]; then
    echo "Could not determine latest version." >&2
    exit 1
fi

echo "  Version: $VERSION"

ARCHIVE="finder_${VERSION}_${OS}_${ARCH}"

if [ "$OS" = "windows" ]; then
    ARCHIVE="${ARCHIVE}.zip"
else
    ARCHIVE="${ARCHIVE}.tar.gz"
fi

URL="https://github.com/${REPO}/releases/download/${VERSION}/${ARCHIVE}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading:"
echo "  $URL"

curl -fL "$URL" -o "$TMP/archive"

mkdir -p "$INSTALL_DIR"

if [ "$OS" = "windows" ]; then
    unzip -q "$TMP/archive" -d "$TMP/package"
else
    mkdir "$TMP/package"
    tar -xzf "$TMP/archive" -C "$TMP/package"
fi

if [ "$OS" = "windows" ]; then
    cp "$TMP/package/finder.exe" "$INSTALL_DIR/finder.exe"
else
    install -m 755 "$TMP/package/finder" "$INSTALL_DIR/finder"
fi

echo
echo "Finder installed successfully!"
echo
echo "  $INSTALL_DIR/finder"
