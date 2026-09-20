import {
  generateInstallerScript,
  type BinarySpec,
  type EnvVarSpec,
  type InstallOption,
  type InstallerConfig,
  type TargetOS,
} from "../../src/lib/installer";
import "./installscript.css";
import { jsx, Fragment } from "twynejs/jsx-runtime";

class ValidationError extends Error {}

type VersionMode = "fixed" | "latest" | "tags";

/** Alle Formularelemente an einer Stelle (statt Dom-Objekte mehrfach zu bauen). */
interface FormDom {
  appName: HTMLInputElement;
  version: HTMLInputElement;
  homepage: HTMLInputElement;
  archiveUrl: HTMLInputElement;
  archiveType: HTMLSelectElement;
  installDir: HTMLInputElement;
  animations: HTMLInputElement;
  useLatest: HTMLInputElement;
  versionMode: HTMLSelectElement;
  latestVersionUrl: HTMLInputElement;
  tagsVersionUrl: HTMLInputElement;
  binariesContainer: HTMLElement;
  envContainer: HTMLElement;
  optionsContainer: HTMLElement;
}

function el<T extends HTMLElement>(html: string | { toString(): string }): T {
  const markup = String(html).trim();
  const template = document.createElement("template");
  template.innerHTML = markup;
  const node = template.content.firstElementChild;
  if (!node) throw new Error("Konnte Element nicht erzeugen: " + markup);
  return node as T;
}

function qs<T extends Element>(root: ParentNode, selector: string): T {
  const found = root.querySelector(selector);
  if (!found) throw new Error(`Element nicht gefunden: ${selector}`);
  return found as T;
}

function osChips(name: string): string {
  return (
    <div class="field narrow">
      <span>OS</span>
      <div class="os-chips">
        <label class="os-chip">
          <input type="checkbox" name={`${name}-linux`} /> linux
        </label>
        <label class="os-chip">
          <input type="checkbox" name={`${name}-darwin`} /> macOS
        </label>
      </div>
    </div>
  );
}

function readOsRestriction(
  row: Element,
  prefix: string,
): TargetOS[] | undefined {
  const linux = qs<HTMLInputElement>(row, `[name="${prefix}-linux"]`).checked;
  const darwin = qs<HTMLInputElement>(row, `[name="${prefix}-darwin"]`).checked;
  if (linux && !darwin) return ["linux"];
  if (darwin && !linux) return ["darwin"];
  return undefined; // beide oder keins angehakt = beide Systeme
}

/** Gegenstück zu readOsRestriction (für den Import). */
function applyOsRestriction(row: Element, os?: TargetOS[]): void {
  const prefix = row.getAttribute("data-os-prefix") || "";
  const only = os && os.length === 1 ? os[0] : undefined;
  qs<HTMLInputElement>(row, `[name="${prefix}-linux"]`).checked =
    only === "linux";
  qs<HTMLInputElement>(row, `[name="${prefix}-darwin"]`).checked =
    only === "darwin";
}

function githubApiBase(homepage: string): string | null {
  const m = homepage
    .trim()
    .match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/#?\s]+)/i);
  return m
    ? `https://api.github.com/repos/${m[1]}/${m[2].replace(/\.git$/i, "")}`
    : null;
}

// ============================================================================
// 5) Zeilen-Templates (Binaries / Env-Vars / Install-Optionen)
// ============================================================================

function createBinaryRow(archivePath = "", targetName = ""): HTMLElement {
  const row = el<HTMLElement>(
    <div class="row" data-kind="binary">
      <label class="field wide">
        <span>Pfad im Archiv</span>
        <input type="text" class="bin-path" placeholder="bin/mytool" />
      </label>
      <label class="field">
        <span>Zielname (optional)</span>
        <input type="text" class="bin-target" placeholder="mytool" />
      </label>
      {osChips("bin-os")}
      <button type="button" class="btn-remove" title="Zeile entfernen">
        ×
      </button>
    </div>,
  );
  qs<HTMLInputElement>(row, ".bin-path").value = archivePath;
  qs<HTMLInputElement>(row, ".bin-target").value = targetName;
  wireOsChipNames(row, "bin-os");
  wireRemove(row, "binary");
  return row;
}

function createEnvRow(): HTMLElement {
  const row = el<HTMLElement>(
    <div class="row" data-kind="env">
      <label class="field">
        <span>Name</span>
        <input type="text" class="env-name" placeholder="MYTOOL_HOME" />
      </label>
      <label class="field wide">
        <span>Wert</span>
        <input type="text" class="env-value" placeholder="$INSTALL_PREFIX" />
      </label>
      <label class="append-chip">
        <input type="checkbox" class="env-append" /> anhängen
      </label>
      {osChips("env-os")}
      <button type="button" class="btn-remove" title="Zeile entfernen">
        ×
      </button>
    </div>,
  );
  wireOsChipNames(row, "env-os");
  wireRemove(row, "env");
  return row;
}

function createOptionRow(): HTMLElement {
  const row = el<HTMLElement>(
    <div class="row" data-kind="option">
      <label class="field narrow">
        <span>ID</span>
        <input type="text" class="opt-id" placeholder="minimal" />
      </label>
      <label class="field">
        <span>Label</span>
        <input type="text" class="opt-label" placeholder="Minimal" />
      </label>
      <label class="field wide">
        <span>Beschreibung</span>
        <input type="text" class="opt-desc" placeholder="Nur die CLI" />
      </label>
      <label class="field wide">
        <span>Enthaltene Binaries (Zielnamen, kommagetrennt)</span>
        <input type="text" class="opt-binaries" placeholder="mytool" />
      </label>
      <button type="button" class="btn-remove" title="Zeile entfernen">
        ×
      </button>
    </div>,
  );
  wireRemove(row, "option");
  return row;
}

let chipCounter = 0;

// Jede Zeile braucht eindeutige input[name], sonst würden sich Checkboxen
// über mehrere Zeilen hinweg querySelector-mäßig überschneiden.
function wireOsChipNames(row: Element, prefix: string): void {
  const id = `${prefix}-${chipCounter++}`;
  qs<HTMLInputElement>(row, `[name="${prefix}-linux"]`).name = `${id}-linux`;
  qs<HTMLInputElement>(row, `[name="${prefix}-darwin"]`).name = `${id}-darwin`;
  row.setAttribute("data-os-prefix", id);
}

function wireRemove(row: HTMLElement, kind: "binary" | "env" | "option"): void {
  const btn = qs<HTMLButtonElement>(row, ".btn-remove");
  btn.addEventListener("click", () => {
    const container = row.parentElement;
    if (!container) return;
    if (kind === "binary" && container.children.length <= 1) {
      // Mindestens eine Binary muss übrig bleiben – Zeile stattdessen leeren.
      qs<HTMLInputElement>(row, ".bin-path").value = "";
      qs<HTMLInputElement>(row, ".bin-target").value = "";
      return;
    }
    row.remove();
  });
}

// ============================================================================
// 6) Formular auslesen + validieren
// ============================================================================

function readBinaries(container: Element): BinarySpec[] {
  const rows = Array.from(
    container.querySelectorAll<HTMLElement>('[data-kind="binary"]'),
  );
  const specs: BinarySpec[] = [];
  for (const row of rows) {
    const archivePath = qs<HTMLInputElement>(row, ".bin-path").value.trim();
    if (!archivePath) continue;
    const targetName = qs<HTMLInputElement>(row, ".bin-target").value.trim();
    const prefix = row.getAttribute("data-os-prefix") || "bin-os";
    const os = readOsRestriction(row, prefix);
    specs.push({ archivePath, targetName: targetName || undefined, os });
  }
  return specs;
}

function readEnvVars(container: Element): EnvVarSpec[] {
  const rows = Array.from(
    container.querySelectorAll<HTMLElement>('[data-kind="env"]'),
  );
  const specs: EnvVarSpec[] = [];
  for (const row of rows) {
    const name = qs<HTMLInputElement>(row, ".env-name").value.trim();
    if (!name) continue;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new ValidationError(
        `Ungültiger Variablenname "${name}" (erlaubt: Buchstaben, Ziffern, _).`,
      );
    }
    const value = qs<HTMLInputElement>(row, ".env-value").value.trim();
    const append = qs<HTMLInputElement>(row, ".env-append").checked;
    const prefix = row.getAttribute("data-os-prefix") || "env-os";
    const os = readOsRestriction(row, prefix);
    specs.push({ name, value, append: append || undefined, os });
  }
  return specs;
}

function readInstallOptions(container: Element): InstallOption[] {
  const rows = Array.from(
    container.querySelectorAll<HTMLElement>('[data-kind="option"]'),
  );
  const options: InstallOption[] = [];
  for (const row of rows) {
    const id = qs<HTMLInputElement>(row, ".opt-id").value.trim();
    if (!id) continue;
    const label = qs<HTMLInputElement>(row, ".opt-label").value.trim() || id;
    const description = qs<HTMLInputElement>(row, ".opt-desc").value.trim();
    const binariesRaw = qs<HTMLInputElement>(row, ".opt-binaries").value.trim();
    const binaries = binariesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (binaries.length === 0) {
      throw new ValidationError(
        `Installationsoption "${id}" braucht mindestens eine Binary in der Liste.`,
      );
    }
    options.push({
      id,
      label,
      description: description || undefined,
      binaries,
    });
  }
  return options;
}

function collectConfig(dom: FormDom): InstallerConfig {
  const appName = dom.appName.value.trim();
  if (!appName)
    throw new ValidationError(
      "App-Name fehlt. Ohne Namen kann kein Skript entstehen.",
    );
  // Der Name landet u.a. im Default-Installpfad im Skript -> keine Shell-Sonderzeichen.
  if (!/^[A-Za-z0-9._-]+$/.test(appName))
    throw new ValidationError(
      "App-Name darf nur Buchstaben, Ziffern, '.', '_' und '-' enthalten.",
    );

  const archiveUrl = dom.archiveUrl.value.trim();
  if (!archiveUrl) throw new ValidationError("Die Archiv-URL fehlt.");

  const binaries = readBinaries(dom.binariesContainer);
  if (binaries.length === 0) {
    throw new ValidationError(
      "Mindestens eine Binary wird gebraucht (Pfad im Archiv angeben).",
    );
  }

  const envVars = readEnvVars(dom.envContainer);
  const installOptions = readInstallOptions(dom.optionsContainer);

  const versionMode = dom.versionMode.value as VersionMode;
  const versionFixed = dom.version.value.trim();
  const latestVersionUrl = dom.latestVersionUrl.value.trim() || undefined;
  const tagsUrl = dom.tagsVersionUrl.value.trim() || undefined;

  let version: string;
  if (versionMode === "fixed") {
    if (!versionFixed)
      throw new ValidationError("Version fehlt. Trag z.B. 1.0.0 ein.");
    version = versionFixed;
  } else {
    // latest/tags: konkrete Version wird erst beim Ausführen des Skripts bestimmt.
    version = "latest";
  }

  return {
    appName,
    version,
    versionMode,
    homepage: dom.homepage.value.trim() || undefined,
    latestVersionUrl,
    tagsUrl,
    archive: {
      url: archiveUrl,
      type: dom.archiveType.value as "tar.gz" | "zip",
    },
    binaries,
    envVars: envVars.length > 0 ? envVars : undefined,
    installOptions: installOptions.length > 0 ? installOptions : undefined,
    defaultInstallDir: dom.installDir.value.trim() || undefined,
    animations: dom.animations.checked,
  };
}

// ---------------------------------------------------------------------------
// 6b) Base64 JSON Import / Export (UTF-8 safe)
// ---------------------------------------------------------------------------

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64Utf8(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function configToBase64(config: InstallerConfig): string {
  return toBase64Utf8(JSON.stringify(config));
}

function base64ToConfig(b64: string): InstallerConfig {
  const text = b64.trim();
  if (!text) throw new ValidationError("Kein Base64-String eingefügt.");

  // Erlaubt sowohl rohen Base64 als auch den Footer eines generierten
  // Skripts: alles nach dem Marker "#$$$" wird verwendet.
  const markerIndex = text.lastIndexOf("#$$$");
  const encoded =
    markerIndex !== -1 ? text.slice(markerIndex + 4).trim() : text;

  let json: string;
  try {
    json = fromBase64Utf8(encoded);
  } catch {
    throw new ValidationError("Ungültiger Base64-String.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ValidationError("Ungültiges JSON im Base64-String.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new ValidationError("Ungültiges JSON im Base64-String.");
  return parsed as InstallerConfig;
}

// Generiert das fertige Skript inkl. Konfigurations-Footer:
// die letzte Zeile ist "#$$$<base64>" und reist so im Skript mit.
function buildInstallScript(config: InstallerConfig): string {
  return (
    generateInstallerScript(config) +
    "\n# Base64 of the input values for the generator\n# so you dont have to type it all again\n#\n#$$$" +
    configToBase64(config) +
    "\n"
  );
}

function clearContainer(container: HTMLElement): void {
  container.innerHTML = "";
}

function applyConfigToForm(config: InstallerConfig, dom: FormDom): void {
  // Ältere Exporte kennen kein versionMode / tagsUrl.
  const mode: VersionMode =
    config.versionMode ?? (config.version === "latest" ? "latest" : "fixed");

  dom.appName.value = config.appName || "";
  dom.version.value =
    config.version && config.version !== "latest" ? config.version : "";
  dom.homepage.value = config.homepage || "";
  dom.archiveUrl.value = config.archive?.url || "";
  dom.archiveType.value = config.archive?.type || "tar.gz";
  dom.installDir.value = config.defaultInstallDir || "";
  dom.animations.checked = config.animations ?? true;

  if (mode === "tags" && !config.tagsUrl) {
    // Alt-Format: tags-URL lag in latestVersionUrl
    dom.tagsVersionUrl.value = config.latestVersionUrl || "";
    dom.latestVersionUrl.value = "";
  } else {
    dom.latestVersionUrl.value = config.latestVersionUrl || "";
    dom.tagsVersionUrl.value = config.tagsUrl || "";
  }

  // Sichtbarkeit/disabled-Zustand übernimmt der change-Handler (syncVersionModeUI).
  dom.versionMode.value = mode;
  dom.versionMode.dispatchEvent(new Event("change"));

  clearContainer(dom.binariesContainer);
  const binaries = Array.isArray(config.binaries) ? config.binaries : [];
  if (binaries.length === 0) {
    dom.binariesContainer.appendChild(createBinaryRow("", ""));
  } else {
    for (const b of binaries) {
      const row = createBinaryRow(b.archivePath || "", b.targetName || "");
      applyOsRestriction(row, b.os);
      dom.binariesContainer.appendChild(row);
    }
  }

  clearContainer(dom.envContainer);
  for (const e of Array.isArray(config.envVars) ? config.envVars : []) {
    const row = createEnvRow();
    qs<HTMLInputElement>(row, ".env-name").value = e.name || "";
    qs<HTMLInputElement>(row, ".env-value").value = e.value || "";
    qs<HTMLInputElement>(row, ".env-append").checked = !!e.append;
    applyOsRestriction(row, e.os);
    dom.envContainer.appendChild(row);
  }

  clearContainer(dom.optionsContainer);
  for (const o of Array.isArray(config.installOptions)
    ? config.installOptions
    : []) {
    const row = createOptionRow();
    qs<HTMLInputElement>(row, ".opt-id").value = o.id || "";
    qs<HTMLInputElement>(row, ".opt-label").value = o.label || "";
    qs<HTMLInputElement>(row, ".opt-desc").value = o.description || "";
    qs<HTMLInputElement>(row, ".opt-binaries").value = (o.binaries || []).join(
      ", ",
    );
    dom.optionsContainer.appendChild(row);
  }
}

export default function buildPage(app: HTMLElement): void {
  app.innerHTML = (
    <>
      <div class="runner">
        <span>
          <a href="../../">HOME</a>
        </span>
        <span>INSTALLER-MAKER(1)</span>
        <span>Installer Generator</span>
        <span>INSTALLER-MAKER(1)</span>
      </div>

      <div class="intro">
        <h1>Baue dir dein install.sh</h1>
        <p>
          Trag deine App, das Release-Archiv und die enthaltenen Binaries ein.
          Daraus entsteht ein einzelnes Bash-Skript für Linux und macOS, das
          herunterlädt, entpackt, in den PATH einträgt und optional zwischen
          Installationsarten wählen lässt. Alles läuft nur in diesem Browser, es
          wird nichts hochgeladen.
        </p>
      </div>

      <section class="card">
        <h2>Name</h2>
        <p class="hint">Wie deine App heißt und wo sie herkommt.</p>
        <div class="field-grid">
          <label class="field">
            <span>App-Name</span>
            <input type="text" id="appName" placeholder="mytool" />
          </label>
          <label class="field">
            <span>Homepage (optional)</span>
            <input
              type="text"
              id="homepage"
              placeholder="https://example.com/mytool"
            />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Version</h2>
        <p class="hint">
          Bei einer GitHub-Homepage werden die API-URLs automatisch
          vorgeschlagen.
        </p>
        <div class="field-grid">
          <label class="field wide">
            <span>Version-Modus</span>
            <select id="versionMode">
              <option value="fixed">Feste Version</option>
              <option value="latest">Neueste Release-Version</option>
              <option value="tags">Aus GitHub Tags auswählen</option>
            </select>
          </label>

          <label class="field wide">
            <span>Version</span>
            <input type="text" id="version" placeholder="1.0.0" />
          </label>

          <label class="field wide" id="latestSection">
            <span>GitHub API URL (latest)</span>
            <input
              type="text"
              id="latestVersionUrl"
              placeholder="https://api.github.com/repos/<owner>/<repo>/releases/latest"
            />
          </label>

          <label class="field wide" id="tagsSection" style="display:none;">
            <span>GitHub API URL (tags)</span>
            <input
              type="text"
              id="tagsVersionUrl"
              placeholder="https://api.github.com/repos/<owner>/<repo>/tags?per_page=100"
            />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Archiv</h2>
        <p class="hint">
          Platzhalter {"{appName}"} {"{version}"} {"{os}"} {"{arch}"} werden
          beim Installieren aufgelöst, z.B. zu "mytool-darwin-arm64".
        </p>
        <div class="field-grid">
          <label class="field wide">
            <span>Archiv-URL-Template</span>
            <input
              type="text"
              id="archiveUrl"
              placeholder="https://example.com/releases/{appName}/{version}/{appName}-{os}-{arch}.tar.gz"
            />
          </label>
          <label class="field">
            <span>Archivtyp</span>
            <select id="archiveType">
              <option value="tar.gz">tar.gz</option>
              <option value="zip">zip</option>
            </select>
          </label>
          <label class="field wide">
            <span>Zielverzeichnis (optional)</span>
            <input
              type="text"
              id="installDir"
              placeholder="$HOME/.local/mytool"
            />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Binaries</h2>
        <p class="hint">
          Pfad, wie die Datei im entpackten Archiv heißt. OS leer lassen = auf
          beiden Systemen installieren.
        </p>
        <div id="binariesContainer"></div>
        <button type="button" class="btn-add" id="addBinary">
          + Binary hinzufügen
        </button>
      </section>

      <section class="card">
        <h2>Environment</h2>
        <p class="hint">
          Optionale Umgebungsvariablen für die Shell-RC-Datei. $INSTALL_PREFIX
          wird beim Installieren durch das echte Zielverzeichnis ersetzt.
        </p>
        <div id="envContainer"></div>
        <button type="button" class="btn-add" id="addEnv">
          + Variable hinzufügen
        </button>
      </section>

      <section class="card">
        <h2>Installationsoptionen</h2>
        <p class="hint">
          Optional. Ohne Eintrag gibt es genau eine Installation mit allen
          Binaries. Mit Einträgen erscheint ein Auswahlmenü (oder --type
          &lt;id&gt;).
        </p>
        <div id="optionsContainer"></div>
        <button type="button" class="btn-add" id="addOption">
          + Option hinzufügen
        </button>
      </section>

      <div class="actions">
        <label class="checkbox-field">
          <input type="checkbox" id="animations" checked /> Ladeanimation im
          Skript
        </label>
        <label class="checkbox-field">
          <input type="checkbox" id="useLatest" /> Neueste Version verwenden
          (latest)
        </label>
        <button type="button" class="btn-primary" id="generate">
          install.sh generieren
        </button>
      </div>

      <section class="card">
        <h2>Konfiguration speichern / laden</h2>
        <p class="hint">
          Exportiert alle Felder als Base64-kodierten JSON-String (UTF-8 sicher)
          oder lädt sie daraus wieder zurück.
        </p>
        <label class="field wide">
          <span>Base64 (Import / Export)</span>
          <textarea
            id="b64Field"
            rows="3"
            spellcheck="false"
            placeholder="Paste einen Base64-String hier ein und klicke auf Import"
          ></textarea>
        </label>
        <div class="actions">
          <button type="button" class="btn-term" id="importB64">
            Importieren
          </button>
          <button type="button" class="btn-term" id="exportB64">
            Exportieren
          </button>
          <button type="button" class="btn-term" id="clearB64">
            Feld leeren
          </button>
        </div>
      </section>

      <div class="error-banner" id="errorBanner"></div>

      <div class="output">
        <h2>Vorschau</h2>
        <div class="terminal">
          <div class="terminal-bar">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="path">~/install.sh</span>
          </div>
          <div id="outputBody">
            <div class="output-empty">
              Noch nichts generiert<span class="cursor"></span>
            </div>
          </div>
          <div
            class="terminal-actions"
            id="terminalActions"
            style="display:none;"
          >
            <button type="button" class="btn-term" id="downloadBtn">
              Herunterladen
            </button>
            <button type="button" class="btn-term" id="copyBtn">
              Kopieren
            </button>
          </div>
        </div>
      </div>

      <section class="card">
        <h2>Verwendung / Tipps</h2>
        <p class="hint">
          So führst du das generierte Skript aus und was es dabei tut. Das
          Skript braucht bash (nicht sh/dash), da es Arrays und Here-Strings
          nutzt.
        </p>

        <h3>Ausführen</h3>
        <p>
          Nach dem Generieren kannst du das Skript direkt im Terminal ausführen.
          Am einfachsten mit:
        </p>
        <pre>
          <code>bash install.sh</code>
        </pre>
        <p>Oder erst ausführbar machen und dann starten (Linux/macOS):</p>
        <pre>
          <code>{"chmod +x install.sh\n./install.sh"}</code>
        </pre>
        <p>
          Das Skript lädt das passende Archiv für dein System (Linux/macOS und
          Architektur) herunter, entpackt es und installiert die Binaries nach{" "}
          <code>$HOME/.local/&lt;app&gt;/bin</code>. Anschließend trägt es
          diesen Ordner in den PATH deiner Shell-RC ein (z.B.{" "}
          <code>~/.bashrc</code> oder <code>~/.zshrc</code>). Mehrfaches
          Ausführen ist sicher: der Eintrag in der RC-Datei wird ersetzt, nicht
          dupliziert.
        </p>

        <h3>Nach der Installation</h3>
        <p>
          Damit der PATH-Update wirkt, starte eine neue Shell oder lade deine
          Konfiguration neu:
        </p>
        <pre>
          <code>source ~/.bashrc</code>
        </pre>
        <p>Danach sollte der Befehl direkt verfügbar sein:</p>
        <pre>
          <code>&lt;app&gt; --help</code>
        </pre>

        <h3>Installationstypen wählen</h3>
        <p>
          Wenn du mehrere Installationsoptionen (Install Options) eingetragen
          hast, fragt das Skript interaktiv nach, welche Variante installiert
          werden soll. Für eine automatisierte Installation kannst du den Typ
          direkt angeben:
        </p>
        <pre>
          <code>bash install.sh -t minimal</code>
        </pre>
        <p>Alle verfügbaren Typen anzeigen:</p>
        <pre>
          <code>bash install.sh --list</code>
        </pre>

        <h3>Versionen</h3>
        <p>
          Im Modus "Neueste Release-Version" ermittelt das Skript beim
          Ausführen die aktuellste Version über die GitHub-API. Im Modus
          "Tags" darfst du die Version aus einer Liste wählen. Beides lässt sich
          auch per Parameter erzwingen:
        </p>
        <pre>
          <code>{"bash install.sh --latest\nbash install.sh --version v1.2.3"}</code>
        </pre>

        <h3>Zielverzeichnis ändern</h3>
        <p>
          Standard ist <code>$HOME/.local/&lt;app&gt;</code>. Mit{" "}
          <code>--prefix</code> kannst du ein anderes Ziel wählen:
        </p>
        <pre>
          <code>bash install.sh --prefix /opt/mein-app</code>
        </pre>

        <h3>Ohne Ladeanimation</h3>
        <p>
          In Skripten oder CI-Umgebungen (ohne TTY) werden Animationen
          automatisch deaktiviert. Du kannst sie aber auch explizit abschalten:
        </p>
        <pre>
          <code>bash install.sh --no-animation</code>
        </pre>

        <h3>Per curl direkt installieren</h3>
        <p>
          Wenn du das Skript irgendwo gehostet hast, kann man es direkt von dort
          ausführen, ohne es erst herunterzuladen:
        </p>
        <pre>
          <code>curl -fsSL https://example.com/install.sh | bash</code>
        </pre>
        <p>
          Achtung: Bei dieser Variante läuft das Skript ohne TTY, also
          automatisch nicht-interaktiv (es wird der erste Installationstyp
          verwendet). Parameter gibst du so mit:
        </p>
        <pre>
          <code>
            curl -fsSL https://example.com/install.sh | bash -s -- --type
            minimal
          </code>
        </pre>

        <h3>Konfiguration wiederherstellen</h3>
        <p>
          Das generierte Skript enthält am Ende einen Kommentar-Block mit der
          Konfiguration als Base64 (Markierung <code>#$$$</code>). Fügst du
          diesen Block (oder nur den Base64-String) oben im Feld "Konfiguration
          speichern / laden" ein und klickst auf "Importieren", werden alle
          Felder wiederhergestellt – so kannst du das Setup später erneut
          anpassen oder auf einem anderen Rechner weiterverwenden.
        </p>
      </section>

      <footer class="note">
        Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite.
      </footer>
    </>
  );

  const dom: FormDom = {
    appName: qs<HTMLInputElement>(app, "#appName"),
    version: qs<HTMLInputElement>(app, "#version"),
    homepage: qs<HTMLInputElement>(app, "#homepage"),
    archiveUrl: qs<HTMLInputElement>(app, "#archiveUrl"),
    archiveType: qs<HTMLSelectElement>(app, "#archiveType"),
    installDir: qs<HTMLInputElement>(app, "#installDir"),
    animations: qs<HTMLInputElement>(app, "#animations"),
    useLatest: qs<HTMLInputElement>(app, "#useLatest"),
    versionMode: qs<HTMLSelectElement>(app, "#versionMode"),
    latestVersionUrl: qs<HTMLInputElement>(app, "#latestVersionUrl"),
    tagsVersionUrl: qs<HTMLInputElement>(app, "#tagsVersionUrl"),
    binariesContainer: qs<HTMLElement>(app, "#binariesContainer"),
    envContainer: qs<HTMLElement>(app, "#envContainer"),
    optionsContainer: qs<HTMLElement>(app, "#optionsContainer"),
  };

  const latestSection = qs<HTMLElement>(app, "#latestSection");
  const tagsSection = qs<HTMLElement>(app, "#tagsSection");

  // Einzige Quelle der Wahrheit für den Version-Zustand ist das Select.
  // Die "latest"-Checkbox unten spiegelt es nur und kann es umschalten.
  function syncVersionModeUI(): void {
    const mode = dom.versionMode.value as VersionMode;
    latestSection.style.display = mode === "latest" ? "" : "none";
    tagsSection.style.display = mode === "tags" ? "" : "none";
    dom.version.disabled = mode !== "fixed";
    dom.useLatest.checked = mode === "latest";
  }
  dom.versionMode.addEventListener("change", syncVersionModeUI);
  dom.useLatest.addEventListener("change", () => {
    dom.versionMode.value = dom.useLatest.checked ? "latest" : "fixed";
    syncVersionModeUI();
  });
  syncVersionModeUI();

  // Auto-Erkennung: Wenn die Homepage ein GitHub-Repo ist, API-URLs vorschlagen
  // (nur in leere Felder, damit manuelle Eingaben nie überschrieben werden).
  dom.homepage.addEventListener("change", () => {
    const base = githubApiBase(dom.homepage.value);
    if (!base) return;
    if (!dom.latestVersionUrl.value.trim())
      dom.latestVersionUrl.value = `${base}/releases/latest`;
    if (!dom.tagsVersionUrl.value.trim())
      dom.tagsVersionUrl.value = `${base}/tags?per_page=100`;
  });

  // Startzustand: eine ausgefüllte Beispielzeile, damit sofort klar ist,
  // was reingehört.
  dom.binariesContainer.appendChild(createBinaryRow("bin/mytool", "mytool"));

  qs<HTMLButtonElement>(app, "#addBinary").addEventListener("click", () => {
    dom.binariesContainer.appendChild(createBinaryRow());
  });
  qs<HTMLButtonElement>(app, "#addEnv").addEventListener("click", () => {
    dom.envContainer.appendChild(createEnvRow());
  });
  qs<HTMLButtonElement>(app, "#addOption").addEventListener("click", () => {
    dom.optionsContainer.appendChild(createOptionRow());
  });

  const errorBanner = qs<HTMLElement>(app, "#errorBanner");
  const outputBody = qs<HTMLElement>(app, "#outputBody");
  const terminalActions = qs<HTMLElement>(app, "#terminalActions");
  let currentScript = "";
  let currentAppName = "install";

  function showError(e: unknown): void {
    errorBanner.textContent = e instanceof Error ? e.message : String(e);
    errorBanner.classList.add("visible");
  }

  function clearError(): void {
    errorBanner.textContent = "";
    errorBanner.classList.remove("visible");
  }

  const b64Field = qs<HTMLTextAreaElement>(app, "#b64Field");

  qs<HTMLButtonElement>(app, "#exportB64").addEventListener("click", () => {
    clearError();
    try {
      b64Field.value = configToBase64(collectConfig(dom));
    } catch (e) {
      showError(e);
    }
  });

  qs<HTMLButtonElement>(app, "#importB64").addEventListener("click", () => {
    clearError();
    try {
      applyConfigToForm(base64ToConfig(b64Field.value), dom);
    } catch (e) {
      showError(e);
    }
  });

  qs<HTMLButtonElement>(app, "#clearB64").addEventListener("click", () => {
    b64Field.value = "";
  });

  qs<HTMLButtonElement>(app, "#generate").addEventListener("click", () => {
    clearError();
    try {
      const config = collectConfig(dom);

      currentScript = buildInstallScript(config);
      currentAppName = config.appName;

      outputBody.innerHTML = <pre></pre>;
      qs<HTMLElement>(outputBody, "pre").textContent = currentScript;
      terminalActions.style.display = "flex";
    } catch (e) {
      showError(e);
    }
  });

  qs<HTMLButtonElement>(app, "#downloadBtn").addEventListener("click", () => {
    if (!currentScript) return;
    const blob = new Blob([currentScript], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentAppName || "install"}-install.sh`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  qs<HTMLButtonElement>(app, "#copyBtn").addEventListener("click", () => {
    if (!currentScript) return;
    navigator.clipboard.writeText(currentScript).catch(() => {
      showError(
        "Kopieren hat nicht geklappt. Text lässt sich aus der Vorschau markieren.",
      );
    });
  });
}
