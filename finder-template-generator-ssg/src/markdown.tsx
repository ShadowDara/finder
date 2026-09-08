import { jsx, Fragment } from "../src/jsx-runtime";
import { raw } from "../src/jsx-runtime";
import { PageEntry } from "virtual:pages";

export function renderMarkdown(app: HTMLElement, page: PageEntry) {
  if (page.type === "markdown") {
    app.innerHTML = (
      <>
        <a href="../">Home</a>
        <article class="markdown">{raw(page.html ?? "")}</article>
      </>
    );
  }
}
