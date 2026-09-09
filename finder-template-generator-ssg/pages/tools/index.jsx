import { escapeHtml, jsx, raw, Fragment } from "../../src/jsx-runtime";
import "./index.css";

const tools = [
  {
    href: "./installscript/",
    title: "Install Script Generator",
    description:
      "Generiere ein einzelnes portables Bash-Install-Skript für Linux und macOS – mit Download, Extraktion, PATH-Eintrag und optionalen Installationsarten.",
    tags: ["installer", "bash", "github"],
  },
  {
    href: "markdowneditor/",
    title: "Markdown Editor",
    description:
      "Bearbeite und vorschau Markdown-Dateien direkt im Browser, inklusive Live-Vorschau.",
    tags: ["markdown", "editor"],
  },
  {
    href: "./minecraft/tellraw/",
    title: "Minecraft Tellraw",
    description:
      "Baue tellraw-Kommandos für Minecraft – nützlich für Farben, Formatierungen und mehrere Segmente.",
    tags: ["minecraft", "tellraw", "command"],
  },
];

export default function render(el) {
  el.innerHTML = (
    <>
      <h1>Tools</h1>
      <div class="tool-grid">
        {tools.map((tool) => (
          <a class="tool-card" href={tool.href}>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <div class="tool-tags">
              {tool.tags.map((tag) => (
                <span class="tool-tag">{tag}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
