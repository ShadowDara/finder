import { escapeHtml, jsx, raw, Fragment } from "../src/jsx-runtime";
import { SERVER_ADRESS } from "../src/vars";
import "./cacheviewer.css";

export interface LocationsResponse {
  date: string;
  locations: string[];
}

const params = new URLSearchParams(window.location.search);

const name = params.get("name");

let address = "/api/template/load/cache?name=" + name;

if (import.meta.env.DEV) {
  address = SERVER_ADRESS + "/api/template/load/cache?name=" + name;
}

export default function render(el: HTMLDivElement) {
  renderLoading(el);
  loadAndRender(el);
}

async function loadAndRender(el: HTMLDivElement) {
  try {
    const response = await fetch(address);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as LocationsResponse;

    renderData(el, data);
    setupViewer(el);
  } catch (error) {
    console.error(error);
    renderError(el);
  }
}

function renderLoading(el: HTMLDivElement) {
  el.innerHTML = (
    <main class="loc-viewer">
      <p class="loc-loading">Loading Projects…</p>
    </main>
  );
}

function renderError(el: HTMLDivElement) {
  el.innerHTML = (
    <main class="loc-viewer error">
      <div class="error-card">
        <span class="eyebrow">ERROR</span>
        <h1>Projektordner konnten nicht geladen werden.</h1>
        <p>Der Server ist momentan nicht erreichbar.</p>
        <button class="loc-btn" id="loc-retry" type="button">
          Retry
        </button>
      </div>
    </main>
  );

  el.querySelector<HTMLButtonElement>("#loc-retry")?.addEventListener(
    "click",
    () => {
      renderLoading(el);
      loadAndRender(el);
    },
  );
}

// ---------------------------------------------------------------------------
// Parsing / Datenaufbereitung
// ---------------------------------------------------------------------------

interface ParsedLocation {
  full: string;
  drive: string;
  name: string;
  depth: number;
  nested: boolean;
}

function parseLocations(locations: string[]): ParsedLocation[] {
  return locations.map((full) => {
    const normalized = full.replace(/\\/g, "/");
    const match = normalized.match(/^([A-Za-z]:)\/(.*)$/);
    const drive = match ? match[1].toUpperCase() : "?";
    const parts = normalized.split("/").filter(Boolean);
    const name = parts[parts.length - 1] ?? normalized;

    return {
      full: normalized,
      drive,
      name,
      depth: parts.length,
      nested: false,
    };
  });
}

/** markiert Pfade, die selbst Unterordner eines anderen Pfads in der Liste sind. */
function markNested(items: ParsedLocation[]): void {
  const all = items.map((i) => i.full);

  for (const item of items) {
    item.nested = all.some(
      (other) => other !== item.full && item.full.startsWith(other + "/"),
    );
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderData(el: HTMLDivElement, data: LocationsResponse) {
  const items = parseLocations(data.locations);
  markNested(items);

  const drives = [...new Set(items.map((i) => i.drive))].sort();
  const nestedCount = items.filter((i) => i.nested).length;

  el.innerHTML = (
    <main class="loc-viewer">
      <header class="loc-header">
        <div>
          <span class="eyebrow">
            <a href="../">HOME</a>
          </span>
          <h1>Projektordner</h1>
          <p>Zuletzt gescannt: {formatDate(data.date)}</p>
        </div>

        <div class="loc-stats">
          <div class="loc-stat">
            <strong>{items.length}</strong>
            <span>Ordner</span>
          </div>
          {raw(
            drives
              .map(
                (drive) => `
              <div class="loc-stat">
                <strong>${items.filter((i) => i.drive === drive).length}</strong>
                <span>${escapeHtml(drive)}</span>
              </div>
            `,
              )
              .join(""),
          )}
          <div class="loc-stat">
            <strong>{nestedCount}</strong>
            <span>Verschachtelt</span>
          </div>
        </div>
      </header>

      <section class="loc-toolbar">
        <div class="loc-search">
          <span>⌕</span>
          <input
            id="loc-search"
            type="search"
            placeholder="Ordner suchen..."
            autocomplete="off"
          />
        </div>

        <div class="loc-filters">
          <button
            class="loc-filter active"
            data-drive-filter="all"
            type="button"
          >
            Alle <span>{items.length}</span>
          </button>
          {raw(
            drives
              .map(
                (drive) => `
              <button class="loc-filter" data-drive-filter="${escapeHtml(drive)}" type="button">
                ${escapeHtml(drive)} <span>${items.filter((i) => i.drive === drive).length}</span>
              </button>
            `,
              )
              .join(""),
          )}
        </div>

        <label class="loc-toggle">
          <input type="checkbox" id="loc-hide-nested" />
          Nur Top-Level anzeigen
        </label>
      </section>

      <section class="loc-grid" id="loc-grid">
        {raw(renderCards(items))}
      </section>

      <div class="loc-empty" id="loc-empty" hidden>
        Keine Ordner gefunden.
      </div>
    </main>
  );
}

function renderCards(items: ParsedLocation[]): string {
  return items
    .map((item) => (
      <article
        class="loc-card"
        data-drive={item.drive}
        data-nested={item.nested}
        data-search={item.full.toLowerCase()}
        tabindex="0"
        role="button"
        data-copy={item.full}
        aria-label={`Pfad ${item.full} kopieren`}
      >
        <div class="loc-card-header">
          <span class="loc-drive-badge">{item.drive}</span>
          <h3 class="loc-name">{item.name}</h3>
          {item.nested && <span class="loc-nested-badge">verschachtelt</span>}
        </div>
        <p class="loc-path">{item.full}</p>
        <div class="loc-card-footer">
          <span class="loc-depth">{item.depth} Ebenen</span>
          <button class="loc-copy-btn" type="button" data-copy={item.full}>
            Copy
          </button>
        </div>
      </article>
    ))
    .join("");
}

// ---------------------------------------------------------------------------
// Interaktivität
// ---------------------------------------------------------------------------

function setupViewer(el: HTMLDivElement) {
  if (import.meta.env.MODE == "static") {
    return (
      <>
        <h1>Cache Viewer</h1>
        <p>Cache Viewer doesn't work in static Mode</p>
        <p>
          <a href="../">Back Home</a>
        </p>
      </>
    );
  }

  const search = el.querySelector<HTMLInputElement>("#loc-search");
  const filters = [
    ...el.querySelectorAll<HTMLButtonElement>("[data-drive-filter]"),
  ];
  const hideNested = el.querySelector<HTMLInputElement>("#loc-hide-nested");
  const emptyState = el.querySelector<HTMLElement>("#loc-empty");

  let activeDrive = "all";

  function cards() {
    return [...el.querySelectorAll<HTMLElement>(".loc-card")];
  }

  function update() {
    const query = search?.value.trim().toLowerCase() ?? "";
    const onlyTopLevel = hideNested?.checked ?? false;
    let visible = 0;

    for (const card of cards()) {
      const matchesSearch = !query || card.dataset.search?.includes(query);
      const matchesDrive =
        activeDrive === "all" || card.dataset.drive === activeDrive;
      const matchesNested = !onlyTopLevel || card.dataset.nested === "false";

      const show = matchesSearch && matchesDrive && matchesNested;
      card.hidden = !show;
      if (show) visible++;
    }

    if (emptyState) emptyState.hidden = visible !== 0;
  }

  search?.addEventListener("input", update);
  hideNested?.addEventListener("change", update);

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      console.log("filter click", button.dataset.driveFilter);
      filters.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      activeDrive = button.dataset.driveFilter ?? "all";
      update();
    });
  });

  async function copyToClipboard(button: HTMLElement) {
    const path = button.dataset.copy ?? "";
    try {
      await navigator.clipboard.writeText(path);
      const original = button.textContent;
      if (button.tagName === "BUTTON") {
        button.textContent = "Copied ✓";
        setTimeout(() => (button.textContent = original), 1200);
      }
    } catch (error) {
      console.error("Kopieren fehlgeschlagen", error);
    }
  }

  el.querySelectorAll<HTMLButtonElement>(".loc-copy-btn").forEach((button) => {
    button.addEventListener("click", (ev) => {
      ev.stopPropagation();
      copyToClipboard(button);
    });
  });

  // Klick auf die ganze Karte kopiert ebenfalls den Pfad
  cards().forEach((card) => {
    card.addEventListener("click", (ev) => {
      if ((ev.target as HTMLElement).closest(".loc-copy-btn")) return;
      copyToClipboard(card);
    });
  });
}
