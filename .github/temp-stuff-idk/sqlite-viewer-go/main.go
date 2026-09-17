package main

import (
	"database/sql"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

//go:embed web/*
var embeddedFiles embed.FS

type App struct {
	db       *sql.DB
	readOnly bool
}

type TableInfo struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type ColumnInfo struct {
	CID          int    `json:"cid"`
	Name         string `json:"name"`
	Type         string `json:"type"`
	NotNull      bool   `json:"notNull"`
	DefaultValue any    `json:"defaultValue"`
	PrimaryKey   bool   `json:"primaryKey"`
}

type RowsResponse struct {
	Table      string         `json:"table"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
	Total      int            `json:"total"`
	Columns    []string       `json:"columns"`
	Rows       [][]any        `json:"rows"`
}

type QueryRequest struct {
	SQL string `json:"sql"`
}

type QueryResponse struct {
	Columns []string `json:"columns,omitempty"`
	Rows    [][]any  `json:"rows,omitempty"`
	Message string   `json:"message,omitempty"`
}

func main() {
	dbPath := flag.String("db", "./database.db", "SQLite database path")
	addr := flag.String("addr", ":8080", "HTTP listen address")
	readOnly := flag.Bool("readonly", true, "Allow only read-only SQL")
	flag.Parse()

	db, err := sql.Open("sqlite", *dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("database: %v", err)
	}

	app := &App{db: db, readOnly: *readOnly}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/tables", app.tables)
	mux.HandleFunc("/api/tables/", app.tableRoutes)
	mux.HandleFunc("/api/query", app.query)
	mux.Handle("/", app.frontend())

	server := &http.Server{
		Addr:              *addr,
		Handler:           logging(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("SQLite Viewer: http://localhost%s", *addr)
	log.Printf("DB: %s | readonly=%v", *dbPath, *readOnly)
	log.Fatal(server.ListenAndServe())
}

func (a *App) tables(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	rows, err := a.db.Query(`
		SELECT name, type
		FROM sqlite_master
		WHERE type IN ('table', 'view')
		  AND name NOT LIKE 'sqlite_%'
		ORDER BY name
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var result []TableInfo
	for rows.Next() {
		var t TableInfo
		if err := rows.Scan(&t.Name, &t.Type); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		result = append(result, t)
	}

	writeJSON(w, result)
}

func (a *App) tableRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/tables/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) < 1 || parts[0] == "" {
		writeError(w, http.StatusNotFound, "table not found")
		return
	}

	tableName, err := url.PathUnescape(parts[0])
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid table name")
		return
	}

	switch {
	case len(parts) == 1 && r.Method == http.MethodGet:
		a.tableInfo(w, r, tableName)
	case len(parts) == 2 && parts[1] == "rows" && r.Method == http.MethodGet:
		a.tableRows(w, r, tableName)
	default:
		writeError(w, http.StatusNotFound, "not found")
	}
}

func (a *App) tableInfo(w http.ResponseWriter, _ *http.Request, tableName string) {
	if err := validateIdentifier(tableName); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var exists int
	if err := a.db.QueryRow(
		`SELECT count(*) FROM sqlite_master WHERE (type='table' OR type='view') AND name=?`,
		tableName,
	).Scan(&exists); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if exists == 0 {
		writeError(w, http.StatusNotFound, "table not found")
		return
	}

	rows, err := a.db.Query(`PRAGMA table_info(` + quoteIdentifier(tableName) + `)`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var columns []ColumnInfo
	for rows.Next() {
		var c ColumnInfo
		var notNull int
		var pk int
		var d sql.NullString

		if err := rows.Scan(&c.CID, &c.Name, &c.Type, &notNull, &d, &pk); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		c.NotNull = notNull != 0
		c.PrimaryKey = pk != 0
		if d.Valid {
			c.DefaultValue = d.String
		}
		columns = append(columns, c)
	}

	writeJSON(w, map[string]any{
		"name":    tableName,
		"columns": columns,
	})
}

func (a *App) tableRows(w http.ResponseWriter, r *http.Request, tableName string) {
	if err := validateIdentifier(tableName); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	page := intQuery(r, "page", 1)
	pageSize := intQuery(r, "pageSize", 50)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 500 {
		pageSize = 500
	}

	var total int
	countSQL := `SELECT count(*) FROM ` + quoteIdentifier(tableName)
	if err := a.db.QueryRow(countSQL).Scan(&total); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	offset := (page - 1) * pageSize
	dataSQL := `SELECT * FROM ` + quoteIdentifier(tableName) +
		` LIMIT ? OFFSET ?`

	rows, err := a.db.Query(dataSQL, pageSize, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := make([][]any, 0)
	for rows.Next() {
		values := make([]any, len(columns))
		dest := make([]any, len(columns))
		for i := range values {
			dest[i] = &values[i]
		}
		if err := rows.Scan(dest...); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		for i, v := range values {
			values[i] = normalizeValue(v)
		}
		result = append(result, values)
	}

	writeJSON(w, RowsResponse{
		Table:    tableName,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
		Columns:  columns,
		Rows:     result,
	})
}

func (a *App) query(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req QueryRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	sqlText := strings.TrimSpace(req.SQL)
	if sqlText == "" {
		writeError(w, http.StatusBadRequest, "SQL is empty")
		return
	}

	if err := validateSQL(sqlText, a.readOnly); err != nil {
		writeError(w, http.StatusForbidden, err.Error())
		return
	}

	// Query supports SELECT/PRAGMA/EXPLAIN and, in write mode, statements
	// whose result is still returned as a message.
	rows, err := a.db.Query(sqlText)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if len(columns) == 0 {
		writeJSON(w, QueryResponse{Message: "Query ausgeführt."})
		return
	}

	result := make([][]any, 0)
	for rows.Next() {
		values := make([]any, len(columns))
		dest := make([]any, len(columns))
		for i := range values {
			dest[i] = &values[i]
		}
		if err := rows.Scan(dest...); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		for i, v := range values {
			values[i] = normalizeValue(v)
		}
		result = append(result, values)
		if len(result) >= 5000 {
			break
		}
	}

	writeJSON(w, QueryResponse{
		Columns: columns,
		Rows:    result,
	})
}

func validateSQL(s string, readOnly bool) error {
	clean := strings.TrimSpace(strings.TrimSuffix(s, ";"))
	if strings.Contains(clean, ";") {
		return fmt.Errorf("mehrere SQL-Statements sind nicht erlaubt")
	}

	lower := strings.ToLower(clean)
	allowedRead := []string{"select", "pragma", "explain", "with"}
	for _, prefix := range allowedRead {
		if strings.HasPrefix(lower, prefix+" ") || lower == prefix {
			return nil
		}
	}

	if readOnly {
		return fmt.Errorf("read-only Modus: nur SELECT, WITH, PRAGMA und EXPLAIN sind erlaubt")
	}

	allowedWrite := []string{
		"insert", "update", "delete", "create", "alter", "drop",
		"replace", "vacuum", "reindex", "analyze",
	}
	for _, prefix := range allowedWrite {
		if strings.HasPrefix(lower, prefix+" ") || lower == prefix {
			return nil
		}
	}
	return fmt.Errorf("SQL-Statement ist nicht erlaubt")
}

func validateIdentifier(s string) error {
	if s == "" {
		return fmt.Errorf("empty identifier")
	}
	for _, r := range s {
		if !(r == '_' || r == '-' ||
			r >= 'a' && r <= 'z' ||
			r >= 'A' && r <= 'Z' ||
			r >= '0' && r <= '9') {
			return fmt.Errorf("invalid identifier")
		}
	}
	return nil
}

func quoteIdentifier(s string) string {
	return `"` + strings.ReplaceAll(s, `"`, `""`) + `"`
}

func normalizeValue(v any) any {
	switch x := v.(type) {
	case []byte:
		return string(x)
	default:
		return x
	}
}

func intQuery(r *http.Request, key string, fallback int) int {
	n, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return fallback
	}
	return n
}

func (a *App) frontend() http.Handler {
	sub, err := fs.Sub(embeddedFiles, "web")
	if err != nil {
		panic(err)
	}
	return http.FileServer(http.FS(sub))
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func init() {
	// Make accidental use of an invalid working directory easier to diagnose.
	if wd, err := os.Getwd(); err == nil {
		log.Printf("working directory: %s", wd)
	}
}
