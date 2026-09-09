package core

import "github.com/shadowdara/finder/internal/finderversion"

// Function to get the Version
func GetVersion() string {
	return finderversion.Version
}
