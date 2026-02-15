# CLI Reorganization - Quick Start

## 🎯 Was hat sich geändert?

Die CLI-Komponente wurde von einem monolithischen Design zu einer **sauberen, modularen Architektur** refaktoriert.

### Das Wichtigste:
- ✅ **Externe API unverändert** - Bestehender Code funktioniert 1:1 weiter
- ✅ **Besser strukturiert** - Klare Separation of Concerns
- ✅ **Besser testbar** - 40+ Auto-Tests für die neue Struktur
- ✅ **Besser erweiterbar** - Neue Commands in 4 einfachen Schritten hinzufügen

---

## 📁 Neue Dateistruktur

```
internal/cli/
├── commands.go              ← Entry Point & Routing (REFACTORED)
├── parser.go                ← CLI-Argument Parsing (NEW)
├── handlers.go              ← Command Handler (NEW)
├── help.go                  ← Help Text (IMPROVED)
├── color/                   ← Terminal Colors
├── ARCHITECTURE.md          ← Detaillierte Architektur (NEW)
├── REORGANIZATION.md        ← Diese Anleitung (NEW)
├── parser_test.go           ← Parser Tests (NEW - 40+ Tests)
├── commands_test.go         ← Integration Tests (IMPROVED)
└── help_test.go             ← Help Tests (UNCHANGED)
```

---

## 🚀 Schnellstart

### Verwenden (keine Änderungen nötig!)
```bash
go run cmd/finder/main.go help
go run cmd/finder/main.go list
go run cmd/finder/main.go react
go run cmd/finder/main.go -f path/to/config.json5
```

### Tests ausführen
```bash
# Alle CLI-Tests
go test ./internal/cli/...

# Spezifische Test-Datei
go test -v ./internal/cli/ -run TestParseCLI

# Mit Coverage
go test ./internal/cli/ -coverprofile=coverage.out
go tool cover -html=coverage.out
```

---

## 🏗️ Die neue Architektur verstehen

### 1️⃣ Argumente werden geparst
```go
args := []string{"finder", "list", "--json"}
opts, _ := ParseCLI(args)
// opts.Command = "list"
// opts.OutputType = "json"
// opts.IsList() = true
```

### 2️⃣ Command wird erkannt
```go
switch {
case opts.IsHelp():
    return handleHelp
case opts.IsList():
    return handleList
// ... etc
}
```

### 3️⃣ Handler wird ausgeführt
```go
handler := routeCommand(opts)  // Gibt handleList zurück
err := handler(opts)            // Ruft handleList(opts) auf
if err != nil {
    fmt.Printf("Error: %v\n", err)
}
```

---

## 📚 Wichtige Komponenten

### CLIOptions Struct
```go
type CLIOptions struct {
    Command    string     // "help", "list", "react", "-f", etc.
    Args       []string   // Restliche Argumente
    OutputType string     // "normal" | "json" | "clear"
    Verbose    bool       // Verbose mode?
}
```

### Predicates (Befehlserkennung)
```go
opts.IsHelp()           // help, h, -h, --help?
opts.IsList()           // list, ls?
opts.IsCheck()          // check?
opts.IsFileLoad()       // -f, --file?
opts.IsDirectLoad()     // -c, --config?
opts.IsTemplateSearch() // Template name?
```

### HandlerFunc Type
```go
type HandlerFunc func(opts *CLIOptions) error
```

---

## ➕ Neue Commands hinzufügen

### Beispiel: Neuen Command "version" hinzufügen

#### 1. Parser erweitern (parser.go)
```go
// Predicate hinzufügen
func (o *CLIOptions) IsVersion() bool {
    return o.Command == "version" || o.Command == "v" || o.Command == "--version"
}
```

#### 2. Handler schreiben (handlers.go)
```go
// Handler-Funktion hinzufügen
func handleVersion(opts *CLIOptions) error {
    fmt.Printf("Finder v%s\n", version)
    return nil
}
```

#### 3. Route hinzufügen (commands.go)
```go
func routeCommand(opts *CLIOptions) HandlerFunc {
    switch {
    case opts.IsHelp():
        return handleHelp
    case opts.IsVersion():          // ← NEU
        return handleVersion        // ← NEU
    // ... rest der cases
    }
}
```

#### 4. Tests schreiben (parser_test.go)
```go
func TestParseCLI_Version(t *testing.T) {
    versionCommands := []string{"version", "v", "--version"}
    
    for _, cmd := range versionCommands {
        opts, _ := ParseCLI([]string{"finder", cmd})
        if !opts.IsVersion() {
            t.Errorf("expected IsVersion() for '%s'", cmd)
        }
    }
}
```

#### 5. Help aktualisieren (help.go)
```go
commands := []struct {
    name        string
    description string
}{
    {"help, h, -h, --help", "Display this help information"},
    {"version, v, --version", "Display version information"},  // ← NEU
    // ... rest
}
```

---

## 🧪 Tests verstehen

### Parser Tests (parser_test.go)
```go
TestParseCLI_Help()              // Help command parsing
TestParseCLI_List()              // List command parsing
TestParseCLI_FileLoad()          // -f flag handling
TestParseCLI_OutputTypeJSON()    // --json flag handling
TestParseCLI_VerboseFlag()       // --verbose flag handling
TestRouteCommand_HelpRoute()     // Handler routing
// ... 40+ Tests insgesamt
```

### Integration Tests (commands_test.go)
```go
TestHandleCommand_HelpFlag()     // Complete help flow
TestHandleCommand_ListFlag()     // Complete list flow
TestHandleCommand_NoArguments()  // Error handling
TestHandleCommand_JSONOutputFlag() // Output type handling
// ... etc
```

### Wie Tests ausgeführt werden
```bash
# Alle Tests
go test ./internal/cli/ -v

# Spezifische Test-Funktion
go test ./internal/cli/ -run TestParseCLI_Help

# Mit Verbose Output
go test ./internal/cli/ -v

# Mit Coverage Report
go test ./internal/cli/ -cover
```

---

## 🔍 Troubleshooting

### Problem: "Test failed: missing handler"
**Lösung:** Stelle sicher, dass die Route in `commands.go` hinzugefügt wurde:
```go
case opts.IsMyCommand():
    return handleMyCommand  // ← Handler muss existieren
```

### Problem: "Parser doesn't recognize command"
**Lösung:** Überprüfe den Predicate in `parser.go`:
```go
func (o *CLIOptions) IsMyCommand() bool {
    return o.Command == "mycommand"  // ← Muss dem CLI-Input entsprechen
}
```

### Problem: Tests schlagen fehl nach Änderungen
**Lösung:** Starte die Tests neu:
```bash
# Cache leeren
go clean -testcache
go test ./internal/cli/ -v
```

---

## 📊 Code-Metriken

### Vorher (Monolith)
- commands.go: 300+ Zeilen
- Tests: ~5 Testfälle
- Duplicate Code: Hoch
- Erweiterbarkeit: Schwierig

### Nachher (Modular)
- commands.go: 60 Zeilen (-80%)
- parser.go: 100 Zeilen (neu)
- handlers.go: 200 Zeilen (neu)
- Tests: 40+ Testfälle (+700%)
- Duplicate Code: Minimal
- Erweiterbarkeit: Einfach

---

## 🎓 Architektur-Prinzipien

Die neue Struktur folgt bewährten Designmustern:

### ✅ Single Responsibility Principle
Jede Datei hat genau eine Aufgabe:
- `parser.go` → Parsing
- `handlers.go` → Handling
- `commands.go` → Routing

### ✅ Open/Closed Principle
- Offen für Erweiterung (neue Handler)
- Geschlossen für Modifikation (existierende API unverändert)

### ✅ Dependency Inversion
Handler hängen ab von `CLIOptions` (Struktur), nicht von Raw Arguments

### ✅ Don't Repeat Yourself
- Gemeinsamer Code: `ParseCLI()`, `routeCommand()`
- Wiederverwendbare Predicates
- Konsistente Fehlerbehandlung

---

## 🔗 Verwandte Dokumentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detaillierte technische Dokumentation
- [REORGANIZATION.md](./REORGANIZATION.md) - Vorher/Nachher Vergleich

---

## 💡 Best Practices

### ✅ Beim Schreiben von neuen Handlern

1. **Folge dem Muster**
```go
func handleMyCommand(opts *CLIOptions) error {
    // 1. Validiere Optionen
    if len(opts.Args) < 1 {
        return fmt.Errorf("missing required argument")
    }
    
    // 2. Führe Business Logic aus
    // ...
    
    // 3. Gib Fehler zurück oder nil
    return nil
}
```

2. **Nutze bestehende Utilities**
```go
// ✅ Gut: Nutze das Options-Objekt
filePath, err := opts.GetFileArg()

// ❌ Schlecht: Direkt auf Args zugreifen
filePath := opts.Args[0]  // Kann nil sein!
```

3. **Konsistente Fehlerbehandlung**
```go
// ✅ Gut: Bedeutungsvolle Fehler
return fmt.Errorf("template '%s' not found", templateName)

// ❌ Schlecht: Generische Fehler
return fmt.Errorf("error")
```

---

## ✨ Zusammenfassung

Die CLI-Reorganisation bringt:

1. **🏗️ Bessere Struktur** - Klare Separation of Concerns
2. **🧪 Bessere Tests** - 40+ Unit-Tests coverage
3. **🚀 Bessere Erweiterbarkeit** - 4 einfache Schritte für neue Commands
4. **📖 Bessere Dokumentation** - ARCHITECTURE.md & dieser Guide
5. **🔄 Rückwärts kompatibel** - Bestehender Code funktioniert weiter!

**Das ist es!** 🎉

Viel Spaß bei der Verwendung der neuen, sauberen CLI-Struktur!
