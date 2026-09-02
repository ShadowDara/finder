let f="/api/template/load/all";function T(e){g(e)}async function g(e){try{const t=await fetch(f);if(!t.ok)throw new Error(`HTTP ${t.status}`);const s=await t.json(),n=Object.entries(s.templates),c=Object.entries(s.builtin),r=Object.entries(s.custom);e.innerHTML=`
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
              <strong>${s.count_templates}</strong>
              <span>Templates</span>
            </div>

            <div class="stat">
              <strong>${s.count_buildin_templates}</strong>
              <span>Built-in</span>
            </div>

            <div class="stat">
              <strong>${s.count_custom_templates}</strong>
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
              <span>${n.length}</span>
            </button>

            <button class="filter" data-filter="builtin">
              Built-in
              <span>${c.length}</span>
            </button>

            <button class="filter" data-filter="custom">
              Custom
              <span>${r.length}</span>
            </button>
          </div>
        </section>

        <section class="template-grid" id="template-grid">
          ${m(c,"builtin")}
          ${m(r,"custom")}
        </section>

        <div class="empty-state" id="empty-state" hidden>
          <div class="empty-icon">⌕</div>
          <h2>Keine Templates gefunden</h2>
          <p>Versuche einen anderen Suchbegriff.</p>
        </div>
      </main>
    `,b(e)}catch(t){console.error(t),e.innerHTML=`
      <main class="viewer error">
        <div class="error-card">
          <span class="eyebrow">ERROR</span>
          <h1>Templates konnten nicht geladen werden.</h1>
          <p>
            Der Template-Server ist momentan nicht erreichbar.
          </p>
        </div>
      </main>
    `}}function m(e,t){return e.map(([s,n])=>`
        <article
          class="template-card"
          data-type="${t}"
          data-name="${d(s).toLowerCase()}"
        >
          <div class="card-header">
            <div class="template-icon">
              ${t==="builtin"?"★":"◇"}
            </div>

            <div class="template-info">
              <h2>${d(s)}</h2>
              <span class="badge ${t}">
                ${t==="builtin"?"Built-in":"Template"}
              </span>
            </div>
          </div>

          <div class="code-preview">
            <pre>${d(y(n))}</pre>
          </div>

          <div class="card-footer">
            <span>${n.length.toLocaleString()} Zeichen</span>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(n)}"
            >
              Copy
            </button>
          </div>
        </article>
      `).join("")}function b(e){const t=e.querySelector("#template-search"),s=[...e.querySelectorAll(".template-card")],n=[...e.querySelectorAll(".filter")],c=e.querySelector("#empty-state");let r="all";function p(){var l;const a=(t==null?void 0:t.value.trim().toLowerCase())??"";let i=0;for(const o of s){const v=!a||((l=o.dataset.name)==null?void 0:l.includes(a)),h=r==="all"||o.dataset.type===r,u=v&&h;o.hidden=!u,u&&i++}c&&(c.hidden=i!==0)}t==null||t.addEventListener("input",p),n.forEach(a=>{a.addEventListener("click",()=>{n.forEach(i=>i.classList.remove("active")),a.classList.add("active"),r=a.dataset.filter??"all",p()})}),e.querySelectorAll(".copy-button").forEach(a=>{a.addEventListener("click",async()=>{const i=decodeURIComponent(a.dataset.content??"");await navigator.clipboard.writeText(i);const l=a.textContent;a.textContent="Copied ✓",setTimeout(()=>{a.textContent=l},1200)})})}function d(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function y(e){try{return JSON.stringify(JSON.parse(e),null,2)}catch{return e}}export{T as default};
