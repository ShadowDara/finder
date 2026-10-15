# Makefile for the KeyValueParser project

dbuild:
	cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
	cmake --build build

build:
	cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
	cmake --build build

run:
	$(MAKE) dbuild
	./build/KeyValueParser

run_db:
	$(MAKE) dbuild
	./build/DBParser

clean:
	rm -rf build

.PHONY: dbuild build run run_db clean
