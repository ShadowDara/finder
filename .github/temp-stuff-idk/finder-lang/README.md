# fincheck

Mini-CLI in Go zum Prüfen und Vervollständigen von Finder-Templates
(`.json5`), wie sie in `AGENTS.md` beschrieben sind. Keine externen
Abhängigkeiten — ein selbstgeschriebener JSON5-Normalizer (Kommentare,
unquoted keys, `'...'`-Strings, trailing commas) übersetzt das Template
in reguläres JSON.

**Neu: das `query`-Feld.** Zusätzlich zum Checker/Completer enthält dieses
Projekt eine kleine, eigenständige Abfragesprache (Package `query/`), die
als neues optionales Template-Feld `query` gedacht ist. Sie erlaubt
Bedingungen, die das bestehende `files`/`folders`-Schema strukturell nicht
ausdrücken kann: ODER-Verknüpfungen, Verneinung, Zähl- und Größen-
Schwellenwerte. Details, Grammatik und Beispiele stehen in
[`AGENTS_QUERY_ADDITION.md`](./AGENTS_QUERY_ADDITION.md) — das ist der
Text, den man in `AGENTS.md` einfügen würde.

## Bauen

```bash
go build -o fincheck .
```

## Verwendung

```bash
# nur prüfen
./fincheck check mein-template.json5

# prüfen + vervollständigte Version ausgeben (stdout)
./fincheck complete mein-template.json5

# vervollständigte Version in neue Datei schreiben
./fincheck complete mein-template.json5 -out mein-template.complete.json5

# Original in-place überschreiben (Backup als .bak)
./fincheck complete mein-template.json5 -write

# Template komplett gegen einen echten Ordner matchen
# (name, files, folders, size UND das neue query-Feld)
./fincheck eval mein-template.json5 /pfad/zu/ordner
```

## Was wird geprüft?

- `name` fehlt / ist ein zu strenger fixer Name ohne Wildcard oder Regex
  (Mistake 1 aus `AGENTS.md`)
- `description` und `tags` fehlen
- Template hat weder `files` noch `folders` noch `command` (matcht
  praktisch alles)
- ungültige `existence`-Werte (nur `required` / `forbidden` / `optional`)
- `existence: forbidden` kombiniert mit `size`/`checksums` (widersprüchlich)
- `size`: fehlender `min_size_type`/`max_size_type`, ungültige Einheit
  (nur `B`/`KB`/`MB`/`GB`), `min > max`
- `checksums.sha256`/`sha512`: falsche Länge oder keine Hex-Zeichen
- `invert_command: true` ohne `command`
- **Regex/Glob-Falle** (Abschnitt 3.5 in `AGENTS.md`): Ein Muster wie
  `"package.json"` ist gleichzeitig ein gültiger, nicht verankerter
  regulärer Ausdruck mit `.` als Platzhalter. Der Exact-Match greift für
  die eigentlich gemeinte Datei sofort, aber als Regex-Fallback könnte
  das Muster theoretisch auch andere Dateinamen im selben Ordner treffen.
  Das Tool weist darauf hin und schlägt `^...$`-Verankerung bzw.
  `\.`-Escaping vor, wo es wirklich relevant ist (nicht verankert, nicht
  escapter Punkt).
- fehlende/zu niedrige `min_version` für verwendete Features:
  - Regex-Muster → `>= 0.3.17`
  - `mdnote` → `>= 0.3.17`
  - `author`/`authors` → `>= 0.3.18`
  - `query` → `>= 0.4.0`
- **`query`-Syntax**: wird beim Laden einmal geparst; Syntaxfehler,
  unbekannte Funktionsnamen und falsche Argumentanzahl werden als FEHLER
  gemeldet (siehe `AGENTS_QUERY_ADDITION.md`)
- Dateiendung `.json5`

## Was ergänzt `complete`?

- `name` → `"*"`, falls leer
- `tags` → abgeleitet aus bekannten Signaturdateien (`go.mod` → `go`,
  `package.json` → `node, javascript`, `pyproject.toml` → `python`,
  `Cargo.toml` → `rust`, `.git` → `git, repo`, u.a.), ohne vorhandene
  Tags zu überschreiben
- `description` → Platzhalter mit Hinweis auf manuelle Nacharbeit, falls
  leer
- `existence` bei Datei-Objekten (nicht bei einfachen String-Einträgen)
  → explizit `"required"`, falls nicht gesetzt
- `min_version` → auf das für die genutzten Features nötige Minimum
  angehoben (nimmt bereits gesetzte, höhere Werte nicht zurück)

`complete` überschreibt nie bewusst gesetzte Werte, sondern ergänzt nur,
was fehlt. Die Ausgabe ist valides JSON5 im Stil der `AGENTS.md`-Beispiele
(unquoted keys, doppelt gequotete Strings).

## Die Query-Sprache im Detail

Package `query/` implementiert eine kleine boolesche Ausdruckssprache:

```
Query      := OrExpr
OrExpr     := AndExpr { "||" AndExpr }
AndExpr    := UnaryExpr { "&&" UnaryExpr }
UnaryExpr  := "!" UnaryExpr | Primary
Primary    := "(" OrExpr ")" | FuncCall
FuncCall   := Ident "(" [ ArgList ] ")"
```

Funktionen: `file(pattern)`, `folder(pattern)`, `name(pattern)`,
`size(min, max)`, `filesize(pattern, min, max)`, `count(pattern, min, max)`,
`sha256(pattern, hash)`, `sha512(pattern, hash)`, `command(shellCmd)`.
Größen als String wie `"10KB"`/`"1.5MB"`, `""` = keine Grenze.

Beispiel (im alten Schema nicht ausdrückbar, weil ODER fehlt):

```json5
query: "(file(\"package.json\") || file(\"Cargo.toml\")) && !folder(\"node_modules\") && count(\"*.log\", \"\", \"0\")"
```

bedeutet: "package.json ODER Cargo.toml vorhanden, UND kein node_modules-
Ordner, UND höchstens 0 `.log`-Dateien".

Aufbau des Packages:

- `query/lexer.go` – Tokenizer
- `query/ast.go` – AST-Knotentypen (`OrNode`, `AndNode`, `NotNode`, `CallNode`)
- `query/parser.go` – rekursiver Abstiegsparser + Funktions-Arity-Prüfung
  (`FuncArity`)
- `query/eval.go` – wertet den AST gegen ein `Context`-Interface aus
  (kurzschlussartig bei `&&`/`||`)
- `query/fscontext.go` – konkrete `Context`-Implementierung gegen ein
  echtes Verzeichnis, inkl. des exakt gleichen exact→regex→glob-Matchers
  (`MatchPattern`), den auch die restlichen Template-Felder verwenden

`query.Compile(expr)` prüft nur Syntax/Funktionsnamen/Arity (kein
Dateisystemzugriff) — genau das nutzt `fincheck check`/`complete`, um
`query` zu validieren, ohne einen echten Ordner zu brauchen.
`fincheck eval <template> <ordner>` nutzt zusätzlich `query.Eval` mit
`FSContext`, um das komplette Template inklusive `query` gegen einen
echten Ordner zu matchen.

## Grenzen

- Es ist ein Linter/Assistent, kein Ersatz für `./finder validate` –
  die eigentliche Match-Logik (inkl. Dateisystemzugriff, `command`-
  Ausführung) läuft weiterhin in `finder` selbst.
- Der JSON5-Normalizer deckt die in Finder-Templates üblichen
  Konstrukte ab (Kommentare, unquoted keys, `'...'`-Strings, trailing
  commas), aber keine exotischen JSON5-Extras wie Hex-Zahlen oder
  führende Dezimalpunkte.
