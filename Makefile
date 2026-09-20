# Makefile for finder
#

# Standard run
all: build

# Run all the Tests
test:
	go test ./...

# Build the Program in Debug Mode
build:
	echo "Building the containers"
	go build -ldflags="-s -w" ./cmd/finder
	go build -ldflags="-s -w" ./cmd/findergen
	go build -ldflags="-s -w" ./cmd/csf

# Build a Release
release:
	go build -ldflags="-s -w -X finderversion.BuildTime=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" ./cmd/finder

# Install the program
install:
	$(MAKE) release
	sudo mv finder /usr/local/bin/finder

# When a VSCODE Devcontainer is created
devcontainer:
	go mod download
	$(MAKE) build
