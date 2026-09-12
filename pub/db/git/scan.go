package gitdb

import (
	"bufio"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

// RepoData ist die vollständige, in-memory Ablage aller Daten eines
// Repositories. Sie wird vom Scanner gefüllt und von SQLite-/JSON-Exportern
// konsumiert.
type RepoData struct {
	Meta    RepoMeta
	Refs    []Ref
	Commits []Commit
	Trees   []TreeEntry
	Blobs   []Blob
}

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
	if err != nil {
		return fmt.Errorf("konnte Tabelle nicht erstellen: %v", err)
	}

	return nil
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

// Snapshot scannt das Repository mit der installierten Git-CLI.
// opts.LimitCommits begrenzt die Anzahl der verarbeiteten Commits.
func Snapshot(opts ExportOptions) (*RepoData, error) {
	repo := opts.RepoPath

	if _, err := GitVersion(); err != nil {
		return nil, err
	}

	data := &RepoData{}

	// ----- Metadaten -----
	meta := RepoMeta{Path: repo, Branch: currentBranch(repo)}
	meta.GitVersion, _ = GitVersion()
	meta.HashAlgo = hashAlgoOf(repo)
	meta.IsBare, _ = isBareRepo(repo)
	meta.RemoteURL = remoteURL(repo)
	data.Meta = meta

	// ----- Refs -----
	refs, err := scanRefs(repo)
	if err != nil {
		return nil, err
	}
	data.Refs = refs

	// ----- Commit-Liste -----
	refNames := make([]string, 0, len(refs))
	for _, r := range refs {
		if r.Name != "HEAD" {
			refNames = append(refNames, r.Name)
		}
	}
	sort.Strings(refNames)

	records, err := commitRecords(repo, refNames)
	if err != nil {
		return nil, err
	}
	commits, err := parseCommits(records)
	if err != nil {
		return nil, err
	}

	// Limit anwenden
	if opts.LimitCommits > 0 && len(commits) > opts.LimitCommits {
		commits = commits[:opts.LimitCommits]
	}

	// ----- Numstats (Diff-Statistik je Commit) -----
	numstat, err := fetchAllNumstat(repo, commitHashes(commits))
	if err != nil {
		return nil, err
	}
	applyNumstat(commits, numstat)

	// ----- Bäume & Blobs -----
	trees, blobs, err := scanTrees(repo, commits)
	if err != nil {
		return nil, err
	}

	// Dirty-Flag: Commits, die von keinem Ref erreichbar sind
	reachable := map[string]bool{}
	for _, r := range refs {
		if isHex(r.Target) {
			reachable[r.Target] = true
		}
	}
	for i := range commits {
		commits[i].Dirty = !reachable[commits[i].Hash]
	}

	if opts.WithBlobs && len(blobs) > 0 {
		if err := fillBlobData(repo, blobs); err != nil {
			return nil, fmt.Errorf("gitdb: Blob-Inhalt konnte nicht gelesen werden: %w", err)
		}
	}

	data.Commits = commits
	data.Trees = trees
	data.Blobs = blobs
	return data, nil
}

// scanRefs liest alle Refs des Repositories ein.
func scanRefs(repo string) ([]Ref, error) {
	lines, err := forEachRefList(repo)
	if err != nil {
		return nil, err
	}
	refs := make([]Ref, 0, len(lines)+1)
	seen := map[string]bool{}

	for _, line := range lines {
		fields := strings.Split(line, "\t")
		if len(fields) < 2 {
			continue
		}
		hash, name := fields[0], fields[1]
		peeled := ""
		if len(fields) > 2 {
			peeled = fields[2]
		}

		ref := Ref{Name: name, Target: hash, Type: refType(name)}
		if peeled != "" {
			ref.Target = peeled // Tag zeigt auf das gepellte Commit
		}
		if !seen[name] {
			refs = append(refs, ref)
			seen[name] = true
		}
	}

	// HEAD ergänzen
	if hash, err := gitOutputIn(repo, "rev-parse", "HEAD"); err == nil {
		head := strings.TrimSpace(string(hash))
		if head != "" && !seen["HEAD"] {
			refs = append(refs, Ref{Name: "HEAD", Target: head, Type: "other"})
		}
	}

	sort.Slice(refs, func(i, j int) bool { return refs[i].Name < refs[j].Name })
	return refs, nil
}

// refType klassifiziert eine Ref anhand ihres Namespace.
func refType(name string) string {
	switch {
	case strings.HasPrefix(name, "refs/heads/"):
		return "branch"
	case strings.HasPrefix(name, "refs/tags/"):
		return "tag"
	case strings.HasPrefix(name, "refs/remotes/"):
		return "remote"
	default:
		return "other"
	}
}

// parseCommits wandelt git-log-Datensätze (0x1f-getrennt) in Commit-Strukturen um.
func parseCommits(records []string) ([]Commit, error) {
	commits := make([]Commit, 0, len(records))
	for _, rec := range records {
		rec = strings.TrimSpace(rec)
		if rec == "" {
			continue
		}
		fields := strings.Split(rec, "\x1f")
		if len(fields) < 9 {
			continue
		}
		c := Commit{
			Hash:      fields[0],
			Author:    parsePerson(fields[1], fields[2], fields[3]),
			Committer: parsePerson(fields[4], fields[5], fields[6]),
			Tree:      fields[8],
		}
		if fields[7] != "" {
			c.Parents = strings.Fields(fields[7])
		}
		if len(fields) > 9 {
			c.Message = strings.TrimRight(fields[9], "\r\n")
		}
		commits = append(commits, c)
	}
	return commits, nil
}

// commitHashes extrahiert die Hashes (für diff-tree).
func commitHashes(commits []Commit) []string {
	hs := make([]string, len(commits))
	for i, c := range commits {
		hs[i] = c.Hash
	}
	return hs
}

// applyNumstat verarbeitet die diff-tree --numstat Ausgabe und füllt
// Insertions/Deletions/ChangedFiles je Commit. Erwartet wird das Format
// aus fetchAllNumstat: pro Commit zuerst eine Zeile mit dem exakten
// Commit-Hash, danach die numstat-Zeilen. Liefert die Gesamtzahl der
// betroffenen Dateien zurück.
func applyNumstat(commits []Commit, numstat []string) int {
	byHash := map[string]*Commit{}
	for i := range commits {
		byHash[commits[i].Hash] = &commits[i]
	}

	var current *Commit
	total := 0

	for _, line := range numstat {
		line = strings.TrimSuffix(line, "\r")
		if line == "" {
			continue
		}

		fields := strings.Split(line, "\t")
		if len(fields) == 1 && isHex(fields[0]) {
			// Header-Zeile: exakter Commit-Hash
			if c, ok := byHash[fields[0]]; ok {
				current = c
			} else {
				current = nil
			}
			continue
		}

		// Datei-Zeile: "<added>\t<deleted>\t<path>"
		if current == nil || len(fields) < 3 {
			continue
		}
		added, err1 := strconv.Atoi(strings.TrimSpace(fields[0]))
		deleted, err2 := strconv.Atoi(strings.TrimSpace(fields[1]))
		if err1 == nil && err2 == nil {
			current.Insertions += added
			current.Deletions += deleted
			current.ChangedFiles++
			total++
		}
	}
	return total
}

// scanTrees durchläuft die Baum-Einträge aller Commits und sammelt
// gleichzeitig die Blob-Objekte (dedupliziert).
func scanTrees(repo string, commits []Commit) ([]TreeEntry, []Blob, error) {
	var entries []TreeEntry
	blobSeen := map[string]int64{}
	var blobs []Blob

	for _, c := range commits {
		lines, err := treeLines(repo, c.Hash)
		if err != nil {
			// Einzelner Commit darf fehlschlagen (z.B. bei --all-Referenzen,
			// die auf ältere Objekte zeigen)
			continue
		}
		fentry, ok := parseTreeLine(c.Hash, line)
			if !ok {
				continue
			}
			entries = append(entries, entry)

			if entry.Type == "blob" && isHex(entry.ObjectHash) {
				if _, seen := blobSeen[entry.ObjectHash]; !seen {
					blobSeen[entry.ObjectHash] = entry.Size
					blobs = append(blobs, Blob{Hash: entry.ObjectHash, Size: entry.Size
					blobs = append(blobs, Blob{Hash: entry.ObjectHash})
				}
			}
		}
	}
	return entries, blobs, nil
}

// fillBlobData liest Inhalte und Größen aller Blobs mit git cat-file --batch
// (eine einzige Verbindung, sehr effizient).
func fillBlobData(repo string, blobs []Blob) error {
	stdout, stdin, cmd, err := catFileBatch(repo)
	if err != nil {
		return err
	}
	deparseTreeLine parst eine Zeile von `git ls-tree -r -l`:
// "<mode> <type> <object> <size>\t<path>".
func parseTreeLine(commit, line string) (TreeEntry, bool) {
	line = strings.TrimSuffix(line, "\r")
	tab := strings.IndexByte(line, '\t')
	if tab < 0 {
		return TreeEntry{}, false
	}
	fields := strings.Fields(line[:tab])
	if len(fields) < 3 {
		return TreeEntry{}, false
	}
	entry := TreeEntry{
		CommitHash: commit,
		Mode:       fields[0],
		Type:       fields[1],
		ObjectHash: fields[2],
		Path:       line[tab+1:],
	}
	if len(fields) >= 4 && fields[3] != "-" {
		entry.Size, _ = strconv.ParseInt(fields[3], 10, 64)
	}
	return entry, true
}

// fillBlobData liest Inhalte und Größen aller Blobs mit git cat-file --batch
// (eine einzige Verbindung, sehr effizient).
func fillBlobData(repo string, blobs []Blob) error {
	reader, stdin, cmd, err := catFileBatch(repo)
	if err != nil {
		return err
	}
	defer func() {
		_ = stdin.Close()
		_, _ = cmd.Process.Wait()
	}()

	for i := range blobs {
		if blobs[i].Hash == "" {
			continue
		}
		if _, err := fmt.Fprintf(stdin, "%s\n", blobs[i].Hashds(header)
		if len(fields) >= 2 && fields[1] == "missing" {
			blobs[i].Data = nil
			continue
		}
		if len(fields) >= 3 {
			if sz, err := strconv.ParseInt(fields[2], 10, 64); err == nil {
				blobs[i].Size = sz
			}
		}
		blobs[i].Data = data
		blobs[i].IsText = blobIsText(data)
	}
	return nil
}
