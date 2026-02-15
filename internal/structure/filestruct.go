package structure

import (
    "encoding/json"

	"fmt"
)

// For Existance Keyword
// required		muss existieren
// forbidden 	darf nicht existieren
// optional		wird ignoriert

type File struct {
    Name      string `json:"name"`
    Existence string `json:"existence,omitempty"`
}

type Files []File

func (f *Files) UnmarshalJSON(data []byte) error {
    // Versuch: alte Form ([]string)
    var oldFormat []string
    if err := json.Unmarshal(data, &oldFormat); err == nil {
        for _, name := range oldFormat {
            *f = append(*f, File{
                Name:      name,
                Existence: "required",
            })
        }
        return nil
    }

    // Versuch: neue Form ([]File)
    var newFormat []File
    if err := json.Unmarshal(data, &newFormat); err == nil {
        *f = newFormat
        return nil
    }

    return fmt.Errorf("invalid files format")
}

func (f *Files) Validate() error {
    seen := make(map[string]bool)

    for _, file := range *f {
        if seen[file.Name] {
            return fmt.Errorf("duplicate file entry: %s", file.Name)
        }
        seen[file.Name] = true
    }

    return nil
}
