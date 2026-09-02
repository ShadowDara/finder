let f="/api/template/load/all";function b(t){fetch(f).then(e=>{if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}).then(e=>{const n=Object.entries(e.templates),s=Object.entries(e.builtin),c=Object.entries(e.custom);t.innerHTML=`
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
                <strong>${e.count_templates}</strong>
                <span>Templates</span>
              </div>

              <div class="stat">
                <strong>${e.count_buildin_templates}</strong>
                <span>Built-in</span>
              </div>

              <div class="stat">
                <strong>${e.count_custom_templates}</strong>
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
                <span>${s.length}</span>
              </button>

              <button class="filter" data-filter="custom">
                Custom
                <span>${c.length}</span>
              </button>
            </div>
          </section>

          <section class="template-grid" id="template-grid">
            ${m(s,"builtin")}
            ${m(c,"custom")}
          </section>

          <div class="empty-state" id="empty-state" hidden>
            <div class="empty-icon">⌕</div>
            <h2>Keine Templates gefunden</h2>
            <p>Versuche einen anderen Suchbegriff.</p>
          </div>
        </main>
      `,g(t)}).catch(e=>{console.error(e),t.innerHTML=`
        <main class="viewer error">
          <div class="error-card">
            <span class="eyebrow">ERROR</span>
            <h1>Templates konnten nicht geladen werden.</h1>
            <p>
              Der Template-Server ist momentan nicht erreichbar.
            </p>
          </div>
        </main>
      `})}function m(t,e){return t.map(([n,s])=>`
        <article
          class="template-card"
          data-type="${e}"
          data-name="${d(n).toLowerCase()}"
        >
          <div class="card-header">
            <div class="template-icon">
              ${e==="builtin"?"★":"◇"}
            </div>

            <div class="template-info">
              <h2>${d(n)}</h2>
              <span class="badge ${e}">
                ${e==="builtin"?"Built-in":"Template"}
              </span>
            </div>
          </div>

          <div class="code-preview">
            <pre>${d(s)}</pre>
          </div>

          <div class="card-footer">
            <span>${s.length.toLocaleString()} Zeichen</span>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(s)}"
            >
              Copy
            </button>
          </div>
        </article>
      `).join("")}function g(t){const e=t.querySelector("#template-search"),n=[...t.querySelectorAll(".template-card")],s=[...t.querySelectorAll(".filter")],c=t.querySelector("#empty-state");let r="all";function p(){var l;const a=(e==null?void 0:e.value.trim().toLowerCase())??"";let i=0;for(const o of n){const v=!a||((l=o.dataset.name)==null?void 0:l.includes(a)),h=r==="all"||o.dataset.type===r,u=v&&h;o.hidden=!u,u&&i++}c&&(c.hidden=i!==0)}e==null||e.addEventListener("input",p),s.forEach(a=>{a.addEventListener("click",()=>{s.forEach(i=>i.classList.remove("active")),a.classList.add("active"),r=a.dataset.filter??"all",p()})}),t.querySelectorAll(".copy-button").forEach(a=>{a.addEventListener("click",async()=>{const i=decodeURIComponent(a.dataset.content??"");await navigator.clipboard.writeText(i);const l=a.textContent;a.textContent="Copied ✓",setTimeout(()=>{a.textContent=l},1200)})})}function d(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}export{b as default};
