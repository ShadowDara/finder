const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/creator-y2_09cSn.js","assets/creator-DSVGwkNZ.css","assets/viewer-BKPpFfgS.js","assets/viewer-DfdmHG-g.css"])))=>i.map(i=>d[i]);
const C="modulepreload",w=function(e){return"/"+e},u={},m=function(n,t,s){let o=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),i=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));o=Promise.allSettled(t.map(a=>{if(a=w(a),a in u)return;u[a]=!0;const d=a.endsWith(".css"),h=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${a}"]${h}`))return;const l=document.createElement("link");if(l.rel=d?"stylesheet":C,d||(l.as="script"),l.crossOrigin="",l.href=a,i&&l.setAttribute("nonce",i),document.head.appendChild(l),d)return new Promise((f,T)=>{l.addEventListener("load",f),l.addEventListener("error",()=>T(new Error(`Unable to preload CSS for ${a}`)))})}))}function c(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return o.then(r=>{for(const i of r||[])i.status==="rejected"&&c(i.reason);return n().catch(c)})},p="/assets/markdownstyle-CWEgKCyj.css",g={about:{id:"about",type:"component",load:()=>m(()=>import("./about-VVPQahju.js"),[]),styles:[]},changelog:{id:"changelog",type:"markdown",markdown:`# CHANGELOG\r
\r
[Go Back](../) - _Please ignore this line, this is for the finder server_\r
\r
The whole finder CHANGELOG\r
\r
## Newest -> prob 0.3.15\r
\r
- added new Templates\r
- added a HTML Server with go backend to create and view all templates\r
- added json output support to finder, just add \`--json\` to command\r
- added tags and min version to a lot of the templates\r
- the Templates are now saved as minified json\r
\r
## 0.3.9\r
\r
- fixed Binary Search\r
\r
## 0.3.8\r
\r
- added Checksums\r
\r
## 0.3.7\r
\r
- only for releasing\r
\r
## 0.3.6 - 24.02.2026\r
\r
- added Size option to the Templates\r
- updated README File\r
- updates \`CUSTOM_TEMPLATES\`\r
- added a new entry to the Template: **min finder version** which should\r
  help with for example old and new templates but is not required\r
- added Version package\r
\r
## 0.3.5 - 18.02.2026\r
\r
- made a Folder public for public finder modules\r
- added Template for\r
  - flax\r
- added Time which the searching took\r
- resturctured the argparser\r
- added version Command\r
- added Argparser package\r
- removed loading templates directly from the Console or via a custom filepath!\r
  Just move them into \`$HOME/.finder/templates\`.\r
- json output is broken in this Release, but will we fixed in future Releases\r
  although with other Output Types\r
- formatted the tag Search output correctly\r
\r
## 0.3.4 - 16.02.2026\r
\r
- changed Go Version to 1.18\r
- fixed _\`Search on all Drives on Windows\`_ from 0.3.3, it\r
  didn't quite well before\r
- added Async Search\r
- made color package public\r
\r
## 0.3.3 - 15.02.2026\r
\r
- added JSON Shema\r
- added File Options\r
- Search on all Drives on Windows\r
- added Tag Search\r
\r
## 0.3.2 - 15.02.2026\r
\r
- little Fixes\r
\r
## 0.3.1 - 15.02.2026\r
\r
### ✨ Features\r
\r
#### Runtime Custom Template System\r
\r
- **Custom Templates without Recompilation**: Users can now create templates in \`~/.finder/templates/\` or \`./.finder/templates/\` without recompiling the program\r
- **Automatic Template Discovery**: New \`.json5\` files are automatically detected and loaded on startup\r
- **User Templates Override**: User-defined templates can override built-in templates with the same name\r
- **Precedence System**: User templates take precedence over built-in templates\r
\r
#### CLI Reorganization & Modernization\r
\r
- **Modular CLI Architecture**: Complete restructuring from monolithic design\r
  - \`parser.go\`: Dedicated argument parsing logic\r
  - \`handlers.go\`: Isolated command handlers\r
  - \`commands.go\`: Clean routing (reduced from 300+ to 60 lines)\r
- **Command Aliases**: New shorter forms for common commands\r
  - \`h\`, \`-h\`, \`--help\` in addition to \`help\`\r
  - \`ls\` in addition to \`list\`\r
  - \`--file\` in addition to \`-f\`\r
  - \`--config\` in addition to \`-c\`\r
- **CLIOptions Struct**: Structured argument representation with predicates\r
  - \`.IsHelp()\`, \`.IsList()\`, \`.IsCheck()\`, \`.IsFileLoad()\`, \`.IsDirectLoad()\`, \`.IsTemplateSearch()\`\r
  - \`.GetFileArg()\`, \`.GetDirectLoadArg()\`, \`.GetTemplateName()\`\r
- **Verbose Mode**: New \`--verbose\` flag for extended output\r
\r
#### Enhanced Help System\r
\r
- **Better Help Structure**: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS\r
- **Table Layout**: Improved readability with consistent formatting\r
- **Custom Templates Info**: Documentation for user template setup\r
- **Detailed Descriptions**: Each command with clear explanation\r
\r
#### Enhanced List & Check Commands\r
\r
- **Separated Display**: Built-in and custom templates are listed separately\r
- **Template Sources**: Source attribute shows whether template is built-in or custom\r
- **Helpful Hints**: Paths for custom template setup are displayed\r
- **Improved Validation**: Check command validates with source information\r
\r
### 🧪 Testing\r
\r
- **40+ new unit tests** for CLI parser logic\r
- **Parser Tests**: Comprehensive coverage for command recognition, flag parsing, argument extraction\r
- **Integration Tests**: End-to-end tests for command execution\r
- **Routing Tests**: Tests for handler mapping\r
- **Error Handling Tests**: Validation of error handling and user feedback\r
\r
### 📖 Documentation\r
\r
- **ARCHITECTURE.md**: Detailed technical documentation of the new CLI structure\r
- **REORGANIZATION.md**: Comprehensive before/after comparison and explanation\r
- **QUICKSTART.md**: Practical guide for adding new commands\r
- **CUSTOM_TEMPLATES.md**: User guide for custom template creation\r
- **Inline Code Comments**: Improved code documentation\r
\r
### 🔧 Infrastructure\r
\r
- **Enhanced Template Loader** (\`templateloader.go\`)\r
  - \`LoadUserTemplates()\`: Discovers user templates from filesystem\r
  - \`JSONtemplateLoaderWithUserTemplates()\`: Intelligent loading with user override\r
  - \`LoadAllWithUserTemplates()\`: Combined built-in + custom template discovery\r
- **Template Override Mechanism**: User templates can replace built-in templates\r
- **Graceful Error Handling**: Missing user template directories are not fatal\r
\r
### 🎯 Quality Improvements\r
\r
- **Clean Code Structure**: Single Responsibility Principle consistently applied\r
- **Better Testability**: Each module can be tested in isolation\r
- **Extensibility**: New commands can be added in 5 simple steps\r
- **Backward Compatibility**: External API (\`HandleCommand()\`) unchanged\r
\r
### 👥 User Experience\r
\r
- **Better Error Messages**: Context-sensitive error messages with suggestions\r
- **Helpful Hints**: Tips for common tasks (e.g., where to place templates)\r
- **Flexible Command Syntax**: Multiple synonyms for each command\r
- **Consistent Output Formatting**: Unified design across all commands\r
\r
### 📊 Performance\r
\r
- **No Recompilation Required**: Custom templates are loaded at runtime\r
- **Efficient Template Discovery**: Fast filesystem traversal\r
- **Minimal Overhead**: Template loading has negligible performance impact\r
\r
### 🐛 Bug Fixes & Improvements\r
\r
- Improved error handling in template loading\r
- Better handling of missing or malformed user templates\r
- Consistent error messages across all commands\r
- Fixed edge cases in CLI argument parsing\r
\r
### 📝 Breaking Changes\r
\r
- **No Breaking Changes**: All existing commands work unchanged\r
- Internal structure completely refactored, but public API remains stable\r
\r
### 🙏 Highlights\r
\r
This version brings the biggest improvement since 0.2.0:\r
\r
- Users can now create their own templates\r
- Codebase is more maintainable and extensible\r
- Test coverage drastically improved\r
\r
---\r
\r
## 0.3.0 - 23.01.2026\r
\r
Template System & CLI Foundations\r
\r
## 0.2.0 - 23.01.2026\r
\r
More Templates\r
Better Console Output\r
Help Message\r
\r
## 0.1.0 - 17.11.2025\r
\r
Programm Init\r
`,html:`<h1 id="changelog">CHANGELOG</h1>
<p><a href="../">Go Back</a> - <em>Please ignore this line, this is for the finder server</em></p>
<p>The whole finder CHANGELOG</p>
<h2 id="newest---prob-0315">Newest -> prob 0.3.15</h2>
<ul>
<li>added new Templates</li>
<li>added a HTML Server with go backend to create and view all templates</li>
<li>added json output support to finder, just add <code>--json</code> to command</li>
<li>added tags and min version to a lot of the templates</li>
<li>the Templates are now saved as minified json</li>
</ul>
<h2 id="039">0.3.9</h2>
<ul>
<li>fixed Binary Search</li>
</ul>
<h2 id="038">0.3.8</h2>
<ul>
<li>added Checksums</li>
</ul>
<h2 id="037">0.3.7</h2>
<ul>
<li>only for releasing</li>
</ul>
<h2 id="036---24022026">0.3.6 - 24.02.2026</h2>
<ul>
<li>added Size option to the Templates</li>
<li>updated README File</li>
<li>updates <code>CUSTOM_TEMPLATES</code></li>
<li>added a new entry to the Template: <strong>min finder version</strong> which should</li>
<li>added Version package</li>
</ul>
<h2 id="035---18022026">0.3.5 - 18.02.2026</h2>
<ul>
<li>made a Folder public for public finder modules</li>
<li>added Template for<ul>
<li>flax</li>
</ul></li>
<li>added Time which the searching took</li>
<li>resturctured the argparser</li>
<li>added version Command</li>
<li>added Argparser package</li>
<li>removed loading templates directly from the Console or via a custom filepath!</li>
<li>json output is broken in this Release, but will we fixed in future Releases</li>
<li>formatted the tag Search output correctly</li>
</ul>
<h2 id="034---16022026">0.3.4 - 16.02.2026</h2>
<ul>
<li>changed Go Version to 1.18</li>
<li>fixed <em><code>Search on all Drives on Windows</code></em> from 0.3.3, it</li>
<li>added Async Search</li>
<li>made color package public</li>
</ul>
<h2 id="033---15022026">0.3.3 - 15.02.2026</h2>
<ul>
<li>added JSON Shema</li>
<li>added File Options</li>
<li>Search on all Drives on Windows</li>
<li>added Tag Search</li>
</ul>
<h2 id="032---15022026">0.3.2 - 15.02.2026</h2>
<ul>
<li>little Fixes</li>
</ul>
<h2 id="031---15022026">0.3.1 - 15.02.2026</h2>
<h3 id="-features">✨ Features</h3>
<h4 id="runtime-custom-template-system">Runtime Custom Template System</h4>
<ul>
<li><strong>Custom Templates without Recompilation</strong>: Users can now create templates in <code>~/.finder/templates/</code> or <code>./.finder/templates/</code> without recompiling the program</li>
<li><strong>Automatic Template Discovery</strong>: New <code>.json5</code> files are automatically detected and loaded on startup</li>
<li><strong>User Templates Override</strong>: User-defined templates can override built-in templates with the same name</li>
<li><strong>Precedence System</strong>: User templates take precedence over built-in templates</li>
</ul>
<h4 id="cli-reorganization-modernization">CLI Reorganization & Modernization</h4>
<ul>
<li><strong>Modular CLI Architecture</strong>: Complete restructuring from monolithic design<ul>
<li><code>parser.go</code>: Dedicated argument parsing logic</li>
<li><code>handlers.go</code>: Isolated command handlers</li>
<li><code>commands.go</code>: Clean routing (reduced from 300+ to 60 lines)</li>
</ul></li>
<li><strong>Command Aliases</strong>: New shorter forms for common commands<ul>
<li><code>h</code>, <code>-h</code>, <code>--help</code> in addition to <code>help</code></li>
<li><code>ls</code> in addition to <code>list</code></li>
<li><code>--file</code> in addition to <code>-f</code></li>
<li><code>--config</code> in addition to <code>-c</code></li>
</ul></li>
<li><strong>CLIOptions Struct</strong>: Structured argument representation with predicates<ul>
<li><code>.IsHelp()</code>, <code>.IsList()</code>, <code>.IsCheck()</code>, <code>.IsFileLoad()</code>, <code>.IsDirectLoad()</code>, <code>.IsTemplateSearch()</code></li>
<li><code>.GetFileArg()</code>, <code>.GetDirectLoadArg()</code>, <code>.GetTemplateName()</code></li>
</ul></li>
<li><strong>Verbose Mode</strong>: New <code>--verbose</code> flag for extended output</li>
</ul>
<h4 id="enhanced-help-system">Enhanced Help System</h4>
<ul>
<li><strong>Better Help Structure</strong>: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS</li>
<li><strong>Table Layout</strong>: Improved readability with consistent formatting</li>
<li><strong>Custom Templates Info</strong>: Documentation for user template setup</li>
<li><strong>Detailed Descriptions</strong>: Each command with clear explanation</li>
</ul>
<h4 id="enhanced-list-check-commands">Enhanced List & Check Commands</h4>
<ul>
<li><strong>Separated Display</strong>: Built-in and custom templates are listed separately</li>
<li><strong>Template Sources</strong>: Source attribute shows whether template is built-in or custom</li>
<li><strong>Helpful Hints</strong>: Paths for custom template setup are displayed</li>
<li><strong>Improved Validation</strong>: Check command validates with source information</li>
</ul>
<h3 id="-testing">🧪 Testing</h3>
<ul>
<li><strong>40+ new unit tests</strong> for CLI parser logic</li>
<li><strong>Parser Tests</strong>: Comprehensive coverage for command recognition, flag parsing, argument extraction</li>
<li><strong>Integration Tests</strong>: End-to-end tests for command execution</li>
<li><strong>Routing Tests</strong>: Tests for handler mapping</li>
<li><strong>Error Handling Tests</strong>: Validation of error handling and user feedback</li>
</ul>
<h3 id="-documentation">📖 Documentation</h3>
<ul>
<li><strong>ARCHITECTURE.md</strong>: Detailed technical documentation of the new CLI structure</li>
<li><strong>REORGANIZATION.md</strong>: Comprehensive before/after comparison and explanation</li>
<li><strong>QUICKSTART.md</strong>: Practical guide for adding new commands</li>
<li><strong>CUSTOM_TEMPLATES.md</strong>: User guide for custom template creation</li>
<li><strong>Inline Code Comments</strong>: Improved code documentation</li>
</ul>
<h3 id="-infrastructure">🔧 Infrastructure</h3>
<ul>
<li><strong>Enhanced Template Loader</strong> (<code>templateloader.go</code>)<ul>
<li><code>LoadUserTemplates()</code>: Discovers user templates from filesystem</li>
<li><code>JSONtemplateLoaderWithUserTemplates()</code>: Intelligent loading with user override</li>
<li><code>LoadAllWithUserTemplates()</code>: Combined built-in + custom template discovery</li>
</ul></li>
<li><strong>Template Override Mechanism</strong>: User templates can replace built-in templates</li>
<li><strong>Graceful Error Handling</strong>: Missing user template directories are not fatal</li>
</ul>
<h3 id="-quality-improvements">🎯 Quality Improvements</h3>
<ul>
<li><strong>Clean Code Structure</strong>: Single Responsibility Principle consistently applied</li>
<li><strong>Better Testability</strong>: Each module can be tested in isolation</li>
<li><strong>Extensibility</strong>: New commands can be added in 5 simple steps</li>
<li><strong>Backward Compatibility</strong>: External API (<code>HandleCommand()</code>) unchanged</li>
</ul>
<h3 id="-user-experience">👥 User Experience</h3>
<ul>
<li><strong>Better Error Messages</strong>: Context-sensitive error messages with suggestions</li>
<li><strong>Helpful Hints</strong>: Tips for common tasks (e.g., where to place templates)</li>
<li><strong>Flexible Command Syntax</strong>: Multiple synonyms for each command</li>
<li><strong>Consistent Output Formatting</strong>: Unified design across all commands</li>
</ul>
<h3 id="-performance">📊 Performance</h3>
<ul>
<li><strong>No Recompilation Required</strong>: Custom templates are loaded at runtime</li>
<li><strong>Efficient Template Discovery</strong>: Fast filesystem traversal</li>
<li><strong>Minimal Overhead</strong>: Template loading has negligible performance impact</li>
</ul>
<h3 id="-bug-fixes-improvements">🐛 Bug Fixes & Improvements</h3>
<ul>
<li>Improved error handling in template loading</li>
<li>Better handling of missing or malformed user templates</li>
<li>Consistent error messages across all commands</li>
<li>Fixed edge cases in CLI argument parsing</li>
</ul>
<h3 id="-breaking-changes">📝 Breaking Changes</h3>
<ul>
<li><strong>No Breaking Changes</strong>: All existing commands work unchanged</li>
<li>Internal structure completely refactored, but public API remains stable</li>
</ul>
<h3 id="-highlights">🙏 Highlights</h3>
<p>This version brings the biggest improvement since 0.2.0:</p>
<ul>
<li>Users can now create their own templates</li>
<li>Codebase is more maintainable and extensible</li>
<li>Test coverage drastically improved</li>
</ul>
<hr>
<h2 id="030---23012026">0.3.0 - 23.01.2026</h2>
<p>Template System & CLI Foundations</p>
<h2 id="020---23012026">0.2.0 - 23.01.2026</h2>
<p>More Templates
Better Console Output
Help Message</p>
<h2 id="010---17112025">0.1.0 - 17.11.2025</h2>
<p>Programm Init</p>`,styles:[p]},creator:{id:"creator",type:"component",load:()=>m(()=>import("./creator-y2_09cSn.js"),__vite__mapDeps([0,1])),styles:[]},index:{id:"index",type:"component",load:()=>m(()=>import("./index-B0g_HJRt.js"),[]),styles:[p]},viewer:{id:"viewer",type:"component",load:()=>m(()=>import("./viewer-BKPpFfgS.js"),__vite__mapDeps([2,3])),styles:[]}};async function y(){const e=document.getElementById("app");if(e==null)throw new Error("Missing #app element");const n=window.PAGE_ID;if(!n){v(e);return}if(n==="__404__"){const s=Object.keys(g).filter(o=>o!=="__404__").map(o=>`
        <li>
          <a href="${o==="index"?"/":`/${o}`}">
            ${o}
          </a>
        </li>
      `).join("");e.innerHTML=`
    <main>
      <h1>404</h1>
      <p>Page not found.</p>

      <h2>Available pages</h2>
      <ul>
        ${s}
      </ul>

      <a href="/">Go home</a>
    </main>
  `;return}const t=g[n];if(!t){console.error(`[pages] Unknown page id: ${n}`),e.innerHTML=`
      <main>
        <h1>404</h1>
        <p>Page "${n}" not found.</p>
        <a href="/">Go home</a>
      </main>
    `;return}try{if(b(t.styles),t.type==="markdown"){e.innerHTML=`
      <article class="markdown">
        ${t.html}
      </article>
    `;return}await(await t.load()).default(e)}catch(s){console.error(`[pages] Failed to load page "${n}"`,s),e.innerHTML=`
      <main>
        <h1>Failed to load page</h1>
        <p>Could not load "${n}".</p>
        <a href="/">Go home</a>
      </main>
    `}}y();function v(e){e.innerHTML=`
      <main>
        <h1>404</h1>
        <p>No page id was provided.</p>
        <a href="/">Go home</a>
      </main>
    `}function b(e){console.log("[pages] loading styles:",e);for(const n of e){if(console.log("[pages] style:",n),document.head.querySelector(`link[data-page-style="${CSS.escape(n)}"]`))continue;const t=document.createElement("link");t.rel="stylesheet",t.href=n,t.dataset.pageStyle=n,document.head.appendChild(t)}}
