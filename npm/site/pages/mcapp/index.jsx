import { escapeHtml, jsx, raw, Fragment } from "../../src/jsx-runtime";
import Header from "../../src/components/mcappheader.jsx";
import * as f from "../../src/components/mcappstyle.js";

export default function render(el) {
  el.innerHTML = (
    <>
      <Header></Header>
      <main>
        <h1>MC APP</h1>
        <p>This is the Homepage of the Server</p>
        <h3>Features</h3>
        <ul>
          <li>
            <a href="./info">Info</a>
          </li>
          <li>
            <a href="./worlds">World Searcher</a>
          </li>
          {/* <li>
            <a href="./datapacks">Datapacks</a>
          </li>
          <li>
            <a href="./resource_packs">Resource Packs</a>
          </li>
          <li>
            <a href="./datapack_creator">Datapack Creator</a>
          </li>
          <li>
            <a href="./resource_pack_creator">Resource Pack Creator</a>
          </li> */}
        </ul>
      </main>
    </>
  );
}
