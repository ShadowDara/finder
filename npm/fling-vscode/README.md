# Fling Language Support – VS Code Extension

Syntax-Highlighting für die **Fling** Skriptsprache.

## Installation (lokal)

1. VS Code öffnen
2. `Ctrl+Shift+P` → **"Extensions: Install from VSIX..."**
3. Im Terminal die Extension paketieren und installieren:

```bash
cd fling-vscode
npm install -g @vscode/vsce
vsce package
# → fling-language-0.1.0.vsix wird erzeugt
```

Oder direkt Debug-Host verwenden:

```bash
cd fling-vscode
code --extensionDevelopmentPath=.
```

## Enthalten

- **TextMate-Grammatik** (`fling.tmLanguage.json`) für Syntax-Highlighting
- **Language Configuration** – Klammer-Matching, Auto-Close, Einrückung
- **Dateityp** `.fling` wird automatisch erkannt

## Farb-Themen

Die Grammatik nutzt gängige Scopes, die mit jedem Theme (Dark+, Light+, Monokai, One Dark etc.) funktionieren:

| Element                              | Scope                                         | Beispiel-Farbe (Dark+) |
| ------------------------------------ | --------------------------------------------- | ---------------------- |
| Keywords (`let`, `fn`, `if` …)       | `keyword.declaration.*` / `keyword.control.*` | blau/lila              |
| Konstanten (`true`, `false`, `null`) | `constant.language.*`                         | türkis                 |
| Zahlen                               | `constant.numeric`                            | hellgrün               |
| Strings                              | `string.quoted.double`                        | orange                 |
| Kommentare (`#`, `//`)               | `comment.line.*`                              | grau                   |
| Funktionsname (Deklaration)          | `entity.name.function`                        | gelb                   |
| Funktionsaufruf                      | `support.function.fling`                      | gelb                   |
| Eigener eingebacker `print`          | `support.function.builtin`                    | türkis                 |
| Parameter                            | `variable.parameter`                          | orange                 |
| Operatoren                           | `keyword.operator.*`                          | rot                    |
| Punctuation                          | `punctuation.*`                               | grau                   |
| Property (Objekt-Key)                | `variable.other.property.object`              | hellblau               |
