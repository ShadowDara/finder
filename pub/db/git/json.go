package gitdb

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// ExportJSON schreibt den Snapshot als JSON-Dateien in ein Verzeichnis.
// Bestehende Dateien werden überschrieben; fehlende Ordner angelegt.
func ExportJSON(dir string, data *RepoData) error {
	if dir == "" {
		return fmt.Errorf("gitdb: ExportJSON: leerer Pfad")
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("gitdb: ExportJSON: Verzeichnis: %w", err)
	}

	// Blobs-Verzeichnis für Inhalte vorbereiten
	if err := os.MkdirAll(filepath.Join(dir, "blobs"), 0o755); err != nil {
		return fmt.Errorf("gitdb: ExportJSON: blobs/: %w", err)
	}

	// repo.json
	if err := writeJSON(filepath.Join(dir, "repo.json"), data.Meta); err != nil {
		return err
	}

	// refs.json
	if err := writeJSON(filepath.Join(dir, "refs.json"), data.Refs); err != nil {
		return err
	}

	// commits.json
	if err := writeJSON(filepath.Join(dir, "commits.json"), data.Commits); err != nil {
		return err
	}

	// trees.json
	if err := writeJSON(filepath.Join(dir, "trees.json"), data.Trees); err != nil {
		return err
	}

	// blobs.json (nur Metadaten)
	blobMeta := make([]Blob, 0, len(data.Blobs))
	for _, b := range data.Blobs {
		blobMeta = append(blobMeta, Blob{Hash: b.Hash, Size: b.Size, IsText: b.IsText})
	}
	if err := writeJSON(filepath.Join(dir, "blobs.json"), blobMeta); err != nil {
		return err
	}

	// Blob-Inhalte als Einzeldateien schreiben
	for _, b := range data.Blobs {
		if b.Data == nil {
			continue
		}
		path := filepath.Join(dir, "blobs", b.Hash+".txt")
		if err := os.WriteFile(path, b.Data, 0o644); err != nil {
			return fmt.Errorf("gitdb: ExportJSON: Blob %s: %w", b.Hash, err)
		}
	}

	return nil
}

// writeJSON marshallt v und schreibt es mit Einrückung in die Datei.
func writeJSON(path string, v any) error {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Errorf("gitdb: ExportJSON: Marshal %s: %w", path, err)
	}
	b = append(b, '\n')
	if err := os.WriteFile(path, b, 0o644); err != nil {
		return fmt.Errorf("gitdb: ExportJSON: Schreiben %s: %w", path, err)
	}
	return nil
}
