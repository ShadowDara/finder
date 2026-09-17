package cli

import (
	"testing"
)

// TestResolveAliasStartPath covers the start-path aliases: an alias key
// ending with "/" expands a prefix of the searched name.
func TestResolveAliasStartPath(t *testing.T) {
	cases := []struct {
		name   string // test description
		input  string // name that is being resolved
		alias  string
		target string
		want   string
	}{
		{"s/test expands to shadowdara.github.io/templates/test", "s/test", "s/", "shadowdara.github.io/templates/", "shadowdara.github.io/templates/test"},
		{"bare prefix resolves to the start path itself", "s/", "s/", "shadowdara.github.io/templates/", "shadowdara.github.io/templates"},
		{"normal single template alias still works as exact match", "myvue", "myvue", "shadowdara.github.io/test/template", "shadowdara.github.io/test/template"},
		{"start-path alias does not hijack unrelated names", "unrelated", "s/", "shadowdara.github.io/templates/", "unrelated"},
		{"name equal to a start-path key minus slash is not hijacked", "s", "s/", "shadowdara.github.io/templates/", "s"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			aliases := map[string]string{}
			if tc.alias != "" && tc.target != "" {
				aliases[tc.alias] = tc.target
			}
			got := resolveAliasMap(tc.input, aliases)
			if got != tc.want {
				t.Errorf("resolveAliasMap(%q, %v) = %q, want %q", tc.input, aliases, got, tc.want)
			}
		})
	}
}

// TestResolveAliasLongestPrefix checks that the longest matching start-path
// key wins when several prefixes match.
func TestResolveAliasLongestPrefix(t *testing.T) {
	aliases := map[string]string{
		"s/":         "shadowdara.github.io/templates/",
		"s/tools/":   "shadowdara.github.io/finder/tools/",
		"s/tools/g/": "shadowdara.github.io/finder/tools/git/",
	}

	cases := []struct {
		name string
		want string
	}{
		{"s/test", "shadowdara.github.io/templates/test"},
		{"s/tools/x", "shadowdara.github.io/finder/tools/x"},
		{"s/tools/g/stats", "shadowdara.github.io/finder/tools/git/stats"},
	}

	for _, tc := range cases {
		got := resolveAliasMap(tc.name, aliases)
		if got != tc.want {
			t.Errorf("resolveAliasMap(%q) = %q, want %q", tc.name, got, tc.want)
		}
	}
}

// TestAddAliasStartPath validates that start-path aliases are accepted.
// The filesystem side (SaveAliases) is shared with the normal alias path,
// so only the validation rules are verified here.
func TestAddAliasStartPathValidation(t *testing.T) {
	cases := []struct {
		alias  string
		target string
		valid  bool
	}{
		{"s/", "shadowdara.github.io/templates/", true},
		{"myvue", "shadowdara.github.io/test/template", true},
		{"s/t", "shadowdara.github.io/templates/", false},  // slash not at the end
		{"s/t/", "shadowdara.github.io/templates/", false}, // multiple slashes
		{"/", "shadowdara.github.io/templates/", false},    // just the slash
		{"s\\t", "shadowdara.github.io/templates/", false}, // backslash path
		{"s/", "shadowdara.github.io/templates", true},     // trailing slash optional in target
	}

	for _, tc := range cases {
		err := validateAlias(tc.alias, tc.target)
		if tc.valid && err != nil {
			t.Errorf("validateAlias(%q, %q) unexpected error: %v", tc.alias, tc.target, err)
		}
		if !tc.valid && err == nil {
			t.Errorf("validateAlias(%q, %q) should have failed", tc.alias, tc.target)
		}
	}
}
