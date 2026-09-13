import { jsx } from "../src/jsx-runtime";
import { generateRegex, type MatchMode } from "../src/lib/regex";
import "./regexcreator.css";

export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <main class="regexcreator-page">
      <header class="intro">
        <h1>
          <span>Regex-Generator</span> /{" "}
          <span>
            <a href="../">Home</a>
          </span>
        </h1>
        <p>
          Zwei Wortlisten werden zu einem Muster verrechnet: alles aus der
          ersten Liste passt, alles aus der zweiten nicht. Für Datei-Endungen
          einfach den Modus <em>endet mit</em> wählen und z. B.{" "}
          <code>.jpg</code> und <code>.jpeg</code> eingeben.
        </p>
      </header>

      <main class="stage">
        <section class="sets">
          <div class="card card--accept">
            <label for="accept">Akzeptieren</label>
            <textarea
              id="accept"
              rows="8"
              spellcheck="false"
              placeholder="ein Wort pro Zeile – z.B. .jpg"
            >
              cat{"\n"}car{"\n"}cart{"\n"}dog{"\n"}do
            </textarea>
          </div>

          <div class="operator" aria-hidden="true">
            <span class="operator__glyph">∖</span>
            <span class="operator__label">ohne</span>
          </div>

          <div class="card card--disallow">
            <label for="disallow">Ablehnen</label>
            <textarea
              id="disallow"
              rows="8"
              spellcheck="false"
              placeholder="ein Wort pro Zeile (optional)"
            >
              cot{"\n"}cats{"\n"}dot
            </textarea>
          </div>
        </section>

        <div class="settings">
          <div class="mode-selector" role="group" aria-label="Abgleich-Modus">
            <button type="button" data-mode="exact" aria-pressed="true">
              exakt
            </button>
            <button type="button" data-mode="startsWith">
              beginnt mit
            </button>
            <button type="button" data-mode="endsWith">
              endet mit
            </button>
            <button type="button" data-mode="contains">
              enthält
            </button>
          </div>

          <label class="checkbox">
            <input type="checkbox" id="ignore-case" />
            <span>Groß-/Kleinschreibung ignorieren</span>
          </label>
        </div>

        <div class="flow-line" aria-hidden="true"></div>

        <section class="card card--output" id="output-wrap" data-state="ready">
          <div class="card__head">
            <label for="output">Ergebnis</label>
            <button id="copy-btn" type="button">
              Kopieren
            </button>
          </div>
          <code id="output"></code>
        </section>

        <section class="card card--share" id="share-wrap">
          <div class="card__head">
            <label for="share-output">
              Zustand als Base64 (zum Speichern/Teilen)
            </label>
            <button id="share-copy-btn" type="button">
              Kopieren
            </button>
          </div>
          <code id="share-output"></code>
          <details class="share-restore">
            <summary>Aus Base64 wiederherstellen</summary>
            <div class="restore-row">
              <input
                id="restore-input"
                type="text"
                placeholder="Base64-String einfügen …"
                autocomplete="off"
                spellcheck="false"
              />
              <button id="restore-btn" type="button">
                Laden
              </button>
            </div>
          </details>
        </section>

        <section class="card card--tester">
          <label for="tester">Testen</label>
          <div class="tester-row">
            <input
              id="tester"
              type="text"
              placeholder="Text eingeben … z.B. photo.jpg"
              autocomplete="off"
            />
            <span id="badge" class="badge" data-state="idle">
              –
            </span>
          </div>
        </section>
      </main>
    </main>
  );

  const acceptEl = el.querySelector<HTMLTextAreaElement>("#accept")!;
  const disallowEl = el.querySelector<HTMLTextAreaElement>("#disallow")!;
  const ignoreCaseEl = el.querySelector<HTMLInputElement>("#ignore-case")!;
  const outputWrapEl = el.querySelector<HTMLElement>("#output-wrap")!;
  const outputEl = el.querySelector<HTMLElement>("#output")!;
  const copyBtn = el.querySelector<HTMLButtonElement>("#copy-btn")!;
  const testerEl = el.querySelector<HTMLInputElement>("#tester")!;
  const badgeEl = el.querySelector<HTMLElement>("#badge")!;
  const shareOutputEl = el.querySelector<HTMLElement>("#share-output")!;
  const shareCopyBtn = el.querySelector<HTMLButtonElement>("#share-copy-btn")!;
  const restoreInputEl = el.querySelector<HTMLInputElement>("#restore-input")!;
  const restoreBtn = el.querySelector<HTMLButtonElement>("#restore-btn")!;

  const modeButtons = Array.from(
    el.querySelectorAll<HTMLButtonElement>(".mode-selector button"),
  );
  let currentMode: MatchMode = "exact";

  for (const btn of modeButtons) {
    btn.addEventListener("click", () => {
      currentMode = (btn.dataset.mode as MatchMode) ?? "exact";

      for (const other of modeButtons) {
        other.setAttribute("aria-pressed", String(other === btn));
      }

      update();
    });
  }

  let currentRegex: RegExp | null = null;
  let copyResetTimer: number | undefined;
  let shareCopyTimer: number | undefined;
  let restoreFeedbackTimer: number | undefined;
  let currentShare: string | null = null;

  function parseLines(value: string): string[] {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  interface SharePayload {
    v: 1;
    a: string;
    d: string;
    m: MatchMode;
    i: boolean;
  }

  function utf8ToBase64(input: string): string {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToUtf8(input: string): string {
    const binary = atob(input.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function isMatchMode(value: unknown): value is MatchMode {
    return (
      value === "exact" ||
      value === "startsWith" ||
      value === "endsWith" ||
      value === "contains"
    );
  }

  function update(): void {
    const accept = parseLines(acceptEl.value);
    const disallow = parseLines(disallowEl.value);
    const flags = ignoreCaseEl.checked ? "i" : "";

    updateShare();

    if (accept.length === 0) {
      currentRegex = null;
      outputEl.textContent = "";
      outputWrapEl.dataset.state = "empty";
      copyBtn.disabled = true;
      updateTester();
      return;
    }

    try {
      currentRegex = generateRegex(accept, disallow, {
        flags,
        mode: currentMode,
      });
      outputEl.textContent = currentRegex.source;
      outputWrapEl.dataset.state = "ready";
      copyBtn.disabled = false;
    } catch (err) {
      currentRegex = null;
      outputEl.textContent = err instanceof Error ? err.message : String(err);
      outputWrapEl.dataset.state = "error";
      copyBtn.disabled = true;
    }

    updateTester();
  }

  function updateTester(): void {
    const value = testerEl.value;

    if (!currentRegex || value.length === 0) {
      badgeEl.textContent = "–";
      badgeEl.dataset.state = "idle";
      return;
    }

    const matches = currentRegex.test(value);
    badgeEl.textContent = matches ? "passt" : "passt nicht";
    badgeEl.dataset.state = matches ? "match" : "no-match";
  }

  acceptEl.addEventListener("input", update);
  disallowEl.addEventListener("input", update);
  ignoreCaseEl.addEventListener("change", update);
  testerEl.addEventListener("input", updateTester);

  copyBtn.addEventListener("click", async () => {
    if (!currentRegex) return;

    await navigator.clipboard.writeText(currentRegex.source);
    copyBtn.textContent = "Kopiert";
    window.clearTimeout(copyResetTimer);
    copyResetTimer = window.setTimeout(() => {
      copyBtn.textContent = "Kopieren";
    }, 1200);
  });

  function updateShare(): void {
    const payload: SharePayload = {
      v: 1,
      a: acceptEl.value,
      d: disallowEl.value,
      m: currentMode,
      i: ignoreCaseEl.checked,
    };

    currentShare = utf8ToBase64(JSON.stringify(payload));
    shareOutputEl.textContent = currentShare;
    shareCopyBtn.disabled = false;
  }

  shareCopyBtn.addEventListener("click", async () => {
    if (!currentShare) return;

    await navigator.clipboard.writeText(currentShare);
    shareCopyBtn.textContent = "Kopiert";
    window.clearTimeout(shareCopyTimer);
    shareCopyTimer = window.setTimeout(() => {
      shareCopyBtn.textContent = "Kopieren";
    }, 1200);
  });

  function setRestoreFeedback(text: string): void {
    restoreBtn.textContent = text;
    window.clearTimeout(restoreFeedbackTimer);
    restoreFeedbackTimer = window.setTimeout(() => {
      restoreBtn.textContent = "Laden";
    }, 1200);
  }

  restoreBtn.addEventListener("click", () => {
    const raw = restoreInputEl.value.trim();
    if (!raw) return;

    try {
      const data: unknown = JSON.parse(base64ToUtf8(raw));
      if (!data || typeof data !== "object") {
        throw new Error("Kein gültiger Datensatz.");
      }

      const payload = data as Partial<SharePayload>;

      if (typeof payload.a === "string") acceptEl.value = payload.a;
      if (typeof payload.d === "string") disallowEl.value = payload.d;

      if (isMatchMode(payload.m)) {
        currentMode = payload.m;
        for (const other of modeButtons) {
          other.setAttribute(
            "aria-pressed",
            String(other.dataset.mode === payload.m),
          );
        }
      }

      if (typeof payload.i === "boolean") ignoreCaseEl.checked = payload.i;

      update();
      setRestoreFeedback("Geladen");
    } catch {
      setRestoreFeedback("Ungültig");
    }
  });

  restoreInputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      restoreBtn.click();
    }
  });

  update();
}
