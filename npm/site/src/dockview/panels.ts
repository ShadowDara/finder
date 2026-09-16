import type { IContentRenderer } from "dockview";

function createElement(html: string): HTMLDivElement {
  const element = document.createElement("div");
  element.innerHTML = html;
  return element;
}

export class ExplorerPanel implements IContentRenderer {
  element: HTMLElement;

  constructor() {
    this.element = createElement(`
      <div class="explorer">
        <div class="explorer__section">
          <div class="explorer__title">
            EXPLORER
          </div>

          <div class="tree">
            <div class="tree__item tree__folder">
              <span>▾</span>
              <span>📁 src</span>
            </div>

            <div class="tree__children">
              <div class="tree__item">
                <span>◻</span>
                <span>main.ts</span>
              </div>

              <div class="tree__item">
                <span>◻</span>
                <span>style.css</span>
              </div>

              <div class="tree__item">
                <span>◻</span>
                <span>App.ts</span>
              </div>
            </div>

            <div class="tree__item tree__folder">
              <span>▸</span>
              <span>📁 components</span>
            </div>

            <div class="tree__item">
              <span>◻</span>
              <span>index.html</span>
            </div>

            <div class="tree__item">
              <span>◻</span>
              <span>package.json</span>
            </div>
          </div>
        </div>
      </div>
    `);

    this.bindEvents();
  }

  init(): void {}

  dispose(): void {
    this.element.remove();
  }

  private bindEvents() {
    this.element.querySelectorAll(".tree__item").forEach((item) => {
      item.addEventListener("click", () => {
        this.element.querySelectorAll(".tree__item").forEach((el) => {
          el.classList.remove("tree__item--active");
        });

        item.classList.add("tree__item--active");
      });
    });
  }
}

export class EditorPanel implements IContentRenderer {
  element: HTMLElement;

  constructor() {
    this.element = createElement(`
      <div class="editor">
        <div class="editor__breadcrumbs">
          src
          <span>/</span>
          main.ts
        </div>

        <div class="editor__content">
          <div class="line">
            <span class="line-number">1</span>
            <span>
              <span class="keyword">import</span>
              { createApp }
              <span class="keyword">from</span>
              <span class="string">"./app"</span>;
            </span>
          </div>

          <div class="line">
            <span class="line-number">2</span>
            <span></span>
          </div>

          <div class="line">
            <span class="line-number">3</span>
            <span>
              <span class="keyword">const</span>
              app = createApp();
            </span>
          </div>

          <div class="line">
            <span class="line-number">4</span>
            <span></span>
          </div>

          <div class="line">
            <span class="line-number">5</span>
            <span>
              app.<span class="function">mount</span>(<span class="string">
              "#app"
              </span>);
            </span>
          </div>

          <div class="line">
            <span class="line-number">6</span>
            <span></span>
          </div>

          <div class="line">
            <span class="line-number">7</span>
            <span class="comment">// Hello from Dockview</span>
          </div>
        </div>
      </div>
    `);
  }

  init(): void {}

  dispose(): void {
    this.element.remove();
  }
}

export class TerminalPanel implements IContentRenderer {
  element: HTMLElement;

  constructor() {
    this.element = createElement(`
      <div class="terminal">
        <div class="terminal__line">
          <span class="terminal__prompt">$</span>
          npm run dev
        </div>

        <div class="terminal__output">
          VITE v7 ready in 142 ms
        </div>

        <div class="terminal__output">
          ➜ Local:
          <span class="terminal__link">
            http://localhost:5173/
          </span>
        </div>

        <div class="terminal__line terminal__cursor">
          <span class="terminal__prompt">$</span>
          <span class="cursor"></span>
        </div>
      </div>
    `);
  }

  init(): void {}

  dispose(): void {
    this.element.remove();
  }
}

export class WelcomePanel implements IContentRenderer {
  element: HTMLElement;

  constructor() {
    this.element = createElement(`
      <div class="welcome">
        <div class="welcome__logo">
          &lt;/&gt;
        </div>

        <h1>Welcome</h1>

        <p>
          Your Vite + TypeScript + Dockview workspace.
        </p>

        <div class="welcome__actions">
          <button data-action="open-editor">
            Open Editor
          </button>

          <button data-action="open-terminal">
            Open Terminal
          </button>
        </div>
      </div>
    `);
  }

  init(): void {}

  dispose(): void {
    this.element.remove();
  }
}
