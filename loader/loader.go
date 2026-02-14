package loader

import (
	"os"
)

// LoadFile reads the file at the given path and returns its contents as a
// string. It returns a non-nil error if the file cannot be read.
func LoadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
