import { pages } from "virtual:pages";
import { ErrorPage, render404, render404_2, render404_3 } from "./404";
import { loadStyles } from "@shadowdara/ssg-pages-plugin/jsx-runtime";
import "./base.css";
import { renderMarkdown } from "./markdown";

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
      await renderMarkdown(app, page);

      return;
    }

    if (page.type === "liquid") {
      return;
    }

    const module = await page.load();

    // Große Build-Daten werden optional in einem eigenen Chunk geladen.
    const data =
      "loadData" in page && typeof page.loadData === "function"
        ? await page.loadData()
        : page.data;

    await module.default(app, data);
  } catch (error) {
    ErrorPage(app, id, error);
  }
}

main();
