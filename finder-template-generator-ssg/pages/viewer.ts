import "./viewer.css";
import builtinTemplates from "../src/templates.js";

export interface ServerResponse {
  count_templates: number;
  count_buildin_templates: number;
  count_custom_templates: number;
  templates: Record<string, string>;
  builtin: Record<string, string>;
  custom: Record<string, string>;
}

let adress = "/api/template/load/all";

if (import.meta.env.DEV) {
  adress = "http://localhost:8080/api/template/load/all";
}

const isStatic = import.meta.env.MODE === "static";

export default function render(el: HTMLDivElement) {
  if (isStatic) {
    renderStatic(el);
  } else {
    renderServer(el);
  }
}

let popup = `
<dialog class="template-modal" id="template-modal">
  <div class="modal-card">
    <div class="modal-header">
      <div>
        <span class="eyebrow">TEMPLATE</span>
        <h2 id="modal-title">Template</h2>
      </div>

      <button
        class="modal-close"
        id="modal-close"
        type="button"
        aria-label="Schließen"
      >
        ×
      </button>
    </div>

    <div class="modal-tags" id="modal-tags"></div>

    <div class="modal-code">
      <pre id="modal-content"></pre>
    </div>

    <div class="modal-footer">
      <span id="modal-size"></span>

      <button class="copy-button" id="modal-copy" type="button">
        Copy
      </button>
    </div>
  </div>
</dialog>
`;

function renderStatic(el: HTMLDivElement) {
  // templates.js enthält Objekte, Viewer erwartet Strings
  const builtin: [string, string][] = Object.entries(builtinTemplates).map(
    ([name, content]) => [name, JSON.stringify(content)],
  );

  const allTags = getAllTags(builtin);

  el.innerHTML = `
    ${popup}
    <main class="viewer">
      <header class="viewer-header">
        <div>
          <span class="eyebrow">TEMPLATE VIEWER</span> /
          <span class="eyebrow"><a href="../creator">TEMPLATE CREATOR</a></span> /
          <span class="eyebrow"><a href="../">HOME</a></span>

          <h1>Templates</h1>

          <p>
            Durchsuche und erkunde alle verfügbaren Templates.
          </p>
        </div>

        <div class="stats">
          ${
            isStatic
              ? ""
              : `<div class="stat">
            <strong>${builtin.length}</strong>
            <span>Templates</span>
          </div>`
          }
          

          <div class="stat">
            <strong>${builtin.length}</strong>
            <span>Built-in</span>
          </div>

          ${
            isStatic
              ? ""
              : `<div class="stat">
            <strong>0</strong>
            <span>Custom</span>
          </div>`
          }
          
        </div>
      </header>

      <section class="toolbar">
        <div class="search">
          <span>⌕</span>
          <input
            id="template-search"
            type="search"
            placeholder="Templates suchen..."
            autocomplete="off"
          />
        </div>

        <div class="filters">
        
          <button class="filter active" data-filter="all">
            Alle
            <span>${builtin.length}</span>
          </button>

          ${
            isStatic
              ? ""
              : `<button class="filter" data-filter="builtin">
            Built-in
            <span>${builtin.length}</span>
          </button>`
          }
        </div>
      </section>

      <div class="tag-filters"> <span class="tag-filter-label">Tags:</span> <button class="tag-filter active" type="button" data-tag-filter="all" > Alle </button> ${allTags.map((tag) => ` <button class="tag-filter" type="button" data-tag-filter="${escapeHtml(tag)}" > #${escapeHtml(tag)} </button> `).join("")} </div>
      <br>

      <section class="template-grid" id="template-grid">
        ${renderTemplates(builtin, "builtin")}
      </section>

      <div class="empty-state" id="empty-state" hidden>
        <div class="empty-icon">⌕</div>
        <h2>Keine Templates gefunden</h2>
        <p>Versuche einen anderen Suchbegriff.</p>
      </div>
    </main>
  `;

  setupSelector(el);
}

async function renderServer(el: HTMLDivElement) {
  try {
    const response = await fetch(adress);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as ServerResponse;

    const templates = Object.entries(data.templates);
    const builtin = Object.entries(data.builtin);
    const custom = Object.entries(data.custom);

    const allTags = getAllTags(templates);

    el.innerHTML = `
    ${popup}
      <main class="viewer">
        <header class="viewer-header">
          <div>
            <span class="eyebrow">TEMPLATE VIEWER</span> /
            <span class="eyebrow"><a href="../creator">TEMPLATE CREATOR</a></span> /
            <span class="eyebrow"><a href="../">HOME</a></span>

            <h1>Templates</h1>

            <p>
              Durchsuche und erkunde alle verfügbaren Templates.
            </p>
          </div>

          <div class="stats">
            <div class="stat">
              <strong>${data.count_templates}</strong>
              <span>Templates</span>
            </div>

            <div class="stat">
              <strong>${data.count_buildin_templates}</strong>
              <span>Built-in</span>
            </div>

            <div class="stat">
              <strong>${data.count_custom_templates}</strong>
              <span>Custom</span>
            </div>
          </div>
        </header>

        <section class="toolbar">
          <div class="search">
            <span>⌕</span>
            <input
              id="template-search"
              type="search"
              placeholder="Templates suchen..."
              autocomplete="off"
            />
          </div>

          <div class="filters">
            <button class="filter active" data-filter="all">
              Alle
              <span>${templates.length}</span>
            </button>

            <button class="filter" data-filter="builtin">
              Built-in
              <span>${builtin.length}</span>
            </button>

            <button class="filter" data-filter="custom">
              Custom
              <span>${custom.length}</span>
            </button>

            
          </div>
        </section>

        <div class="tag-filters">
          <span class="tag-filter-label">Tags:</span>
          <button class="tag-filter active" type="button" data-tag-filter="all" > Alle </button> 
          ${allTags.map((tag) => ` <button class="tag-filter" type="button" data-tag-filter="${escapeHtml(tag)}" > #${escapeHtml(tag)} </button> `).join("")} 
        </div>
        <br>


        <section class="template-grid" id="template-grid">
          ${renderTemplates(builtin, "builtin")}
          ${renderTemplates(custom, "custom")}
        </section>

        <div class="empty-state" id="empty-state" hidden>
          <div class="empty-icon">⌕</div>
          <h2>Keine Templates gefunden</h2>
          <p>Versuche einen anderen Suchbegriff.</p>
        </div>
      </main>
    `;

    setupSelector(el);
  } catch (error) {
    console.error(error);

    el.innerHTML = `
      <main class="viewer error">
        <div class="error-card">
          <span class="eyebrow">ERROR</span>
          <h1>Templates konnten nicht geladen werden.</h1>
          <p>
            Der Template-Server ist momentan nicht erreichbar.
          </p>
        </div>
      </main>
    `;
  }
}

function renderTemplates(
  templates: [string, string][],
  type: "templates" | "builtin" | "custom",
) {
  return templates
    .map(([name, content]) => {
      const tags = getTags(content);

      return `
        <article
          class="template-card"
          data-type="${type}"
          data-name="${escapeHtml(name).toLowerCase()}"
          data-tags="${escapeHtml(tags.join("|").toLowerCase())}"
          tabindex="0"
          role="button"
          aria-label="Template ${escapeHtml(name)} öffnen"
        >
          <div class="card-header">
            <div class="template-icon">
              ${type === "builtin" ? "★" : "◇"}
            </div>

            <div class="template-info">
              <h2>${escapeHtml(name)}</h2>

              <span class="badge ${type}">
                ${type === "builtin" ? "Built-in" : "Template"}
              </span>

              ${
                tags.length
                  ? `
                    <div class="template-tags">
                      ${tags
                        .map(
                          (tag) => `
                            <button
                              class="tag"
                              type="button"
                              data-tag="${escapeHtml(tag)}"
                            >
                              #${escapeHtml(tag)}
                            </button>
                          `,
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="code-preview">
            <pre>${escapeHtml(formatJson(content))}</pre>
          </div>

          <div class="card-footer">
            <span>${content.length.toLocaleString()} Zeichen</span>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(content)}"
              type="button"
            >
              Copy
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function setupSelector(el: HTMLDivElement) {
  const search = el.querySelector<HTMLInputElement>("#template-search");
  const cards = [...el.querySelectorAll<HTMLElement>(".template-card")];
  const filters = [...el.querySelectorAll<HTMLButtonElement>(".filter")];
  const tagFilters = [...el.querySelectorAll<HTMLButtonElement>(".tag-filter")];
  const emptyState = el.querySelector<HTMLElement>("#empty-state");

  const modal = el.querySelector<HTMLDialogElement>("#template-modal");
  const modalTitle = el.querySelector<HTMLElement>("#modal-title");
  const modalContent = el.querySelector<HTMLElement>("#modal-content");
  const modalTags = el.querySelector<HTMLElement>("#modal-tags");
  const modalSize = el.querySelector<HTMLElement>("#modal-size");
  const modalClose = el.querySelector<HTMLButtonElement>("#modal-close");
  const modalCopy = el.querySelector<HTMLButtonElement>("#modal-copy");

  let activeFilter = "all";
  let activeTag = "all";

  function update() {
    const query = search?.value.trim().toLowerCase() ?? "";
    let visible = 0;

    for (const card of cards) {
      const matchesSearch = !query || card.dataset.name?.includes(query);

      const matchesFilter =
        activeFilter === "all" || card.dataset.type === activeFilter;

      const cardTags = card.dataset.tags?.split("|").filter(Boolean) ?? [];

      const matchesTag =
        activeTag === "all" || cardTags.includes(activeTag.toLowerCase());

      const show = matchesSearch && matchesFilter && matchesTag;

      card.hidden = !show;

      if (show) {
        visible++;
      }
    }

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  // Suche
  search?.addEventListener("input", update);

  // Built-in / Custom / Alle
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      activeFilter = button.dataset.filter ?? "all";

      update();
    });
  });

  // Tag-Filter
  tagFilters.forEach((button) => {
    button.addEventListener("click", () => {
      tagFilters.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      activeTag = button.dataset.tagFilter ?? "all";

      update();
    });
  });

  // Klick auf einen Tag direkt auf einer Template-Karte
  el.querySelectorAll<HTMLButtonElement>(".tag").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;

      if (!tag) {
        return;
      }

      const filter = el.querySelector<HTMLButtonElement>(
        `.tag-filter[data-tag-filter="${CSS.escape(tag)}"]`,
      );

      filter?.click();
    });
  });

  // Copy
  el.querySelectorAll<HTMLButtonElement>(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const content = decodeURIComponent(button.dataset.content ?? "");

      await navigator.clipboard.writeText(content);

      const original = button.textContent;

      button.textContent = "Copied ✓";

      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });

  // Template-Modal
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Buttons innerhalb der Card sollen ihre eigene Funktion behalten
      if (target.closest(".copy-button") || target.closest(".tag")) {
        return;
      }

      const title = card.querySelector("h2")?.textContent ?? "Template";
      const content = card.querySelector("pre")?.textContent ?? "";
      const tags = [...card.querySelectorAll<HTMLButtonElement>(".tag")]
        .map((tag) => tag.textContent?.trim() ?? "")
        .filter(Boolean);

      if (!modal || !modalTitle || !modalContent) {
        return;
      }

      modalTitle.textContent = title;
      modalContent.textContent = content;

      if (modalSize) {
        modalSize.textContent = `${content.length.toLocaleString()} Zeichen`;
      }

      if (modalTags) {
        modalTags.innerHTML = tags
          .map((tag) => `<span class="modal-tag">${escapeHtml(tag)}</span>`)
          .join("");
      }

      if (modalCopy) {
        modalCopy.dataset.content = encodeURIComponent(content);
        modalCopy.textContent = "Copy";
      }

      modal.showModal();
    });
  });

  modalClose?.addEventListener("click", () => {
    modal?.close();
  });

  // Klick auf den Hintergrund schließt das Modal
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.close();
    }
  });

  // Copy innerhalb des Modals
  modalCopy?.addEventListener("click", async () => {
    const content = decodeURIComponent(modalCopy.dataset.content ?? "");

    await navigator.clipboard.writeText(content);

    modalCopy.textContent = "Copied ✓";

    setTimeout(() => {
      modalCopy.textContent = "Copy";
    }, 1200);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function getTags(content: string): string[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.tags)) {
      return parsed.tags
        .filter((tag: any): tag is string => typeof tag === "string")
        .map((tag: string) => tag.trim())
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

function getAllTags(templates: [string, string][]): string[] {
  const tags = new Set<string>();
  for (const [, content] of templates) {
    for (const tag of getTags(content)) {
      tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
