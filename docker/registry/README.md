# Finder Template Registry (static)

Reiner HTTP-Container zum Herunterladen von Templates — kein Upload,
kein Backend, nur statische `templates/*.json5`.

- Start: `docker compose up -d registry`
- URL: `http://localhost:3017/<template>.json5`
- Sub-path (install-Ziel): `http://localhost:3017/<host>/<path>/template.json5`
- Build: `docker build -f docker/registry/Dockerfile -t finder-registry .`
- Healthcheck: `curl -I http://localhost:3017/go.json5`

Beispiel für `finder install`:

```sh
finder install http://localhost:3017/go.json5
finder install http://localhost:3017/shadowdara.github.io/test/template.json5
```
