import{j as f,r as S}from"./main_entry.js";function g(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function y(e){return e.replace(/---/g,"—").replace(/--/g,"–").replace(/\.{3}/g,"…").replace(/"([^"]+)"/g,"“$1”").replace(/'([^']+)'/g,"‘$1’")}function R(e){return/^https?:\/\//i.test(e)}function p(e,i){const a={"\\\\":"@@ESC-BACKSLASH@@","\\[":"@@ESC-LBRACKET@@","\\]":"@@ESC-RBRACKET@@","\\(":"@@ESC-LPAREN@@","\\)":"@@ESC-RPAREN@@","\\|":"@@ESC-PIPE@@",'\\"':"@@ESC-QUOTE@@","\\*":"@@ESC-STAR@@","\\_":"@@ESC-UNDERSCORE@@","\\`":"@@ESC-BACKTICK@@","\\~":"@@ESC-TILDE@@"};for(const[n,r]of Object.entries(a)){const c=new RegExp(n.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"),"g");e=e.replace(c,r)}const t=[],o=[];i.sanitize||(e=e.replace(/<[^>]+>/g,n=>`@@RAWHTML${o.push(n)-1}@@`)),e=e.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,(n,r,c,s)=>{const l=s?` title="${g(s)}"`:"";return`@@HTML${t.push(`<img src="${g(c)}" alt="${g(r)}"${l}>`)-1}@@`}),e=e.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,(n,r,c,s)=>{const l=s?` title="${g(s)}"`:"",m=i.externalLinks&&R(c)?' target="_blank" rel="noopener noreferrer"':"";return`@@HTML${t.push(`<a href="${g(c)}"${l}${m}>${r}</a>`)-1}@@`}),e=e.replace(/`{2}([^`]+)`{2}|`([^`\n]+)`/g,(n,r,c)=>`<code>${g(r!==void 0?r:c??"")}</code>`),e=e.replace(/<(https?:\/\/[^\s>]+)>/g,(n,r)=>{const c=i.externalLinks?' target="_blank" rel="noopener noreferrer"':"",s=g(r);return`<a href="${s}"${c}>${s}</a>`}),e=e.replace(/<([^@\s>]+@[^@\s>]+\.[^@\s>]+)>/g,(n,r)=>{const c=g(r);return`<a href="mailto:${c}">${c}</a>`}),e=e.replace(/(\*{3}|_{3})(.+?)\1/g,"<strong><em>$2</em></strong>"),e=e.replace(/(\*{2}|_{2})(.+?)\1/g,"<strong>$2</strong>"),e=e.replace(/(\*|_)(.+?)\1/g,"<em>$2</em>"),e=e.replace(/~~(.+?)~~/g,"<del>$1</del>"),e=e.replace(/\^([^^]+)\^/g,"<sup>$1</sup>"),e=e.replace(new RegExp("(?<!~)~(?!~)([^~]+)~(?!~)","g"),"<sub>$1</sub>"),e=e.replace(/==(.+?)==/g,"<mark>$1</mark>"),e=e.replace(/ {2,}\n/g,`<br>
`),i.breaks&&(e=e.replace(/\n/g,`<br>
`)),i.smartypants&&(e=y(e));for(let n=t.length-1;n>=0;n--)e=e.replace(new RegExp(`@@HTML${n}@@`,"g"),t[n]);if(!i.sanitize)for(let n=o.length-1;n>=0;n--)e=e.replace(new RegExp(`@@RAWHTML${n}@@`,"g"),o[n]);return e=e.replace(/@@ESC-BACKSLASH@@/g,"\\"),e=e.replace(/@@ESC-LPAREN@@/g,"("),e=e.replace(/@@ESC-RPAREN@@/g,")"),e=e.replace(/@@ESC-PIPE@@/g,"|"),e=e.replace(/@@ESC-QUOTE@@/g,'"'),e=e.replace(/@@ESC-STAR@@/g,"*"),e=e.replace(/@@ESC-UNDERSCORE@@/g,"_"),e=e.replace(/@@ESC-BACKTICK@@/g,"`"),e=e.replace(/@@ESC-TILDE@@/g,"~"),e=e.replace(/@@ESC-RBRACKET@@/g,"]"),e=e.replace(/@@ESC-LBRACKET@@/g,"["),e}function w(e,i){const a=[];let t=0;for(;t<e.length;){const o=e[t],n=o.match(/^(\s*)/),r=n?n[1].length:0;if(r<i)break;if(r>i){t++;continue}const c=o.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)/);if(!c){t++;continue}let s=c[1],l=!1,m=!1;const d=s.match(/^\[([ xX])\]\s+(.*)/);d&&(l=!0,m=d[1].toLowerCase()==="x",s=d[2]);const h=[];for(t++;t<e.length&&!((e[t].match(/^(\s*)/)??["",""])[1].length<=i&&e[t].match(/^\s*(?:[-*+]|\d+\.)\s/));)h.push(e[t]),t++;const u=h.length>0?w(h,i+2):[];a.push({text:s,task:l,checked:m,children:u})}return a}function E(e,i,a){return e.map(t=>{const o=t.task?`<input type="checkbox"${t.checked?" checked":""} disabled> `:"",n=t.children.length>0?k(t.children,i,a):"";return`<li>${o}${p(t.text,a)}${n}</li>`}).join(`
`)}function k(e,i,a){const t=i?"ol":"ul";return`<${t}>
${E(e,i,a)}
</${t}>`}function T(e,i){const a=e.trim().split(`
`);if(a.length<2)return`<p>${p(e,i)}</p>`;const t=a[0].split(new RegExp("(?<!\\\\)\\|")).filter((l,m,d)=>!(m===0&&l==="")&&!(m===d.length-1&&l==="")).map(l=>l.trim()),n=a[1].split(new RegExp("(?<!\\\\)\\|")).filter(l=>/[-:]/.test(l)).map(l=>(l=l.trim(),l.startsWith(":")&&l.endsWith(":")?"center":l.endsWith(":")?"right":l.startsWith(":")?"left":"")),r=`<thead>
<tr>
${t.map((l,m)=>`<th${n[m]?` style="text-align:${n[m]}"`:""}>${p(l,i)}</th>`).join(`
`)}
</tr>
</thead>`,s=`<tbody>
${a.slice(2).map(l=>`<tr>
${l.split(new RegExp("(?<!\\\\)\\|")).filter((d,h,u)=>!(h===0&&d==="")&&!(h===u.length-1&&d==="")).map(d=>d.trim()).map((d,h)=>`<td${n[h]?` style="text-align:${n[h]}"`:""}>${p(d,i)}</td>`).join(`
`)}
</tr>`).join(`
`)}
</tbody>`;return`<table>
${r}
${s}
</table>`}function A(e,i){const a=e.split(`
`).map(t=>t.replace(/^>\s?/,"")).join(`
`);return`<blockquote>
${v(a,i)}
</blockquote>`}function C(e,i,a){const t=e?` class="language-${g(e)}"`:"",o=a.highlight?a.highlight(i,e):g(i);return`<pre><code${t}>${o}</code></pre>`}function O(e){const i={};return{text:e.replace(/^\[(\^[^\]]+)\]:\s+(.+)$/gm,(t,o,n)=>(i[o]=n,"")),notes:i}}function B(e,i,a){return e.replace(/\[(\^[^\]]+)\]/g,(t,o)=>{if(!i[o])return t;const n=o.slice(1);return`<sup><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`})}function P(e,i){const a=Object.entries(e);return a.length===0?"":`<hr>
<ol class="footnotes">
${a.map(([o,n])=>{const r=o.slice(1);return`<li id="fn-${r}">${p(n,i)} <a href="#fnref-${r}">↩</a></li>`}).join(`
`)}
</ol>`}function v(e,i){const a=[];let t=e;for(;t.length>0;){let o=!1;if(/^\n+/.test(t)){t=t.replace(/^\n+/,"");continue}{const n=t.match(/^@@CODEBLOCK\d+@@/);n&&(a.push(n[0]),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?\1[ \t]*(?:\n|$)/);if(n){const r=n[2].trim(),c=n[3];a.push(C(r,c,i)),t=t.slice(n[0].length),o=!0}}if(!o){{const n=[];let r=t,c=!1;for(;;){const s=r.match(/^(?: {4}|\t)(.*)(?:\n|$)/);if(!s)break;n.push(s[1]),r=r.slice(s[0].length),c=!0}c&&(a.push(C("",n.join(`
`),i)),t=r,o=!0)}if(!o){{const n=[];let r=t;for(;;){const c=r.match(/^>(.*)(?:\n|$)/);if(!c)break;n.push(">"+c[1]),r=r.slice(c[0].length)}n.length>0&&(a.push(A(n.join(`
`),i)),t=r,o=!0)}if(!o){{const n=t.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*(?:\n|$)/);if(n){const r=n[1].length,c=n[2].trim(),s=c.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");a.push(`<h${r} id="${s}">${p(c,i)}</h${r}>`),t=t.slice(n[0].length),o=!0}}if(!o){{const n=t.match(/^(.+)\n(=+|-+)\s*(?:\n|$)/);if(n){const r=n[2][0]==="="?1:2,c=n[1].trim(),s=c.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");a.push(`<h${r} id="${s}">${p(c,i)}</h${r}>`),t=t.slice(n[0].length),o=!0}}if(!o){{const n=t.match(/^(?:[-*_] *){3,}\s*(?:\n|$)/);n&&(a.push("<hr>"),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^(\|?.+\|.+\n\|?[-| :]+\|[-| :]+\n(?:\|?.+\|.+\n?)*)/);n&&(a.push(T(n[1],i)),t=t.slice(n[0].length),o=!0)}if(!o){{const n=[];let r=t;for(;;){const c=r.match(/^( *[-*+] .*)(?:\n|$)/);if(!c){const s=r.match(/^( {2,}.+)(?:\n|$)/);if(s&&n.length>0){n.push(s[1]),r=r.slice(s[0].length);continue}break}n.push(c[1]),r=r.slice(c[0].length)}if(n.length>0){const c=w(n,0);a.push(k(c,!1,i)),t=r,o=!0}}if(!o){{const n=[];let r=t,c=1;for(;;){const s=r.match(/^( *\d+\. .*)(?:\n|$)/);if(!s){const l=r.match(/^( {3,}.+)(?:\n|$)/);if(l&&n.length>0){n.push(l[1]),r=r.slice(l[0].length);continue}break}if(n.length===0){const l=s[1].match(/^(\d+)\./);l&&(c=parseInt(l[1],10))}n.push(s[1]),r=r.slice(s[0].length)}if(n.length>0){const s=w(n,0),l=`ol${c!==1?` start="${c}"`:""}`;a.push(`<${l}>
${E(s,!0,i)}
</ol>`),t=r,o=!0}}if(!o){if(!i.sanitize){const n=t.match(/^(<(?:div|section|article|aside|header|footer|nav|main|p|blockquote|pre|table|ul|ol|dl|form|figure|details|summary)[^>]*>[\s\S]*?<\/\w+>)\s*(?:\n|$)/i);n&&(a.push(n[1]),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^([\s\S]+?)(?:\n\n|$)/);if(n){const r=n[1].trim();r&&a.push(`<p>${p(r,i)}</p>`),t=t.slice(n[0].length),o=!0}}o||(t=t.slice(1))}}}}}}}}}}}}return a.join(`
`)}const j=`
:root {
  --md-font: system-ui, sans-serif;
  --md-mono: "Fira Code", "Cascadia Code", Consolas, monospace;
  --md-max-width: 800px;
  --md-line-height: 1.7;
  --md-color: #1a1a2e;
  --md-bg: #ffffff;
  --md-code-bg: #f4f4f8;
  --md-border: #d1d5db;
  --md-accent: #3b5bdb;
  --md-blockquote: #6b7280;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--md-bg); color: var(--md-color); }
.md-body {
  font-family: var(--md-font);
  line-height: var(--md-line-height);
  max-width: var(--md-max-width);
  margin: 2rem auto;
  padding: 0 1.5rem;
}
h1,h2,h3,h4,h5,h6 {
  margin: 1.6em 0 0.4em;
  line-height: 1.25;
  font-weight: 700;
}
h1 { font-size: 2rem; border-bottom: 2px solid var(--md-border); padding-bottom: 0.3em; }
h2 { font-size: 1.5rem; border-bottom: 1px solid var(--md-border); padding-bottom: 0.2em; }
p { margin: 0.8em 0; }
a { color: var(--md-accent); }
code {
  font-family: var(--md-mono);
  font-size: 0.875em;
  background: var(--md-code-bg);
  padding: 0.15em 0.35em;
  border-radius: 4px;
}
pre { background: var(--md-code-bg); border-radius: 6px; padding: 1em; overflow-x: auto; }
pre code { background: none; padding: 0; font-size: 0.9em; }
blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--md-accent);
  color: var(--md-blockquote);
}
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid var(--md-border); padding: 0.5em 0.8em; }
th { background: var(--md-code-bg); font-weight: 600; }
tr:nth-child(even) td { background: #fafafa; }
ul, ol { padding-left: 1.5em; margin: 0.8em 0; }
li { margin: 0.25em 0; }
hr { border: none; border-top: 2px solid var(--md-border); margin: 2em 0; }
img { max-width: 100%; height: auto; border-radius: 4px; }
mark { background: #fef08a; padding: 0.1em 0.2em; border-radius: 2px; }
input[type="checkbox"] { margin-right: 0.4em; }
.footnotes { font-size: 0.875em; color: var(--md-blockquote); }
@media (prefers-color-scheme: dark) {
    :root {
        --md-font: system-ui, sans-serif;
        --md-mono: "Fira Code", "Cascadia Code", Consolas, monospace;
        --md-max-width: 800px;
        --md-line-height: 1.7;
        --md-color: #ffffff;
        --md-bg: #000000;
        --md-code-bg: #292929;
        --md-table-2: #1b1b1b;
        --md-border: #d1d5db;
        --md-accent: #45bbff;
        --md-blockquote: #6b7280;
    }
}
`;function L(e,i={}){const a={externalLinks:!0,breaks:!1,smartypants:!1,sanitize:!1,...i};let t=e.replace(/\r\n/g,`
`).replace(/\r/g,`
`);const o=[];t=t.replace(/^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?\1[ \t]*(?:\n|$)/gm,(s,l,m,d)=>`@@CODEBLOCK${o.push(C(m.trim(),d,a))-1}@@
`);const{text:n,notes:r}=O(t);t=n,t=B(t,r);let c=v(t,a);return c=c.replace(/@@CODEBLOCK(\d+)@@/g,(s,l)=>o[+l]),c+=P(r,a),c}function K(e,i={}){const{title:a="Dokument",header:t="",css:o=j,...n}=i,r=L(e,n);return`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${g(a)}</title>
<style>${o}</style>
${t}
</head>
<body>
<article class="md-body">
${r}
</article>
</body>
</html>`}function _(e){const i=new URLSearchParams(window.location.search),a=i.get("slug")??i.get("id")??"0",t=i.get("name")??`Note ${a}`;let o=!0,n="";e.innerHTML=f("main",null,f("h1",null,"Markdown Notes"),f("div",{class:"container"},f("textarea",{id:"notetext",hidden:o},"# This is Markdown Press",`

`,"CTRL + E to swtich the view mode"),f("article",{id:"preview",class:"viewonly"})),f("div",{class:"inline"},f("button",{id:"toggle-view",type:"button"},"Edit"),f("button",{id:"export-note",type:"button"},"Export")));const r=e.querySelector("#notetext"),c=e.querySelector("#preview"),s=e.querySelector("#toggle-view");function l(){c.innerHTML=S(L(n)).toString()}function m(u){o=u,r.hidden=o,c.classList.toggle("viewonly",o),s.textContent=o?"Edit":"View",o||r.focus()}function d(){const u=`<!-- Markdown Note -->${K(n)}`,b=URL.createObjectURL(new Blob([u],{type:"text/html"})),$=document.createElement("a");$.href=b,$.download=`${t}_export.html`,$.click(),URL.revokeObjectURL(b)}function h(u){u.ctrlKey&&u.key.toLowerCase()==="e"&&(u.preventDefault(),m(!o))}r.addEventListener("input",()=>{n=r.value,l()}),s.addEventListener("click",()=>m(!o)),e.querySelector("#export-note").addEventListener("click",d),window.addEventListener("keydown",h),n=r.value,l()}export{_ as default};
