/**
 * installer-maker.ts
 * ---------------------------------------------------------------------------
 * Erzeugt aus einer deklarativen Config ein einzelnes, portables Bash-Skript
 * (kompatibel mit macOS' altem Bash 3.2 und modernem Linux-Bash), das:
 *
 *  - ein Archiv (tar.gz/zip) je nach OS/Arch herunterlädt
 *  - mehrere Binaries daraus extrahiert und installiert
 *  - PATH und beliebige ENV-Variablen in die passende Shell-RC einträgt
 *    (idempotent, per Marker-Block – mehrfaches Ausführen ist sicher)
 *  - ein interaktives Auswahlmenü zeigt ("Welche Installation?")
 *  - per CLI-Args (--yes/--type/--prefix/...) vollautomatisch/scriptable läuft
 *  - optionale Spinner-Ladeanimation zeigt (deaktivierbar, auto-off ohne TTY)
 *
 * Verwendung:
 *   import { generateInstallerScript, writeInstallerScript } from "./installer-maker";
 *   const script = generateInstallerScript(myConfig);
 *   writeInstallerScript(myConfig, "./dist/install.sh"); // schreibt + chmod +x
 * ---------------------------------------------------------------------------
 */

// import { writeFileSync, chmodSync, mkdirSync } from "node:fs";
// import { dirname } from "node:path";

/** Unterstützte Zielsysteme. */
export type TargetOS = "linux" | "darwin";

/** Eine einzelne Binary, die aus dem Archiv installiert werden soll. */
export interface BinarySpec {
  /** Pfad/Dateiname der Binary INNERHALB des entpackten Archivs. */
  archivePath: string;
  /** Name, unter dem die Binary im Zielverzeichnis landet (Default: letzter Pfadteil von archivePath). */
  targetName?: string;
  /** Nur auf diesen OS installieren. Weglassen = beide (linux + darwin). */
  os?: TargetOS[];
}

/** Eine Environment-Variable, die in die Shell-RC-Datei eingetragen wird. */
export interface EnvVarSpec {
  name: string;
  /**
   * Wert der Variable. "$INSTALL_PREFIX" bzw. "${INSTALL_PREFIX}" wird beim
   * Installieren durch das tatsächliche Zielverzeichnis ersetzt (in der RC-Datei
   * existiert diese Variable ja nicht). Andere Variablen wie $HOME werden erst
   * beim Sourcen der RC-Datei aufgelöst.
   */
  value: string;
  /** Nur auf diesen OS setzen. Weglassen = beide. */
  os?: TargetOS[];
  /** true = an bestehenden Wert anhängen (z.B. für PATH-artige Variablen wie MANPATH). */
  append?: boolean;
}

/** Eine wählbare Installationsvariante (z.B. "full" vs. "minimal"). */
export interface InstallOption {
  /** Interne ID, wird über --type <id> angesprochen. */
  id: string;
  /** Anzeigename im Menü. */
  label: string;
  /** Kurzbeschreibung im Menü. */
  description?: string;
  /** Liste von targetName (oder ersatzweise archivePath) der Binaries, die zu dieser Option gehören. */
  binaries: string[];
}

/** Beschreibung des herunterzuladenden Archivs. */
export interface ArchiveSpec {
  /**
   * URL-Template. Unterstützte Platzhalter: {appName} {version} {os} {arch}
   * Beispiel: "https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"
   */
  url: string;
  type: "tar.gz" | "zip";
}

export interface InstallerConfig {
  appName: string;
  version: string;
  archive: ArchiveSpec;
  binaries: BinarySpec[];
  envVars?: EnvVarSpec[];
  /** Wenn weggelassen: es gibt genau eine Option "full" mit allen Binaries (kein Menü). */
  installOptions?: InstallOption[];
  /** Standard-Installationsverzeichnis, überschreibbar per --prefix. Default: $HOME/.local/{appName} */
  defaultInstallDir?: string;
  /** Ladeanimationen aktivieren (Default: true). Wird automatisch deaktiviert wenn kein TTY. */
  animations?: boolean;
  /** Optionale Homepage-URL, wird am Ende ausgegeben. */
  homepage?: string;
  /**
   * API-URL für "latest" (GitHub: .../releases/latest).
   * Wird automatisch abgeleitet, wenn homepage ein GitHub-Repo ist.
   */
  latestVersionUrl?: string;
  /**
   * API-URL für die Tag-Liste (GitHub: .../tags).
   * Default: aus latestVersionUrl abgeleitet ("/releases/latest" -> "/tags").
   */
  tagsUrl?: string;
  /**
   * fixed  = version aus der Config (Default; "latest" wird trotzdem aufgelöst)
   * latest = neueste Version beim Ausführen ermitteln
   * tags   = Version aus Tag-Liste wählen (Menü / erster Tag bei non-interaktiv)
   */
  versionMode?: "fixed" | "latest" | "tags";
}

// ---------------------------------------------------------------------------
// Bash-Hilfsfunktionen (String-Escaping, Array-Literale)
// ---------------------------------------------------------------------------

function escBash(str: string): string {
  // Innerhalb von Single Quotes: ' -> '\''
  return String(str).replace(/'/g, `'\\''`);
}

function bashStringLiteral(value: string): string {
  return `'${escBash(value)}'`;
}

function bashArray(items: string[]): string {
  return "(" + items.map(bashStringLiteral).join(" ") + ")";
}

function csvList(items: string[]): string {
  return items.join(",");
}

/** Für Double-Quotes, in denen $HOME & Co. expandiert werden sollen. */
function escBashDoubleQuoted(value: string): string {
  return String(value).replace(/[\\"`]/g, "\\$&");
}

function githubApiBase(homepage?: string): string | undefined {
  const m = homepage?.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return undefined;
  return `https://api.github.com/repos/${m[1]}/${m[2].replace(/\.git$/, "")}`;
}

// ---------------------------------------------------------------------------
// Der eigentliche Generator
// ---------------------------------------------------------------------------

export function generateInstallerScript(config: InstallerConfig): string {
  const {
    appName,
    version,
    archive,
    binaries,
    envVars = [],
    installOptions,
    defaultInstallDir,
    animations = true,
    homepage,
    versionMode = "fixed",
  } = config;

  if (!appName || !version) {
    throw new Error("appName und version sind erforderlich.");
  }
  if (!binaries || binaries.length === 0) {
    throw new Error("Mindestens eine Binary muss angegeben werden.");
  }

  const binTargetNames = binaries.map(
    (b) => b.targetName || b.archivePath.split("/").pop() || b.archivePath,
  );
  const binArchivePaths = binaries.map((b) => b.archivePath);
  const binOsRestrict = binaries.map((b) => (b.os ? csvList(b.os) : ""));

  // Ohne explizite installOptions: eine einzige "full"-Option mit allen Binaries.
  const options: InstallOption[] =
    installOptions && installOptions.length > 0
      ? installOptions
      : [
          {
            id: "full",
            label: "Vollständige Installation",
            description: "Installiert alle Binaries.",
            binaries: binTargetNames,
          },
        ];

  // Validierung: eindeutige IDs, Binaries müssen existieren.
  const seenIds = new Set<string>();
  for (const o of options) {
    if (seenIds.has(o.id)) throw new Error(`Doppelte Option-ID: ${o.id}`);
    seenIds.add(o.id);
    if (/[,\s]/.test(o.id)) throw new Error(`Ungültige Option-ID: "${o.id}"`);
    for (const name of o.binaries) {
      if (!binTargetNames.includes(name) && !binArchivePaths.includes(name)) {
        throw new Error(
          `Option "${o.id}" referenziert unbekannte Binary: "${name}"`,
        );
      }
    }
  }

  // Version-URLs (mit GitHub-Autodetect über homepage)
  const ghBase = githubApiBase(homepage);
  const latestUrl =
    config.latestVersionUrl ?? (ghBase ? `${ghBase}/releases/latest` : "");
  const tagsUrl =
    config.tagsUrl ??
    (latestUrl.endsWith("/releases/latest")
      ? latestUrl.replace(/\/releases\/latest$/, "/tags")
      : latestUrl);

  if (version === "latest" || versionMode === "latest") {
    if (!latestUrl) {
      throw new Error(
        "Für 'latest' wird latestVersionUrl (oder eine GitHub-homepage) benötigt.",
      );
    }
  }
  if (versionMode === "tags" && !tagsUrl) {
    throw new Error(
      "Für versionMode 'tags' wird tagsUrl/latestVersionUrl (oder eine GitHub-homepage) benötigt.",
    );
  }

  const installDir = defaultInstallDir || `$HOME/.local/${appName}`;

  const arraysBlock = [
    `APP_NAME=${bashStringLiteral(appName)}`,
    `APP_VERSION=${bashStringLiteral(version)}`,
    `APP_HOMEPAGE=${bashStringLiteral(homepage || "")}`,
    `LATEST_VERSION_URL=${bashStringLiteral(latestUrl)}`,
    `TAGS_URL=${bashStringLiteral(tagsUrl)}`,
    `VERSION_MODE=${bashStringLiteral(versionMode)}`,
    `ARCHIVE_URL_TEMPLATE=${bashStringLiteral(archive.url)}`,
    `ARCHIVE_TYPE=${bashStringLiteral(archive.type)}`,
    `ANIMATIONS_ENABLED=${animations ? 1 : 0}`,
    `INSTALL_PREFIX_DEFAULT="${escBashDoubleQuoted(installDir)}"`,
    "",
    "# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",
    `BIN_ARCHIVE_PATHS=${bashArray(binArchivePaths)}`,
    `BIN_TARGET_NAMES=${bashArray(binTargetNames)}`,
    `BIN_OS_RESTRICT=${bashArray(binOsRestrict)}`,
    "",
    "# --- Environment-Variablen ---",
    `ENV_NAMES=${bashArray(envVars.map((e) => e.name))}`,
    `ENV_VALUES=${bashArray(envVars.map((e) => e.value))}`,
    `ENV_OS_RESTRICT=${bashArray(envVars.map((e) => (e.os ? csvList(e.os) : "")))}`,
    `ENV_APPEND=${bashArray(envVars.map((e) => (e.append ? "1" : "0")))}`,
    "",
    "# --- Installationsoptionen (Menü / --type) ---",
    `OPTION_IDS=${bashArray(options.map((o) => o.id))}`,
    `OPTION_LABELS=${bashArray(options.map((o) => o.label))}`,
    `OPTION_DESCRIPTIONS=${bashArray(options.map((o) => o.description || ""))}`,
    `OPTION_BINARIES=${bashArray(options.map((o) => csvList(o.binaries)))}`,
  ].join("\n");

  // Funktion als Replacer: sonst würden "$&", "$'" etc. in der Config als
  // Sonderzeichen von String.replace interpretiert.
  return STATIC_TEMPLATE.replace("__CONFIG_ARRAYS__", () => arraysBlock);
}

// /**
//  * Generiert das Skript und schreibt es direkt auf die Festplatte (chmod +x).
//  * Legt Zwischenverzeichnisse bei Bedarf an.
//  */
// export function writeInstallerScript(
//   config: InstallerConfig,
//   outPath: string,
// ): void {
//   const script = generateInstallerScript(config);
//   mkdirSync(dirname(outPath), { recursive: true });
//   writeFileSync(outPath, script, { encoding: "utf8" });
//   chmodSync(outPath, 0o755);
// }

// ---------------------------------------------------------------------------
// Statisches Bash-Template
//
// Hinweis: Da dies ein TS-Template-Literal ist, wird "µ{" als Platzhalter für
// "${" verwendet und am Ende zurückgetauscht. Im Template darf daher NIRGENDS
// ein echtes "${" stehen (auch nicht in Bash-Single-Quotes) und kein Backtick.
// ---------------------------------------------------------------------------

const STATIC_TEMPLATE = String.raw`#!/usr/bin/env bash
# Auto-generiertes Installer-Skript. Nicht manuell editieren.
set -euo pipefail

# ============================================================
# Farben / Logging
# ============================================================
if [ -t 1 ] && [ -z "µ{NO_COLOR:-}" ]; then
  BOLD=$'\033[1m'; RESET=$'\033[0m'
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; CYAN=$'\033[36m'
else
  BOLD=""; RESET=""; GREEN=""; YELLOW=""; RED=""; CYAN=""
fi

log()  { printf '%s\n' "µ{CYAN}==>µ{RESET} $*"; }
warn() { printf '%s\n' "µ{YELLOW}==>µ{RESET} $*" >&2; }
err()  { printf '%s\n' "µ{RED}==>µ{RESET} $*" >&2; }
ok()   { printf '%s\n' "µ{GREEN}==>µ{RESET} $*"; }
die()  { err "$*"; exit 1; }

# ============================================================
# Konfiguration (generiert aus der TS-Config)
# ============================================================
__CONFIG_ARRAYS__

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
# HTTP-Helfer
# ============================================================
http_get() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    die "Weder curl noch wget gefunden."
  fi
}

# ============================================================
# Hilfe
# ============================================================
usage() {
  cat <<EOF
µ{BOLD}µ{APP_NAME} Installerµ{RESET} (Version: µ{APP_VERSION})

Verwendung: $0 [optionen]

Optionen:
  -y, --yes              Nicht-interaktive Installation (Standardtyp)
  -t, --type <id>        Installationstyp wählen (siehe --list)
      --latest           Neueste Version automatisch ermitteln
      --version <tag>    Version explizit setzen (z.B. v1.2.3)
      --prefix <dir>     Zielverzeichnis (Standard: $INSTALL_PREFIX_DEFAULT)
      --no-animation     Ladeanimationen deaktivieren
      --animation        Ladeanimationen erzwingen
      --list             Verfügbare Installationstypen anzeigen
  -h, --help             Diese Hilfe anzeigen
EOF
}

list_options() {
  echo "Verfügbare Installationstypen:"
  local idx=0
  local n=µ{#OPTION_IDS[@]}
  while [ "$idx" -lt "$n" ]; do
    printf '  %s%s%s - %s\n' "µ{BOLD}" "µ{OPTION_IDS[$idx]}" "µ{RESET}" "µ{OPTION_LABELS[$idx]}"
    if [ -n "µ{OPTION_DESCRIPTIONS[$idx]}" ]; then
      printf '      %s\n' "µ{OPTION_DESCRIPTIONS[$idx]}"
    fi
    idx=$((idx + 1))
  done
}

# ============================================================
# Argumente parsen (für maschinelle / scriptbare Installation)
# ============================================================
need_arg() {
  [ $# -ge 2 ] && [ -n "$2" ] || die "Option $1 benötigt ein Argument (siehe --help)"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes) NONINTERACTIVE=1; shift ;;
    --latest) VERSION_MODE="latest"; shift ;;
    --version) need_arg "$@"; SELECTED_VERSION="$2"; shift 2 ;;
    --version=*) SELECTED_VERSION="µ{1#*=}"; shift ;;
    -t|--type) need_arg "$@"; SELECTED_OPTION="$2"; NONINTERACTIVE=1; shift 2 ;;
    --type=*) SELECTED_OPTION="µ{1#*=}"; NONINTERACTIVE=1; shift ;;
    --prefix) need_arg "$@"; INSTALL_PREFIX="$2"; shift 2 ;;
    --prefix=*) INSTALL_PREFIX="µ{1#*=}"; shift ;;
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

# Prefix normalisieren: "~" auflösen, relative Pfade absolut machen
# (sonst landet ein relativer Pfad in der RC-Datei und bricht dort).
case "$INSTALL_PREFIX" in
  "~") INSTALL_PREFIX="$HOME" ;;
  "~/"*) INSTALL_PREFIX="$HOME/µ{INSTALL_PREFIX#\~/}" ;;
  /*) : ;;
  *) INSTALL_PREFIX="$PWD/$INSTALL_PREFIX" ;;
esac

# ============================================================
# Version auflösen (fixed / latest / tags) – NACH dem Arg-Parsing
# ============================================================
resolve_latest_version() {
  [ -n "$LATEST_VERSION_URL" ] || die "Keine LATEST_VERSION_URL konfiguriert."
  local json="" tag=""
  json="$(http_get "$LATEST_VERSION_URL")" || die "Konnte $LATEST_VERSION_URL nicht abrufen."
  tag="$(printf '%s\n' "$json" \
    | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -n 1 \
    | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')" || true
  [ -n "$tag" ] || die "Konnte neueste Version nicht von $LATEST_VERSION_URL ermitteln."
  APP_VERSION="$tag"
  ok "Neueste Version erkannt: $APP_VERSION"
}

fetch_tags() {
  [ -n "$TAGS_URL" ] || die "Keine TAGS_URL konfiguriert."
  local json=""
  json="$(http_get "$TAGS_URL")" || die "Konnte $TAGS_URL nicht abrufen."
  printf '%s\n' "$json" \
    | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/' \
    | tr -d '\r' || true
}

pick_version_from_tags() {
  local tags=""
  tags="$(fetch_tags | head -n 50)" || true
  [ -n "$tags" ] || die "Keine Tags von $TAGS_URL erhalten."

  if [ "$NONINTERACTIVE" = "1" ]; then
    APP_VERSION="$(printf '%s\n' "$tags" | head -n 1)"
    warn "Nicht-interaktiv: wähle neuesten Tag: $APP_VERSION"
    return
  fi

  echo ""
  echo "µ{BOLD}Welche Version möchtest du installieren?µ{RESET}"
  local count=0 line=""
  while IFS= read -r line; do
    count=$((count + 1))
    printf '  %d) %s\n' "$count" "$line"
  done <<< "$tags"

  local choice=""
  while true; do
    printf 'Auswahl [1-%d]: ' "$count"
    read -r choice || die "Keine Eingabe erhalten."
    case "$choice" in
      ''|*[!0-9]*) echo "Bitte eine Zahl zwischen 1 und $count eingeben." ;;
      *)
        if [ "$choice" -ge 1 ] && [ "$choice" -le "$count" ]; then
          APP_VERSION="$(printf '%s\n' "$tags" | sed -n "µ{choice}p")"
          break
        fi
        echo "Bitte eine Zahl zwischen 1 und $count eingeben."
        ;;
    esac
  done
  ok "Version gewählt: $APP_VERSION"
}

resolve_version() {
  if [ -n "$SELECTED_VERSION" ]; then
    APP_VERSION="$SELECTED_VERSION"
    ok "Version per CLI gesetzt: $APP_VERSION"
    return
  fi
  case "$VERSION_MODE" in
    latest) resolve_latest_version ;;
    tags)   pick_version_from_tags ;;
    *)
      # fixed: nur auflösen, wenn explizit "latest" konfiguriert wurde
      if [ "$APP_VERSION" = "latest" ]; then
        resolve_latest_version
      fi
      ;;
  esac
}

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
  local len=µ{#frames}
  printf '%s  ' "$msg"
  while kill -0 "$pid" 2>/dev/null; do
    printf '\r%s  %s' "$msg" "µ{frames:$i:1}"
    i=$(( (i + 1) % len ))
    sleep 0.1
  done
  # wait darf unter "set -e" nicht direkt scheitern, sonst bricht das Skript
  # ab, bevor FEHLER ausgegeben wird.
  local status=0
  wait "$pid" || status=$?
  if [ "$status" -eq 0 ]; then
    printf '\r%s  %s\n' "$msg" "µ{GREEN}OKµ{RESET}"
  else
    printf '\r%s  %s\n' "$msg" "µ{RED}FEHLERµ{RESET}"
  fi
  return "$status"
}

# ============================================================
# Interaktives Menü
# ============================================================
prompt_for_option() {
  local n=µ{#OPTION_IDS[@]}
  if [ "$n" -eq 1 ]; then
    SELECTED_OPTION="µ{OPTION_IDS[0]}"
    return
  fi

  echo ""
  echo "µ{BOLD}Welche Installation möchtest du durchführen?µ{RESET}"
  local idx=0
  while [ "$idx" -lt "$n" ]; do
    printf '  %d) %s - %s\n' "$((idx + 1))" "µ{OPTION_LABELS[$idx]}" "µ{OPTION_DESCRIPTIONS[$idx]}"
    idx=$((idx + 1))
  done

  local choice=""
  while true; do
    printf 'Auswahl [1-%d]: ' "$n"
    read -r choice || die "Keine Eingabe erhalten."
    case "$choice" in
      ''|*[!0-9]*) echo "Bitte eine Zahl zwischen 1 und $n eingeben." ;;
      *)
        if [ "$choice" -ge 1 ] && [ "$choice" -le "$n" ]; then
          SELECTED_OPTION="µ{OPTION_IDS[$((choice - 1))]}"
          break
        fi
        echo "Bitte eine Zahl zwischen 1 und $n eingeben."
        ;;
    esac
  done
}

if [ -z "$SELECTED_OPTION" ]; then
  if [ "$NONINTERACTIVE" = "1" ]; then
    SELECTED_OPTION="µ{OPTION_IDS[0]}"
    warn "Kein --type angegeben, verwende Standard: $SELECTED_OPTION"
  else
    prompt_for_option
  fi
fi

# Ausgewählte Option in den Arrays finden und Binary-Liste (CSV) auflösen.
SELECTED_BINARIES_CSV=""
idx=0
n=µ{#OPTION_IDS[@]}
while [ "$idx" -lt "$n" ]; do
  if [ "µ{OPTION_IDS[$idx]}" = "$SELECTED_OPTION" ]; then
    SELECTED_BINARIES_CSV="µ{OPTION_BINARIES[$idx]}"
    break
  fi
  idx=$((idx + 1))
done
[ -n "$SELECTED_BINARIES_CSV" ] || die "Unbekannter Installationstyp: $SELECTED_OPTION (siehe --list)"

# Version erst jetzt auflösen (Flags/Interaktivität sind bekannt)
resolve_version

log "Installationstyp: µ{BOLD}µ{SELECTED_OPTION}µ{RESET}"
log "Version:          $APP_VERSION"
log "Zielverzeichnis:  $INSTALL_PREFIX"

# ============================================================
# Download & Extraktion
# ============================================================
WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

resolve_archive_url() {
  local url="$ARCHIVE_URL_TEMPLATE"
  local p_app='{appName}' p_ver='{version}' p_os='{os}' p_arch='{arch}'
  url="µ{url//$p_app/$APP_NAME}"
  url="µ{url//$p_ver/$APP_VERSION}"
  url="µ{url//$p_os/$OS}"
  url="µ{url//$p_arch/$ARCH}"
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
  download "$url" "$archive_file" || die "Download fehlgeschlagen: $url"
  extract "$archive_file" "$WORKDIR/extracted"
}

run_with_spinner "Lade $APP_NAME $APP_VERSION herunter" do_download_and_extract

# ============================================================
# Auto-Uninstall (optional, einmal, VOR der Installation)
# ============================================================
auto_uninstall() {
  local candidate="$WORKDIR/extracted/uninstall.sh"
  if [ -f "$candidate" ]; then
    log "Uninstall-Skript für Version $APP_VERSION gefunden – führe uninstall.sh aus."
    INSTALL_PREFIX="$INSTALL_PREFIX" bash "$candidate" || warn "uninstall.sh ist fehlgeschlagen (ignoriert)"
  else
    warn "uninstall does not work for this version"
  fi
}

auto_uninstall

# ============================================================
# Binaries installieren
# ============================================================
install_binaries() {
  mkdir -p "$INSTALL_PREFIX/bin"
  local wanted=()
  IFS=',' read -r -a wanted <<< "$SELECTED_BINARIES_CSV"

  local i=0
  local total=µ{#BIN_ARCHIVE_PATHS[@]}
  while [ "$i" -lt "$total" ]; do
    local archive_path="µ{BIN_ARCHIVE_PATHS[$i]}"
    local target_name="µ{BIN_TARGET_NAMES[$i]}"
    local os_restrict="µ{BIN_OS_RESTRICT[$i]}"

    # OS-Filter: leer = beide Systeme, sonst kommagetrennte Liste.
    if [ -n "$os_restrict" ]; then
      case ",$os_restrict," in
        *",$OS,"*) : ;;
        *) i=$((i + 1)); continue ;;
      esac
    fi

    # Nur installieren, wenn Binary zur gewählten Option gehört.
    local wanted_ok=0 w=""
    for w in "µ{wanted[@]}"; do
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
    fi
    i=$((i + 1))
  done
}

run_with_spinner "Installiere Binaries" install_binaries

# ============================================================
# Shell-RC-Datei bestimmen
# ============================================================
detect_shell_rc() {
  local shell_name
  shell_name="$(basename "µ{SHELL:-bash}")"
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
RC_START="# >>> $APP_NAME installer >>>"
RC_END="# <<< $APP_NAME installer <<<"

# ============================================================
# PATH + Environment-Variablen in EINEM Marker-Block schreiben.
# Ein bestehender Block wird ersetzt -> idempotent, und ein
# geänderter --prefix wird sauber übernommen.
# ============================================================
configure_shell() {
  local block=""
  block="export PATH=\"$INSTALL_PREFIX/bin:\$PATH\""

  local i=0
  local total=µ{#ENV_NAMES[@]}
  while [ "$i" -lt "$total" ]; do
    local name="µ{ENV_NAMES[$i]}"
    local value="µ{ENV_VALUES[$i]}"
    local os_restrict="µ{ENV_OS_RESTRICT[$i]}"
    local append="µ{ENV_APPEND[$i]}"

    if [ -n "$os_restrict" ]; then
      case ",$os_restrict," in
        *",$OS,"*) : ;;
        *) i=$((i + 1)); continue ;;
      esac
    fi

    # $INSTALL_PREFIX existiert in der RC-Datei nicht -> jetzt einsetzen.
    local p1='$INSTALL_PREFIX' p2='µ{INSTALL_PREFIX}'
    value="µ{value//$p2/$INSTALL_PREFIX}"
    value="µ{value//$p1/$INSTALL_PREFIX}"

    local line
    if [ "$append" = "1" ]; then
      line='export '"$name"'="'"$value"'µ{'"$name"':+:$'"$name"'}"'
    else
      line='export '"$name"'="'"$value"'"'
    fi
    block="$block"$'\n'"$line"
    i=$((i + 1))
  done

  local tmp
  tmp="$(mktemp)"
  awk -v s="$RC_START" -v e="$RC_END" \
    '$0==s{skip=1;next} $0==e{skip=0;next} !skip' "$RC_FILE" > "$tmp"
  {
    cat "$tmp"
    echo ""
    echo "$RC_START"
    echo "$block"
    echo "$RC_END"
  } > "$RC_FILE"
  rm -f "$tmp"
}

run_with_spinner "Aktualisiere PATH/ENV in $RC_FILE" configure_shell

# ============================================================
# Fertig
# ============================================================
echo ""
ok "$APP_NAME $APP_VERSION wurde installiert nach: $INSTALL_PREFIX/bin"
log "Installiert: µ{SELECTED_BINARIES_CSV//,/, }"
log "Starte eine neue Shell oder führe aus: source $RC_FILE"
if [ -n "$APP_HOMEPAGE" ]; then
  log "Mehr Infos: $APP_HOMEPAGE"
fi
`.replace(/µ\{/g, () => "${");

// ---------------------------------------------------------------------------
// Beispiel-Konfiguration (nur zur Illustration, nicht Teil des Exports)
// ---------------------------------------------------------------------------
/*
const config: InstallerConfig = {
  appName: "mytool",
  version: "2.3.1",
  homepage: "https://github.com/example/mytool",
  versionMode: "fixed", // "latest" | "tags" möglich (GitHub-URLs werden aus homepage abgeleitet)
  archive: {
    url: "https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz",
    type: "tar.gz",
  },
  binaries: [
    { archivePath: "bin/mytool", targetName: "mytool" },
    { archivePath: "bin/mytool-helper", targetName: "mytool-helper" },
    { archivePath: "bin/mytool-gui.app/Contents/MacOS/mytool-gui", targetName: "mytool-gui", os: ["darwin"] },
    { archivePath: "bin/mytool-daemon", targetName: "mytool-daemon", os: ["linux"] },
  ],
  envVars: [
    { name: "MYTOOL_HOME", value: "$INSTALL_PREFIX" },
    { name: "MANPATH", value: "$INSTALL_PREFIX/share/man", append: true },
  ],
  installOptions: [
    { id: "full", label: "Vollständig", description: "Alle Komponenten inkl. GUI/Daemon", binaries: ["mytool", "mytool-helper", "mytool-gui", "mytool-daemon"] },
    { id: "minimal", label: "Minimal", description: "Nur die CLI", binaries: ["mytool"] },
  ],
  animations: true,
};

writeInstallerScript(config, "./dist/install.sh");
*/
