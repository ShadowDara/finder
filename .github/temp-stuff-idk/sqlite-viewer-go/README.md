# SQLite Viewer in Go

Kleiner SQLite Viewer mit:

- Go-Backend
- REST API
- Vanilla-JS-Frontend
- SQLite über `modernc.org/sqlite` (kein CGO nötig)
- Tabellenübersicht
- Datenansicht mit Pagination
- Schema-Ansicht
- SQL-Konsole
- Read-only-Standardmodus für sichereres Browsing

## Start

```bash
go mod tidy
go run .
```

Dann:

```text
http://localhost:8080
```

Oder direkt eine DB angeben:

```bash
go run . -db ./example.db
```

## API

- `GET /api/tables`
- `GET /api/tables/:name`
- `GET /api/tables/:name/rows?page=1&pageSize=50`
- `POST /api/query`

`POST /api/query`:

```json
{"sql":"SELECT * FROM users LIMIT 20"}
```

Der Server akzeptiert standardmäßig nur `SELECT`, `PRAGMA` und `EXPLAIN` in der SQL-Konsole.

Für einen Schreibmodus kann der Server mit `-readonly=false` gestartet werden. In diesem Fall werden auch `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER` und `DROP` akzeptiert.

> Der Viewer ist für lokale Entwicklung gedacht. Für Produktion solltest du Authentifizierung, CSRF-Schutz, Rate-Limits und eine sauberere SQL-Allowlist ergänzen.
