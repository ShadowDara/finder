import{e as i}from"./index.js";let R="/api/template/load/all";function B(t){O(t)}let k=`
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

      <a class="copy-button" type="button" id="modal-edit" >
        Edit
      </a>

      <button class="copy-button" id="modal-copy" type="button">
        Copy
      </button>
    </div>
  </div>
</dialog>
`;async function O(t){try{const a=await fetch(R);if(!a.ok)throw new Error(`HTTP ${a.status}`);const s=await a.json(),n=Object.entries(s.templates),r=Object.entries(s.builtin),u=Object.entries(s.custom),o=j(n);t.innerHTML=`
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
              <span>${r.length}</span>
            </button>

            <button class="filter" data-filter="custom">
              Custom
              <span>${u.length}</span>
            </button>

            
          </div>
        </section>

        <div class="tag-filters">
          <span class="tag-filter-label">Tags:</span>
          <button class="tag-filter active" type="button" data-tag-filter="all" > Alle </button> 
          ${o.map(m=>` <button class="tag-filter" type="button" data-tag-filter="${i(m)}" > #${i(m)} </button> `).join("")} 
        </div>
        <br>


        <section class="template-grid" id="template-grid">
          ${x(r,"builtin")}
          ${x(u,"custom")}
        </section>

        <div class="empty-state" id="empty-state" hidden>
          <div class="empty-icon">⌕</div>
          <h2>Keine Templates gefunden</h2>
          <p>Versuche einen anderen Suchbegriff.</p>
        </div>
      </main>
    `,U(t)}catch(a){console.error(a),t.innerHTML=`
      <main class="viewer error">
        <div class="error-card">
          <span class="eyebrow">ERROR</span>
          <h1>Templates konnten nicht geladen werden.</h1>
          <p>
            Der Template-Server ist momentan nicht erreichbar.
          </p>
        </div>
      </main>
    `}}function x(t,a){return t.map(([s,n])=>{const r=A(n),u=`../creator?template=${encodeURIComponent(n)}&filename=${encodeURIComponent(s)}`,o=`../cacheviewer?name=${encodeURIComponent(s)}`;return`
        <article
          class="template-card"
          data-type="${a}"
          data-name="${i(s).toLowerCase()}"
          data-tags="${i(r.join("|").toLowerCase())}"
          tabindex="0"
          role="button"
          aria-label="Template ${i(s)} öffnen"
        >
          <div class="card-header">
            <div class="template-icon">
              ${a==="builtin"?"★":"◇"}
            </div>

            <div class="template-info">
              <h2>${i(s)}</h2>

              <span class="badge ${a}">
                ${a==="builtin"?"Built-in":"Template"}
              </span>

              ${r.length?`
                    <div class="template-tags">
                      ${r.map(m=>`
                            <button
                              class="tag"
                              type="button"
                              data-tag="${i(m)}"
                            >
                              #${i(m)}
                            </button>
                          `).join("")}
                    </div>
                  `:""}
            </div>
          </div>

          <div class="code-preview">
            <pre>${i(I(n))}</pre>
          </div>

          <div class="card-footer">
            <span>${n.length.toLocaleString()} Zeichen</span>

            ${`<a href="${o}" class="copy-button">View Cache</a>`}

            <a href="${u}" class="copy-button">Edit</a>

            <button
              class="copy-button"
              data-content="${encodeURIComponent(n)}"
              type="button"
            >
              Copy
            </button>
          </div>
        </article>
      `}).join("")}function U(t){const a=t.querySelector("#template-search"),s=[...t.querySelectorAll(".template-card")],n=[...t.querySelectorAll(".filter")],r=[...t.querySelectorAll(".tag-filter")],u=t.querySelector("#empty-state"),o=t.querySelector("#template-modal"),m=t.querySelector("#modal-title"),E=t.querySelector("#modal-content"),w=t.querySelector("#modal-tags"),L=t.querySelector("#modal-size"),b=t.querySelector("#modal-close"),d=t.querySelector("#modal-copy"),q=t.querySelector("#modal-edit");let $="all",S="all";function T(){var c,f;const e=(a==null?void 0:a.value.trim().toLowerCase())??"";let l=0;for(const p of s){const C=!e||((c=p.dataset.name)==null?void 0:c.includes(e)),h=$==="all"||p.dataset.type===$,y=((f=p.dataset.tags)==null?void 0:f.split("|").filter(Boolean))??[],v=S==="all"||y.includes(S.toLowerCase()),g=C&&h&&v;p.hidden=!g,g&&l++}u&&(u.hidden=l!==0)}a==null||a.addEventListener("input",T),n.forEach(e=>{e.addEventListener("click",()=>{n.forEach(l=>{l.classList.remove("active")}),e.classList.add("active"),$=e.dataset.filter??"all",T()})}),r.forEach(e=>{e.addEventListener("click",()=>{r.forEach(l=>{l.classList.remove("active")}),e.classList.add("active"),S=e.dataset.tagFilter??"all",T()})}),t.querySelectorAll(".tag").forEach(e=>{e.addEventListener("click",()=>{const l=e.dataset.tag;if(!l)return;const c=t.querySelector(`.tag-filter[data-tag-filter="${CSS.escape(l)}"]`);c==null||c.click()})}),t.querySelectorAll(".copy-button").forEach(e=>{e.addEventListener("click",async()=>{const l=decodeURIComponent(e.dataset.content??"");await navigator.clipboard.writeText(l);const c=e.textContent;e.textContent="Copied ✓",setTimeout(()=>{e.textContent=c},1200)})}),s.forEach(e=>{e.addEventListener("click",l=>{var h,y;const c=l.target;if(c.closest(".copy-button")||c.closest(".tag"))return;const f=((h=e.querySelector("h2"))==null?void 0:h.textContent)??"Template",p=((y=e.querySelector("pre"))==null?void 0:y.textContent)??"",C=[...e.querySelectorAll(".tag")].map(v=>{var g;return((g=v.textContent)==null?void 0:g.trim())??""}).filter(Boolean);!o||!m||!E||(m.textContent=f,E.textContent=p,L&&(L.textContent=`${p.length.toLocaleString()} Zeichen`),w&&(w.innerHTML=C.map(v=>`<span class="modal-tag">${i(v)}</span>`).join("")),d&&(d.dataset.content=encodeURIComponent(p),d.textContent="Copy"),q&&(q.href=`../creator?template=${encodeURIComponent(JSON.stringify(JSON.parse(p),null,0))}&filename=${encodeURIComponent(f)}`),o.showModal())})}),b==null||b.addEventListener("click",()=>{o==null||o.close()}),o==null||o.addEventListener("click",e=>{e.target===o&&o.close()}),d==null||d.addEventListener("click",async()=>{const e=decodeURIComponent(d.dataset.content??"");await navigator.clipboard.writeText(e),d.textContent="Copied ✓",setTimeout(()=>{d.textContent="Copy"},1200)})}function I(t){try{return JSON.stringify(JSON.parse(t),null,2)}catch{return t}}function A(t){try{const a=JSON.parse(t);return Array.isArray(a.tags)?a.tags.filter(s=>typeof s=="string").map(s=>s.trim()).filter(Boolean):[]}catch{return[]}}function j(t){const a=new Set;for(const[,s]of t)for(const n of A(s))a.add(n);return[...a].sort((s,n)=>s.localeCompare(n))}export{B as default};
