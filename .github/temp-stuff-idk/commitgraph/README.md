# Commit Graph

Ein kleiner Go-Server mit HTML/JS-Frontend, der aus einem lokalen Git-Repository
einen Commit-Verlauf visualisiert. Nutzt dafür ausschließlich das auf dem System
installierte `git` (über `os/exec`) — keine externe Git-Library.

## Voraussetzungen

- Go 1.21+ (nur Standardbibliothek, keine Abhängigkeiten)
- `git` muss im `PATH` des Servers verfügbar sein
- Der Server muss Lesezugriff auf das gewünschte Repository-Verzeichnis haben

## Starten

```bash
cd commitgraph
go run .
```

Server läuft dann unter: http://localhost:8080

Alternativ bauen und ausführen:

```bash
go build -o commitgraph .
./commitgraph
```

## Benutzung

1. Im Browser http://localhost:8080 öffnen.
2. Links den **absoluten Pfad** zu einem Git-Repository eingeben, das auf dem
   Server-Rechner liegt (z. B. `/home/user/projekte/mein-repo`).
3. "Repository laden" klicken — Branches und Autoren werden automatisch geladen.
4. Filter/Optionen anpassen, das Diagramm aktualisiert sich automatisch:
   - **Branch**: einzelner Branch oder alle Branches (`--all`)
   - **Autor**: nach Commit-Autor filtern
   - **Seit / Bis**: Zeitraum eingrenzen
   - **Gruppierung**: Stunde / Tag / Woche / Monat / Jahr (Zeitverlauf-Ansicht)
   - **Diagrammtyp**: Balken oder Linie
   - **Nachricht enthält**: Volltextsuche in Commit-Messages (`git log --grep`)
   - **Dateipfad-Filter**: nur Commits, die einen bestimmten Pfad berühren
   - **Top N Autoren**: für die Autoren-Ansicht
   - **Merge-Commits ausschließen**: entspricht `git log --no-merges`

## Ansichten

- **Zeitverlauf**: Commits pro Zeiteinheit (Balken- oder Liniendiagramm), Lücken
  im Zeitraum werden mit 0 aufgefüllt, damit Pausen sichtbar sind.
- **Heatmap**: Wochentag × Tagesstunde — zeigt, wann typischerweise committet wird.
- **Autoren**: Top-N-Autoren nach Commit-Anzahl als horizontales Balkendiagramm.

## Wie die Daten geholt werden

Der Server ruft im Hintergrund z. B. Folgendes auf:

```
git -C <pfad> log --all \
  --pretty=format:%H<FS>%an<FS>%ae<FS>%aI<FS>%s<RS> \
  [--author=...] [--since=...] [--until=...] [--grep=... -i] \
  [--no-merges] [-- <filePath>]
```

(`<FS>`/`<RS>` sind nicht druckbare Trennzeichen, um Commit-Messages mit
Sonderzeichen sicher zu parsen.) Das Frontend aggregiert die rohen Commit-Daten
clientseitig — so lassen sich Gruppierung/Diagrammtyp wechseln, ohne erneut
Git aufzurufen.

## Projektstruktur

```
commitgraph/
├── main.go           # HTTP-Server + Git-Aufrufe (net/http, os/exec, embed)
├── go.mod
├── static/
│   └── index.html    # Frontend (HTML/CSS/JS, Chart.js via CDN)
└── README.md
```

## Sicherheitshinweis

Der Server erlaubt es, einen beliebigen Dateisystempfad an `git -C <pfad>` zu
übergeben. Für den lokalen/eigenen Gebrauch ist das in Ordnung; soll der Server
öffentlich erreichbar sein, sollte der erlaubte Pfad serverseitig eingeschränkt
werden (z. B. auf ein Basisverzeichnis).
