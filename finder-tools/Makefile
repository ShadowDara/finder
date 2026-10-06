# Makefile for c++m

BUILD_DIR := build
BIN := c++m

.PHONY: all build clean rebuild run

all: build

build:
	cmake -S . -B $(BUILD_DIR)
	cmake --build $(BUILD_DIR)

clean:
	rm -rf $(BUILD_DIR)

rebuild: clean build

run: build
	./$(BUILD_DIR)/$(BIN)

PREFIX ?= $(HOME)/.local

# local install command
install: build
	install -Dm755 build/$(BIN) $(PREFIX)/bin/$(BIN)

