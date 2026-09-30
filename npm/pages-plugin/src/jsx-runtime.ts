// Custom JSX Runtime for the SSG Pages Plugin

const HTML = Symbol("html");

export interface HtmlValue {
  readonly [HTML]: true;
  readonly value: string;
  toString(): string;
}

/**
 * The CSS-module map (e.g. `import styles from "./about.module.css"`)
 * that `jsx()` should currently consult when resolving `class`/
 * `className` attribute values — see `useStyles()` below.
 */
let activeStyles: Record<string, string> | null | undefined = null;

/**
 * Registers the CSS-module map `jsx()` should use to resolve plain class
 * names for the *current* render, so you don't have to write
 * `className={styles.title}` on every single element. Call it once,
 * before building the JSX tree that should use it — typically as the
 * first line of a page's `mount()`:
 *
 * ```tsx
 * import styles from "./about.module.css";
 * import { useStyles } from "twynejs/jsx-runtime";
 *
 * export default function mount(el: HTMLElement) {
 *   useStyles(styles);
 *   el.innerHTML = (
 *     <>
 *       <h1 className="title">About</h1>
 *       <p className="title lead">Still just a plain string.</p>
 *     </>
 *   );
 * }
 * ```
 *
 * Every whitespace-separated class token that matches a key in `styles`
 * is swapped for its scoped/hashed value (`"title"` → `styles.title`,
 * e.g. `"_title_a1b2c3_1"`); any token that doesn't match (utility
 * classes, classes from a global stylesheet, …) is left exactly as
 * written. Pass `null` (or nothing) to go back to plain, unresolved class
 * names.
 *
 * Because this whole library renders synchronously — there is no `await`
 * between `useStyles()` and the `jsx()` calls it applies to — one
 * module-level value is enough for a single page's render. It does,
 * however, stay set until something changes it again: if your app's
 * router calls multiple pages' `mount()` functions over the page's
 * lifetime (as the `singleFile` hash-router example does), call
 * `useStyles(null)` right before invoking a page's `mount()` (or have
 * every page call `useStyles()` itself, even with `null`) so a previous
 * page's classes can't leak into one that doesn't expect them.
 */
export function useStyles(styles: Record<string, string> | null): void {
  activeStyles = styles;
}

function resolveClassName(value: string): string {
  if (!activeStyles) {
    return value;
  }

  const styles = activeStyles;

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => styles[token] ?? token)
    .join(" ");
}

function renderChildren(children: unknown[]): string {
  return children
    .flat(Infinity)
    .filter((child) => child != null && child !== false)
    .map((child) => {
      if (isHtml(child)) {
        return child.value;
      }

      return escapeText(String(child));
    })
    .join("");
}

export function jsx(
  tag: string | ((props: any) => any),
  props: Record<string, any> | null,
  ...children: any[]
): HtmlValue | string {
  // Automatic JSX runtime: children kommen als props.children (Array) rein.
  if (Array.isArray(props?.children)) {
    children = props.children;
    props = { ...props };
    delete props.children;
  }

  if (typeof tag === "function") {
    return tag({
      ...(props ?? {}),
      children,
    });
  }

  const booleanHtmlAttributes = new Set([
    "disabled",
    "checked",
    "selected",
    "readonly",
    "required",
    "multiple",
    "hidden",
    "autofocus",
    "open",
  ]);

  const attributes = Object.entries(props ?? {})
    .filter(([key]) => key !== "children" && key !== "key")
    .map(([key, value]) => {
      if (value == null) {
        return "";
      }

      const attribute = key === "className" ? "class" : key;

      // Echte HTML-Boolean-Attribute: Präsenz = wahr, sonst weglassen.
      if (typeof value === "boolean" && booleanHtmlAttributes.has(attribute)) {
        return value ? ` ${attribute}` : "";
      }

      // `class`/`className`: plain class-name tokens get resolved against
      // whatever `useStyles()` last registered, so authors can keep
      // writing ordinary string class names instead of `styles.xxx` on
      // every element.
      if (attribute === "class" && typeof value === "string") {
        value = resolveClassName(value);
      }

      // Alles andere (inkl. data-*/aria-*) bekommt immer einen expliziten
      // String-Wert, damit z.B. dataset.nested === "false" verlässlich geht.
      if (typeof value === "boolean") {
        return ` ${attribute}="${value}"`;
      }

      if (value === false) {
        return "";
      }

      return ` ${attribute}="${escapeAttribute(String(value))}"`;
    })
    .join("");

  const content = renderChildren(children);

  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  const html = voidElements.has(tag)
    ? `<${tag}${attributes}>`
    : `<${tag}${attributes}>${content}</${tag}>`;

  return createHtml(html);
}

// Automatic JSX runtime nutzt jsxs für statische Elemente (gleiche Semantik).
export function jsxs(
  tag: string | ((props: any) => any),
  props: Record<string, any> | null,
): HtmlValue | string {
  return jsx(tag, props);
}

export function Fragment(props: { children?: any[] }): HtmlValue {
  const content = renderChildren(props.children ?? []);

  return createHtml(content);
}

function createHtml(value: string): HtmlValue {
  return {
    [HTML]: true,
    value,

    toString() {
      return value;
    },
  };
}

function isHtml(value: unknown): value is HtmlValue {
  return typeof value === "object" && value !== null && HTML in value;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Erzeugt einen HtmlValue aus rohem String OHNE Escaping.
 * Nur für vertrauenswürdigen Inhalt verwenden (eigenes CSS/JS, nie User-Input!).
 * Damit lässt sich z.B. ein <script>{raw(js)}</script> einbetten, ohne
 * dass `<`/`>`/`&` im JS/CSS kaputt escaped werden.
 */
export function raw(value: string): HtmlValue {
  return createHtml(value);
}
