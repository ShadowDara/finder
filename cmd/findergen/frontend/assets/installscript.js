import{j as e,F}from"./main_entry.js";function k(n){return String(n).replace(/'/g,"'\\''")}function p(n){return"("+n.map(i=>`'${k(i)}'`).join(" ")+")"}function T(n){return n.join(",")}function $(n){return`'${k(n)}'`}function K(n){const{appName:i,version:a,archive:l,binaries:o,envVars:u=[],installOptions:r,defaultInstallDir:s,animations:h=!0,homepage:E,latestVersionUrl:_}=n;if(!i||!a)throw new Error("appName und version sind erforderlich.");if(!o||o.length===0)throw new Error("Mindestens eine Binary muss angegeben werden.");const f=r&&r.length>0?r:[{id:"full",label:"Vollständige Installation",description:"Installiert alle Binaries.",binaries:o.map(d=>d.targetName||d.archivePath)}],O=o.map(d=>d.archivePath),I=o.map(d=>d.targetName||d.archivePath.split("/").pop()||d.archivePath),g=o.map(d=>d.os?T(d.os):""),S=u.map(d=>d.name),b=u.map(d=>d.value),c=u.map(d=>d.os?T(d.os):""),N=u.map(d=>d.append?"1":"0"),v=f.map(d=>d.id),D=f.map(d=>d.label),z=f.map(d=>d.description||""),M=f.map(d=>T(d.binaries)),U=s||`$HOME/.local/${i}`,H=[`APP_NAME=${$(i)}`,`APP_VERSION=${$(a)}`,`APP_HOMEPAGE=${$(E||"")}`,`LATEST_VERSION_URL=${$(_||"")}`,`ARCHIVE_URL_TEMPLATE=${$(l.url)}`,`ARCHIVE_TYPE=${$(l.type)}`,`ANIMATIONS_ENABLED=${h?1:0}`,`INSTALL_PREFIX_DEFAULT="${U}"`,"","# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",`BIN_ARCHIVE_PATHS=${p(O)}`,`BIN_TARGET_NAMES=${p(I)}`,`BIN_OS_RESTRICT=${p(g)}`,"","# --- Environment-Variablen ---",`ENV_NAMES=${p(S)}`,`ENV_VALUES=${p(b)}`,`ENV_OS_RESTRICT=${p(c)}`,`ENV_APPEND=${p(N)}`,"","# --- Installationsoptionen (Menü / --type) ---",`OPTION_IDS=${p(v)}`,`OPTION_LABELS=${p(D)}`,`OPTION_DESCRIPTIONS=${p(z)}`,`OPTION_BINARIES=${p(M)}`].join(`
`);return G.replace("__CONFIG_ARRAYS__",H)}const G=String.raw`#!/usr/bin/env bash
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
`.replace(/µ\{/g,"${");class m extends Error{}function L(n){const i=String(n).trim(),a=document.createElement("template");a.innerHTML=i;const l=a.content.firstElementChild;if(!l)throw new Error("Konnte Element nicht erzeugen: "+i);return l}function t(n,i){const a=n.querySelector(i);if(!a)throw new Error(`Element nicht gefunden: ${i}`);return a}function y(n){return e("div",{class:"field narrow"},e("span",null,"OS"),e("div",{class:"os-chips"},e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-linux`})," linux"),e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-darwin`})," macOS")))}function P(n,i){const a=t(n,`[name="${i}-linux"]`).checked,l=t(n,`[name="${i}-darwin"]`).checked;if(a&&!l)return["linux"];if(l&&!a)return["darwin"]}function A(n="",i=""){const a=L(e("div",{class:"row","data-kind":"binary"},e("label",{class:"field wide"},e("span",null,"Pfad im Archiv"),e("input",{type:"text",class:"bin-path",placeholder:"bin/mytool"})),e("label",{class:"field"},e("span",null,"Zielname (optional)"),e("input",{type:"text",class:"bin-target",placeholder:"mytool"})),y("bin-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return t(a,".bin-path").value=n,t(a,".bin-target").value=i,V(a,"bin-os"),R(a,"binary"),a}function x(){const n=L(e("div",{class:"row","data-kind":"env"},e("label",{class:"field"},e("span",null,"Name"),e("input",{type:"text",class:"env-name",placeholder:"MYTOOL_HOME"})),e("label",{class:"field wide"},e("span",null,"Wert"),e("input",{type:"text",class:"env-value",placeholder:"$INSTALL_PREFIX"})),e("label",{class:"append-chip"},e("input",{type:"checkbox",class:"env-append"})," anhängen"),y("env-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return V(n,"env-os"),R(n,"env"),n}function C(){const n=L(e("div",{class:"row","data-kind":"option"},e("label",{class:"field narrow"},e("span",null,"ID"),e("input",{type:"text",class:"opt-id",placeholder:"minimal"})),e("label",{class:"field"},e("span",null,"Label"),e("input",{type:"text",class:"opt-label",placeholder:"Minimal"})),e("label",{class:"field wide"},e("span",null,"Beschreibung"),e("input",{type:"text",class:"opt-desc",placeholder:"Nur die CLI"})),e("label",{class:"field wide"},e("span",null,"Enthaltene Binaries (Zielnamen, kommagetrennt)"),e("input",{type:"text",class:"opt-binaries",placeholder:"mytool"})),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return R(n,"option"),n}let W=0;function V(n,i){const a=`${i}-${W++}`;t(n,`[name="${i}-linux"]`).name=`${a}-linux`,t(n,`[name="${i}-darwin"]`).name=`${a}-darwin`,n.setAttribute("data-os-prefix",a)}function R(n,i){t(n,".btn-remove").addEventListener("click",()=>{const l=n.parentElement;if(l){if(i==="binary"&&l.children.length<=1){t(n,".bin-path").value="",t(n,".bin-target").value="";return}n.remove()}})}function Y(n){const i=Array.from(n.querySelectorAll('[data-kind="binary"]')),a=[];for(const l of i){const o=t(l,".bin-path").value.trim();if(!o)continue;const u=t(l,".bin-target").value.trim(),r=l.getAttribute("data-os-prefix")||"bin-os",s=P(l,r);a.push({archivePath:o,targetName:u||void 0,os:s})}return a}function X(n){const i=Array.from(n.querySelectorAll('[data-kind="env"]')),a=[];for(const l of i){const o=t(l,".env-name").value.trim();if(!o)continue;const u=t(l,".env-value").value.trim(),r=t(l,".env-append").checked,s=l.getAttribute("data-os-prefix")||"env-os",h=P(l,s);a.push({name:o,value:u,append:r||void 0,os:h})}return a}function q(n){const i=Array.from(n.querySelectorAll('[data-kind="option"]')),a=[];for(const l of i){const o=t(l,".opt-id").value.trim();if(!o)continue;const u=t(l,".opt-label").value.trim()||o,r=t(l,".opt-desc").value.trim(),h=t(l,".opt-binaries").value.trim().split(",").map(E=>E.trim()).filter(Boolean);if(h.length===0)throw new m(`Installationsoption "${o}" braucht mindestens eine Binary in der Liste.`);a.push({id:o,label:u,description:r||void 0,binaries:h})}return a}function Z(n){const i=n.appName.value.trim();if(!i)throw new m("App-Name fehlt. Ohne Namen kann kein Skript entstehen.");const a=n.useLatest.checked,l=n.version.value.trim();if(!a&&!l)throw new m("Version fehlt. Trag z.B. 1.0.0 ein.");const o=n.archiveUrl.value.trim();if(!o)throw new m("Die Archiv-URL fehlt.");const u=Y(n.binariesContainer);if(u.length===0)throw new m("Mindestens eine Binary wird gebraucht (Pfad im Archiv angeben).");const r=X(n.envContainer),s=q(n.optionsContainer);return{appName:i,version:a?"latest":l,homepage:n.homepage.value.trim()||void 0,latestVersionUrl:n.latestVersionUrl.value.trim()||void 0,archive:{url:o,type:n.archiveType.value},binaries:u,envVars:r.length>0?r:void 0,installOptions:s.length>0?s:void 0,defaultInstallDir:n.installDir.value.trim()||void 0,animations:n.animations.checked}}function j(n){const i=new TextEncoder().encode(n);let a="";return i.forEach(l=>a+=String.fromCharCode(l)),btoa(a)}function J(n){const i=atob(n.trim()),a=Uint8Array.from(i,l=>l.charCodeAt(0));return new TextDecoder().decode(a)}function B(n){return j(JSON.stringify(n))}function Q(n){const i=n.trim();if(!i)throw new m("Kein Base64-String eingefügt.");const a=i.lastIndexOf("#$$$"),l=a!==-1?i.slice(a+4).trim():i;let o;try{o=J(l)}catch{throw new m("Ungültiger Base64-String.")}let u;try{u=JSON.parse(o)}catch{throw new m("Ungültiges JSON im Base64-String.")}if(!u||typeof u!="object")throw new m("Ungültiges JSON im Base64-String.");return u}function ee(n){return K(n)+`
# Base64 of the input values for the generator
# so you dont have to type it all again
#
#$$$`+B(n)+`
`}function w(n){n.innerHTML=""}function ne(n,i){var o,u;const a=n.version==="latest";i.appName.value=n.appName||"",i.version.value=a?"":n.version||"",i.version.disabled=a,i.homepage.value=n.homepage||"",i.archiveUrl.value=((o=n.archive)==null?void 0:o.url)||"",i.archiveType.value=((u=n.archive)==null?void 0:u.type)||"tar.gz",i.installDir.value=n.defaultInstallDir||"",i.animations.checked=n.animations??!0,i.useLatest.checked=a,i.latestVersionUrl.value=n.latestVersionUrl||"";{const r=i.latestVersionUrl.closest("section");r&&(r.style.display=a?"":"none")}w(i.binariesContainer);const l=n.binaries||[];if(l.length===0)i.binariesContainer.appendChild(A("",""));else for(const r of l){const s=A(r.archivePath||"",r.targetName||""),h=s.getAttribute("data-os-prefix")||"";r.os&&r.os.length===1&&(t(s,`[name="${h}-linux"]`).checked=r.os[0]==="linux",t(s,`[name="${h}-darwin"]`).checked=r.os[0]==="darwin"),i.binariesContainer.appendChild(s)}w(i.envContainer);for(const r of n.envVars||[]){const s=x();t(s,".env-name").value=r.name||"",t(s,".env-value").value=r.value||"",t(s,".env-append").checked=!!r.append;const h=s.getAttribute("data-os-prefix")||"";r.os&&r.os.length===1&&(t(s,`[name="${h}-linux"]`).checked=r.os[0]==="linux",t(s,`[name="${h}-darwin"]`).checked=r.os[0]==="darwin"),i.envContainer.appendChild(s)}w(i.optionsContainer);for(const r of n.installOptions||[]){const s=C();t(s,".opt-id").value=r.id||"",t(s,".opt-label").value=r.label||"",t(s,".opt-desc").value=r.description||"",t(s,".opt-binaries").value=(r.binaries||[]).join(", "),i.optionsContainer.appendChild(s)}}function ie(n){n.innerHTML=e(F,null,e("div",{class:"runner"},e("span",null,e("a",{href:"../../"},"HOME")),e("span",null,"INSTALLER-MAKER(1)"),e("span",null,"Installer Generator"),e("span",null,"INSTALLER-MAKER(1)")),e("div",{class:"intro"},e("h1",null,"Baue dir dein install.sh"),e("p",null,"Trag deine App, das Release-Archiv und die enthaltenen Binaries ein. Daraus entsteht ein einzelnes Bash-Skript für Linux und macOS, das herunterlädt, entpackt, in den PATH einträgt und optional zwischen Installationsarten wählen lässt. Alles läuft nur in diesem Browser, es wird nichts hochgeladen.")),e("section",{class:"card"},e("h2",null,"Name"),e("p",{class:"hint"},"Wie deine App heißt und wo sie herkommt."),e("div",{class:"field-grid"},e("label",{class:"field"},e("span",null,"App-Name"),e("input",{type:"text",id:"appName",placeholder:"mytool"})),e("label",{class:"field"},e("span",null,"Version"),e("input",{type:"text",id:"version",placeholder:"1.0.0"})),e("label",{class:"field"},e("span",null,"Homepage (optional)"),e("input",{type:"text",id:"homepage",placeholder:"https://example.com/mytool"})))),e("section",{class:"card"},e("h2",null,"Archiv"),e("p",{class:"hint"},"Platzhalter ","{appName}"," ","{version}"," ","{os}"," ","{arch}",' werden beim Installieren aufgelöst, z.B. zu "mytool-darwin-arm64".'),e("div",{class:"field-grid"},e("label",{class:"field wide"},e("span",null,"Archiv-URL-Template"),e("input",{type:"text",id:"archiveUrl",placeholder:"https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"})),e("label",{class:"field"},e("span",null,"Archivtyp"),e("select",{id:"archiveType"},e("option",{value:"tar.gz"},"tar.gz"),e("option",{value:"zip"},"zip"))),e("label",{class:"field wide"},e("span",null,"Zielverzeichnis (optional)"),e("input",{type:"text",id:"installDir",placeholder:"$HOME/.local/mytool"})))),e("section",{class:"card"},e("h2",null,"Binaries"),e("p",{class:"hint"},"Pfad, wie die Datei im entpackten Archiv heißt. OS leer lassen = auf beiden Systemen installieren."),e("div",{id:"binariesContainer"}),e("button",{type:"button",class:"btn-add",id:"addBinary"},"+ Binary hinzufügen")),e("section",{class:"card"},e("h2",null,"Environment"),e("p",{class:"hint"},"Optionale Umgebungsvariablen für die Shell-RC-Datei."),e("div",{id:"envContainer"}),e("button",{type:"button",class:"btn-add",id:"addEnv"},"+ Variable hinzufügen")),e("section",{class:"card"},e("h2",null,"Installationsoptionen"),e("p",{class:"hint"},"Optional. Ohne Eintrag gibt es genau eine Installation mit allen Binaries. Mit Einträgen erscheint ein Auswahlmenü (oder --type <id>)."),e("div",{id:"optionsContainer"}),e("button",{type:"button",class:"btn-add",id:"addOption"},"+ Option hinzufügen")),e("div",{class:"actions"},e("label",{class:"checkbox-field"},e("input",{type:"checkbox",id:"animations",checked:!0})," Ladeanimation im Skript"),e("label",{class:"checkbox-field"},e("input",{type:"checkbox",id:"useLatest"})," Neueste Version verwenden (latest)"),e("button",{type:"button",class:"btn-primary",id:"generate"},"install.sh generieren")),e("section",{class:"card",id:"latestSection",style:"display:none;"},e("h2",null,"Neueste Version"),e("p",{class:"hint"},"Wenn aktiviert, wird beim Ausführen des Skripts die neueste Version automatisch von der API ermittelt. Das Skript muss dabei online sein."),e("div",{class:"field-grid"},e("label",{class:"field wide"},e("span",null,"GitHub API URL (optional, wird erkannt wenn Homepage gesetzt)"),e("input",{type:"text",id:"latestVersionUrl",placeholder:"https://api.github.com/repos/shadowdara/finder/releases/latest"})))),e("section",{class:"card"},e("h2",null,"Konfiguration speichern / laden"),e("p",{class:"hint"},"Exportiert alle Felder als Base64-kodierten JSON-String (UTF-8 sicher) oder lädt sie daraus wieder zurück."),e("label",{class:"field wide"},e("span",null,"Base64 (Import / Export)"),e("textarea",{id:"b64Field",rows:"3",spellcheck:"false",placeholder:"Paste einen Base64-String hier ein und klicke auf Import"})),e("div",{class:"actions"},e("button",{type:"button",class:"btn-term",id:"importB64"},"Importieren"),e("button",{type:"button",class:"btn-term",id:"exportB64"},"Exportieren"),e("button",{type:"button",class:"btn-term",id:"clearB64"},"Feld leeren"))),e("div",{class:"error-banner",id:"errorBanner"}),e("div",{class:"output"},e("h2",null,"Vorschau"),e("div",{class:"terminal"},e("div",{class:"terminal-bar"},e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"path"},"~/install.sh")),e("div",{id:"outputBody"},e("div",{class:"output-empty"},"Noch nichts generiert",e("span",{class:"cursor"}))),e("div",{class:"terminal-actions",id:"terminalActions",style:"display:none;"},e("button",{type:"button",class:"btn-term",id:"downloadBtn"},"Herunterladen"),e("button",{type:"button",class:"btn-term",id:"copyBtn"},"Kopieren")))),e("section",{class:"card"},e("h2",null,"Verwendung / Tipps"),e("p",{class:"hint"},"So führst du das generierte Skript aus und was es dabei tut."),e("h3",null,"Ausführen"),e("p",null,"Nach dem Generieren kannst du das Skript direkt im Terminal ausführen. Am einfachsten mit:"),e("pre",null,e("code",null,"sh install.sh")),e("p",null,"Oder erst ausführbar machen und dann starten (Linux/macOS):"),e("pre",null,e("code",null,"chmod +x install.sh ./install.sh")),e("p",null,"Das Skript lädt das passende Archiv für dein System (Linux/macOS und Architektur) herunter, entpackt es und installiert die Binaries nach"," ",e("code",null,"$HOME/.local/<app>/bin"),". Anschließend trägt es diesen Ordner in den PATH deiner Shell-RC ein (z.B."," ",e("code",null,"~/.bashrc")," oder ",e("code",null,"~/.zshrc"),")."),e("h3",null,"Nach der Installation"),e("p",null,"Damit der PATH-Update wirkt, starte eine neue Shell oder lade deine Konfiguration neu:"),e("pre",null,e("code",null,"source ~/.bashrc")),e("p",null,"Danach sollte der Befehl direkt verfügbar sein:"),e("pre",null,e("code",null,"<app> --help")),e("h3",null,"Installationstypen wählen"),e("p",null,"Wenn du mehrere Installationsoptionen (Install Options) eingetragen hast, fragt das Skript interaktiv nach, welche Variante installiert werden soll. Für eine automatisierte Installation kannst du den Typ direkt angeben:"),e("pre",null,e("code",null,"sh install.sh -t minimal")),e("p",null,"Alle verfügbaren Typen anzeigen:"),e("pre",null,e("code",null,"sh install.sh --list")),e("h3",null,"Neueste Version installieren"),e("p",null,'Ist "Neueste Version verwenden (latest)" aktiviert, ermittelt das Skript beim Ausführen die aktuellste Version automatisch von der GitHub-API. Alternativ kannst du das auch manuell erzwingen:'),e("pre",null,e("code",null,"sh install.sh --latest")),e("h3",null,"Zielverzeichnis ändern"),e("p",null,"Standard ist ",e("code",null,"$HOME/.local/<app>"),". Mit"," ",e("code",null,"--prefix")," kannst du ein anderes Ziel wählen:"),e("pre",null,e("code",null,"sh install.sh --prefix /opt/mein-app")),e("h3",null,"Ohne Ladeanimation"),e("p",null,"In Skripten oder CI-Umgebungen (ohne TTY) werden Animationen automatisch deaktiviert. Du kannst sie aber auch explizit abschalten:"),e("pre",null,e("code",null,"sh install.sh --no-animation")),e("h3",null,"Per curl direkt installieren"),e("p",null,"Wenn du das Skript irgendwo gehostet hast, kann man es direkt von dort ausführen, ohne es erst herunterzuladen:"),e("pre",null,e("code",null,"curl -fsSL https://example.com/install.sh | sh")),e("p",null,"Achtung: Bei dieser Variante läuft das Skript ohne TTY, also automatisch nicht-interaktiv (es wird der erste Installationstyp verwendet)."),e("h3",null,"Konfiguration wiederherstellen"),e("p",null,"Das generierte Skript enthält am Ende einen Kommentar-Block mit der Konfiguration als Base64 (Markierung ",e("code",null,"#$$$"),'). Fügst du diesen Block (oder nur den Base64-String) oben im Feld "Konfiguration speichern / laden" ein und klickst auf "Importieren", werden alle Felder wiederhergestellt – so kannst du das Setup später erneut anpassen oder auf einem anderen Rechner weiterverwenden.')),e("footer",{class:"note"},"Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite."));const i=t(n,"#binariesContainer"),a=t(n,"#envContainer"),l=t(n,"#optionsContainer");i.appendChild(A("bin/mytool","mytool")),t(n,"#addBinary").addEventListener("click",()=>{i.appendChild(A())}),t(n,"#addEnv").addEventListener("click",()=>{a.appendChild(x())}),t(n,"#addOption").addEventListener("click",()=>{l.appendChild(C())});const o=t(n,"#errorBanner"),u=t(n,"#outputBody"),r=t(n,"#terminalActions");let s="",h="install";function E(c){o.textContent=c,o.classList.add("visible")}function _(){o.textContent="",o.classList.remove("visible")}const f=t(n,"#useLatest"),O=t(n,"#latestSection"),I=t(n,"#latestVersionUrl");f.addEventListener("change",()=>{O.style.display=f.checked?"":"none",t(n,"#version").disabled=f.checked});const g=t(n,"#homepage");g.addEventListener("change",()=>{if(f.checked&&!I.value.trim()){const c=g.value.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);c&&(I.value=`https://api.github.com/repos/${c[1]}/${c[2]}/releases/latest`)}});function S(){return Z({appName:t(n,"#appName"),version:t(n,"#version"),homepage:t(n,"#homepage"),archiveUrl:t(n,"#archiveUrl"),archiveType:t(n,"#archiveType"),installDir:t(n,"#installDir"),animations:t(n,"#animations"),useLatest:t(n,"#useLatest"),latestVersionUrl:t(n,"#latestVersionUrl"),binariesContainer:i,envContainer:a,optionsContainer:l})}const b=t(n,"#b64Field");t(n,"#exportB64").addEventListener("click",()=>{_();try{b.value=B(S())}catch(c){E(c instanceof Error?c.message:String(c))}}),t(n,"#importB64").addEventListener("click",()=>{_();try{const c=Q(b.value);ne(c,{appName:t(n,"#appName"),version:t(n,"#version"),homepage:t(n,"#homepage"),archiveUrl:t(n,"#archiveUrl"),archiveType:t(n,"#archiveType"),installDir:t(n,"#installDir"),animations:t(n,"#animations"),useLatest:t(n,"#useLatest"),latestVersionUrl:t(n,"#latestVersionUrl"),binariesContainer:i,envContainer:a,optionsContainer:l})}catch(c){E(c instanceof Error?c.message:String(c))}}),t(n,"#clearB64").addEventListener("click",()=>{b.value=""}),t(n,"#generate").addEventListener("click",()=>{_();try{const c=S();s=ee(c),h=c.appName,u.innerHTML=e("pre",null),t(u,"pre").textContent=s,r.style.display="flex"}catch(c){c instanceof m?E(c.message):E(c instanceof Error?c.message:String(c))}}),t(n,"#downloadBtn").addEventListener("click",()=>{if(!s)return;const c=new Blob([s],{type:"text/x-shellscript"}),N=URL.createObjectURL(c),v=document.createElement("a");v.href=N,v.download=`${h||"install"}-install.sh`,document.body.appendChild(v),v.click(),v.remove(),URL.revokeObjectURL(N)}),t(n,"#copyBtn").addEventListener("click",()=>{s&&navigator.clipboard.writeText(s).catch(()=>{E("Kopieren hat nicht geklappt. Text lässt sich aus der Vorschau markieren.")})})}export{ie as default};
