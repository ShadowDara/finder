// Package filepkg ist eine kleine Library für dateibasiertes
// Package-Management: einzelne Dateien werden per URL gepullt,
// per SHA-256 verifiziert und in einer Lockfile nachverfolgt.
//
// Im Gegensatz zu klassischen Package-Managern (npm, go modules)
// arbeitet filepkg nicht mit Verzeichnissen, sondern mit einzelnen
// Dateien: jede Datei hat eine Quelle (URL) und ein Ziel (localer
// Name/relativer Pfad). Die Lockfile speichert Quelle, Ziel und
// Hash, sodass ein deterministisches "Installieren"/"Syncen"
// möglich ist.
//
// Beispiel:
//
//	m := filepkg.New("vendor", "filepkg.lock.json")
//	m.Add(filepkg.File{Name: "prettier.js", URL: "https://.../prettier.js"})
//	m.Sync(ctx) // lädt alle Dateien aus der Lockfile
package filepkg

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// LockfileVersion ist die aktuelle Version des Lockfile-Formats.
const LockfileVersion = 1

// File beschreibt eine einzelne zu verwaltende Datei.
// Der Name ist der lokale Dateiname (relativ zu Manager.Dir),
// die URL die Quelle, von der die Datei gepullt wird.
type File struct {
	// Name ist der lokale Dateiname bzw. relative Pfad unterhalb von Dir.
	Name string `json:"name"`
	// URL ist die Quelle, von der die Datei heruntergeladen wird.
	URL string `json:"url"`
	// SHA256 ist der erwartete Hash der Datei. Wenn gesetzt, wird
	// nach dem Download verifiziert — bei Abweichung wird die Datei
	// verworfen und ein Fehler zurückgegeben.
	SHA256 string `json:"sha256,omitempty"`
	// Version ist eine optionale, freie Versionsangabe.
	Version string `json:"version,omitempty"`
	// Tags sind optionale Kategorien.
	Tags []string `json:"tags,omitempty"`
}

// Validate prüft, ob die File-Angabe minimal sinnvoll ist.
func (f File) Validate() error {
	if strings.TrimSpace(f.Name) == "" {
		return fmt.Errorf("filepkg: Name darf nicht leer sein")
	}
	if strings.Contains(f.Name, "..") {
		return fmt.Errorf("filepkg: Name %q darf kein '..' enthalten", f.Name)
	}
	if strings.TrimSpace(f.URL) == "" {
		return fmt.Errorf("filepkg: URL für %q darf nicht leer sein", f.Name)
	}
	return nil
}

// Lockfile ist das auf der Platte gespeicherte Abbild aller
// verwalteten Dateien.
type Lockfile struct {
	Version int    `json:"version"`
	Files   []File `json:"files"`
}

// Get liefert das File mit dem Namen name, oder ok=false.
func (lf *Lockfile) Get(name string) (File, bool) {
	for _, f := range lf.Files {
		if f.Name == name {
			return f, true
		}
	}
	return File{}, false
}

// Has prüft, ob ein File mit dem Namen name existiert.
func (lf *Lockfile) Has(name string) bool {
	_, ok := lf.Get(name)
	return ok
}

// Upsert setzt ein File (überschreibt, wenn der Name existiert).
func (lf *Lockfile) Upsert(f File) {
	for i := range lf.Files {
		if lf.Files[i].Name == f.Name {
			lf.Files[i] = f
			return
		}
	}
	lf.Files = append(lf.Files, f)
}

// Remove entfernt ein File anhand des Namens.
func (lf *Lockfile) Remove(name string) bool {
	for i := range lf.Files {
		if lf.Files[i].Name == name {
			lf.Files = append(lf.Files[:i], lf.Files[i+1:]...)
			return true
		}
	}
	return false
}

// Manager ist der zentrale Einstiegspunkt der Library.
type Manager struct {
	// Dir ist das Verzeichnis, in das Dateien abgelegt werden.
	Dir string
	// LockPath ist der Pfad zur Lockfile.
	LockPath string
	// Client ist der HTTP-Client für Downloads. Wenn nil, wird
	// ein Default-Client mit Timeout verwendet.
	Client *http.Client

	// Sicherstellen, dass Dir beim ersten Zugriff existiert.
	ensureDirOnce bool
}

// New erzeugt einen Manager. Der Ordner für Dir wird bei Bedarf
// beim ersten Download angelegt.
func New(dir, lockPath string) *Manager {
	return &Manager{Dir: dir, LockPath: lockPath}
}

// DefaultClient liefert einen HTTP-Client mit Timeout.
func DefaultClient() *http.Client {
	return &http.Client{Timeout: 5 * time.Minute}
}

// client liefert den konfigurierten Client oder einen Default.
func (m *Manager) client() *http.Client {
	if m.Client != nil {
		return m.Client
	}
	return DefaultClient()
}

// ensureDir legt das Zielverzeichnis an, falls nötig.
func (m *Manager) ensureDir() error {
	if m.Dir == "" {
		return fmt.Errorf("filepkg: Manager.Dir ist nicht gesetzt")
	}
	if m.ensureDirOnce {
		_, err := os.Stat(m.Dir)
		if err == nil {
			return nil
		}
	}
	if err := os.MkdirAll(m.Dir, 0o755); err != nil {
		return fmt.Errorf("filepkg: Verzeichnis %s anlegen: %w", m.Dir, err)
	}
	m.ensureDirOnce = true
	return nil
}

// TargetPath liefert den absoluten Zielpfad für eine Datei.
func (m *Manager) TargetPath(f File) (string, error) {
	if err := f.Validate(); err != nil {
		return "", err
	}
	return filepath.Join(m.Dir, filepath.FromSlash(f.Name)), nil
}

// LoadLock liest die Lockfile ein. Fehlt die Datei, wird eine
// leere Lockfile (Version 1) zurückgegeben.
func (m *Manager) LoadLock() (*Lockfile, error) {
	data, err := os.ReadFile(m.LockPath)
	if os.IsNotExist(err) {
		return &Lockfile{Version: LockfileVersion}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("filepkg: Lockfile %s lesen: %w", m.LockPath, err)
	}
	var lf Lockfile
	if err := json.Unmarshal(data, &lf); err != nil {
		return nil, fmt.Errorf("filepkg: Lockfile %s parsen: %w", m.LockPath, err)
	}
	if lf.Version == 0 {
		lf.Version = LockfileVersion
	}
	return &lf, nil
}

// SaveLock schreibt die Lockfile atomar (Temp-Datei + Rename).
func (m *Manager) SaveLock(lf *Lockfile) error {
	if lf.Version == 0 {
		lf.Version = LockfileVersion
	}
	data, err := json.MarshalIndent(lf, "", "  ")
	if err != nil {
		return fmt.Errorf("filepkg: Lockfile serialisieren: %w", err)
	}
	tmp := m.LockPath + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return fmt.Errorf("filepkg: Lockfile %s schreiben: %w", tmp, err)
	}
	if err := os.Rename(tmp, m.LockPath); err != nil {
		return fmt.Errorf("filepkg: Lockfile %s verschieben: %w", m.LockPath, err)
	}
	return nil
}
