# Makefile to Test Finder
# Currently only added Go test

test:
 	echo Test the JSON 5 Module
	cd internal/loader/json5 && go test
