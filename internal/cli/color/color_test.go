package color

import (
	"testing"
)

func TestColorCodesDefined(t *testing.T) {
	tests := []struct {
		name      string
		colorCode string
		expected  string
	}{
		{"Red", Red, "\x1b[31m"},
		{"Green", Green, "\x1b[32m"},
		{"Yellow", Yellow, "\x1b[33m"},
		{"Blue", Blue, "\x1b[34m"},
		{"Magenta", Magenta, "\x1b[35m"},
		{"Cyan", Cyan, "\x1b[36m"},
		{"Reset", Reset, "\x1b[0m"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.colorCode != tt.expected {
				t.Errorf("expected %q, got %q", tt.expected, tt.colorCode)
			}
		})
	}
}

func TestColorCodesNotEmpty(t *testing.T) {
	colors := []struct {
		name  string
		value string
	}{
		{"Red", Red},
		{"Green", Green},
		{"Yellow", Yellow},
		{"Blue", Blue},
		{"Magenta", Magenta},
		{"Cyan", Cyan},
		{"Reset", Reset},
	}

	for _, c := range colors {
		if c.value == "" {
			t.Errorf("color code %s should not be empty", c.name)
		}
	}
}

func TestColorCodesAreANSI(t *testing.T) {
	colors := []string{Red, Green, Yellow, Blue, Magenta, Cyan, Reset}
	
	for _, c := range colors {
		if len(c) < 3 {
			t.Errorf("ANSI escape sequence %q is too short", c)
		}
		if c[0] != '\x1b' {
			t.Errorf("color code %q does not start with ESC character", c)
		}
	}
}
