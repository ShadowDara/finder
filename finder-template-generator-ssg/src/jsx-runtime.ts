// Custom JSX Runtime for the SSG Plugin

const HTML = Symbol("html");

export interface HtmlValue {
  readonly [HTML]: true;
  readonly value: string;
  toString(): string;
}

export function jsx(
  tag: string | ((props: any) => any),
  props: Record<string, any> | null,
  ...children: any[]
): HtmlValue | string {
  if (typeof tag === "function") {
    return tag({
      ...(props ?? {}),
      children,
    });
  }

  const attributes = Object.entries(props ?? {})
    .filter(([key]) => key !== "children" && key !== "key")
    .map(([key, value]) => {
      if (value == null || value === false) {
        return "";
      }

      const attribute = key === "className" ? "class" : key;

      if (value === true) {
        return ` ${attribute}`;
      }

      return ` ${attribute}="${escapeAttribute(String(value))}"`;
    })
    .join("");

  const content = children
    .flat(Infinity)
    .filter((child) => child != null && child !== false)
    .map((child) => {
      if (isHtml(child)) {
        return child.value;
      }

      return escapeText(String(child));
    })
    .join("");

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

export function Fragment(props: { children?: any[] }): HtmlValue {
  const content = (props.children ?? [])
    .flat(Infinity)
    .filter((child) => child != null && child !== false)
    .map((child) => {
      if (isHtml(child)) {
        return child.value;
      }

      return escapeText(String(child));
    })
    .join("");

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

/**
 * Erzeugt einen HtmlValue aus rohem String OHNE Escaping.
 * Nur für vertrauenswürdigen Inhalt verwenden (eigenes CSS/JS, nie User-Input!).
 * Damit lässt sich z.B. ein <script>{raw(js)}</script> einbetten, ohne
 * dass `<`/`>`/`&` im JS/CSS kaputt escaped werden.
 */
export function raw(value: string): HtmlValue {
  return createHtml(value);
}

// Function is from the lib thats why it in jsx rumtime
export function loadStyles(styles: string[]) {
  if (import.meta.env.DEV) {
    console.log("[pages] loading styles:", styles);
  }

  for (const href of styles) {
    const url = new URL(href, import.meta.url).href;

    if (
      document.head.querySelector(`link[data-page-style="${CSS.escape(url)}"]`)
    ) {
      continue;
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = url;
    link.dataset.pageStyle = url;

    document.head.appendChild(link);
  }
}
