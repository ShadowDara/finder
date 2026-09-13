function h(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function k(e){return e.replace(/---/g,"—").replace(/--/g,"–").replace(/\.{3}/g,"…").replace(/"([^"]+)"/g,"“$1”").replace(/'([^']+)'/g,"‘$1’")}function S(e){return/^https?:\/\//i.test(e)}function g(e,c){const s={"\\\\":"@@ESC-BACKSLASH@@","\\[":"@@ESC-LBRACKET@@","\\]":"@@ESC-RBRACKET@@","\\(":"@@ESC-LPAREN@@","\\)":"@@ESC-RPAREN@@","\\|":"@@ESC-PIPE@@",'\\"':"@@ESC-QUOTE@@","\\*":"@@ESC-STAR@@","\\_":"@@ESC-UNDERSCORE@@","\\`":"@@ESC-BACKTICK@@","\\~":"@@ESC-TILDE@@"};for(const[n,r]of Object.entries(s)){const i=new RegExp(n.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&"),"g");e=e.replace(i,r)}const t=[],o=[];c.sanitize||(e=e.replace(/<[^>]+>/g,n=>`@@RAWHTML${o.push(n)-1}@@`)),e=e.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,(n,r,i,a)=>{const l=a?` title="${h(a)}"`:"";return`@@HTML${t.push(`<img src="${h(i)}" alt="${h(r)}"${l}>`)-1}@@`}),e=e.replace(/\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,(n,r,i,a)=>{const l=a?` title="${h(a)}"`:"",m=c.externalLinks&&S(i)?' target="_blank" rel="noopener noreferrer"':"";return`@@HTML${t.push(`<a href="${h(i)}"${l}${m}>${r}</a>`)-1}@@`}),e=e.replace(/`{2}([^`]+)`{2}|`([^`\n]+)`/g,(n,r,i)=>`<code>${h(r!==void 0?r:i??"")}</code>`),e=e.replace(/<(https?:\/\/[^\s>]+)>/g,(n,r)=>{const i=c.externalLinks?' target="_blank" rel="noopener noreferrer"':"",a=h(r);return`<a href="${a}"${i}>${a}</a>`}),e=e.replace(/<([^@\s>]+@[^@\s>]+\.[^@\s>]+)>/g,(n,r)=>{const i=h(r);return`<a href="mailto:${i}">${i}</a>`}),e=e.replace(/(\*{3}|_{3})(.+?)\1/g,"<strong><em>$2</em></strong>"),e=e.replace(/(\*{2}|_{2})(.+?)\1/g,"<strong>$2</strong>"),e=e.replace(/(\*|_)(.+?)\1/g,"<em>$2</em>"),e=e.replace(/~~(.+?)~~/g,"<del>$1</del>"),e=e.replace(/\^([^^]+)\^/g,"<sup>$1</sup>"),e=e.replace(new RegExp("(?<!~)~(?!~)([^~]+)~(?!~)","g"),"<sub>$1</sub>"),e=e.replace(/==(.+?)==/g,"<mark>$1</mark>"),e=e.replace(/ {2,}\n/g,`<br>
`),c.breaks&&(e=e.replace(/\n/g,`<br>
`)),c.smartypants&&(e=k(e));for(let n=t.length-1;n>=0;n--)e=e.replace(new RegExp(`@@HTML${n}@@`,"g"),t[n]);if(!c.sanitize)for(let n=o.length-1;n>=0;n--)e=e.replace(new RegExp(`@@RAWHTML${n}@@`,"g"),o[n]);return e=e.replace(/@@ESC-BACKSLASH@@/g,"\\"),e=e.replace(/@@ESC-LPAREN@@/g,"("),e=e.replace(/@@ESC-RPAREN@@/g,")"),e=e.replace(/@@ESC-PIPE@@/g,"|"),e=e.replace(/@@ESC-QUOTE@@/g,'"'),e=e.replace(/@@ESC-STAR@@/g,"*"),e=e.replace(/@@ESC-UNDERSCORE@@/g,"_"),e=e.replace(/@@ESC-BACKTICK@@/g,"`"),e=e.replace(/@@ESC-TILDE@@/g,"~"),e=e.replace(/@@ESC-RBRACKET@@/g,"]"),e=e.replace(/@@ESC-LBRACKET@@/g,"["),e}function p(e,c){const s=[];let t=0;for(;t<e.length;){const o=e[t],n=o.match(/^(\s*)/),r=n?n[1].length:0;if(r<c)break;if(r>c){t++;continue}const i=o.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)/);if(!i){t++;continue}let a=i[1],l=!1,m=!1;const d=a.match(/^\[([ xX])\]\s+(.*)/);d&&(l=!0,m=d[1].toLowerCase()==="x",a=d[2]);const u=[];for(t++;t<e.length&&!((e[t].match(/^(\s*)/)??["",""])[1].length<=c&&e[t].match(/^\s*(?:[-*+]|\d+\.)\s/));)u.push(e[t]),t++;const f=u.length>0?p(u,c+2):[];s.push({text:a,task:l,checked:m,children:f})}return s}function $(e,c,s){return e.map(t=>{const o=t.task?`<input type="checkbox"${t.checked?" checked":""} disabled> `:"",n=t.children.length>0?C(t.children,c,s):"";return`<li>${o}${g(t.text,s)}${n}</li>`}).join(`
`)}function C(e,c,s){const t=c?"ol":"ul";return`<${t}>
${$(e,c,s)}
</${t}>`}function w(e,c){const s=e.trim().split(`
`);if(s.length<2)return`<p>${g(e,c)}</p>`;const t=s[0].split(new RegExp("(?<!\\\\)\\|")).filter((l,m,d)=>!(m===0&&l==="")&&!(m===d.length-1&&l==="")).map(l=>l.trim()),n=s[1].split(new RegExp("(?<!\\\\)\\|")).filter(l=>/[-:]/.test(l)).map(l=>(l=l.trim(),l.startsWith(":")&&l.endsWith(":")?"center":l.endsWith(":")?"right":l.startsWith(":")?"left":"")),r=`<thead>
<tr>
${t.map((l,m)=>`<th${n[m]?` style="text-align:${n[m]}"`:""}>${g(l,c)}</th>`).join(`
`)}
</tr>
</thead>`,a=`<tbody>
${s.slice(2).map(l=>`<tr>
${l.split(new RegExp("(?<!\\\\)\\|")).filter((d,u,f)=>!(u===0&&d==="")&&!(u===f.length-1&&d==="")).map(d=>d.trim()).map((d,u)=>`<td${n[u]?` style="text-align:${n[u]}"`:""}>${g(d,c)}</td>`).join(`
`)}
</tr>`).join(`
`)}
</tbody>`;return`<table>
${r}
${a}
</table>`}function L(e,c){const s=e.split(`
`).map(t=>t.replace(/^>\s?/,"")).join(`
`);return`<blockquote>
${E(s,c)}
</blockquote>`}function b(e,c,s){const t=e?` class="language-${h(e)}"`:"",o=s.highlight?s.highlight(c,e):h(c);return`<pre><code${t}>${o}</code></pre>`}function R(e){const c={};return{text:e.replace(/^\[(\^[^\]]+)\]:\s+(.+)$/gm,(t,o,n)=>(c[o]=n,"")),notes:c}}function v(e,c,s){return e.replace(/\[(\^[^\]]+)\]/g,(t,o)=>{if(!c[o])return t;const n=o.slice(1);return`<sup><a href="#fn-${n}" id="fnref-${n}">${n}</a></sup>`})}function y(e,c){const s=Object.entries(e);return s.length===0?"":`<hr>
<ol class="footnotes">
${s.map(([o,n])=>{const r=o.slice(1);return`<li id="fn-${r}">${g(n,c)} <a href="#fnref-${r}">↩</a></li>`}).join(`
`)}
</ol>`}function E(e,c){const s=[];let t=e;for(;t.length>0;){let o=!1;if(/^\n+/.test(t)){t=t.replace(/^\n+/,"");continue}{const n=t.match(/^@@CODEBLOCK\d+@@/);n&&(s.push(n[0]),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?\1[ \t]*(?:\n|$)/);if(n){const r=n[2].trim(),i=n[3];s.push(b(r,i,c)),t=t.slice(n[0].length),o=!0}}if(!o){{const n=[];let r=t,i=!1;for(;;){const a=r.match(/^(?: {4}|\t)(.*)(?:\n|$)/);if(!a)break;n.push(a[1]),r=r.slice(a[0].length),i=!0}i&&(s.push(b("",n.join(`
`),c)),t=r,o=!0)}if(!o){{const n=[];let r=t;for(;;){const i=r.match(/^>(.*)(?:\n|$)/);if(!i)break;n.push(">"+i[1]),r=r.slice(i[0].length)}n.length>0&&(s.push(L(n.join(`
`),c)),t=r,o=!0)}if(!o){{const n=t.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*(?:\n|$)/);if(n){const r=n[1].length,i=n[2].trim(),a=i.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");s.push(`<h${r} id="${a}">${g(i,c)}</h${r}>`),t=t.slice(n[0].length),o=!0}}if(!o){{const n=t.match(/^(.+)\n(=+|-+)\s*(?:\n|$)/);if(n){const r=n[2][0]==="="?1:2,i=n[1].trim(),a=i.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");s.push(`<h${r} id="${a}">${g(i,c)}</h${r}>`),t=t.slice(n[0].length),o=!0}}if(!o){{const n=t.match(/^(?:[-*_] *){3,}\s*(?:\n|$)/);n&&(s.push("<hr>"),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^(\|?.+\|.+\n\|?[-| :]+\|[-| :]+\n(?:\|?.+\|.+\n?)*)/);n&&(s.push(w(n[1],c)),t=t.slice(n[0].length),o=!0)}if(!o){{const n=[];let r=t;for(;;){const i=r.match(/^( *[-*+] .*)(?:\n|$)/);if(!i){const a=r.match(/^( {2,}.+)(?:\n|$)/);if(a&&n.length>0){n.push(a[1]),r=r.slice(a[0].length);continue}break}n.push(i[1]),r=r.slice(i[0].length)}if(n.length>0){const i=p(n,0);s.push(C(i,!1,c)),t=r,o=!0}}if(!o){{const n=[];let r=t,i=1;for(;;){const a=r.match(/^( *\d+\. .*)(?:\n|$)/);if(!a){const l=r.match(/^( {3,}.+)(?:\n|$)/);if(l&&n.length>0){n.push(l[1]),r=r.slice(l[0].length);continue}break}if(n.length===0){const l=a[1].match(/^(\d+)\./);l&&(i=parseInt(l[1],10))}n.push(a[1]),r=r.slice(a[0].length)}if(n.length>0){const a=p(n,0),l=`ol${i!==1?` start="${i}"`:""}`;s.push(`<${l}>
${$(a,!0,c)}
</ol>`),t=r,o=!0}}if(!o){if(!c.sanitize){const n=t.match(/^(<(?:div|section|article|aside|header|footer|nav|main|p|blockquote|pre|table|ul|ol|dl|form|figure|details|summary)[^>]*>[\s\S]*?<\/\w+>)\s*(?:\n|$)/i);n&&(s.push(n[1]),t=t.slice(n[0].length),o=!0)}if(!o){{const n=t.match(/^([\s\S]+?)(?:\n\n|$)/);if(n){const r=n[1].trim();r&&s.push(`<p>${g(r,c)}</p>`),t=t.slice(n[0].length),o=!0}}o||(t=t.slice(1))}}}}}}}}}}}}return s.join(`
`)}const T=`
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
`;function A(e,c={}){const s={externalLinks:!0,breaks:!1,smartypants:!1,sanitize:!1,...c};let t=e.replace(/\r\n/g,`
`).replace(/\r/g,`
`);const o=[];t=t.replace(/^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\n?\1[ \t]*(?:\n|$)/gm,(a,l,m,d)=>`@@CODEBLOCK${o.push(b(m.trim(),d,s))-1}@@
`);const{text:n,notes:r}=R(t);t=n,t=v(t,r);let i=E(t,s);return i=i.replace(/@@CODEBLOCK(\d+)@@/g,(a,l)=>o[+l]),i+=y(r,s),i}function O(e,c={}){const{title:s="Dokument",header:t="",css:o=T,...n}=c,r=A(e,n);return`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(s)}</title>
<style>${o}</style>
${t}
</head>
<body>
<article class="md-body">
${r}
</article>
</body>
</html>`}export{O as a,A as p};
