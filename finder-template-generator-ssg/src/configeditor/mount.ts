/**
 * Aktiviert einen bereits ins DOM gerenderten ConfigEditor
 * (z.B. nach `el.innerHTML = (<ConfigEditor .../>).toString()`).
 *
 * Nötig weil <script>-Tags, die per innerHTML eingefügt werden,
 * vom Browser NICHT ausgeführt werden. Diese Funktion übernimmt
 * exakt die Aufgabe des eingebetteten Client-Scripts, nur eben
 * als echte, importierbare TS-Funktion für Bundler-Kontexte.
 */
export interface InitConfigEditorOptions {
  /** Wird bei Klick auf "Speichern" aufgerufen, zusätzlich zu saveUrl/Event. */
  onSave?: (payload: Record<string, unknown>, editorId: string) => void;
}

export function initConfigEditor(
  root: HTMLElement | string,
  options: InitConfigEditorOptions = {},
): () => void {
  const el = typeof root === "string" ? document.getElementById(root) : root;
  if (!el)
    throw new Error(`initConfigEditor: Element "${root}" nicht gefunden.`);
  const editorEl: HTMLElement = el;

  const form = el.querySelector<HTMLFormElement>("[data-config-form]");
  const statusEl = el.querySelector<HTMLElement>("[data-status]");
  const previewEl = el.querySelector<HTMLElement>("[data-json-preview]");
  if (!form)
    throw new Error(
      "initConfigEditor: [data-config-form] nicht gefunden - falsches Element?",
    );

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

  function readField(
    input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ): unknown {
    const type = input.getAttribute("data-type");
    if (input instanceof HTMLInputElement && input.type === "checkbox")
      return input.checked;
    if (input instanceof HTMLSelectElement && input.multiple) {
      return Array.from(input.options)
        .filter((o) => o.selected)
        .map((o) => o.value);
    }
    if (type === "number") {
      const n = parseFloat((input as HTMLInputElement).value);
      return isNaN(n) ? null : n;
    }
    if (type === "json") {
      try {
        return input.value.trim() === "" ? null : JSON.parse(input.value);
      } catch {
        return { __parseError: true, raw: input.value };
      }
    }
    return (input as HTMLInputElement).value;
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

  function collect(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    form!.querySelectorAll<HTMLInputElement>("[data-path]").forEach((input) => {
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
      const path = btn.getAttribute("data-path")!;
      const def = JSON.parse(btn.getAttribute("data-default")!);
      const input = form!.querySelector(`[data-path="${path}"]`);
      if (input) applyValueToEl(input, def);
      updatePreview();
      showStatus("Feld zurückgesetzt.", "info");
    }

    if (action === "reset-all") {
      form!.querySelectorAll<HTMLElement>("[data-path]").forEach((input) => {
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
        showStatus(
          "Gespeichert (kein saveUrl gesetzt, nur Event ausgelöst).",
          "success",
        );
      }
    }
  }

  form.addEventListener("input", onInput);
  form.addEventListener("change", onInput);
  el.addEventListener("click", onClick);
  updatePreview();

  // Cleanup-Funktion zurückgeben, falls die Route/Component wieder unmountet wird.
  return function destroy() {
    form.removeEventListener("input", onInput);
    form.removeEventListener("change", onInput);
    el.removeEventListener("click", onClick);
  };
}
