import { jsx, Fragment } from "../src/jsx-runtime";

export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <>
      <article className="markdown">
        <h1 id="finder-server">Finder Server</h1>
        <ul>
          <li>
            <a href="./creator">Template Creator</a>
          </li>
          <li>
            <a href="./viewer">Template Viewer</a>
          </li>
        </ul>
        <p>
          Here you can create new templates for finder or view existing, or read
          the changelog!
        </p>
        <ul>
          <li>
            <a href="./changelog.md">Changelog</a>
          </li>
        </ul>
        {import.meta.env.MODE != "static" && (
          <ul>
            <li>
              <a href="./api/stop">Stop Server</a>
            </li>
          </ul>
        )}
      </article>
    </>
  );
}
