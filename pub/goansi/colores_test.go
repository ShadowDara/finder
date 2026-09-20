package goansi

import (
	"strings"
	"testing"
)

func TestColorWrappers_AddCodes(t *testing.T) {
	cases := []struct {
		name     string
		fn       func(string) string
		expected []string
	}{
		{"Black", Black, []string{BLACK, END}},
		{"Red", Red, []string{RED, END}},
		{"Green", Green, []string{GREEN, END}},
		{"Yellow", Yellow, []string{YELLOW, END}},
		{"Blue", Blue, []string{BLUE, END}},
		{"Purple", Purple, []string{PURPLE, END}},
		{"Cyan", Cyan, []string{CYAN, END}},
		{"White", White, []string{WHITE, END}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			out := tc.fn("hello")
			if !strings.HasPrefix(out, tc.expected[0]) {
				t.Fatalf("%s output %q does not start with %q", tc.name, out, tc.expected[0])
			}
			if !strings.HasSuffix(out, tc.expected[1]) {
				t.Fatalf("%s output %q does not end with %q", tc.name, out, tc.expected[1])
			}
			if !strings.Contains(out, "hello") {
				t.Fatalf("%s output %q does not contain the input text", tc.name, out)
			}
		})
	}
}

func TestColorWrappers_PreserveInput(t *testing.T) {
	inputs := []string{"", " ", "a b c", "äöü", "text with \x1b[31m embedded ansi"}
	for _, in := range inputs {
		if out := Red(in); !strings.Contains(out, in) {
			t.Fatalf("Red(%q) = %q does not preserve input", in, out)
		}
	}
}

func TestColorWrappers_ExactValues(t *testing.T) {
	if got, want := Green("x"), "\x1b[32mx\x1b[0m"; got != want {
		t.Fatalf("Green(x) = %q, want %q", got, want)
	}
	if got, want := Red("y"), "\x1b[31my\x1b[0m"; got != want {
		t.Fatalf("Red(y) = %q, want %q", got, want)
	}
}

func TestColorConstants_UniquePrefix(t *testing.T) {
	// Every color constant should be a distinct escape sequence.
	colors := []string{BLACK, RED, GREEN, YELLOW, BLUE, PURPLE, CYAN, WHITE, END}
	seen := make(map[string]bool)
	for _, c := range colors {
		if c == "" {
			t.Fatal("empty color constant")
		}
		if seen[c] {
			t.Fatalf("duplicate color constant %q", c)
		}
		seen[c] = true
	}
}

func TestStyleConstants_WellFormed(t *testing.T) {
	styles := []string{BOLD, ITALIC, UNDERLINED, REVERSE_TEXT, NOT_UNDERLINED, POSITIVE_TEXT}
	for _, s := range styles {
		if !strings.HasPrefix(s, "\x1b[") {
			t.Fatalf("style %q should start with ESC [", s)
		}
		if !strings.HasSuffix(s, "m") {
			t.Fatalf("style %q should end with 'm'", s)
		}
	}
}

func TestColorWrappers_EmptyInput(t *testing.T) {
	out := Cyan("")
	if out != CYAN+END {
		t.Fatalf("Cyan('') = %q, want %q", out, CYAN+END)
	}
}