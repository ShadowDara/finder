# Dockerfile für die statische Template-Site (npm/site)
# Reiner pnpm-workspace Build — serviert nur statische Dateien auf Port 3016

# ---- Build-Stage ----
FROM node:22-alpine AS builder

RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY npm/site/package.json ./npm/site/package.json
COPY npm/finder-lib/package.json ./npm/finder-lib/package.json
COPY npm/hub/package.json ./npm/hub/package.json
COPY npm/vfs/package.json ./npm/vfs/package.json
COPY npm/finder-npm/package.json ./npm/finder-npm/package.json
COPY npm/pages-plugin/package.json ./npm/pages-plugin/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Statischer Root-Build (base: "./", outDir: "dist")
RUN pnpm --filter finder-template-generator build:staticroot

# ---- Runtime-Stage ----
FROM nginx:alpine

# Vite-Build-Output nach nginx kopieren (nur statische Dateien, kein Proxy)
COPY --from=builder /app/npm/site/dist /usr/share/nginx/html

COPY docker/static-site/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3016
