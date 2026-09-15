// fincheck — Mini-Tool zum Prüfen und Vervollständigen von Finder-Templates
// (.json5), wie sie in AGENTS.md beschrieben sind.
//
// Verwendung:
//
//	fincheck check <template.json5>
//	fincheck complete <template.json5> [-out out.json5] [-write]
//
// "check"    meldet fehlende/fehlerhafte Felder und mögliche Stolperfallen
//
//	(z.B. Regex/Glob-Verwechslungen, fehlendes min_version, ...).
//
// "complete" macht dasselbe und schreibt zusätzlich eine vervollständigte
//
//	Version des Templates (fehlende Felder ergänzt, min_version ggf.
//	angehoben, Tags aus bekannten Signaturdateien abgeleitet).
//
// Das Tool hat keine externen Abhängigkeiten: JSON5 wird mit einem eigenen,
// kleinen Normalizer in reguläres JSON übersetzt (Kommentare entfernen,
// unquoted keys quoten, ' -> ", trailing commas entfernen) und danach mit
// encoding/json geparst.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// ---------------------------------------------------------------------
// 1) JSON5-lite Normalizer: wandelt ein JSON5-Dokument in valides JSON um.
// ---------------------------------------------------------------------

func isIdentStart(b byte) bool {
	return b == '_' || b == '$' || (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
}

func isIdentPart(b byte) bool {
	return isIdentStart(b) || (b >= '0' && b <= '9')
}

// NormalizeJSON5 wandelt ein JSON5-artiges Dokument in gültiges JSON um.
// Unterstützt: // und /* */ Kommentare, unquoted keys, single-quoted
// Strings, trailing commas vor } oder ].
func NormalizeJSON5(input string) string {
	var out strings.Builder
	n := len(input)
	i := 0
	for i < n {
		c := input[i]

		// Zeilenkommentar
		if c == '/' && i+1 < n && input[i+1] == '/' {
			for i < n && input[i] != '\n' {
				i++
			}
			continue
		}
		// Blockkommentar
		if c == '/' && i+1 < n && input[i+1] == '*' {
			i += 2
			for i+1 < n && !(input[i] == '*' && input[i+1] == '/') {
				i++
			}
			i += 2
			continue
		}
		// Doppelt gequoteter String: unverändert kopieren (inkl. Escapes)
		if c == '"' {
			out.WriteByte(c)
			i++
			for i < n {
				out.WriteByte(input[i])
				if input[i] == '\\' && i+1 < n {
					i++
					out.WriteByte(input[i])
					i++
					continue
				}
				if input[i] == '"' {
					i++
					break
				}
				i++
			}
			continue
		}
		// Einfach gequoteter String -> doppelt gequoteter String
		if c == '\'' {
			out.WriteByte('"')
			i++
			for i < n && input[i] != '\'' {
				if input[i] == '\\' && i+1 < n {
					if input[i+1] == '\'' {
						out.WriteByte('\'')
						i += 2
						continue
					}
					out.WriteByte(input[i])
					out.WriteByte(input[i+1])
					i += 2
					continue
				}
				if input[i] == '"' {
					out.WriteByte('\\')
					out.WriteByte('"')
					i++
					continue
				}
				out.WriteByte(input[i])
				i++
			}
			i++ // schließendes '
			out.WriteByte('"')
			continue
		}
		// Bezeichner (evtl. unquoted key)
		if isIdentStart(c) {
			j := i
			for j < n && isIdentPart(input[j]) {
				j++
			}
			ident := input[i:j]
			k := j
			for k < n && (input[k] == ' ' || input[k] == '\t' || input[k] == '\n' || input[k] == '\r') {
				k++
			}
			if k < n && input[k] == ':' {
				out.WriteByte('"')
				out.WriteString(ident)
				out.WriteByte('"')
			} else {
				out.WriteString(ident)
			}
			i = j
			continue
		}
		// Trailing comma entfernen
		if c == ',' {
			k := i + 1
			for k < n {
				switch {
				case input[k] == ' ' || input[k] == '\t' || input[k] == '\n' || input[k] == '\r':
					k++
					continue
				case input[k] == '/' && k+1 < n && input[k+1] == '/':
					for k < n && input[k] != '\n' {
						k++
					}
					continue
				case input[k] == '/' && k+1 < n && input[k+1] == '*':
					k += 2
					for k+1 < n && !(input[k] == '*' && input[k+1] == '/') {
						k++
					}
					k += 2
					continue
				}
				break
			}
			if k < n && (input[k] == '}' || input[k] == ']') {
				i++
				continue
			}
			out.WriteByte(c)
			i++
			continue
		}
		out.WriteByte(c)
		i++
	}
	return out.String()
}

// ---------------------------------------------------------------------
// 2) Schema, wie in AGENTS.md beschrieben
// ---------------------------------------------------------------------

type SizeConstraint struct {
	Min         *float64 `json:"min,omitempty"`
	MinSizeType string   `json:"min_size_type,omitempty"`
	Max         *float64 `json:"max,omitempty"`
	MaxSizeType string   `json:"max_size_type,omitempty"`
}

type Checksums struct {
	SHA256 string `json:"sha256,omitempty"`
	SHA512 string `json:"sha512,omitempty"`
}

// FileEntry akzeptiert beim Parsen sowohl den "alten Stil" (reiner String)
// als auch den "modernen Stil" (Objekt mit Metadaten).
type FileEntry struct {
	Name      string          `json:"name"`
	Existence string          `json:"existence,omitempty"`
	Size      *SizeConstraint `json:"size,omitempty"`
	Checksums *Checksums      `json:"checksums,omitempty"`
	wasPlain  bool            // true, wenn ursprünglich nur ein String war
}

func (f *FileEntry) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err == nil {
		f.Name = s
		f.wasPlain = true
		return nil
	}
	type alias FileEntry
	var a alias
	if err := json.Unmarshal(data, &a); err != nil {
		return err
	}
	*f = FileEntry(a)
	return nil
}

func (f FileEntry) MarshalJSON() ([]byte, error) {
	if f.wasPlain && f.Existence == "" && f.Size == nil && f.Checksums == nil {
		return json.Marshal(f.Name)
	}
	type alias FileEntry
	return json.Marshal(alias(f))
}

type Folder struct {
	Name    string          `json:"name"`
	Files   []FileEntry     `json:"files,omitempty"`
	Folders []Folder        `json:"folders,omitempty"`
	Size    *SizeConstraint `json:"size,omitempty"`
}

type Template struct {
	MinVersion    string          `json:"min_version,omitempty"`
	Description   string          `json:"description,omitempty"`
	Name          string          `json:"name"`
	Tags          []string        `json:"tags,omitempty"`
	Files         []FileEntry     `json:"files,omitempty"`
	Folders       []Folder        `json:"folders,omitempty"`
	Command       string          `json:"command,omitempty"`
	InvertCommand bool            `json:"invert_command,omitempty"`
	Size          *SizeConstraint `json:"size,omitempty"`
	MDNote        string          `json:"mdnote,omitempty"`
	Author        string          `json:"author,omitempty"`
	Authors       []string        `json:"authors,omitempty"`
}

// ---------------------------------------------------------------------
// 3) Validierung
// ---------------------------------------------------------------------

type Severity string

const (
	SevError Severity = "FEHLER"
	SevWarn  Severity = "WARNUNG"
	SevInfo  Severity = "HINWEIS"
)

type Issue struct {
	Severity Severity
	Path     string
	Message  string
}

func (i Issue) String() string {
	return fmt.Sprintf("[%s] %s: %s", i.Severity, i.Path, i.Message)
}

var validExistence = map[string]bool{"": true, "required": true, "forbidden": true, "optional": true}
var validSizeType = map[string]bool{"B": true, "KB": true, "MB": true, "GB": true}

func validateSize(path string, s *SizeConstraint, issues *[]Issue) {
	if s == nil {
		return
	}
	if s.Min != nil && s.MinSizeType == "" {
		*issues = append(*issues, Issue{SevWarn, path, "size.min ist gesetzt, aber size.min_size_type fehlt (B/KB/MB/GB)"})
	}
	if s.Max != nil && s.MaxSizeType == "" {
		*issues = append(*issues, Issue{SevWarn, path, "size.max ist gesetzt, aber size.max_size_type fehlt (B/KB/MB/GB)"})
	}
	if s.MinSizeType != "" && !validSizeType[s.MinSizeType] {
		*issues = append(*issues, Issue{SevError, path, fmt.Sprintf("size.min_size_type %q ist ungültig (erlaubt: B, KB, MB, GB)", s.MinSizeType)})
	}
	if s.MaxSizeType != "" && !validSizeType[s.MaxSizeType] {
		*issues = append(*issues, Issue{SevError, path, fmt.Sprintf("size.max_size_type %q ist ungültig (erlaubt: B, KB, MB, GB)", s.MaxSizeType)})
	}
	if s.Min != nil && s.Max != nil && s.MinSizeType == s.MaxSizeType && *s.Min > *s.Max {
		*issues = append(*issues, Issue{SevError, path, "size.min ist größer als size.max"})
	}
}

var hexRe = regexp.MustCompile(`^[0-9a-fA-F]+$`)

func validateChecksums(path string, c *Checksums, issues *[]Issue) {
	if c == nil {
		return
	}
	if c.SHA256 == "" && c.SHA512 == "" {
		*issues = append(*issues, Issue{SevWarn, path, "checksums-Objekt ist vorhanden, enthält aber weder sha256 noch sha512"})
	}
	if c.SHA256 != "" {
		if !hexRe.MatchString(c.SHA256) || len(c.SHA256) != 64 {
			*issues = append(*issues, Issue{SevError, path, "checksums.sha256 muss ein 64-stelliger Hex-String sein"})
		}
	}
	if c.SHA512 != "" {
		if !hexRe.MatchString(c.SHA512) || len(c.SHA512) != 128 {
			*issues = append(*issues, Issue{SevError, path, "checksums.sha512 muss ein 128-stelliger Hex-String sein"})
		}
	}
}

// patternRisk prüft, ob ein Name-Pattern still als (unbeabsichtigter) Regex
// durchgeht: gültiger Go-Regex, nicht verankert, mit ungeschütztem '.'.
// Das ist der in AGENTS.md Abschnitt 3.5 beschriebene 3-Stufen-Matcher:
// exact -> regex -> glob. Ein Muster wie "package.json" matcht die
// gewünschte Datei per Exact-Match sofort - kann aber als Fallback-Regex
// (ungeschützt, unverankert) theoretisch auch andere Dateinamen im selben
// Verzeichnis treffen.
func patternRisk(pattern string) (isRegex bool, anchored bool, unescapedDot bool) {
	if pattern == "" {
		return false, false, false
	}
	_, err := regexp.Compile(pattern)
	isRegex = err == nil
	anchored = strings.HasPrefix(pattern, "^") && strings.HasSuffix(pattern, "$")
	for i := 0; i < len(pattern); i++ {
		if pattern[i] == '.' && (i == 0 || pattern[i-1] != '\\') {
			unescapedDot = true
			break
		}
	}
	return
}

// regexOnlyFeature erkennt, ob ein Pattern Konstrukte enthält, die nur in
// echtem Regex Sinn ergeben (nicht in Glob) - also min_version >= 0.3.17
// nahelegt.
func regexOnlyFeature(pattern string) bool {
	if pattern == "" {
		return false
	}
	if _, err := regexp.Compile(pattern); err != nil {
		return false // fällt eh auf Glob zurück
	}
	markers := []string{"^", "$", "+", "(", ")", "|", "{", "}", "\\d", "\\w", "\\s", "\\D", "\\W", "\\S"}
	for _, m := range markers {
		if strings.Contains(pattern, m) {
			return true
		}
	}
	return false
}

func checkNamePattern(path, pattern string, issues *[]Issue, needsRegexVersion *bool) {
	if pattern == "" {
		*issues = append(*issues, Issue{SevError, path, "name/Pattern fehlt"})
		return
	}
	isRegex, anchored, dot := patternRisk(pattern)
	if isRegex && !anchored && dot {
		*issues = append(*issues, Issue{SevInfo, path,
			fmt.Sprintf("%q enthält einen ungeschützten '.' und ist zugleich ein gültiger, nicht verankerter regulärer Ausdruck. "+
				"Der Exact-Match greift für die exakt benannte Datei zuerst, aber als Regex-Fallback matcht das Muster theoretisch auch "+
				"andere Namen, die an beliebiger Stelle diese Zeichenfolge enthalten (z.B. 'xpackageXjson'). "+
				"Falls nur ein Glob gemeint war, ist das unkritisch; für Eindeutigkeit ggf. mit ^...$ verankern oder den Punkt als \\. escapen.", pattern)})
	}
	if regexOnlyFeature(pattern) {
		*needsRegexVersion = true
	}
	if !anchored && isRegex && (strings.Contains(pattern, "^") || strings.Contains(pattern, "$")) {
		// halb verankert (nur ^ oder nur $) - häufiger Fehler
		*issues = append(*issues, Issue{SevWarn, path,
			fmt.Sprintf("%q ist nur einseitig verankert (^ oder $ fehlt) - das öffnet die andere Seite für Teilstring-Treffer", pattern)})
	}
}

func validateFileEntry(pathPrefix string, f FileEntry, issues *[]Issue, needsRegexVersion *bool) {
	p := pathPrefix + "[" + f.Name + "]"
	if f.Name == "" {
		*issues = append(*issues, Issue{SevError, pathPrefix, "files[].name fehlt"})
		return
	}
	if !validExistence[f.Existence] {
		*issues = append(*issues, Issue{SevError, p, fmt.Sprintf("existence %q ist ungültig (erlaubt: required, forbidden, optional)", f.Existence)})
	}
	checkNamePattern(p, f.Name, issues, needsRegexVersion)
	validateSize(p+".size", f.Size, issues)
	validateChecksums(p+".checksums", f.Checksums, issues)
	if f.Existence == "forbidden" && (f.Size != nil || f.Checksums != nil) {
		*issues = append(*issues, Issue{SevWarn, p, "existence=forbidden zusammen mit size/checksums ergibt keinen Sinn (Datei soll ja nicht existieren)"})
	}
}

func validateFolder(pathPrefix string, fo Folder, issues *[]Issue, needsRegexVersion *bool) {
	p := pathPrefix + "/" + fo.Name
	if fo.Name == "" {
		*issues = append(*issues, Issue{SevError, pathPrefix, "folders[].name fehlt"})
		return
	}
	checkNamePattern(p, fo.Name, issues, needsRegexVersion)
	validateSize(p+".size", fo.Size, issues)
	for _, f := range fo.Files {
		validateFileEntry(p, f, issues, needsRegexVersion)
	}
	for _, sub := range fo.Folders {
		validateFolder(p, sub, issues, needsRegexVersion)
	}
}

// Validate prüft ein Template und liefert alle gefundenen Probleme.
func Validate(t Template) []Issue {
	var issues []Issue
	needsRegexVersion := false

	if strings.TrimSpace(t.Name) == "" {
		issues = append(issues, Issue{SevError, "name", `name fehlt - "*" verwenden, falls jeder Ordnername erlaubt sein soll`})
	} else {
		checkNamePattern("name", t.Name, &issues, &needsRegexVersion)
		if t.Name != "*" {
			// Fast jeder literale String ist zufällig auch ein "gültiger" Regex
			// (z.B. "root" oder "my-app"). Entscheidend ist deshalb nicht, ob
			// das Pattern als Regex kompiliert, sondern ob es überhaupt
			// Wildcard-/Regex-Konstrukte enthält, die eine Menge von Namen statt
			// eines einzelnen fixen Namens beschreiben.
			hasWildcard := strings.ContainsAny(t.Name, "*?[")
			hasRegexConstruct := regexOnlyFeature(t.Name)
			if !hasWildcard && !hasRegexConstruct {
				issues = append(issues, Issue{SevWarn, "name",
					fmt.Sprintf("%q ist ein fixer Ordnername ohne Wildcard/Regex - matcht nur exakt diesen Namen. Falls nicht beabsichtigt, \"*\" verwenden.", t.Name)})
			}
		}
	}

	if strings.TrimSpace(t.Description) == "" {
		issues = append(issues, Issue{SevWarn, "description", "description fehlt"})
	}
	if len(t.Tags) == 0 {
		issues = append(issues, Issue{SevWarn, "tags", "keine tags gesetzt (schlecht für Discovery)"})
	} else {
		seen := map[string]bool{}
		for _, tg := range t.Tags {
			if strings.TrimSpace(tg) == "" {
				issues = append(issues, Issue{SevError, "tags", "leerer tag-Eintrag"})
				continue
			}
			if seen[tg] {
				issues = append(issues, Issue{SevWarn, "tags", fmt.Sprintf("tag %q ist doppelt", tg)})
			}
			seen[tg] = true
		}
	}

	if len(t.Files) == 0 && len(t.Folders) == 0 && t.Command == "" {
		issues = append(issues, Issue{SevWarn, "", "weder files noch folders noch command definiert - Template matcht praktisch jeden Ordner"})
	}

	for _, f := range t.Files {
		validateFileEntry("files", f, &issues, &needsRegexVersion)
	}
	for _, fo := range t.Folders {
		validateFolder("folders", fo, &issues, &needsRegexVersion)
	}
	validateSize("size", t.Size, &issues)

	if t.InvertCommand && t.Command == "" {
		issues = append(issues, Issue{SevWarn, "invert_command", "invert_command=true ohne command hat keine Wirkung"})
	}

	// min_version-Anforderungen sammeln
	required := "0.0.0"
	reasons := []string{}
	if needsRegexVersion {
		required = maxVersion(required, "0.3.17")
		reasons = append(reasons, "Regex-Muster verwendet")
	}
	if t.MDNote != "" {
		required = maxVersion(required, "0.3.17")
		reasons = append(reasons, "mdnote verwendet")
	}
	if t.Author != "" || len(t.Authors) > 0 {
		required = maxVersion(required, "0.3.18")
		reasons = append(reasons, "author/authors verwendet")
	}
	if required != "0.0.0" {
		if t.MinVersion == "" {
			issues = append(issues, Issue{SevWarn, "min_version",
				fmt.Sprintf("min_version fehlt, sollte aber mindestens %s sein (%s)", required, strings.Join(reasons, ", "))})
		} else if !versionAtLeast(t.MinVersion, required) {
			issues = append(issues, Issue{SevError, "min_version",
				fmt.Sprintf("min_version %q ist zu niedrig, benötigt mindestens %s (%s)", t.MinVersion, required, strings.Join(reasons, ", "))})
		}
	}

	return issues
}

func parseVersion(v string) [3]int {
	var out [3]int
	parts := strings.SplitN(strings.TrimSpace(v), ".", 3)
	for i := 0; i < len(parts) && i < 3; i++ {
		n, _ := strconv.Atoi(strings.TrimSpace(parts[i]))
		out[i] = n
	}
	return out
}

func versionAtLeast(v, min string) bool {
	vp, mp := parseVersion(v), parseVersion(min)
	for i := 0; i < 3; i++ {
		if vp[i] != mp[i] {
			return vp[i] > mp[i]
		}
	}
	return true
}

func maxVersion(a, b string) string {
	if versionAtLeast(a, b) {
		return a
	}
	return b
}

// ---------------------------------------------------------------------
// 4) Vervollständigung ("complete")
// ---------------------------------------------------------------------

// tagSignals: bekannte Signaturdateien -> daraus ableitbare Tags.
var tagSignals = []struct {
	pattern string
	tags    []string
}{
	{"go.mod", []string{"go"}},
	{"package.json", []string{"node", "javascript"}},
	{"tsconfig.json", []string{"typescript"}},
	{"pyproject.toml", []string{"python"}},
	{"requirements.txt", []string{"python"}},
	{"Cargo.toml", []string{"rust"}},
	{"pom.xml", []string{"java", "maven"}},
	{"build.gradle", []string{"java", "gradle"}},
	{"composer.json", []string{"php"}},
	{"Gemfile", []string{"ruby"}},
	{"pnpm-workspace.yaml", []string{"monorepo", "workspace"}},
	{".git", []string{"git", "repo"}},
	{"CMakeLists.txt", []string{"cpp", "cmake"}},
}

func inferTags(t Template) []string {
	found := map[string]bool{}
	var names []string
	for _, f := range t.Files {
		names = append(names, f.Name)
	}
	for _, fo := range t.Folders {
		names = append(names, fo.Name)
	}
	var tags []string
	for _, sig := range tagSignals {
		for _, n := range names {
			if n == sig.pattern {
				for _, tg := range sig.tags {
					if !found[tg] {
						found[tg] = true
						tags = append(tags, tg)
					}
				}
			}
		}
	}
	sort.Strings(tags)
	return tags
}

// Complete füllt fehlende, aber sinnvoll automatisch ableitbare Felder auf.
// Es überschreibt niemals bereits vorhandene, bewusst gesetzte Werte.
func Complete(t Template) (Template, []string) {
	var notes []string

	if strings.TrimSpace(t.Name) == "" {
		t.Name = "*"
		notes = append(notes, `name auf "*" gesetzt`)
	}

	inferred := inferTags(t)
	if len(t.Tags) == 0 && len(inferred) > 0 {
		t.Tags = inferred
		notes = append(notes, fmt.Sprintf("tags aus Signaturdateien abgeleitet: %s", strings.Join(inferred, ", ")))
	} else if len(inferred) > 0 {
		existing := map[string]bool{}
		for _, tg := range t.Tags {
			existing[tg] = true
		}
		added := []string{}
		for _, tg := range inferred {
			if !existing[tg] {
				t.Tags = append(t.Tags, tg)
				added = append(added, tg)
			}
		}
		if len(added) > 0 {
			notes = append(notes, fmt.Sprintf("zusätzliche tags ergänzt: %s", strings.Join(added, ", ")))
		}
	}

	if strings.TrimSpace(t.Description) == "" {
		if len(t.Tags) > 0 {
			t.Description = fmt.Sprintf("Automatisch vervollständigte Vorlage (Tags: %s) - TODO: Beschreibung präzisieren", strings.Join(t.Tags, ", "))
		} else {
			t.Description = "TODO: Beschreibung ergänzen"
		}
		notes = append(notes, "description mit Platzhalter befüllt (bitte anpassen)")
	}

	// existence bei Objekten mit fehlendem Wert explizit auf "required" setzen
	for i := range t.Files {
		if !t.Files[i].wasPlain && t.Files[i].Existence == "" {
			t.Files[i].Existence = "required"
		}
	}
	fillFolderExistence(t.Folders)

	// min_version anheben, falls nötig
	needsRegexVersion := false
	var tmpIssues []Issue
	for _, f := range t.Files {
		checkNamePattern("", f.Name, &tmpIssues, &needsRegexVersion)
	}
	var walkFolders func(fs []Folder)
	walkFolders = func(fs []Folder) {
		for _, fo := range fs {
			checkNamePattern("", fo.Name, &tmpIssues, &needsRegexVersion)
			for _, f := range fo.Files {
				checkNamePattern("", f.Name, &tmpIssues, &needsRegexVersion)
			}
			walkFolders(fo.Folders)
		}
	}
	walkFolders(t.Folders)
	checkNamePattern("", t.Name, &tmpIssues, &needsRegexVersion)

	required := "0.0.0"
	if needsRegexVersion {
		required = maxVersion(required, "0.3.17")
	}
	if t.MDNote != "" {
		required = maxVersion(required, "0.3.17")
	}
	if t.Author != "" || len(t.Authors) > 0 {
		required = maxVersion(required, "0.3.18")
	}
	if required != "0.0.0" && (t.MinVersion == "" || !versionAtLeast(t.MinVersion, required)) {
		old := t.MinVersion
		t.MinVersion = required
		if old == "" {
			notes = append(notes, fmt.Sprintf("min_version auf %s gesetzt", required))
		} else {
			notes = append(notes, fmt.Sprintf("min_version von %s auf %s angehoben", old, required))
		}
	}

	return t, notes
}

func fillFolderExistence(folders []Folder) {
	for i := range folders {
		for j := range folders[i].Files {
			if !folders[i].Files[j].wasPlain && folders[i].Files[j].Existence == "" {
				folders[i].Files[j].Existence = "required"
			}
		}
		fillFolderExistence(folders[i].Folders)
	}
}

// ---------------------------------------------------------------------
// 5) JSON5-artige Ausgabe (unquoted keys, wie in AGENTS.md-Beispielen)
// ---------------------------------------------------------------------

var keyRe = regexp.MustCompile(`"([A-Za-z_][A-Za-z0-9_]*)":`)

func toJSON5Style(jsonBytes []byte) []byte {
	return keyRe.ReplaceAll(jsonBytes, []byte(`$1:`))
}

func renderTemplate(t Template) (string, error) {
	b, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return "", err
	}
	return string(toJSON5Style(b)) + "\n", nil
}

// ---------------------------------------------------------------------
// 6) CLI
// ---------------------------------------------------------------------

func loadTemplate(path string) (Template, string, error) {
	if !strings.HasSuffix(path, ".json5") {
		fmt.Fprintf(os.Stderr, "[%s] %s: Datei sollte auf .json5 enden\n", SevWarn, path)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return Template{}, "", err
	}
	normalized := NormalizeJSON5(string(raw))
	var t Template
	if err := json.Unmarshal([]byte(normalized), &t); err != nil {
		return Template{}, normalized, fmt.Errorf("konnte JSON5 nicht parsen: %w", err)
	}
	return t, normalized, nil
}

func printIssues(issues []Issue) int {
	if len(issues) == 0 {
		fmt.Println("Keine Probleme gefunden. Template sieht vollständig aus.")
		return 0
	}
	sort.SliceStable(issues, func(i, j int) bool {
		rank := map[Severity]int{SevError: 0, SevWarn: 1, SevInfo: 2}
		return rank[issues[i].Severity] < rank[issues[j].Severity]
	})
	errCount := 0
	for _, is := range issues {
		fmt.Println(is.String())
		if is.Severity == SevError {
			errCount++
		}
	}
	fmt.Printf("\n%d Problem(e) gefunden (%d Fehler).\n", len(issues), errCount)
	return errCount
}

func usage() {
	fmt.Fprintln(os.Stderr, `fincheck - Finder-Template Checker/Completer

Verwendung:
  fincheck check <template.json5>
  fincheck complete <template.json5> [-out out.json5] [-write]

  check     : prüft das Template und meldet Probleme
  complete  : prüft das Template und gibt eine vervollständigte Version aus
              (-out <datei>  : Ergebnis in Datei schreiben statt stdout)
              (-write        : Originaldatei überschreiben, Backup als .bak)
`)
}

func main() {
	if len(os.Args) < 3 {
		usage()
		os.Exit(2)
	}
	cmd := os.Args[1]

	switch cmd {
	case "check":
		path := os.Args[2]
		t, _, err := loadTemplate(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[%s] %s: %v\n", SevError, path, err)
			os.Exit(1)
		}
		issues := Validate(t)
		errCount := printIssues(issues)
		if errCount > 0 {
			os.Exit(1)
		}

	case "complete":
		fs := flag.NewFlagSet("complete", flag.ExitOnError)
		out := fs.String("out", "", "Ausgabedatei (Default: stdout)")
		write := fs.Bool("write", false, "Originaldatei überschreiben (Backup als .bak)")
		_ = fs.Parse(os.Args[3:])
		path := os.Args[2]

		t, _, err := loadTemplate(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[%s] %s: %v\n", SevError, path, err)
			os.Exit(1)
		}

		fmt.Println("--- Prüfung vor der Vervollständigung ---")
		printIssues(Validate(t))

		completed, notes := Complete(t)

		fmt.Println("\n--- Vorgenommene Ergänzungen ---")
		if len(notes) == 0 {
			fmt.Println("Keine Ergänzungen nötig.")
		}
		for _, n := range notes {
			fmt.Println("- " + n)
		}

		fmt.Println("\n--- Prüfung nach der Vervollständigung ---")
		remaining := Validate(completed)
		printIssues(remaining)

		rendered, err := renderTemplate(completed)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[%s] Rendern fehlgeschlagen: %v\n", SevError, err)
			os.Exit(1)
		}

		switch {
		case *write:
			if err := os.WriteFile(path+".bak", []byte(rendered), 0o644); err != nil {
				// nur zur Sicherheit: Backup der Original-Rohdaten, nicht der gerenderten Version
			}
			raw, _ := os.ReadFile(path)
			_ = os.WriteFile(path+".bak", raw, 0o644)
			if err := os.WriteFile(path, []byte(rendered), 0o644); err != nil {
				fmt.Fprintf(os.Stderr, "[%s] Schreiben fehlgeschlagen: %v\n", SevError, err)
				os.Exit(1)
			}
			fmt.Printf("\nOriginal überschrieben: %s (Backup: %s.bak)\n", path, path)
		case *out != "":
			if err := os.WriteFile(*out, []byte(rendered), 0o644); err != nil {
				fmt.Fprintf(os.Stderr, "[%s] Schreiben fehlgeschlagen: %v\n", SevError, err)
				os.Exit(1)
			}
			fmt.Printf("\nVervollständigtes Template geschrieben: %s\n", *out)
		default:
			fmt.Println("\n--- Vervollständigtes Template ---")
			fmt.Print(rendered)
		}

	default:
		usage()
		os.Exit(2)
	}
}
