from http.server import HTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()


server = HTTPServer(("localhost", 8000), Handler)

try:
    print("Server läuft auf http://localhost:8000")
    print("Ctrl+C zum Beenden")
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer wird beendet...")
finally:
    server.server_close()
    print("Server beendet.")
