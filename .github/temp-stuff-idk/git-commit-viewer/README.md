# Git Viewer

Zeigt die Commit-Historie eines lokalen Git-Repositorys mit der Repo-Größe
(Summe aller Blob-Größen im Baum) zu jedem Commit an. Nutzt dazu ausschließlich
das auf dem System installierte `git`-Kommandozeilenprogramm (über
`os/exec`, keine Git-Bibliothek).

## Voraussetzungen

- Go (≥ 1.21) — https://go.dev/dl/
- `git` muss im `PATH` verfügbar sein

## Starten

```bash
cd gitviewer
go run main.go
```

Danach im Browser öffnen: http://localhost:8080

Im Eingabefeld den **absoluten Pfad** zu einem lokalen Git-Repository eingeben
(z.B. `/home/user/mein-projekt`) und auf **„Laden“** klicken.

## Wie die Größe berechnet wird

Für jeden Commit wird

```
git ls-tree -r -l <commit>
```

ausgeführt. Das listet rekursiv alle Dateien (Blobs) des Baums mit ihrer
jeweiligen Größe in Bytes auf. Diese Größen werden aufsummiert — das ergibt
die Gesamtgröße des Repo-Inhalts zu genau diesem Commit, ohne dass etwas
ausgecheckt werden muss.

Größen werden nach dem Laden der Commit-Liste einzeln pro Commit im
Hintergrund nachgeladen (Endpoint `/api/size`), damit die Commit-Liste bei
großen Repos sofort erscheint.

Es gibt zwei unterschiedliche Größen-Spalten:

- **Größe des Repos zu diesem Commit** – kumulierte Gesamtgröße aller Dateien
  im Baum zu diesem Zeitpunkt (`git ls-tree -r -l`). Wächst über die Historie
  hinweg fast immer an, weil sie den kompletten Stand zeigt, nicht die Änderung.
- **Änderung durch diesen Commit** – wie viele Bytes durch genau diesen Commit
  hinzugekommen bzw. entfernt wurden (`git diff-tree --raw` gegen den
  Elternteil, bzw. gegen den leeren Baum beim allerersten Commit). Das ist die
  Antwort auf "wie groß ist dieser Commit selbst".

  Bei Merge-Commits wird bewusst nur gegen den ersten Elternteil verglichen
  (wie bei `git log --first-parent`), damit das Ergebnis eindeutig bleibt.

## API

- `GET /api/commits?repo=<Pfad>` → Liste der Commits (Hash, Autor, Datum, Message)
- `GET /api/size?repo=<Pfad>&commit=<Hash>` → `{ size, sizeHuman, fileCount }` (kumulierte Gesamtgröße)
- `GET /api/diffsize?repo=<Pfad>&commit=<Hash>` → `{ added, removed, delta, addedHuman, removedHuman, deltaHuman, filesChanged, isRoot }` (Änderung durch diesen Commit)

## Projektstruktur

```
gitviewer/
├── main.go           Go-Backend (HTTP-Server + Git-Aufrufe)
├── go.mod
├── static/
│   └── index.html    Frontend (HTML/CSS/JS, keine Frameworks)
└── README.md
```
