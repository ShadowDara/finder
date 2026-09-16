// Passe die Imports unten an die Pfade deines Projekts an.
import { jsx } from "@twine/core";
import renderEditor from "../src/configeditor/render";
import "./configeditor.css";

export default function render(el: HTMLDivElement) {
  // Render COnfig Editor
  el.innerHTML = (
    <main className="configeditor-page">
      <div id="configeditor"></div>
      <iframe src="../docs/config" frameborder="0" class="md-iframe"></iframe>
    </main>
  );

  const ed = document.getElementById("configeditor") as HTMLDivElement | null;
  if (ed != null) {
    renderEditor(ed);
  }
}
