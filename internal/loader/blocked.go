// blocked.go enthält die Liste der „gesperrten” Template-Namen.
//
// Diese Namen sind reserviert: Sie kollidieren mit echten CLI-Argumenten
// (z.B. "check", "list", "tags") und dürfen deshalb NICHT als Templates
// aufgerufen werden. Beim `finder check` werden sie als "BLOCKED" markiert.
package loader

// GetBlockedTemplateNames liefert die Map der gesperrten Namen samt
// kurzer Beschreibung, warum sie blockiert sind.
func GetBlockedTemplateNames() map[string]string {
	m := map[string]string{
		"check": "Check all templates if their syntax is correct",
		"help":  "Display this help Message",
		"list":  "List all Templates Files",
		"ls":    "same as list",
		"tags":  "display all tags in the console",
		"tag":   "same as tags",
	}

	return m
}
