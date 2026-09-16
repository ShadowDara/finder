import{a,j as e,F as K}from"./main_entry.js";function y(n){return String(n).replace(/'/g,"'\\''")}function m(n){return"("+n.map(t=>`'${y(t)}'`).join(" ")+")"}function w(n){return n.join(",")}function _(n){return`'${y(n)}'`}function G(n){const{appName:t,version:r,archive:l,binaries:c,envVars:p=[],installOptions:s,defaultInstallDir:o,animations:u=!0,homepage:f,latestVersionUrl:b}=n;if(!t||!r)throw new Error("appName und version sind erforderlich.");if(!c||c.length===0)throw new Error("Mindestens eine Binary muss angegeben werden.");const v=s&&s.length>0?s:[{id:"full",label:"Vollständige Installation",description:"Installiert alle Binaries.",binaries:c.map(h=>h.targetName||h.archivePath)}],T=c.map(h=>h.archivePath),g=c.map(h=>h.targetName||h.archivePath.split("/").pop()||h.archivePath),S=c.map(h=>h.os?w(h.os):""),N=p.map(h=>h.name),I=p.map(h=>h.value),d=p.map(h=>h.os?w(h.os):""),A=p.map(h=>h.append?"1":"0"),$=v.map(h=>h.id),z=v.map(h=>h.label),M=v.map(h=>h.description||""),U=v.map(h=>w(h.binaries)),H=o||`$HOME/.local/${t}`,F=[`APP_NAME=${_(t)}`,`APP_VERSION=${_(r)}`,`APP_HOMEPAGE=${_(f||"")}`,`LATEST_VERSION_URL=${_(b||"")}`,`ARCHIVE_URL_TEMPLATE=${_(l.url)}`,`ARCHIVE_TYPE=${_(l.type)}`,`ANIMATIONS_ENABLED=${u?1:0}`,`INSTALL_PREFIX_DEFAULT="${H}"`,"","# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",`BIN_ARCHIVE_PATHS=${m(T)}`,`BIN_TARGET_NAMES=${m(g)}`,`BIN_OS_RESTRICT=${m(S)}`,"","# --- Environment-Variablen ---",`ENV_NAMES=${m(N)}`,`ENV_VALUES=${m(I)}`,`ENV_OS_RESTRICT=${m(d)}`,`ENV_APPEND=${m(A)}`,"","# --- Installationsoptionen (Menü / --type) ---",`OPTION_IDS=${m($)}`,`OPTION_LABELS=${m(z)}`,`OPTION_DESCRIPTIONS=${m(M)}`,`OPTION_BINARIES=${m(U)}`].join(`
`);return W.replace("__CONFIG_ARRAYS__",F)}const W=String.raw`#!/usr/bin/env bash
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
`.replace(/µ\{/g,"${");class E extends Error{}function R(n){const t=String(n).trim(),r=document.createElement("template");r.innerHTML=t;const l=r.content.firstElementChild;if(!l)throw new Error("Konnte Element nicht erzeugen: "+t);return l}function i(n,t){const r=n.querySelector(t);if(!r)throw new Error(`Element nicht gefunden: ${t}`);return r}function P(n){return a("div",{class:"field narrow",children:[e("span",{children:"OS"}),a("div",{class:"os-chips",children:[a("label",{class:"os-chip",children:[e("input",{type:"checkbox",name:`${n}-linux`})," linux"]}),a("label",{class:"os-chip",children:[e("input",{type:"checkbox",name:`${n}-darwin`})," macOS"]})]})]})}function x(n,t){const r=i(n,`[name="${t}-linux"]`).checked,l=i(n,`[name="${t}-darwin"]`).checked;if(r&&!l)return["linux"];if(l&&!r)return["darwin"]}function O(n="",t=""){const r=R(a("div",{class:"row","data-kind":"binary",children:[a("label",{class:"field wide",children:[e("span",{children:"Pfad im Archiv"}),e("input",{type:"text",class:"bin-path",placeholder:"bin/mytool"})]}),a("label",{class:"field",children:[e("span",{children:"Zielname (optional)"}),e("input",{type:"text",class:"bin-target",placeholder:"mytool"})]}),P("bin-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen",children:"×"})]}));return i(r,".bin-path").value=n,i(r,".bin-target").value=t,B(r,"bin-os"),k(r,"binary"),r}function C(){const n=R(a("div",{class:"row","data-kind":"env",children:[a("label",{class:"field",children:[e("span",{children:"Name"}),e("input",{type:"text",class:"env-name",placeholder:"MYTOOL_HOME"})]}),a("label",{class:"field wide",children:[e("span",{children:"Wert"}),e("input",{type:"text",class:"env-value",placeholder:"$INSTALL_PREFIX"})]}),a("label",{class:"append-chip",children:[e("input",{type:"checkbox",class:"env-append"})," anhängen"]}),P("env-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen",children:"×"})]}));return B(n,"env-os"),k(n,"env"),n}function V(){const n=R(a("div",{class:"row","data-kind":"option",children:[a("label",{class:"field narrow",children:[e("span",{children:"ID"}),e("input",{type:"text",class:"opt-id",placeholder:"minimal"})]}),a("label",{class:"field",children:[e("span",{children:"Label"}),e("input",{type:"text",class:"opt-label",placeholder:"Minimal"})]}),a("label",{class:"field wide",children:[e("span",{children:"Beschreibung"}),e("input",{type:"text",class:"opt-desc",placeholder:"Nur die CLI"})]}),a("label",{class:"field wide",children:[e("span",{children:"Enthaltene Binaries (Zielnamen, kommagetrennt)"}),e("input",{type:"text",class:"opt-binaries",placeholder:"mytool"})]}),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen",children:"×"})]}));return k(n,"option"),n}let Y=0;function B(n,t){const r=`${t}-${Y++}`;i(n,`[name="${t}-linux"]`).name=`${r}-linux`,i(n,`[name="${t}-darwin"]`).name=`${r}-darwin`,n.setAttribute("data-os-prefix",r)}function k(n,t){i(n,".btn-remove").addEventListener("click",()=>{const l=n.parentElement;if(l){if(t==="binary"&&l.children.length<=1){i(n,".bin-path").value="",i(n,".bin-target").value="";return}n.remove()}})}function X(n){const t=Array.from(n.querySelectorAll('[data-kind="binary"]')),r=[];for(const l of t){const c=i(l,".bin-path").value.trim();if(!c)continue;const p=i(l,".bin-target").value.trim(),s=l.getAttribute("data-os-prefix")||"bin-os",o=x(l,s);r.push({archivePath:c,targetName:p||void 0,os:o})}return r}function q(n){const t=Array.from(n.querySelectorAll('[data-kind="env"]')),r=[];for(const l of t){const c=i(l,".env-name").value.trim();if(!c)continue;const p=i(l,".env-value").value.trim(),s=i(l,".env-append").checked,o=l.getAttribute("data-os-prefix")||"env-os",u=x(l,o);r.push({name:c,value:p,append:s||void 0,os:u})}return r}function Z(n){const t=Array.from(n.querySelectorAll('[data-kind="option"]')),r=[];for(const l of t){const c=i(l,".opt-id").value.trim();if(!c)continue;const p=i(l,".opt-label").value.trim()||c,s=i(l,".opt-desc").value.trim(),u=i(l,".opt-binaries").value.trim().split(",").map(f=>f.trim()).filter(Boolean);if(u.length===0)throw new E(`Installationsoption "${c}" braucht mindestens eine Binary in der Liste.`);r.push({id:c,label:p,description:s||void 0,binaries:u})}return r}function j(n){const t=n.appName.value.trim();if(!t)throw new E("App-Name fehlt. Ohne Namen kann kein Skript entstehen.");const r=n.useLatest.checked,l=n.version.value.trim();if(!r&&!l)throw new E("Version fehlt. Trag z.B. 1.0.0 ein.");const c=n.archiveUrl.value.trim();if(!c)throw new E("Die Archiv-URL fehlt.");const p=X(n.binariesContainer);if(p.length===0)throw new E("Mindestens eine Binary wird gebraucht (Pfad im Archiv angeben).");const s=q(n.envContainer),o=Z(n.optionsContainer);return{appName:t,version:r?"latest":l,homepage:n.homepage.value.trim()||void 0,latestVersionUrl:n.latestVersionUrl.value.trim()||void 0,archive:{url:c,type:n.archiveType.value},binaries:p,envVars:s.length>0?s:void 0,installOptions:o.length>0?o:void 0,defaultInstallDir:n.installDir.value.trim()||void 0,animations:n.animations.checked}}function J(n){const t=new TextEncoder().encode(n);let r="";return t.forEach(l=>r+=String.fromCharCode(l)),btoa(r)}function Q(n){const t=atob(n.trim()),r=Uint8Array.from(t,l=>l.charCodeAt(0));return new TextDecoder().decode(r)}function D(n){return J(JSON.stringify(n))}function ee(n){const t=n.trim();if(!t)throw new E("Kein Base64-String eingefügt.");const r=t.lastIndexOf("#$$$"),l=r!==-1?t.slice(r+4).trim():t;let c;try{c=Q(l)}catch{throw new E("Ungültiger Base64-String.")}let p;try{p=JSON.parse(c)}catch{throw new E("Ungültiges JSON im Base64-String.")}if(!p||typeof p!="object")throw new E("Ungültiges JSON im Base64-String.");return p}function ne(n){return G(n)+`
# Base64 of the input values for the generator
# so you dont have to type it all again
#
#$$$`+D(n)+`
`}function L(n){n.innerHTML=""}function ie(n,t){var c,p;const r=n.version==="latest";t.appName.value=n.appName||"",t.version.value=r?"":n.version||"",t.version.disabled=r,t.homepage.value=n.homepage||"",t.archiveUrl.value=((c=n.archive)==null?void 0:c.url)||"",t.archiveType.value=((p=n.archive)==null?void 0:p.type)||"tar.gz",t.installDir.value=n.defaultInstallDir||"",t.animations.checked=n.animations??!0,t.useLatest.checked=r,t.latestVersionUrl.value=n.latestVersionUrl||"";{const s=t.latestVersionUrl.closest("section");s&&(s.style.display=r?"":"none")}L(t.binariesContainer);const l=n.binaries||[];if(l.length===0)t.binariesContainer.appendChild(O("",""));else for(const s of l){const o=O(s.archivePath||"",s.targetName||""),u=o.getAttribute("data-os-prefix")||"";s.os&&s.os.length===1&&(i(o,`[name="${u}-linux"]`).checked=s.os[0]==="linux",i(o,`[name="${u}-darwin"]`).checked=s.os[0]==="darwin"),t.binariesContainer.appendChild(o)}L(t.envContainer);for(const s of n.envVars||[]){const o=C();i(o,".env-name").value=s.name||"",i(o,".env-value").value=s.value||"",i(o,".env-append").checked=!!s.append;const u=o.getAttribute("data-os-prefix")||"";s.os&&s.os.length===1&&(i(o,`[name="${u}-linux"]`).checked=s.os[0]==="linux",i(o,`[name="${u}-darwin"]`).checked=s.os[0]==="darwin"),t.envContainer.appendChild(o)}L(t.optionsContainer);for(const s of n.installOptions||[]){const o=V();i(o,".opt-id").value=s.id||"",i(o,".opt-label").value=s.label||"",i(o,".opt-desc").value=s.description||"",i(o,".opt-binaries").value=(s.binaries||[]).join(", "),t.optionsContainer.appendChild(o)}}function re(n){n.innerHTML=a(K,{children:[a("div",{class:"runner",children:[e("span",{children:e("a",{href:"../../",children:"HOME"})}),e("span",{children:"INSTALLER-MAKER(1)"}),e("span",{children:"Installer Generator"}),e("span",{children:"INSTALLER-MAKER(1)"})]}),a("div",{class:"intro",children:[e("h1",{children:"Baue dir dein install.sh"}),e("p",{children:"Trag deine App, das Release-Archiv und die enthaltenen Binaries ein. Daraus entsteht ein einzelnes Bash-Skript für Linux und macOS, das herunterlädt, entpackt, in den PATH einträgt und optional zwischen Installationsarten wählen lässt. Alles läuft nur in diesem Browser, es wird nichts hochgeladen."})]}),a("section",{class:"card",children:[e("h2",{children:"Name"}),e("p",{class:"hint",children:"Wie deine App heißt und wo sie herkommt."}),a("div",{class:"field-grid",children:[a("label",{class:"field",children:[e("span",{children:"App-Name"}),e("input",{type:"text",id:"appName",placeholder:"mytool"})]}),a("label",{class:"field",children:[e("span",{children:"Version"}),e("input",{type:"text",id:"version",placeholder:"1.0.0"})]}),a("label",{class:"field",children:[e("span",{children:"Homepage (optional)"}),e("input",{type:"text",id:"homepage",placeholder:"https://example.com/mytool"})]})]})]}),a("section",{class:"card",children:[e("h2",{children:"Archiv"}),a("p",{class:"hint",children:["Platzhalter ","{appName}"," ","{version}"," ","{os}"," ","{arch}",' werden beim Installieren aufgelöst, z.B. zu "mytool-darwin-arm64".']}),a("div",{class:"field-grid",children:[a("label",{class:"field wide",children:[e("span",{children:"Archiv-URL-Template"}),e("input",{type:"text",id:"archiveUrl",placeholder:"https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"})]}),a("label",{class:"field",children:[e("span",{children:"Archivtyp"}),a("select",{id:"archiveType",children:[e("option",{value:"tar.gz",children:"tar.gz"}),e("option",{value:"zip",children:"zip"})]})]}),a("label",{class:"field wide",children:[e("span",{children:"Zielverzeichnis (optional)"}),e("input",{type:"text",id:"installDir",placeholder:"$HOME/.local/mytool"})]})]})]}),a("section",{class:"card",children:[e("h2",{children:"Binaries"}),e("p",{class:"hint",children:"Pfad, wie die Datei im entpackten Archiv heißt. OS leer lassen = auf beiden Systemen installieren."}),e("div",{id:"binariesContainer"}),e("button",{type:"button",class:"btn-add",id:"addBinary",children:"+ Binary hinzufügen"})]}),a("section",{class:"card",children:[e("h2",{children:"Environment"}),e("p",{class:"hint",children:"Optionale Umgebungsvariablen für die Shell-RC-Datei."}),e("div",{id:"envContainer"}),e("button",{type:"button",class:"btn-add",id:"addEnv",children:"+ Variable hinzufügen"})]}),a("section",{class:"card",children:[e("h2",{children:"Installationsoptionen"}),e("p",{class:"hint",children:"Optional. Ohne Eintrag gibt es genau eine Installation mit allen Binaries. Mit Einträgen erscheint ein Auswahlmenü (oder --type <id>)."}),e("div",{id:"optionsContainer"}),e("button",{type:"button",class:"btn-add",id:"addOption",children:"+ Option hinzufügen"})]}),a("div",{class:"actions",children:[a("label",{class:"checkbox-field",children:[e("input",{type:"checkbox",id:"animations",checked:!0})," Ladeanimation im Skript"]}),a("label",{class:"checkbox-field",children:[e("input",{type:"checkbox",id:"useLatest"})," Neueste Version verwenden (latest)"]}),e("button",{type:"button",class:"btn-primary",id:"generate",children:"install.sh generieren"})]}),a("section",{class:"card",id:"latestSection",style:"display:none;",children:[e("h2",{children:"Neueste Version"}),e("p",{class:"hint",children:"Wenn aktiviert, wird beim Ausführen des Skripts die neueste Version automatisch von der API ermittelt. Das Skript muss dabei online sein."}),e("div",{class:"field-grid",children:a("label",{class:"field wide",children:[e("span",{children:"GitHub API URL (optional, wird erkannt wenn Homepage gesetzt)"}),e("input",{type:"text",id:"latestVersionUrl",placeholder:"https://api.github.com/repos/shadowdara/finder/releases/latest"})]})})]}),a("section",{class:"card",children:[e("h2",{children:"Konfiguration speichern / laden"}),e("p",{class:"hint",children:"Exportiert alle Felder als Base64-kodierten JSON-String (UTF-8 sicher) oder lädt sie daraus wieder zurück."}),a("label",{class:"field wide",children:[e("span",{children:"Base64 (Import / Export)"}),e("textarea",{id:"b64Field",rows:"3",spellcheck:"false",placeholder:"Paste einen Base64-String hier ein und klicke auf Import"})]}),a("div",{class:"actions",children:[e("button",{type:"button",class:"btn-term",id:"importB64",children:"Importieren"}),e("button",{type:"button",class:"btn-term",id:"exportB64",children:"Exportieren"}),e("button",{type:"button",class:"btn-term",id:"clearB64",children:"Feld leeren"})]})]}),e("div",{class:"error-banner",id:"errorBanner"}),a("div",{class:"output",children:[e("h2",{children:"Vorschau"}),a("div",{class:"terminal",children:[a("div",{class:"terminal-bar",children:[e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"path",children:"~/install.sh"})]}),e("div",{id:"outputBody",children:a("div",{class:"output-empty",children:["Noch nichts generiert",e("span",{class:"cursor"})]})}),a("div",{class:"terminal-actions",id:"terminalActions",style:"display:none;",children:[e("button",{type:"button",class:"btn-term",id:"downloadBtn",children:"Herunterladen"}),e("button",{type:"button",class:"btn-term",id:"copyBtn",children:"Kopieren"})]})]})]}),a("section",{class:"card",children:[e("h2",{children:"Verwendung / Tipps"}),e("p",{class:"hint",children:"So führst du das generierte Skript aus und was es dabei tut."}),e("h3",{children:"Ausführen"}),e("p",{children:"Nach dem Generieren kannst du das Skript direkt im Terminal ausführen. Am einfachsten mit:"}),e("pre",{children:e("code",{children:"sh install.sh"})}),e("p",{children:"Oder erst ausführbar machen und dann starten (Linux/macOS):"}),e("pre",{children:e("code",{children:"chmod +x install.sh ./install.sh"})}),a("p",{children:["Das Skript lädt das passende Archiv für dein System (Linux/macOS und Architektur) herunter, entpackt es und installiert die Binaries nach"," ",e("code",{children:"$HOME/.local/<app>/bin"}),". Anschließend trägt es diesen Ordner in den PATH deiner Shell-RC ein (z.B."," ",e("code",{children:"~/.bashrc"})," oder ",e("code",{children:"~/.zshrc"}),")."]}),e("h3",{children:"Nach der Installation"}),e("p",{children:"Damit der PATH-Update wirkt, starte eine neue Shell oder lade deine Konfiguration neu:"}),e("pre",{children:e("code",{children:"source ~/.bashrc"})}),e("p",{children:"Danach sollte der Befehl direkt verfügbar sein:"}),e("pre",{children:e("code",{children:"<app> --help"})}),e("h3",{children:"Installationstypen wählen"}),e("p",{children:"Wenn du mehrere Installationsoptionen (Install Options) eingetragen hast, fragt das Skript interaktiv nach, welche Variante installiert werden soll. Für eine automatisierte Installation kannst du den Typ direkt angeben:"}),e("pre",{children:e("code",{children:"sh install.sh -t minimal"})}),e("p",{children:"Alle verfügbaren Typen anzeigen:"}),e("pre",{children:e("code",{children:"sh install.sh --list"})}),e("h3",{children:"Neueste Version installieren"}),e("p",{children:'Ist "Neueste Version verwenden (latest)" aktiviert, ermittelt das Skript beim Ausführen die aktuellste Version automatisch von der GitHub-API. Alternativ kannst du das auch manuell erzwingen:'}),e("pre",{children:e("code",{children:"sh install.sh --latest"})}),e("h3",{children:"Zielverzeichnis ändern"}),a("p",{children:["Standard ist ",e("code",{children:"$HOME/.local/<app>"}),". Mit"," ",e("code",{children:"--prefix"})," kannst du ein anderes Ziel wählen:"]}),e("pre",{children:e("code",{children:"sh install.sh --prefix /opt/mein-app"})}),e("h3",{children:"Ohne Ladeanimation"}),e("p",{children:"In Skripten oder CI-Umgebungen (ohne TTY) werden Animationen automatisch deaktiviert. Du kannst sie aber auch explizit abschalten:"}),e("pre",{children:e("code",{children:"sh install.sh --no-animation"})}),e("h3",{children:"Per curl direkt installieren"}),e("p",{children:"Wenn du das Skript irgendwo gehostet hast, kann man es direkt von dort ausführen, ohne es erst herunterzuladen:"}),e("pre",{children:e("code",{children:"curl -fsSL https://example.com/install.sh | sh"})}),e("p",{children:"Achtung: Bei dieser Variante läuft das Skript ohne TTY, also automatisch nicht-interaktiv (es wird der erste Installationstyp verwendet)."}),e("h3",{children:"Konfiguration wiederherstellen"}),a("p",{children:["Das generierte Skript enthält am Ende einen Kommentar-Block mit der Konfiguration als Base64 (Markierung ",e("code",{children:"#$$$"}),'). Fügst du diesen Block (oder nur den Base64-String) oben im Feld "Konfiguration speichern / laden" ein und klickst auf "Importieren", werden alle Felder wiederhergestellt – so kannst du das Setup später erneut anpassen oder auf einem anderen Rechner weiterverwenden.']})]}),e("footer",{class:"note",children:"Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite."})]});const t=i(n,"#binariesContainer"),r=i(n,"#envContainer"),l=i(n,"#optionsContainer");t.appendChild(O("bin/mytool","mytool")),i(n,"#addBinary").addEventListener("click",()=>{t.appendChild(O())}),i(n,"#addEnv").addEventListener("click",()=>{r.appendChild(C())}),i(n,"#addOption").addEventListener("click",()=>{l.appendChild(V())});const c=i(n,"#errorBanner"),p=i(n,"#outputBody"),s=i(n,"#terminalActions");let o="",u="install";function f(d){c.textContent=d,c.classList.add("visible")}function b(){c.textContent="",c.classList.remove("visible")}const v=i(n,"#useLatest"),T=i(n,"#latestSection"),g=i(n,"#latestVersionUrl");v.addEventListener("change",()=>{T.style.display=v.checked?"":"none",i(n,"#version").disabled=v.checked});const S=i(n,"#homepage");S.addEventListener("change",()=>{if(v.checked&&!g.value.trim()){const d=S.value.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);d&&(g.value=`https://api.github.com/repos/${d[1]}/${d[2]}/releases/latest`)}});function N(){return j({appName:i(n,"#appName"),version:i(n,"#version"),homepage:i(n,"#homepage"),archiveUrl:i(n,"#archiveUrl"),archiveType:i(n,"#archiveType"),installDir:i(n,"#installDir"),animations:i(n,"#animations"),useLatest:i(n,"#useLatest"),latestVersionUrl:i(n,"#latestVersionUrl"),binariesContainer:t,envContainer:r,optionsContainer:l})}const I=i(n,"#b64Field");i(n,"#exportB64").addEventListener("click",()=>{b();try{I.value=D(N())}catch(d){f(d instanceof Error?d.message:String(d))}}),i(n,"#importB64").addEventListener("click",()=>{b();try{const d=ee(I.value);ie(d,{appName:i(n,"#appName"),version:i(n,"#version"),homepage:i(n,"#homepage"),archiveUrl:i(n,"#archiveUrl"),archiveType:i(n,"#archiveType"),installDir:i(n,"#installDir"),animations:i(n,"#animations"),useLatest:i(n,"#useLatest"),latestVersionUrl:i(n,"#latestVersionUrl"),binariesContainer:t,envContainer:r,optionsContainer:l})}catch(d){f(d instanceof Error?d.message:String(d))}}),i(n,"#clearB64").addEventListener("click",()=>{I.value=""}),i(n,"#generate").addEventListener("click",()=>{b();try{const d=N();o=ne(d),u=d.appName,p.innerHTML=e("pre",{}),i(p,"pre").textContent=o,s.style.display="flex"}catch(d){d instanceof E?f(d.message):f(d instanceof Error?d.message:String(d))}}),i(n,"#downloadBtn").addEventListener("click",()=>{if(!o)return;const d=new Blob([o],{type:"text/x-shellscript"}),A=URL.createObjectURL(d),$=document.createElement("a");$.href=A,$.download=`${u||"install"}-install.sh`,document.body.appendChild($),$.click(),$.remove(),URL.revokeObjectURL(A)}),i(n,"#copyBtn").addEventListener("click",()=>{o&&navigator.clipboard.writeText(o).catch(()=>{f("Kopieren hat nicht geklappt. Text lässt sich aus der Vorschau markieren.")})})}export{re as default};
