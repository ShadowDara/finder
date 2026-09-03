// Passe die Imports unten an die Pfade deines Projekts an.
import { jsx, raw } from "../src/jsx-runtime";
import renderEditor from "../src/configeditor/render";
import "./configeditor.css";
import { parseMarkdown } from "@shadowdara/dlib";

export default function render(el: HTMLDivElement) {
  let md = `
[Back Home](../)

# Config fields

## Port
  
Port for the findergen server to view and create templates.

## Cache
  
When set to true, the results of will be saved as a cache and can then be
used afterwards

## Create Cache Database
  
When set to true, the cache data of finder will be saved in a Git DB.
Git is required for this.

`;

  // Render COnfig Editor
  el.innerHTML = (
    <main className="configeditor-page">
      <div id="configeditor"></div>
      <div id="desc" className="markdown">
        {raw(parseMarkdown(md))}
      </div>
    </main>
  );

  const ed = document.getElementById("configeditor") as HTMLDivElement | null;
  if (ed != null) {
    renderEditor(ed);
  }
}
