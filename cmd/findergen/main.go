package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/shadowdara/finder/internal/config"
	"github.com/shadowdara/finder/internal/finderversion"
	"github.com/shadowdara/finder/internal/templates"
	"github.com/shadowdara/finder/pub/json5"
)

//go:embed frontend/***
var frontend embed.FS

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

func main() {
	argconf := parseCliArgs()

	fmt.Println("Run with help for more Infos")

	path, err := templates.GetCustomPath()
	if err != nil {
		log.Fatalln(err)
	}

	config := config.LoadConfig(path + "/" + "config.json5")

	PORT := argconf.port
	if PORT == 0 {
		PORT = config.Port
	}

	server := &http.Server{Addr: ":" + strconv.Itoa(PORT)}
	mux := http.NewServeMux()

	// Server Data
	mux.HandleFunc("/api/info", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(map[string]string{
			"version":   finderversion.Version,
			"buildtime": finderversion.BuildTime,
		})
	})

	mux.HandleFunc("/api/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})

		log.Println("Call /api/stop")
		log.Println("Stopping Server")

		go func() {
			if err := server.Shutdown(context.Background()); err != nil {
				log.Printf("failed to stop server: %v", err)
			}
		}()
	})

	mux.HandleFunc("/api/config", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(config); err != nil {
			log.Printf("failed to encode config response: %v", err)
		}
	})

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})
	})

	mux.HandleFunc("/api/template/create", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload struct {
			Name    string          `json:"name"`
			Content json.RawMessage `json:"content"`
		}

		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			log.Printf("template create: invalid JSON: %v", err)
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		if payload.Name == "" {
			http.Error(w, "Missing name", http.StatusBadRequest)
			return
		}

		if !strings.HasSuffix(payload.Name, ".json5") {
			payload.Name += ".json5"
		}

		if err := saveTemplate(payload.Name, string(payload.Content)); err != nil {
			log.Printf("template create: failed to save %q: %v", payload.Name, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)

		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
		})
	})

	mux.HandleFunc("/api/template/viewall", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
		if err != nil {
			http.Error(w, "Failed to load templates", http.StatusInternalServerError)
			return
		}

		builtin := make([]string, 0)
		custom := make([]string, 0)

		for _, name := range templateNames {
			if _, exists := userTemplates[name]; exists {
				custom = append(custom, name)
			} else {
				builtin = append(builtin, name)
			}
		}

		response := map[string]interface{}{
			"templates":     templateNames,
			"builtin":       builtin,
			"custom":        custom,
			"templatecount": len(templateNames),
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("failed to encode template response: %v", err)
		}
	})

	mux.HandleFunc("/api/template/load/all", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		templateNames, userTemplates, err := templates.LoadAllWithUserTemplates()
		if err != nil {
			http.Error(w, "Failed to load templates", http.StatusInternalServerError)
			return
		}

		builtin := make([]string, 0)
		custom := make([]string, 0)

		alltemplates := map[string]string{}
		allbuildinTemplates := map[string]string{}
		allcustomTemplates := map[string]string{}

		for _, name := range templateNames {
			if _, exists := userTemplates[name]; exists {

				custom = append(custom, name)
			} else {
				builtin = append(builtin, name)
			}
		}

		// Load every Buildin Template
		for _, name := range builtin {
			data, err := templates.JSONtemplateLoader(name)
			if err != nil {
				http.Error(w, "Template not found", http.StatusNotFound)
				return
			}

			normalized := json5.PreprocessJSON5(string(data))

			alltemplates[name] = normalized
			allbuildinTemplates[name] = normalized
		}

		// Load every Custom Template
		// load Custom Templates after wards
		for _, name := range custom {
			data, exists := userTemplates[name]
			if !exists {
				http.Error(w, "Template not found", http.StatusNotFound)
				return
			}

			normalized := json5.PreprocessJSON5(string(data))

			alltemplates[name] = normalized
			allcustomTemplates[name] = normalized
		}

		response := map[string]interface{}{
			"count_templates":         len(alltemplates),
			"count_buildin_templates": len(allbuildinTemplates),
			"count_custom_templates":  len(allcustomTemplates),
			"templates":               alltemplates,
			"builtin":                 allbuildinTemplates,
			"custom":                  allcustomTemplates,
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("failed to encode template response: %v", err)
		}
	})

	mux.HandleFunc("/api/template/load/custom", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		name := r.URL.Query().Get("name")
		if name == "" {
			http.Error(w, "Missing template name", http.StatusBadRequest)
			return
		}

		_, userTemplates, err := templates.LoadAllWithUserTemplates()
		if err != nil {
			http.Error(w, "Failed to load templates", http.StatusInternalServerError)
			return
		}

		data, exists := userTemplates[name]
		if !exists {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}

		writeTemplateJSON(w, name, "custom", data)
	})

	mux.HandleFunc("/api/template/load/builtin", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		name := r.URL.Query().Get("name")
		if name == "" {
			http.Error(w, "Missing template name", http.StatusBadRequest)
			return
		}

		data, err := templates.JSONtemplateLoader(name)
		if err != nil {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}

		writeTemplateJSON(w, name, "builtin", data)
	})

	// Embedded frontend
	staticFS, err := fs.Sub(frontend, "frontend")
	if err != nil {
		log.Fatal(err)
	}

	mux.Handle("/", http.FileServer(http.FS(staticFS)))

	log.Println("Server listening on :" + strconv.Itoa(PORT))

	handler := corsMiddleware(loggingMiddleware(mux))

	server.Handler = handler
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
