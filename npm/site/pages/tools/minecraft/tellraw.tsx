import { jsx } from "../../../src/jsx-runtime";
import { parseTellraw, stringifyTellraw } from "tellraw-parser";
import "./tellraw.css";
import $ from "jquery";

function processText(text: string): string {
  if (!text.trim()) {
    return "";
  }

  try {
    const parsed = parseTellraw(text);

    return stringifyTellraw(parsed, {
      format: "snbt",
    });
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export default function App(el: HTMLElement) {
  el.innerHTML = (
    <main>
      <p>
        <a href="../../../">HOME</a> - Tellraw Converter from JSON to SNBT to
        Update it for newer Minecraft Versions
      </p>

      <section class="text-editor">
        <div class="text-panel">
          <label for="input">Input</label>

          <textarea
            id="input"
            placeholder="tellraw @a {text:'Hello',bold:true}"
          />
        </div>

        <div class="text-arrow">→</div>

        <div class="text-panel">
          <label for="output">Output</label>

          <textarea id="output" readOnly placeholder="SNBT Output..." />
        </div>
      </section>

      <p>
        More Minecraft Tools are{" "}
        <a href="https://shadowdara.github.io/mctools">here</a>!
      </p>
    </main>
  );

  $("#input").on("input", function () {
    const value = $(this).val() as string;

    $("#output").val(processText(value));
  });
}
