// aliases.go implements user-defined short names (aliases) for
// templates, stored in ~/.finder/aliases.json.
//
// An alias allows shortened invocations:
//
//	finder alias myvue shadowdara.github.io/test/template
//	finder myvue                      // → resolves to the template name
//
// Resolution is deliberately single-level (no alias chains).
package cli

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/color"
)

// AliasPath returns the path to ~/.finder/aliases.json
func AliasPath() (string, error) {
	base, err := templates.GetCustomPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, "aliases.json"), nil
}

// LoadAliases reads ~/.finder/aliases.json.
// If the file is missing, an empty map is returned.
func LoadAliases() (map[string]string, error) {
	path, err := AliasPath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return make(map[string]string), nil
	}
	if err != nil {
		return nil, fmt.Errorf("alias: %s lesen: %w", path, err)
	}
	if len(strings.TrimSpace(string(data))) == 0 {
		return make(map[string]string), nil
	}
	var m map[string]string
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("alias: %s parsen: %w", path, err)
	}
	if m == nil {
		m = make(map[string]string)
	}
	return m, nil
}

// SaveAliases writes the map atomically to ~/.finder/aliases.json
func SaveAliases(m map[string]string) error {
	path, err := AliasPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("alias: Verzeichnis %s anlegen: %w", filepath.Dir(path), err)
	}
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return fmt.Errorf("alias: serialisieren: %w", err)
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, append(data, '\n'), 0o644); err != nil {
		return fmt.Errorf("alias: %s schreiben: %w", tmp, err)
	}
	if err := os.Rename(tmp, path); err != nil {
		return fmt.Errorf("alias: %s -> %s: %w", tmp, path, err)
	}
	return nil
}

// ResolveAlias resolves a name via aliases.json.
// If no alias exists, the name is returned unchanged.
func ResolveAlias(name string) string {
	aliases, err := LoadAliases()
	if err != nil {
		return name
	}
	// simple resolution, one level (no chains)
	if target, ok := aliases[name]; ok && strings.TrimSpace(target) != "" {
		return target
	}
	return name
}

// AddAlias creates an alias: alias -> target
func AddAlias(alias, target string) error {
	alias = strings.TrimSpace(alias)
	target = strings.TrimSpace(target)
	if alias == "" || target == "" {
		return fmt.Errorf("alias: Name und Ziel dürfen nicht leer sein (usage: finder alias <alias> <template>)")
	}
	if strings.Contains(alias, "/") || strings.Contains(alias, "\\") {
		return fmt.Errorf("alias: Alias-Name darf keinen Pfad enthalten: %q", alias)
	}
	if alias == target {
		return fmt.Errorf("alias: Alias und Ziel dürfen nicht gleich sein")
	}
	aliases, err := LoadAliases()
	if err != nil {
		return err
	}
	// Guard: an alias may overwrite an existing alias name
	// -> overwriting is allowed (upsert), but with a hint
	aliases[alias] = target
	if err := SaveAliases(aliases); err != nil {
		return err
	}
	fmt.Printf("%sAlias '%s' -> '%s'%s\n", color.Green, alias, target, color.Reset)
	return nil
}

// RemoveAlias deletes an alias
func RemoveAlias(alias string) error {
	alias = strings.TrimSpace(alias)
	if alias == "" {
		return fmt.Errorf("alias: kein Alias-Name angegeben (usage: finder unalias <alias>)")
	}
	aliases, err := LoadAliases()
	if err != nil {
		return err
	}
	if _, ok := aliases[alias]; !ok {
		return fmt.Errorf("alias: Alias '%s' existiert nicht", alias)
	}
	delete(aliases, alias)
	if err := SaveAliases(aliases); err != nil {
		return err
	}
	fmt.Printf("%sAlias '%s' entfernt%s\n", color.Green, alias, color.Reset)
	return nil
}

// ListAliases shows all aliases from ~/.finder/aliases.json
func ListAliases() error {
	aliases, err := LoadAliases()
	if err != nil {
		return err
	}
	if len(aliases) == 0 {
		fmt.Println("No aliases defined. Create one with: finder alias <alias> <template>")
		return nil
	}
	fmt.Println("Aliases:")
	for alias, target := range aliases {
		fmt.Printf("  %s%s%s -> %s%s%s\n", color.Cyan, alias, color.Reset, color.Magenta, target, color.Reset)
	}
	return nil
}
