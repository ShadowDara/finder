import { jsx, Fragment, raw } from "twynejs/jsx-runtime";

export default function render(el: HTMLDivElement, data: string) {
  el.innerHTML = (
    <>
      <article class="markdown">
        <h1>Shadowdara's Cpp LIb</h1>
        <button id="copy-button" type="button">
          Copy Content
        </button>
        {raw(data)}
        <hr />
        <p>More Updates and Stuff will probably come soon</p>
        <hr />
      </article>
    </>
  );

  const button = el.querySelector<HTMLButtonElement>("#copy-button");

  button?.addEventListener("click", async () => {
    const article = el.querySelector<HTMLElement>(".markdown");

    if (!article) return;

    await navigator.clipboard.writeText(article.innerText);

    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  });
}
