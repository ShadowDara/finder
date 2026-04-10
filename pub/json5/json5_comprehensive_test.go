package json5

import (
	"strings"
	"testing"
)

func TestPreprocessJSON5_BasicKeyQuoting(t *testing.T) {
	in := `{ simpleKey: 123 }`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, `"simpleKey"`) {
		t.Errorf("expected simpleKey to be quoted in: %s", out)
	}
}

func TestPreprocessJSON5_UnderscoreKeys(t *testing.T) {
	in := `{ my_key: 1, another_key_name: 2 }`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, `"my_key"`) {
		t.Errorf("expected my_key to be quoted")
	}
	if !strings.Contains(out, `"another_key_name"`) {
		t.Errorf("expected another_key_name to be quoted")
	}
}

func TestPreprocessJSON5_SpecialCharKeys(t *testing.T) {
	in := `{ $key: 1, _key: 2 }`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, `"$key"`) {
		t.Errorf("expected $key to be quoted")
	}
	if !strings.Contains(out, `"_key"`) {
		t.Errorf("expected _key to be quoted")
	}
}

func TestPreprocessJSON5_LineCommentRemoval(t *testing.T) {
	in := `{
		// Line comment here
		key: value
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "//") {
		t.Errorf("expected line comments to be removed")
	}
}

func TestPreprocessJSON5_BlockCommentRemoval(t *testing.T) {
	in := `{
		/* Block comment here */
		key: value
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "/*") || strings.Contains(out, "*/") {
		t.Errorf("expected block comments to be removed")
	}
}

func TestPreprocessJSON5_MultipleComments(t *testing.T) {
	in := `{
		// comment 1
		key1: value1, /* comment 2 */ key2: value2
		// comment 3
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "//") || strings.Contains(out, "/*") {
		t.Errorf("expected all comments to be removed")
	}
}

func TestPreprocessJSON5_NestedComments(t *testing.T) {
	in := `{
		/* outer /* inner */ outer */
		key: value
	}`
	out := PreprocessJSON5(in)

	// Nested comments behavior might vary, but should not panic
	_ = out
}

func TestPreprocessJSON5_StringQuotesPreserved(t *testing.T) {
	in := `{
		"stringKey": "stringValue",
		unquotedKey: unquotedValue
	}`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, `"stringKey"`) {
		t.Errorf("expected quoted string key to be preserved")
	}
	if !strings.Contains(out, `"stringValue"`) {
		t.Errorf("expected quoted string value to be preserved")
	}
}

func TestPreprocessJSON5_TrailingCommas(t *testing.T) {
	in := `{
		key1: value1,
		key2: value2,
	}`
	out := PreprocessJSON5(in)

	// Function should handle or remove trailing commas
	if out == "" {
		t.Errorf("empty output for trailing comma input")
	}
}

func TestPreprocessJSON5_EmptyObject(t *testing.T) {
	in := `{}`
	out := PreprocessJSON5(in)

	if out == "" {
		t.Errorf("expected output for empty object")
	}
	if !strings.Contains(out, "{") || !strings.Contains(out, "}") {
		t.Errorf("expected braces in output: %s", out)
	}
}

func TestPreprocessJSON5_ArrayValues(t *testing.T) {
	in := `{
		items: [1, 2, 3],
		names: ["a", "b", "c"]
	}`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, "[") || !strings.Contains(out, "]") {
		t.Errorf("expected array brackets in output")
	}
}

func TestPreprocessJSON5_ComplexNesting(t *testing.T) {
	in := `{
		// outer comment
		level1: {
			/* inner comment */
			level2Key: value
		}
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "//") || strings.Contains(out, "/*") {
		t.Errorf("expected nested comments to be removed")
	}
	if !strings.Contains(out, `"level1"`) {
		t.Errorf("expected nested key to be quoted")
	}
}

func TestPreprocessJSON5_NumericValues(t *testing.T) {
	in := `{
		number: 42,
		float: 3.14,
		negative: -10
	}`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, "42") {
		t.Errorf("expected numeric value to be preserved")
	}
}

func TestPreprocessJSON5_BooleanValues(t *testing.T) {
	in := `{
		isTrue: true,
		isFalse: false
	}`
	out := PreprocessJSON5(in)

	// Booleans should be preserved (unquoted or as-is)
	if out == "" {
		t.Errorf("expected output for boolean values")
	}
}

func TestPreprocessJSON5_NullValue(t *testing.T) {
	in := `{
		empty: null
	}`
	out := PreprocessJSON5(in)

	if !strings.Contains(out, "null") {
		t.Errorf("expected null value to be preserved")
	}
}

func TestPreprocessJSON5_MixedQuotedUnquotedKeys(t *testing.T) {
	in := `{
		"alreadyQuoted": 1,
		needsQuoting: 2,
		"another":3
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, `""alreadyQuoted""`) {
		t.Errorf("expected no double-quoting")
	}
	if !strings.Contains(out, `"needsQuoting"`) {
		t.Errorf("expected unquoted key to be quoted")
	}
}

func TestPreprocessJSON5_SingleLineComment(t *testing.T) {
	in := `{ key: value } // trailing comment`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "//") {
		t.Errorf("expected trailing comment to be removed")
	}
}

func TestPreprocessJSON5_Whitespace(t *testing.T) {
	in := `{
		key:   value,
		another:    anotherValue
	}`
	out := PreprocessJSON5(in)

	// Should preserve structure despite extra whitespace
	if !strings.Contains(out, `"key"`) {
		t.Errorf("expected keys to be processed despite whitespace")
	}
}

func TestPreprocessJSON5_SpecialCharactersInStrings(t *testing.T) {
	in := `{
		path: "C:\\Users\\name",
		regex: ".*test.*"
	}`
	out := PreprocessJSON5(in)

	if out == "" {
		t.Errorf("expected output with special characters in strings")
	}
}

func TestPreprocessJSON5_UnicodeCharacters(t *testing.T) {
	in := `{
		name: "Überschrift",
		emoji: "🎉"
	}`
	out := PreprocessJSON5(in)

	if out == "" {
		t.Errorf("expected output with unicode characters")
	}
}

func TestPreprocessJSON5_LargeInput(t *testing.T) {
	in := `{`
	for i := 0; i < 1000; i++ {
		if i > 0 {
			in += ","
		}
		in += `key` + string(rune(48+i%10)) + `: value` + string(rune(48+i%10))
	}
	in += `}`

	out := PreprocessJSON5(in)

	if out == "" {
		t.Errorf("expected output for large input")
	}
}

func TestPreprocessJSON5_CommentOnlyLines(t *testing.T) {
	in := `{
		// This entire line is a comment
		// Another comment line
		key: value
	}`
	out := PreprocessJSON5(in)

	if strings.Contains(out, "//") {
		t.Errorf("expected comment-only lines to be removed")
	}
	if !strings.Contains(out, `"key"`) {
		t.Errorf("expected valid content to remain")
	}
}
