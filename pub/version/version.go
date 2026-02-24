package version

import (
	"strconv"
	"strings"
)

type Version struct {
	major int
	minor int
	patch int
}

// Function to parse a Verions
func parseVersion(v string) (Version, bool) {
	parts := strings.Split(v, ".")
	if len(parts) != 3 {
		return Version{}, false
	}

	major, err1 := strconv.Atoi(parts[0])
	minor, err2 := strconv.Atoi(parts[1])
	patch, err3 := strconv.Atoi(parts[2])

	if err1 != nil || err2 != nil || err3 != nil {
		return Version{}, false
	}

	return Version{
		major: major,
		minor: minor,
		patch: patch,
	}, true
}

// Returns True when Version 1 is newer
func IsNewer(version1 string, version2 string) bool {
	v1, ok1 := parseVersion(version1)
	v2, ok2 := parseVersion(version2)

	if !ok1 || !ok2 {
		return false
	}

	if v1.major != v2.major {
		return v1.major > v2.major
	}

	if v1.minor != v2.minor {
		return v1.minor > v2.minor
	}

	return v1.patch > v2.patch
}
