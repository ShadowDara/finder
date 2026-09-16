const state = {
  tables: [],
  selected: null,
  page: 1,
  pageSize: 50,
  total: 0
};

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cell(value) {
  if (value === null || value === undefined) {
    return '<span class="null">NULL</span>';
  }
  if (typeof value === "object") {
    return escapeHTML(JSON.stringify(value));
  }
  return escapeHTML(value);
}

async function loadTables() {
  const data = await api("/api/tables");
  state.tables = data;
  renderTables();
  $("status").textContent = `${data.length} Tabellen/Views`;
}

function renderTables() {
  const filter = $("tableFilter").value.toLowerCase();
  const items = state.tables.filter(t => t.name.toLowerCase().includes(filter));

  $("tables").innerHTML = items.map(t => `
    <div class="table-item ${state.selected === t.name ? "active" : ""}"
         data-name="${escapeHTML(t.name)}">
      <span>${escapeHTML(t.name)}</span>
      <span class="table-type">${escapeHTML(t.type)}</span>
    </div>
  `).join("");

  document.querySelectorAll(".table-item").forEach(el => {
    el.addEventListener("click", () => selectTable(el.dataset.name));
  });
}

async function selectTable(name) {
  state.selected = name;
  state.page = 1;
  renderTables();
  $("welcome").classList.add("hidden");
  $("tableView").classList.remove("hidden");
  $("schema").classList.add("hidden");
  $("tableTitle").textContent = name;
  await loadRows();
}

async function loadRows() {
  try {
    const data = await api(
      `/api/tables/${encodeURIComponent(state.selected)}/rows?page=${state.page}&pageSize=${state.pageSize}`
    );

    state.total = data.total;
    $("tableMeta").textContent = `${data.total.toLocaleString("de-DE")} Zeilen`;
    $("pageInfo").textContent =
      `Seite ${data.page} / ${Math.max(1, Math.ceil(data.total / data.pageSize))}`;

    $("prevBtn").disabled = state.page <= 1;
    $("nextBtn").disabled = state.page * state.pageSize >= state.total;

    renderTable($("dataTable"), data.columns, data.rows);
  } catch (err) {
    $("tableMeta").textContent = err.message;
  }
}

function renderTable(table, columns, rows) {
  table.innerHTML = `
    <thead>
      <tr>${columns.map(c => `<th>${escapeHTML(c)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>${row.map(v => `<td class="${v === null ? "null" : ""}">${cell(v)}</td>`).join("")}</tr>
      `).join("")}
    </tbody>
  `;
}

async function loadSchema() {
  if (!state.selected) return;

  const schema = await api(`/api/tables/${encodeURIComponent(state.selected)}`);
  $("schema").classList.remove("hidden");
  $("schema").innerHTML = `
    <h3>Schema: ${escapeHTML(schema.name)}</h3>
    <div class="schema-grid">
      <table>
        <thead>
          <tr>
            <th>Spalte</th>
            <th>Typ</th>
            <th>NOT NULL</th>
            <th>PK</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          ${schema.columns.map(c => `
            <tr>
              <td>${escapeHTML(c.name)}</td>
              <td>${escapeHTML(c.type || "")}</td>
              <td>${c.notNull ? "✓" : ""}</td>
              <td>${c.primaryKey ? "✓" : ""}</td>
              <td>${c.defaultValue == null ? "" : escapeHTML(c.defaultValue)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function runQuery() {
  const sql = $("sql").value.trim();
  if (!sql) return;

  $("queryMessage").className = "query-message";
  $("queryMessage").textContent = "Ausführen…";
  $("queryTable").innerHTML = "";

  try {
    const data = await api("/api/query", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({sql})
    });

    if (data.message) {
      $("queryMessage").textContent = data.message;
      return;
    }

    $("queryMessage").textContent = `${data.rows.length.toLocaleString("de-DE")} Zeilen`;
    renderTable($("queryTable"), data.columns, data.rows);
  } catch (err) {
    $("queryMessage").className = "query-message error";
    $("queryMessage").textContent = err.message;
  }
}

$("refreshBtn").addEventListener("click", async () => {
  try {
    await loadTables();
    if (state.selected) await loadRows();
  } catch (err) {
    $("status").textContent = err.message;
  }
});

$("tableFilter").addEventListener("input", renderTables);
$("prevBtn").addEventListener("click", async () => {
  if (state.page > 1) {
    state.page--;
    await loadRows();
  }
});
$("nextBtn").addEventListener("click", async () => {
  if (state.page * state.pageSize < state.total) {
    state.page++;
    await loadRows();
  }
});
$("schemaBtn").addEventListener("click", loadSchema);
$("runBtn").addEventListener("click", runQuery);

$("sql").addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runQuery();
  }
});

loadTables().catch(err => {
  $("status").textContent = err.message;
});
