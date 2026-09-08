import { escapeHtml, jsx, raw, Fragment } from "../src/jsx-runtime";
import { genSamfile, genSamfileJson } from "../src/samfile/gen";
import "./samfile.css"

export default function render(el) {
  el.innerHTML = (
    <>
      <p>Samfile Generator</p>

      <input id="input" placeholder="Version" />
      <textarea id="text">// Add macros here</textarea>
      <textarea id="text1">// Your Fling code</textarea>
      <textarea id="text2"># Your Settings here</textarea>
      <textarea id="text3"># Your Section Types here</textarea>
      <textarea id="text5"># samfile section</textarea>
      <textarea id="text6"># batch2 section</textarea>
      <textarea id="text4">// add more sections here</textarea>
      <textarea id="text7"># Write build macros here</textarea>
      <textarea id="text8">-- Lua sectiin</textarea>
      <textarea id="text9">// JS Section</textarea>

      <hr />
      <textarea id="import"></textarea>
      <button id="importBtn">Import</button>

      <pre id="output" style="width: 100%; height: 100%"></pre>
      <button id="copybtn">Copy Content</button>
    </>
  );

  const input = document.getElementById("input");
  const text = document.getElementById("text");
  const text1 = document.getElementById("text1");
  const text2 = document.getElementById("text2");
  const text3 = document.getElementById("text3");
  const text4 = document.getElementById("text4");
  const text5 = document.getElementById("text5");
  const text6 = document.getElementById("text6");
  const text7 = document.getElementById("text7");
  const text8 = document.getElementById("text8");
  const text9 = document.getElementById("text9");
  const output = document.getElementById("output");

  function updateOutput() {
    output.innerText = genSamfile(
      genSamfileJson(
        input.value,
        text1.value,
        text2.value,
        text3.value,
        text4.value,
        text.value,
        text5.value,
        text6.value,
        text7.value,
        text8.value,
        text9.value,
      ),
    );
  }

  function Import() {}

  updateOutput();

  input.addEventListener("input", updateOutput);
  text.addEventListener("input", updateOutput);
  text1.addEventListener("input", updateOutput);
  text2.addEventListener("input", updateOutput);
  text3.addEventListener("input", updateOutput);
  text4.addEventListener("input", updateOutput);
  text5.addEventListener("input", updateOutput);
  text6.addEventListener("input", updateOutput);
  text7.addEventListener("input", updateOutput);
  text8.addEventListener("input", updateOutput);
  text9.addEventListener("input", updateOutput);

  document.getElementById("copybtn").addEventListener("click", async () => {
    const content = output.innerText;
    const button = document.getElementById("copybtn");

    try {
      await navigator.clipboard.writeText(content);

      button.textContent = "✓ Copied!";

      setTimeout(() => {
        button.textContent = "Copy Content";
      }, 1500);
    } catch (err) {
      console.error("Copy failed:", err);

      button.textContent = "Copy failed";

      setTimeout(() => {
        button.textContent = "Copy Content";
      }, 1500);
    }
  });
}
