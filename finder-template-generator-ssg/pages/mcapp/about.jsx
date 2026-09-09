import { escapeHtml, jsx, raw, Fragment } from "../../src/jsx-runtime";
import Header from "../../src/components/mcappheader.jsx";
import * as f from "../../src/components/mcappstyle.js";

export default function render(el) {
  el.innerHTML = (
    <>
      <Header></Header>
      <main>
        <h1>About</h1>
        <p>Some Infos about the Programm</p>
      </main>
    </>
  );
}
