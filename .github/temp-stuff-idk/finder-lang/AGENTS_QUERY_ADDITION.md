# Ergänzung für AGENTS.md: das `query`-Feld

Dieser Abschnitt ist zum Einfügen in `AGENTS.md` gedacht - z.B. als neuer
Punkt in "3) Supported top-level fields" (nach `authors`) plus einem neuen
Kapitel "3.6) Query language". `min_version` wird hier als `0.4.0`
angenommen; bei Bedarf an die tatsächlich nächste Finder-Version anpassen.

---

## `query` (string, optional) — since 0.4.0

`files`, `folders`, `size` usw. werden intern immer UND-verknüpft: eine
Bedingung kann `required`, `forbidden` oder `optional` sein, aber es gibt
keine Möglichkeit, "A ODER B", "NICHT (X UND Y)" oder "höchstens 3 Dateien
von diesem Typ" auszudrücken. Genau dafür gibt es `query`: ein einzelner
boolescher Ausdruck in einer winzigen eingebauten Sprache.

```json5
{
  description: "Node- oder Rust-Projekt, aber ohne node_modules und ohne Logs",
  name: "*",
  query: "(file(\"package.json\") || file(\"Cargo.toml\")) && !folder(\"node_modules\") && count(\"*.log\", \"\", \"0\")",
  tags: ["node", "rust"],
  min_version: "0.4.0",
}
```

`query` ist **zusätzlich** zu allen anderen Feldern - wenn `files`,
`folders`, `size` usw. ebenfalls gesetzt sind, müssen alle davon UND der
`query`-Ausdruck erfüllt sein. `query` ersetzt die bestehenden Felder
nicht, sondern füllt die Lücke, die sie strukturell nicht füllen können.

### Grammatik

```
Query      := OrExpr
OrExpr     := AndExpr { "||" AndExpr }
AndExpr    := UnaryExpr { "&&" UnaryExpr }
UnaryExpr  := "!" UnaryExpr | Primary
Primary    := "(" OrExpr ")" | FuncCall
FuncCall   := Ident "(" [ ArgList ] ")"
ArgList    := Arg { "," Arg }
Arg        := String | Number
```

- Operatoren wie in den meisten Sprachen: `!` bindet am stärksten, dann
  `&&`, dann `||`; Klammern `()` zum Gruppieren.
- `&&`/`||` werten kurzschlussartig aus (wie in Go) - eine teure
  `command(...)`-Prüfung rechts von `&&` wird also übersprungen, wenn die
  linke Seite bereits `false` ist.
- String-Argumente werden in doppelten Anführungszeichen geschrieben; da
  `query` selbst ein JSON-String ist, müssen diese inneren `"` im
  JSON5-Text escaped werden (`\"`).
- Zahlen/Bounds werden ebenfalls als Strings übergeben; ein leerer String
  `""` bedeutet "keine Grenze".

### Verfügbare Funktionen

| Funktion                          | Bedeutung                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `file(pattern)`                    | Es existiert eine Datei im aktuellen Ordner, deren Name `pattern` matcht (gleicher exact→regex→glob-Matcher wie überall sonst). |
| `folder(pattern)`                  | Es existiert ein Unterordner, dessen Name `pattern` matcht.               |
| `name(pattern)`                    | Der Name des gerade gescannten Ordners selbst matcht `pattern`.           |
| `size(min, max)`                   | Gesamtgröße des Ordners (rekursiv) liegt in `[min, max]`. Größen wie `"1MB"`, `"500KB"`; `""` = keine Grenze auf dieser Seite. |
| `filesize(pattern, min, max)`      | Größe der ersten zu `pattern` passenden Datei liegt in `[min, max]`.      |
| `count(pattern, min, max)`         | Anzahl der zu `pattern` passenden Dateien liegt in `[min, max]`. `""` = keine Grenze. Damit lassen sich Ober- **und** Untergrenzen ausdrücken, was mit `files[]` allein nicht geht. |
| `sha256(pattern, hexHash)`         | Die erste zu `pattern` passende Datei hat exakt diesen SHA256-Hash.       |
| `sha512(pattern, hexHash)`         | Wie oben, mit SHA512.                                                     |
| `command(shellCmd)`                | Shell-Befehl im Ordner ausgeführt, `true` bei Exit-Code 0. Entspricht dem Top-Level-`command`, aber inline und mit `!`, `&&`, `||` kombinierbar. |

Unbekannte Funktionsnamen oder eine falsche Anzahl Argumente sind ein
Kompilierfehler - `query` wird beim Laden des Templates einmal geparst
und validiert, nicht erst zur Laufzeit stückweise ausprobiert.

### Beispiele

**ODER-Bedingung (mit dem alten Schema nicht ausdrückbar):**

```json5
{
  description: "Python-Projekt: klassisch (pyproject.toml) ODER legacy (setup.py)",
  name: "*",
  query: "file(\"pyproject.toml\") || file(\"setup.py\")",
  tags: ["python"],
  min_version: "0.4.0",
}
```

**Obergrenze für unerwünschte Dateien:**

```json5
{
  description: "Sauberes Repo: höchstens 2 TODO-Marker-Dateien",
  name: "*",
  query: "folder(\".git\") && count(\"TODO*\", \"\", \"2\")",
  tags: ["git"],
  min_version: "0.4.0",
}
```

**Kombination von Struktur-Feldern und `query`:**

```json5
{
  description: "Go-Modul mit go.mod, aber ohne generierten Code oder Vendor-Ordner",
  name: "*",
  files: ["go.mod"],
  query: "!folder(\"vendor\") && !file(\"*_gen.go\")",
  tags: ["go"],
  min_version: "0.4.0",
}
```

### Empfehlung

`query` ist mächtig, aber auch leichter falsch zu benutzen als die
strukturierten Felder (Tippfehler in Funktionsnamen, falsche
Klammerung). Faustregel:

- Reine "diese Dateien müssen existieren"-Bedingungen weiterhin über
  `files`/`folders` ausdrücken - übersichtlicher und ohne eigene Syntax.
- `query` nur dort einsetzen, wo `files`/`folders` strukturell an ihre
  Grenzen stoßen: ODER-Logik, Verneinung mehrerer Bedingungen zusammen,
  Zähl-/Größen-Schwellenwerte.
- Templates mit `query` sollten `min_version: "0.4.0"` (oder höher)
  setzen.
