import type { Existence, FolderJSON, FolderNode } from "./types";
import {
  findFile,
  findFolder,
  newFile,
  newFolder,
  newRoot,
  parseFolder,
  removeFile,
  removeFolder,
  serializeFolder,
} from "./state";
import { SERVER_ADRESS } from "../vars";

export function renderCreator(app: HTMLDivElement) {
  type Selection = { kind: "folder" | "file"; id: string } | null;

  let filename: string = "new file";
  let root: FolderNode = newRoot();
  let selection: Selection = { kind: "folder", id: root.id };
  let importError: string | null = null;

  let createbutton = "";

  let servermode = false;

  const params = new URLSearchParams(window.location.search);

  const template = params.get("template");
  const filname = params.get("filename");

  if (import.meta.env.MODE == "backend") {
    servermode = true;
  }

  if (servermode) {
    createbutton = `<button id="btn-save" class="btn btn-ghost" type="button">Save JSON to file</button>`;
  }

  app.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">finder</span>
        <span class="brand-sep">/</span>
        <span class="brand-sub">template builder</span>
        <span class="brand-sep">/</span>
        <span class="brand-sub"><a href="../viewer/" >TEMPLATE VIEWER</a></span>
        <span class="brand-sep">/</span>
        <span class="brand-sub"><a href="../" >HOME</a></span>
      </div>
      <div class="topbar-actions">
        <button id="btn-import" class="btn btn-ghost" type="button">Import JSON</button>
        <button id="btn-copy" class="btn btn-ghost" type="button">Copy JSON</button>
        ${createbutton}
        <button id="btn-download" class="btn btn-primary" type="button">Download template.json</button>
      </div>
    </header>

    <main class="workspace">
      <section class="pane pane-tree">
        <div class="pane-head">
          <h2>Structure</h2>
          <button id="btn-add-root-file" class="icon-btn" type="button" title="Add file to root">+ file</button>
        </div>
        <div id="tree" class="tree"></div>
      </section>

      <section class="pane pane-inspector">
        <div class="pane-head">
          <h2>Inspector</h2>
        </div>
        <div id="inspector" class="inspector"></div>
      </section>

      <section class="pane pane-preview">
        <div class="pane-head">
          <h2>JSON output</h2>
        </div>
        <pre id="preview" class="preview"></pre>
      </section>
    </main>

    <dialog id="import-dialog" class="import-dialog">
      <form method="dialog" class="import-form">
        <h3>Import a template</h3>
        <p class="hint">Paste an existing folder-template JSON (or JSON5) document. It replaces the current tree.</p>
        <textarea id="import-text" rows="14" spellcheck="false" placeholder='{ "name": "root", "files": [...] }'></textarea>
        <p id="import-error" class="import-error"></p>
        <div class="import-actions">
          <button id="import-cancel" class="btn btn-ghost" type="button">Cancel</button>
          <button id="import-confirm" class="btn btn-primary" type="button">Replace tree</button>
        </div>
      </form>
    </dialog>
  </div>
`;

  async function saveTemplateToBackend(name: string): Promise<void> {
    const payload: { name: string; content: FolderJSON } = {
      name,
      content: serializeFolder(root, true),
    };

    console.log(payload);

    let adress = "/api/template";

    if (import.meta.env.DEV) {
      adress = SERVER_ADRESS + "/api/template/create";
    }

    try {
      const response = await fetch(adress, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload, null, 2),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.text();
      if (JSON.parse(result)["status"] == "ok") {
        alert("File created!");
      } else {
        alert("Could not create file!");
      }
    } catch (error) {
      console.error("Could not save template:", error);
    }
  }

  function frageDateiname() {
    const dateiname = prompt("Wie soll die Datei heißen?", filename);

    // if (dateiname) {
    //   alert("Dateiname: " + dateiname);
    // }

    return dateiname;
  }

  if (servermode) {
    const SaveButton = document.getElementById("btn-save");

    SaveButton?.addEventListener("click", () => {
      let name = frageDateiname();
      if (name != null) {
        void saveTemplateToBackend(name);
      } else {
        alert("Name is Null!");
      }
    });
    // SaveButton?.click();
  }

  const treeEl = document.querySelector<HTMLDivElement>("#tree")!;
  const inspectorEl = document.querySelector<HTMLDivElement>("#inspector")!;
  const previewEl = document.querySelector<HTMLPreElement>("#preview")!;
  const importDialog =
    document.querySelector<HTMLDialogElement>("#import-dialog")!;
  const importText =
    document.querySelector<HTMLTextAreaElement>("#import-text")!;
  const importErrorEl =
    document.querySelector<HTMLParagraphElement>("#import-error")!;

  function render(): void {
    renderTree();
    renderInspector();
    renderPreview();
  }

  // ---------- Tree ----------

  function renderTree(): void {
    treeEl.innerHTML = "";
    treeEl.appendChild(renderFolderRow(root, 0, true));
  }

  function rowButton(
    label: string,
    title: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "row-btn";
    b.textContent = label;
    b.title = title;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  function renderFolderRow(
    folder: FolderNode,
    depth: number,
    isRoot: boolean,
  ): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "node";

    const row = document.createElement("div");
    row.className = "row row-folder";
    row.style.paddingLeft = `${depth * 18 + 10}px`;
    if (selection?.kind === "folder" && selection.id === folder.id) {
      row.classList.add("row-selected");
    }
    row.addEventListener("click", () => {
      selection = { kind: "folder", id: folder.id };
      render();
    });

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = `${folder.name || "(unnamed)"}/`;
    row.appendChild(label);

    const actions = document.createElement("span");
    actions.className = "row-actions";
    actions.appendChild(
      rowButton("+dir", "Add subfolder", () => {
        const child = newFolder("new-folder");
        folder.folders.push(child);
        selection = { kind: "folder", id: child.id };
        render();
      }),
    );
    actions.appendChild(
      rowButton("+file", "Add file", () => {
        const file = newFile("new-file.txt");
        folder.files.push(file);
        selection = { kind: "file", id: file.id };
        render();
      }),
    );
    if (!isRoot) {
      actions.appendChild(
        rowButton("✕", "Delete this folder", () => {
          removeFolder(root, folder.id);
          selection = { kind: "folder", id: root.id };
          render();
        }),
      );
    }
    row.appendChild(actions);
    wrap.appendChild(row);

    for (const file of folder.files) {
      wrap.appendChild(renderFileRow(file.id, file.name, depth + 1));
    }
    for (const child of folder.folders) {
      wrap.appendChild(renderFolderRow(child, depth + 1, false));
    }

    return wrap;
  }

  function renderFileRow(
    fileId: string,
    name: string,
    depth: number,
  ): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "node";

    const row = document.createElement("div");
    row.className = "row row-file";
    row.style.paddingLeft = `${depth * 18 + 10}px`;
    if (selection?.kind === "file" && selection.id === fileId) {
      row.classList.add("row-selected");
    }
    row.addEventListener("click", () => {
      selection = { kind: "file", id: fileId };
      render();
    });

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = name || "(unnamed)";
    row.appendChild(label);

    const actions = document.createElement("span");
    actions.className = "row-actions";
    actions.appendChild(
      rowButton("✕", "Delete this file", () => {
        removeFile(root, fileId);
        selection = { kind: "folder", id: root.id };
        render();
      }),
    );
    row.appendChild(actions);
    wrap.appendChild(row);
    return wrap;
  }

  // ---------- Inspector ----------

  function labeled(
    labelText: string,
    control: HTMLElement,
    hint?: string,
  ): HTMLLabelElement {
    const lbl = document.createElement("label");
    lbl.className = "field";
    const span = document.createElement("span");
    span.className = "field-label";
    span.textContent = labelText;
    lbl.appendChild(span);
    lbl.appendChild(control);
    if (hint) {
      const h = document.createElement("span");
      h.className = "field-hint";
      h.textContent = hint;
      lbl.appendChild(h);
    }
    return lbl;
  }

  function textInput(
    value: string,
    onInput: (v: string) => void,
    placeholder = "",
  ): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = placeholder;
    input.addEventListener("input", () => onInput(input.value));
    return input;
  }

  function textArea(
    value: string,
    onInput: (v: string) => void,
    placeholder = "",
  ): HTMLTextAreaElement {
    const ta = document.createElement("textarea");
    ta.rows = 3;
    ta.value = value;
    ta.placeholder = placeholder;
    ta.addEventListener("input", () => onInput(ta.value));
    return ta;
  }

  function sizeFields(
    size: { min?: number; max?: number } | null,
    onChange: (size: { min?: number; max?: number } | null) => void,
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "size-fields";

    const toggle = document.createElement("label");
    toggle.className = "checkbox-line";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = size !== null;
    const toggleText = document.createElement("span");
    toggleText.textContent = "Constrain size";
    toggle.appendChild(checkbox);
    toggle.appendChild(toggleText);
    container.appendChild(toggle);

    const range = document.createElement("div");
    range.className = "size-range";
    range.hidden = size === null;

    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.placeholder = "min bytes";
    minInput.value = size?.min?.toString() ?? "";

    const maxInput = document.createElement("input");
    maxInput.type = "number";
    maxInput.placeholder = "max bytes";
    maxInput.value = size?.max?.toString() ?? "";

    function emit() {
      const min = minInput.value === "" ? undefined : Number(minInput.value);
      const max = maxInput.value === "" ? undefined : Number(maxInput.value);
      onChange({ min, max });
    }

    minInput.addEventListener("input", emit);
    maxInput.addEventListener("input", emit);
    range.appendChild(minInput);
    range.appendChild(maxInput);
    container.appendChild(range);

    checkbox.addEventListener("change", () => {
      range.hidden = !checkbox.checked;
      onChange(checkbox.checked ? { min: undefined, max: undefined } : null);
    });

    return container;
  }

  function renderInspector(): void {
    inspectorEl.innerHTML = "";

    if (!selection) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Select a folder or file on the left to edit it.";
      inspectorEl.appendChild(empty);
      return;
    }

    if (selection.kind === "folder") {
      const folder = findFolder(root, selection.id);
      if (!folder) return;
      const isRoot = folder.id === root.id;

      inspectorEl.appendChild(
        labeled(
          "Name",
          textInput(folder.name, (v) => {
            folder.name = v;
            renderTree();
            renderPreview();
          }),
        ),
      );

      inspectorEl.appendChild(
        labeled(
          "Description",
          textArea(folder.description, (v) => {
            folder.description = v;
            renderPreview();
          }),
        ),
      );

      if (isRoot) {
        inspectorEl.appendChild(
          labeled(
            "Minimum finder version",
            textInput(
              folder.minVersion,
              (v) => {
                folder.minVersion = v;
                renderPreview();
              },
              "0.1.0",
            ),
            "Old templates without a matching version will warn the user.",
          ),
        );
      }

      inspectorEl.appendChild(
        labeled(
          "Command",
          textInput(
            folder.command,
            (v) => {
              folder.command = v;
              renderPreview();
            },
            "e.g. npm run check",
          ),
          "Optional command to run once this directory is found.",
        ),
      );

      const invertLabel = document.createElement("label");
      invertLabel.className = "checkbox-line";
      const invertCheckbox = document.createElement("input");
      invertCheckbox.type = "checkbox";
      invertCheckbox.checked = folder.invertCommand;
      invertCheckbox.addEventListener("change", () => {
        folder.invertCommand = invertCheckbox.checked;
        renderPreview();
      });
      invertLabel.appendChild(invertCheckbox);
      invertLabel.appendChild(
        document.createTextNode("Invert command result (require exit code 1)"),
      );
      inspectorEl.appendChild(invertLabel);

      inspectorEl.appendChild(
        labeled(
          "Tags",
          textInput(
            folder.tags.join(", "),
            (v) => {
              folder.tags = v
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              renderPreview();
            },
            "backend, node, monorepo",
          ),
          "Comma-separated.",
        ),
      );

      inspectorEl.appendChild(
        labeled(
          "Directory size",
          sizeFields(folder.size, (s) => {
            folder.size = s;
            renderTree();
            renderPreview();
          }),
        ),
      );
      return;
    }

    const found = findFile(root, selection.id);
    if (!found) return;
    const { file } = found;

    inspectorEl.appendChild(
      labeled(
        "Name",
        textInput(file.name, (v) => {
          file.name = v;
          renderTree();
          renderPreview();
        }),
      ),
    );

    const select = document.createElement("select");
    (["required", "forbidden", "optional"] as Existence[]).forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      if (file.existence === opt) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener("change", () => {
      file.existence = select.value as Existence;
      renderPreview();
    });
    inspectorEl.appendChild(
      labeled(
        "Existence",
        select,
        "required = must exist, forbidden = must not exist, optional = ignored",
      ),
    );

    inspectorEl.appendChild(
      labeled(
        "File size",
        sizeFields(file.size, (s) => {
          file.size = s;
          renderTree();
          renderPreview();
        }),
      ),
    );
  }

  // ---------- Preview ----------

  function renderPreview(): void {
    const json = serializeFolder(root, true);
    previewEl.textContent = JSON.stringify(json, null, 2);
  }

  // ---------- Toolbar actions ----------

  document
    .querySelector<HTMLButtonElement>("#btn-add-root-file")!
    .addEventListener("click", () => {
      const file = newFile("new-file.txt");
      root.files.push(file);
      selection = { kind: "file", id: file.id };
      render();
    });

  document
    .querySelector<HTMLButtonElement>("#btn-copy")!
    .addEventListener("click", async () => {
      const btn = document.querySelector<HTMLButtonElement>("#btn-copy")!;
      try {
        await navigator.clipboard.writeText(previewEl.textContent ?? "");
        const original = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = original), 1200);
      } catch {
        btn.textContent = "Copy failed";
      }
    });

  document
    .querySelector<HTMLButtonElement>("#btn-download")!
    .addEventListener("click", () => {
      const json = serializeFolder(root, true);
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${root.name || "template"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

  document
    .querySelector<HTMLButtonElement>("#btn-import")!
    .addEventListener("click", () => {
      importErrorEl.textContent = "";
      importText.value = "";
      importDialog.showModal();
    });

  document
    .querySelector<HTMLButtonElement>("#import-cancel")!
    .addEventListener("click", () => {
      importDialog.close();
    });

  document
    .querySelector<HTMLButtonElement>("#import-confirm")!
    .addEventListener("click", () => {
      try {
        const parsed = JSON.parse(importText.value);
        root = parseFolder(parsed);
        selection = { kind: "folder", id: root.id };
        importDialog.close();
        render();
      } catch (err) {
        importError = err instanceof Error ? err.message : String(err);
        importErrorEl.textContent = `Couldn't parse that JSON: ${importError}`;
      }
    });

  // Import Template / Filename from URL
  if (filname != null) {
    filename = filname;
  }

  if (template != null) {
    try {
      root = parseFolder(JSON.parse(template));
      selection = { kind: "folder", id: root.id };
    } catch (error) {
      console.error("Could not load template from URL:", error);
    }
  }

  render();
}
