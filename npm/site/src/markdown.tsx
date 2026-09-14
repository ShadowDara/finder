import { jsx, Fragment } from "../src/jsx-runtime";
import { raw } from "../src/jsx-runtime";
import { PageEntry } from "virtual:pages";

export async function renderMarkdown(app: HTMLElement, page: PageEntry) {
  if (page.type !== "markdown") {
    return;
  }

  let html = page.html ?? "";

  /*
   * Split-Modus: Das Markdown-HTML liegt in einem eigenen Chunk, der über
   * `page.load()` nachgeladen wird (statt im main_entry.js zu stecken).
   */
  if (typeof page.load === "function") {
    const module = await page.load();
    html = module.default.html ?? html;
  }

  app.innerHTML = (
    <>
      <a href="../">Home</a>
      <article class="markdown">{raw(html)}</article>
    </>
  );
}
