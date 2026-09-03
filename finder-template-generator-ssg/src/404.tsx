import { PageEntry } from "virtual:pages";
import { jsx } from "../src/jsx-runtime";

// Render the 404 Page
export function render404(app: HTMLElement) {
  app.innerHTML = (
    <main>
      <h1>404</h1>
      <p>No page id was provided.</p>
      <a href="/">Go home</a>
    </main>
  );
}

export function render404_2(
  app: HTMLElement,
  pages: Record<string, PageEntry>,
) {
  const pageLinks = Object.keys(pages)
    .filter((pageId) => pageId !== "__404__")
    .map((pageId) => (
      <li>
        <a href={pageId === "index" ? "/" : `/${pageId}`}>${pageId}</a>
      </li>
    ))
    .join("");

  app.innerHTML = (
    <main>
      <h1>404</h1>
      <p>Page not found.</p>

      <h2>Available pages</h2>
      <ul>{pageLinks}</ul>

      <a href="/">Go home</a>
    </main>
  );
}

export function render404_3(app: HTMLElement, id: string) {
  app.innerHTML = (
    <main>
      <h1>404</h1>
      <p>Page {id} not found.</p>
      <a href="/">Go home</a>
    </main>
  );
}
