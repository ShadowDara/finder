// Myself programmed JSON5 Loader

package json5

import (
	"regexp"
)

// PreprocessJSON5 removes JSON5 comments and quotes unquoted object keys.
func PreprocessJSON5(data string) string {
	// Remove line comments (// ...)
	lineComment := regexp.MustCompile(`//.*`)
	data = lineComment.ReplaceAllString(data, "")

	// Remove block comments (/* ... */)
	blockComment := regexp.MustCompile(`(?s)/\*.*?\*/`)
	data = blockComment.ReplaceAllString(data, "")

	// Quote unquoted keys:
	// Matches patterns like:
	//   key: value
	// but not
	//   "key": value
	// pattern explanation:
	//   (^|{|,)\s*     start of object (after brace or comma)
	//   ([A-Za-z_$][A-Za-z0-9_$]*)   valid JS identifier
	//   \s*:
	keyRegex := regexp.MustCompile(`(?m)(^|{|,)\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:`)

	data = keyRegex.ReplaceAllString(data, `$1"$2":`)

	return data
}
