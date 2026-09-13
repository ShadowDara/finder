# pub/db/git — gitdb

Go-Bibliothek zum Scannen von Git-Repositories über die installierte
Git-CLI und zum Export nach **SQLite** oder **JSON**.

## Voraussetzungen

- **Go 1.18+** (für modernc.org/sqlite wird Go 1.25+ empfohlen)
- **git** muss im PATH installiert sein
- Kein CGO nötig (reiner Go SQLite-Treiber)

## Verwendung

```go
package main

import (
    "log"

    gitdb "github.com/shadowdara/finder/pub/db/git"
)

func main() {
    report, err := gitdb.Export(gitdb.ExportOptions{
        RepoPath:   "/pfad/zum/repo",
        SQLitePath: "export.db",     // Optional
        JSONDir:    "./json-export",  // Optional
        WithBlobs:  true,            // Blob-Inhalte mit exportieren
        LimitCommits: 100,           // 0 = unbegrenzt
    })
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Fertig: %d Commits, %d Refs, %d Blobs",
        report.Commits, report.Refs, report.Blobs)
}
```

## API

### Hauptfunktionen

| Funktion                   | Beschreibung                                  |
| -------------------------- | --------------------------------------------- |
| `Export(ExportOptions)`    | Scannt Repo + schreibt alle angegebenen Ziele |
| `Snapshot(ExportOptions)`  | Scannt Repo, liefert `*RepoData` ohne Export  |
| `ExportSQLite(path, data)` | Schreibt `*RepoData` in eine SQLite-DB        |
| `ExportJSON(dir, data)`    | Schreibt `*RepoData` als JSON-Dateien         |
| `ReadBlob(dbPath, hash)`   | Liest einen dekomprimierten Blob aus der DB   |
| `GitVersion()`             | Liefert die installierte Git-Version          |

### ExportOptions

```go
type ExportOptions struct {
    RepoPath     string // Pfad zum Git-Repository (leer = aktuelles Verzeichnis)
    SQLitePath   string // Ziel-Datei für SQLite-Export
    JSONDir      string // Ziel-Verzeichnis für JSON-Export
    WithBlobs    bool   // Blob-Inhalte mit exportieren
    LimitCommits int    // Max. Anzahl Commits (0 = alle)
}
```

## Datenmodell

### Tabellen (SQLite)

| Tabelle        | Beschreibung                               |
| -------------- | ------------------------------------------ |
| `meta`         | Repository-Metadaten (key-value)           |
| `refs`         | Alle Referenzen (Branches, Tags, Remotes)  |
| `commits`      | Alle Commits mit Autor, Committer, Message |
| `parents`      | Commit-Elternbeziehung (M:N)               |
| `tree_entries` | Alle Datei-Einträge pro Commit             |
| `blobs`        | Blob-Objekte (Inhalte gzip-komprimiert)    |

### JSON-Dateien

```
export/
├── repo.json        # Repository-Metadaten
├── refs.json        # Alle Referenzen
├── commits.json     # Alle Commits
├── trees.json       # Alle Baum-Einträge
├── blobs.json       # Blob-Metadaten
└── blobs/
    └── <sha>.txt    # Blob-Inhalte (einzelne Dateien)
```

## Blob-Flags

| Flag     | Beschreibung                             |
| -------- | ---------------------------------------- |
| `--tags` | Tags mit exportieren                     |
| `--root` | Root-Commits mit Diff against empty tree |

## Beispiele

### Nur Commits (ohne Blobs)

```go
report, err := gitdb.Export(gitdb.ExportOptions{
    RepoPath:     ".",
    SQLitePath:   "repo.db",
    LimitCommits: 50,
})
```

### Nur JSON, alle Referenzen

```go
report, err := gitdb.Export(gitdb.ExportOptions{
    RepoPath: ".",
    JSONDir:  "./export",
    WithBlobs: true,
})
```

### Blobs aus SQLite lesen

```go
data, err := gitdb.ReadBlob("repo.db", "abc123def...")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Blob: %d Bytes\n", len(data))
```

## Grenzen

- `git` muss installiert sein und im PATH liegen
- Nur Commits, die von Refs (HEAD, Branches, Tags, Remotes) erreichbar
  sind, werden exportiert
- Unreferenzierte Objekte (gc-Addern) werden nicht exportiert
- SHA-256 Repositories werden unterstützt (Hash-Algorithmus wird erkannt)
- Sehr große Repositories: `LimitCommits` nutzen

## Entwicklung

```bash
# Build
go build ./pub/db/git/

# Tests
go test -v ./pub/db/git/

# Benchmark
go test -bench=BenchmarkSnapshot ./pub/db/git/
```

## Lizenz

Dieses Projekt ist Teil des [Finder](https://github.com/ShadowDara/finder)-Projekts.
