package gitdb

import (
	"bytes"
	"compress/gzip"
	"database/sql"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

// schema erzeugt das Datenbankschema für den Export.
var schema = `
CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS refs (
    name   TEXT PRIMARY KEY,
    target TEXT NOT NULL,
    type   TEXT
);

CREATE TABLE IF NOT EXISTS commits (
    hash          TEXT PRIMARY KEY,
    author_name   TEXT,
    author_email  TEXT,
    author_when   TEXT,
    committer_name   TEXT,
    committer_email  TEXT,
    committer_when   TEXT,
    message       TEXT,
    tree          TEXT,
    changed_files INTEGER DEFAULT 0,
    insertions    INTEGER DEFAULT 0,
    deletions     INTEGER DEFAULT 0,
    dirty         INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS parents (
    commit_hash TEXT NOT NULL,
    parent_hash TEXT NOT NULL,
    ordinal     INTEGER NOT NULL,
    PRIMARY KEY (commit_hash, ordinal)
);

CREATE TABLE IF NOT EXISTS tree_entries (
    commit_hash TEXT NOT NULL,
    path        TEXT NOT NULL,
    mode        TEXT,
    type        TEXT,
    object_hash TEXT,
    size        INTEGER DEFAULT 0,
    PRIMARY KEY (commit_hash, path)
);

CREATE TABLE IF NOT EXISTS blobs (
    hash     TEXT PRIMARY KEY,
    size     INTEGER DEFAULT 0,
    data     BLOB,
    is_text  INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_parents_parent ON parents(parent_hash);
CREATE INDEX IF NOT EXISTS idx_tree_entries_object ON tree_entries(object_hash);
`

// ExportSQLite schreibt den Snapshot in eine SQLite-Datenbank.
// Eine bestehende Datei wird überschrieben.
func ExportSQLite(path string, data *RepoData) error {
	if path == "" {
		return fmt.Errorf("gitdb: ExportSQLite: leerer Pfad")
	}

	// Bestehende DB entfernen, damit ein Export immer frisch ist.
	if _, err := os.Stat(path); err == nil {
		if err := os.Remove(path); err != nil {
			return fmt.Errorf("gitdb: ExportSQLite: bestehende DB konnte nicht entfernt werden: %w", err)
		}
	}
	if dir := filepath.Dir(path); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("gitdb: ExportSQLite: Verzeichnis: %w", err)
		}
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		return fmt.Errorf("gitdb: ExportSQLite: Öffnen: %w", err)
	}
	defer db.Close()

	// WAL-Verhalten und Vollständigkeit
	if _, err := db.Exec(`PRAGMA journal_mode = DELETE; PRAGMA synchronous = OFF;`); err != nil {
		return fmt.Errorf("gitdb: ExportSQLite: PRAGMA: %w", err)
	}

	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("gitdb: ExportSQLite: Schema: %w", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("gitdb: ExportSQLite: Transaktion: %w", err)
	}
	defer tx.Rollback() // no-op nach Commit

	// ----- meta -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`); err == nil {
		for k, v := range map[string]string{
			"path":        data.Meta.Path,
			"remote_url":  data.Meta.RemoteURL,
			"branch":      data.Meta.Branch,
			"git_version": data.Meta.GitVersion,
			"hash_algo":   data.Meta.HashAlgo,
			"is_bare":     fmt.Sprintf("%v", data.Meta.IsBare),
			"exported_at": time.Now().UTC().Format(time.RFC3339),
		} {
			_, _ = stmt.Exec(k, v)
		}
		_ = stmt.Close()
	}

	// ----- refs -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO refs (name, target, type) VALUES (?, ?, ?)`); err == nil {
		for _, r := range data.Refs {
			_, _ = stmt.Exec(r.Name, r.Target, r.Type)
		}
		_ = stmt.Close()
	}

	// ----- commits -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO commits (
		hash, author_name, author_email, author_when,
		committer_name, committer_email, committer_when,
		message, tree, changed_files, insertions, deletions, dirty
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`); err == nil {
		for _, c := range data.Commits {
			dirty := 0
			if c.Dirty {
				dirty = 1
			}
			_, _ = stmt.Exec(
				c.Hash, c.Author.Name, c.Author.Email, c.Author.When,
				c.Committer.Name, c.Committer.Email, c.Committer.When,
				c.Message, c.Tree, c.ChangedFiles, c.Insertions, c.Deletions, dirty,
			)
		}
		_ = stmt.Close()
	}

	// ----- parents -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO parents (commit_hash, parent_hash, ordinal) VALUES (?, ?, ?)`); err == nil {
		for _, c := range data.Commits {
			for i, p := range c.Parents {
				_, _ = stmt.Exec(c.Hash, p, i)
			}
		}
		_ = stmt.Close()
	}

	// ----- tree_entries -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO tree_entries (commit_hash, path, mode, type, object_hash, size) VALUES (?, ?, ?, ?, ?, ?)`); err == nil {
		for _, e := range data.Trees {
			_, _ = stmt.Exec(e.CommitHash, e.Path, e.Mode, e.Type, e.ObjectHash, e.Size)
		}
		_ = stmt.Close()
	}

	// ----- blobs -----
	if stmt, err := tx.Prepare(`INSERT OR REPLACE INTO blobs (hash, size, data, is_text) VALUES (?, ?, ?, ?)`); err == nil {
		for _, b := range data.Blobs {
			isText := 0
			if b.IsText {
				isText = 1
			}
			var blobData []byte
			if b.Data != nil {
				blobData, err = gzipBytes(b.Data)
				if err != nil {
					return fmt.Errorf("gitdb: ExportSQLite: gzip für %s: %w", b.Hash, err)
				}
			}
			_, _ = stmt.Exec(b.Hash, b.Size, blobData, isText)
		}
		_ = stmt.Close()
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("gitdb: ExportSQLite: Commit: %w", err)
	}

	return nil
}

// gzipBytes komprimiert Daten mit gzip (bestmögliche Kompression).
func gzipBytes(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	gz, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	if err != nil {
		return nil, err
	}
	if _, err := gz.Write(data); err != nil {
		return nil, err
	}
	if err := gz.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ReadBlob liest einen Blob-Inhalt aus einer mit ExportSQLite erzeugten
// Datenbank zurück (dekomprimiert). Nützlich für Abfragen nach dem Export.
func ReadBlob(dbPath, hash string) ([]byte, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	var raw []byte
	err = db.QueryRow(`SELECT data FROM blobs WHERE hash = ?`, hash).Scan(&raw)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("gitdb: ReadBlob: Blob %s nicht gefunden", hash)
		}
		return nil, err
	}
	if len(raw) == 0 {
		return nil, fmt.Errorf("gitdb: ReadBlob: Blob %s hat keine Daten (exportiert ohne WithBlobs?)", hash)
	}

	gr, err := gzip.NewReader(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("gitdb: ReadBlob: gzip: %w", err)
	}
	defer gr.Close()
	return io.ReadAll(gr)
}

// blobIsText entscheidet anhand einer Stichprobe, ob Daten Text sind.
func blobIsText(data []byte) bool {
	if len(data) == 0 {
		return true
	}
	n := len(data)
	if n > 1024 {
		n = 1024
	}
	ctrl := 0
	for _, b := range data[:n] {
		if b == 0 {
			return false
		}
		if b < 0x20 && b != '\n' && b != '\t' && b != '\r' && b != '\x0c' && b != '\x0b' {
			ctrl++
		}
	}
	return ctrl*10 <= n
}
