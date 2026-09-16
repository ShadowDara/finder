package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/json5"
)

// Function to create a file
func saveTemplate(name string, content string) error {
	dir, err := templates.GetCustomTemplatePath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	filePath := filepath.Join(dir, name)
	return os.WriteFile(filePath, []byte(content), 0o644)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		log.Printf("%s %s", r.Method, r.URL.Path)

		next.ServeHTTP(w, r)

		log.Printf("%s %s - %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func writeTemplateJSON(w http.ResponseWriter, name string, source string, raw []byte) {
	w.Header().Set("Content-Type", "application/json")

	normalized := json5.PreprocessJSON5(string(raw))

	var templateData interface{}
	if err := json.Unmarshal([]byte(normalized), &templateData); err != nil {
		http.Error(w, "Invalid template JSON", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"status":   "ok",
		"name":     name,
		"source":   source,
		"template": templateData,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode template payload: %v", err)
	}
}
