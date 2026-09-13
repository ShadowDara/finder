import { escapeHtml, jsx, raw, Fragment } from "../../src/jsx-runtime";
import Header from "../../src/components/mcappheader.jsx";
import * as f from "../../src/components/mcappstyle.js";

export default function render(el) {
  el.innerHTML = (
    <>
      <Header></Header>
      <main>
        <h1>Info</h1>
        <p>Infos about the Programm</p>
        <h2>Commands</h2>
        <div>
          <h3 id="0">0</h3>
          <p>Closes the Program completly</p>
        </div>
        <div>
          <h3 id="1">1</h3>
        </div>
        <div>
          <h3 id="2">2</h3>
        </div>
        <div>
          <h3>exit</h3>
          <p>
            See <a href="#0">0</a>
          </p>
        </div>
        <div>
          <h3>quit</h3>
          <p>
            See <a href="#0">0</a>
          </p>
        </div>
        <div>
          <h3>status</h3>
        </div>
        <div></div>
      </main>
    </>
  );
}
