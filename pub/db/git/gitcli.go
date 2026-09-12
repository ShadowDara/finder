package gitdb

import (
	"bufio"
	"bytes"
	"encoding/hex"
	"fmt"
	"io"
	"os/exec"
	"strings"
)

// GitVersion liefert die Versionszeile des installierten Git
// (z.B. "git version 2.49.0.windows.1").
func GitVersion() (string, error) {
	out, err := gitOutput("--version")
	if err != nil {
		return "", fmt.Errorf("gitdb: git ist nicht installiert oder nicht im PATH: %w", err)
	}
	return strings.TrimSpace(string(out)), nil
}

// gitCmd erzeugt einen Git-Befehl, der im Repository-Kontext läuft.
func gitCmd(repo string, args ...string) *exec.Cmd {
	cmd := exec.Command("git", args...)
	if repo != "" {
		cmd.Dir = repo
	}
	return cmd
}

// gitOutput führt einen Git-Befehl aus und liefert seine stdout zurück.
func gitOutput(args ...string) ([]byte, error) {
	return gitOutputIn("", args...)
}

// gitOutputIn führt einen Git-Befehl im Repository-Ordner aus.
func gitOutputIn(repo string, args ...string) ([]byte, error) {
	cmd := gitCmd(repo, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return nil, fmt.Errorf("gitdb: git %s: %s", strings.Join(args, " "), msg)
	}
	return out, nil
}

// rawLines führt einen Git-Befehl aus und liefert die Zeilen (ohne Trailing-Newline).
func rawLines(repo string, args ...string) ([]string, error) {
	out, err := gitOutputIn(repo, args...)
	if err != nil {
		return nil, err
	}
	s := strings.ReplaceAll(string(out), "\r\n", "\n")
	s = strings.TrimSuffix(s, "\n")
	if s == "" {
		return nil, nil
	}
	return strings.Split(s, "\n"), nil
}

// resolveRefName wandelt einen kurzen Ref-Namen in den vollständigen Namen
// um (branch → refs/heads/branch). HEAD bleibt HEAD.
func resolveRefName(repo, name string) (string, error) {
	if name == "HEAD" || strings.HasPrefix(name, "refs/") {
		return name, nil
	}
	for _, prefix := range []string{"refs/heads/", "refs/tags/", "refs/remotes/"} {
		if _, err := gitOutputIn(repo, "rev-parse", "--verify", "--quiet", prefix+name); err == nil {
			return prefix + name, nil
		}
	}
	return "", fmt.Errorf("gitdb: Ref %q nicht gefunden", name)
}

// hashAlgoOf bestimmt den Objekt-Hash-Algorithmus des Repositories.
func hashAlgoOf(repo string) string {
	out, err := gitOutputIn(repo, "rev-parse", "--show-object-format")
	if err != nil {
		return "sha1"
	}
	return strings.TrimSpace(string(out))
}

// isBareRepo prüft, ob das Repository ein Bare-Repository ist.
func isBareRepo(repo string) (bool, error) {
	out, err := gitOutputIn(repo, "rev-parse", "--is-bare-repository")
	if err != nil {
		return false, err
	}
	return strings.TrimSpace(string(out)) == "true", nil
}

// currentBranch liefert den Namen des aktuellen HEAD-Zweigs (leer bei detached HEAD).
func currentBranch(repo string) string {
	out, err := gitOutputIn(repo, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

// remoteURL liefert die Push-URL des ersten Remotes (leer bei none).
func remoteURL(repo string) string {
	out, err := gitOutputIn(repo, "config", "--get-regexp", `^remote\..*\.(push)?url$`)
	if err != nil {
		return ""
	}
	line := strings.TrimSpace(string(out))
	if idx := strings.IndexByte(line, ' '); idx >= 0 {
		return strings.TrimSpace(line[idx+1:])
	}
	return line
}

// listRefs liefert alle Refs im Format "<hash>\t<name>".
func listRefs(repo string) ([]string, error) {
	return rawLines(repo, "for-each-ref", "--format=%(objectname)%09%(refname)")
}

// listRefsWithTypes liefert Refs samt Objekt-Typ und gepelltem Ziel.
// Format pro Zeile: "<refname>\t<objecttype>\t<peeled>"
func listRefsWithTypes(repo string) ([]string, error) {
	return rawLines(repo,
		"for-each-ref",
		"--format=%(refname)%09%(objecttype)%09%(objectname)%09%(*objectname)",
	)
}

// commitRecords liefert vollständige Commit-Datensätze, getrennt durch
// ASCII Record Separator (0x1e). Felder innerhalb eines Datensatzes
// sind durch Unit Separator (0x1f) getrennt:
//
//	hash, author-name, author-email, author-date,
//	committer-name, committer-email, committer-date,
//	parents, tree, message
func commitRecords(repo string, refs []string) ([]string, error) {
	args := []string{
		"log", "--topo-order",
		"--pretty=format:%H%x1f%an%x1f%ae%x1f%aI%x1f%cn%x1f%ce%x1f%cI%x1f%P%x1f%T%x1f%B%x1e",
	}
	if len(refs) == 0 {
		args = append(args, "--all")
	} else {
		args = append(args, refs...)
	}
	out, err := gitOutputIn(repo, args...)
	if err != nil {
		return nil, err
	}
	s := strings.ReplaceAll(string(out), "\r\n", "\n")
	s = strings.Trim(s, "\n\x1e")
	if s == "" {
		return nil, nil
	}
	return strings.Split(s, "\x1e"), nil
}

// SaveCommitsToJSON speichert Commits in eine JSON-Datei.
func SaveCommitsToJSON(repo, jsonPath string) error {
	entries, err := commitRecords(repo, nil)
	if err != nil {
		return fmt.Errorf("konnte Commits nicht abrufen: %v", err)
	}

	var commits []Commit
	for _, entry := range entries {
		fields := strings.Split(entry, string(0x1f))
		if len(fields) < 4 {
			continue
		}
		commits = append(commits, Commit{
			Hash:    fields[0],
			Author:  fields[1],
			Date:    fields[3],
			Message: fields[len(fields)-1],
		})
	}

	file, err := os.Create(jsonPath)
	if err != nil {
		return fmt.Errorf("konnte JSON-Datei nicht erstellen: %v", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(commits); err != nil {
		return fmt.Errorf("konnte JSON schreiben: %v", err)
	}

	return nil
}

// treeLines liefert alle Baum-Einträge eines Commits im Format
// `git ls-tree -r -l`: "<mode> <type> <object> <size>\t<path>".

// SaveCommitsToSQLite speichert Commits in einer SQLite-Datenbank.
func SaveCommitsToSQLite(repo, dbPath string) error {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("konnte SQLite-Datenbank nicht öffnen: %v", err)
	}
	defer db.Close()

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS commits (
		hash TEXT PRIMARY KEY,
		author TEXT,
		date TEXT,
		message TEXT
	)`)
func treeLines(repo, commit string) ([]string, error) {
	return rawLines(repo, "ls-tree", "-r", "-l", commit)
}

// fetchAllNumstat liefert für jeden Commit die numstat-Zeilen einzeln.
// Ausgabe pro Commit: "<commit-hash>" gefolgt von den numstat-Zeilen.
func fetchAllNumstat(repo string, commits []string) ([]string, error) {
	var out []string
	for _, c := range commits {
		lines, err := rawLines(repo, "diff-tree", "--numstat", "-r", "--root", "--no-renames", c)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
		out = append(out, lines...)
	}
	return out, nil
}

func forEachRefList(repo string) ([]string, error) {
	return rawLines(repo,
		"for-each-ref",
		"--format=%(objectname)%09%(refname)%09%(*objectname)")
}

// catFileBatch startet "git cat-file --batch". stdin muss nach der letzten
// Anfrage geschlossen werden, damit der Prozess sauber beendet.
func catFileBatch(repo string) (*bufio.Reader, io.WriteCloser, *exec.Cmd, error) {
	cmd := gitCmd(repo, "cat-file", "--batch")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, nil, nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		_ = stdin.Close()
		return nil, nil, nil, err
	}
	if err := cmd.Start(); err != nil {
		_ = stdin.Close()
		return nil, nil, nil, err
	}
	return bufio.NewReader(stdout), stdin, cmd, nil
}

// batchRead liest einen einzelnen Batch-Record von git cat-file --batch.
// Rückgabe: header ("<oid> blob <size>" oder "<oid> missing"), Inhalt.
func batchRead(r *bufio.Reader) (header string, data []byte, err error) {
	header, err = r.ReadString('\n')
	if err != nil {
		return "", nil, err
	}
	header = strings.TrimSuffix(header, "\n")
	fields := strings.Fields(header)
	if len(fields) < 2 {
		return header, nil, nil
	}
	if fields[1] == "missing" {
		return header, nil, nil
	}
	// Format: "<oid> <type> <size>"
	var size int64
	if len(fields) >= 3 {
		_, err = fmt.Sscanf(fields[2], "%d", &size)
		if err != nil {
			return header, nil, fmt.Errorf("gitdb: ungültige Batch-Größe in %q: %w", header, err)
		}
	}
	data = make([]byte, size)
	if _, err = io.ReadFull(r, data); err != nil {
		return header, nil, fmt.Errorf("gitdb: Batch-Lesen fehlgeschlagen: %w", err)
	}
	// Die abschließende Leerzeile konsumieren
	if _, err = r.ReadByte(); err != nil {
		return header, data, err
	}
	return header, data, nil
}

// gitExists prüft, ob ein Objekt im Repository existiert.
func gitExists(repo, oid string) bool {
	_, err := gitOutputIn(repo, "cat-file", "-e", oid)
	return err == nil
}

// isHex prüft, ob s eine gültige hexadezimale Objekt-ID ist.
func isHex(s string) bool {
	if s == "" {
		return false
	}
	_, err := hex.DecodeString(s)
	return err == nil
}

// firstToken liefert das erste Feld einer Zeile (getrennt durch Tabs).
func firstToken(line string) string {
	if idx := strings.IndexByte(line, '\t'); idx >= 0 {
		return line[:idx]
	}
	return line
}

// parsePerson erzeugt eine Person aus name/email/date.
func parsePerson(name, email, date string) Person {
	return Person{Name: name, Email: email, When: date}
}
