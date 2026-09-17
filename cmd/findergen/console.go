package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// PTY is the interface for a pseudo-terminal on any platform.
type PTY interface {
	io.ReadWriteCloser
	Resize(cols, rows int) error
}

// ConsoleSession represents one pending or active terminal session.
type ConsoleSession struct {
	ID        string
	Code      string
	Token     string
	Verified  bool
	CreatedAt time.Time
}

var (
	consoleSessions   = make(map[string]*ConsoleSession)
	consoleSessionsMu sync.RWMutex

	consoleUpgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

const (
	consoleAuthCodeLen  = 6
	consoleTokenLen     = 32
	consoleSessionIDLen = 16
	consoleSessionTTL   = 5 * time.Minute
)

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func consoleRandomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func consoleAuthCode() string {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	code := int64(0)
	for _, v := range b {
		code = code*256 + int64(v)
	}
	code = code % 1000000
	return fmt.Sprintf("%06d", code)
}

func consoleCleanExpired() {
	now := time.Now()
	for id, s := range consoleSessions {
		if now.Sub(s.CreatedAt) > consoleSessionTTL && !s.Verified {
			delete(consoleSessions, id)
		}
	}
}

// ---------------------------------------------------------------------------
// POST /api/console/start
// ---------------------------------------------------------------------------

func handleConsoleStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	consoleSessionsMu.Lock()
	defer consoleSessionsMu.Unlock()

	consoleCleanExpired()

	id := consoleRandomHex(consoleSessionIDLen)
	code := consoleAuthCode()
	token := consoleRandomHex(consoleTokenLen)

	consoleSessions[id] = &ConsoleSession{
		ID:        id,
		Code:      code,
		Token:     token,
		CreatedAt: time.Now(),
	}

	fmt.Printf("\n╔══════════════════════════════════════╗\n")
	fmt.Printf("║  Console Auth Code                   ║\n")
	fmt.Printf("║  Session: %s              ║\n", id)
	fmt.Printf("║  Code:    %s                       ║\n", code)
	fmt.Printf("╚══════════════════════════════════════╝\n\n")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"session_id": id,
	})
}

// ---------------------------------------------------------------------------
// POST /api/console/verify
// ---------------------------------------------------------------------------

func handleConsoleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		SessionID string `json:"session_id"`
		Code      string `json:"code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	consoleSessionsMu.Lock()
	defer consoleSessionsMu.Unlock()

	consoleCleanExpired()

	s, ok := consoleSessions[payload.SessionID]
	if !ok {
		http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
		return
	}

	if s.Verified {
		http.Error(w, "Session already used", http.StatusUnauthorized)
		return
	}

	if time.Since(s.CreatedAt) > consoleSessionTTL {
		delete(consoleSessions, payload.SessionID)
		http.Error(w, "Session expired", http.StatusUnauthorized)
		return
	}

	if s.Code != payload.Code {
		http.Error(w, "Invalid code", http.StatusUnauthorized)
		return
	}

	s.Verified = true
	token := s.Token

	log.Printf("[Console] Session %s verified", s.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

// ---------------------------------------------------------------------------
// GET /api/console/ws?token=...
// ---------------------------------------------------------------------------

func handleConsoleWS(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	// Verify token
	consoleSessionsMu.RLock()
	var session *ConsoleSession
	for _, s := range consoleSessions {
		if s.Token == token && s.Verified {
			session = s
			break
		}
	}
	consoleSessionsMu.RUnlock()

	if session == nil {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	conn, err := consoleUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[Console] WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Remove session so the token can't be reused
	consoleSessionsMu.Lock()
	delete(consoleSessions, session.ID)
	consoleSessionsMu.Unlock()

	log.Printf("[Console] Session %s – starting PTY", session.ID)

	// Start the platform-specific PTY (see pty_windows.go / pty_unix.go)
	pty, err := startPTY("powershell.exe", 120, 30)
	if err != nil {
		log.Printf("[Console] Failed to start PTY: %v", err)
		conn.WriteJSON(map[string]string{"type": "error", "data": err.Error()})
		return
	}
	defer pty.Close()

	// PTY → WebSocket
	ptyDone := make(chan struct{})
	go func() {
		defer close(ptyDone)
		buf := make([]byte, 8192)
		for {
			n, rErr := pty.Read(buf)
			if n > 0 {
				// Send as base64 so arbitrary bytes survive JSON round-trips
				if wErr := conn.WriteJSON(map[string]string{
					"type": "output",
					"data": base64.StdEncoding.EncodeToString(buf[:n]),
				}); wErr != nil {
					return
				}
			}
			if rErr != nil {
				return
			}
		}
	}()

	// WebSocket → PTY
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg struct {
			Type string `json:"type"`
			Data string `json:"data,omitempty"`
			Cols int    `json:"cols,omitempty"`
			Rows int    `json:"rows,omitempty"`
		}

		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "input":
			pty.Write([]byte(msg.Data))
		case "resize":
			if msg.Cols > 0 && msg.Rows > 0 {
				pty.Resize(msg.Cols, msg.Rows)
			}
		}
	}

	<-ptyDone
	log.Printf("[Console] Session %s – PTY closed", session.ID)
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

func registerConsoleRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/console/start", handleConsoleStart)
	mux.HandleFunc("/api/console/verify", handleConsoleVerify)
	mux.HandleFunc("/api/console/ws", handleConsoleWS)
}
