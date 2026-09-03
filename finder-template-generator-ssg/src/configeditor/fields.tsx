import { jsx, Fragment, raw } from "../jsx-runtime";
import type { HtmlValue } from "../jsx-runtime";
import type { ConfigField } from "./types";

export type FieldRenderer = (
  field: ConfigField,
  path: string,
  value: unknown,
) => HtmlValue | string;

/**
 * Registry: type-string -> Renderer. Neue Feldtypen einfach reinregistrieren:
 *
 *   registerFieldType("slider", (field, path, value) => (
 *     <input type="range" name={path} data-path={path} data-type="number"
 *            min={field.min} max={field.max} value={value} />
 *   ));
 */
const registry = new Map<string, FieldRenderer>();

export function registerFieldType(type: string, renderer: FieldRenderer) {
  registry.set(type, renderer);
}

export function getFieldRenderer(type: string): FieldRenderer | undefined {
  return registry.get(type);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function asHtml(value: HtmlValue | string): HtmlValue {
  return typeof value === "string" ? raw(value) : value;
}

/** Für Attribut-Werte: wandelt undefined/null in "". Die JSX-Runtime escaped. */
function attr(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function resolveValue(field: ConfigField, value: unknown) {
  return value !== undefined ? value : field.default;
}

/** Rendert ein einzelnes Feld inkl. Label/Description/Default/Reset-Button. */
export function renderField(
  field: ConfigField,
  path: string,
  value: unknown,
): HtmlValue | string {
  const renderer = getFieldRenderer(field.type) ?? renderUnknownAsJson;
  const resolved = resolveValue(field, value);

  // Gruppen bekommen keine eigene "Shell" (Label/Default/Reset), sondern ein fieldset.
  if (field.type === "group") {
    return renderer(field, path, resolved);
  }

  const hasDefault = field.default !== undefined;
  const control = renderer(field, path, resolved);

  return (
    <div class="cfg-field" data-field-key={attr(path)}>
      <div class="cfg-field-head">
        <label class="cfg-label" for={attr(path)}>
          {field.label ?? field.key}
          {field.required ? (
            <span class="cfg-required" title="Pflichtfeld">
              *
            </span>
          ) : (
            ""
          )}
        </label>
        {hasDefault && !field.readonly ? (
          <button
            type="button"
            class="cfg-reset-btn"
            data-action="reset-field"
            data-reset-for={attr(path)}
            data-default={JSON.stringify(field.default)}
            title="reset to default"
          >
            ↺
          </button>
        ) : (
          ""
        )}
      </div>

      {field.description ? <p class="cfg-desc">{field.description}</p> : ""}
      {control}
      {hasDefault ? (
        <p class="cfg-default">
          Default: <code>{JSON.stringify(field.default)}</code>
        </p>
      ) : (
        ""
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// eingebaute Renderer
// ---------------------------------------------------------------------------

registerFieldType("string", (field, path, value) => (
  <input
    id={attr(path)}
    type="text"
    name={attr(path)}
    data-path={attr(path)}
    class="cfg-input"
    placeholder={attr(field.placeholder)}
    value={attr(value)}
    readonly={field.readonly}
    required={field.required}
  />
));

registerFieldType("textarea", (field, path, value) => (
  <textarea
    id={attr(path)}
    name={attr(path)}
    data-path={attr(path)}
    className="cfg-input cfg-textarea"
    rows={field.rows ?? 4}
    placeholder={attr(field.placeholder)}
    readonly={field.readonly}
  >
    {value != null ? String(value) : ""}
  </textarea>
));

registerFieldType("number", (field, path, value) => (
  <input
    id={attr(path)}
    type="number"
    name={attr(path)}
    data-path={attr(path)}
    data-type="number"
    className="cfg-input"
    min={attr(field.min)}
    max={attr(field.max)}
    step={attr(field.step ?? "any")}
    value={attr(value)}
    readonly={field.readonly}
    required={field.required}
  />
));

registerFieldType("boolean", (field, path, value) => (
  <label className="cfg-switch">
    <input
      id={attr(path)}
      type="checkbox"
      name={attr(path)}
      data-path={attr(path)}
      data-type="boolean"
      checked={Boolean(value)}
      disabled={field.readonly}
    />
    <span className="cfg-switch-track"></span>
  </label>
));

registerFieldType("select", (field, path, value) => (
  <select
    id={attr(path)}
    name={attr(path)}
    data-path={attr(path)}
    className="cfg-input"
    disabled={field.readonly}
  >
    {(field.options ?? []).map((opt) => (
      <option value={attr(opt.value)} selected={opt.value === value}>
        {opt.label}
      </option>
    ))}
  </select>
));

registerFieldType("multiselect", (field, path, value) => {
  const selected = new Set(Array.isArray(value) ? value.map(String) : []);
  return (
    <select
      id={attr(path)}
      name={attr(path)}
      data-path={attr(path)}
      data-type="multiselect"
      className="cfg-input"
      multiple
      disabled={field.readonly}
    >
      {(field.options ?? []).map((opt) => (
        <option value={attr(opt.value)} selected={selected.has(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});

registerFieldType("color", (field, path, value) => (
  <div className="cfg-color-row">
    <input
      id={attr(path)}
      type="color"
      name={attr(path)}
      data-path={attr(path)}
      className="cfg-color-swatch"
      value={attr(value) || "#000000"}
      disabled={field.readonly}
    />
    <input
      type="text"
      className="cfg-input"
      data-color-text-for={attr(path)}
      value={attr(value)}
      readonly={field.readonly}
    />
  </div>
));

registerFieldType("date", (field, path, value) => (
  <input
    id={attr(path)}
    type="date"
    name={attr(path)}
    data-path={attr(path)}
    className="cfg-input"
    value={attr(value)}
    readonly={field.readonly}
  />
));

registerFieldType("json", (field, path, value) => (
  <textarea
    id={attr(path)}
    name={attr(path)}
    data-path={attr(path)}
    data-type="json"
    className="cfg-input cfg-textarea cfg-mono"
    rows={field.rows ?? 6}
    readonly={field.readonly}
  >
    {value !== undefined ? JSON.stringify(value, null, 2) : ""}
  </textarea>
));

registerFieldType("group", (field, path) => {
  const children = (field.fields ?? []).map((child) =>
    asHtml(
      renderField(
        child,
        `${path}.${child.key}`,
        (field.value as any)?.[child.key] ??
          (field.default as any)?.[child.key],
      ),
    ),
  );

  return (
    <fieldset class="cfg-group" data-field-key={attr(path)}>
      <legend class="cfg-group-legend">{field.label ?? field.key}</legend>
      {field.description ? <p class="cfg-desc">{field.description}</p> : ""}
      <div class="cfg-group-body">{children}</div>
    </fieldset>
  );
});

/** Fallback für unbekannte/eigene Feldtypen ohne registrierten Renderer:
 *  rohes JSON-Textfeld, damit wirklich JEDER JSON-Wert editierbar bleibt. */
function renderUnknownAsJson(
  field: ConfigField,
  path: string,
  value: unknown,
): HtmlValue | string {
  return (
    <>
      <p class="cfg-warning">
        Unbekannter Feldtyp {String(field.type)} — Rohdaten-Editor als Fallback.
      </p>
      <textarea
        id={attr(path)}
        name={attr(path)}
        data-path={attr(path)}
        data-type="json"
        className="cfg-input cfg-textarea cfg-mono"
        rows={4}
      >
        {value !== undefined ? JSON.stringify(value, null, 2) : ""}
      </textarea>
    </>
  );
}
