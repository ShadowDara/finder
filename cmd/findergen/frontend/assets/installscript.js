import{j as e,F as z}from"./main_entry.js";function F(n){return String(n).replace(/'/g,"'\\''")}function m(n){return`'${F(n)}'`}function E(n){return"("+n.map(m).join(" ")+")"}function N(n){return n.join(",")}function H(n){return String(n).replace(/[\\"`]/g,"\\$&")}function K(n){const t=n==null?void 0:n.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/i);if(t)return`https://api.github.com/repos/${t[1]}/${t[2].replace(/\.git$/,"")}`}function X(n){const{appName:t,version:a,archive:r,binaries:l,envVars:c=[],installOptions:o,defaultInstallDir:d,animations:h=!0,homepage:f,versionMode:p="fixed"}=n;if(!t||!a)throw new Error("appName und version sind erforderlich.");if(!l||l.length===0)throw new Error("Mindestens eine Binary muss angegeben werden.");const g=l.map(s=>s.targetName||s.archivePath.split("/").pop()||s.archivePath),I=l.map(s=>s.archivePath),u=l.map(s=>s.os?N(s.os):""),v=o&&o.length>0?o:[{id:"full",label:"Vollständige Installation",description:"Installiert alle Binaries.",binaries:g}],_=new Set;for(const s of v){if(_.has(s.id))throw new Error(`Doppelte Option-ID: ${s.id}`);if(_.add(s.id),/[,\s]/.test(s.id))throw new Error(`Ungültige Option-ID: "${s.id}"`);for(const A of s.binaries)if(!g.includes(A)&&!I.includes(A))throw new Error(`Option "${s.id}" referenziert unbekannte Binary: "${A}"`)}const L=K(f),b=n.latestVersionUrl??(L?`${L}/releases/latest`:""),w=n.tagsUrl??(b.endsWith("/releases/latest")?b.replace(/\/releases\/latest$/,"/tags"):b);if((p==="latest"||p==="fixed"&&a==="latest")&&!b)throw new Error("Für 'latest' wird latestVersionUrl (oder eine GitHub-homepage) benötigt.");if(p==="tags"&&!w)throw new Error("Für versionMode 'tags' wird tagsUrl/latestVersionUrl (oder eine GitHub-homepage) benötigt.");const U=d||`$HOME/.local/${t}`,M=[`APP_NAME=${m(t)}`,`APP_VERSION=${m(a)}`,`APP_HOMEPAGE=${m(f||"")}`,`LATEST_VERSION_URL=${m(b)}`,`TAGS_URL=${m(w)}`,`VERSION_MODE=${m(p)}`,`ARCHIVE_URL_TEMPLATE=${m(r.url)}`,`ARCHIVE_TYPE=${m(r.type)}`,`ANIMATIONS_ENABLED=${h?1:0}`,`INSTALL_PREFIX_DEFAULT="${H(U)}"`,"","# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",`BIN_ARCHIVE_PATHS=${E(I)}`,`BIN_TARGET_NAMES=${E(g)}`,`BIN_OS_RESTRICT=${E(u)}`,"","# --- Environment-Variablen ---",`ENV_NAMES=${E(c.map(s=>s.name))}`,`ENV_VALUES=${E(c.map(s=>s.value))}`,`ENV_OS_RESTRICT=${E(c.map(s=>s.os?N(s.os):""))}`,`ENV_APPEND=${E(c.map(s=>s.append?"1":"0"))}`,"","# --- Installationsoptionen (Menü / --type) ---",`OPTION_IDS=${E(v.map(s=>s.id))}`,`OPTION_LABELS=${E(v.map(s=>s.label))}`,`OPTION_DESCRIPTIONS=${E(v.map(s=>s.description||""))}`,`OPTION_BINARIES=${E(v.map(s=>N(s.binaries)))}`].join(`
`);return G.replace("__CONFIG_ARRAYS__",()=>M)}const G=String.raw`#!/usr/bin/env bash
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
`.replace(/µ\{/g,()=>"${");class $ extends Error{}function O(n){const t=String(n).trim(),a=document.createElement("template");a.innerHTML=t;const r=a.content.firstElementChild;if(!r)throw new Error("Konnte Element nicht erzeugen: "+t);return r}function i(n,t){const a=n.querySelector(t);if(!a)throw new Error(`Element nicht gefunden: ${t}`);return a}function y(n){return e("div",{class:"field narrow"},e("span",null,"OS"),e("div",{class:"os-chips"},e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-linux`})," linux"),e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-darwin`})," macOS")))}function V(n,t){const a=i(n,`[name="${t}-linux"]`).checked,r=i(n,`[name="${t}-darwin"]`).checked;if(a&&!r)return["linux"];if(r&&!a)return["darwin"]}function P(n,t){const a=n.getAttribute("data-os-prefix")||"",r=t&&t.length===1?t[0]:void 0;i(n,`[name="${a}-linux"]`).checked=r==="linux",i(n,`[name="${a}-darwin"]`).checked=r==="darwin"}function W(n){const t=n.trim().match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/#?\s]+)/i);return t?`https://api.github.com/repos/${t[1]}/${t[2].replace(/\.git$/i,"")}`:null}function S(n="",t=""){const a=O(e("div",{class:"row","data-kind":"binary"},e("label",{class:"field wide"},e("span",null,"Pfad im Archiv"),e("input",{type:"text",class:"bin-path",placeholder:"bin/mytool"})),e("label",{class:"field"},e("span",null,"Zielname (optional)"),e("input",{type:"text",class:"bin-target",placeholder:"mytool"})),y("bin-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return i(a,".bin-path").value=n,i(a,".bin-target").value=t,B(a,"bin-os"),R(a,"binary"),a}function C(){const n=O(e("div",{class:"row","data-kind":"env"},e("label",{class:"field"},e("span",null,"Name"),e("input",{type:"text",class:"env-name",placeholder:"MYTOOL_HOME"})),e("label",{class:"field wide"},e("span",null,"Wert"),e("input",{type:"text",class:"env-value",placeholder:"$INSTALL_PREFIX"})),e("label",{class:"append-chip"},e("input",{type:"checkbox",class:"env-append"})," anhängen"),y("env-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return B(n,"env-os"),R(n,"env"),n}function x(){const n=O(e("div",{class:"row","data-kind":"option"},e("label",{class:"field narrow"},e("span",null,"ID"),e("input",{type:"text",class:"opt-id",placeholder:"minimal"})),e("label",{class:"field"},e("span",null,"Label"),e("input",{type:"text",class:"opt-label",placeholder:"Minimal"})),e("label",{class:"field wide"},e("span",null,"Beschreibung"),e("input",{type:"text",class:"opt-desc",placeholder:"Nur die CLI"})),e("label",{class:"field wide"},e("span",null,"Enthaltene Binaries (Zielnamen, kommagetrennt)"),e("input",{type:"text",class:"opt-binaries",placeholder:"mytool"})),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return R(n,"option"),n}let Z=0;function B(n,t){const a=`${t}-${Z++}`;i(n,`[name="${t}-linux"]`).name=`${a}-linux`,i(n,`[name="${t}-darwin"]`).name=`${a}-darwin`,n.setAttribute("data-os-prefix",a)}function R(n,t){i(n,".btn-remove").addEventListener("click",()=>{const r=n.parentElement;if(r){if(t==="binary"&&r.children.length<=1){i(n,".bin-path").value="",i(n,".bin-target").value="";return}n.remove()}})}function j(n){const t=Array.from(n.querySelectorAll('[data-kind="binary"]')),a=[];for(const r of t){const l=i(r,".bin-path").value.trim();if(!l)continue;const c=i(r,".bin-target").value.trim(),o=r.getAttribute("data-os-prefix")||"bin-os",d=V(r,o);a.push({archivePath:l,targetName:c||void 0,os:d})}return a}function Y(n){const t=Array.from(n.querySelectorAll('[data-kind="env"]')),a=[];for(const r of t){const l=i(r,".env-name").value.trim();if(!l)continue;if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(l))throw new $(`Ungültiger Variablenname "${l}" (erlaubt: Buchstaben, Ziffern, _).`);const c=i(r,".env-value").value.trim(),o=i(r,".env-append").checked,d=r.getAttribute("data-os-prefix")||"env-os",h=V(r,d);a.push({name:l,value:c,append:o||void 0,os:h})}return a}function q(n){const t=Array.from(n.querySelectorAll('[data-kind="option"]')),a=[];for(const r of t){const l=i(r,".opt-id").value.trim();if(!l)continue;const c=i(r,".opt-label").value.trim()||l,o=i(r,".opt-desc").value.trim(),h=i(r,".opt-binaries").value.trim().split(",").map(f=>f.trim()).filter(Boolean);if(h.length===0)throw new $(`Installationsoption "${l}" braucht mindestens eine Binary in der Liste.`);a.push({id:l,label:c,description:o||void 0,binaries:h})}return a}function k(n){const t=n.appName.value.trim();if(!t)throw new $("App-Name fehlt. Ohne Namen kann kein Skript entstehen.");if(!/^[A-Za-z0-9._-]+$/.test(t))throw new $("App-Name darf nur Buchstaben, Ziffern, '.', '_' und '-' enthalten.");const a=n.archiveUrl.value.trim();if(!a)throw new $("Die Archiv-URL fehlt.");const r=j(n.binariesContainer);if(r.length===0)throw new $("Mindestens eine Binary wird gebraucht (Pfad im Archiv angeben).");const l=Y(n.envContainer),c=q(n.optionsContainer),o=n.versionMode.value,d=n.version.value.trim(),h=n.latestVersionUrl.value.trim()||void 0,f=n.tagsVersionUrl.value.trim()||void 0;let p;if(o==="fixed"){if(!d)throw new $("Version fehlt. Trag z.B. 1.0.0 ein.");p=d}else p="latest";return{appName:t,version:p,versionMode:o,homepage:n.homepage.value.trim()||void 0,latestVersionUrl:h,tagsUrl:f,archive:{url:a,type:n.archiveType.value},binaries:r,envVars:l.length>0?l:void 0,installOptions:c.length>0?c:void 0,defaultInstallDir:n.installDir.value.trim()||void 0,animations:n.animations.checked}}function J(n){const t=new TextEncoder().encode(n);let a="";return t.forEach(r=>a+=String.fromCharCode(r)),btoa(a)}function Q(n){const t=atob(n.trim()),a=Uint8Array.from(t,r=>r.charCodeAt(0));return new TextDecoder().decode(a)}function D(n){return J(JSON.stringify(n))}function ee(n){const t=n.trim();if(!t)throw new $("Kein Base64-String eingefügt.");const a=t.lastIndexOf("#$$$"),r=a!==-1?t.slice(a+4).trim():t;let l;try{l=Q(r)}catch{throw new $("Ungültiger Base64-String.")}let c;try{c=JSON.parse(l)}catch{throw new $("Ungültiges JSON im Base64-String.")}if(!c||typeof c!="object"||Array.isArray(c))throw new $("Ungültiges JSON im Base64-String.");return c}function ne(n){return X(n)+`
# Base64 of the input values for the generator
# so you dont have to type it all again
#
#$$$`+D(n)+`
`}function T(n){n.innerHTML=""}function te(n,t){var l,c;const a=n.versionMode??(n.version==="latest"?"latest":"fixed");t.appName.value=n.appName||"",t.version.value=n.version&&n.version!=="latest"?n.version:"",t.homepage.value=n.homepage||"",t.archiveUrl.value=((l=n.archive)==null?void 0:l.url)||"",t.archiveType.value=((c=n.archive)==null?void 0:c.type)||"tar.gz",t.installDir.value=n.defaultInstallDir||"",t.animations.checked=n.animations??!0,a==="tags"&&!n.tagsUrl?(t.tagsVersionUrl.value=n.latestVersionUrl||"",t.latestVersionUrl.value=""):(t.latestVersionUrl.value=n.latestVersionUrl||"",t.tagsVersionUrl.value=n.tagsUrl||""),t.versionMode.value=a,t.versionMode.dispatchEvent(new Event("change")),T(t.binariesContainer);const r=Array.isArray(n.binaries)?n.binaries:[];if(r.length===0)t.binariesContainer.appendChild(S("",""));else for(const o of r){const d=S(o.archivePath||"",o.targetName||"");P(d,o.os),t.binariesContainer.appendChild(d)}T(t.envContainer);for(const o of Array.isArray(n.envVars)?n.envVars:[]){const d=C();i(d,".env-name").value=o.name||"",i(d,".env-value").value=o.value||"",i(d,".env-append").checked=!!o.append,P(d,o.os),t.envContainer.appendChild(d)}T(t.optionsContainer);for(const o of Array.isArray(n.installOptions)?n.installOptions:[]){const d=x();i(d,".opt-id").value=o.id||"",i(d,".opt-label").value=o.label||"",i(d,".opt-desc").value=o.description||"",i(d,".opt-binaries").value=(o.binaries||[]).join(", "),t.optionsContainer.appendChild(d)}}function ae(n){n.innerHTML=e(z,null,e("div",{class:"runner"},e("span",null,e("a",{href:"../../"},"HOME")),e("span",null,"INSTALLER-MAKER(1)"),e("span",null,"Installer Generator"),e("span",null,"INSTALLER-MAKER(1)")),e("div",{class:"intro"},e("h1",null,"Baue dir dein install.sh"),e("p",null,"Trag deine App, das Release-Archiv und die enthaltenen Binaries ein. Daraus entsteht ein einzelnes Bash-Skript für Linux und macOS, das herunterlädt, entpackt, in den PATH einträgt und optional zwischen Installationsarten wählen lässt. Alles läuft nur in diesem Browser, es wird nichts hochgeladen.")),e("section",{class:"card"},e("h2",null,"Name"),e("p",{class:"hint"},"Wie deine App heißt und wo sie herkommt."),e("div",{class:"field-grid"},e("label",{class:"field"},e("span",null,"App-Name"),e("input",{type:"text",id:"appName",placeholder:"mytool"})),e("label",{class:"field"},e("span",null,"Homepage (optional)"),e("input",{type:"text",id:"homepage",placeholder:"https://example.com/mytool"})))),e("section",{class:"card"},e("h2",null,"Version"),e("p",{class:"hint"},"Bei einer GitHub-Homepage werden die API-URLs automatisch vorgeschlagen."),e("div",{class:"field-grid"},e("label",{class:"field wide"},e("span",null,"Version-Modus"),e("select",{id:"versionMode"},e("option",{value:"fixed"},"Feste Version"),e("option",{value:"latest"},"Neueste Release-Version"),e("option",{value:"tags"},"Aus GitHub Tags auswählen"))),e("label",{class:"field wide"},e("span",null,"Version"),e("input",{type:"text",id:"version",placeholder:"1.0.0"})),e("label",{class:"field wide",id:"latestSection"},e("span",null,"GitHub API URL (latest)"),e("input",{type:"text",id:"latestVersionUrl",placeholder:"https://api.github.com/repos/<owner>/<repo>/releases/latest"})),e("label",{class:"field wide",id:"tagsSection",style:"display:none;"},e("span",null,"GitHub API URL (tags)"),e("input",{type:"text",id:"tagsVersionUrl",placeholder:"https://api.github.com/repos/<owner>/<repo>/tags?per_page=100"})))),e("section",{class:"card"},e("h2",null,"Archiv"),e("p",{class:"hint"},"Platzhalter ","{appName}"," ","{version}"," ","{os}"," ","{arch}",' werden beim Installieren aufgelöst, z.B. zu "mytool-darwin-arm64".'),e("div",{class:"field-grid"},e("label",{class:"field wide"},e("span",null,"Archiv-URL-Template"),e("input",{type:"text",id:"archiveUrl",placeholder:"https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"})),e("label",{class:"field"},e("span",null,"Archivtyp"),e("select",{id:"archiveType"},e("option",{value:"tar.gz"},"tar.gz"),e("option",{value:"zip"},"zip"))),e("label",{class:"field wide"},e("span",null,"Zielverzeichnis (optional)"),e("input",{type:"text",id:"installDir",placeholder:"$HOME/.local/mytool"})))),e("section",{class:"card"},e("h2",null,"Binaries"),e("p",{class:"hint"},"Pfad, wie die Datei im entpackten Archiv heißt. OS leer lassen = auf beiden Systemen installieren."),e("div",{id:"binariesContainer"}),e("button",{type:"button",class:"btn-add",id:"addBinary"},"+ Binary hinzufügen")),e("section",{class:"card"},e("h2",null,"Environment"),e("p",{class:"hint"},"Optionale Umgebungsvariablen für die Shell-RC-Datei. $INSTALL_PREFIX wird beim Installieren durch das echte Zielverzeichnis ersetzt."),e("div",{id:"envContainer"}),e("button",{type:"button",class:"btn-add",id:"addEnv"},"+ Variable hinzufügen")),e("section",{class:"card"},e("h2",null,"Installationsoptionen"),e("p",{class:"hint"},"Optional. Ohne Eintrag gibt es genau eine Installation mit allen Binaries. Mit Einträgen erscheint ein Auswahlmenü (oder --type <id>)."),e("div",{id:"optionsContainer"}),e("button",{type:"button",class:"btn-add",id:"addOption"},"+ Option hinzufügen")),e("div",{class:"actions"},e("label",{class:"checkbox-field"},e("input",{type:"checkbox",id:"animations",checked:!0})," Ladeanimation im Skript"),e("label",{class:"checkbox-field"},e("input",{type:"checkbox",id:"useLatest"})," Neueste Version verwenden (latest)"),e("button",{type:"button",class:"btn-primary",id:"generate"},"install.sh generieren")),e("section",{class:"card"},e("h2",null,"Konfiguration speichern / laden"),e("p",{class:"hint"},"Exportiert alle Felder als Base64-kodierten JSON-String (UTF-8 sicher) oder lädt sie daraus wieder zurück."),e("label",{class:"field wide"},e("span",null,"Base64 (Import / Export)"),e("textarea",{id:"b64Field",rows:"3",spellcheck:"false",placeholder:"Paste einen Base64-String hier ein und klicke auf Import"})),e("div",{class:"actions"},e("button",{type:"button",class:"btn-term",id:"importB64"},"Importieren"),e("button",{type:"button",class:"btn-term",id:"exportB64"},"Exportieren"),e("button",{type:"button",class:"btn-term",id:"clearB64"},"Feld leeren"))),e("div",{class:"error-banner",id:"errorBanner"}),e("div",{class:"output"},e("h2",null,"Vorschau"),e("div",{class:"terminal"},e("div",{class:"terminal-bar"},e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"path"},"~/install.sh")),e("div",{id:"outputBody"},e("div",{class:"output-empty"},"Noch nichts generiert",e("span",{class:"cursor"}))),e("div",{class:"terminal-actions",id:"terminalActions",style:"display:none;"},e("button",{type:"button",class:"btn-term",id:"downloadBtn"},"Herunterladen"),e("button",{type:"button",class:"btn-term",id:"copyBtn"},"Kopieren")))),e("section",{class:"card"},e("h2",null,"Verwendung / Tipps"),e("p",{class:"hint"},"So führst du das generierte Skript aus und was es dabei tut. Das Skript braucht bash (nicht sh/dash), da es Arrays und Here-Strings nutzt."),e("h3",null,"Ausführen"),e("p",null,"Nach dem Generieren kannst du das Skript direkt im Terminal ausführen. Am einfachsten mit:"),e("pre",null,e("code",null,"bash install.sh")),e("p",null,"Oder erst ausführbar machen und dann starten (Linux/macOS):"),e("pre",null,e("code",null,`chmod +x install.sh
./install.sh`)),e("p",null,"Das Skript lädt das passende Archiv für dein System (Linux/macOS und Architektur) herunter, entpackt es und installiert die Binaries nach"," ",e("code",null,"$HOME/.local/<app>/bin"),". Anschließend trägt es diesen Ordner in den PATH deiner Shell-RC ein (z.B."," ",e("code",null,"~/.bashrc")," oder ",e("code",null,"~/.zshrc"),"). Mehrfaches Ausführen ist sicher: der Eintrag in der RC-Datei wird ersetzt, nicht dupliziert."),e("h3",null,"Nach der Installation"),e("p",null,"Damit der PATH-Update wirkt, starte eine neue Shell oder lade deine Konfiguration neu:"),e("pre",null,e("code",null,"source ~/.bashrc")),e("p",null,"Danach sollte der Befehl direkt verfügbar sein:"),e("pre",null,e("code",null,"<app> --help")),e("h3",null,"Installationstypen wählen"),e("p",null,"Wenn du mehrere Installationsoptionen (Install Options) eingetragen hast, fragt das Skript interaktiv nach, welche Variante installiert werden soll. Für eine automatisierte Installation kannst du den Typ direkt angeben:"),e("pre",null,e("code",null,"bash install.sh -t minimal")),e("p",null,"Alle verfügbaren Typen anzeigen:"),e("pre",null,e("code",null,"bash install.sh --list")),e("h3",null,"Versionen"),e("p",null,'Im Modus "Neueste Release-Version" ermittelt das Skript beim Ausführen die aktuellste Version über die GitHub-API. Im Modus "Tags" darfst du die Version aus einer Liste wählen. Beides lässt sich auch per Parameter erzwingen:'),e("pre",null,e("code",null,`bash install.sh --latest
bash install.sh --version v1.2.3`)),e("h3",null,"Zielverzeichnis ändern"),e("p",null,"Standard ist ",e("code",null,"$HOME/.local/<app>"),". Mit"," ",e("code",null,"--prefix")," kannst du ein anderes Ziel wählen:"),e("pre",null,e("code",null,"bash install.sh --prefix /opt/mein-app")),e("h3",null,"Ohne Ladeanimation"),e("p",null,"In Skripten oder CI-Umgebungen (ohne TTY) werden Animationen automatisch deaktiviert. Du kannst sie aber auch explizit abschalten:"),e("pre",null,e("code",null,"bash install.sh --no-animation")),e("h3",null,"Per curl direkt installieren"),e("p",null,"Wenn du das Skript irgendwo gehostet hast, kann man es direkt von dort ausführen, ohne es erst herunterzuladen:"),e("pre",null,e("code",null,"curl -fsSL https://example.com/install.sh | bash")),e("p",null,"Achtung: Bei dieser Variante läuft das Skript ohne TTY, also automatisch nicht-interaktiv (es wird der erste Installationstyp verwendet). Parameter gibst du so mit:"),e("pre",null,e("code",null,"curl -fsSL https://example.com/install.sh | bash -s -- --type minimal")),e("h3",null,"Konfiguration wiederherstellen"),e("p",null,"Das generierte Skript enthält am Ende einen Kommentar-Block mit der Konfiguration als Base64 (Markierung ",e("code",null,"#$$$"),'). Fügst du diesen Block (oder nur den Base64-String) oben im Feld "Konfiguration speichern / laden" ein und klickst auf "Importieren", werden alle Felder wiederhergestellt – so kannst du das Setup später erneut anpassen oder auf einem anderen Rechner weiterverwenden.')),e("footer",{class:"note"},"Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite."));const t={appName:i(n,"#appName"),version:i(n,"#version"),homepage:i(n,"#homepage"),archiveUrl:i(n,"#archiveUrl"),archiveType:i(n,"#archiveType"),installDir:i(n,"#installDir"),animations:i(n,"#animations"),useLatest:i(n,"#useLatest"),versionMode:i(n,"#versionMode"),latestVersionUrl:i(n,"#latestVersionUrl"),tagsVersionUrl:i(n,"#tagsVersionUrl"),binariesContainer:i(n,"#binariesContainer"),envContainer:i(n,"#envContainer"),optionsContainer:i(n,"#optionsContainer")},a=i(n,"#latestSection"),r=i(n,"#tagsSection");function l(){const u=t.versionMode.value;a.style.display=u==="latest"?"":"none",r.style.display=u==="tags"?"":"none",t.version.disabled=u!=="fixed",t.useLatest.checked=u==="latest"}t.versionMode.addEventListener("change",l),t.useLatest.addEventListener("change",()=>{t.versionMode.value=t.useLatest.checked?"latest":"fixed",l()}),l(),t.homepage.addEventListener("change",()=>{const u=W(t.homepage.value);u&&(t.latestVersionUrl.value.trim()||(t.latestVersionUrl.value=`${u}/releases/latest`),t.tagsVersionUrl.value.trim()||(t.tagsVersionUrl.value=`${u}/tags?per_page=100`))}),t.binariesContainer.appendChild(S("bin/mytool","mytool")),i(n,"#addBinary").addEventListener("click",()=>{t.binariesContainer.appendChild(S())}),i(n,"#addEnv").addEventListener("click",()=>{t.envContainer.appendChild(C())}),i(n,"#addOption").addEventListener("click",()=>{t.optionsContainer.appendChild(x())});const c=i(n,"#errorBanner"),o=i(n,"#outputBody"),d=i(n,"#terminalActions");let h="",f="install";function p(u){c.textContent=u instanceof Error?u.message:String(u),c.classList.add("visible")}function g(){c.textContent="",c.classList.remove("visible")}const I=i(n,"#b64Field");i(n,"#exportB64").addEventListener("click",()=>{g();try{I.value=D(k(t))}catch(u){p(u)}}),i(n,"#importB64").addEventListener("click",()=>{g();try{te(ee(I.value),t)}catch(u){p(u)}}),i(n,"#clearB64").addEventListener("click",()=>{I.value=""}),i(n,"#generate").addEventListener("click",()=>{g();try{const u=k(t);h=ne(u),f=u.appName,o.innerHTML=e("pre",null),i(o,"pre").textContent=h,d.style.display="flex"}catch(u){p(u)}}),i(n,"#downloadBtn").addEventListener("click",()=>{if(!h)return;const u=new Blob([h],{type:"text/x-shellscript"}),v=URL.createObjectURL(u),_=document.createElement("a");_.href=v,_.download=`${f||"install"}-install.sh`,document.body.appendChild(_),_.click(),_.remove(),URL.revokeObjectURL(v)}),i(n,"#copyBtn").addEventListener("click",()=>{h&&navigator.clipboard.writeText(h).catch(()=>{p("Kopieren hat nicht geklappt. Text lässt sich aus der Vorschau markieren.")})})}export{ae as default};
