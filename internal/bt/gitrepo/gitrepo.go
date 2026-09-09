package gitrepo

import (
	"archive/zip"
	"bufio"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

const archiveVersion = 1

type PackOptions struct {
	Root    string
	Output  string
	Encrypt bool
	Base64  bool
}

type RestoreOptions struct {
	Archive     string
	Destination string
	Decrypt     bool
}

type archiveMetadata struct {
	FormatVersion int    `json:"format_version"`
	Repository    string `json:"repository"`
	OriginalPath  string `json:"original_path"`
	GitType       string `json:"git_type"`
}

func PackInteractive() error {
	reader := bufio.NewReader(os.Stdin)
	root := prompt(reader, "Root (Git-Repository, leer = aktuelles Verzeichnis): ", ".")
	output := prompt(reader, "Ausgabe-Verzeichnis (leer = ./git-archives): ", "./git-archives")
	encrypt := prompt(reader, "Verschlüsseln? (y/n, default n): ", "n") == "y"
	useBase64 := prompt(reader, "Zusätzlich Base64? (y/n, default n): ", "n") == "y"

	return Pack(PackOptions{Root: root, Output: output, Encrypt: encrypt, Base64: useBase64})
}

func RestoreInteractive() error {
	reader := bufio.NewReader(os.Stdin)
	archive := prompt(reader, "Archiv-Pfad: ", "./git-archives")
	destination := prompt(reader, "Ziel-Verzeichnis: ", "")
	decrypt := prompt(reader, "Entschlüsseln? (y/n, default n): ", "n") == "y"

	return Restore(RestoreOptions{Archive: archive, Destination: destination, Decrypt: decrypt})
}

func prompt(reader *bufio.Reader, message, defaultValue string) string {
	fmt.Print(message)
	value, _ := reader.ReadString('\n')
	value = strings.TrimSpace(value)
	if value == "" {
		return defaultValue
	}
	return value
}

func Pack(options PackOptions) error {
	mainRepo, err := findMainGitRepo(options.Root)
	if err != nil {
		return err
	}

	outputDir, err := filepath.Abs(options.Output)
	if err != nil {
		return err
	}

	fmt.Printf("Main-Repository: %s\nAusgabe:          %s\n\n", mainRepo, outputDir)
	repositories, err := findNestedRepositories(mainRepo, outputDir)
	if err != nil {
		return err
	}
	if len(repositories) == 0 {
		fmt.Println("Keine verschachtelten Git-Repositories gefunden.")
		return nil
	}

	if options.Encrypt && !opensslAvailable() {
		return errors.New("openssl wurde nicht gefunden")
	}
	var password string
	if options.Encrypt {
		password, err = readPassword("Passwort: ")
		if err != nil {
			return err
		}
		confirmation, err := readPassword("Passwort wiederholen: ")
		if err != nil {
			return err
		}
		if password == "" || password != confirmation {
			return errors.New("Passwörter stimmen nicht überein oder sind leer")
		}
	}

	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return err
	}
	for _, repo := range repositories {
		relativeRepo, err := filepath.Rel(mainRepo, repo)
		if err != nil {
			return err
		}
		safeName := strings.ReplaceAll(filepath.ToSlash(relativeRepo), "/", "_")
		archivePath := filepath.Join(outputDir, safeName+".git.zip")
		if options.Encrypt {
			archivePath += ".enc"
		}
		if options.Base64 {
			archivePath += ".b64"
		}

		fmt.Printf("Packe: %s\n", relativeRepo)
		plain, err := os.CreateTemp("", "gitrepo-*.zip")
		if err != nil {
			return err
		}
		plainPath := plain.Name()
		plain.Close()
		defer os.Remove(plainPath)

		if err := zipGitDirectory(repo, plainPath); err != nil {
			return err
		}
		if err := writeArchive(plainPath, archivePath, options.Encrypt, options.Base64, password); err != nil {
			return err
		}
		info, err := os.Stat(archivePath)
		if err != nil {
			return err
		}
		fmt.Printf("  -> %s\n     %d Bytes\n\n", archivePath, info.Size())
	}
	fmt.Println("Fertig.")
	return nil
}

func Restore(options RestoreOptions) error {
	archive, err := filepath.Abs(options.Archive)
	if err != nil {
		return err
	}
	destination, err := filepath.Abs(options.Destination)
	if err != nil {
		return err
	}
	if _, err := os.Stat(archive); err != nil {
		return fmt.Errorf("Archiv nicht gefunden: %w", err)
	}

	current := archive
	temporary := []string{}
	defer func() {
		for _, path := range temporary {
			_ = os.Remove(path)
		}
	}()
	if strings.HasSuffix(archive, ".b64") {
		decoded, err := os.CreateTemp("", "gitrepo-decoded-*")
		if err != nil {
			return err
		}
		decoded.Close()
		temporary = append(temporary, decoded.Name())
		if err := decodeBase64(current, decoded.Name()); err != nil {
			return err
		}
		current = decoded.Name()
	}
	if strings.Contains(filepath.Base(archive), ".enc") || options.Decrypt {
		if !opensslAvailable() {
			return errors.New("openssl wurde nicht gefunden")
		}
		password, err := readPassword("Passwort: ")
		if err != nil {
			return err
		}
		decrypted, err := os.CreateTemp("", "gitrepo-decrypted-*")
		if err != nil {
			return err
		}
		decrypted.Close()
		temporary = append(temporary, decrypted.Name())
		if err := decryptFile(current, decrypted.Name(), password); err != nil {
			return err
		}
		current = decrypted.Name()
	}

	if err := restoreZip(current, destination); err != nil {
		return err
	}
	fmt.Println("Restore abgeschlossen.")
	return nil
}

func findMainGitRepo(path string) (string, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	command := exec.Command("git", "-C", absolute, "rev-parse", "--show-toplevel")
	output, err := command.Output()
	if err != nil {
		return "", fmt.Errorf("%s ist kein Git-Repository", absolute)
	}
	return filepath.Abs(strings.TrimSpace(string(output)))
}

func findNestedRepositories(mainRepo, outputDir string) ([]string, error) {
	var repositories []string
	err := filepath.Walk(mainRepo, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if path == filepath.Join(mainRepo, ".git") || path == outputDir || strings.HasPrefix(path, outputDir+string(os.PathSeparator)) {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if info.IsDir() && path != mainRepo && isGitRepository(path) {
			repositories = append(repositories, path)
			return filepath.SkipDir
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(repositories)
	return repositories, nil
}

func isGitRepository(path string) bool {
	gitPath := filepath.Join(path, ".git")
	info, err := os.Stat(gitPath)
	if err == nil && info.IsDir() {
		return true
	}
	data, err := os.ReadFile(gitPath)
	return err == nil && bytes.HasPrefix(data, []byte("gitdir:"))
}

func zipGitDirectory(repo, archive string) error {
	gitPath := filepath.Join(repo, ".git")
	info, err := os.Stat(gitPath)
	if err != nil {
		return fmt.Errorf("kein .git gefunden: %s", repo)
	}
	file, err := os.Create(archive)
	if err != nil {
		return err
	}
	defer file.Close()
	writer := zip.NewWriter(file)
	metadata := archiveMetadata{archiveVersion, filepath.Base(repo), repo, "file"}
	if info.IsDir() {
		metadata.GitType = "directory"
	}
	metadataData, _ := json.MarshalIndent(metadata, "", "  ")
	metadataWriter, err := writer.Create("gitpack.json")
	if err != nil {
		return err
	}
	if _, err := metadataWriter.Write(metadataData); err != nil {
		return err
	}
	if info.IsDir() {
		err = filepath.Walk(gitPath, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return err
			}
			relative, err := filepath.Rel(repo, path)
			if err != nil {
				return err
			}
			entry, err := writer.Create(filepath.ToSlash(relative))
			if err != nil {
				return err
			}
			input, err := os.Open(path)
			if err != nil {
				return err
			}
			defer input.Close()
			_, err = io.Copy(entry, input)
			return err
		})
	} else {
		entry, createErr := writer.Create(".git")
		if createErr != nil {
			return createErr
		}
		input, openErr := os.Open(gitPath)
		if openErr != nil {
			return openErr
		}
		_, err = io.Copy(entry, input)
		input.Close()
	}
	if err != nil {
		return err
	}
	return writer.Close()
}

func writeArchive(source, destination string, encrypt, useBase64 bool, password string) error {
	current := source
	temporary := ""
	defer func() {
		if temporary != "" {
			_ = os.Remove(temporary)
		}
	}()
	if encrypt {
		file, err := os.CreateTemp("", "gitrepo-encrypted-*")
		if err != nil {
			return err
		}
		file.Close()
		temporary = file.Name()
		if err := encryptFile(current, temporary, password); err != nil {
			return err
		}
		current = temporary
	}
	if useBase64 {
		input, err := os.Open(current)
		if err != nil {
			return err
		}
		output, err := os.Create(destination)
		if err != nil {
			input.Close()
			return err
		}
		encoder := base64.NewEncoder(base64.StdEncoding, output)
		_, copyErr := io.Copy(encoder, input)
		closeErr := encoder.Close()
		input.Close()
		output.Close()
		if copyErr != nil {
			return copyErr
		}
		return closeErr
	}
	input, err := os.Open(current)
	if err != nil {
		return err
	}
	output, err := os.Create(destination)
	if err != nil {
		input.Close()
		return err
	}
	_, copyErr := io.Copy(output, input)
	input.Close()
	closeErr := output.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func decodeBase64(source, destination string) error {
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	output, err := os.Create(destination)
	if err != nil {
		return err
	}
	decoder := base64.NewDecoder(base64.StdEncoding, input)
	_, copyErr := io.Copy(output, decoder)
	closeErr := output.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func restoreZip(archive, destination string) error {
	reader, err := zip.OpenReader(archive)
	if err != nil {
		return errors.New("die Datei ist kein gültiges ZIP-Archiv")
	}
	defer reader.Close()
	if err := os.MkdirAll(destination, 0755); err != nil {
		return err
	}
	for _, file := range reader.File {
		if file.Name == "" {
			return fmt.Errorf("unsicherer ZIP-Pfad erkannt: %s", file.Name)
		}
		entryPath := filepath.Clean(filepath.FromSlash(file.Name))
		if entryPath == "." || entryPath == ".." ||
			strings.HasPrefix(entryPath, ".."+string(os.PathSeparator)) ||
			strings.Contains(entryPath, string(os.PathSeparator)+".."+string(os.PathSeparator)) ||
			strings.HasSuffix(entryPath, string(os.PathSeparator)+"..") ||
			filepath.IsAbs(entryPath) ||
			filepath.VolumeName(entryPath) != "" {
			return fmt.Errorf("unsicherer ZIP-Pfad erkannt: %s", file.Name)
		}
		target := filepath.Join(destination, entryPath)
		resolved, err := filepath.Abs(target)
		if err != nil {
			return err
		}
		root, _ := filepath.Abs(destination)
		if resolved != root && !strings.HasPrefix(resolved, root+string(os.PathSeparator)) {
			return fmt.Errorf("unsicherer ZIP-Pfad erkannt: %s", file.Name)
		}
		if file.Name == "gitpack.json" {
			continue
		}
		if err := os.MkdirAll(filepath.Dir(resolved), 0755); err != nil {
			return err
		}
		input, err := file.Open()
		if err != nil {
			return err
		}
		output, err := os.Create(resolved)
		if err != nil {
			input.Close()
			return err
		}
		_, copyErr := io.Copy(output, input)
		input.Close()
		output.Close()
		if copyErr != nil {
			return copyErr
		}
	}
	return nil
}

func opensslAvailable() bool {
	_, err := exec.LookPath("openssl")
	return err == nil
}

func readPassword(message string) (string, error) {
	fmt.Print(message)
	reader := bufio.NewReader(os.Stdin)
	password, err := reader.ReadString('\n')
	return strings.TrimSpace(password), err
}

func encryptFile(source, destination, password string) error {
	return runOpenSSL([]string{"enc", "-aes-256-cbc", "-pbkdf2", "-iter", "200000", "-salt", "-in", source, "-out", destination}, password)
}

func decryptFile(source, destination, password string) error {
	return runOpenSSL([]string{"enc", "-d", "-aes-256-cbc", "-pbkdf2", "-iter", "200000", "-in", source, "-out", destination}, password)
}

func runOpenSSL(arguments []string, password string) error {
	command := exec.Command("openssl", arguments...)
	command.Stdin = strings.NewReader(password + "\n")
	var stderr bytes.Buffer
	command.Stderr = &stderr
	if err := command.Run(); err != nil {
		return fmt.Errorf("OpenSSL fehlgeschlagen: %s", strings.TrimSpace(stderr.String()))
	}
	return nil
}
