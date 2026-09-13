# Dockerfile für findergen
# Baut den Go-Server und startet ihn auf Port 3013

# ---- Build-Stage ----
FROM golang:1.25 AS builder

WORKDIR /src

# Module-Cache: erst go.mod/go.sum kopieren
COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/findergen ./cmd/findergen

# ---- Runtime-Stage ----
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /out/findergen /usr/local/bin/findergen

EXPOSE 3013

CMD ["findergen", "--port", "3013"]
