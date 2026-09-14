package filepkg

import (
	"context"
	"fmt"
	"os"
	"strings"
)

// Status beschreibt den Zustand einer verwalteten Datei.
type Status string

const (
	// StatusCurrent bedeutet: Datei existiert und Hash stimmt.
	StatusCurrent Status = "current"
	// StatusMissing bedeutet: Datei fehlt auf der Platte.
	StatusMissing Status = "missing"
	// StatusOutdated bedeutet: Datei existiert, aber der Hash
	// weicht von der Lockfile ab.
	StatusOutdated Status = "outdated"
	// StatusNoHash bedeutet: kein Hash in der Lockfile hinterlegt
	// (kann nur aus der Lockfile geprüft werden).
	StatusNoHash Status = "nohash"
)

// CheckResult ist das Ergebnis einer Prüfung für eine einzelne Datei.
type CheckResult struct {
	File   File   `json:"file"`
	Status Status `json:"status"`
	// LocalHash ist der berechnete Hash der Datei auf der Platte
	// (leer, wenn die Datei fehlt).
	LocalHash string `json:"localHash,omitempty"`
	Err       error  `json:"-"`
}

// Check prüft alle Dateien der Lockfile gegen die Platte.
// Es wird nicht heruntergeladen — nur verglichen.
func (m *Manager) Check() ([]CheckResult, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return nil, err
	}
	results := make([]CheckResult, 0, len(lf.Files))
	for _, f := range lf.Files {
		var res CheckResult
		res.File = f
		target, err := m.TargetPath(f)
		if err != nil {
			res.Status = StatusMissing
			res.Err = err
			results = append(results, res)
			continue
		}
		hash, err := hashFile(target)
		if err != nil {
			res.Status = StatusMissing
			results = append(results, res)
			continue
		}
		res.LocalHash = hash
		switch {
		case f.SHA256 == "":
			res.Status = StatusNoHash
		case strings.EqualFold(f.SHA256, hash):
			res.Status = StatusCurrent
		default:
			res.Status = StatusOutdated
		}
		results = append(results, res)
	}
	return results, nil
}

// Verify prüft die Lockfile auf Integrität: jeder Eintrag braucht
// Name und URL; Doppelte Namen werden gemeldet. Außerdem wird
// geprüft, ob der Hash der Datei auf der Platte zum Eintrag passt.
func (m *Manager) Verify() error {
	lf, err := m.LoadLock()
	if err != nil {
		return err
	}
	seen := make(map[string]bool, len(lf.Files))
	for _, f := range lf.Files {
		if err := f.Validate(); err != nil {
			return err
		}
		if seen[f.Name] {
			return fmt.Errorf("filepkg: doppelter Name %q in Lockfile", f.Name)
		}
		seen[f.Name] = true
		if f.SHA256 != "" {
			target, err := m.TargetPath(f)
			if err != nil {
				return err
			}
			hash, err := hashFile(target)
			if err != nil {
				// Datei fehlt — das ist beim Verify kein Fehler,
				// sie wird beim Sync nachgeladen.
				continue
			}
			if !strings.EqualFold(f.SHA256, hash) {
				return fmt.Errorf("filepkg: %s: Hash-Mismatch (%s != %s)", f.Name, f.SHA256, hash)
			}
		}
	}
	return nil
}

// Diff vergleicht Lockfile und Festplatte und liefert Dateien, die
// fehlen, abweichen oder nur auf der Platte liegen.
type Diff struct {
	// Missing sind Dateien aus der Lockfile, die auf der Platte fehlen.
	Missing []File
	// Outdated sind Dateien, deren Hash auf der Platte abweicht.
	Outdated []File
	// Orphaned sind Dateien im Verzeichnis, die NICHT in der Lockfile stehen.
	Orphaned []string
}

// Diff berechnet die Unterschiede zwischen Lockfile und Platte.
func (m *Manager) Diff() (*Diff, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return nil, err
	}
	d := &Diff{}
	locked := make(map[string]bool, len(lf.Files))

	for _, f := range lf.Files {
		locked[f.Name] = true
		target, err := m.TargetPath(f)
		if err != nil {
			continue
		}
		hash, err := hashFile(target)
		if err != nil {
			d.Missing = append(d.Missing, f)
			continue
		}
		if f.SHA256 != "" && !strings.EqualFold(f.SHA256, hash) {
			d.Outdated = append(d.Outdated, f)
		}
	}

	// Nur Dateien im obersten Verzeichnis prüfen (kein rekursiver
	// Walk), damit Unterverzeichnisse der Lockfile nicht als
	// orphaned gemeldet werden.
	entries, err := os.ReadDir(m.Dir)
	if err != nil {
		if os.IsNotExist(err) {
			return d, nil
		}
		return nil, err
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if !locked[e.Name()] {
			d.Orphaned = append(d.Orphaned, e.Name())
		}
	}
	return d, nil
}

// Add fügt eine Datei zur Lockfile hinzu (ohne Download).
func (m *Manager) Add(f File) error {
	if err := f.Validate(); err != nil {
		return err
	}
	lf, err := m.LoadLock()
	if err != nil {
		return err
	}
	lf.Upsert(f)
	return m.SaveLock(lf)
}

// Remove entfernt eine Datei aus der Lockfile (ohne die Datei selbst
// zu löschen). Liefert false, wenn der Name nicht existierte.
func (m *Manager) Remove(name string) (bool, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return false, err
	}
	removed := lf.Remove(name)
	if !removed {
		return false, nil
	}
	return true, m.SaveLock(lf)
}

// Install installiert alle Dateien aus der Lockfile, auch wenn die
// Lockfile leer ist. Dies ist die deterministische "Direkt-Install"
// Variante: es wird immer ein Sync gemacht, unabhängig von lokalen
// Dateien.
func (m *Manager) Install(ctx context.Context) error {
	_, err := m.Sync(ctx)
	return err
}

// IsLocked prüft, ob eine Datei in der Lockfile steht.
func (m *Manager) IsLocked(name string) (bool, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return false, err
	}
	return lf.Has(name), nil
}
