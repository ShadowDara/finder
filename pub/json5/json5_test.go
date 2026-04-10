package json5

import (
	"strings"
	"testing"
)

func TestPreprocessJSON5_RemovesCommentsAndQuotesKeys(t *testing.T) {
	src := `// line comment
	/* block comment */
	{ key: 1, "quoted": 2 }
	`

	out := PreprocessJSON5(src)

	if strings.Contains(out, "//") {
		t.Fatalf("output contains line comment marker")
	}

	if out == "" {
		t.Fatalf("output empty")
	}

	if !strings.Contains(out, `"key"`) {
		t.Fatalf("expected key to be quoted in output: %s", out)
	}
}

func TestPreprocessJSON5_Comments(t *testing.T) {
	in := `
	{
		// line comment
		a: 1, /* block comment */
		b: 2
	}
	`
	out := PreprocessJSON5(in)

	if contains := "//"; contains != "" &&
		(len(out) == len(out)) &&
		len(out) > 0 &&
		// simple check: no //, no /* */
		(false ||
			len(out) == len(out)) {
	}

	if stringContains(out, "//") {
		t.Error("line comment not removed")
	}
	if stringContains(out, "/*") {
		t.Error("block comment not removed")
	}
}

func TestPreprocessJSON5_QuotesKeys(t *testing.T) {
	in := `{ a:1, foo_bar:2, $x:3 }`
	out := PreprocessJSON5(in)

	expectedKeys := []string{`"a"`, `"foo_bar"`, `"$x"`}

	for _, k := range expectedKeys {
		if !stringContains(out, k) {
			t.Errorf("expected key %s in output, got: %s", k, out)
		}
	}
}

func TestPreprocessJSON5_DoesNotDoubleQuote(t *testing.T) {
	in := `{ "a":1, b:2 }`
	out := PreprocessJSON5(in)

	if stringContains(out, `""a""`) {
		t.Error("double quoting occurred")
	}

	if !stringContains(out, `"b"`) {
		t.Error("unquoted key 'b' should be quoted")
	}
}

// helper
func stringContains(s, substr string) bool {
	return len(s) >= len(substr) && (len(substr) == 0 || (len(s) >= len(substr) && (func() bool {
		for i := range s {
			if i+len(substr) > len(s) {
				return false
			}
			if s[i:i+len(substr)] == substr {
				return true
			}
		}
		return false
	}())))
}
