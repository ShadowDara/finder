package main

import (
	"encoding/json"
	"fmt"
	"log"
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
const fieldSep = "\x1f" // Unit Separator
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

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func commitsHandler(w http.ResponseWriter, r *http.Request) {
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

func sizeHandler(w http.ResponseWriter, r *http.Request) {
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

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/api/commits", withCORS(commitsHandler))
	http.HandleFunc("/api/size", withCORS(sizeHandler))

	addr := ":8080"
	log.Printf("Git Viewer läuft auf http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
