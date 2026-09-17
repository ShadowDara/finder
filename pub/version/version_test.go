package version

import (
	"testing"
)

func TestIsNewer_MajorVersion(t *testing.T) {
	cases := []struct {
		name     string
		v1       string
		v2       string
		expected bool
	}{
		{"newer major", "2.0.0", "1.9.9", true},
		{"older major", "1.9.9", "2.0.0", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsNewer(tc.v1, tc.v2); got != tc.expected {
				t.Fatalf("IsNewer(%q, %q) = %v, want %v", tc.v1, tc.v2, got, tc.expected)
			}
		})
	}
}

func TestIsNewer_MinorVersion(t *testing.T) {
	cases := []struct {
		name     string
		v1       string
		v2       string
		expected bool
	}{
		{"newer minor", "1.2.0", "1.1.99", true},
		{"older minor", "1.1.0", "1.2.0", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsNewer(tc.v1, tc.v2); got != tc.expected {
				t.Fatalf("IsNewer(%q, %q) = %v, want %v", tc.v1, tc.v2, got, tc.expected)
			}
		})
	}
}

func TestIsNewer_PatchVersion(t *testing.T) {
	cases := []struct {
		name     string
		v1       string
		v2       string
		expected bool
	}{
		{"newer patch", "1.2.3", "1.2.2", true},
		{"older patch", "1.2.2", "1.2.3", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsNewer(tc.v1, tc.v2); got != tc.expected {
				t.Fatalf("IsNewer(%q, %q) = %v, want %v", tc.v1, tc.v2, got, tc.expected)
			}
		})
	}
}

func TestIsNewer_EqualVersions(t *testing.T) {
	if IsNewer("1.2.3", "1.2.3") {
		t.Fatal("IsNewer of equal versions should be false")
	}
	if IsNewer("0.0.0", "0.0.0") {
		t.Fatal("IsNewer of equal versions should be false")
	}
}

func TestIsNewer_InvalidVersions(t *testing.T) {
	invalid := []string{
		"", "1", "1.2", "1.2.3.4", "abc", "a.b.c", "1.2.x", "1..3",
		"-1.2.3", "1.2.-3", "1.2.3 ", " 1.2.3",
	}

	for _, v := range invalid {
		// Invalid version on either side must lead to false (fail closed).
		if IsNewer(v, "1.0.0") {
			t.Fatalf("IsNewer(%q, 1.0.0) should be false for invalid version", v)
		}
		if IsNewer("1.0.0", v) {
			t.Fatalf("IsNewer(1.0.0, %q) should be false for invalid version", v)
		}
	}
}

func TestIsNewer_BothInvalid(t *testing.T) {
	if IsNewer("abc", "def") {
		t.Fatal("IsNewer of two invalid versions should be false")
	}
	if IsNewer("", "") {
		t.Fatal("IsNewer of two empty versions should be false")
	}
}

func TestParseVersion_Valid(t *testing.T) {
	v, ok := parseVersion("3.14.159")
	if !ok {
		t.Fatal("expected valid version")
	}
	if v.major != 3 || v.minor != 14 || v.patch != 159 {
		t.Fatalf("unexpected parsed values: %+v", v)
	}
}

func TestParseVersion_Invalid(t *testing.T) {
	cases := []string{"", "1", "1.2", "1.2.3.4", "x.y.z", "1.2.a", "1..2"}
	for _, tc := range cases {
		if _, ok := parseVersion(tc); ok {
			t.Fatalf("parseVersion(%q) should fail", tc)
		}
	}
}

func TestIsNewer_LargeNumbers(t *testing.T) {
	if !IsNewer("999999999.0.0", "1.0.0") {
		t.Fatal("large major version should be considered newer")
	}
}