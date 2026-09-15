# Dockerfile für die Uploadpage (Next.js)
# Next.js-Build, Standalone-Server auf Port 3015
# Context ist . (Root), daher muss npm/hub als Pfad angegeben werden.

# ---- Abhängigkeiten ----
FROM node:22-alpine AS deps

WORKDIR /app

# Workspace-Dateien
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY npm/hub/package.json ./npm/hub/package.json
COPY npm/finder-lib/package.json ./npm/finder-lib/package.json
COPY npm/vfs/package.json ./npm/vfs/package.json
COPY npm/finder-npm/package.json ./npm/finder-npm/package.json
COPY npm/site/package.json ./npm/site/package.json
COPY npm/pages-plugin/package.json ./npm/pages-plugin/package.json
COPY npm/hub/prisma ./npm/hub/prisma

# Symlink-Struktur einrichten, damit npm/hub postinstall sein Schema findet
RUN mkdir -p prisma && cp -r npm/hub/prisma/* prisma/

RUN corepack enable && pnpm install --frozen-lockfile

# ---- Build ----
FROM node:22-alpine AS builder

RUN corepack enable
WORKDIR /app

# Sowohl Root- als auch hub-Symlinks kopieren (pnpm Workspace)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/npm/hub/node_modules ./npm/hub/node_modules
COPY . .

# Prisma-Client für den Linux-Build generieren
RUN pnpm --filter my-project exec prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter my-project build

# ---- Runtime ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone enthält bereits die pruned node_modules + app unter npm/hub/
COPY --from=builder /app/npm/hub/.next/standalone ./
# public + static werden von Next nicht in standalone kopiert -> extra
COPY --from=builder /app/npm/hub/public ./npm/hub/public
COPY --from=builder --chown=nextjs:nodejs /app/npm/hub/.next/static ./npm/hub/.next/static

USER nextjs

EXPOSE 3015

ENV PORT=3015
ENV HOSTNAME=0.0.0.0

CMD ["node", "npm/hub/server.js"]
