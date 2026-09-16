import { jsx, Fragment } from "@twine/core/jsx-runtime";
import * as monaco from "monaco-editor";
import "./monaco.css";
import { jsToFling } from "js-to-fling";
import { loadWASM } from "onigasm";
import { Registry } from "monaco-textmate";
import { wireTmGrammars } from "monaco-editor-textmate";
import onigasmWasm from "onigasm/lib/onigasm.wasm?url";
import * as shikiLangs from "@shikijs/langs";
import flingTm from "./../data/fling/fling.tmLanguage.json";

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
  fling: "source.fling",
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

// Fling-Sprache bei Monaco registrieren (für Language-IDs)
monaco.languages.register({ id: "fling" });

// Minimaler Monarch-Fallback, falls TextMate ausfällt (sonst wirft Monaco)
monaco.languages.setMonarchTokensProvider("fling", {
  tokenizer: {
    root: [],
  },
});

/**
 * „Dark Modern“ — das aktuelle Standard-Theme von VS Code.
 * Monaco liefert es nicht mit (nur vs / vs-dark / hc-black / hc-light),
 * deshalb definieren wir es hier nach: Editor-Farben (#1f1f1f / #cccccc)
 * plus die reichen TextMate-Scope-Regeln aus Dark+/Dark Modern, damit die
 * Token-Farben im Browser so aussehen wie in VS Code.
 */
monaco.editor.defineTheme("dark-modern", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "cccccc", background: "1f1f1f" },
    // comments — volle Scope-Kette mit Suffix
    { token: "comment", foreground: "6a9955" },
    { token: "comment.line", foreground: "6a9955" },
    { token: "comment.line.double-slash", foreground: "6a9955" },
    { token: "comment.line.double-slash.ts", foreground: "6a9955" },
    { token: "comment.line.double-slash.js", foreground: "6a9955" },
    { token: "comment.line.double-slash.fling", foreground: "6a9955" },
    { token: "comment.line.hash", foreground: "6a9955" },
    { token: "comment.line.hash.fling", foreground: "6a9955" },
    // keywords / control flow
    { token: "keyword", foreground: "569cd6" },
    { token: "keyword.ts", foreground: "569cd6" },
    { token: "keyword.js", foreground: "569cd6" },
    { token: "keyword.fling", foreground: "569cd6" },
    { token: "keyword.control", foreground: "569cd6" },
    { token: "keyword.control.ts", foreground: "569cd6" },
    { token: "keyword.control.js", foreground: "569cd6" },
    { token: "keyword.control.fling", foreground: "569cd6" },
    { token: "keyword.control.conditional", foreground: "569cd6" },
    { token: "keyword.control.loop", foreground: "569cd6" },
    { token: "keyword.declaration", foreground: "569cd6" },
    { token: "keyword.declaration.ts", foreground: "569cd6" },
    { token: "keyword.declaration.js", foreground: "569cd6" },
    { token: "keyword.declaration.fling", foreground: "569cd6" },
    { token: "keyword.operator.logical", foreground: "569cd6" },
    // strings & escapes
    { token: "string", foreground: "ce9178" },
    { token: "string.ts", foreground: "ce9178" },
    { token: "string.js", foreground: "ce9178" },
    { token: "string.fling", foreground: "ce9178" },
    { token: "string.quoted", foreground: "ce9178" },
    { token: "string.quoted.double", foreground: "ce9178" },
    { token: "string.quoted.double.ts", foreground: "ce9178" },
    { token: "string.quoted.double.js", foreground: "ce9178" },
    { token: "string.quoted.double.fling", foreground: "ce9178" },
    { token: "constant.character.escape", foreground: "d7ba7d" },
    { token: "constant.character.escape.ts", foreground: "d7ba7d" },
    { token: "constant.character.escape.js", foreground: "d7ba7d" },
    // numbers & constants
    { token: "number", foreground: "b5cea8" },
    { token: "number.ts", foreground: "b5cea8" },
    { token: "number.js", foreground: "b5cea8" },
    { token: "number.fling", foreground: "b5cea8" },
    { token: "constant.numeric", foreground: "b5cea8" },
    { token: "constant.numeric.ts", foreground: "b5cea8" },
    { token: "constant.numeric.js", foreground: "b5cea8" },
    { token: "constant.numeric.fling", foreground: "b5cea8" },
    { token: "constant.language", foreground: "569cd6" },
    { token: "constant.language.ts", foreground: "569cd6" },
    { token: "constant.language.js", foreground: "569cd6" },
    { token: "constant.language.fling", foreground: "569cd6" },
    { token: "constant.language.true", foreground: "569cd6" },
    { token: "constant.language.true.fling", foreground: "569cd6" },
    { token: "constant.language.false", foreground: "569cd6" },
    { token: "constant.language.false.fling", foreground: "569cd6" },
    { token: "constant.language.null", foreground: "569cd6" },
    { token: "constant.language.null.fling", foreground: "569cd6" },
    // operators & punctuation → neutral
    { token: "keyword.operator", foreground: "d4d4d4" },
    { token: "keyword.operator.ts", foreground: "d4d4d4" },
    { token: "keyword.operator.js", foreground: "d4d4d4" },
    { token: "keyword.operator.fling", foreground: "d4d4d4" },
    { token: "keyword.operator.assignment", foreground: "d4d4d4" },
    { token: "keyword.operator.assignment.ts", foreground: "d4d4d4" },
    { token: "keyword.operator.assignment.js", foreground: "d4d4d4" },
    { token: "keyword.operator.comparison", foreground: "d4d4d4" },
    { token: "keyword.operator.comparison.ts", foreground: "d4d4d4" },
    { token: "keyword.operator.comparison.js", foreground: "d4d4d4" },
    { token: "keyword.operator.comparison.fling", foreground: "d4d4d4" },
    { token: "keyword.operator.arithmetic", foreground: "d4d4d4" },
    { token: "keyword.operator.arithmetic.ts", foreground: "d4d4d4" },
    { token: "keyword.operator.arithmetic.js", foreground: "d4d4d4" },
    { token: "keyword.operator.arithmetic.fling", foreground: "d4d4d4" },
    { token: "operator", foreground: "d4d4d4" },
    { token: "punctuation", foreground: "d4d4d4" },
    { token: "punctuation.definition", foreground: "d4d4d4" },
    { token: "punctuation.separator", foreground: "d4d4d4" },
    { token: "punctuation.terminator", foreground: "d4d4d4" },
    { token: "punctuation.accessor", foreground: "d4d4d4" },
    { token: "delimiter", foreground: "d4d4d4" },
    { token: "meta", foreground: "d4d4d4" },
    // types / classes / interfaces
    { token: "type", foreground: "4ec9b0" },
    { token: "type.ts", foreground: "4ec9b0" },
    { token: "type.js", foreground: "4ec9b0" },
    { token: "entity.name.type", foreground: "4ec9b0" },
    { token: "entity.name.type.ts", foreground: "4ec9b0" },
    { token: "entity.name.class", foreground: "4ec9b0" },
    { token: "entity.name.class.ts", foreground: "4ec9b0" },
    { token: "entity.name.interface", foreground: "4ec9b0" },
    { token: "entity.name.interface.ts", foreground: "4ec9b0" },
    { token: "entity.name.namespace", foreground: "4ec9b0" },
    { token: "typeParameter", foreground: "4ec9b0" },
    // functions & builtins → dunkles Gelb wie in Dark Modern
    // WICHTIG: wireTmGrammars liefert Tokens mit vollem Scope-Suffix
    // (z.B. "entity.name.function.ts" oder "entity.name.function.fling"),
    // daher MUSS jede Regel sowohl UNscoped als auch MIT suffix registriert werden.
    { token: "entity.name.function", foreground: "dcdcaa" },
    { token: "entity.name.function.ts", foreground: "dcdcaa" },
    { token: "entity.name.function.js", foreground: "dcdcaa" },
    { token: "entity.name.function.fling", foreground: "dcdcaa" },
    { token: "support.function", foreground: "dcdcaa" },
    { token: "support.function.ts", foreground: "dcdcaa" },
    { token: "support.function.js", foreground: "dcdcaa" },
    { token: "support.function.fling", foreground: "dcdcaa" },
    { token: "support.function.builtin", foreground: "dcdcaa" },
    { token: "support.function.builtin.ts", foreground: "dcdcaa" },
    { token: "support.function.builtin.js", foreground: "dcdcaa" },
    { token: "support.function.builtin.fling", foreground: "dcdcaa" },
    // variables / parameters / properties → Hellblau
    // Gleiches Problem: Tokens haben Language-Suffix
    { token: "variable", foreground: "9cdcfe" },
    { token: "variable.ts", foreground: "9cdcfe" },
    { token: "variable.js", foreground: "9cdcfe" },
    { token: "variable.fling", foreground: "9cdcfe" },
    { token: "variable.other", foreground: "9cdcfe" },
    { token: "variable.other.ts", foreground: "9cdcfe" },
    { token: "variable.other.js", foreground: "9cdcfe" },
    { token: "variable.other.fling", foreground: "9cdcfe" },
    { token: "variable.parameter", foreground: "9cdcfe" },
    { token: "variable.parameter.ts", foreground: "9cdcfe" },
    { token: "variable.parameter.js", foreground: "9cdcfe" },
    { token: "variable.parameter.fling", foreground: "9cdcfe" },
    { token: "variable.other.property", foreground: "9cdcfe" },
    { token: "variable.other.property.ts", foreground: "9cdcfe" },
    { token: "variable.other.property.js", foreground: "9cdcfe" },
    { token: "variable.other.property.fling", foreground: "9cdcfe" },
    { token: "variable.other.property.object", foreground: "9cdcfe" },
    // markup: tags & attributes
    { token: "tag", foreground: "569cd6" },
    { token: "attribute.name", foreground: "9cdcfe" },
    { token: "attribute.value", foreground: "ce9178" },
  ],
  colors: {
    "editor.background": "#1f1f1f",
    "editor.foreground": "#cccccc",
    "editor.lineHighlightBackground": "#2d2d2d",
    "editor.lineHighlightBorder": "#2d2d2d",
    "editorLineNumber.foreground": "#858585",
    "editorLineNumber.activeForeground": "#c6c6c6",
    "editorCursor.foreground": "#aeafad",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#3a3d41",
    "editor.findMatchHighlightBackground": "#525266",
    "editorIndentGuide.background1": "#404040",
    "editorIndentGuide.activeBackground1": "#707070",
    "editorWhitespace.foreground": "#3b3b3b",
    "editorGutter.background": "#1f1f1f",
    "editorWidget.background": "#202020",
    "editorWidget.border": "#454545",
    "editorSuggestWidget.background": "#252526",
    "editorHoverWidget.background": "#252526",
    "editorHoverWidget.border": "#454545",
    "editorError.foreground": "#f14c4c",
    "editorWarning.foreground": "#cca700",
    "editorInfo.foreground": "#3794ff",
    "editorBracketMatch.background": "#ffffff1f",
    "editorBracketMatch.border": "#888888",
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setupTextMate(editor: any) {
  // Oniguruma (die Regex-Engine hinter TextMate) als WASM in den Browser laden.
  await loadWASM(onigasmWasm);

  const registry = new Registry({
    getGrammarDefinition: async (scopeName: string) => {
      // Lokale Grammatiken (z.B. fling) direkt aus importierten JSONs liefern
      if (scopeName === "source.fling") {
        return {
          format: "json",
          content: JSON.stringify(flingTm),
        };
      }

      // Alle anderen: über @shikijs/langs (gleicher Name wie Monaco-Language-ID)
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
              TypeScript / Javascript
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
            <span class="pane-badge">Fling Output Read Only</span>
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
    theme: "dark-modern",
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
    // Kein value: wird sofort nach dem Erstellen mit dem übersetzten Inhalt befüllt.
    language: "fling",
    theme: "dark-modern",
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

  setupTextMate(rightEditor).catch((error) => {
    console.error(
      "[monaco] TextMate setup for right editor failed — falling back to Monarch",
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

  // Initiale Übersetzung sofort ausführen (nicht warten auf erste Änderung)
  {
    const res = jsToFling(leftEditor.getValue());
    rightEditor.setValue(res.fling ?? "// this didnt work");
  }
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
