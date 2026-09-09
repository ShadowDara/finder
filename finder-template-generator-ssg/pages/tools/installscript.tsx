import { jsx, Fragment } from "../../src/jsx-runtime";
import {
  generateInstallerScript,
  type BinarySpec,
  type EnvVarSpec,
  type InstallOption,
  type InstallerConfig,
  type TargetOS,
} from "../../src/lib/installer";
import "./installscript.css";

class ValidationError extends Error {}

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

function collectConfig(dom: {
  appName: HTMLInputElement;
  version: HTMLInputElement;
  homepage: HTMLInputElement;
  archiveUrl: HTMLInputElement;
  archiveType: HTMLSelectElement;
  installDir: HTMLInputElement;
  animations: HTMLInputElement;
  binariesContainer: HTMLElement;
  envContainer: HTMLElement;
  optionsContainer: HTMLElement;
}): InstallerConfig {
  const appName = dom.appName.value.trim();
  if (!appName)
    throw new ValidationError(
      "App-Name fehlt. Ohne Namen kann kein Skript entstehen.",
    );

  const version = dom.version.value.trim();
  if (!version)
    throw new ValidationError("Version fehlt. Trag z.B. 1.0.0 ein.");

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

  return {
    appName,
    version,
    homepage: dom.homepage.value.trim() || undefined,
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
  // Skripts: alles ab dem Marker "#$$$" (inkl. Marker) wird verwendet.
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

  if (!parsed || typeof parsed !== "object")
    throw new ValidationError("Ungültiges JSON im Base64-String.");
  return parsed as InstallerConfig;
}

// Generiert das fertige Skript inkl. Konfigurations-Footer:
// die letzte Zeile ist "#$$$<base64>" und reist so im Skript mit.
function buildInstallScript(config: InstallerConfig): string {
  return (
    generateInstallerScript(config) +
    "\n# Base64 of the input values for the generator\nso you dont have to type it all again\n#$$$" +
    configToBase64(config) +
    "\n"
  );
}

function clearContainer(container: HTMLElement): void {
  container.innerHTML = "";
}

function applyConfigToForm(
  config: InstallerConfig,
  dom: {
    appName: HTMLInputElement;
    version: HTMLInputElement;
    homepage: HTMLInputElement;
    archiveUrl: HTMLInputElement;
    archiveType: HTMLSelectElement;
    installDir: HTMLInputElement;
    animations: HTMLInputElement;
    binariesContainer: HTMLElement;
    envContainer: HTMLElement;
    optionsContainer: HTMLElement;
  },
): void {
  dom.appName.value = config.appName || "";
  dom.version.value = config.version || "";
  dom.homepage.value = config.homepage || "";
  dom.archiveUrl.value = config.archive?.url || "";
  dom.archiveType.value = config.archive?.type || "tar.gz";
  dom.installDir.value = config.defaultInstallDir || "";
  dom.animations.checked = config.animations ?? true;

  clearContainer(dom.binariesContainer);
  const binaries = config.binaries || [];
  if (binaries.length === 0) {
    dom.binariesContainer.appendChild(createBinaryRow("", ""));
  } else {
    for (const b of binaries) {
      const row = createBinaryRow(b.archivePath || "", b.targetName || "");
      const prefix = row.getAttribute("data-os-prefix") || "";
      if (b.os && b.os.length === 1) {
        qs<HTMLInputElement>(row, `[name="${prefix}-linux"]`).checked =
          b.os[0] === "linux";
        qs<HTMLInputElement>(row, `[name="${prefix}-darwin"]`).checked =
          b.os[0] === "darwin";
      }
      dom.binariesContainer.appendChild(row);
    }
  }

  clearContainer(dom.envContainer);
  for (const e of config.envVars || []) {
    const row = createEnvRow();
    qs<HTMLInputElement>(row, ".env-name").value = e.name || "";
    qs<HTMLInputElement>(row, ".env-value").value = e.value || "";
    qs<HTMLInputElement>(row, ".env-append").checked = !!e.append;
    const prefix = row.getAttribute("data-os-prefix") || "";
    if (e.os && e.os.length === 1) {
      qs<HTMLInputElement>(row, `[name="${prefix}-linux"]`).checked =
        e.os[0] === "linux";
      qs<HTMLInputElement>(row, `[name="${prefix}-darwin"]`).checked =
        e.os[0] === "darwin";
    }
    dom.envContainer.appendChild(row);
  }

  clearContainer(dom.optionsContainer);
  for (const o of config.installOptions || []) {
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
            <span>Version</span>
            <input type="text" id="version" placeholder="1.0.0" />
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
        <p class="hint">Optionale Umgebungsvariablen für die Shell-RC-Datei.</p>
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

      <footer class="note">
        Wird lokal im Browser erzeugt. Keine Daten verlassen diese Seite.
      </footer>
    </>
  );

  const binariesContainer = qs<HTMLElement>(app, "#binariesContainer");
  const envContainer = qs<HTMLElement>(app, "#envContainer");
  const optionsContainer = qs<HTMLElement>(app, "#optionsContainer");

  // Startzustand: eine ausgefüllte Beispielzeile, damit sofort klar ist,
  // was reingehört.
  binariesContainer.appendChild(createBinaryRow("bin/mytool", "mytool"));

  qs<HTMLButtonElement>(app, "#addBinary").addEventListener("click", () => {
    binariesContainer.appendChild(createBinaryRow());
  });
  qs<HTMLButtonElement>(app, "#addEnv").addEventListener("click", () => {
    envContainer.appendChild(createEnvRow());
  });
  qs<HTMLButtonElement>(app, "#addOption").addEventListener("click", () => {
    optionsContainer.appendChild(createOptionRow());
  });

  const errorBanner = qs<HTMLElement>(app, "#errorBanner");
  const outputBody = qs<HTMLElement>(app, "#outputBody");
  const terminalActions = qs<HTMLElement>(app, "#terminalActions");
  let currentScript = "";
  let currentAppName = "install";

  function showError(message: string): void {
    errorBanner.textContent = message;
    errorBanner.classList.add("visible");
  }

  function clearError(): void {
    errorBanner.textContent = "";
    errorBanner.classList.remove("visible");
  }

  // Aktuelle Formularwerte als InstallerConfig sammeln (ohne generieren).
  function currentConfig(): InstallerConfig {
    return collectConfig({
      appName: qs<HTMLInputElement>(app, "#appName"),
      version: qs<HTMLInputElement>(app, "#version"),
      homepage: qs<HTMLInputElement>(app, "#homepage"),
      archiveUrl: qs<HTMLInputElement>(app, "#archiveUrl"),
      archiveType: qs<HTMLSelectElement>(app, "#archiveType"),
      installDir: qs<HTMLInputElement>(app, "#installDir"),
      animations: qs<HTMLInputElement>(app, "#animations"),
      binariesContainer,
      envContainer,
      optionsContainer,
    });
  }

  const b64Field = qs<HTMLTextAreaElement>(app, "#b64Field");

  qs<HTMLButtonElement>(app, "#exportB64").addEventListener("click", () => {
    clearError();
    try {
      b64Field.value = configToBase64(currentConfig());
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
    }
  });

  qs<HTMLButtonElement>(app, "#importB64").addEventListener("click", () => {
    clearError();
    try {
      const config = base64ToConfig(b64Field.value);
      applyConfigToForm(config, {
        appName: qs<HTMLInputElement>(app, "#appName"),
        version: qs<HTMLInputElement>(app, "#version"),
        homepage: qs<HTMLInputElement>(app, "#homepage"),
        archiveUrl: qs<HTMLInputElement>(app, "#archiveUrl"),
        archiveType: qs<HTMLSelectElement>(app, "#archiveType"),
        installDir: qs<HTMLInputElement>(app, "#installDir"),
        animations: qs<HTMLInputElement>(app, "#animations"),
        binariesContainer,
        envContainer,
        optionsContainer,
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
    }
  });

  qs<HTMLButtonElement>(app, "#clearB64").addEventListener("click", () => {
    b64Field.value = "";
  });

  qs<HTMLButtonElement>(app, "#generate").addEventListener("click", () => {
    clearError();
    try {
      const config = currentConfig();

      currentScript = buildInstallScript(config);
      currentAppName = config.appName;

      outputBody.innerHTML = <pre></pre>;
      qs<HTMLElement>(outputBody, "pre").textContent = currentScript;
      terminalActions.style.display = "flex";
    } catch (e) {
      if (e instanceof ValidationError) {
        showError(e.message);
      } else {
        showError(e instanceof Error ? e.message : String(e));
      }
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
