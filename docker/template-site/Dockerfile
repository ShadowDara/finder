# Dockerfile für die Template-Site (finder-template-generator-ssg)
# Vite/Node-Build, serviert statische Dateien auf Port 3014

# ---- Build-Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# package.json und Lockfile zuerst für besseren Docker-Cache
COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---- Runtime-Stage ----
FROM nginx:alpine

# Vite-Build-Output nach nginx kopieren
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3014