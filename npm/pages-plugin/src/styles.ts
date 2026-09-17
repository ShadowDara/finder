// Function is from the lib thats why it in jsx runtime
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
