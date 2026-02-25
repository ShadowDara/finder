# Makefile for finder
#

build:
	go build ./cmd/finder

release:
	go build -ldflags="-s -w -X ./cmd/finder

install:
	$(MAKE) release
	sudo mv finder /usr/local/bin/finder
