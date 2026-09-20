# Dockerfile für die Template-Site (npm/site)
# pnpm-workspace Build, serviert statische Dateien auf Port 3014

# ---- Build-Stage ----
FROM node:22-alpine AS builder

RUN corepack enable
WORKDIR /app

# Workspace-Root zuerst für besseren Docker-Cache (pnpm!)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY npm/site/package.json ./npm/site/package.json
COPY npm/finder-lib/package.json ./npm/finder-lib/package.json
COPY npm/hub/package.json ./npm/hub/package.json
COPY npm/vfs/package.json ./npm/vfs/package.json
COPY npm/finder-npm/package.json ./npm/finder-npm/package.json
COPY npm/pages-plugin/package.json ./npm/pages-plugin/package.json

# --ignore-scripts: hub's postinstall `prisma generate` would fail here
# (no prisma/schema.prisma in this image); uploadpage handles that separately.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Restlichen Quellcode kopieren (nach install für besseren Cache)
COPY . .

RUN pnpm --filter finder-template-generator docker:build

# ---- Runtime-Stage ----
FROM nginx:alpine

# Vite-Build-Output nach nginx kopieren
COPY --from=builder /app/npm/site/dist /usr/share/nginx/html
COPY docker/template-site/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3014
