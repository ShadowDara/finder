package gitdb

import (
	"encoding/json"
	"fmt"
	"time"
)

// ExportOptions steuert den Export eines Git-Repositorys.
type ExportOptions struct {
	// RepoPath ist der Pfad zum Git-Repository (Arbeitsverzeichnis oder
	// reines .git Verzeichnis). Bei einem Arbeitsverzeichnis wird es so
	// verwendet, wie es ist – die Git-CLI löst das auf. Leer bedeutet
	// aktuelles Verzeichnis.
	RepoPath string

	// SQLitePath: wenn nicht leer, wird eine SQLite-Datenbank mit diesem
	// Dateinamen erzeugt bzw. überschrieben.
	SQLitePath string

	// JSONDir: wenn nicht leer, werden die JSON-Dateien in dieses
	// Verzeichnis geschrieben (wird bei Bedarf angelegt).
	JSONDir string

	// WithBlobs: wenn true, werden die Inhalte aller Blobs mit exportiert.
	// Bei SQLite gzip-komprimiert in der Tabelle blobs, bei JSON als
	// Dateien unter <JSONDir>/blobs/<sha>.txt.
	WithBlobs bool

	// LimitCommits begrenzt die Anzahl der exportierten Commits (0 =
	// unbegrenzt). Sinnvoll für Tests und große Repositories.
	LimitCommits int
}

// Person ist ein Autor oder Committer eines Commits.
type Person struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	When  string `json:"when"` // RFC3339 (verlustfrei inkl. Zeitzone)
}

// Commit ist ein einzelner Commit des Repositories.
type Commit struct {
	Hash         string   `json:"hash"`
	Parents      []string `json:"parents"`
	Author       Person   `json:"author"`
	Committer    Person   `json:"committer"`
	Message      string   `json:"message"`
	Tree         string   `json:"tree"`
	ChangedFiles int      `json:"changed_files"` // Anzahl der Dateien im Baum
	Insertions   int      `json:"insertions"`    // Summe aus diff --numstat
	Deletions    int      `json:"deletions"`     // Summe aus diff --numstat
	Dirty        bool     `json:"dirty"`         // Commit ist nicht von einem Ref erreichbar
}

// Ref ist eine Referenz (branch, tag, remote, HEAD …).
type Ref struct {
	Name   string `json:"name"`
	Target string `json:"target"` // Ziel-Commit-Hash (peeled)
	Type   string `json:"type"`   // branch | tag | remote | other
}

// TreeEntry ist ein Eintrag im Dateibaum eines Commits.
type TreeEntry struct {
	CommitHash string `json:"commit"`
	Path       string `json:"path"`
	Mode       string `json:"mode"` // z.B. 100644, 100755, 120000, 040000
	Type       string `json:"type"` // blob | tree | commit (bei Submodules)
	ObjectHash string `json:"object"`
	Size       int64  `json:"size"` // Bytegröße (nur bei Blobs, sonst 0)
}

// Blob ist ein Blob-Objekt des Repositories.
type Blob struct {
	Hash   string `json:"hash"`
	Size   int64  `json:"size"` // Größe in Bytes
	Data   []byte `json:"-"`    // Inhalt (nur wenn WithBlobs)
	IsText bool   `json:"is_text"`
}

// RepoMeta beschreibt das gescannte Repository.
type RepoMeta struct {
	Path       string `json:"path"`
	RemoteURL  string `json:"remote_url"`
	Branch     string `json:"branch"` // aktueller HEAD
	GitVersion string `json:"git_version"`
	HashAlgo   string `json:"hash_algo"` // sha1 || sha256
	IsBare     bool   `json:"is_bare"`
}

// Report ist das Ergebnis eines Exports.
type Report struct {
	Meta       RepoMeta `json:"meta"`
	Commits    int      `json:"commits"`
	Refs       int      `json:"refs"`
	Trees      int      `json:"trees"`     // Anzahl der Baum-Einträge
	Blobs      int      `json:"blobs"`     // Anzahl der Blob-Objekte
	ByteSize   int64    `json:"byte_size"` // Summe der Blob-Größen
	Elapsed    string   `json:"elapsed"`   // Dauer als String
	SQLitePath string   `json:"sqlite_path,omitempty"`
	JSONDir    string   `json:"json_dir,omitempty"`
}

// Export extrahiert das Repository und schreibt alle angegebenen Ziele.
// mindestens eines von SQLitePath/JSONDir muss gesetzt sein.
func Export(opts ExportOptions) (*Report, error) {
	if opts.SQLitePath == "" && opts.JSONDir == "" {
		return nil, fmt.Errorf("gitdb: Export: weder SQLitePath noch JSONDir gesetzt")
	}

	start := time.Now()
	data, err := Snapshot(opts)
	if err != nil {
		return nil, err
	}

	var byteSize int64
	for _, b := range data.Blobs {
		byteSize += b.Size
	}

	var rep Report
	rep.Meta = data.Meta
	rep.Commits = len(data.Commits)
	rep.Refs = len(data.Refs)
	rep.Trees = len(data.Trees)
	rep.Blobs = len(data.Blobs)
	rep.ByteSize = byteSize
	rep.Elapsed = time.Since(start).String()

	if opts.SQLitePath != "" {
		if err := ExportSQLite(opts.SQLitePath, data); err != nil {
			return nil, err
		}
		rep.SQLitePath = opts.SQLitePath
	}

	if opts.JSONDir != "" {
		if err := ExportJSON(opts.JSONDir, data); err != nil {
			return nil, err
		}
		rep.JSONDir = opts.JSONDir
	}

	return &rep, nil
}

// String gibt eine kompakte, menschenlesbare Zusammenfassung zurück.
func (r *Report) String() string {
	b, _ := json.MarshalIndent(r, "", "  ")
	return string(b)
}
