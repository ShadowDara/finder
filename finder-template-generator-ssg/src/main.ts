import { pages } from "virtual:pages";
import { render404, render404_2, render404_3 } from "./404";

declare global {
  interface Window {
    PAGE_ID?: string;
  }
}

async function main() {
  const app = document.getElementById("app");

  if (app == null) {
    throw new Error("Missing #app element");
  }

  const id = window.PAGE_ID;

  if (!id) {
    render404(app);
    return;
  }

  // Special 404 page supplied by the dev server.
  if (id === "__404__") {
    render404_2(app, pages);

    return;
  }

  const page = pages[id];

  if (!page) {
    console.error(`[pages] Unknown page id: ${id}`);

    render404_3(app, id);

    return;
  }

  try {
    loadStyles(page.styles);

    if (page.type === "markdown") {
      app.innerHTML = `
      <a href="../">Home</a>
      <article class="markdown">
        ${page.html}
      </article>
    `;

      return;
    }

    const module = await page.load();

    await module.default(app);
  } catch (error) {
    console.error(`[pages] Failed to load page "${id}"`, error);

    app.innerHTML = `
      <main>
        <h1>Failed to load page</h1>
        <p>Could not load "${id}".</p>
        <a href="/">Go home</a>
      </main>
    `;
  }
}

main();

function loadStyles(styles: string[]) {
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
