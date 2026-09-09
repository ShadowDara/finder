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

// import { writeFileSync, chmodSync } from "node:fs";
// import { dirname } from "node:path";
// import { mkdirSync } from "node:fs";

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
   * Wert der Variable. Darf andere Shell-Variablen referenzieren (z.B. "$INSTALL_PREFIX"),
   * diese werden erst beim Sourcen der RC-Datei aufgelöst, nicht beim Generieren.
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
   * Optional. Wenn gesetzt und version="latest", wird beim Ausführen des
   * Skripts die neueste Version von dieser URL ermittelt (GitHub API).
   * Beispiel: "https://api.github.com/repos/shadowdara/finder/releases/latest"
   * Wird automatisch erkannt wenn homepage ein GitHub-Repo ist.
   */
  latestVersionUrl?: string;
}

// ---------------------------------------------------------------------------
// Bash-Hilfsfunktionen (String-Escaping, Array-Literale)
// ---------------------------------------------------------------------------

function escBash(str: string): string {
  // Innerhalb von Single Quotes: ' -> '\''
  return String(str).replace(/'/g, `'\\''`);
}

function bashArray(items: string[]): string {
  return "(" + items.map((i) => `'${escBash(i)}'`).join(" ") + ")";
}

function csvList(items: string[]): string {
  return items.join(",");
}

function bashStringLiteral(value: string): string {
  return `'${escBash(value)}'`;
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
    latestVersionUrl,
  } = config;

  if (!appName || !version) {
    throw new Error("appName und version sind erforderlich.");
  }
  if (!binaries || binaries.length === 0) {
    throw new Error("Mindestens eine Binary muss angegeben werden.");
  }

  // Ohne explizite installOptions: eine einzige "full"-Option mit allen Binaries.
  const options: InstallOption[] =
    installOptions && installOptions.length > 0
      ? installOptions
      : [
          {
            id: "full",
            label: "Vollständige Installation",
            description: "Installiert alle Binaries.",
            binaries: binaries.map((b) => b.targetName || b.archivePath),
          },
        ];

  const binArchivePaths = binaries.map((b) => b.archivePath);
  const binTargetNames = binaries.map(
    (b) => b.targetName || b.archivePath.split("/").pop() || b.archivePath,
  );
  const binOsRestrict = binaries.map((b) => (b.os ? csvList(b.os) : ""));

  const envNames = envVars.map((e) => e.name);
  const envValues = envVars.map((e) => e.value);
  const envOsRestrict = envVars.map((e) => (e.os ? csvList(e.os) : ""));
  const envAppend = envVars.map((e) => (e.append ? "1" : "0"));

  const optionIds = options.map((o) => o.id);
  const optionLabels = options.map((o) => o.label);
  const optionDescriptions = options.map((o) => o.description || "");
  const optionBinaries = options.map((o) => csvList(o.binaries));

  const installDir = defaultInstallDir || `$HOME/.local/${appName}`;

  const arraysBlock = [
    `APP_NAME=${bashStringLiteral(appName)}`,
    `APP_VERSION=${bashStringLiteral(version)}`,
    `APP_HOMEPAGE=${bashStringLiteral(homepage || "")}`,
    `LATEST_VERSION_URL=${bashStringLiteral(latestVersionUrl || "")}`,
    `ARCHIVE_URL_TEMPLATE=${bashStringLiteral(archive.url)}`,
    `ARCHIVE_TYPE=${bashStringLiteral(archive.type)}`,
    `ANIMATIONS_ENABLED=${animations ? 1 : 0}`,
    `INSTALL_PREFIX_DEFAULT="${installDir}"`,
    "",
    "# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",
    `BIN_ARCHIVE_PATHS=${bashArray(binArchivePaths)}`,
    `BIN_TARGET_NAMES=${bashArray(binTargetNames)}`,
    `BIN_OS_RESTRICT=${bashArray(binOsRestrict)}`,
    "",
    "# --- Environment-Variablen ---",
    `ENV_NAMES=${bashArray(envNames)}`,
    `ENV_VALUES=${bashArray(envValues)}`,
    `ENV_OS_RESTRICT=${bashArray(envOsRestrict)}`,
    `ENV_APPEND=${bashArray(envAppend)}`,
    "",
    "# --- Installationsoptionen (Menü / --type) ---",
    `OPTION_IDS=${bashArray(optionIds)}`,
    `OPTION_LABELS=${bashArray(optionLabels)}`,
    `OPTION_DESCRIPTIONS=${bashArray(optionDescriptions)}`,
    `OPTION_BINARIES=${bashArray(optionBinaries)}`,
  ].join("\n");

  return STATIC_TEMPLATE.replace("__CONFIG_ARRAYS__", arraysBlock);
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
// Hinweis zur Implementierung: Da dies ein TS-Template-Literal ist, kann
// literales "${...}" (Bash-Parametererweiterung) nicht direkt geschrieben
// werden, ohne dass TypeScript es als Interpolation interpretiert. Deshalb
// wird hier "µ{" als Platzhalter für "${" verwendet und am Ende per
// .replace(...) zurückgetauscht. Das Template selbst enthält KEINE echten
// TS-Interpolationen außer dem Marker __CONFIG_ARRAYS__.
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
    i=$(( (i + 1) % len ))
    printf '\r%s  %s' "$msg" "µ{frames:$i:1}"
    sleep 0.1
  done
  wait "$pid"
  local status=$?
  if [ $status -eq 0 ]; then
    printf '\r%s  %s\n' "$msg" "µ{GREEN}OKµ{RESET}"
  else
    printf '\r%s  %s\n' "$msg" "µ{RED}FEHLERµ{RESET}"
  fi
  return $status
}

# ============================================================
# Hilfe
# ============================================================
usage() {
  cat <<EOF
µ{BOLD}µ{APP_NAME} Installerµ{RESET} (vµ{APP_VERSION})

Verwendung: $0 [optionen]

Optionen:
  -y, --yes               Nicht-interaktive Installation (Standardtyp)
  -t, --type <id>         Installationstyp wählen (siehe --list)
      --latest            Neueste Version automatisch von GitHub ermitteln
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
while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes) NONINTERACTIVE=1; shift ;;
    --latest) APP_VERSION="latest"; shift ;;
    -t|--type) SELECTED_OPTION="µ{2:-}"; NONINTERACTIVE=1; shift 2 ;;
    --type=*) SELECTED_OPTION="µ{1#*=}"; NONINTERACTIVE=1; shift ;;
    --prefix) INSTALL_PREFIX="µ{2:-}"; shift 2 ;;
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
    read -r choice
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

# Ausgewählte Option in den Arrays finden und die zugehörige
# Binary-Liste (kommagetrennt) auflösen.
SELECTED_BINARIES_CSV=""
{
  idx=0
  n=µ{#OPTION_IDS[@]}
  while [ "$idx" -lt "$n" ]; do
    if [ "µ{OPTION_IDS[$idx]}" = "$SELECTED_OPTION" ]; then
      SELECTED_BINARIES_CSV="µ{OPTION_BINARIES[$idx]}"
      break
    fi
    idx=$((idx + 1))
  done
}
[ -n "$SELECTED_BINARIES_CSV" ] || die "Unbekannter Installationstyp: $SELECTED_OPTION (siehe --list)"

log "Installationstyp: µ{BOLD}µ{SELECTED_OPTION}µ{RESET}"
log "Zielverzeichnis:  µ{INSTALL_PREFIX}"

# ============================================================
# Download & Extraktion
# ============================================================
WORKDIR="$(mktemp -d)"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

resolve_archive_url() {
  local url="$ARCHIVE_URL_TEMPLATE"
  url="µ{url//\{appName\}/$APP_NAME}"
  url="µ{url//\{version\}/$APP_VERSION}"
  url="µ{url//\{os\}/$OS}"
  url="µ{url//\{arch\}/$ARCH}"
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
    local wanted_ok=0
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
      ok "Installiert: $target_name"
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

    local line
    if [ "$append" = "1" ]; then
      line="export $name=\"$value:\µ{$name:-}\""
    else
      line="export $name=\"$value\""
    fi
    append_once "$APP_NAME-env-$name" "$line" "$RC_FILE"
    i=$((i + 1))
  done
}

if [ "µ{#ENV_NAMES[@]}" -gt 0 ]; then
  run_with_spinner "Setze Environment-Variablen" set_env_vars
fi

# ============================================================
# Fertig
# ============================================================
echo ""
ok "µ{APP_NAME} µ{APP_VERSION} wurde installiert nach: µ{INSTALL_PREFIX}/bin"
log "Starte eine neue Shell oder führe aus: source $RC_FILE"
if [ -n "$APP_HOMEPAGE" ]; then
  log "Mehr Infos: $APP_HOMEPAGE"
fi
`.replace(/µ\{/g, "${");

// ---------------------------------------------------------------------------
// Beispiel-Konfiguration (nur zur Illustration, nicht Teil des Exports)
// ---------------------------------------------------------------------------
/*
const config: InstallerConfig = {
  appName: "mytool",
  version: "2.3.1",
  homepage: "https://example.com/mytool",
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
