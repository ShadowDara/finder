import "./viewer.css";

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

export default function render(el: HTMLDivElement) {
  fetch(adress)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<ServerResponse>;
    })
    .then((data) => {
      const templates = Object.entries(data.templates);
      const builtin = Object.entries(data.builtin);
      const custom = Object.entries(data.custom);

      el.innerHTML = `
        <main class="viewer">
          <header class="viewer-header">
            <div>
              <span class="eyebrow">TEMPLATE VIEWER</span> / <span class="eyebrow"><a href="../creator">Template Creator</a></span> / <span class="eyebrow"><a href="../">Home</a></span>
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
    })
    .catch((error) => {
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
    });
}

function renderTemplates(
  templates: [string, string][],
  type: "templates" | "builtin" | "custom",
) {
  return templates
    .map(
      ([name, content]) => `
        <article
          class="template-card"
          data-type="${type}"
          data-name="${escapeHtml(name).toLowerCase()}"
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
            </div>
          </div>

          <div class="code-preview">
            <pre>${escapeHtml(content)}</pre>
          </div>

          <div class="card-footer">
            <span>${content.length.toLocaleString()} Zeichen</span>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(content)}"
            >
              Copy
            </button>
          </div>
        </article>
      `,
    )
    .join("");
}

function setupSelector(el: HTMLDivElement) {
  const search = el.querySelector<HTMLInputElement>("#template-search");
  const cards = [...el.querySelectorAll<HTMLElement>(".template-card")];
  const filters = [...el.querySelectorAll<HTMLButtonElement>(".filter")];
  const emptyState = el.querySelector<HTMLElement>("#empty-state");

  let activeFilter = "all";

  function update() {
    const query = search?.value.trim().toLowerCase() ?? "";
    let visible = 0;

    for (const card of cards) {
      const matchesSearch = !query || card.dataset.name?.includes(query);

      const matchesFilter =
        activeFilter === "all" || card.dataset.type === activeFilter;

      const show = matchesSearch && matchesFilter;

      card.hidden = !show;

      if (show) {
        visible++;
      }
    }

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  search?.addEventListener("input", update);

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      activeFilter = button.dataset.filter ?? "all";

      update();
    });
  });

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
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
