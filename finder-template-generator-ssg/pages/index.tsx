import { jsx, Fragment } from "../src/jsx-runtime";

export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <>
      <article class="markdown">
        <h1 id="finder-server">Finder Server</h1>

        <ul>
          <li>
            <a href="./creator">Template Creator</a>
          </li>
          <li>
            <a href="./viewer">Template Viewer</a>
          </li>
          <li>
            <a href="./configeditor">Config Editor</a>
          </li>
        </ul>

        <p>
          Here you can create new templates for finder or view existing, or read
          the changelog!
        </p>

        <ul>
          <li>
            <a href="./changelog">Changelog</a>
          </li>
          <li>
            <a href="./readme">README</a>
          </li>
        </ul>

        {import.meta.env.MODE == "backend" && (
          <button id="stop">Stop Server</button>
        )}
      </article>
    </>
  );

  if (import.meta.env.MODE == "backend") {
    let adress = "/api/stop";

    if (import.meta.env.DEV) {
      adress = "http://localhost:8080/api/stop";
    }

    const stop = document.getElementById("stop");

    if (stop != null) {
      stop.onclick = async () => {
        await fetch(adress);
      };
    }
  }
}
