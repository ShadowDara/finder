import { jsx, Fragment } from "../src/jsx-runtime";
import * as monaco from "monaco-editor";
import "./monaco.css";
import { jsToFling } from "js-to-fling";
import { loadWASM } from "onigasm";
import { Registry } from "monaco-textmate";
import { wireTmGrammars } from "monaco-editor-textmate";
import onigasmWasm from "onigasm/lib/onigasm.wasm?url";
import * as shikiLangs from "@shikijs/langs";

const DEFAULT_VALUE = `// examples/example1.ts
// A tour of the subset this compiler supports. Compile with:
//   npx ts-node src/cli.ts examples/example1.ts -o examples/example1.fling

// Paste any typescript code here which should be ported

function classify(x: number): string {
  if (x < 0) {
    return "negative";
  }
  if (x === 0) {
    return "zero";
  }
  return "positive";
}

function clampLabel(x: number): string {
  // ternary in a return position -- lowered to if/else automatically
  const label = x > 100 ? "big" : "small";
  return label;
}

function sumUpTo(n: number): number {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

const nums = [1, 2, 3, 4, 5];
let i = 0;
while (i < nums.length) {
  console.log("value:", nums[i], "->", classify(nums[i]));
  i++;
}

const person = { name: "Ada", age: 36 };
console.log(\`Name: \${person.name}, age: \${person.age}\`);

console.log("sum 1..10 =", sumUpTo(10));
console.log("5 % 2 =", 5 % 2); // compiled with swapped operands to counter bug B1
console.log("classify(-3) =", classify(-3));
console.log("clampLabel(250) =", clampLabel(250));
`;

/**
 * Monaco hat KEINE native TextMate-Tokenisierung eingebaut — das ist ein
 * reines VS-Code-Feature. Hier wird das mit `monaco-editor-textmate` +
 * `onigasm` nachgerüstet: Die echten .tmLanguage.json-Grammars von
 * VS-Code-Erweiterungen (aus @shikijs/langs) werden per `EncodedTokensProvider`
 * in die Monaco-Instanz verdrahtet.
 */
const TM_GRAMMARS: Record<string, string> = {
  typescript: "source.ts",
  javascript: "source.js",
  json: "source.json",
  css: "source.css",
  html: "text.html.basic",
  markdown: "text.html.markdown",
  xml: "text.xml",
  yaml: "source.yaml",
  python: "source.python",
  go: "source.go",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setupTextMate(editor: any) {
  // Oniguruma (die Regex-Engine hinter TextMate) als WASM in den Browser laden.
  await loadWASM(onigasmWasm);

  const registry = new Registry({
    getGrammarDefinition: async (scopeName: string) => {
      // @shikijs/langs exportiert jede Sprache als Top-Level-Prop
      // (gleicher Name wie die Monaco-Sprach-ID in TM_GRAMMARS).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lang = (shikiLangs as Record<string, any>)[
        Object.entries(TM_GRAMMARS).find(
          ([, scope]) => scope === scopeName,
        )?.[0] ?? ""
      ];

      if (!lang?.grammar) {
        throw new Error(`No grammar found for scope "${scopeName}"`);
      }

      return {
        format: "json",
        content: JSON.stringify(lang.grammar),
      };
    },
  });

  const grammars = new Map<string, string>();
  for (const [langId, scopeName] of Object.entries(TM_GRAMMARS)) {
    grammars.set(langId, scopeName);
  }

  await wireTmGrammars(monaco as never, registry, grammars, editor as never);
}

export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <>
      <header class="split-header">
        <div class="split-title">
          <span class="icon"></span>
          Finder Editor
        </div>
        <div class="split-actions">
          <button class="btn" id="btn-clear">
            Clear
          </button>
          <button class="btn" id="btn-sample">
            Load Sample
          </button>
          <button class="btn btn-accent" id="btn-copy">
            Copy Output
          </button>
        </div>
      </header>

      <div class="split-container">
        <div class="split-pane">
          <div class="pane-header">
            <span class="pane-label">
              <span class="pane-dot pane-dot--edit"></span>
              Editor
            </span>
            <span class="pane-badge" id="badge-lang">
              TypeScript
            </span>
          </div>
          <div class="editor-area" id="editor-left"></div>
        </div>

        <div class="split-divider" id="divider"></div>

        <div class="split-pane">
          <div class="pane-header">
            <span class="pane-label">
              <span class="pane-dot pane-dot--view"></span>
              Preview
            </span>
            <span class="pane-badge">Read Only</span>
          </div>
          <div class="editor-area" id="editor-right"></div>
        </div>
      </div>

      <footer class="status-bar">
        <div class="stat">
          <span class="status-dot"></span>
          Syncing live
        </div>
        <div class="stat" id="stat-chars">
          0 chars
        </div>
      </footer>
    </>
  );

  // --- Left: editable editor ---
  const leftEl = el.querySelector<HTMLDivElement>("#editor-left")!;
  const leftEditor = monaco.editor.create(leftEl, {
    value: DEFAULT_VALUE,
    language: "typescript",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 22,
    padding: { top: 16 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "gutter",
    bracketPairColorization: { enabled: true },
    tabSize: 2,
  });

  // --- Right: read-only preview editor ---
  const rightEl = el.querySelector<HTMLDivElement>("#editor-right")!;
  const rightEditor = monaco.editor.create(rightEl, {
    value: DEFAULT_VALUE,
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 22,
    padding: { top: 16 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "none",
    scrollbar: {
      vertical: "hidden",
      horizontal: "auto",
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 0,
    lineNumbers: "off",
  });

  // --- Optional: VS-Code-TextMate-Grammars verdrahten (async, fehlertolerant) ---
  setupTextMate(leftEditor).catch((error) => {
    console.error(
      "[monaco] TextMate setup failed — falling back to Monarch",
      error,
    );
  });

  // --- Sync left → right on every keystroke ---
  // const badgeLang = el.querySelector<HTMLSpanElement>("#badge-lang")!;
  const statChars = el.querySelector<HTMLDivElement>("#stat-chars")!;

  function updateStats() {
    const len = leftEditor.getValue().length;
    statChars.textContent = `${len.toLocaleString()} chars`;
  }

  leftEditor.onDidChangeModelContent(() => {
    let res = jsToFling(leftEditor.getValue());

    rightEditor.setValue(res.fling ?? "// this didnt work");
    updateStats();
  });

  updateStats();

  // --- Header actions ---
  const btnClear = el.querySelector<HTMLButtonElement>("#btn-clear")!;
  const btnSample = el.querySelector<HTMLButtonElement>("#btn-sample")!;
  const btnCopy = el.querySelector<HTMLButtonElement>("#btn-copy")!;

  btnClear.addEventListener("click", () => {
    leftEditor.setValue("");
    leftEditor.focus();
  });

  btnSample.addEventListener("click", () => {
    leftEditor.setValue(DEFAULT_VALUE);
    leftEditor.focus();
  });

  btnCopy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(leftEditor.getValue());
    const original = btnCopy.textContent;
    btnCopy.textContent = "Copied!";
    setTimeout(() => (btnCopy.textContent = original), 1400);
  });

  // --- Draggable divider ---
  const divider = el.querySelector<HTMLDivElement>("#divider")!;
  const container = el.querySelector<HTMLDivElement>(".split-container")!;
  const panes = el.querySelectorAll<HTMLElement>(".split-pane");
  let dragging = false;

  divider.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    divider.classList.add("active");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.min(Math.max(ratio, 0.2), 0.8);
    panes[0].style.flex = `${clamped}`;
    panes[1].style.flex = `${1 - clamped}`;
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("active");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  // --- Cleanup ---
  return () => {
    leftEditor.dispose();
    rightEditor.dispose();
  };
}
