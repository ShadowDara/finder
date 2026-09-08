import { jsx } from "../src/jsx-runtime";
import { generateRegex } from "../src/lib/regex";
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
          ersten Liste passt, alles aus der zweiten nicht.
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
              placeholder="ein Wort pro Zeile"
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
              placeholder="ein Wort pro Zeile"
            >
              cot{"\n"}cats{"\n"}dot
            </textarea>
          </div>
        </section>

        <div class="settings">
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

        <section class="card card--tester">
          <label for="tester">Testen</label>
          <div class="tester-row">
            <input
              id="tester"
              type="text"
              placeholder="Text eingeben …"
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

  let currentRegex: RegExp | null = null;
  let copyResetTimer: number | undefined;

  function parseLines(value: string): string[] {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function update(): void {
    const accept = parseLines(acceptEl.value);
    const disallow = parseLines(disallowEl.value);
    const flags = ignoreCaseEl.checked ? "i" : "";

    if (accept.length === 0) {
      currentRegex = null;
      outputEl.textContent = "";
      outputWrapEl.dataset.state = "empty";
      copyBtn.disabled = true;
      updateTester();
      return;
    }

    try {
      currentRegex = generateRegex(accept, disallow, { flags });
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

  update();
}
