package gitdb

import (
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// ExportSQL schreibt den Snapshot als SQL-Dump in eine einzelne .sql-Datei.
//
// Das Schema entspricht dem von ExportSQLite: meta, refs, commits, parents,
// tree_entries und blobs werden als CREATE TABLE- und INSERT-Statements
// ausgegeben. Die Datei ist in BEGIN/COMMIT gekapselt und SQLite-kompatibel.
//
// Blob-Inhalte werden – sofern vorhanden (WithBlobs) – gzip-komprimiert und
// als hex-kodierte Literale (X'...') geschrieben, identisch zur SQLite-
// Ablage in sqlite.go. Ohne WithBlobs bleibt die Spalte data NULL.
func ExportSQL(path string, data *RepoData) error {
	if path == "" {
		return fmt.Errorf("gitdb: ExportSQL: leerer Pfad")
	}
	if dir := filepath.Dir(path); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("gitdb: ExportSQL: Verzeichnis: %w", err)
		}
	}

	var b strings.Builder

	// Kopf
	b.WriteString("-- ============================================\n")
	b.WriteString("-- Finder gitdb SQL-Dump\n")
	fmt.Fprintf(&b, "-- Erzeugt:     %s\n", time.Now().UTC().Format(time.RFC3339))
	fmt.Fprintf(&b, "-- Repository:  %s\n", data.Meta.Path)
	fmt.Fprintf(&b, "-- Commits: %d | Refs: %d | Bäume: %d | Blobs: %d\n\n",
		len(data.Commits), len(data.Refs), len(data.Trees), len(data.Blobs))
	b.WriteString("-- ============================================\n\n")

	b.WriteString("BEGIN;\n\n")

	// Schema (identisch zu ExportSQLite, inkl. Indizes)
	b.WriteString(schema)
	b.WriteString("\n")

	// ----- meta -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- meta\n")
	b.WriteString("-- --------------------------------------------\n\n")
	metaKeys := []string{"path", "remote_url", "branch", "git_version", "hash_algo", "is_bare", "exported_at"}
	metaVals := map[string]string{
		"path":        data.Meta.Path,
		"remote_url":  data.Meta.RemoteURL,
		"branch":      data.Meta.Branch,
		"git_version": data.Meta.GitVersion,
		"hash_algo":   data.Meta.HashAlgo,
		"is_bare":     strconv.FormatBool(data.Meta.IsBare),
		"exported_at": time.Now().UTC().Format(time.RFC3339),
	}
	for _, k := range metaKeys {
		fmt.Fprintf(&b, "INSERT INTO meta (key, value) VALUES (%s, %s);\n",
			sqlStr(k), sqlStr(metaVals[k]))
	}
	b.WriteString("\n")

	// ----- refs -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- refs\n")
	b.WriteString("-- --------------------------------------------\n\n")
	for _, r := range data.Refs {
		fmt.Fprintf(&b, "INSERT INTO refs (name, target, type) VALUES (%s, %s, %s);\n",
			sqlStr(r.Name), sqlStr(r.Target), sqlStr(r.Type))
	}
	b.WriteString("\n")

	// ----- commits -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- commits\n")
	b.WriteString("-- --------------------------------------------\n\n")
	for _, c := range data.Commits {
		dirty := 0
		if c.Dirty {
			dirty = 1
		}
		fmt.Fprintf(&b,
			"INSERT INTO commits (hash, author_name, author_email, author_when, committer_name, committer_email, committer_when, message, tree, changed_files, insertions, deletions, dirty) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %d, %d, %d, %d);\n",
			sqlStr(c.Hash), sqlStr(c.Author.Name), sqlStr(c.Author.Email), sqlStr(c.Author.When),
			sqlStr(c.Committer.Name), sqlStr(c.Committer.Email), sqlStr(c.Committer.When),
			sqlStr(c.Message), sqlStr(c.Tree),
			c.ChangedFiles, c.Insertions, c.Deletions, dirty)
	}
	b.WriteString("\n")

	// ----- parents -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- parents\n")
	b.WriteString("-- --------------------------------------------\n\n")
	for _, c := range data.Commits {
		for i, p := range c.Parents {
			fmt.Fprintf(&b, "INSERT INTO parents (commit_hash, parent_hash, ordinal) VALUES (%s, %s, %d);\n",
				sqlStr(c.Hash), sqlStr(p), i)
		}
	}
	b.WriteString("\n")

	// ----- tree_entries -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- tree_entries\n")
	b.WriteString("-- --------------------------------------------\n\n")
	for _, e := range data.Trees {
		fmt.Fprintf(&b, "INSERT INTO tree_entries (commit_hash, path, mode, type, object_hash, size) VALUES (%s, %s, %s, %s, %s, %d);\n",
			sqlStr(e.CommitHash), sqlStr(e.Path), sqlStr(e.Mode), sqlStr(e.Type), sqlStr(e.ObjectHash), e.Size)
	}
	b.WriteString("\n")

	// ----- blobs -----
	b.WriteString("-- --------------------------------------------\n")
	b.WriteString("-- blobs (data gzip-komprimiert als X'...')\n")
	b.WriteString("-- --------------------------------------------\n\n")
	for _, bl := range data.Blobs {
		isText := 0
		if bl.IsText {
			isText = 1
		}
		blobLit := "NULL" // ohne WithBlobs keine Inhalte
		if bl.Data != nil {
			gz, err := gzipBytes(bl.Data)
			if err != nil {
				return fmt.Errorf("gitdb: ExportSQL: gzip für %s: %w", bl.Hash, err)
			}
			blobLit = sqlBlob(gz)
		}
		fmt.Fprintf(&b, "INSERT INTO blobs (hash, size, data, is_text) VALUES (%s, %d, %s, %d);\n",
			sqlStr(bl.Hash), bl.Size, blobLit, isText)
	}
	b.WriteString("\n")

	b.WriteString("COMMIT;\n")

	if err := os.WriteFile(path, []byte(b.String()), 0o644); err != nil {
		return fmt.Errorf("gitdb: ExportSQL: Schreiben: %w", err)
	}
	return nil
}

// sqlStr formatiert einen String als SQL-Literal ('...', einfache Quotes
// werden verdoppelt). Leere Strings werden als NULL geschrieben.
func sqlStr(v string) string {
	if v == "" {
		return "NULL"
	}
	return "'" + strings.ReplaceAll(v, "'", "''") + "'"
}

// sqlBlob formatiert Bytes als hex-kodiertes BLOB-Literal (X'...').
func sqlBlob(data []byte) string {
	if len(data) == 0 {
		return "NULL"
	}
	return "X'" + hex.EncodeToString(data) + "'"
}