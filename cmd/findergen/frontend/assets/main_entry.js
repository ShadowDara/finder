const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./cacheviewer.js","./cacheviewer.css","./configeditor.js","./configeditor.css","./creator.js","./creator.css","./home.js","./home.css","./about.js","./mcappheader.js","./mcappheader.css","./index2.js","./info.js","./worlds.js","./regexcreator.js","./regexcreator.css","./samfile.js","./jquery.module.js","./samfile.css","./index3.js","./index.css","./installscript.js","./installscript.css","./markdowneditor.js","./markdown.js","./markdowneditor.css","./tellraw.js","./tellraw.css","./viewer.js","./viewer.css"])))=>i.map(i=>d[i]);
const T="modulepreload",S=function(e,n){return new URL(e,n).href},w={},l=function(n,a,o){let h=Promise.resolve();if(a&&a.length>0){let p=function(r){return Promise.all(r.map(u=>Promise.resolve(u).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};const i=document.getElementsByTagName("link"),s=document.querySelector("meta[property=csp-nonce]"),d=(s==null?void 0:s.nonce)||(s==null?void 0:s.getAttribute("nonce"));h=p(a.map(r=>{if(r=S(r,o),r in w)return;w[r]=!0;const u=r.endsWith(".css"),m=u?'[rel="stylesheet"]':"";if(!!o)for(let f=i.length-1;f>=0;f--){const j=i[f];if(j.href===r&&(!u||j.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${r}"]${m}`))return;const c=document.createElement("link");if(c.rel=u?"stylesheet":T,u||(c.as="script"),c.crossOrigin="",c.href=r,d&&c.setAttribute("nonce",d),document.head.appendChild(c),u)return new Promise((f,j)=>{c.addEventListener("load",f),c.addEventListener("error",()=>j(new Error(`Unable to preload CSS for ${r}`)))})}))}function b(p){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=p,window.dispatchEvent(i),!i.defaultPrevented)throw p}return h.then(p=>{for(const i of p||[])i.status==="rejected"&&b(i.reason);return n().catch(b)})},g=""+new URL("markdownrootstyle.css",import.meta.url).href,E=""+new URL("markdownstyle.css",import.meta.url).href,y={cacheviewer:{id:"cacheviewer",type:"component",load:()=>l(()=>import("./cacheviewer.js"),__vite__mapDeps([0,1]),import.meta.url),data:null,styles:[]},changelog:{id:"changelog",type:"markdown",html:'<h1 id="changelog">CHANGELOG</h1><p><em>The whole finder CHANGELOG</em></p><h2 id="newest-prob-0317">Newest prob 0.3.17</h2><ul><li>added regex support</li><li>added mcapp minecraft world dashboard</li><li>fixed buildcheck workflow</li><li>added markdown notes to the templates which can be viewed in the web UI</li><li>added command to view count of locations which where found</li><li>added option to view the cache size</li><li>updated the regex creator</li><li>fixed a bug in the argparser lib where global flag where not found in subcommands</li></ul><h3 id="commits">Commits</h3><ul><li><em><a href="https://github.com/shadowdara/finder/tree/8e6390298c29bfeb6984a7e40190cb6eaa6d3350" target="_blank" rel="noopener noreferrer">8e63902</a></em> Update frontend assets, templates & deps</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/40751f1a279c1c22be7b342ca3a7d66d86d5313b" target="_blank" rel="noopener noreferrer">40751f1</a></em> Add min_version, tags and mdnote to templates</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/2a2685670c78253e5a932583e800e0c9a2a2d960" target="_blank" rel="noopener noreferrer">2a26856</a></em> Update package-lock.json</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/0ccc718573804ae15ce455fa0b7a8769cd57e61f" target="_blank" rel="noopener noreferrer">0ccc718</a></em> Update check.py</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/0191e2303a83e2680689870dfbdd4e0209b9ca27" target="_blank" rel="noopener noreferrer">0191e23</a></em> Update finder templates to v0.3.17</li></ul><p>The diff also includes git parser cleanup and compatibility updates in the Go scanner code, plus dependency and generated site data refreshes that match the new library version.</p><ul><li><em><a href="https://github.com/shadowdara/finder/tree/86252b87e6fb905fc15e2e6c4f17203d9503f52b" target="_blank" rel="noopener noreferrer">86252b8</a></em> Add markdown notes and regex tooling</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/7927ca03ae8143c80d4c6e01acbfc4353a4b927b" target="_blank" rel="noopener noreferrer">7927ca0</a></em> Add Monaco editor and template view updates</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/8dbd64a87291179a340767c2c02ebb9e5f272d31" target="_blank" rel="noopener noreferrer">8dbd64a</a></em> Add template markdown preview</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/01c3ad7c8253b11d3b7ac5debef943106288431c" target="_blank" rel="noopener noreferrer">01c3ad7</a></em> Switch markdown notes to mdnote</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/ff90e2204ffa481e6867ccd65ef3882fd7da1926" target="_blank" rel="noopener noreferrer">ff90e22</a></em> safe</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/dc91ca10bae42f25fe89b9c4409e1c4d25a7edb2" target="_blank" rel="noopener noreferrer">dc91ca1</a></em> Move template site under npm/site</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/cd28c081e5df6f57dc5d3bbcb0db8fd7b8f3d03d" target="_blank" rel="noopener noreferrer">cd28c08</a></em> Highlight Finder template patterns</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/020dccfa1ed824fa275318fa1ebcfcf255a0a740" target="_blank" rel="noopener noreferrer">020dccf</a></em> Add prettyJson util and normalize template input</li></ul><p>Improve template input validation in npm/hub/lib/templates.ts: stricter type checks, parse-and-normalize JSON content before applying the byte-size limit, normalize/trim/lowercase tags and deduplicate them, and ensure saved content is non-null. Also apply minor formatting/TS fixes.</p><p>Co-authored-by: Copilot &lt;223556219+Copilot@users.noreply.github.com&gt;</p><ul><li><em><a href="https://github.com/shadowdara/finder/tree/18d87ce833e9aa0456ae055cae5350384f6b3511" target="_blank" rel="noopener noreferrer">18d87ce</a></em> Split user page into client component</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/2037eb7d016a3f35a5c0e1142802ef9a540a0507" target="_blank" rel="noopener noreferrer">2037eb7</a></em> Update discover-client.tsx</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/9b9216051ad862bc6d963adf41165470466c5a29" target="_blank" rel="noopener noreferrer">9b92160</a></em> safe</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/7a6b0653f161a2366c789373bcd69de66b6545a6" target="_blank" rel="noopener noreferrer">7a6b065</a></em> Update .gitignore</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/baf7ab49f2b65cde3f63e333d332bc449ecd85ad" target="_blank" rel="noopener noreferrer">baf7ab4</a></em> Update page.tsx</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/8d61c888e1526e8b8a105bf7fc737b17fe85e0be" target="_blank" rel="noopener noreferrer">8d61c88</a></em> Update export-db.js</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/b0cc24b5c4c33dadc89e23878fed1f4873fe3aae" target="_blank" rel="noopener noreferrer">b0cc24b</a></em> update</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/8d438078e9fb8a271d887a3f3ce4ad96e89ea6b8" target="_blank" rel="noopener noreferrer">8d43807</a></em> Update layout.tsx</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/bfbc0586ecbc5661ba4818c11460e4e8eaf38fb8" target="_blank" rel="noopener noreferrer">bfbc058</a></em> Update .gitignore</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/b200860739c84e3d3b7023a13daadeb4b2203d87" target="_blank" rel="noopener noreferrer">b200860</a></em> Create export-db.js</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/6cd213924831dd09879fedccbafce74def7e2a02" target="_blank" rel="noopener noreferrer">6cd2139</a></em> f</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/5fcb63f3cbfd2756fc6ed4e8fd8eb5c97b445668" target="_blank" rel="noopener noreferrer">5fcb63f</a></em> Delete next-env.d.ts</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f0cde71003874d462c8c94de10762abd472ad449" target="_blank" rel="noopener noreferrer">f0cde71</a></em> Add template highlighting and styling refresh</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/7ec7ef5f60dd446f22984a7d51674fed26c1d653" target="_blank" rel="noopener noreferrer">7ec7ef5</a></em> Add template discovery polish and templates</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/0b88cdfd3d3782e3137d974022b04763270f44c7" target="_blank" rel="noopener noreferrer">0b88cdf</a></em> Create test.env</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a6cb8aa8ba3075ee5b2d63f142dd965295783dbf" target="_blank" rel="noopener noreferrer">a6cb8aa</a></em> Update Dockerfile</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/0bf8cfdba50162eb1e01adec258b98663846a1b8" target="_blank" rel="noopener noreferrer">0bf8cfd</a></em> Add gitdb package to export Git repos</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c49e253aa17e467e375202a24fbba8edcb88d9d1" target="_blank" rel="noopener noreferrer">c49e253</a></em> Update index.html</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/9c45e9dcabaf1c1971e9e5e40ae24ab5803ca3bf" target="_blank" rel="noopener noreferrer">9c45e9d</a></em> Add Nginx dashboard service</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/d5a1c639554eeb018ec08e1054b64176121b479a" target="_blank" rel="noopener noreferrer">d5a1c63</a></em> Update index.ts</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/65133c5612cb80c7757185a160d006659f487830" target="_blank" rel="noopener noreferrer">65133c5</a></em> s</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/24a8ec293c316c0ce05df9518cdd7651913c5a7c" target="_blank" rel="noopener noreferrer">24a8ec2</a></em> Update next-env.d.ts</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/faf8f391cfb5577c55ea630e952bca91f3c64834" target="_blank" rel="noopener noreferrer">faf8f39</a></em> Update pnpm-workspace.yaml</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/3cdf75a3c4d46ad776c6243b9c08687d34f247d9" target="_blank" rel="noopener noreferrer">3cdf75a</a></em> Update pnpm-workspace.yaml</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/61ad2e9c6d3336035ae4d6edd3dd6ae21df8a134" target="_blank" rel="noopener noreferrer">61ad2e9</a></em> Update pnpm-workspace.yaml</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/032dff27052b8135a5d64f7033f57a8f804f48ee" target="_blank" rel="noopener noreferrer">032dff2</a></em> Update Dockerfile</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/3b40048630819274f3fc3b89d30fb5822857dafe" target="_blank" rel="noopener noreferrer">3b40048</a></em> Add static site and type compatibility fixes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f30d2d4380a1857bb21258330521520be5a1b6de" target="_blank" rel="noopener noreferrer">f30d2d4</a></em> added style</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f6ee93b32a41167b08bc3c5f2e1f0a9c2c5b09d4" target="_blank" rel="noopener noreferrer">f6ee93b</a></em> Update pnpm-workspace.yaml</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a9a5be5693b5757ffd60358f2722e662cd92b3f2" target="_blank" rel="noopener noreferrer">a9a5be5</a></em> Add template tags and discovery UI</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/fb4f9e7e24d0c716ac8142c34fcf41e25e18bb65" target="_blank" rel="noopener noreferrer">fb4f9e7</a></em> Update index.ts</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/141f271cf29b3d497ffbeee69cfbb2508202fee5" target="_blank" rel="noopener noreferrer">141f271</a></em> Add recovery-checksum auth flow and account APIs</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/ce65df3a1073efaefe6842cffbedcef62a8a871b" target="_blank" rel="noopener noreferrer">ce65df3</a></em> s</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/e45bbfd04806cb26a703aca14518ec4756c5790a" target="_blank" rel="noopener noreferrer">e45bbfd</a></em> Fix template site Docker build</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/dc27baab88d28fc77fe972b24e8c31eefe3e1ef1" target="_blank" rel="noopener noreferrer">dc27baa</a></em> Add local dev mailbox, auth flows, UI & Docker fix</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/13e52794817494c5b8fdebfbf4b626a7bb53f2c2" target="_blank" rel="noopener noreferrer">13e5279</a></em> updated compose</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/19a1da42ac4e2a8f2dad4d42b0a5553d89156af7" target="_blank" rel="noopener noreferrer">19a1da4</a></em> Add Docker setup for app services</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/69ad841eb06670319854b57734f0ec4a63444487" target="_blank" rel="noopener noreferrer">69ad841</a></em> added discover</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a99c32b06688154f018ed1088a99c09c9920da48" target="_blank" rel="noopener noreferrer">a99c32b</a></em> added template hub</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/8e6ec6f16122bc83b524ee9d292f94530be04076" target="_blank" rel="noopener noreferrer">8e6ec6f</a></em> added finder template lib</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a31ded08b1ca2f4cadf50b71ae2ebaa9d8af6bb0" target="_blank" rel="noopener noreferrer">a31ded0</a></em> Update backend asset stats; fix note preview closure</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c63f0ff15a172d1ab33129efa53119b1386ca127" target="_blank" rel="noopener noreferrer">c63f0ff</a></em> Delete stuffcanvas.canvas</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f79ca209dd8f0e51be27f4546ae9d724a35aefff" target="_blank" rel="noopener noreferrer">f79ca20</a></em> Update .gitattributes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/459c72f0b1afac10a5e79ebb50b8d7da705efcb9" target="_blank" rel="noopener noreferrer">459c72f</a></em> Update style.css</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/fa4eb4c4c8663d913f4435d3b62174052d1737d4" target="_blank" rel="noopener noreferrer">fa4eb4c</a></em> Update Map.md</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/aa4d6be30390e2e06c5d5b53c300f35da2e52fd7" target="_blank" rel="noopener noreferrer">aa4d6be</a></em> Add cache count and size commands</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/6629fab4a70c9a2599b94e08d1da0e5272f03144" target="_blank" rel="noopener noreferrer">6629fab</a></em> Add Markdown note support to creator</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a356afe8da62c0bfd9675f7f17c0594dfd936981" target="_blank" rel="noopener noreferrer">a356afe</a></em> Render markdown notes in template viewer</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/07b256a99a159ca695490df788cd08235641078f" target="_blank" rel="noopener noreferrer">07b256a</a></em> Add match modes and share/restore UI</li></ul><ul><li>UI: add a mode-selector (exact, startsWith, endsWith, contains), Base64 export field, copy button and restore input + feedback; update placeholders and tester hints. Styles added in regexcreator.css for selector and share/restore widgets.</li><li>Logic: regexcreator.tsx wires mode buttons, share serialization (Base64 UTF‑8), clipboard copy, restore parsing and UI feedback.</li><li>Core: src/lib/regex.ts adds MatchMode and mode option, assembles anchored/negated patterns per mode and returns the RegExp accordingly.</li></ul><p>Improves flexibility for file-extension and substring matching and allows saving/loading editor state.</p><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f9d9fe7cbc542aa1e96127baba26060920ca7b55" target="_blank" rel="noopener noreferrer">f9d9fe7</a></em> fixed a bug in the argparser lib where global flag where not found in subcommands</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a9eef48c9d0707d22662be9113010178d3b775f7" target="_blank" rel="noopener noreferrer">a9eef48</a></em> Update parse.go</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/edee477f59fa56c16db9c3fd5b65fef65234c656" target="_blank" rel="noopener noreferrer">edee477</a></em> Update main.go</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/7f99de7f20063099b3a976961981f0613a3fa4ae" target="_blank" rel="noopener noreferrer">7f99de7</a></em> Update SECURITY.md</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/85d00b4106bd9054071008e120db4da40e1592b2" target="_blank" rel="noopener noreferrer">85d00b4</a></em> Create stuffcanvas.canvas</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/d2961966d1f0ea56e9c87b836a2cb0e7d8a65a02" target="_blank" rel="noopener noreferrer">d296196</a></em> Update README.md</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/2d67a8e6aaf0ce69021701642f21176a11abf057" target="_blank" rel="noopener noreferrer">2d67a8e</a></em> add regexes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/e79e682174113a5e5fe6e7faab0292b41847cbd0" target="_blank" rel="noopener noreferrer">e79e682</a></em> Update main.tsx</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c2347c7706c5d23ed1b0f174b50f3ce6d806841f" target="_blank" rel="noopener noreferrer">c2347c7</a></em> safe site</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/3e9fc82faee789fa9f4134acfc478d5a5dd2e188" target="_blank" rel="noopener noreferrer">3e9fc82</a></em> added install maker</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/fdbd2ee7736d433457b18ebfd26a0949b560710e" target="_blank" rel="noopener noreferrer">fdbd2ee</a></em> safe</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/56538690b1ef196579264c1415ee61488319c646" target="_blank" rel="noopener noreferrer">5653869</a></em> install script creator</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/4c96c4ac2b312f7a29285ad7e87461bfdd6ba08a" target="_blank" rel="noopener noreferrer">4c96c4a</a></em> Create AGENTS.md</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/d5ffc1152cf067df216a47332b05bb54beb895cc" target="_blank" rel="noopener noreferrer">d5ffc11</a></em> Update main.go</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/f235ce411f109703b3dedc547cbacadb4aab82cf" target="_blank" rel="noopener noreferrer">f235ce4</a></em> Potential fix for code scanning alert no. 6: Arbitrary file access during archive extraction ("Zip Slip")</li><li><em><a href="https://github.com/shadowdara/finder/tree/0e98acb45da20781107245b8aa6b0900977187ae" target="_blank" rel="noopener noreferrer">0e98acb</a></em> update vite</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/2d3fad616a14a75ec1915ba8c65a0a522443babf" target="_blank" rel="noopener noreferrer">2d3fad6</a></em> rm notes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/65a4693dad5c5b67d5367430ce546921cfdfb63b" target="_blank" rel="noopener noreferrer">65a4693</a></em> fix versions</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/6a579fc80bf50b5de8f8068a9f41ecf0afd3388e" target="_blank" rel="noopener noreferrer">6a579fc</a></em> Potential fix for code scanning alert no. 5: Prototype-polluting function</li><li><em><a href="https://github.com/shadowdara/finder/tree/810b2b4f1e88aa129fa10925e2be767734d5b06a" target="_blank" rel="noopener noreferrer">810b2b4</a></em> Potential fix for code scanning alert no. 4: Prototype-polluting function</li><li><em><a href="https://github.com/shadowdara/finder/tree/f65a04f62de4f12d2bdf7a624011205fe7c7c3fb" target="_blank" rel="noopener noreferrer">f65a04f</a></em> fix permission</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/a50028e7538e696f511c08da698cdcfbc401df56" target="_blank" rel="noopener noreferrer">a50028e</a></em> safe</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/24a495cbfc6b1ebe6ef9a600b62ea34a6876964d" target="_blank" rel="noopener noreferrer">24a495c</a></em> fixed path opener</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c6c7c700d647db048179a60ee7429d670ae6b8a6" target="_blank" rel="noopener noreferrer">c6c7c70</a></em> added mc world viewer</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/5ac6ec84689974efb6c562e4ed50bef26b233921" target="_blank" rel="noopener noreferrer">5ac6ec8</a></em> adding mc server</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/bbfcd6cd038277815191b0da2b502362e4bfdb67" target="_blank" rel="noopener noreferrer">bbfcd6c</a></em> added to path</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/0701b46767a8ee1e702348c704616985e6a8f530" target="_blank" rel="noopener noreferrer">0701b46</a></em> fixed viewer site</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/be035fa6457e553560380cd102d2fee386572ea0" target="_blank" rel="noopener noreferrer">be035fa</a></em> tets</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/9609fc1f3b2126806c7fab29bb364fd086d28d9e" target="_blank" rel="noopener noreferrer">9609fc1</a></em> Update .gitattributes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/2d2177acd9c8b548d5fa0ae34a0e716cf4d8dc0d" target="_blank" rel="noopener noreferrer">2d2177a</a></em> added info to help</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/3a9ffd355b36e15b2707f4b7a098955b876cb0c9" target="_blank" rel="noopener noreferrer">3a9ffd3</a></em> Update .gitattributes</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/59a3675ce16c07410639edf1cae95c030c4f90c6" target="_blank" rel="noopener noreferrer">59a3675</a></em> added regex creator</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c5a77be5243da2728d421ce761cc75e40fd52d6c" target="_blank" rel="noopener noreferrer">c5a77be</a></em> regex</li></ul><ul><li><em><a href="https://github.com/shadowdara/finder/tree/c41219ae4b2326a88abdd3c7c15627f179b0ed4e" target="_blank" rel="noopener noreferrer">c41219a</a></em> add csf</li></ul><h2 id="0316---08092026">0.3.16 - 08.09.2026</h2><ul><li>added cache creation</li><li>added config editor</li><li>added cache viewer</li><li>Moved every site on the finder website to TSX instead</li><li>add code to the ssg plugin which runs on build time - 07.09.2026</li><li>the search function should return an array of</li><li>added size plugin for the frontend</li><li>added syntax highliting for the markdown codeblocks</li><li>updated some templates</li><li>renamed checksums file in the release from <code>SHA256SUMS</code> to <code>SHA256SUMS.txt</code></li><li>added some helpfule vite plugins</li><li>added file content checksum check</li><li>fixed that to old template warning because it showed up the finder and the template where in the same version</li><li>added SHA512 checksums</li></ul><h2 id="0315---02092025">0.3.15 - 02.09.2025</h2><ul><li>added new Templates</li><li>added a HTML Server with go backend to create and view all templates</li><li>added json output support to finder, just add <code>--json</code> to command</li><li>added tags and min version to a lot of the templates</li><li>the Templates are now saved as minified json</li></ul><h2 id="0314---25062026">0.3.14 - 25.06.2026</h2><h2 id="0313---22062026">0.3.13 - 22.06.2026</h2><h2 id="0312---22062026">0.3.12 - 22.06.2026</h2><h2 id="0311---10042026">0.3.11 - 10.04.2026</h2><h2 id="0310---10042026">0.3.10 - 10.04.2026</h2><h2 id="039---09042026">0.3.9 - 09.04.2026</h2><ul><li>fixed Binary Search</li></ul><h2 id="038---27022026">0.3.8 - 27.02.2026</h2><ul><li>added Checksums</li></ul><h2 id="037---24022026">0.3.7 - 24.02.2026</h2><ul><li>only for releasing</li></ul><h2 id="036---24022026">0.3.6 - 24.02.2026</h2><ul><li>added Size option to the Templates</li><li>updated README File</li><li>updates <code>CUSTOM_TEMPLATES</code></li><li>added a new entry to the Template: <strong>min finder version</strong> which should</li><li>added Version package</li></ul><h2 id="035---18022026">0.3.5 - 18.02.2026</h2><ul><li>made a Folder public for public finder modules</li><li>added Template for<ul><li>flax</li></ul></li><li>added Time which the searching took</li><li>resturctured the argparser</li><li>added version Command</li><li>added Argparser package</li><li>removed loading templates directly from the Console or via a custom filepath!</li><li>json output is broken in this Release, but will we fixed in future Releases</li><li>formatted the tag Search output correctly</li></ul><h2 id="034---16022026">0.3.4 - 16.02.2026</h2><ul><li>changed Go Version to 1.18</li><li>fixed <em><code>Search on all Drives on Windows</code></em> from 0.3.3, it</li><li>added Async Search</li><li>made color package public</li></ul><h2 id="033---15022026">0.3.3 - 15.02.2026</h2><ul><li>added JSON Shema</li><li>added File Options</li><li>Search on all Drives on Windows</li><li>added Tag Search</li></ul><h2 id="032---15022026">0.3.2 - 15.02.2026</h2><ul><li>little Fixes</li></ul><h2 id="031---15022026">0.3.1 - 15.02.2026</h2><h3 id="-features">✨ Features</h3><h4 id="runtime-custom-template-system">Runtime Custom Template System</h4><ul><li><strong>Custom Templates without Recompilation</strong>: Users can now create templates in <code>~/.finder/templates/</code> or <code>./.finder/templates/</code> without recompiling the program</li><li><strong>Automatic Template Discovery</strong>: New <code>.json5</code> files are automatically detected and loaded on startup</li><li><strong>User Templates Override</strong>: User-defined templates can override built-in templates with the same name</li><li><strong>Precedence System</strong>: User templates take precedence over built-in templates</li></ul><h4 id="cli-reorganization-modernization">CLI Reorganization & Modernization</h4><ul><li><strong>Modular CLI Architecture</strong>: Complete restructuring from monolithic design<ul><li><code>parser.go</code>: Dedicated argument parsing logic</li><li><code>handlers.go</code>: Isolated command handlers</li><li><code>commands.go</code>: Clean routing (reduced from 300+ to 60 lines)</li></ul></li><li><strong>Command Aliases</strong>: New shorter forms for common commands<ul><li><code>h</code>, <code>-h</code>, <code>--help</code> in addition to <code>help</code></li><li><code>ls</code> in addition to <code>list</code></li><li><code>--file</code> in addition to <code>-f</code></li><li><code>--config</code> in addition to <code>-c</code></li></ul></li><li><strong>CLIOptions Struct</strong>: Structured argument representation with predicates<ul><li><code>.IsHelp()</code>, <code>.IsList()</code>, <code>.IsCheck()</code>, <code>.IsFileLoad()</code>, <code>.IsDirectLoad()</code>, <code>.IsTemplateSearch()</code></li><li><code>.GetFileArg()</code>, <code>.GetDirectLoadArg()</code>, <code>.GetTemplateName()</code></li></ul></li><li><strong>Verbose Mode</strong>: New <code>--verbose</code> flag for extended output</li></ul><h4 id="enhanced-help-system">Enhanced Help System</h4><ul><li><strong>Better Help Structure</strong>: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS</li><li><strong>Table Layout</strong>: Improved readability with consistent formatting</li><li><strong>Custom Templates Info</strong>: Documentation for user template setup</li><li><strong>Detailed Descriptions</strong>: Each command with clear explanation</li></ul><h4 id="enhanced-list-check-commands">Enhanced List & Check Commands</h4><ul><li><strong>Separated Display</strong>: Built-in and custom templates are listed separately</li><li><strong>Template Sources</strong>: Source attribute shows whether template is built-in or custom</li><li><strong>Helpful Hints</strong>: Paths for custom template setup are displayed</li><li><strong>Improved Validation</strong>: Check command validates with source information</li></ul><h3 id="-testing">🧪 Testing</h3><ul><li><strong>40+ new unit tests</strong> for CLI parser logic</li><li><strong>Parser Tests</strong>: Comprehensive coverage for command recognition, flag parsing, argument extraction</li><li><strong>Integration Tests</strong>: End-to-end tests for command execution</li><li><strong>Routing Tests</strong>: Tests for handler mapping</li><li><strong>Error Handling Tests</strong>: Validation of error handling and user feedback</li></ul><h3 id="-documentation">📖 Documentation</h3><ul><li><strong>ARCHITECTURE.md</strong>: Detailed technical documentation of the new CLI structure</li><li><strong>REORGANIZATION.md</strong>: Comprehensive before/after comparison and explanation</li><li><strong>QUICKSTART.md</strong>: Practical guide for adding new commands</li><li><strong>CUSTOM_TEMPLATES.md</strong>: User guide for custom template creation</li><li><strong>Inline Code Comments</strong>: Improved code documentation</li></ul><h3 id="-infrastructure">🔧 Infrastructure</h3><ul><li><strong>Enhanced Template Loader</strong> (<code>templateloader.go</code>)<ul><li><code>LoadUserTemplates()</code>: Discovers user templates from filesystem</li><li><code>JSONtemplateLoaderWithUserTemplates()</code>: Intelligent loading with user override</li><li><code>LoadAllWithUserTemplates()</code>: Combined built-in + custom template discovery</li></ul></li><li><strong>Template Override Mechanism</strong>: User templates can replace built-in templates</li><li><strong>Graceful Error Handling</strong>: Missing user template directories are not fatal</li></ul><h3 id="-quality-improvements">🎯 Quality Improvements</h3><ul><li><strong>Clean Code Structure</strong>: Single Responsibility Principle consistently applied</li><li><strong>Better Testability</strong>: Each module can be tested in isolation</li><li><strong>Extensibility</strong>: New commands can be added in 5 simple steps</li><li><strong>Backward Compatibility</strong>: External API (<code>HandleCommand()</code>) unchanged</li></ul><h3 id="-user-experience">👥 User Experience</h3><ul><li><strong>Better Error Messages</strong>: Context-sensitive error messages with suggestions</li><li><strong>Helpful Hints</strong>: Tips for common tasks (e.g., where to place templates)</li><li><strong>Flexible Command Syntax</strong>: Multiple synonyms for each command</li><li><strong>Consistent Output Formatting</strong>: Unified design across all commands</li></ul><h3 id="-performance">📊 Performance</h3><ul><li><strong>No Recompilation Required</strong>: Custom templates are loaded at runtime</li><li><strong>Efficient Template Discovery</strong>: Fast filesystem traversal</li><li><strong>Minimal Overhead</strong>: Template loading has negligible performance impact</li></ul><h3 id="-bug-fixes-improvements">🐛 Bug Fixes & Improvements</h3><ul><li>Improved error handling in template loading</li><li>Better handling of missing or malformed user templates</li><li>Consistent error messages across all commands</li><li>Fixed edge cases in CLI argument parsing</li></ul><h3 id="-breaking-changes">📝 Breaking Changes</h3><ul><li><strong>No Breaking Changes</strong>: All existing commands work unchanged</li><li>Internal structure completely refactored, but public API remains stable</li></ul><h3 id="-highlights">🙏 Highlights</h3><p>This version brings the biggest improvement since 0.2.0:</p><ul><li>Users can now create their own templates</li><li>Codebase is more maintainable and extensible</li><li>Test coverage drastically improved</li></ul><hr><h2 id="030---23012026">0.3.0 - 23.01.2026</h2><p>Template System & CLI Foundations</p><h2 id="020---23012026">0.2.0 - 23.01.2026</h2><p>More Templates Better Console Output Help Message</p><h2 id="010---17112025">0.1.0 - 17.11.2025</h2><p>Programm Init</p><h2 id="000---30112025">0.0.0 - 30.11.2025</h2><p>the start</p>',styles:[g]},configeditor:{id:"configeditor",type:"component",load:()=>l(()=>import("./configeditor.js"),__vite__mapDeps([2,3]),import.meta.url),data:null,styles:[E]},creator:{id:"creator",type:"component",load:()=>l(()=>import("./creator.js"),__vite__mapDeps([4,5]),import.meta.url),data:"0.3.17",styles:[]},"docs/config":{id:"docs/config",type:"markdown",html:'<h1 id="config-fields">Config fields</h1><h2 id="port">Port</h2><p>Port for the findergen server to view and create templates.</p><h2 id="cache">Cache</h2><p>When set to true, the results of will be saved as a cache and can then be used afterwards</p><h2 id="create-cache-database">Create Cache Database</h2><p>When set to true, the cache data of finder will be saved in a Git DB. Git is required for this.</p><h2 id="finder-instances">Finder Instances</h2><p>Finder instances which will run at the same time when creating cache for all templates</p>',styles:[g]},"docs/index":{id:"docs/index",type:"markdown",html:'<h1 id="finder-docs">Finder Docs</h1><p><em>soon</em></p>',styles:[g]},home:{id:"home",type:"component",load:()=>l(()=>import("./home.js"),__vite__mapDeps([6,7]),import.meta.url),data:null,styles:[]},index:{id:"index",type:"component",load:()=>l(()=>import("./index.js"),[],import.meta.url),data:`<pre><code class="language-md"><span class="hljs-section"># AGENTS — Finder Template Authoring Guide</span>

This document is for AI assistants such as ChatGPT, Claude, Copilot,
and similar tools that need to create valid Finder templates.

Goal:

<span class="hljs-bullet">-</span> create Finder-compatible JSON5 templates
<span class="hljs-bullet">-</span> work with all supported template features
<span class="hljs-bullet">-</span> prefer valid, minimal, and robust patterns
<span class="hljs-bullet">-</span> avoid false positives and over-constrained matches

<span class="hljs-section">## 1) What Finder matches</span>

Finder scans folders on the filesystem and checks whether a directory
matches a template.

A template describes:

<span class="hljs-bullet">-</span> the directory name pattern
<span class="hljs-bullet">-</span> required or forbidden files
<span class="hljs-bullet">-</span> required or forbidden subfolders
<span class="hljs-bullet">-</span> optional file constraints like size and hash
<span class="hljs-bullet">-</span> optional command validation
<span class="hljs-bullet">-</span> tags for discovery

A template is a JSON5 file ending in <span class="hljs-code">\`.json5\`</span>.

Typical locations:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`~/.finder/templates/\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`./.finder/templates/\`</span>

The filename without <span class="hljs-code">\`.json5\`</span> becomes the template name, for example:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`my-template.json5\`</span> → <span class="hljs-code">\`my-template\`</span>

---

<span class="hljs-section">## 2) Core template schema</span>

A valid Finder template looks like this:

<span class="hljs-code">\`\`\`json5
{
  min_version: &quot;0.3.16&quot;,
  description: &quot;My custom project type&quot;,
  name: &quot;*&quot;,
  tags: [&quot;node&quot;, &quot;typescript&quot;],
  files: [
    &quot;package.json&quot;,
    {
      name: &quot;src&quot;,
      existence: &quot;optional&quot;,
    },
    {
      name: &quot;*.ts&quot;,
      existence: &quot;required&quot;,
      size: {
        min: 1,
        min_size_type: &quot;KB&quot;,
      },
    },
  ],
  folders: [
    {
      name: &quot;src&quot;,
      folders: [],
      files: [&quot;index.ts&quot;],
    },
  ],
  command: &quot;&quot;,
  invert_command: false,
  size: {
    min: 10,
    min_size_type: &quot;KB&quot;,
  },
}
\`\`\`</span>

---

<span class="hljs-section">## 3) Supported top-level fields</span>

<span class="hljs-section">### \`description\` (string)</span>

Short human-readable explanation.

<span class="hljs-code">\`\`\`json5
&quot;description&quot;: &quot;Python service with pyproject.toml&quot;
\`\`\`</span>

<span class="hljs-section">### \`name\` (string)</span>

Pattern for the directory name.

Use:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;*&quot;\`</span> for any folder name
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;my-app&quot;\`</span> for exact name
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;project-*&quot;\`</span> for glob wildcard matching
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;^project-[0-9]+$&quot;\`</span> for regex matching

Important:

<span class="hljs-bullet">-</span> Matching is exact-first, then regex, then glob fallback (see
  the &quot;Pattern matching&quot; section below).
<span class="hljs-bullet">-</span> If you want to match all folders, prefer <span class="hljs-code">\`&quot;*&quot;\`</span>.

<span class="hljs-section">### \`files\` (array)</span>

Defines required/optional files.

Can be either:

<span class="hljs-bullet">-</span> old style: string array
<span class="hljs-bullet">-</span> modern style: objects with metadata

Examples:

<span class="hljs-code">\`\`\`json5
&quot;files&quot;: [
  &quot;package.json&quot;,
  &quot;README.md&quot;
]
\`\`\`</span>

<span class="hljs-code">\`\`\`json5
&quot;files&quot;: [
  {
    &quot;name&quot;: &quot;*.go&quot;,
    &quot;existence&quot;: &quot;required&quot;
  },
  {
    &quot;name&quot;: &quot;go.mod&quot;,
    &quot;existence&quot;: &quot;required&quot;
  },
  {
    &quot;name&quot;: &quot;*.dll&quot;,
    &quot;existence&quot;: &quot;forbidden&quot;
  }
]
\`\`\`</span>

<span class="hljs-section">### \`existence\` values</span>

<span class="hljs-bullet">-</span> <span class="hljs-code">\`required\`</span> (default): file must exist
<span class="hljs-bullet">-</span> <span class="hljs-code">\`forbidden\`</span>: file must not exist
<span class="hljs-bullet">-</span> <span class="hljs-code">\`optional\`</span>: exists is okay, but not required

Examples:

<span class="hljs-code">\`\`\`json5
{
  name: &quot;.git&quot;,
  existence: &quot;required&quot;,
}
\`\`\`</span>

<span class="hljs-code">\`\`\`json5
{
  name: &quot;*.env&quot;,
  existence: &quot;forbidden&quot;,
}
\`\`\`</span>

<span class="hljs-section">### \`size\` (file or folder size constraint)</span>

Used under a file object or as a folder-level rule.

<span class="hljs-code">\`\`\`json5
&quot;size&quot;: {
  &quot;min&quot;: 1,
  &quot;min_size_type&quot;: &quot;KB&quot;,
  &quot;max&quot;: 500,
  &quot;max_size_type&quot;: &quot;MB&quot;
}
\`\`\`</span>

Valid size types:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`B\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`KB\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`MB\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`GB\`</span>

For file-level checking:

<span class="hljs-bullet">-</span> file must exist
<span class="hljs-bullet">-</span> file size must satisfy the condition

For folder-level checking:

<span class="hljs-bullet">-</span> total directory size is checked recursively

<span class="hljs-section">### \`checksums\` (hash-based validation)</span>

You can require exact SHA256 or SHA512 for matching files.

<span class="hljs-code">\`\`\`json5
{
  name: &quot;*.zip&quot;,
  checksums: {
    sha256: &quot;abc123...&quot;,
    sha512: &quot;def456...&quot;,
  },
}
\`\`\`</span>

Rules:

<span class="hljs-bullet">-</span> both hashes are optional
<span class="hljs-bullet">-</span> if SHA256 is provided, it must match exactly
<span class="hljs-bullet">-</span> if SHA512 is provided, it must match exactly
<span class="hljs-bullet">-</span> hash letters are compared case-insensitive

<span class="hljs-section">### \`folders\` (nested directory patterns)</span>

Used to require subfolders.

<span class="hljs-code">\`\`\`json5
&quot;folders&quot;: [
  {
    &quot;name&quot;: &quot;.git&quot;
  },
  {
    &quot;name&quot;: &quot;src&quot;,
    &quot;folders&quot;: [
      {
        &quot;name&quot;: &quot;components&quot;
      }
    ]
  }
]
\`\`\`</span>

The nested <span class="hljs-code">\`Folder\`</span> object supports the same shape recursively.

<span class="hljs-section">### \`command\` (string)</span>

Executes a shell command inside the found directory after matching.

<span class="hljs-code">\`\`\`json5
&quot;command&quot;: &quot;git status --porcelain&quot;
\`\`\`</span>

Behavior:

<span class="hljs-bullet">-</span> empty string means no command check
<span class="hljs-bullet">-</span> command success is evaluated according to exit code

<span class="hljs-section">### \`invert<span class="hljs-emphasis">_command\` (bool)

Controls logic of command result.

\`\`\`json5
&quot;invert_</span>command&quot;: false</span>
<span class="hljs-code">\`\`\`

Meaning:

- \`false\` → command must return success (typically exit code 0)
- \`true\` → command must return failure (typically exit code != 0)

### \`tags\` (array of strings)

Category labels for browsing or filtering by tag.

\`\`\`</span>json5
&quot;tags&quot;: [&quot;git&quot;, &quot;repo&quot;, &quot;vcs&quot;]
<span class="hljs-code">\`\`\`

### \`min_version\` (string)

Minimum finder version compatibility.

\`\`\`</span>json5
&quot;min<span class="hljs-emphasis">_version&quot;: &quot;0.3.16&quot;
\`\`\`

### \`mdnote\` (string)

Optional Markdown note attached to a template. It is rendered in the
web UI (template viewer / creator) as rich text and is ignored during
matching. Since 0.3.17.

\`\`\`json5
&quot;mdnote&quot;: &quot;# My template\\n\\nSome <span class="hljs-strong">**markdown**</span> explaining what this matches.&quot;
\`\`\`

Note: the value is normally stored percent-encoded (like
\`encodeURIComponent\`) when generated by the web creator — newlines
become \`%0A\` — but any plain Markdown string is valid and supported.

---

## 3.5) Pattern matching: regex, glob, and exact

Every name pattern in a template — the top-level \`name\`, every file
\`name\`, and every folder \`name\` (including nested folders) — is
resolved by the same matching function:

\`\`\`go
if pattern == name {
    return true           // 1) exact string match
}
if ok, err := regexp.MatchString(pattern, name); err == nil {
    return ok             // 2) full Go regex
}
ok, err := path.Match(pattern, name)
return err == nil &amp;&amp; ok   // 3) glob fallback
\`\`\`

This creates a 3-tier matching strategy:

| Priority | Method                          | Applies when                               |
| -------- | ------------------------------- | ------------------------------------------ |
| 1        | exact string equality           | pattern equals the name verbatim           |
| 2        | Go regex (\`regexp.MatchString\`) | pattern is a valid regular expression      |
| 3        | glob (\`path.Match\`)             | pattern is not a valid regex (e.g. \`*.ts\`) |

### How to choose a pattern

Because regex is attempted before glob, the same character can mean
different things depending on the pattern:

- \`&quot;*.go&quot;\` is not a valid regex, so it is treated as a glob and
  matches any file ending in \`.go\`.
- \`&quot;^main\\.py$&quot;\` is a valid regex (anchored, no wildcard ambiguity),
  so it matches exactly one name.
- \`&quot;project-*&quot;\` is not a valid regex, so it is treated as a glob.

### Go regex syntax (priority 2)

Patterns that compile as a Go regular expression match with full regex
semantics against the entire entry name. Refer to Go&#x27;s
\`regexp/syntax\` (RE2) for the full language. Useful constructs:

- anchors: \`^...$\`
- character classes: \`[0-9]\`, \`[a-zA-Z]\`, \`[^...]\`
- predefined classes: \`\\d\`, \`\\w\`, \`\\s\` (and uppercase negations)
- quantifiers: \`*\`, \`+\`, \`?\`, \`{m,n}\`
- alternation: \`(a|b)\`
- groups: \`(abc)\`, non-capturing \`(?:abc)\`
- escapes: \`\\.\`, \`\\\\\`

Examples:

\`\`\`json5
// folder names like project-123, project-42 ...
{ name: &quot;^project-[0-9]+$&quot; }
\`\`\`

\`\`\`json5
// python entry files: main.py, app.py, ...
{
  name: &quot;^(main|app|server)\\\\.py$&quot;,
  existence: &quot;required&quot;,
}
\`\`\`

Note: Go regex is RE2 — no backreferences and no lookahead/lookbehind.
If your pattern uses those, it fails to compile and falls back to glob.

### Glob syntax (priority 3 fallback)

When a pattern is not a valid regex, it is treated as a glob via Go&#x27;s
\`path.Match\`:

- \`*\` matches any sequence of non-\`/\` characters
- \`?\` matches any single non-\`/\` character
- \`[abc]\` matches one character from the class
- \`[^abc]\` / \`[!abc]\` matches one character not in the class
- \`\\x\` escapes the next character

There is no recursive \`<span class="hljs-strong">**\` (doublestar) support — \`**</span>\` does not
descend into subdirectories.

Examples:

\`\`\`json5
&quot;name&quot;: &quot;*.ts&quot;,
\`\`\`

\`\`\`json5
&quot;name&quot;: &quot;file?.txt&quot;,
\`\`\`

\`\`\`json5
&quot;name&quot;: &quot;[abc].go&quot;,
\`\`\`

### Where these patterns apply

- top-level \`name\` → the scanned directory name
- \`files[].name\` → file names inside the directory
- \`folders[].name\` → subfolder names (recursively for nested folders)

Regex patterns work in all of these places. Exact glob patterns like
\`&quot;src&quot;\` or \`&quot;package.json&quot;\` work exactly as before.

### Compatibility note

Regex support was added in finder 0.3.17. If your template relies on
regex patterns, set:

\`\`\`json5
&quot;min_</span>version&quot;: &quot;0.3.17&quot;
<span class="hljs-code">\`\`\`

Templates for older finder versions should keep using glob or exact
patterns only.

---

## 4) Matching semantics

A directory is considered a match only if all required conditions are
satisfied.

This includes:

- \`name\` matches the folder name
- required files exist
- forbidden files do not exist
- required subfolders exist
- size constraints pass
- checksum constraints pass
- command condition passes

If any required rule fails, the directory is rejected.

---

## 5) Good patterns for template design

### Prefer broad matching first

Good default:

\`\`\`</span>json5
{
  name: &quot;<span class="hljs-emphasis">*&quot;,
  files: [&quot;package.json&quot;, &quot;tsconfig.json&quot;],
}
\`\`\`

Bad:

\`\`\`json5
{
  name: &quot;my-app&quot;,
  files: [&quot;package.json&quot;],
}
\`\`\`

The second version is overly restrictive and will miss most valid
project folders.

### Require the smallest useful signal

For example, a Go project should usually require:

- \`go.mod\`
- one or more \`*</span>.go\` files

Not a huge list of optional files.

<span class="hljs-section">### Avoid false positives</span>

If your project has a <span class="hljs-code">\`README.md\`</span> in many folders, do not require it
unless it is central to your pattern.

<span class="hljs-section">### Use wildcards and regex carefully</span>

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;*.git&quot; // if you intended a hidden git folder, this is special-case logic
\`\`\`</span>

Use patterns like <span class="hljs-code">\`&quot;*&quot;\`</span>, <span class="hljs-code">\`&quot;src&quot;\`</span>, <span class="hljs-code">\`&quot;*.ts&quot;\`</span>, <span class="hljs-code">\`&quot;package.json&quot;\`</span> rather
than complex regex-style expressions when a simple glob suffices.

When you do need regex (e.g. matching <span class="hljs-code">\`project-123\`</span> with
<span class="hljs-code">\`^project-[0-9]+$\`</span>), anchor with <span class="hljs-code">\`^\`</span> and <span class="hljs-code">\`$\`</span> to avoid unintended
matches.

---

<span class="hljs-section">## 6) Examples</span>

<span class="hljs-section">### Example A: Git repository</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Git repository root&quot;,
  name: &quot;*&quot;,
  folders: [
    {
      name: &quot;.git&quot;,
    },
  ],
  tags: [&quot;git&quot;, &quot;repo&quot;],
}
\`\`\`</span>

<span class="hljs-section">### Example B: Node project</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Node.js project&quot;,
  name: &quot;*&quot;,
  files: [&quot;package.json&quot;, &quot;src&quot;, &quot;README.md&quot;],
  tags: [&quot;node&quot;, &quot;javascript&quot;, &quot;typescript&quot;],
}
\`\`\`</span>

<span class="hljs-section">### Example C: Python project</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Python project with pyproject.toml&quot;,
  name: &quot;*&quot;,
  files: [
    &quot;pyproject.toml&quot;,
    {
      name: &quot;*.py&quot;,
      existence: &quot;required&quot;,
    },
  ],
  tags: [&quot;python&quot;, &quot;project&quot;],
}
\`\`\`</span>

<span class="hljs-section">### Example D: strict checksum template</span>

<span class="hljs-code">\`\`\`json5
{
  name: &quot;*&quot;,
  description: &quot;test for checksums&quot;,
  files: [
    {
      name: &quot;*&quot;,
      checksums: {
        sha256: &quot;26be688daf71f2c8e64eecfa7fdf7d1f3649b6aae80dbb686ec3a9beb9def05b&quot;,
      },
    },
  ],
  min_version: &quot;0.3.16&quot;,
}
\`\`\`</span>

This matches only folders containing a file whose SHA256 matches
exactly.

<span class="hljs-section">### Example E: custom monorepo</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Monorepo with apps and packages&quot;,
  name: &quot;*&quot;,
  files: [&quot;pnpm-workspace.yaml&quot;, &quot;package.json&quot;],
  folders: [
    {
      name: &quot;apps&quot;,
      folders: [
        {
          name: &quot;*&quot;,
          files: [&quot;package.json&quot;],
        },
      ],
    },
    {
      name: &quot;packages&quot;,
      folders: [
        {
          name: &quot;*&quot;,
          files: [&quot;package.json&quot;],
        },
      ],
    },
  ],
  tags: [&quot;monorepo&quot;, &quot;workspace&quot;],
}
\`\`\`</span>

<span class="hljs-section">### Example F: regex-matched folder name</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Numbered project folder&quot;,
  name: &quot;^project-[0-9]+$&quot;,
  files: [
    {
      name: &quot;^(main|app)\\\\.py$&quot;,
      existence: &quot;required&quot;,
    },
  ],
  tags: [&quot;python&quot;, &quot;numbered&quot;],
  min_version: &quot;0.3.17&quot;,
}
\`\`\`</span>

This matches folders like <span class="hljs-code">\`project-123\`</span> or <span class="hljs-code">\`project-42\`</span> and requires
exactly one of <span class="hljs-code">\`main.py\`</span> or <span class="hljs-code">\`app.py\`</span> to be present. The name uses a
Go regex (RE2) — note the escaped dots <span class="hljs-code">\`\\\\.\`</span> and anchors <span class="hljs-code">\`^...$\`</span>.

<span class="hljs-section">### Example G: regex file pattern with glob fallback</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;JavaScript project with strict entry points&quot;,
  name: &quot;*&quot;,
  files: [
    &quot;package.json&quot;,
    {
      name: &quot;^(index|main|app)\\\\.(js|ts|jsx|tsx)$&quot;,
      existence: &quot;required&quot;,
    },
    {
      name: &quot;\\\\.env$&quot;,
      existence: &quot;forbidden&quot;,
    },
  ],
  tags: [&quot;javascript&quot;, &quot;strict&quot;],
  min_version: &quot;0.3.17&quot;,
}
\`\`\`</span>

This requires one of <span class="hljs-code">\`index.js\`</span>, <span class="hljs-code">\`main.js\`</span>, <span class="hljs-code">\`app.js\`</span>, <span class="hljs-code">\`index.ts\`</span>, etc.
and forbids any file ending in <span class="hljs-code">\`.env\`</span>. Note that <span class="hljs-code">\`&quot;*.env&quot;\`</span> would also
work as a glob — the regex version is more explicit.

---

<span class="hljs-section">## 7) Rules for AI-generated Finder templates</span>

When generating a Finder template, the assistant should follow this
checklist:

<span class="hljs-bullet">1.</span> Create a valid <span class="hljs-code">\`.json5\`</span> file.
<span class="hljs-bullet">2.</span> Use <span class="hljs-code">\`name: &quot;*&quot;\`</span> unless the directory name is intentionally constrained.
<span class="hljs-bullet">3.</span> Keep required files minimal and specific.
<span class="hljs-bullet">4.</span> Prefer <span class="hljs-code">\`required\`</span> over broad file matching if a file is essential.
<span class="hljs-bullet">5.</span> Use <span class="hljs-code">\`forbidden\`</span> only for truly disqualifying files.
<span class="hljs-bullet">6.</span> Use <span class="hljs-code">\`size\`</span> only when it genuinely distinguishes the target project type.
<span class="hljs-bullet">7.</span> Use <span class="hljs-code">\`checksums\`</span> only when exact file identity is important.
<span class="hljs-bullet">8.</span> Add <span class="hljs-code">\`tags\`</span> for discoverability.
<span class="hljs-bullet">9.</span> Keep <span class="hljs-code">\`description\`</span> clear and concise.
<span class="hljs-bullet">10.</span> Prefer a deliberately narrow but realistic match over a very broad guess.
<span class="hljs-bullet">11.</span> Validate with the project command before claiming success.

---

<span class="hljs-section">## 8) Validation commands</span>

After writing a template, validate it with one of these project commands:

<span class="hljs-code">\`\`\`bash
./finder check
\`\`\`</span>

Or test a specific template:

<span class="hljs-code">\`\`\`bash
./finder my-template-name
\`\`\`</span>

If a template exists in the custom template folder, it will be loaded
automatically.

---

<span class="hljs-section">## 9) Common mistakes</span>

<span class="hljs-section">### Mistake 1: too strict \`name\`</span>

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;root&quot;
\`\`\`</span>

This will match almost nothing unless the folder is literally named <span class="hljs-code">\`root\`</span>.

Use:

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;*&quot;
\`\`\`</span>

unless you intentionally want a fixed directory name.

<span class="hljs-section">### Mistake 2: requiring too many files</span>

Large project templates often become unreliable if they require too
many files.

Prefer the smallest signal that distinguishes the project type.

<span class="hljs-section">### Mistake 3: mixing regex and glob syntax unintentionally</span>

Finder tries regex first, then falls back to glob. This is usually
fine, but remember that a pattern that looks like a regex is treated
as a regex:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;*.ts&quot;\`</span> is invalid regex → glob, matches any <span class="hljs-code">\`.ts\`</span> file
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;^main\\\\.py$&quot;\`</span> is valid regex → only matches exactly <span class="hljs-code">\`main.py\`</span>

Use:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`*.ts\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`package.json\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`src\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`^project-[0-9]+$\`</span> (regex, only when you need it)

Do not write patterns that accidentally compile as a regex and change
meaning. If in doubt, prefer glob or exact names.

<span class="hljs-section">### Mistake 4: forgetting the \`.json5\` extension</span>

The file must end in <span class="hljs-code">\`.json5\`</span>.

<span class="hljs-section">### Mistake 5: writing invalid JSON5</span>

Remember:

<span class="hljs-bullet">-</span> trailing commas may be allowed depending on parser handling
<span class="hljs-bullet">-</span> keep object structure valid
<span class="hljs-bullet">-</span> avoid broken braces and trailing commas in awkward spots

<span class="hljs-section">### Mistake 6: requiring impossible signals</span>

For example, requiring a project-specific file that is generated only
in CI or only in a subset of repositories will make your template
unreliable.

---

<span class="hljs-section">## 10) Recommended prompt pattern for AI generation</span>

Use this when asking an AI to generate a Finder template:

<span class="hljs-code">\`\`\`text
Create a Finder template as a JSON5 file for &lt;project type&gt;.
Use a custom template file in ~/.finder/templates/ or ./.finder/templates/.
Requirements:
- match folders with name &quot;*&quot; unless a narrower pattern is necessary
- require the smallest set of meaningful files/folders
- include tags and a clear description
- allow optional files if needed
- do not use overly strict name filters
- ensure the structure is valid Finder JSON5
- include examples of required files and nested folders if relevant
- add a realistic command check only when needed
- keep the template robust and not prone to false positives
\`\`\`</span>

---

<span class="hljs-section">## 11) Final rule</span>

A good Finder template should be:

<span class="hljs-bullet">-</span> valid JSON5
<span class="hljs-bullet">-</span> minimal but discriminative
<span class="hljs-bullet">-</span> not too broad
<span class="hljs-bullet">-</span> not too narrow
<span class="hljs-bullet">-</span> easy to debug
<span class="hljs-bullet">-</span> easy to maintain

If you are unsure, prefer a simple template with the most reliable
markers:

<span class="hljs-bullet">-</span> folder names
<span class="hljs-bullet">-</span> known files
<span class="hljs-bullet">-</span> known subfolders
<span class="hljs-bullet">-</span> one or two strong signs of the project type

---

<span class="hljs-section">## 12) One minimal example to copy</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;Simple project template&quot;,
  name: &quot;*&quot;,
  files: [
    &quot;package.json&quot;,
    {
      name: &quot;src&quot;,
      existence: &quot;optional&quot;,
    },
  ],
  tags: [&quot;project&quot;],
}
\`\`\`</span>

This is intentionally simple and often a good starting point for custom
templates.

---

<span class="hljs-section">## 13) When writing a new template for this repo</span>

If the task is to add a template to this project, keep in mind:

<span class="hljs-bullet">-</span> put it in the template directory used by the runtime
<span class="hljs-bullet">-</span> follow the repo’s JSON5 style closely
<span class="hljs-bullet">-</span> avoid accidental false positives
<span class="hljs-bullet">-</span> validate with finder checks after creation

This repo has built-in examples in the templates folder and the project
docs in the root files.
</code></pre>`,styles:[g]},"mcapp/about":{id:"mcapp/about",type:"component",load:()=>l(()=>import("./about.js"),__vite__mapDeps([8,9,10]),import.meta.url),data:null,styles:[]},"mcapp/index":{id:"mcapp/index",type:"component",load:()=>l(()=>import("./index2.js"),__vite__mapDeps([11,9,10]),import.meta.url),data:null,styles:[]},"mcapp/info":{id:"mcapp/info",type:"component",load:()=>l(()=>import("./info.js"),__vite__mapDeps([12,9,10]),import.meta.url),data:null,styles:[]},"mcapp/worlds":{id:"mcapp/worlds",type:"component",load:()=>l(()=>import("./worlds.js"),__vite__mapDeps([13,9,10]),import.meta.url),data:null,styles:[]},readme:{id:"readme",type:"markdown",html:`<h1 id="finder">finder</h1><p><a href="https://github.com/ShadowDara/finder/actions/workflows/release.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/release.yml/badge.svg" alt="Build Status"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml/badge.svg" alt="Build Check"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml/badge.svg" alt="Deploy GitHub Pages"></a><a href="https://github.com/shadowdara/finder/graphs/contributors" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/contributors/shadowdara/finder" alt="GitHub contributors"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/commit-activity/m/shadowdara/finder" alt="GitHub commit activity (branch)"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/last-commit/shadowdara/finder" alt="Last Commit"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/downloads/shadowdara/finder/total?logo=github" alt="GitHub all releases"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/v/release/shadowdara/finder?logo=github" alt="GitHub release (with filter)"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/languages/code-size/shadowdara/finder?logo=github" alt="GitHub code size in bytes"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/repo-size/shadowdara/finder?logo=github" alt="GitHub repo size"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/lang-count/shadowdara/finder" alt="Lang Count"></a><img src="https://img.shields.io/github/stars/shadowdara/finder" alt="GitHub Repo stars"> <img src="https://img.shields.io/github/forks/shadowdara/finder" alt="GitHub forks"> <img src="https://badges.ws/maintenance/yes/2026" alt="Maintained"> <img src="https://badges.ws/handmade" alt="Handmade"> <a href="https://pkg.go.dev/github.com/shadowdara/finder" target="_blank" rel="noopener noreferrer"><img src="https://pkg.go.dev/badge/github.com/shadowdara/finder" alt="Go Reference"></a></p><p>Finder is a lightweight command-line tool written in Go to locate projects and files based on predefined folder/file structure templates. It ships with <strong>370+ built-in templates</strong> covering a huge range of technologies, frameworks, and services — and you can add your own without recompiling.</p><blockquote><p><strong>Current version: 0.3.17</strong></p></blockquote><h2 id="features">Features</h2><ul><li><strong>Template-based search</strong> — find projects by folder/file structure</li><li><strong>Custom templates</strong> — drop <code>.json5</code> files into</li><li><strong>Regex support</strong> — use regular expressions in template patterns</li><li><strong>Async search</strong> — searches all drives (Windows) or root <code>/</code></li><li><strong>Caching</strong> — create and reuse a cache for significantly faster</li><li><strong>JSON output</strong> — pipe results into other tools with <code>--json</code>.</li><li><strong>Tag search</strong> — browse templates by tag (<code>-t<tag></tag></code>).</li><li><strong>Binary search</strong> — find executables in your <code>$PATH</code> (<code>-b</code>).</li><li><strong>File size & checksum validation</strong> — templates can require</li><li><strong>Command validation</strong> — templates can run a shell command after</li><li><strong>Web UI (<code>findergen</code>)</strong> — a built-in HTTP server for browsing,</li><li><strong>Cross-platform</strong> — works on Windows, Linux, and macOS.</li></ul><h2 id="requirements">Requirements</h2><ul><li>Go 1.18 or newer</li></ul><h2 id="binaries">Binaries</h2><p>The repository contains several binaries:</p><table><thead><tr><th>Binary</th><th>Description</th></tr></thead><tbody><tr><td><code>finder</code></td><td>Main CLI — search for projects and files using templates</td></tr><tr><td><code>findergen</code></td><td>HTTP server & web UI for template management, cache viewer, config editor</td></tr><tr><td><code>csf</code></td><td>Build helper — compile scripts, <code>go install</code> with CGO, git repo pack/restore</td></tr><tr><td><code>tester</code></td><td>Template test tool — validates template files</td></tr></tbody></table><h2 id="installation">Installation</h2><h3 id="build-from-source">Build from source</h3><pre><code class="language-sh">go build ./cmd/finder</code></pre><p>Or install directly (Go 1.18+):</p><pre><code class="language-sh">go install github.com/shadowdara/finder/cmd/finder@latest</code></pre><p>The produced binary is <code>finder</code> (on Windows <code>finder.exe</code>).</p><h3 id="build-all-binaries">Build all binaries</h3><pre><code class="language-sh"><span class="hljs-comment"># Windows</span>
build.bat

<span class="hljs-comment"># Linux / macOS</span>
go build ./cmd/finder
go build ./cmd/findergen
go build ./cmd/tester</code></pre><p>Or using <code>make</code>:</p><pre><code class="language-sh">make          <span class="hljs-comment"># debug build</span>
make release  <span class="hljs-comment"># release build with stripped symbols</span>
make install  <span class="hljs-comment"># build release + copy to /usr/local/bin</span></code></pre><h2 id="usage">Usage</h2><h3 id="basic-search">Basic search</h3><pre><code class="language-sh">finder &lt;template-name&gt;</code></pre><p>Find Git repositories:</p><pre><code class="language-sh">finder git</code></pre><h3 id="commands">Commands</h3><table><thead><tr><th>Command</th><th>Aliases</th><th>Description</th></tr></thead><tbody><tr><td><code>finder<template></template></code></td><td></td><td>Search for projects matching a template</td></tr><tr><td><code>finder check</code></td><td></td><td>Validate all built-in and custom templates</td></tr><tr><td><code>finder list</code></td><td><code>ls</code></td><td>List all available templates</td></tr><tr><td><code>finder tags</code></td><td><code>tag</code></td><td>Show all tags in the console</td></tr><tr><td><code>finder -t<tag></tag></code></td><td></td><td>Search for templates by tag</td></tr><tr><td><code>finder -b</code></td><td></td><td>Search for executables in your <code>$PATH</code></td></tr><tr><td><code>finder cp</code></td><td></td><td>Print the path to the global config file</td></tr><tr><td><code>finder version</code></td><td><code>-v</code>, <code>v</code></td><td>Print the current version</td></tr><tr><td><code>finder template<name></name></code></td><td><code>tpl</code></td><td>Search using an explicit template name</td></tr></tbody></table><h3 id="global-flags">Global flags</h3><table><thead><tr><th>Flag</th><th>Aliases</th><th>Description</th></tr></thead><tbody><tr><td><code>--json</code></td><td><code>-j</code></td><td>Output results as JSON</td></tr><tr><td><code>--verbose</code></td><td><code>-vv</code></td><td>Enable verbose output</td></tr></tbody></table><h3 id="cache-flags">Cache flags</h3><table><thead><tr><th>Flag</th><th>Aliases</th><th>Description</th></tr></thead><tbody><tr><td><code>--cache</code></td><td><code>-c</code></td><td>Use the existing cache instead of searching</td></tr><tr><td><code>--create-cache</code></td><td><code>-cc</code></td><td>Create a new cache</td></tr><tr><td><code>--create-cache-db</code></td><td><code>-ccd</code></td><td>Create a Git database from cache data</td></tr></tbody></table><h3 id="example">Example</h3><pre><code class="language-sh"><span class="hljs-comment"># Find all React projects</span>
finder react

<span class="hljs-comment"># Find with JSON output</span>
finder --json react

<span class="hljs-comment"># Create a cache for faster repeat searches</span>
finder --create-cache git

<span class="hljs-comment"># Use the cache</span>
finder --cache git

<span class="hljs-comment"># Find templates tagged with &quot;python&quot;</span>
finder -t python

<span class="hljs-comment"># List all templates</span>
finder list</code></pre><h2 id="templates">Templates</h2><h3 id="built-in-templates">Built-in templates</h3><p>370+ templates are shipped in <code>templates/</code> and compiled into <code>internal/templates/</code>. They cover frameworks, languages, databases, CI/CD systems, cloud services, AI/ML tools, and much more.</p><h3 id="template-format">Template format</h3><p>Templates are JSON5 files. A minimal template:</p><pre><code class="language-json5"><span class="hljs-punctuation">{</span>
  name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;*&quot;</span><span class="hljs-punctuation">,</span>
  folders<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-punctuation">{</span> name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;.git&quot;</span> <span class="hljs-punctuation">}</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
<span class="hljs-punctuation">}</span></code></pre><p>A full template with all supported fields:</p><pre><code class="language-json5"><span class="hljs-punctuation">{</span>
  min_version<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;0.3.6&quot;</span><span class="hljs-punctuation">,</span>
  description<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;My Custom Project Type&quot;</span><span class="hljs-punctuation">,</span>
  name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;*&quot;</span><span class="hljs-punctuation">,</span>
  tags<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-string">&quot;node&quot;</span><span class="hljs-punctuation">,</span> <span class="hljs-string">&quot;typescript&quot;</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  folders<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;src&quot;</span><span class="hljs-punctuation">,</span>
      folders<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
      files<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-string">&quot;index.ts&quot;</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
  <span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  files<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-string">&quot;package.json&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">{</span>
      name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;*.ts&quot;</span><span class="hljs-punctuation">,</span>
      existence<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;required&quot;</span><span class="hljs-punctuation">,</span>
      size<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        min<span class="hljs-punctuation">:</span> <span class="hljs-number">1</span><span class="hljs-punctuation">,</span>
        min_size_type<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;KB&quot;</span><span class="hljs-punctuation">,</span>
      <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
  <span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  command<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;&quot;</span><span class="hljs-punctuation">,</span>
  invert_command<span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">false</span></span><span class="hljs-punctuation">,</span>
  size<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    min<span class="hljs-punctuation">:</span> <span class="hljs-number">10</span><span class="hljs-punctuation">,</span>
    min_size_type<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;KB&quot;</span><span class="hljs-punctuation">,</span>
  <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
<span class="hljs-punctuation">}</span></code></pre><h3 id="custom-templates">Custom templates</h3><p>Place your own <code>.json5</code> template files in:</p><table><thead><tr><th>OS</th><th>Path</th></tr></thead><tbody><tr><td>Windows</td><td>\`%USERPROFILE%\\.finder\\templates\`</td></tr><tr><td>Linux</td><td><code>~/.finder/templates/</code></td></tr><tr><td>macOS</td><td><code>~/.finder/templates/</code></td></tr></tbody></table><p>Or in the project-local directory:</p><pre><code>./.finder/templates/</code></pre><p>User templates take precedence over built-in templates with the same name. See <a href="CUSTOM_TEMPLATES.md">\`CUSTOM_TEMPLATES.md\`</a> for the full guide.</p><h3 id="pattern-matching-exact-regex-glob">Pattern matching (exact, regex, glob)</h3><p>Since <strong>v0.3.17</strong>, every name pattern in a template — the top-level <code>name</code>, every file <code>name</code>, and every folder <code>name</code> (including nested folders) — is resolved by a <strong>3-tier matching strategy</strong>:</p><table><thead><tr><th>Priority</th><th>Method</th><th>Applies when</th></tr></thead><tbody><tr><td>1</td><td>Exact string equality</td><td>pattern equals the name verbatim</td></tr><tr><td>2</td><td>Go regex (<code>regexp.MatchString</code>)</td><td>pattern compiles as a valid regex (RE2)</td></tr><tr><td>3</td><td>Glob (<code>path.Match</code>)</td><td>pattern is not a valid regex (e.g. <code>*.ts</code>)</td></tr></tbody></table><p>This means:</p><ul><li><code>&quot;src&quot;</code> → exact match</li><li><code>&quot;^project-[0-9]+$&quot;</code> → valid regex, matches <code>project-123</code>, <code>project-42</code>, …</li><li><code>&quot;*.ts&quot;</code> → not a valid regex → glob fallback, matches any <code>.ts</code> file</li><li><code>&quot;^(main|app|server)\\.py$&quot;</code> → valid regex, matches exactly <code>main.py</code>,</li></ul><p>Regex patterns work in <strong>all</strong> name fields:</p><pre><code class="language-json5"><span class="hljs-comment">// top-level name: match folder names like project-42, project-99</span>
<span class="hljs-punctuation">{</span>
  name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;^project-[0-9]+$&quot;</span><span class="hljs-punctuation">,</span>
  min_version<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;0.3.17&quot;</span><span class="hljs-punctuation">,</span>
  files<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-comment">// file name: match exactly main.py, app.py, or server.py</span>
      name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;^(main|app|server)\\\\.py$&quot;</span><span class="hljs-punctuation">,</span>
      existence<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;required&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
  <span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  folders<span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span>
    <span class="hljs-punctuation">{</span>
      <span class="hljs-comment">// folder name: match src, lib, or pkg</span>
      name<span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;^(src|lib|pkg)$&quot;</span><span class="hljs-punctuation">,</span>
    <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
  <span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
<span class="hljs-punctuation">}</span></code></pre><blockquote><p><strong>Note:</strong> Go regex is RE2 — no backreferences and no lookahead/lookbehind. If your pattern uses unsupported syntax, it fails to compile and falls back to glob matching.</p></blockquote><p>If your template relies on regex patterns, set <code>&quot;min_version&quot;: &quot;0.3.17&quot;</code> to indicate the minimum Finder version required.</p><h2 id="config">Config</h2><p>Since <strong>v0.3.15</strong>, finder has a global config file at <code>~/.finder/config.json5</code>. If the file does not exist, defaults are used:</p><pre><code class="language-json5"><span class="hljs-punctuation">{</span>
  port<span class="hljs-punctuation">:</span> <span class="hljs-number">8080</span><span class="hljs-punctuation">,</span>
  cache<span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">false</span></span><span class="hljs-punctuation">,</span>
  create_cache_db<span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">false</span></span><span class="hljs-punctuation">,</span>
  finder_instances<span class="hljs-punctuation">:</span> <span class="hljs-number">8</span><span class="hljs-punctuation">,</span>
<span class="hljs-punctuation">}</span></code></pre><table><thead><tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody><tr><td><code>port</code></td><td>int</td><td><code>13420</code></td><td>HTTP server port for <code>findergen</code></td></tr><tr><td><code>cache</code></td><td>bool</td><td><code>false</code></td><td>Enable cache by default</td></tr><tr><td><code>create<em>cache</em>db</code></td><td>bool</td><td><code>false</code></td><td>Create a Git database from cache data</td></tr><tr><td><code>finder_instances</code></td><td>int</td><td><code>8</code></td><td>Max parallel instances when creating cache</td></tr></tbody></table><p>For a visual config editor, visit <a href="https://shadowdara.github.io/finder/configeditor" target="_blank" rel="noopener noreferrer">https://shadowdara.github.io/finder/configeditor</a>.</p><h2 id="web-ui-findergen">Web UI (<code>findergen</code>)</h2><p><code>findergen</code> starts a local HTTP server with a web interface for:</p><ul><li><strong>Template Creator</strong> — create and edit JSON5 templates visually</li><li><strong>Template Viewer</strong> — browse all built-in and custom templates</li><li><strong>Config Editor</strong> — edit <code>config.json5</code> through the browser</li><li><strong>Cache Viewer</strong> — inspect cached search results</li><li><strong>Regex Creator</strong> — build and test regular expressions for templates</li><li><strong>Minecraft World Dashboard</strong> — view Minecraft worlds from the cache</li></ul><pre><code class="language-sh"><span class="hljs-comment"># Start the web UI on the default port</span>
./findergen

<span class="hljs-comment"># Use a custom port</span>
./findergen --port 3000

<span class="hljs-comment"># Collect Minecraft worlds from cache</span>
./findergen worlds</code></pre><h2 id="project-structure">Project structure</h2><pre><code>finder/
├── cmd/
│   ├── finder/          # Main CLI binary
│   ├── findergen/       # Web UI server binary
│   ├── csf/             # Build helper binary
│   └── tester/          # Template test binary
├── internal/
│   ├── bt/              # Build tools (script compiler, git repo)
│   ├── cache/           # Cache system & Git DB
│   ├── cli/             # CLI command handling
│   ├── config/          # Configuration loading
│   ├── finderversion/   # Version constants
│   ├── history/         # Search history
│   ├── loader/          # File loading utilities
│   ├── mcapp/           # Minecraft world data
│   ├── search/          # Core search logic & binary check
│   ├── structure/       # Folder/template structure parsing
│   └── templates/       # Compiled templates + loader
├── pub/
│   ├── argparser/       # Argument parsing library
│   ├── color/           # Terminal color utilities
│   ├── fsd/             # Filesystem directory utilities
│   ├── goansi/          # ANSI escape codes
│   ├── json5/           # JSON5 parser
│   └── version/         # Semantic version comparison
├── templates/           # Source JSON5 templates (370+)
└── finder-template-generator-ssg/  # Static site generator for docs</code></pre><h2 id="development">Development</h2><h3 id="run-tests">Run tests</h3><pre><code class="language-sh">go <span class="hljs-built_in">test</span> ./...</code></pre><h3 id="generate-coverage-report">Generate coverage report</h3><pre><code class="language-sh">go <span class="hljs-built_in">test</span> -coverprofile=coverage ./...
go tool cover -html=coverage</code></pre><h3 id="build">Build</h3><pre><code class="language-sh">go build ./cmd/finder</code></pre><h3 id="validate-templates">Validate templates</h3><pre><code class="language-sh">go run ./cmd/finder check</code></pre><h3 id="list-all-templates">List all templates</h3><pre><code class="language-sh">go run ./cmd/finder list</code></pre><h2 id="contributing">Contributing</h2><ul><li>Found a missing or inaccurate template? Please open an issue.</li><li>Add new templates via PR. Keep them in JSON5 and provide a short</li><li>Feel free to contribute code improvements or new features.</li></ul><h2 id="roadmap">Roadmap</h2><ul><li><input type="checkbox" disabled="disabled"> Temporary templates via command-line arguments</li><li><input type="checkbox" disabled="disabled"> Template schema validation</li><li><input type="checkbox" disabled="disabled"> Improved search history</li><li><input type="checkbox" disabled="disabled"> Extended web UI features</li></ul><h2 id="license">License</h2><p>See <a href="LICENSE">\`LICENSE\`</a>.</p><hr><p><strong>Project:</strong> <a href="https://github.com/shadowdara/finder" target="_blank" rel="noopener noreferrer">https://github.com/shadowdara/finder</a> <strong>Website:</strong> <a href="https://shadowdara.github.io/finder" target="_blank" rel="noopener noreferrer">https://shadowdara.github.io/finder</a></p><h2 id="extra-info">Extra Info</h2><p>The Project <a href="https://github.com/shadowdara/fs-tools" target="_blank" rel="noopener noreferrer">fs-tools</a> was more or less the prototype for finder.</p><h2 id="info-video">Info Video</h2><p>(<em>a Youtube Video</em>)</p><p><a href="https://www.youtube.com/watch?v=oIRgAYv-mOA" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/oIRgAYv-mOA/0.jpg" alt="INFO Video 1 about Finder"></a></p>`,styles:[g]},regexcreator:{id:"regexcreator",type:"component",load:()=>l(()=>import("./regexcreator.js"),__vite__mapDeps([14,15]),import.meta.url),data:null,styles:[]},samfile:{id:"samfile",type:"component",load:()=>l(()=>import("./samfile.js"),__vite__mapDeps([16,17,18]),import.meta.url),data:null,styles:[]},"tools/index":{id:"tools/index",type:"component",load:()=>l(()=>import("./index3.js"),__vite__mapDeps([19,20]),import.meta.url),data:null,styles:[]},"tools/installscript":{id:"tools/installscript",type:"component",load:()=>l(()=>import("./installscript.js"),__vite__mapDeps([21,22]),import.meta.url),data:null,styles:[]},"tools/markdowneditor":{id:"tools/markdowneditor",type:"component",load:()=>l(()=>import("./markdowneditor.js"),__vite__mapDeps([23,24,25]),import.meta.url),data:null,styles:[]},"tools/minecraft/tellraw":{id:"tools/minecraft/tellraw",type:"component",load:()=>l(()=>import("./tellraw.js"),__vite__mapDeps([26,17,27]),import.meta.url),data:null,styles:[]},viewer:{id:"viewer",type:"component",load:()=>l(()=>import("./viewer.js"),__vite__mapDeps([28,24,29]),import.meta.url),data:null,styles:[]}},k=Symbol("html");function t(e,n,...a){if(typeof e=="function")return e({...n??{},children:a});const o=new Set(["disabled","checked","selected","readonly","required","multiple","hidden","autofocus","open"]),h=Object.entries(n??{}).filter(([s])=>s!=="children"&&s!=="key").map(([s,d])=>{if(d==null)return"";const r=s==="className"?"class":s;return typeof d=="boolean"&&o.has(r)?d?` ${r}`:"":typeof d=="boolean"?` ${r}="${d}"`:d===!1?"":` ${r}="${A(String(d))}"`}).join(""),b=a.flat(1/0).filter(s=>s!=null&&s!==!1).map(s=>v(s)?s.value:x(String(s))).join(""),i=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]).has(e)?`<${e}${h}>`:`<${e}${h}>${b}</${e}>`;return q(i)}function C(e){const n=(e.children??[]).flat(1/0).filter(a=>a!=null&&a!==!1).map(a=>v(a)?a.value:x(String(a))).join("");return q(n)}function q(e){return{[k]:!0,value:e,toString(){return e}}}function v(e){return typeof e=="object"&&e!==null&&k in e}function A(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function x(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function F(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function _(e){return q(e)}function I(e){for(const n of e){const a=new URL(n,import.meta.url).href;if(document.head.querySelector(`link[data-page-style="${CSS.escape(a)}"]`))continue;const o=document.createElement("link");o.rel="stylesheet",o.href=a,o.dataset.pageStyle=a,document.head.appendChild(o)}}function U(e){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"No page id was provided."),t("a",{href:"/"},"Go home"))}function P(e,n){const a=Object.keys(n).filter(o=>o!=="__404__").map(o=>t("li",null,t("a",{href:o==="index"?"/":`/${o}`},o))).join("");e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page not found."),t("h2",null,"Available pages"),t("ul",null,_(a)),t("a",{href:"/"},"Go home"))}function L(e,n){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page ",n," not found."),t("a",{href:"/"},"Go home"))}function M(e,n,a){console.error(`[pages] Failed to load page "${n}"`,a),e.innerHTML=t("main",null,t("h1",null,"Failed to load page"),t("p",null,'Could not load "$',n,'".'),t("a",{href:"/"},"Go home"),t("pre",null,`[pages] Failed to load page "${n}"`),t("pre",null,a))}function R(e,n){n.type==="markdown"&&(e.innerHTML=t(C,null,t("a",{href:"../"},"Home"),t("article",{class:"markdown"},_(n.html??""))))}async function O(){const e=document.getElementById("app");if(e==null)throw new Error("Missing #app element");const n=window.PAGE_ID;if(!n){U(e);return}if(n==="__404__"){P(e,y);return}const a=y[n];if(!a){console.error(`[pages] Unknown page id: ${n}`),L(e,n);return}try{if(I(a.styles),a.type==="markdown"){R(e,a);return}await(await a.load()).default(e,a.data)}catch(o){M(e,n,o)}}O();export{C as F,F as e,t as j,_ as r};
