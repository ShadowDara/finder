# Dockerfile für die Uploadpage (Next.js)
# Next.js-Build, Standalone-Server auf Port 3015

# ---- Abhängigkeiten ----
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Prisma-Schema vorab kopieren, damit der postinstall (prisma generate)
# im deps-Stage funktioniert
COPY prisma ./prisma

RUN corepack enable && pnpm install --frozen-lockfile

# ---- Build ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma-Client für den Linux-Build generieren
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Runtime ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma-Client für den Runtime-Container kopieren
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3015

ENV PORT=3015
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]