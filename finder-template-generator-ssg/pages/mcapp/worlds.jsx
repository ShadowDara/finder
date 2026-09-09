import { escapeHtml, jsx, raw, Fragment } from "../../src/jsx-runtime";
import Header from "../../src/components/mcappheader.jsx";
import * as f from "../../src/components/mcappstyle.js";

export default function render(el) {
  el.innerHTML = (
    <>
      <Header></Header>
      <main>
        <table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Folder Name</th>
              <th>Last Modified</th>
              <th>Size</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody id="world-list"></tbody>
        </table>
      </main>
    </>
  );

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // System-Info laden (falls du OS später noch brauchst)
      const sysRes = await fetch("/api/mcapp/system");
      const sys = await sysRes.json();
      const windows = sys.os === "windows";

      // Welten laden
      const res = await fetch("/api/mcapp/worlds");
      const worlds = await res.json(); // jetzt []World structs mit path, icon, name

      const tbody = document.getElementById("world-list");
      tbody.innerHTML = "";

      worlds.forEach((world) => {
        const tr = document.createElement("tr");

        // Backend liefert bereits icon + name
        let iconPath = world.icon;
        let path = world.path;

        // ⚠️ Browser kann nicht direkt C:\ lesen,
        // -> also sicherstellen, dass dein Gin-Backend die icon.png über r.Static() served!
        // wenn nötig, hier Pfad anpassen:
        // if (windows) {
        // Beispiel: evtl. world.icon schon in /icons/... gewandelt?
        // iconPath = "/icons/" + world.name + ".png";
        // path = "C:" + world.path;
        // }

        const parts = world.path.split(/[/\\]+/);
        const lastFolder = parts[parts.length - 2];

        const webpath = encodeURIComponent(
          path.replace(/[/\\]level\.dat$/i, ""),
        );

        // calculate size in MB
        let size = world.size;
        if (size >= 1024 * 1024) {
          size = (size / (1024 * 1024)).toFixed(2) + " MB";
        } else if (size >= 1024) {
          size = (size / 1024).toFixed(2) + " KB";
        } else {
          size = size + " B";
        }

        tr.innerHTML = (
          <>
            <td>
              <img src={`/___static___/webcache/${iconPath}`} width="32" />
            </td>
            <td>{lastFolder}</td>
            <td>{world.last_modified}</td>
            <td>{size}</td>
            <td>
              <a target="_blanc" href={`/api/openfolder?path=${webpath}`}>
                {path}
              </a>
            </td>
          </>
        );

        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  });
}
