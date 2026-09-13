# Dockerfile für die statische Template-Site (npm/site)
# Reiner Vite/Node-Build ohne Backend — serviert nur statische Dateien auf Port 3016

# ---- Build-Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# package.json und Lockfile zuerst für besseren Docker-Cache
COPY npm/site/package.json npm/site/package-lock.json ./

RUN npm ci

COPY npm/site/ .

# Statischer Root-Build (base: "./", outDir: "dist")
RUN npm run build:staticroot

# ---- Runtime-Stage ----
FROM nginx:alpine

# Vite-Build-Output nach nginx kopieren (nur statische Dateien, kein Proxy)
COPY --from=builder /app/dist /usr/share/nginx/html

COPY docker/static-site/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3016
