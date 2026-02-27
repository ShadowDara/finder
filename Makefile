# Makefile for finder
#

# Standard run
all: build

# Build the Program in Debug Mode
build:
	go build ./cmd/finder

# Build a Release
release:
	go build -ldflags="-s -w -X finderversion.BuildTime=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" ./cmd/finder

# Install the program
install:
	$(MAKE) release
	sudo mv finder /usr/local/bin/finder
