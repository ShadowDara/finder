// Package json5 contains a tiny preprocessing helper for accepting a
// subset of JSON5-like inputs. It is intentionally minimal: it removes
// comments and quotes simple, unquoted object keys so the result can be
// parsed with the standard library JSON decoder.
package json5

import (
    "regexp"
)

// PreprocessJSON5 removes JSON5-style comments (// and /* */) and quotes
// simple unquoted object keys so the output becomes valid JSON for the
// built-in encoding/json package. This function performs textual
// transformations and should not be used as a complete JSON5 parser.
func PreprocessJSON5(data string) string {
    // Remove line comments (// ...)
    lineComment := regexp.MustCompile(`//.*`)
    data = lineComment.ReplaceAllString(data, "")

    // Remove block comments (/* ... */)
    blockComment := regexp.MustCompile(`(?s)/\*.*?\*/`)
    data = blockComment.ReplaceAllString(data, "")

    // Quote unquoted keys such as: key: value  ->  "key": value
    // This simple regex matches identifiers that look like JS identifiers
    // and are followed by a colon.
    keyRegex := regexp.MustCompile(`(?m)(^|{|,)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:`)
    data = keyRegex.ReplaceAllString(data, `$1"$2":`)

    return data
}
