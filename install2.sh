#!/usr/bin/env bash
# Auto-generiertes Installer-Skript. Nicht manuell editieren.
set -euo pipefail

# ============================================================
# Farben / Logging
# ============================================================
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  BOLD=$'\033[1m'; RESET=$'\033[0m'
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; CYAN=$'\033[36m'
else
  BOLD=""; RESET=""; GREEN=""; YELLOW=""; RED=""; CYAN=""
fi

log()  { printf '%s\n' "${CYAN}==>${RESET} $*"; }
warn() { printf '%s\n' "${YELLOW}==>${RESET} $*" >&2; }
err()  { printf '%s\n' "${RED}==>${RESET} $*" >&2; }
ok()   { printf '%s\n' "${GREEN}==>${RESET} $*"; }
die()  { err "$*"; exit 1; }

# ============================================================
# Konfiguration (generiert aus der TS-Config)
# ============================================================
APP_NAME='finder'
APP_VERSION='latest'
APP_HOMEPAGE='https://github.com/shadowdara/finder'
LATEST_VERSION_URL='https://api.github.com/repos/shadowdara/finder/tags'
VERSION_MODE='tags'
ARCHIVE_URL_TEMPLATE='https://github.com/shadowdara/finder/releases/download/{version}/finder_{version}_{os}_{arch}.tar.gz'
ARCHIVE_TYPE='tar.gz'
ANIMATIONS_ENABLED=1
INSTALL_PREFIX_DEFAULT="$HOME/.finder/bin"

# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---
BIN_ARCHIVE_PATHS=('finder' 'findergen' 'csf')
BIN_TARGET_NAMES=('finder' 'findergen' 'csf')
BIN_OS_RESTRICT=('' '' '')

# --- Environment-Variablen ---
ENV_NAMES=()
ENV_VALUES=()
ENV_OS_RESTRICT=()
ENV_APPEND=()

# --- Installationsoptionen (Menü / --type) ---
OPTION_IDS=('default' 'all' 'findergen' 'csf')
OPTION_LABELS=('Default' 'Full Installation' 'Findergen' 'CSF')
OPTION_DESCRIPTIONS=('finder only' 'finder and findergen server and the csf tool' 'install only findergen' 'install only csf')
OPTION_BINARIES=('finder' 'finder,findergen,csf' 'findergen' 'csf')


INSTALL_PREFIX="$INSTALL_PREFIX_DEFAULT"
SELECTED_OPTION=""
NONINTERACTIVE=0
ANIMATION_OVERRIDE=""
SELECTED_VERSION=""

# ============================================================
# OS / Arch Erkennung
# ============================================================
detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "darwin" ;;
    *) die "Nicht unterstütztes Betriebssystem: $(uname -s)" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "amd64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) die "Nicht unterstützte Architektur: $(uname -m)" ;;
  esac
}

OS="$(detect_os)"
ARCH="$(detect_arch)"

# ============================================================
# Version auflösen (optional: "latest" von GitHub holen)
# ============================================================
resolve_latest_version() {
  if [ "$APP_VERSION" != "latest" ]; then
    return
  fi
  if [ -z "$LATEST_VERSION_URL" ]; then
    die "APP_VERSION='latest' aber keine LATEST_VERSION_URL konfiguriert."
  fi
  local api_url="$LATEST_VERSION_URL"
  local tag=""
  if command -v curl >/dev/null 2>&1; then
    tag="$(curl -fsSL "$api_url" 2>/dev/null | grep '"tag_name":' | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
  elif command -v wget >/dev/null 2>&1; then
    tag="$(wget -qO- "$api_url" 2>/dev/null | grep '"tag_name":' | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
  else
    die "APP_VERSION='latest' aber weder curl noch wget gefunden."
  fi
  if [ -z "$tag" ]; then
    die "Konnte neueste Version nicht von $LATEST_VERSION_URL ermitteln."
  fi
  APP_VERSION="$tag"
  ok "Neueste Version erkannt: $APP_VERSION"
}

resolve_latest_version

fetch_tags() {
  if [ -z "$LATEST_VERSION_URL" ]; then
    die "versionMode='tags', aber keine LATEST_VERSION_URL konfiguriert."
  fi
  local api_url="$LATEST_VERSION_URL"
  local json=""
  if command -v curl >/dev/null 2>&1; then
    json="$(curl -fsSL "$api_url" 2>/dev/null)"
  elif command -v wget >/dev/null 2>&1; then
    json="$(wget -qO- "$api_url" 2>/dev/null)"
  else
    die "Für Tags wird curl oder wget benötigt."
  fi

  # Extrahiere alle "name":"..." Vorkommen aus dem JSON (GitHub Tags API)
  echo "$json" | grep '"name"' | sed -E 's/.*"name":[ ]*"([^"]+)".*/\1/' | tr -d '\r'
}

pick_version_from_tags() {
  if [ -n "$SELECTED_VERSION" ]; then
    APP_VERSION="$SELECTED_VERSION"
    ok "Version per CLI gesetzt: $APP_VERSION"
    return
  fi

  local tags
  tags="$(fetch_tags | head -n 50)"
  [ -n "$tags" ] || die "Keine Tags von $LATEST_VERSION_URL erhalten."

  if [ "$NONINTERACTIVE" = "1" ]; then
    APP_VERSION="$(echo "$tags" | head -n 1)"
    warn "Kein Interaktiv: wähle Standard-Tag: $APP_VERSION"
    return
  fi

  if [ ! -t 0 ]; then
    APP_VERSION="$(echo "$tags" | head -n 1)"
    warn "Kein TTY erkannt: wähle Standard-Tag: $APP_VERSION"
    return
  fi

  echo ""
  echo "$BOLD Welche Version möchtest du installieren? $RESET"

  local tags_i=0
  local first=""
  local line=""
  while IFS= read -r line; do
    if [ $tags_i -eq 0 ]; then first="$line"; fi
    tags_i=$((tags_i + 1))
    printf '  %d) %s\n' "$tags_i" "$line"
  done <<< "$tags"

  local choice=""
  while true; do
    printf 'Auswahl [1-%d]: ' "$tags_i"
    read -r choice
    case "$choice" in
      ''|*[!0-9]*) echo "Bitte eine Zahl zwischen 1 und $tags_i eingeben." ;;
      *)
        if [ "$choice" -ge 1 ] && [ "$choice" -le "$tags_i" ]; then
          APP_VERSION="$(echo "$tags" | sed -n "$choice p")"
          break
        fi
        echo "Bitte eine Zahl zwischen 1 und $tags_i eingeben."
        ;;
    esac
    done

  ok "Version gewählt: $APP_VERSION"
}

# VERSION_MODE wird in __CONFIG_ARRAYS__ als env gesetzt
case "{VERSION_MODE:-fixed}" in
  latest)
    APP_VERSION="latest"
    resolve_latest_version
    ;;
  tags)
    pick_version_from_tags
    ;;
  fixed|*)
    # fixed: APP_VERSION bleibt wie gesetzt
    ;;
esac

# ============================================================
# Spinner / Ladeanimation
# ============================================================
animations_active() {
  if [ -n "$ANIMATION_OVERRIDE" ]; then
    [ "$ANIMATION_OVERRIDE" = "1" ]
    return $?
  fi
  [ "$ANIMATIONS_ENABLED" = "1" ] && [ -t 1 ]
}

run_with_spinner() {
  local msg="$1"; shift
  if ! animations_active; then
    log "$msg"
    "$@"
    return $?
  fi

  "$@" &
  local pid=$!
  local frames='-\|/'
  local i=0
  local len=${#frames}
  printf '%s  ' "$msg"
  while kill -0 "$pid" 2>/dev/null; do
    i=$(( (i + 1) % len ))
    printf '\r%s  %s' "$msg" "${frames:$i:1}"
    sleep 0.1
  done
  wait "$pid"
  local status=$?
  if [ $status -eq 0 ]; then
    printf '\r%s  %s\n' "$msg" "${GREEN}OK${RESET}"
  else
    printf '\r%s  %s\n' "$msg" "${RED}FEHLER${RESET}"
  fi
  return $status
}

# ============================================================
# Hilfe
# ============================================================
usage() {
  cat <<EOF
${BOLD}${APP_NAME} Installer${RESET} (v${APP_VERSION})

Verwendung: $0 [optionen]

Optionen:
  -y, --yes               Nicht-interaktive Installation (Standardtyp)
  -t, --type <id>         Installationstyp wählen (siehe --list)
      --latest            Neueste Version automatisch von GitHub ermitteln
      --version <tag>    Version explizit setzen (z.B. v1.2.3)
      --prefix <dir>      Zielverzeichnis (Standard: $INSTALL_PREFIX_DEFAULT)
      --no-animation      Ladeanimationen deaktivieren
      --animation         Ladeanimationen erzwingen
      --list              Verfügbare Installationstypen anzeigen
  -h, --help              Diese Hilfe anzeigen
EOF
}

list_options() {
  echo "Verfügbare Installationstypen:"
  local idx=0
  local n=${#OPTION_IDS[@]}
  while [ "$idx" -lt "$n" ]; do
    printf '  %s%s%s - %s\n' "${BOLD}" "${OPTION_IDS[$idx]}" "${RESET}" "${OPTION_LABELS[$idx]}"
    if [ -n "${OPTION_DESCRIPTIONS[$idx]}" ]; then
      printf '      %s\n' "${OPTION_DESCRIPTIONS[$idx]}"
    fi
    idx=$((idx + 1))
  done
}

# ============================================================
# Argumente parsen (für maschinelle / scriptbare Installation)
# ============================================================
while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes) NONINTERACTIVE=1; shift ;;
    --latest) APP_VERSION="latest"; shift ;;
    --version) SELECTED_VERSION="\${2:-}"; VERSION_MODE="tags"; NONINTERACTIVE=1; shift 2 ;;
    --version=*) SELECTED_VERSION="\${1#*=}"; VERSION_MODE="tags"; NONINTERACTIVE=1; shift ;;
    -t|--type) SELECTED_OPTION="${2:-}"; NONINTERACTIVE=1; shift 2 ;;
    --type=*) SELECTED_OPTION="${1#*=}"; NONINTERACTIVE=1; shift ;;
    --prefix) INSTALL_PREFIX="${2:-}"; shift 2 ;;
    --prefix=*) INSTALL_PREFIX="${1#*=}"; shift ;;
    --no-animation) ANIMATION_OVERRIDE="0"; shift ;;
    --animation) ANIMATION_OVERRIDE="1"; shift ;;
    --list) list_options; exit 0 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unbekannte Option: $1 (siehe --help)" ;;
  esac
done

# Ohne TTY (z.B. curl ... | bash) automatisch nicht-interaktiv weiterlaufen.
if [ ! -t 0 ]; then
  NONINTERACTIVE=1
fi

# ============================================================
# Interaktives Menü
# ============================================================
prompt_for_option() {
  local n=${#OPTION_IDS[@]}
  if [ "$n" -eq 1 ]; then
    SELECTED_OPTION="${OPTION_IDS[0]}"
    return
  fi

  echo ""
  echo "${BOLD}Welche Installation möchtest du durchführen?${RESET}"
  local idx=0
  while [ "$idx" -lt "$n" ]; do
    printf '  %d) %s - %s\n' "$((idx + 1))" "${OPTION_LABELS[$idx]}" "${OPTION_DESCRIPTIONS[$idx]}"
    idx=$((idx + 1))
  done

  local choice=""
  while true; do
    printf 'Auswahl [1-%d]: ' "$n"
    read -r choice
    case "$choice" in
      ''|*[!0-9]*) echo "Bitte eine Zahl zwischen 1 und $n eingeben." ;;
      *)
        if [ "$choice" -ge 1 ] && [ "$choice" -le "$n" ]; then
          SELECTED_OPTION="${OPTION_IDS[$((choice - 1))]}"
          break
        fi
        echo "Bitte eine Zahl zwischen 1 und $n eingeben."
        ;;
    esac
  done
}

if [ -z "$SELECTED_OPTION" ]; then
  if [ "$NONINTERACTIVE" = "1" ]; then
    SELECTED_OPTION="${OPTION_IDS[0]}"
    warn "Kein --type angegeben, verwende Standard: $SELECTED_OPTION"
  else
    prompt_for_option
  fi
fi

# Ausgewählte Option in den Arrays finden und die zugehörige
# Binary-Liste (kommagetrennt) auflösen.
SELECTED_BINARIES_CSV=""
{
  idx=0
  n=${#OPTION_IDS[@]}
  while [ "$idx" -lt "$n" ]; do
    if [ "${OPTION_IDS[$idx]}" = "$SELECTED_OPTION" ]; then
      SELECTED_BINARIES_CSV="${OPTION_BINARIES[$idx]}"
      break
    fi
    idx=$((idx + 1))
  done
}
[ -n "$SELECTED_BINARIES_CSV" ] || die "Unbekannter Installationstyp: $SELECTED_OPTION (siehe --list)"

log "Installationstyp: ${BOLD}${SELECTED_OPTION}${RESET}"
log "Zielverzeichnis:  ${INSTALL_PREFIX}"

# ============================================================
# Download & Extraktion
# ============================================================
WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

resolve_archive_url() {
  local url="$ARCHIVE_URL_TEMPLATE"
  url="${url//\{appName\}/$APP_NAME}"
  url="${url//\{version\}/$APP_VERSION}"
  url="${url//\{os\}/$OS}"
  url="${url//\{arch\}/$ARCH}"
  echo "$url"
}

download() {
  local url="$1" dest="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$dest"
  elif command -v wget >/dev/null 2>&1; then
    wget -q "$url" -O "$dest"
  else
    die "Weder curl noch wget gefunden."
  fi
}

extract() {
  local archive="$1" dest="$2"
  mkdir -p "$dest"
  case "$ARCHIVE_TYPE" in
    tar.gz) tar -xzf "$archive" -C "$dest" ;;
    zip)
      command -v unzip >/dev/null 2>&1 || die "unzip wird benötigt, ist aber nicht installiert."
      unzip -q "$archive" -d "$dest"
      ;;
    *) die "Unbekannter Archivtyp: $ARCHIVE_TYPE" ;;
  esac
}

do_download_and_extract() {
  local url
  url="$(resolve_archive_url)"
  local archive_file="$WORKDIR/archive.$ARCHIVE_TYPE"
  download "$url" "$archive_file"
  extract "$archive_file" "$WORKDIR/extracted"
}

run_with_spinner "Lade $APP_NAME $APP_VERSION herunter" do_download_and_extract

# ============================================================
# Binaries installieren
# ============================================================
install_binaries() {
  mkdir -p "$INSTALL_PREFIX/bin"
  IFS=',' read -r -a wanted <<< "$SELECTED_BINARIES_CSV"

  local i=0
  local total=${#BIN_ARCHIVE_PATHS[@]}
  while [ "$i" -lt "$total" ]; do
    local archive_path="${BIN_ARCHIVE_PATHS[$i]}"
    local target_name="${BIN_TARGET_NAMES[$i]}"
    local os_restrict="${BIN_OS_RESTRICT[$i]}"

    # OS-Filter: leer = beide Systeme, sonst kommagetrennte Liste.
    if [ -n "$os_restrict" ]; then
      case ",$os_restrict," in
        *",$OS,"*) : ;;
        *) i=$((i + 1)); continue ;;
      esac
    fi

    # Nur installieren, wenn Binary zur gewählten Option gehört.
    local wanted_ok=0
    for w in "${wanted[@]}"; do
      if [ "$w" = "$target_name" ] || [ "$w" = "$archive_path" ]; then
        wanted_ok=1
        break
      fi
    done
    if [ "$wanted_ok" -eq 1 ]; then
      local src="$WORKDIR/extracted/$archive_path"
      [ -f "$src" ] || die "Binary nicht im Archiv gefunden: $archive_path"
      cp "$src" "$INSTALL_PREFIX/bin/$target_name"
      chmod +x "$INSTALL_PREFIX/bin/$target_name"
      ok "Installiert: $target_name"
    fi
    i=$((i + 1))
  done
}

run_with_spinner "Installiere Binaries" install_binaries

# ============================================================
# Auto-Uninstall (pro gewählter Version)
# ============================================================
auto_uninstall() {
  # uninstall.sh wird im entpackten Root gesucht.
  # Wenn Archiv "uninstall.sh" nicht im Root hat, musst du ggf. Pfad erweitern.
  local candidate="$WORKDIR/extracted/uninstall.sh"
  if [ -f "$candidate" ]; then
    ok "Uninstall-Skript für Version \$APP_VERSION gefunden – führe uninstall.sh aus."
    bash "$candidate" || die "uninstall.sh failed for this version"
  else
    # gewünschte Meldung:
    warn "uninstall does not work for this version"
  fi
}

run_with_spinner "Auto-Uninstall für Version \$APP_VERSION" auto_uninstall
auto_uninstall

# ============================================================
# Shell-RC-Datei bestimmen
# ============================================================
detect_shell_rc() {
  local shell_name
  shell_name="$(basename "${SHELL:-bash}")"
  case "$shell_name" in
    zsh)  echo "$HOME/.zshrc" ;;
    bash)
      if [ "$OS" = "darwin" ]; then
        # macOS startet Login-Shells standardmäßig, daher .bash_profile
        echo "$HOME/.bash_profile"
      else
        echo "$HOME/.bashrc"
      fi
      ;;
    *) echo "$HOME/.profile" ;;
  esac
}

RC_FILE="$(detect_shell_rc)"
touch "$RC_FILE"

append_once() {
  local marker="$1" line="$2" file="$3"
  if ! grep -qF "$marker" "$file" 2>/dev/null; then
    {
      echo ""
      echo "# >>> $APP_NAME installer >>>"
      echo "$line"
      echo "# <<< $APP_NAME installer <<<"
    } >> "$file"
  fi
}

# ============================================================
# PATH aktualisieren
# ============================================================
update_path() {
  local marker="$APP_NAME installer"
  local line="export PATH=\"$INSTALL_PREFIX/bin:\$PATH\""
  append_once "$marker" "$line" "$RC_FILE"
}

run_with_spinner "Aktualisiere PATH in $RC_FILE" update_path

# ============================================================
# Environment-Variablen setzen
# ============================================================
set_env_vars() {
  local i=0
  local total=${#ENV_NAMES[@]}
  while [ "$i" -lt "$total" ]; do
    local name="${ENV_NAMES[$i]}"
    local value="${ENV_VALUES[$i]}"
    local os_restrict="${ENV_OS_RESTRICT[$i]}"
    local append="${ENV_APPEND[$i]}"

    if [ -n "$os_restrict" ]; then
      case ",$os_restrict," in
        *",$OS,"*) : ;;
        *) i=$((i + 1)); continue ;;
      esac
    fi

    local line
    if [ "$append" = "1" ]; then
      line="export $name=\"$value:\${$name:-}\""
    else
      line="export $name=\"$value\""
    fi
    append_once "$APP_NAME-env-$name" "$line" "$RC_FILE"
    i=$((i + 1))
  done
}

if [ "${#ENV_NAMES[@]}" -gt 0 ]; then
  run_with_spinner "Setze Environment-Variablen" set_env_vars
fi

# ============================================================
# Fertig
# ============================================================
echo ""
ok "${APP_NAME} ${APP_VERSION} wurde installiert nach: ${INSTALL_PREFIX}/bin"
log "Starte eine neue Shell oder führe aus: source $RC_FILE"
if [ -n "$APP_HOMEPAGE" ]; then
  log "Mehr Infos: $APP_HOMEPAGE"
fi

# Base64 of the input values for the generator
# so you dont have to type it all again
#
#$$$eyJhcHBOYW1lIjoiZmluZGVyIiwidmVyc2lvbiI6ImxhdGVzdCIsInZlcnNpb25Nb2RlIjoidGFncyIsImhvbWVwYWdlIjoiaHR0cHM6Ly9naXRodWIuY29tL3NoYWRvd2RhcmEvZmluZGVyIiwibGF0ZXN0VmVyc2lvblVybCI6Imh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3Mvc2hhZG93ZGFyYS9maW5kZXIvdGFncyIsImFyY2hpdmUiOnsidXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL3NoYWRvd2RhcmEvZmluZGVyL3JlbGVhc2VzL2Rvd25sb2FkL3t2ZXJzaW9ufS9maW5kZXJfe3ZlcnNpb259X3tvc31fe2FyY2h9LnRhci5neiIsInR5cGUiOiJ0YXIuZ3oifSwiYmluYXJpZXMiOlt7ImFyY2hpdmVQYXRoIjoiZmluZGVyIiwidGFyZ2V0TmFtZSI6ImZpbmRlciJ9LHsiYXJjaGl2ZVBhdGgiOiJmaW5kZXJnZW4iLCJ0YXJnZXROYW1lIjoiZmluZGVyZ2VuIn0seyJhcmNoaXZlUGF0aCI6ImNzZiIsInRhcmdldE5hbWUiOiJjc2YifV0sImluc3RhbGxPcHRpb25zIjpbeyJpZCI6ImRlZmF1bHQiLCJsYWJlbCI6IkRlZmF1bHQiLCJkZXNjcmlwdGlvbiI6ImZpbmRlciBvbmx5IiwiYmluYXJpZXMiOlsiZmluZGVyIl19LHsiaWQiOiJhbGwiLCJsYWJlbCI6IkZ1bGwgSW5zdGFsbGF0aW9uIiwiZGVzY3JpcHRpb24iOiJmaW5kZXIgYW5kIGZpbmRlcmdlbiBzZXJ2ZXIgYW5kIHRoZSBjc2YgdG9vbCIsImJpbmFyaWVzIjpbImZpbmRlciIsImZpbmRlcmdlbiIsImNzZiJdfSx7ImlkIjoiZmluZGVyZ2VuIiwibGFiZWwiOiJGaW5kZXJnZW4iLCJkZXNjcmlwdGlvbiI6Imluc3RhbGwgb25seSBmaW5kZXJnZW4iLCJiaW5hcmllcyI6WyJmaW5kZXJnZW4iXX0seyJpZCI6ImNzZiIsImxhYmVsIjoiQ1NGIiwiZGVzY3JpcHRpb24iOiJpbnN0YWxsIG9ubHkgY3NmIiwiYmluYXJpZXMiOlsiY3NmIl19XSwiZGVmYXVsdEluc3RhbGxEaXIiOiIkSE9NRS8uZmluZGVyL2JpbiIsImFuaW1hdGlvbnMiOnRydWV9
