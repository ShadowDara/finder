package structure

type Size struct {
	Min           int    `json:"min,omitempty"`
	Max           int    `json:"max,omitempty"`
	Min_size_type string `json:"min_size_type,omitempty"`
	Max_size_type string `json:"max_size_type,omitempty"`
}

// Function to get a new Filesize
func NewSize() Size {
	return Size{
		Min:           0,
		Max:           0,   // Zero for max means Infinite
		Min_size_type: "B", // for Bytes
		Max_size_type: "B", // for Bytes
	}
}
