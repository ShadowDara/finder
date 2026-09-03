import { jsx, Fragment } from "../jsx-runtime";
import type { ConfigSchema } from "./types";
import { asHtml, renderField } from "./fields";

export { registerFieldType } from "./fields";
export type {
  ConfigField,
  ConfigSchema,
  SelectOption,
  BuiltinFieldType,
} from "./types";

export interface ConfigEditorOptions {
  /** DOM-id des Wrappers, falls mehrere Editoren auf einer Seite laufen. */
  id?: string;
  /** Aktuelle Werte, z.B. aus localStorage geladen. Fehlt ein Key -> field.default greift. */
  values?: Record<string, unknown>;
}

export interface SetupConfigEditorOptions {
  /** Wird zusätzlich zu saveUrl/localStorage bei "Speichern" aufgerufen. */
  onSave?: (payload: Record<string, unknown>, editorId: string) => void;
}

/**
 * Baut den HTML-String für den Editor. Genau wie renderTemplates() im
 * Viewer: reine Stringzusammensetzung, kein JSX/Runtime nötig.
 */
export function renderConfigEditor(
  schema: ConfigSchema,
  options: ConfigEditorOptions = {},
): string {
  const id = options.id ?? "config-editor";
  const values = options.values ?? {};

  const fieldsHtml = schema.fields.map((f) =>
    asHtml(renderField(f, f.key, values[f.key])),
  );

  return (
    <>
      <div
        className="cfg-editor"
        id={id}
        data-save-url={schema.saveUrl ?? ""}
        data-save-method={schema.saveMethod ?? "POST"}
      >
        <div className="cfg-toolbar">
          <div className="cfg-title-wrap">
            {schema.title ? <h2 class="cfg-title">{schema.title}</h2> : ""}
            {schema.description ? (
              <p class="cfg-editor-desc">{schema.description}</p>
            ) : (
              ""
            )}
          </div>
          <div className="cfg-actions">
            <button type="button" className="cfg-btn" data-action="reset-all">
              Reset all
            </button>
            <button type="button" className="cfg-btn" data-action="copy">
              copy JSON
            </button>
            <button
              type="button"
              className="cfg-btn cfg-btn-primary"
              data-action="save"
            >
              Save
            </button>
          </div>
        </div>

        <p className="cfg-status" data-status hidden></p>

        <form className="cfg-form" data-config-form>
          {fieldsHtml}
        </form>

        <details className="cfg-preview">
          <summary>JSON-Preview</summary>
          <pre className="cfg-json-preview" data-json-preview>
            {}
          </pre>
        </details>
      </div>
    </>
  );
}

/**
 * Hängt die komplette Interaktivität an ein bereits gerendertes
 * `.cfg-editor`-Element - direkt per addEventListener, wie setupSelector()
 * im Viewer. Kein <script>-Tag, kein innerHTML-Ausführungsproblem.
 *
 * Rückgabewert: destroy()-Funktion zum Abhängen der Listener (z.B. beim
 * Verlassen der Route).
 */
export function setupConfigEditor(
  root: HTMLElement | string,
  options: SetupConfigEditorOptions = {},
): () => void {
  const el = typeof root === "string" ? document.getElementById(root) : root;
  if (!el)
    throw new Error(`setupConfigEditor: Element "${root}" nicht gefunden.`);
  const editorEl: HTMLElement = el;

  const form = el.querySelector<HTMLFormElement>("[data-config-form]");
  const statusEl = el.querySelector<HTMLElement>("[data-status]");
  const previewEl = el.querySelector<HTMLElement>("[data-json-preview]");
  if (!form)
    throw new Error(
      "setupConfigEditor: [data-config-form] nicht gefunden - falsches Element?",
    );

  form.addEventListener("submit", (e) => e.preventDefault());

  function setPath(obj: any, path: string, value: unknown) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function readField(input: any): unknown {
    const type = input.getAttribute("data-type");
    if (input.type === "checkbox") return input.checked;
    if (input.tagName === "SELECT" && input.multiple) {
      return Array.from(input.options as HTMLOptionElement[])
        .filter((o) => o.selected)
        .map((o) => o.value);
    }
    if (type === "number") {
      const n = parseFloat(input.value);
      return isNaN(n) ? null : n;
    }
    if (type === "json") {
      try {
        return input.value.trim() === "" ? null : JSON.parse(input.value);
      } catch {
        return { __parseError: true, raw: input.value };
      }
    }
    return input.value;
  }

  function applyValueToEl(input: any, value: unknown) {
    const type = input.getAttribute("data-type");
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      return;
    }
    if (input.tagName === "SELECT" && input.multiple) {
      const set = new Set(Array.isArray(value) ? value.map(String) : []);
      Array.from(input.options as HTMLOptionElement[]).forEach((o) => {
        o.selected = set.has(o.value);
      });
      return;
    }
    if (type === "json") {
      input.value = value == null ? "" : JSON.stringify(value, null, 2);
      return;
    }
    input.value = value == null ? "" : String(value);
  }

  // Nur echte Formularfelder, nicht die Reset-Buttons (die tragen data-reset-for statt data-path).
  function fieldEls(): HTMLElement[] {
    return Array.from(
      form!.querySelectorAll<HTMLElement>(
        "input[data-path], select[data-path], textarea[data-path]",
      ),
    );
  }

  function collect(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    fieldEls().forEach((input) => {
      setPath(out, input.getAttribute("data-path")!, readField(input));
    });
    return out;
  }

  function updatePreview() {
    if (previewEl) previewEl.textContent = JSON.stringify(collect(), null, 2);
  }

  let statusTimer: number | undefined;
  function showStatus(
    message: string,
    kind: "info" | "success" | "error" = "info",
  ) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.setAttribute("data-kind", kind);
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => (statusEl.hidden = true), 3500);
  }

  // Farbfeld <-> Text-Sync
  el.querySelectorAll<HTMLInputElement>('input[type="color"]').forEach(
    (colorInput) => {
      const textInput = el.querySelector<HTMLInputElement>(
        `[data-color-text-for="${colorInput.id}"]`,
      );
      if (!textInput) return;
      colorInput.addEventListener("input", () => {
        textInput.value = colorInput.value;
        updatePreview();
      });
      textInput.addEventListener("input", () => {
        if (/^#[0-9a-fA-F]{6}$/.test(textInput.value))
          colorInput.value = textInput.value;
        updatePreview();
      });
    },
  );

  function onInput() {
    updatePreview();
  }

  function onClick(ev: MouseEvent) {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>(
      "[data-action]",
    );
    if (!btn) return;
    const action = btn.getAttribute("data-action");

    if (action === "reset-field") {
      const path = btn.getAttribute("data-reset-for")!;
      const def = JSON.parse(btn.getAttribute("data-default")!);
      const input = form!.querySelector(
        `input[data-path="${path}"], select[data-path="${path}"], textarea[data-path="${path}"]`,
      );
      if (input) applyValueToEl(input, def);
      updatePreview();
      showStatus("Feld zurückgesetzt.", "info");
    }

    if (action === "reset-all") {
      fieldEls().forEach((input) => {
        const wrap = input.closest(".cfg-field");
        const resetBtn = wrap?.querySelector<HTMLElement>(
          "[data-action=reset-field]",
        );
        if (resetBtn)
          applyValueToEl(
            input,
            JSON.parse(resetBtn.getAttribute("data-default")!),
          );
      });
      updatePreview();
      showStatus("Alle Felder zurückgesetzt.", "info");
    }

    if (action === "copy") {
      const json = JSON.stringify(collect(), null, 2);
      navigator.clipboard
        ?.writeText(json)
        .then(() => showStatus("JSON in Zwischenablage kopiert.", "success"))
        .catch(() => showStatus("Kopieren fehlgeschlagen.", "error"));
    }

    if (action === "save") {
      const payload = collect();
      const saveUrl = editorEl.getAttribute("data-save-url");

      editorEl.dispatchEvent(
        new CustomEvent("config:save", { detail: payload, bubbles: true }),
      );
      options.onSave?.(payload, editorEl.id);

      if (saveUrl) {
        // Nur falls doch mal ein Backend existiert.
        fetch(saveUrl, {
          method: editorEl.getAttribute("data-save-method") || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            showStatus("Gespeichert.", "success");
          })
          .catch((err) =>
            showStatus(`Speichern fehlgeschlagen: ${err.message}`, "error"),
          );
      } else {
        // Kein Backend -> localStorage als Persistenz.
        try {
          localStorage.setItem(`cfg:${editorEl.id}`, JSON.stringify(payload));
          showStatus("Lokal gespeichert.", "success");
        } catch {
          showStatus("Speichern fehlgeschlagen (localStorage).", "error");
        }
      }
    }
  }

  form.addEventListener("input", onInput);
  form.addEventListener("change", onInput);
  el.addEventListener("click", onClick);
  updatePreview();

  return function destroy() {
    form!.removeEventListener("input", onInput);
    form!.removeEventListener("change", onInput);
    el.removeEventListener("click", onClick);
  };
}

/** Lädt zuvor per localStorage gespeicherte Werte für eine gegebene Editor-id. */
export function loadSavedValues(id: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(`cfg:${id}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
