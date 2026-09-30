import { jsx, Fragment } from "twynejs/jsx-runtime";
import { SERVER_ADRESS } from "../src/vars";

export default function render(el: HTMLDivElement) {
  el.innerHTML = (
    <>
      <article class="markdown">
        <h1 id="finder-server">Finder Creator</h1>

        <ul>
          <li>
            <a href="https://shadowdara.github.io/project/finder">
              Finder Homepage
            </a>
          </li>
          <li>
            <a href="./creator">Template Creator</a>
          </li>
          <li>
            <a href="./viewer">Template Viewer</a>
          </li>
          <li>
            <a href="./configeditor">Config Editor</a>
          </li>
          <li>
            <a href="./regexcreator">Regex Creator</a>
          </li>
          {import.meta.env.MODE == "backend" && (
            <li>
              <a href="./console">Console</a>
            </li>
          )}
          <li>
            <a href="./tools">Tools</a>
          </li>
          {import.meta.env.MODE == "backend" && (
            <li>
              <a href="./mcapp">MCAPP</a>
            </li>
          )}
          {import.meta.env.MODE == "backend" && (
            <li>
              <a href="./gitviewer">Git Viewer</a>
            </li>
          )}
          {/* {import.meta.env.MODE == "backend" && (
            <li>
              <a href="./cacheviewer">Cache Viewer</a>
            </li>
          )} */}
        </ul>

        {import.meta.env.MODE == "backend" && (
          <button id="stop">Stop Server</button>
        )}

        <h2>Links</h2>
        <ul>
          <li>
            <a href="https://github.com/shadowdara/finder" target="_blanc">
              Github
            </a>
          </li>
          <li>
            <a href="https://finder-template-hub.vercel.app" target="_blanc">
              Finder Hub
            </a>
          </li>
        </ul>

        <h2>Tools</h2>
        <ul>
          <li>
            <a href="./tools/markdowneditor">Markdown Editor</a>
          </li>
          <li>
            <a href="./tools/minecraft/tellraw">
              Minecraft Tellraw Updater to SNBT
            </a>
          </li>
        </ul>
      </article>
    </>
  );

  if (import.meta.env.MODE == "backend") {
    let adress = "/api/stop";

    if (import.meta.env.DEV) {
      adress = SERVER_ADRESS + "/api/stop";
    }

    const stop = document.getElementById("stop");

    if (stop != null) {
      stop.onclick = async () => {
        await fetch(adress);
      };
    }
  }
}
