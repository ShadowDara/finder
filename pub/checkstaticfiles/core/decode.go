package core

import (
    "encoding/base64"
    "encoding/json"
    "fmt"
    "os"
    "log"
    "path/filepath"
    "bytes"
    "compress/gzip"
    "io"
)

type EncodedFile struct {
    Path    string
    Content string // base64-kodierter Inhalt
}

var ExeDir string

func Main(data []byte, settings int) {
    // Pfad zum Binary (ausführbare Datei) ermitteln
    exePath, err := os.Executable()
    if err != nil {
        fmt.Errorf("unable to get executable path: %w", err)
    }

    ExeDir = filepath.Dir(exePath)

    // gzip-Daten entpacken
    r, err := gzip.NewReader(bytes.NewReader(data))
    if err != nil {
        panic(fmt.Errorf("error while creating the gzip Readers: %w", err))
    }
    defer r.Close()

    // Entpackte Daten lesen
    inhalt, err := io.ReadAll(r)
    if err != nil {
        panic(fmt.Errorf("error while the unpacked file: %w", err))
    }

    var files []EncodedFile
    err = json.Unmarshal(inhalt, &files)
    if err != nil {
        fmt.Println("error while parsing the JSON file:", err)
        return
    }

    for _, f := range files {
        err := decodeAndWriteFile(f, settings)
        if err != nil {
            fmt.Fprintf(os.Stderr, "error while writing %s: %v\n", f.Path, err)
        }
    }

    log.Println("Finished file checking and creating!")
}

func decodeAndWriteFile(f EncodedFile, settings int) error {
    // Zielpfad im Binary-Verzeichnis
    fullPath := filepath.Join(ExeDir, f.Path)

    var exist bool = false

    // Existenz prüfen
    _, err := os.Stat(fullPath);
    if err == nil {
        if (Checksettings(settings, 0)) {
            exist = true
        } else {
            log.Printf("Skipped existing file: %s\n", fullPath)
            return nil
        }
    } else if !os.IsNotExist(err) {
        return fmt.Errorf("error while checking file: %w", err)
    }

    // base64 dekodieren
    decoded, err := base64.StdEncoding.DecodeString(f.Content)
    if err != nil {
        return fmt.Errorf("error while decoding: %w", err)
    }

    // Ordnerstruktur erstellen
    dir := filepath.Dir(fullPath)
    err = os.MkdirAll(dir, 0755)
    if err != nil {
        return fmt.Errorf("error while creating folders: %w", err)
    }

    if (exist) {
        data, err := os.ReadFile(fullPath)
        if err != nil {
            return fmt.Errorf("error reading file: %w", err)
        }

        if bytes.Equal(data, decoded) {
            if bytes.Equal(data, decoded) {
                log.Printf("Content checked, skipping: %s\n", fullPath)
                return nil
            }
        }
    }

    // Datei schreiben
    err = os.WriteFile(fullPath, decoded, 0644)
    if err != nil {
        return fmt.Errorf("error while writing file: %w", err)
    }

    log.Printf("File created: %s\n", fullPath)
    return nil
}

// to check the settings
func Checksettings(settings int, bit int) bool {
    return (settings & (1 << bit)) != 0
}
