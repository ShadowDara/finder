package filepkg

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// hashFile berechnet den SHA-256-Hash einer Datei.
func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// download lädt eine URL herunter und schreibt sie in den Zielpfad.
// Bei einem nicht-2xx-Status wird ein Fehler zurückgegeben.
func (m *Manager) download(ctx context.Context, url, target string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("filepkg: Request für %s: %w", url, err)
	}
	resp, err := m.client().Do(req)
	if err != nil {
		return fmt.Errorf("filepkg: Download %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("filepkg: Download %s: HTTP %s", url, resp.Status)
	}

	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return fmt.Errorf("filepkg: Verzeichnis für %s anlegen: %w", target, err)
	}

	out, err := os.Create(target)
	if err != nil {
		return fmt.Errorf("filepkg: Datei %s anlegen: %w", target, err)
	}
	defer out.Close()

	if _, err := io.Copy(out, resp.Body); err != nil {
		return fmt.Errorf("filepkg: Datei %s schreiben: %w", target, err)
	}
	return nil
}

// syncOne lädt eine einzelne Datei herunter, verifiziert optional
// den Hash und gibt den tatsächlichen Hash zurück.
func (m *Manager) syncOne(ctx context.Context, f File) (string, error) {
	if err := f.Validate(); err != nil {
		return "", err
	}
	if err := m.ensureDir(); err != nil {
		return "", err
	}
	target, err := m.TargetPath(f)
	if err != nil {
		return "", err
	}
	if err := m.download(ctx, f.URL, target); err != nil {
		return "", err
	}
	hash, err := hashFile(target)
	if err != nil {
		return "", fmt.Errorf("filepkg: Hash von %s: %w", target, err)
	}
	if f.SHA256 != "" && !strings.EqualFold(f.SHA256, hash) {
		_ = os.Remove(target)
		return "", fmt.Errorf("filepkg: Hash-Mismatch für %s: erwartet %s, erhalten %s", f.Name, f.SHA256, hash)
	}
	return hash, nil
}

// Sync lädt alle Dateien in der Lockfile herunter, verifiziert
// Hashes und schreibt eine aktualisierte Lockfile zurück (inkl.
// neu berechneter Hashes). Fehlt die Lockfile, passiert nichts.
func (m *Manager) Sync(ctx context.Context) (*Lockfile, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return nil, err
	}
	if len(lf.Files) == 0 {
		return lf, nil
	}
	if err := m.ensureDir(); err != nil {
		return nil, err
	}
	for i := range lf.Files {
		f := &lf.Files[i]
		hash, err := m.syncOne(ctx, *f)
		if err != nil {
			return lf, fmt.Errorf("filepkg: Sync %s: %w", f.Name, err)
		}
		f.SHA256 = hash
	}
	if err := m.SaveLock(lf); err != nil {
		return lf, err
	}
	return lf, nil
}

// Pull lädt genau eine Datei herunter. Wenn die Datei bereits
// existiert und der Hash aus der Lockfile stimmt, wird übersprungen.
// Der berechnete Hash wird in der Lockfile aktualisiert.
func (m *Manager) Pull(ctx context.Context, name string) (File, error) {
	lf, err := m.LoadLock()
	if err != nil {
		return File{}, err
	}
	f, ok := lf.Get(name)
	if !ok {
		return File{}, fmt.Errorf("filepkg: %q ist nicht in der Lockfile", name)
	}
	target, err := m.TargetPath(f)
	if err != nil {
		return File{}, err
	}
	if current, err := hashFile(target); err == nil && f.SHA256 != "" && strings.EqualFold(current, f.SHA256) {
		return f, nil // bereits aktuell
	}
	hash, err := m.syncOne(ctx, f)
	if err != nil {
		return f, err
	}
	if f.SHA256 != hash {
		f.SHA256 = hash
		lf.Upsert(f)
		if err := m.SaveLock(lf); err != nil {
			return f, err
		}
	}
	return f, nil
}
