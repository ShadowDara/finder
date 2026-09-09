import{j as e,F as H}from"./main_entry.js";function T(n){return String(n).replace(/'/g,"'\\''")}function h(n){return"("+n.map(t=>`'${T(t)}'`).join(" ")+")"}function A(n){return n.join(",")}function _(n){return`'${T(n)}'`}function U(n){const{appName:t,version:a,archive:r,binaries:o,envVars:l=[],installOptions:s,defaultInstallDir:p,animations:E=!0,homepage:m}=n;if(!t||!a)throw new Error("appName und version sind erforderlich.");if(!o||o.length===0)throw new Error("Mindestens eine Binary muss angegeben werden.");const f=s&&s.length>0?s:[{id:"full",label:"Vollständige Installation",description:"Installiert alle Binaries.",binaries:o.map(c=>c.targetName||c.archivePath)}],I=o.map(c=>c.archivePath),v=o.map(c=>c.targetName||c.archivePath.split("/").pop()||c.archivePath),d=o.map(c=>c.os?A(c.os):""),b=l.map(c=>c.name),$=l.map(c=>c.value),x=l.map(c=>c.os?A(c.os):""),k=l.map(c=>c.append?"1":"0"),B=f.map(c=>c.id),D=f.map(c=>c.label),V=f.map(c=>c.description||""),M=f.map(c=>A(c.binaries)),z=p||`$HOME/.local/${t}`,F=[`APP_NAME=${_(t)}`,`APP_VERSION=${_(a)}`,`APP_HOMEPAGE=${_(m||"")}`,`ARCHIVE_URL_TEMPLATE=${_(r.url)}`,`ARCHIVE_TYPE=${_(r.type)}`,`ANIMATIONS_ENABLED=${E?1:0}`,`INSTALL_PREFIX_DEFAULT="${z}"`,"","# --- Binaries (parallele Arrays, bash-3.2-kompatibel, keine assoziativen Arrays) ---",`BIN_ARCHIVE_PATHS=${h(I)}`,`BIN_TARGET_NAMES=${h(v)}`,`BIN_OS_RESTRICT=${h(d)}`,"","# --- Environment-Variablen ---",`ENV_NAMES=${h(b)}`,`ENV_VALUES=${h($)}`,`ENV_OS_RESTRICT=${h(x)}`,`ENV_APPEND=${h(k)}`,"","# --- Installationsoptionen (Menü / --type) ---",`OPTION_IDS=${h(B)}`,`OPTION_LABELS=${h(D)}`,`OPTION_DESCRIPTIONS=${h(V)}`,`OPTION_BINARIES=${h(M)}`].join(`
`);return K.replace("__CONFIG_ARRAYS__",F)}const K=String.raw`#!/usr/bin/env bash
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
`.replace(/µ\{/g,"${");class u extends Error{}function g(n){const t=String(n).trim(),a=document.createElement("template");a.innerHTML=t;const r=a.content.firstElementChild;if(!r)throw new Error("Konnte Element nicht erzeugen: "+t);return r}function i(n,t){const a=n.querySelector(t);if(!a)throw new Error(`Element nicht gefunden: ${t}`);return a}function w(n){return e("div",{class:"field narrow"},e("span",null,"OS"),e("div",{class:"os-chips"},e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-linux`})," linux"),e("label",{class:"os-chip"},e("input",{type:"checkbox",name:`${n}-darwin`})," macOS")))}function R(n,t){const a=i(n,`[name="${t}-linux"]`).checked,r=i(n,`[name="${t}-darwin"]`).checked;if(a&&!r)return["linux"];if(r&&!a)return["darwin"]}function N(n="",t=""){const a=g(e("div",{class:"row","data-kind":"binary"},e("label",{class:"field wide"},e("span",null,"Pfad im Archiv"),e("input",{type:"text",class:"bin-path",placeholder:"bin/mytool"})),e("label",{class:"field"},e("span",null,"Zielname (optional)"),e("input",{type:"text",class:"bin-target",placeholder:"mytool"})),w("bin-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return i(a,".bin-path").value=n,i(a,".bin-target").value=t,P(a,"bin-os"),S(a,"binary"),a}function L(){const n=g(e("div",{class:"row","data-kind":"env"},e("label",{class:"field"},e("span",null,"Name"),e("input",{type:"text",class:"env-name",placeholder:"MYTOOL_HOME"})),e("label",{class:"field wide"},e("span",null,"Wert"),e("input",{type:"text",class:"env-value",placeholder:"$INSTALL_PREFIX"})),e("label",{class:"append-chip"},e("input",{type:"checkbox",class:"env-append"})," anhängen"),w("env-os"),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return P(n,"env-os"),S(n,"env"),n}function y(){const n=g(e("div",{class:"row","data-kind":"option"},e("label",{class:"field narrow"},e("span",null,"ID"),e("input",{type:"text",class:"opt-id",placeholder:"minimal"})),e("label",{class:"field"},e("span",null,"Label"),e("input",{type:"text",class:"opt-label",placeholder:"Minimal"})),e("label",{class:"field wide"},e("span",null,"Beschreibung"),e("input",{type:"text",class:"opt-desc",placeholder:"Nur die CLI"})),e("label",{class:"field wide"},e("span",null,"Enthaltene Binaries (Zielnamen, kommagetrennt)"),e("input",{type:"text",class:"opt-binaries",placeholder:"mytool"})),e("button",{type:"button",class:"btn-remove",title:"Zeile entfernen"},"×")));return S(n,"option"),n}let X=0;function P(n,t){const a=`${t}-${X++}`;i(n,`[name="${t}-linux"]`).name=`${a}-linux`,i(n,`[name="${t}-darwin"]`).name=`${a}-darwin`,n.setAttribute("data-os-prefix",a)}function S(n,t){i(n,".btn-remove").addEventListener("click",()=>{const r=n.parentElement;if(r){if(t==="binary"&&r.children.length<=1){i(n,".bin-path").value="",i(n,".bin-target").value="";return}n.remove()}})}function Y(n){const t=Array.from(n.querySelectorAll('[data-kind="binary"]')),a=[];for(const r of t){const o=i(r,".bin-path").value.trim();if(!o)continue;const l=i(r,".bin-target").value.trim(),s=r.getAttribute("data-os-prefix")||"bin-os",p=R(r,s);a.push({archivePath:o,targetName:l||void 0,os:p})}return a}function W(n){const t=Array.from(n.querySelectorAll('[data-kind="env"]')),a=[];for(const r of t){const o=i(r,".env-name").value.trim();if(!o)continue;const l=i(r,".env-value").value.trim(),s=i(r,".env-append").checked,p=r.getAttribute("data-os-prefix")||"env-os",E=R(r,p);a.push({name:o,value:l,append:s||void 0,os:E})}return a}function G(n){const t=Array.from(n.querySelectorAll('[data-kind="option"]')),a=[];for(const r of t){const o=i(r,".opt-id").value.trim();if(!o)continue;const l=i(r,".opt-label").value.trim()||o,s=i(r,".opt-desc").value.trim(),E=i(r,".opt-binaries").value.trim().split(",").map(m=>m.trim()).filter(Boolean);if(E.length===0)throw new u(`Installationsoption "${o}" braucht mindestens eine Binary in der Liste.`);a.push({id:o,label:l,description:s||void 0,binaries:E})}return a}function q(n){const t=n.appName.value.trim();if(!t)throw new u("App-Name fehlt. Ohne Namen kann kein Skript entstehen.");const a=n.version.value.trim();if(!a)throw new u("Version fehlt. Trag z.B. 1.0.0 ein.");const r=n.archiveUrl.value.trim();if(!r)throw new u("Die Archiv-URL fehlt.");const o=Y(n.binariesContainer);if(o.length===0)throw new u("Mindestens eine Binary wird gebraucht (Pfad im Archiv angeben).");const l=W(n.envContainer),s=G(n.optionsContainer);return{appName:t,version:a,homepage:n.homepage.value.trim()||void 0,archive:{url:r,type:n.archiveType.value},binaries:o,envVars:l.length>0?l:void 0,installOptions:s.length>0?s:void 0,defaultInstallDir:n.installDir.value.trim()||void 0,animations:n.animations.checked}}function j(n){const t=new TextEncoder().encode(n);let a="";return t.forEach(r=>a+=String.fromCharCode(r)),btoa(a)}function Z(n){const t=atob(n.trim()),a=Uint8Array.from(t,r=>r.charCodeAt(0));return new TextDecoder().decode(a)}function C(n){return j(JSON.stringify(n))}function J(n){const t=n.trim();if(!t)throw new u("Kein Base64-String eingefügt.");const a=t.lastIndexOf("#$$$"),r=a!==-1?t.slice(a+4).trim():t;let o;try{o=Z(r)}catch{throw new u("Ungültiger Base64-String.")}let l;try{l=JSON.parse(o)}catch{throw new u("Ungültiges JSON im Base64-String.")}if(!l||typeof l!="object")throw new u("Ungültiges JSON im Base64-String.");return l}function Q(n){return U(n)+`
# Base64 of the input values for the generator
so you dont have to type it all again
#$$$`+C(n)+`
`}function O(n){n.innerHTML=""}function ee(n,t){var r,o;t.appName.value=n.appName||"",t.version.value=n.version||"",t.homepage.value=n.homepage||"",t.archiveUrl.value=((r=n.archive)==null?void 0:r.url)||"",t.archiveType.value=((o=n.archive)==null?void 0:o.type)||"tar.gz",t.installDir.value=n.defaultInstallDir||"",t.animations.checked=n.animations??!0,O(t.binariesContainer);const a=n.binaries||[];if(a.length===0)t.binariesContainer.appendChild(N("",""));else for(const l of a){const s=N(l.archivePath||"",l.targetName||""),p=s.getAttribute("data-os-prefix")||"";l.os&&l.os.length===1&&(i(s,`[name="${p}-linux"]`).checked=l.os[0]==="linux",i(s,`[name="${p}-darwin"]`).checked=l.os[0]==="darwin"),t.binariesContainer.appendChild(s)}O(t.envContainer);for(const l of n.envVars||[]){const s=L();i(s,".env-name").value=l.name||"",i(s,".env-value").value=l.value||"",i(s,".env-append").checked=!!l.append;const p=s.getAttribute("data-os-prefix")||"";l.os&&l.os.length===1&&(i(s,`[name="${p}-linux"]`).checked=l.os[0]==="linux",i(s,`[name="${p}-darwin"]`).checked=l.os[0]==="darwin"),t.envContainer.appendChild(s)}O(t.optionsContainer);for(const l of n.installOptions||[]){const s=y();i(s,".opt-id").value=l.id||"",i(s,".opt-label").value=l.label||"",i(s,".opt-desc").value=l.description||"",i(s,".opt-binaries").value=(l.binaries||[]).join(", "),t.optionsContainer.appendChild(s)}}function te(n){n.innerHTML=e(H,null,e("div",{class:"runner"},e("span",null,e("a",{href:"../../"},"HOME")),e("span",null,"INSTALLER-MAKER(1)"),e("span",null,"Installer Generator"),e("span",null,"INSTALLER-MAKER(1)")),e("div",{class:"intro"},e("h1",null,"Baue dir dein install.sh"),e("p",null,"Trag deine App, das Release-Archiv und die enthaltenen Binaries ein. Daraus entsteht ein einzelnes Bash-Skript für Linux und macOS, das herunterlädt, entpackt, in den PATH einträgt und optional zwischen Installationsarten wählen lässt. Alles läuft nur in diesem Browser, es wird nichts hochgeladen.")),e("section",{class:"card"},e("h2",null,"Name"),e("p",{class:"hint"},"Wie deine App heißt und wo sie herkommt."),e("div",{class:"field-grid"},e("label",{class:"field"},e("span",null,"App-Name"),e("input",{type:"text",id:"appName",placeholder:"mytool"})),e("label",{class:"field"},e("span",null,"Version"),e("input",{type:"text",id:"version",placeholder:"1.0.0"})),e("label",{class:"field"},e("span",null,"Homepage (optional)"),e("input",{type:"text",id:"homepage",placeholder:"https://example.com/mytool"})))),e("section",{class:"card"},e("h2",null,"Archiv"),e("p",{class:"hint"},"Platzhalter ","{appName}"," ","{version}"," ","{os}"," ","{arch}",' werden beim Installieren aufgelöst, z.B. zu "mytool-darwin-arm64".'),e("div",{class:"field-grid"},e("label",{class:"field wide"},e("span",null,"Archiv-URL-Template"),e("input",{type:"text",id:"archiveUrl",placeholder:"https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"})),e("label",{class:"field"},e("span",null,"Archivtyp"),e("select",{id:"archiveType"},e("option",{value:"tar.gz"},"tar.gz"),e("option",{value:"zip"},"zip"))),e("label",{class:"field wide"},e("span",null,"Zielverzeichnis (optional)"),e("input",{type:"text",id:"installDir",placeholder:"$HOME/.local/mytool"})))),e("section",{class:"card"},e("h2",null,"Binaries"),e("p",{class:"hint"},"Pfad, wie die Datei im entpackten Archiv heißt. OS leer lassen = auf beiden Systemen installieren."),e("div",{id:"binariesContainer"}),e("button",{type:"button",class:"btn-add",id:"addBinary"},"+ Binary hinzufügen")),e("section",{class:"card"},e("h2",null,"Environment"),e("p",{class:"hint"},"Optionale Umgebungsvariablen für die Shell-RC-Datei."),e("div",{id:"envContainer"}),e("button",{type:"button",class:"btn-add",id:"addEnv"},"+ Variable hinzufügen")),e("section",{class:"card"},e("h2",null,"Installationsoptionen"),e("p",{class:"hint"},"Optional. Ohne Eintrag gibt es genau eine Installation mit allen Binaries. Mit Einträgen erscheint ein Auswahlmenü (oder --type <id>)."),e("div",{id:"optionsContainer"}),e("button",{type:"button",class:"btn-add",id:"addOption"},"+ Option hinzufügen")),e("div",{class:"actions"},e("label",{class:"checkbox-field"},e("input",{type:"checkbox",id:"animations",checked:!0})," Ladeanimation im Skript"),e("button",{type:"button",class:"btn-primary",id:"generate"},"install.sh generieren")),e("section",{class:"card"},e("h2",null,"Konfiguration speichern / laden"),e("p",{class:"hint"},"Exportiert alle Felder als Base64-kodierten JSON-String (UTF-8 sicher) oder lädt sie daraus wieder zurück."),e("label",{class:"field wide"},e("span",null,"Base64 (Import / Export)"),e("textarea",{id:"b64Field",rows:"3",spellcheck:"false",placeholder:"Paste einen Base64-String hier ein und klicke auf Import"})),e("div",{class:"actions"},e("button",{type:"button",class:"btn-term",id:"importB64"},"Importieren"),e("button",{type:"button",class:"btn-term",id:"exportB64"},"Exportieren"),e("button",{type:"button",class:"btn-term",id:"clearB64"},"Feld leeren"))),e("div",{class:"error-banner",id:"errorBanner"}),e("div",{class:"output"},e("h2",null,"Vorschau"),e("div",{class:"terminal"},e("div",{class:"terminal-bar"},e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"dot"}),e("span",{class:"path"},"~/install.sh")),e("div",{id:"outputBody"},e("div",{class:"output-empty"},"Noch nichts generiert",e("span",{class:"cursor"}))),e("div",{class:"terminal-actions",id:"terminalActions",style:"display:none;"},e("button",{type:"button",class:"btn-term",id:"downloadBtn"},"Herunterladen"),e("button",{type:"button",class:"btn-term",id:"copyBtn"},"Kopieren")))),e("footer",{class:"note"},"Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite."));const t=i(n,"#binariesContainer"),a=i(n,"#envContainer"),r=i(n,"#optionsContainer");t.appendChild(N("bin/mytool","mytool")),i(n,"#addBinary").addEventListener("click",()=>{t.appendChild(N())}),i(n,"#addEnv").addEventListener("click",()=>{a.appendChild(L())}),i(n,"#addOption").addEventListener("click",()=>{r.appendChild(y())});const o=i(n,"#errorBanner"),l=i(n,"#outputBody"),s=i(n,"#terminalActions");let p="",E="install";function m(d){o.textContent=d,o.classList.add("visible")}function f(){o.textContent="",o.classList.remove("visible")}function I(){return q({appName:i(n,"#appName"),version:i(n,"#version"),homepage:i(n,"#homepage"),archiveUrl:i(n,"#archiveUrl"),archiveType:i(n,"#archiveType"),installDir:i(n,"#installDir"),animations:i(n,"#animations"),binariesContainer:t,envContainer:a,optionsContainer:r})}const v=i(n,"#b64Field");i(n,"#exportB64").addEventListener("click",()=>{f();try{v.value=C(I())}catch(d){m(d instanceof Error?d.message:String(d))}}),i(n,"#importB64").addEventListener("click",()=>{f();try{const d=J(v.value);ee(d,{appName:i(n,"#appName"),version:i(n,"#version"),homepage:i(n,"#homepage"),archiveUrl:i(n,"#archiveUrl"),archiveType:i(n,"#archiveType"),installDir:i(n,"#installDir"),animations:i(n,"#animations"),binariesContainer:t,envContainer:a,optionsContainer:r})}catch(d){m(d instanceof Error?d.message:String(d))}}),i(n,"#clearB64").addEventListener("click",()=>{v.value=""}),i(n,"#generate").addEventListener("click",()=>{f();try{const d=I();p=Q(d),E=d.appName,l.innerHTML=e("pre",null),i(l,"pre").textContent=p,s.style.display="flex"}catch(d){d instanceof u?m(d.message):m(d instanceof Error?d.message:String(d))}}),i(n,"#downloadBtn").addEventListener("click",()=>{if(!p)return;const d=new Blob([p],{type:"text/x-shellscript"}),b=URL.createObjectURL(d),$=document.createElement("a");$.href=b,$.download=`${E||"install"}-install.sh`,document.body.appendChild($),$.click(),$.remove(),URL.revokeObjectURL(b)}),i(n,"#copyBtn").addEventListener("click",()=>{p&&navigator.clipboard.writeText(p).catch(()=>{m("Kopieren hat nicht geklappt. Text lässt sich aus der Vorschau markieren.")})})}export{te as default};
