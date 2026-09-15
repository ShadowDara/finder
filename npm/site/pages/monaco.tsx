import { jsx, Fragment } from "../src/jsx-runtime";
import * as monaco from "monaco-editor";
import "./monaco.css";

const DEFAULT_VALUE = `{
  "name": "finder",
  "description": "Fast, tag-based project finder",
  "version": "0.3.18",
  "templates": [
    {
      "name": "node",
      "tags": ["node", "javascript"],
      "files": ["package.json"]
    },
    {
      "name": "python",
      "tags": ["python"],
      "files": ["pyproject.toml", "*.py"]
    }
  ]
}`;

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
              JSON
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
    language: "json",
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

  // --- Sync left → right on every keystroke ---
  // const badgeLang = el.querySelector<HTMLSpanElement>("#badge-lang")!;
  const statChars = el.querySelector<HTMLDivElement>("#stat-chars")!;

  function updateStats() {
    const len = leftEditor.getValue().length;
    statChars.textContent = `${len.toLocaleString()} chars`;
  }

  leftEditor.onDidChangeModelContent(() => {
    rightEditor.setValue(leftEditor.getValue());
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
