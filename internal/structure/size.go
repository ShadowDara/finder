// size.go defines size constraints for a template (field "size").
//
// Valid units (size_type): "B", "KB", "MB", "GB".
// A value of 0 means "no limit" (max) or "no minimum" (min).
package structure

// Size beschreibt eine Min-/Max-Größenbeschränkung mit eigener Einheit
// pro Grenze. Gilt entweder für eine einzelne Datei (Feld "size" in
// Datei-Constraints) oder für die Gesamtgröße eines Ordners (Feld
// "size" auf Template-Ebene, rekursiv berechnet).
type Size struct {
	Min           int    `json:"min,omitempty"`
	Max           int    `json:"max,omitempty"`
	Min_size_type string `json:"min_size_type,omitempty"`
	Max_size_type string `json:"max_size_type,omitempty"`
}

// NewSize liefert eine neue Größen-Constraint ohne Einschränkung
// (0 = unbegrenzt), Einheiten standardmäßig in Bytes.
func NewSize() Size {
	return Size{
		Min:           0,
		Max:           0,   // 0 für Max bedeutet „unbegrenzt”
		Min_size_type: "B", // für Bytes
		Max_size_type: "B", // für Bytes
	}
}
