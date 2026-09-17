package gitviewer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
)

// Commit repräsentiert einen einzelnen Git-Commit.
type Commit struct {
	Hash    string `json:"hash"`
	Short   string `json:"short"`
	Author  string `json:"author"`
	Date    string `json:"date"`
	Message string `json:"message"`
}

// SizeResult ist die Antwort für die Größenabfrage eines Commits.
type SizeResult struct {
	Commit    string `json:"commit"`
	Size      int64  `json:"size"`
	SizeHuman string `json:"sizeHuman"`
	FileCount int    `json:"fileCount"`
}

// Trennzeichen, die in normalen Commit-Messages praktisch nie vorkommen.
const fieldSep = "\x1f"  // Unit Separator
const recordSep = "\x1e" // Record Separator

// runGit führt einen Git-Befehl über das System-Git im angegebenen Repo aus.
// Es wird bewusst exec.Command mit einzelnen Argumenten (kein Shell-String)
// verwendet, damit keine Shell-Injection über den repo/commit-Parameter möglich ist.
func runGit(repo string, args ...string) (string, error) {
	fullArgs := append([]string{"-C", repo}, args...)
	cmd := exec.Command("git", fullArgs...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s fehlgeschlagen: %v (%s)", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return string(out), nil
}

func isGitRepo(repo string) bool {
	_, err := runGit(repo, "rev-parse", "--is-inside-work-tree")
	return err == nil
}

// getCommits liest die Commit-Historie via "git log" aus.
func getCommits(repo string) ([]Commit, error) {
	format := "%H" + fieldSep + "%h" + fieldSep + "%an" + fieldSep + "%ad" + fieldSep + "%s"
	out, err := runGit(repo, "log", "--date=iso-strict", "--pretty=format:"+format+recordSep)
	if err != nil {
		return nil, err
	}

	var commits []Commit
	for _, rec := range strings.Split(out, recordSep) {
		rec = strings.TrimSpace(rec)
		if rec == "" {
			continue
		}
		parts := strings.SplitN(rec, fieldSep, 5)
		if len(parts) < 5 {
			continue
		}
		commits = append(commits, Commit{
			Hash:    parts[0],
			Short:   parts[1],
			Author:  parts[2],
			Date:    parts[3],
			Message: parts[4],
		})
	}
	return commits, nil
}

// getSizeAtCommit summiert die Blob-Größen des kompletten Baums zu einem
// bestimmten Commit via "git ls-tree -r -l". Das ist die Gesamtgröße aller
// Dateiinhalte im Repo zu diesem Zeitpunkt, ohne dass ausgecheckt werden muss.
func getSizeAtCommit(repo, commit string) (int64, int, error) {
	out, err := runGit(repo, "ls-tree", "-r", "-l", commit)
	if err != nil {
		return 0, 0, err
	}

	var total int64
	count := 0
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Format: <mode> <type> <hash> <size>\t<pfad>
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		sizeStr := fields[3]
		if sizeStr == "-" {
			// z.B. Submodule haben keine Größe
			continue
		}
		size, err := strconv.ParseInt(sizeStr, 10, 64)
		if err != nil {
			continue
		}
		total += size
		count++
	}
	return total, count, nil
}

func humanSize(size int64) string {
	units := []string{"B", "KB", "MB", "GB", "TB"}
	f := float64(size)
	i := 0
	for f >= 1024 && i < len(units)-1 {
		f /= 1024
		i++
	}
	return fmt.Sprintf("%.2f %s", f, units[i])
}

func signedHumanSize(delta int64) string {
	if delta > 0 {
		return "+" + humanSize(delta)
	}
	if delta < 0 {
		return "-" + humanSize(-delta)
	}
	return "±0 B"
}

const zeroSha = "0000000000000000000000000000000000000000"

// getParents liefert die Eltern-Hashes eines Commits (leer bei einem
// Root-Commit, d.h. dem allerersten Commit ohne Vorgänger).
func getParents(repo, commit string) ([]string, error) {
	out, err := runGit(repo, "rev-list", "--parents", "-n", "1", commit)
	if err != nil {
		return nil, err
	}
	fields := strings.Fields(strings.TrimSpace(out))
	if len(fields) <= 1 {
		return nil, nil // Root-Commit, kein Elternteil
	}
	return fields[1:], nil
}

type rawEntry struct {
	oldSha, newSha, status string
}

// parseDiffRaw parst die Ausgabe von "git diff-tree --raw".
// Zeilenformat: ":<oldmode> <newmode> <oldsha> <newsha> <status>\t<pfad>[\t<neuer pfad>]"
func parseDiffRaw(out string) []rawEntry {
	var entries []rawEntry
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || !strings.HasPrefix(line, ":") {
			continue
		}
		meta := line
		if idx := strings.Index(line, "\t"); idx != -1 {
			meta = line[:idx]
		}
		fields := strings.Fields(meta)
		if len(fields) < 5 {
			continue
		}
		entries = append(entries, rawEntry{oldSha: fields[2], newSha: fields[3], status: fields[4]})
	}
	return entries
}

// getBlobSizes fragt für eine Liste von Blob-Hashes deren Größen in einem
// einzigen "git cat-file --batch-check" Aufruf ab (effizienter als N Aufrufe).
func getBlobSizes(repo string, shas []string) (map[string]int64, error) {
	seen := map[string]bool{}
	var input strings.Builder
	for _, s := range shas {
		if s == "" || s == zeroSha || seen[s] {
			continue
		}
		seen[s] = true
		input.WriteString(s)
		input.WriteString("\n")
	}

	result := map[string]int64{}
	if input.Len() == 0 {
		return result, nil
	}

	cmd := exec.Command("git", "-C", repo, "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)")
	cmd.Stdin = strings.NewReader(input.String())
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("git cat-file fehlgeschlagen: %v (%s)", err, strings.TrimSpace(string(out)))
	}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 || fields[1] != "blob" {
			continue
		}
		size, err := strconv.ParseInt(fields[2], 10, 64)
		if err != nil {
			continue
		}
		result[fields[0]] = size
	}
	return result, nil
}

// DiffSizeResult beschreibt, wie viele Bytes durch genau diesen Commit
// hinzugekommen bzw. weggefallen sind (im Gegensatz zur kumulierten
// Gesamtgröße, die alle Dateien zu diesem Zeitpunkt summiert).
type DiffSizeResult struct {
	Commit       string `json:"commit"`
	Added        int64  `json:"added"`
	Removed      int64  `json:"removed"`
	Delta        int64  `json:"delta"`
	AddedHuman   string `json:"addedHuman"`
	RemovedHuman string `json:"removedHuman"`
	DeltaHuman   string `json:"deltaHuman"`
	FilesChanged int    `json:"filesChanged"`
	IsRoot       bool   `json:"isRoot"`
}

func getDiffSize(repo, commit string) (*DiffSizeResult, error) {
	parents, err := getParents(repo, commit)
	if err != nil {
		return nil, err
	}

	var raw string
	if len(parents) == 0 {
		// Erster Commit: gegen den leeren Baum vergleichen -> alles ist "hinzugefügt"
		raw, err = runGit(repo, "diff-tree", "--root", "--no-commit-id", "-r", "--raw", commit)
	} else {
		// Bei Merge-Commits wird bewusst nur gegen den ersten Elternteil verglichen
		// (wie "git log --first-parent"), damit das Ergebnis eindeutig bleibt.
		raw, err = runGit(repo, "diff-tree", "--no-commit-id", "-r", "--raw", parents[0], commit)
	}
	if err != nil {
		return nil, err
	}

	entries := parseDiffRaw(raw)
	shas := make([]string, 0, len(entries)*2)
	for _, e := range entries {
		shas = append(shas, e.oldSha, e.newSha)
	}
	sizes, err := getBlobSizes(repo, shas)
	if err != nil {
		return nil, err
	}

	var added, removed int64
	for _, e := range entries {
		var letter byte
		if len(e.status) > 0 {
			letter = e.status[0]
		}
		switch letter {
		case 'A':
			added += sizes[e.newSha]
		case 'D':
			removed += sizes[e.oldSha]
		default: // M (modified), T (type changed), R (renamed), C (copied) ...
			if e.newSha != zeroSha {
				added += sizes[e.newSha]
			}
			if e.oldSha != zeroSha {
				removed += sizes[e.oldSha]
			}
		}
	}

	return &DiffSizeResult{
		Commit:       commit,
		Added:        added,
		Removed:      removed,
		Delta:        added - removed,
		AddedHuman:   "+" + humanSize(added),
		RemovedHuman: "-" + humanSize(removed),
		DeltaHuman:   signedHumanSize(added - removed),
		FilesChanged: len(entries),
		IsRoot:       len(parents) == 0,
	}, nil
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func CommitsHandler(w http.ResponseWriter, r *http.Request) {
	repo := strings.TrimSpace(r.URL.Query().Get("repo"))
	if repo == "" {
		writeJSONError(w, http.StatusBadRequest, "Parameter 'repo' fehlt")
		return
	}
	if !isGitRepo(repo) {
		writeJSONError(w, http.StatusBadRequest, "Pfad ist kein Git-Repository: "+repo)
		return
	}

	commits, err := getCommits(repo)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(commits)
}

func SizeHandler(w http.ResponseWriter, r *http.Request) {
	repo := strings.TrimSpace(r.URL.Query().Get("repo"))
	commit := strings.TrimSpace(r.URL.Query().Get("commit"))
	if repo == "" || commit == "" {
		writeJSONError(w, http.StatusBadRequest, "Parameter 'repo' und 'commit' werden benötigt")
		return
	}
	if !isGitRepo(repo) {
		writeJSONError(w, http.StatusBadRequest, "Pfad ist kein Git-Repository: "+repo)
		return
	}

	size, count, err := getSizeAtCommit(repo, commit)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SizeResult{
		Commit:    commit,
		Size:      size,
		SizeHuman: humanSize(size),
		FileCount: count,
	})
}

func DiffSizeHandler(w http.ResponseWriter, r *http.Request) {
	repo := strings.TrimSpace(r.URL.Query().Get("repo"))
	commit := strings.TrimSpace(r.URL.Query().Get("commit"))
	if repo == "" || commit == "" {
		writeJSONError(w, http.StatusBadRequest, "Parameter 'repo' und 'commit' werden benötigt")
		return
	}
	if !isGitRepo(repo) {
		writeJSONError(w, http.StatusBadRequest, "Pfad ist kein Git-Repository: "+repo)
		return
	}

	result, err := getDiffSize(repo, commit)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func WithCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}
