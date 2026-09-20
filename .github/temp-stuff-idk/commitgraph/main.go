package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

//go:embed static/*
var staticFiles embed.FS

// Commit represents a single git commit as reported by `git log`.
type Commit struct {
	Hash    string `json:"hash"`
	Author  string `json:"author"`
	Email   string `json:"email"`
	Date    string `json:"date"` // ISO-8601 / RFC3339, author date
	Message string `json:"message"`
}

const (
	fieldSep = "\x1f" // unit separator - splits fields within a commit
	rowSep   = "\x1e" // record separator - splits commits from each other
)

func main() {
	sub, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/api/validate", handleValidate)
	mux.HandleFunc("/api/branches", handleBranches)
	mux.HandleFunc("/api/authors", handleAuthors)
	mux.HandleFunc("/api/commits", handleCommits)

	addr := ":8080"
	fmt.Println("Commit graph server listening on http://localhost" + addr)
	log.Fatal(http.ListenAndServe(addr, withCORS(mux)))
}

// withCORS allows the frontend (served from the same origin normally, but
// also useful if someone opens the HTML file directly during development)
// to call the API.
func withCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		h.ServeHTTP(w, r)
	})
}

// runGit runs `git <args...>` in the given repo directory and returns stdout.
func runGit(repoPath string, args ...string) (string, error) {
	full := append([]string{"-C", repoPath}, args...)
	cmd := exec.Command("git", full...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("%s", strings.TrimSpace(string(out)))
	}
	return string(out), nil
}

func handleValidate(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		writeError(w, http.StatusBadRequest, "path is required")
		return
	}
	if _, err := runGit(path, "rev-parse", "--is-inside-work-tree"); err != nil {
		writeError(w, http.StatusBadRequest, "not a git repository: "+err.Error())
		return
	}
	writeJSON(w, map[string]bool{"valid": true})
}

func handleBranches(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		writeError(w, http.StatusBadRequest, "path is required")
		return
	}
	out, err := runGit(path, "for-each-ref", "--format=%(refname:short)", "refs/heads/", "refs/remotes/")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	branches := []string{}
	for _, l := range strings.Split(strings.TrimSpace(out), "\n") {
		l = strings.TrimSpace(l)
		if l != "" && !strings.HasSuffix(l, "/HEAD") {
			branches = append(branches, l)
		}
	}
	writeJSON(w, branches)
}

func handleAuthors(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		writeError(w, http.StatusBadRequest, "path is required")
		return
	}
	out, err := runGit(path, "log", "--all", "--format=%an")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	seen := map[string]bool{}
	authors := []string{}
	for _, l := range strings.Split(strings.TrimSpace(out), "\n") {
		l = strings.TrimSpace(l)
		if l != "" && !seen[l] {
			seen[l] = true
			authors = append(authors, l)
		}
	}
	writeJSON(w, authors)
}

func handleCommits(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	path := q.Get("path")
	if path == "" {
		writeError(w, http.StatusBadRequest, "path is required")
		return
	}

	args := []string{"log"}

	branch := strings.TrimSpace(q.Get("branch"))
	switch branch {
	case "", "--all":
		args = append(args, "--all")
	default:
		args = append(args, branch)
	}

	format := "--pretty=format:%H" + fieldSep + "%an" + fieldSep + "%ae" + fieldSep + "%aI" + fieldSep + "%s" + rowSep
	args = append(args, format)

	if author := q.Get("author"); author != "" {
		args = append(args, "--author="+author)
	}
	if since := q.Get("since"); since != "" {
		args = append(args, "--since="+since)
	}
	if until := q.Get("until"); until != "" {
		args = append(args, "--until="+until)
	}
	if grep := q.Get("grep"); grep != "" {
		args = append(args, "--grep="+grep, "-i")
	}
	if q.Get("noMerges") == "true" {
		args = append(args, "--no-merges")
	}
	if filePath := q.Get("filePath"); filePath != "" {
		args = append(args, "--", filePath)
	}

	out, err := runGit(path, args...)
	if err != nil {
		writeError(w, http.StatusBadRequest, "git error: "+err.Error())
		return
	}

	commits := parseCommits(out)
	writeJSON(w, commits)
}

func parseCommits(raw string) []Commit {
	commits := []Commit{}
	rows := strings.Split(raw, rowSep)
	for _, row := range rows {
		row = strings.Trim(row, "\n")
		row = strings.TrimSpace(row)
		if row == "" {
			continue
		}
		fields := strings.Split(row, fieldSep)
		if len(fields) < 5 {
			continue
		}
		commits = append(commits, Commit{
			Hash:    fields[0],
			Author:  fields[1],
			Email:   fields[2],
			Date:    fields[3],
			Message: strings.Join(fields[4:], fieldSep), // in case msg contains the sep
		})
	}
	return commits
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
