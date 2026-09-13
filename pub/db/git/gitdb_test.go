package gitdb

import (
	"bytes"
	"compress/gzip"
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// ──────────────────────────────────────────────────────────────────────────────
// Unit-Tests (benötigen kein Git-Repository)
// ──────────────────────────────────────────────────────────────────────────────

func TestIsHex(t *testing.T) {
	cases := []struct {
		input string
		want  bool
	}{
		{"", false},
		{"abc123", true},
		{"ABCDEF0123456789", true},
		{"g123", false},
		{"abcd", true},
		{"abcde", false}, // hex.DecodeString: ungerade Länge = Fehler
	}
	for _, tc := range cases {
		got := isHex(tc.input)
		if got != tc.want {
			t.Errorf("isHex(%q) = %v, want %v", tc.input, got, tc.want)
		}
	}
}

func TestFirstToken(t *testing.T) {
	cases := []struct{ input, want string }{
		{"abc\tdef", "abc"},
		{"abc", "abc"},
		{"\tdef", ""},
		{"", ""},
	}
	for _, tc := range cases {
		got := firstToken(tc.input)
		if got != tc.want {
			t.Errorf("firstToken(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

func TestRefType(t *testing.T) {
	cases := []struct{ input, want string }{
		{"refs/heads/main", "branch"},
		{"refs/tags/v1.0", "tag"},
		{"refs/remotes/origin/main", "remote"},
		{"HEAD", "other"},
		{"refs/stash", "other"},
	}
	for _, tc := range cases {
		got := refType(tc.input)
		if got != tc.want {
			t.Errorf("refType(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

func TestParsePerson(t *testing.T) {
	p := parsePerson("Max", "max@example.com", "2024-01-15T10:30:00+01:00")
	if p.Name != "Max" || p.Email != "max@example.com" || p.When != "2024-01-15T10:30:00+01:00" {
		t.Errorf("parsePerson unerwartetes Ergebnis: %+v", p)
	}
}

func TestBlobIsText(t *testing.T) {
	// Leer → Text
	if !blobIsText(nil) {
		t.Error("blobIsText(nil) sollte true sein")
	}
	if !blobIsText([]byte{}) {
		t.Error("blobIsText(empty) sollte true sein")
	}

	// Normale Textdatei → Text
	if !blobIsText([]byte("Hallo Welt\nDies ist Text\n")) {
		t.Error("blobIsText(text) sollte true sein")
	}

	// Binärcode → nicht Text
	binary := make([]byte, 100)
	binary[0] = 0
	binary[1] = 0xFF
	if blobIsText(binary) {
		t.Error("blobIsText(binary) sollte false sein")
	}

	// Einfacher Code mit Tabs/Zeilen → Text
	code := []byte("package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"hi\")\n}\n")
	if !blobIsText(code) {
		t.Error("blobIsText(code) sollte true sein")
	}
}

func TestGzipBytesRoundTrip(t *testing.T) {
	original := []byte("Dies ist ein Teststring zum Komprimieren und Dekomprimieren.")
	compressed, err := gzipBytes(original)
	if err != nil {
		t.Fatalf("gzipBytes: %v", err)
	}
	if len(compressed) >= len(original) {
		t.Logf("Hinweis: gzip ist bei diesem kurzen Input nicht kleiner (%d → %d bytes)", len(original), len(compressed))
	}

	// Dekomprimieren mit gzip.NewReader
	decompressed, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		t.Fatal(err)
	}
	var buf bytes.Buffer
	if _, err := buf.ReadFrom(decompressed); err != nil {
		t.Fatalf("ReadFrom: %v", err)
	}
	if buf.String() != string(original) {
		t.Errorf("gzip round-trip: got %q, want %q", buf.String(), string(original))
	}
}

func TestSQLStr(t *testing.T) {
	cases := []struct{ in, want string }{
		{"", "NULL"},
		{"abc", "'abc'"},
		{"O'Brien", "'O''Brien'"},
		{"a'b'c", "'a''b''c'"},
		{"name with spaces", "'name with spaces'"},
	}
	for _, tc := range cases {
		if got := sqlStr(tc.in); got != tc.want {
			t.Errorf("sqlStr(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestSQLBlob(t *testing.T) {
	if got := sqlBlob(nil); got != "NULL" {
		t.Errorf("sqlBlob(nil) = %q, want NULL", got)
	}
	if got := sqlBlob([]byte{}); got != "NULL" {
		t.Errorf("sqlBlob(empty) = %q, want NULL", got)
	}
	// 0x00 0x01 0xFF → "0001ff"
	if got := sqlBlob([]byte{0x00, 0x01, 0xFF}); got != "X'0001ff'" {
		t.Errorf("sqlBlob = %q, want X'0001ff'", got)
	}
}

func TestCommitHashes(t *testing.T) {
	commits := []Commit{
		{Hash: "abc123"},
		{Hash: "def456"},
	}
	got := commitHashes(commits)
	if len(got) != 2 || got[0] != "abc123" || got[1] != "def456" {
		t.Errorf("commitHashes = %v", got)
	}
}

func TestParseCommits(t *testing.T) {
	// Simuliert die Ausgabe von commitRecords: Records sind durch 0x1f
	// getrennte Felder: hash, author-name, author-email, author-date,
	// committer-name, committer-email, committer-date, parents, tree, message.
	sep := "\x1f"
	lines := []string{
		"abc123def456abc123def456abc123def456ab" + sep + "Max" + sep + "max@m.de" + sep + "2024-01-15T10:00:00+01:00" + sep + "Eve" + sep + "eve@e.de" + sep + "2024-01-15T10:00:00+01:00" + sep + "" + sep + "tree123" + sep + "init",
		"def45678901def45678901def45678901def4567" + sep + "Max" + sep + "max@m.de" + sep + "2024-01-16T12:00:00+01:00" + sep + "Eve" + sep + "eve@e.de" + sep + "2024-01-16T12:00:00+01:00" + sep + "abc123def456abc123def456abc123def456ab" + sep + "tree456" + sep + "feat",
	}
	commits, err := parseCommits(lines)
	if err != nil {
		t.Fatalf("parseCommits: %v", err)
	}
	if len(commits) != 2 {
		t.Fatalf("parseCommits: expected 2 commits, got %d", len(commits))
	}
	if commits[0].Hash != "abc123def456abc123def456abc123def456ab" {
		t.Errorf("commit[0].Hash = %q", commits[0].Hash)
	}
	if commits[0].Author.Name != "Max" {
		t.Errorf("commit[0].Author.Name = %q", commits[0].Author.Name)
	}
	if commits[1].Message != "feat" {
		t.Errorf("commit[1].Message = %q", commits[1].Message)
	}
	if len(commits[1].Parents) != 1 || commits[1].Parents[0] != "abc123def456abc123def456abc123def456ab" {
		t.Errorf("commit[1].Parents = %v", commits[1].Parents)
	}
	if commits[1].Tree != "tree456" {
		t.Errorf("commit[1].Tree = %q", commits[1].Tree)
	}
}

func TestApplyNumstat(t *testing.T) {
	commits := []Commit{
		{Hash: "aaa111"},
		{Hash: "bbb222"},
	}
	numstat := []string{
		"aaa111", // Header für Commit 1
		"10\t5\tgo.mod",
		"0\t3\told.go",
		"bbb222", // Header für Commit 2
		"50\t0\tnew.go",
	}
	total := applyNumstat(commits, numstat)
	if total != 3 {
		t.Errorf("applyNumstat total = %d, want 3", total)
	}
	if commits[0].ChangedFiles != 2 || commits[0].Insertions != 10 || commits[0].Deletions != 8 {
		t.Errorf("commit 0 stats: %+v", commits[0])
	}
	if commits[1].ChangedFiles != 1 || commits[1].Insertions != 50 {
		t.Errorf("commit 1 stats: %+v", commits[1])
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Integration-Tests (benötigen das aktuelle Git-Repository)
// ──────────────────────────────────────────────────────────────────────────────

func TestGitVersion(t *testing.T) {
	ver, err := GitVersion()
	if err != nil {
		t.Skipf("git nicht installiert: %v", err)
	}
	t.Logf("Git-Version: %s", ver)
}

func TestSnapshot(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		LimitCommits: 5,
	}
	data, err := Snapshot(opts)
	if err != nil {
		t.Fatalf("Snapshot: %v", err)
	}

	t.Logf("Meta: branch=%s, hash_algo=%s, bare=%v", data.Meta.Branch, data.Meta.HashAlgo, data.Meta.IsBare)
	t.Logf("Refs: %d", len(data.Refs))
	t.Logf("Commits: %d", len(data.Commits))
	t.Logf("Trees: %d", len(data.Trees))
	t.Logf("Blobs: %d", len(data.Blobs))

	if len(data.Commits) == 0 {
		t.Error("erwartete mindestens einen Commit")
	}
	if len(data.Refs) == 0 {
		t.Error("erwartete mindestens einen Ref")
	}
	if data.Meta.HashAlgo == "" {
		t.Error("HashAlgo sollte gesetzt sein")
	}
}

func TestSnapshotWithBlobs(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		WithBlobs:    true,
		LimitCommits: 2,
	}
	data, err := Snapshot(opts)
	if err != nil {
		t.Fatalf("Snapshot: %v", err)
	}

	if len(data.Blobs) == 0 {
		t.Log("Keine Blobs gefunden – das kann bei einem leeren Commit passieren")
	}

	for _, b := range data.Blobs {
		if b.Size == 0 && b.Data != nil {
			t.Errorf("Blob %s: Size=0 aber Data vorhanden", b.Hash)
		}
		if b.Data != nil && !b.IsText {
			t.Logf("Blob %s: binär (%d bytes)", b.Hash, b.Size)
		}
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Export-Tests (SQLite + JSON)
// ──────────────────────────────────────────────────────────────────────────────

func TestExportSQLite(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		SQLitePath:   dbPath,
		LimitCommits: 3,
	}
	report, err := Export(opts)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}

	if report.Commits == 0 {
		t.Error("erwartete mindestens einen Commit im Report")
	}
	if report.SQLitePath == "" {
		t.Error("Report.SQLitePath sollte gesetzt sein")
	}

	// Datei muss existieren
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Fatalf("SQLite-Datei existiert nicht: %s", dbPath)
	}

	// Datenbank öffnen und Tabellen prüfen
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("DB öffnen: %v", err)
	}
	defer db.Close()

	tables := []string{"meta", "refs", "commits", "parents", "tree_entries", "blobs"}
	for _, tbl := range tables {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM " + tbl).Scan(&count)
		if err != nil {
			t.Errorf("Tabelle %s: %v", tbl, err)
		} else {
			t.Logf("Tabelle %s: %d Zeilen", tbl, count)
		}
	}
}

func TestExportJSON(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	jsonDir := filepath.Join(dir, "export")

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		JSONDir:      jsonDir,
		LimitCommits: 3,
	}
	report, err := Export(opts)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}

	if report.Commits == 0 {
		t.Error("erwartete mindestens einen Commit im Report")
	}

	// Erwartete Dateien
	expectedFiles := []string{"repo.json", "refs.json", "commits.json", "trees.json", "blobs.json"}
	for _, f := range expectedFiles {
		path := filepath.Join(jsonDir, f)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("Datei fehlt: %s", f)
		}
	}

	// commits.json validieren
	commitsData, err := os.ReadFile(filepath.Join(jsonDir, "commits.json"))
	if err != nil {
		t.Fatalf("commits.json lesen: %v", err)
	}
	var commits []Commit
	if err := json.Unmarshal(commitsData, &commits); err != nil {
		t.Fatalf("commits.json invalid: %v", err)
	}
	if len(commits) == 0 {
		t.Error("commits.json ist leer")
	}
}

func TestExportBothSQLiteAndJSON(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")
	jsonDir := filepath.Join(dir, "json")

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		SQLitePath:   dbPath,
		JSONDir:      jsonDir,
		LimitCommits: 2,
	}
	report, err := Export(opts)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}

	t.Logf("Report: %s", report.String())

	if report.SQLitePath == "" || report.JSONDir == "" {
		t.Error("beide Pfade sollten gesetzt sein")
	}
}

func TestExportSQL(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	sqlPath := filepath.Join(dir, "export.sql")

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		SQLPath:      sqlPath,
		WithBlobs:    true,
		LimitCommits: 2,
	}
	report, err := Export(opts)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}
	if report.SQLPath == "" {
		t.Error("Report.SQLPath sollte gesetzt sein")
	}

	// Datei muss existieren und nicht leer sein
	fi, err := os.Stat(sqlPath)
	if err != nil {
		t.Fatalf("SQL-Datei existiert nicht: %v", err)
	}
	if fi.Size() == 0 {
		t.Fatal("SQL-Datei ist leer")
	}

	content, err := os.ReadFile(sqlPath)
	if err != nil {
		t.Fatalf("SQL-Datei lesen: %v", err)
	}
	s := string(content)

	// Struktur prüfen
	for _, want := range []string{
		"BEGIN;", "COMMIT;",
		"CREATE TABLE IF NOT EXISTS meta",
		"CREATE TABLE IF NOT EXISTS refs",
		"CREATE TABLE IF NOT EXISTS commits",
		"CREATE TABLE IF NOT EXISTS parents",
		"CREATE TABLE IF NOT EXISTS tree_entries",
		"CREATE TABLE IF NOT EXISTS blobs",
		"INSERT INTO commits",
		"INSERT INTO refs",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("SQL-Dump enthält nicht %q", want)
		}
	}

	// SQLite-kompatibel: Dump in eine frische DB einspielen und Tabellen zählen
	db, err := sql.Open("sqlite", filepath.Join(dir, "restored.db"))
	if err != nil {
		t.Fatalf("DB öffnen: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec(s); err != nil {
		t.Fatalf("SQL-Dump in SQLite einspielen: %v", err)
	}
	for _, tbl := range []string{"meta", "refs", "commits", "parents", "tree_entries", "blobs"} {
		var count int
		if err := db.QueryRow("SELECT COUNT(*) FROM " + tbl).Scan(&count); err != nil {
			t.Errorf("Tabelle %s: %v", tbl, err)
			continue
		}
		t.Logf("Tabelle %s: %d Zeilen (restored)", tbl, count)
	}
}

func TestExportAllTargets(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		SQLitePath:   filepath.Join(dir, "test.db"),
		SQLPath:      filepath.Join(dir, "dump.sql"),
		JSONDir:      filepath.Join(dir, "json"),
		WithBlobs:    true,
		LimitCommits: 1,
	}
	report, err := Export(opts)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}
	if report.SQLitePath == "" || report.SQLPath == "" || report.JSONDir == "" {
		t.Error("alle drei Pfade sollten gesetzt sein")
	}
	if _, err := os.Stat(report.SQLPath); err != nil {
		t.Errorf("SQL-Dump fehlt: %v", err)
	}
}

func TestExportNoTarget(t *testing.T) {
	opts := ExportOptions{RepoPath: "."}
	_, err := Export(opts)
	if err == nil {
		t.Error("Export ohne Ziel sollte Fehler zurückgeben")
	}
}

func TestReadBlob(t *testing.T) {
	if _, err := GitVersion(); err != nil {
		t.Skip("git nicht installiert")
	}

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		SQLitePath:   dbPath,
		WithBlobs:    true,
		LimitCommits: 2,
	}
	if _, err := Export(opts); err != nil {
		t.Fatalf("Export: %v", err)
	}

	// Einen beliebigen Blob aus der DB lesen
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	var hash string
	err = db.QueryRow("SELECT hash FROM blobs WHERE data IS NOT NULL LIMIT 1").Scan(&hash)
	if err != nil {
		t.Skip("Kein Blob mit Daten in der DB")
	}

	data, err := ReadBlob(dbPath, hash)
	if err != nil {
		t.Fatalf("ReadBlob(%s): %v", hash, err)
	}
	t.Logf("Blob %s: %d bytes gelesen", hash, len(data))
}

func TestReportString(t *testing.T) {
	r := &Report{
		Commits: 10,
		Refs:    3,
		JSONDir: "test",
	}
	s := r.String()
	if s == "" {
		t.Error("Report.String() sollte nicht leer sein")
	}
	t.Logf("Report: %s", s)
}

// ──────────────────────────────────────────────────────────────────────────────
// Benchmark
// ──────────────────────────────────────────────────────────────────────────────

func BenchmarkSnapshot(b *testing.B) {
	if _, err := GitVersion(); err != nil {
		b.Skip("git nicht installiert")
	}

	opts := ExportOptions{
		RepoPath:     "c:/Users/dara/Documents/GitHub/finder",
		LimitCommits: 10,
	}

	for i := 0; i < b.N; i++ {
		_, err := Snapshot(opts)
		if err != nil {
			b.Fatal(err)
		}
	}
}
