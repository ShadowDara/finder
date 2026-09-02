let A="/api/template/load/all";function B(t){R(t)}let k=`
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
`;async function R(t){try{const a=await fetch(A);if(!a.ok)throw new Error(`HTTP ${a.status}`);const s=await a.json(),n=Object.entries(s.templates),i=Object.entries(s.builtin),p=Object.entries(s.custom),l=M(n);t.innerHTML=`
    ${k}
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
              <span>${i.length}</span>
            </button>

            <button class="filter" data-filter="custom">
              Custom
              <span>${p.length}</span>
            </button>

            
          </div>
        </section>

        <div class="tag-filters">
          <span class="tag-filter-label">Tags:</span>
          <button class="tag-filter active" type="button" data-tag-filter="all" > Alle </button> 
          ${l.map(m=>` <button class="tag-filter" type="button" data-tag-filter="${c(m)}" > #${c(m)} </button> `).join("")} 
        </div>
        <br>


        <section class="template-grid" id="template-grid">
          ${q(i,"builtin")}
          ${q(p,"custom")}
        </section>

        <div class="empty-state" id="empty-state" hidden>
          <div class="empty-icon">⌕</div>
          <h2>Keine Templates gefunden</h2>
          <p>Versuche einen anderen Suchbegriff.</p>
        </div>
      </main>
    `,j(t)}catch(a){console.error(a),t.innerHTML=`
      <main class="viewer error">
        <div class="error-card">
          <span class="eyebrow">ERROR</span>
          <h1>Templates konnten nicht geladen werden.</h1>
          <p>
            Der Template-Server ist momentan nicht erreichbar.
          </p>
        </div>
      </main>
    `}}function q(t,a){return t.map(([s,n])=>{const i=x(n);return`
        <article
          class="template-card"
          data-type="${a}"
          data-name="${c(s).toLowerCase()}"
          data-tags="${c(i.join("|").toLowerCase())}"
          tabindex="0"
          role="button"
          aria-label="Template ${c(s)} öffnen"
        >
          <div class="card-header">
            <div class="template-icon">
              ${a==="builtin"?"★":"◇"}
            </div>

            <div class="template-info">
              <h2>${c(s)}</h2>

              <span class="badge ${a}">
                ${a==="builtin"?"Built-in":"Template"}
              </span>

              ${i.length?`
                    <div class="template-tags">
                      ${i.map(p=>`
                            <button
                              class="tag"
                              type="button"
                              data-tag="${c(p)}"
                            >
                              #${c(p)}
                            </button>
                          `).join("")}
                    </div>
                  `:""}
            </div>
          </div>

          <div class="code-preview">
            <pre>${c(O(n))}</pre>
          </div>

          <div class="card-footer">
            <span>${n.length.toLocaleString()} Zeichen</span>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(n)}"
              type="button"
            >
              Copy
            </button>
          </div>
        </article>
      `}).join("")}function j(t){const a=t.querySelector("#template-search"),s=[...t.querySelectorAll(".template-card")],n=[...t.querySelectorAll(".filter")],i=[...t.querySelectorAll(".tag-filter")],p=t.querySelector("#empty-state"),l=t.querySelector("#template-modal"),m=t.querySelector("#modal-title"),E=t.querySelector("#modal-content"),w=t.querySelector("#modal-tags"),L=t.querySelector("#modal-size"),b=t.querySelector("#modal-close"),d=t.querySelector("#modal-copy");let T="all",S="all";function $(){var r,f;const e=(a==null?void 0:a.value.trim().toLowerCase())??"";let o=0;for(const u of s){const C=!e||((r=u.dataset.name)==null?void 0:r.includes(e)),h=T==="all"||u.dataset.type===T,y=((f=u.dataset.tags)==null?void 0:f.split("|").filter(Boolean))??[],g=S==="all"||y.includes(S.toLowerCase()),v=C&&h&&g;u.hidden=!v,v&&o++}p&&(p.hidden=o!==0)}a==null||a.addEventListener("input",$),n.forEach(e=>{e.addEventListener("click",()=>{n.forEach(o=>{o.classList.remove("active")}),e.classList.add("active"),T=e.dataset.filter??"all",$()})}),i.forEach(e=>{e.addEventListener("click",()=>{i.forEach(o=>{o.classList.remove("active")}),e.classList.add("active"),S=e.dataset.tagFilter??"all",$()})}),t.querySelectorAll(".tag").forEach(e=>{e.addEventListener("click",()=>{const o=e.dataset.tag;if(!o)return;const r=t.querySelector(`.tag-filter[data-tag-filter="${CSS.escape(o)}"]`);r==null||r.click()})}),t.querySelectorAll(".copy-button").forEach(e=>{e.addEventListener("click",async()=>{const o=decodeURIComponent(e.dataset.content??"");await navigator.clipboard.writeText(o);const r=e.textContent;e.textContent="Copied ✓",setTimeout(()=>{e.textContent=r},1200)})}),s.forEach(e=>{e.addEventListener("click",o=>{var h,y;const r=o.target;if(r.closest(".copy-button")||r.closest(".tag"))return;const f=((h=e.querySelector("h2"))==null?void 0:h.textContent)??"Template",u=((y=e.querySelector("pre"))==null?void 0:y.textContent)??"",C=[...e.querySelectorAll(".tag")].map(g=>{var v;return((v=g.textContent)==null?void 0:v.trim())??""}).filter(Boolean);!l||!m||!E||(m.textContent=f,E.textContent=u,L&&(L.textContent=`${u.length.toLocaleString()} Zeichen`),w&&(w.innerHTML=C.map(g=>`<span class="modal-tag">${c(g)}</span>`).join("")),d&&(d.dataset.content=encodeURIComponent(u),d.textContent="Copy"),l.showModal())})}),b==null||b.addEventListener("click",()=>{l==null||l.close()}),l==null||l.addEventListener("click",e=>{e.target===l&&l.close()}),d==null||d.addEventListener("click",async()=>{const e=decodeURIComponent(d.dataset.content??"");await navigator.clipboard.writeText(e),d.textContent="Copied ✓",setTimeout(()=>{d.textContent="Copy"},1200)})}function c(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function O(t){try{return JSON.stringify(JSON.parse(t),null,2)}catch{return t}}function x(t){try{const a=JSON.parse(t);return Array.isArray(a.tags)?a.tags.filter(s=>typeof s=="string").map(s=>s.trim()).filter(Boolean):[]}catch{return[]}}function M(t){const a=new Set;for(const[,s]of t)for(const n of x(s))a.add(n);return[...a].sort((s,n)=>s.localeCompare(n))}export{B as default};
