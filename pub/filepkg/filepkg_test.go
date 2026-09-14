package filepkg

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// newTestServer liefert einen HTTP-Testserver, der für jede URL
// den Inhalt "hello world\n" ausliefert.
func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hello world\n"))
	}))
}

// setup erzeugt ein temporäres Verzeichnis und einen Manager.
func setup(t *testing.T) (*Manager, string) {
	t.Helper()
	dir := t.TempDir()
	m := New(filepath.Join(dir, "vendor"), filepath.Join(dir, "filepkg.lock.json"))
	return m, dir
}

func TestAddAndLock(t *testing.T) {
	m, _ := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	err := m.Add(File{Name: "hello.txt", URL: srv.URL + "/hello.txt"})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}

	lf, err := m.LoadLock()
	if err != nil {
		t.Fatalf("LoadLock: %v", err)
	}
	if len(lf.Files) != 1 {
		t.Fatalf("erwartete 1 Datei, habe %d", len(lf.Files))
	}
	if lf.Files[0].Name != "hello.txt" {
		t.Fatalf("falscher Name: %q", lf.Files[0].Name)
	}
}

func TestPullDownloadAndHash(t *testing.T) {
	m, _ := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	// Zuerst ohne Hash adden und pullen → Hash wird ergänzt.
	err := m.Add(File{Name: "hello.txt", URL: srv.URL + "/hello.txt"})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}
	f, err := m.Pull(context.Background(), "hello.txt")
	if err != nil {
		t.Fatalf("Pull: %v", err)
	}
	if f.SHA256 == "" {
		t.Fatal("Hash wurde nicht berechnet")
	}

	target, _ := m.TargetPath(f)
	data, err := os.ReadFile(target)
	if err != nil {
		t.Fatalf("Datei lesen: %v", err)
	}
	if string(data) != "hello world\n" {
		t.Fatalf("Inhalt falsch: %q", string(data))
	}

	// Hash muss in der Lockfile stehen.
	lf, _ := m.LoadLock()
	if lf.Files[0].SHA256 != f.SHA256 {
		t.Fatalf("Hash nicht gespeichert: %q != %q", lf.Files[0].SHA256, f.SHA256)
	}
}

func TestSync(t *testing.T) {
	m, _ := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	err := m.Add(File{Name: "a.txt", URL: srv.URL + "/a.txt"})
	if err != nil {
		t.Fatalf("Add a: %v", err)
	}
	err = m.Add(File{Name: "b.txt", URL: srv.URL + "/b.txt"})
	if err != nil {
		t.Fatalf("Add b: %v", err)
	}

	lf, err := m.Sync(context.Background())
	if err != nil {
		t.Fatalf("Sync: %v", err)
	}
	if len(lf.Files) != 2 {
		t.Fatalf("erwartete 2 Dateien, habe %d", len(lf.Files))
	}
	for _, f := range lf.Files {
		if f.SHA256 == "" {
			t.Fatalf("kein Hash für %s", f.Name)
		}
	}
}

func TestPullSkipsWhenCurrent(t *testing.T) {
	m, _ := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	m.Add(File{Name: "hello.txt", URL: srv.URL + "/hello.txt"})
	f, err := m.Pull(context.Background(), "hello.txt")
	if err != nil {
		t.Fatalf("Pull: %v", err)
	}
	if f.SHA256 == "" {
		t.Fatal("Hash fehlt")
	}

	// Zweiter Pull ist ein No-Op, da Datei aktuell ist.
	requests := 0
	srv.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		t.Error("zweiter Pull sollte nicht herunterladen")
	})
	_, err = m.Pull(context.Background(), "hello.txt")
	if err != nil {
		t.Fatalf("Pull 2: %v", err)
	}
	_ = requests
}

func TestHashMismatchFailsAndRemoves(t *testing.T) {
	m, _ := setup(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("other content\n"))
	}))
	defer srv.Close()

	err := m.Add(File{Name: "x.txt", URL: srv.URL + "/x.txt", SHA256: strings.Repeat("0", 64)})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}

	_, err = m.Pull(context.Background(), "x.txt")
	if err == nil {
		t.Fatal("Hash-Mismatch sollte Fehler liefern")
	}

	target, _ := m.TargetPath(File{Name: "x.txt"})
	if _, statErr := os.Stat(target); statErr == nil {
		t.Fatal("Datei sollte nach Mismatch entfernt sein")
	}
}

func TestCheckStatuses(t *testing.T) {
	m, dir := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	err := m.Add(File{Name: "a.txt", URL: srv.URL + "/a.txt", SHA256: strings.Repeat("a", 64)})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}
	err = m.Add(File{Name: "b.txt", URL: srv.URL + "/b.txt"})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}

	// a.txt fehlt → missing; b.txt existiert nicht → missing, nohash
	results, err := m.Check()
	if err != nil {
		t.Fatalf("Check: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("erwartete 2 Ergebnisse, habe %d", len(results))
	}
	status := map[string]Status{}
	for _, res := range results {
		status[res.File.Name] = res.Status
	}
	if status["a.txt"] != StatusMissing {
		t.Fatalf("a.txt sollte missing sein, ist %s", status["a.txt"])
	}

	// Jetzt Dateien anlegen: a.txt hat falschen Hash → outdated; b.txt hat keinen Hash → nohash
	os.MkdirAll(filepath.Join(dir, "vendor"), 0o755)
	os.WriteFile(filepath.Join(dir, "vendor", "a.txt"), []byte("wrong"), 0o644)
	os.WriteFile(filepath.Join(dir, "vendor", "b.txt"), []byte("hello world\n"), 0o644)
	results, err = m.Check()
	if err != nil {
		t.Fatalf("Check 2: %v", err)
	}
	status = map[string]Status{}
	for _, res := range results {
		status[res.File.Name] = res.Status
	}
	if status["a.txt"] != StatusOutdated {
		t.Fatalf("a.txt sollte outdated sein, ist %s", status["a.txt"])
	}
	if status["b.txt"] != StatusNoHash {
		t.Fatalf("b.txt sollte nohash sein, ist %s", status["b.txt"])
	}
}

func TestDiff(t *testing.T) {
	m, dir := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	err := m.Add(File{Name: "a.txt", URL: srv.URL + "/a.txt", SHA256: strings.Repeat("a", 64)})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}
	err = m.Add(File{Name: "b.txt", URL: srv.URL + "/b.txt", SHA256: "b"})
	if err != nil {
		t.Fatalf("Add: %v", err)
	}
	os.MkdirAll(filepath.Join(dir, "vendor"), 0o755)
	os.WriteFile(filepath.Join(dir, "vendor", "a.txt"), []byte("wrong"), 0o644)
	os.WriteFile(filepath.Join(dir, "vendor", "b.txt"), []byte("hello world\n"), 0o644)
	os.WriteFile(filepath.Join(dir, "vendor", "orphan.txt"), []byte("x"), 0o644)

	d, err := m.Diff()
	if err != nil {
		t.Fatalf("Diff: %v", err)
	}
	if len(d.Missing) != 0 {
		t.Fatalf("Erwartete keine fehlenden, habe %v", d.Missing)
	}
	if len(d.Outdated) != 2 {
		t.Fatalf("Erwartete 2 outdated (%v), habe %d", d.Outdated, len(d.Outdated))
	}
	foundOrphan := false
	for _, o := range d.Orphaned {
		if o == "orphan.txt" {
			foundOrphan = true
		}
	}
	if !foundOrphan {
		t.Fatalf("orphan.txt fehlt in Orphaned: %v", d.Orphaned)
	}
}

func TestRemove(t *testing.T) {
	m, _ := setup(t)
	srv := newTestServer(t)
	defer srv.Close()

	m.Add(File{Name: "a.txt", URL: srv.URL + "/a.txt"})
	ok, err := m.Remove("a.txt")
	if err != nil || !ok {
		t.Fatalf("Remove: ok=%v err=%v", ok, err)
	}
	ok, err = m.Remove("a.txt")
	if err != nil || ok {
		t.Fatalf("Remove 2: ok=%v err=%v", ok, err)
	}
}

func TestNameValidation(t *testing.T) {
	m, _ := setup(t)
	if err := m.Add(File{Name: "", URL: "https://x"}); err == nil {
		t.Fatal("leerer Name sollte fehlschlagen")
	}
	if err := m.Add(File{Name: "../evil.txt", URL: "https://x"}); err == nil {
		t.Fatal("'..' im Namen sollte fehlschlagen")
	}
	if err := m.Add(File{Name: "ok.txt", URL: ""}); err == nil {
		t.Fatal("leere URL sollte fehlschlagen")
	}
}

func TestHTTPError(t *testing.T) {
	m, _ := setup(t)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	m.Add(File{Name: "x.txt", URL: srv.URL + "/notfound"})
	_, err := m.Pull(context.Background(), "x.txt")
	if err == nil {
		t.Fatal("404 sollte Fehler liefern")
	}
	if !strings.Contains(err.Error(), "404") {
		t.Fatalf("Fehler sollte Status enthalten: %v", err)
	}
}
