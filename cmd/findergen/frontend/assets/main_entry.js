const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./cacheviewer.js","./cacheviewer.css","./configeditor.js","./configeditor.css","./creator.js","./creator.css","./home.js","./home.css","./about.js","./mcappheader.js","./mcappheader.css","./index2.js","./worlds.js","./regexcreator.js","./regexcreator.css","./samfile.js","./jquery.module.js","./samfile.css","./markdowneditor.js","./markdowneditor.css","./tellraw.js","./tellraw.css","./viewer.js","./viewer.css"])))=>i.map(i=>d[i]);
const x="modulepreload",T=function(e,s){return new URL(e,s).href},j={},r=function(s,n,a){let u=Promise.resolve();if(n&&n.length>0){const p=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),i=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));u=Promise.allSettled(n.map(o=>{if(o=T(o,a),o in j)return;j[o]=!0;const c=o.endsWith(".css"),_=c?'[rel="stylesheet"]':"";if(!!a)for(let h=p.length-1;h>=0;h--){const f=p[h];if(f.href===o&&(!c||f.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${o}"]${_}`))return;const d=document.createElement("link");if(d.rel=c?"stylesheet":x,c||(d.as="script"),d.crossOrigin="",d.href=o,i&&d.setAttribute("nonce",i),document.head.appendChild(d),c)return new Promise((h,f)=>{d.addEventListener("load",h),d.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${o}`)))})}))}function g(p){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=p,window.dispatchEvent(l),!l.defaultPrevented)throw p}return u.then(p=>{for(const l of p||[])l.status==="rejected"&&g(l.reason);return s().catch(g)})},m=""+new URL("markdownrootstyle.css",import.meta.url).href,S=""+new URL("markdownstyle.css",import.meta.url).href,b={cacheviewer:{id:"cacheviewer",type:"component",load:()=>r(()=>import("./cacheviewer.js"),__vite__mapDeps([0,1]),import.meta.url),data:null,styles:[]},changelog:{id:"changelog",type:"markdown",html:'<h1 id="changelog">CHANGELOG</h1><p><em>The whole finder CHANGELOG</em></p><h2 id="newest-prob-0317">Newest prob 0.3.17</h2><ul><li>added regex support</li></ul><h2 id="0316---08092026">0.3.16 - 08.09.2026</h2><ul><li>added cache creation</li><li>added config editor</li><li>added cache viewer</li><li>Moved every site on the finder website to TSX instead</li><li>add code to the ssg plugin which runs on build time - 07.09.2026</li><li>the search function should return an array of</li><li>added size plugin for the frontend</li><li>added syntax highliting for the markdown codeblocks</li><li>updated some templates</li><li>renamed checksums file in the release from <code>SHA256SUMS</code> to <code>SHA256SUMS.txt</code></li><li>added some helpfule vite plugins</li><li>added file content checksum check</li><li>fixed that to old template warning because it showed up the finder and the template where in the same version</li><li>added SHA512 checksums</li></ul><h2 id="0315---02092025">0.3.15 - 02.09.2025</h2><ul><li>added new Templates</li><li>added a HTML Server with go backend to create and view all templates</li><li>added json output support to finder, just add <code>--json</code> to command</li><li>added tags and min version to a lot of the templates</li><li>the Templates are now saved as minified json</li></ul><h2 id="0314---25062026">0.3.14 - 25.06.2026</h2><h2 id="0313---22062026">0.3.13 - 22.06.2026</h2><h2 id="0312---22062026">0.3.12 - 22.06.2026</h2><h2 id="0311---10042026">0.3.11 - 10.04.2026</h2><h2 id="0310---10042026">0.3.10 - 10.04.2026</h2><h2 id="039---09042026">0.3.9 - 09.04.2026</h2><ul><li>fixed Binary Search</li></ul><h2 id="038---27022026">0.3.8 - 27.02.2026</h2><ul><li>added Checksums</li></ul><h2 id="037---24022026">0.3.7 - 24.02.2026</h2><ul><li>only for releasing</li></ul><h2 id="036---24022026">0.3.6 - 24.02.2026</h2><ul><li>added Size option to the Templates</li><li>updated README File</li><li>updates <code>CUSTOM_TEMPLATES</code></li><li>added a new entry to the Template: <strong>min finder version</strong> which should</li><li>added Version package</li></ul><h2 id="035---18022026">0.3.5 - 18.02.2026</h2><ul><li>made a Folder public for public finder modules</li><li>added Template for<ul><li>flax</li></ul></li><li>added Time which the searching took</li><li>resturctured the argparser</li><li>added version Command</li><li>added Argparser package</li><li>removed loading templates directly from the Console or via a custom filepath!</li><li>json output is broken in this Release, but will we fixed in future Releases</li><li>formatted the tag Search output correctly</li></ul><h2 id="034---16022026">0.3.4 - 16.02.2026</h2><ul><li>changed Go Version to 1.18</li><li>fixed <em><code>Search on all Drives on Windows</code></em> from 0.3.3, it</li><li>added Async Search</li><li>made color package public</li></ul><h2 id="033---15022026">0.3.3 - 15.02.2026</h2><ul><li>added JSON Shema</li><li>added File Options</li><li>Search on all Drives on Windows</li><li>added Tag Search</li></ul><h2 id="032---15022026">0.3.2 - 15.02.2026</h2><ul><li>little Fixes</li></ul><h2 id="031---15022026">0.3.1 - 15.02.2026</h2><h3 id="-features">✨ Features</h3><h4 id="runtime-custom-template-system">Runtime Custom Template System</h4><ul><li><strong>Custom Templates without Recompilation</strong>: Users can now create templates in <code>~/.finder/templates/</code> or <code>./.finder/templates/</code> without recompiling the program</li><li><strong>Automatic Template Discovery</strong>: New <code>.json5</code> files are automatically detected and loaded on startup</li><li><strong>User Templates Override</strong>: User-defined templates can override built-in templates with the same name</li><li><strong>Precedence System</strong>: User templates take precedence over built-in templates</li></ul><h4 id="cli-reorganization-modernization">CLI Reorganization & Modernization</h4><ul><li><strong>Modular CLI Architecture</strong>: Complete restructuring from monolithic design<ul><li><code>parser.go</code>: Dedicated argument parsing logic</li><li><code>handlers.go</code>: Isolated command handlers</li><li><code>commands.go</code>: Clean routing (reduced from 300+ to 60 lines)</li></ul></li><li><strong>Command Aliases</strong>: New shorter forms for common commands<ul><li><code>h</code>, <code>-h</code>, <code>--help</code> in addition to <code>help</code></li><li><code>ls</code> in addition to <code>list</code></li><li><code>--file</code> in addition to <code>-f</code></li><li><code>--config</code> in addition to <code>-c</code></li></ul></li><li><strong>CLIOptions Struct</strong>: Structured argument representation with predicates<ul><li><code>.IsHelp()</code>, <code>.IsList()</code>, <code>.IsCheck()</code>, <code>.IsFileLoad()</code>, <code>.IsDirectLoad()</code>, <code>.IsTemplateSearch()</code></li><li><code>.GetFileArg()</code>, <code>.GetDirectLoadArg()</code>, <code>.GetTemplateName()</code></li></ul></li><li><strong>Verbose Mode</strong>: New <code>--verbose</code> flag for extended output</li></ul><h4 id="enhanced-help-system">Enhanced Help System</h4><ul><li><strong>Better Help Structure</strong>: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS</li><li><strong>Table Layout</strong>: Improved readability with consistent formatting</li><li><strong>Custom Templates Info</strong>: Documentation for user template setup</li><li><strong>Detailed Descriptions</strong>: Each command with clear explanation</li></ul><h4 id="enhanced-list-check-commands">Enhanced List & Check Commands</h4><ul><li><strong>Separated Display</strong>: Built-in and custom templates are listed separately</li><li><strong>Template Sources</strong>: Source attribute shows whether template is built-in or custom</li><li><strong>Helpful Hints</strong>: Paths for custom template setup are displayed</li><li><strong>Improved Validation</strong>: Check command validates with source information</li></ul><h3 id="-testing">🧪 Testing</h3><ul><li><strong>40+ new unit tests</strong> for CLI parser logic</li><li><strong>Parser Tests</strong>: Comprehensive coverage for command recognition, flag parsing, argument extraction</li><li><strong>Integration Tests</strong>: End-to-end tests for command execution</li><li><strong>Routing Tests</strong>: Tests for handler mapping</li><li><strong>Error Handling Tests</strong>: Validation of error handling and user feedback</li></ul><h3 id="-documentation">📖 Documentation</h3><ul><li><strong>ARCHITECTURE.md</strong>: Detailed technical documentation of the new CLI structure</li><li><strong>REORGANIZATION.md</strong>: Comprehensive before/after comparison and explanation</li><li><strong>QUICKSTART.md</strong>: Practical guide for adding new commands</li><li><strong>CUSTOM_TEMPLATES.md</strong>: User guide for custom template creation</li><li><strong>Inline Code Comments</strong>: Improved code documentation</li></ul><h3 id="-infrastructure">🔧 Infrastructure</h3><ul><li><strong>Enhanced Template Loader</strong> (<code>templateloader.go</code>)<ul><li><code>LoadUserTemplates()</code>: Discovers user templates from filesystem</li><li><code>JSONtemplateLoaderWithUserTemplates()</code>: Intelligent loading with user override</li><li><code>LoadAllWithUserTemplates()</code>: Combined built-in + custom template discovery</li></ul></li><li><strong>Template Override Mechanism</strong>: User templates can replace built-in templates</li><li><strong>Graceful Error Handling</strong>: Missing user template directories are not fatal</li></ul><h3 id="-quality-improvements">🎯 Quality Improvements</h3><ul><li><strong>Clean Code Structure</strong>: Single Responsibility Principle consistently applied</li><li><strong>Better Testability</strong>: Each module can be tested in isolation</li><li><strong>Extensibility</strong>: New commands can be added in 5 simple steps</li><li><strong>Backward Compatibility</strong>: External API (<code>HandleCommand()</code>) unchanged</li></ul><h3 id="-user-experience">👥 User Experience</h3><ul><li><strong>Better Error Messages</strong>: Context-sensitive error messages with suggestions</li><li><strong>Helpful Hints</strong>: Tips for common tasks (e.g., where to place templates)</li><li><strong>Flexible Command Syntax</strong>: Multiple synonyms for each command</li><li><strong>Consistent Output Formatting</strong>: Unified design across all commands</li></ul><h3 id="-performance">📊 Performance</h3><ul><li><strong>No Recompilation Required</strong>: Custom templates are loaded at runtime</li><li><strong>Efficient Template Discovery</strong>: Fast filesystem traversal</li><li><strong>Minimal Overhead</strong>: Template loading has negligible performance impact</li></ul><h3 id="-bug-fixes-improvements">🐛 Bug Fixes & Improvements</h3><ul><li>Improved error handling in template loading</li><li>Better handling of missing or malformed user templates</li><li>Consistent error messages across all commands</li><li>Fixed edge cases in CLI argument parsing</li></ul><h3 id="-breaking-changes">📝 Breaking Changes</h3><ul><li><strong>No Breaking Changes</strong>: All existing commands work unchanged</li><li>Internal structure completely refactored, but public API remains stable</li></ul><h3 id="-highlights">🙏 Highlights</h3><p>This version brings the biggest improvement since 0.2.0:</p><ul><li>Users can now create their own templates</li><li>Codebase is more maintainable and extensible</li><li>Test coverage drastically improved</li></ul><hr><h2 id="030---23012026">0.3.0 - 23.01.2026</h2><p>Template System & CLI Foundations</p><h2 id="020---23012026">0.2.0 - 23.01.2026</h2><p>More Templates Better Console Output Help Message</p><h2 id="010---17112025">0.1.0 - 17.11.2025</h2><p>Programm Init</p><h2 id="000---30112025">0.0.0 - 30.11.2025</h2><p>the start</p>',styles:[m]},configeditor:{id:"configeditor",type:"component",load:()=>r(()=>import("./configeditor.js"),__vite__mapDeps([2,3]),import.meta.url),data:null,styles:[S]},creator:{id:"creator",type:"component",load:()=>r(()=>import("./creator.js"),__vite__mapDeps([4,5]),import.meta.url),data:null,styles:[]},"docs/config":{id:"docs/config",type:"markdown",html:'<h1 id="config-fields">Config fields</h1><h2 id="port">Port</h2><p>Port for the findergen server to view and create templates.</p><h2 id="cache">Cache</h2><p>When set to true, the results of will be saved as a cache and can then be used afterwards</p><h2 id="create-cache-database">Create Cache Database</h2><p>When set to true, the cache data of finder will be saved in a Git DB. Git is required for this.</p><h2 id="finder-instances">Finder Instances</h2><p>Finder instances which will run at the same time when creating cache for all templates</p>',styles:[m]},"docs/index":{id:"docs/index",type:"markdown",html:'<h1 id="finder-docs">Finder Docs</h1><p><em>soon</em></p>',styles:[m]},home:{id:"home",type:"component",load:()=>r(()=>import("./home.js"),__vite__mapDeps([6,7]),import.meta.url),data:null,styles:[]},index:{id:"index",type:"component",load:()=>r(()=>import("./index.js"),[],import.meta.url),data:`<pre><code class="language-md"><span class="hljs-section"># AGENTS — Finder Template Authoring Guide</span>

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
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;project-*&quot;\`</span> for wildcard matching

Important:

<span class="hljs-bullet">-</span> This is checked with glob-like matching, not arbitrary regex.
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

\`\`\`json5
{
  name: &quot;*&quot;,
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
- one or more \`*.go\` files

Not a huge list of optional files.

### Avoid false positives

If your project has a \`README.md\` in many folders, do not require it
unless it is central to your pattern.

### Use wildcards carefully

\`\`\`json5
&quot;name&quot;: &quot;*.git&quot; // if you intended a hidden git folder, this is special-case logic
\`\`\`

Use patterns like \`&quot;*&quot;\`, \`&quot;src&quot;\`, \`&quot;*.ts&quot;\`, \`&quot;package.json&quot;\` rather
than complex regex-style expressions.

---

## 6) Examples

### Example A: Git repository

\`\`\`json5
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
\`\`\`

### Example B: Node project

\`\`\`json5
{
  description: &quot;Node.js project&quot;,
  name: &quot;*&quot;,
  files: [&quot;package.json&quot;, &quot;src&quot;, &quot;README.md&quot;],
  tags: [&quot;node&quot;, &quot;javascript&quot;, &quot;typescript&quot;],
}
\`\`\`

### Example C: Python project

\`\`\`json5
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
\`\`\`

### Example D: strict checksum template

\`\`\`json5
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
  min_</span>version: &quot;0.3.16&quot;,
}
<span class="hljs-code">\`\`\`

This matches only folders containing a file whose SHA256 matches
exactly.

### Example E: custom monorepo

\`\`\`</span>json5
{
  description: &quot;Monorepo with apps and packages&quot;,
  name: &quot;<span class="hljs-emphasis">*&quot;,
  files: [&quot;pnpm-workspace.yaml&quot;, &quot;package.json&quot;],
  folders: [
    {
      name: &quot;apps&quot;,
      folders: [
        {
          name: &quot;*</span>&quot;,
<span class="hljs-code">          files: [&quot;package.json&quot;],
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
\`\`\`
</span>
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

<span class="hljs-section">### Mistake 3: using regex-like expressions instead of glob matching</span>

Finder uses glob-like matching through <span class="hljs-code">\`path.Match\`</span>, not full regex.

Use:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`*.ts\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`package.json\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`src\`</span>

not arbitrary regex syntax.

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
</code></pre>`,styles:[m]},"mcapp/about":{id:"mcapp/about",type:"component",load:()=>r(()=>import("./about.js"),__vite__mapDeps([8,9,10]),import.meta.url),data:null,styles:[]},"mcapp/index":{id:"mcapp/index",type:"component",load:()=>r(()=>import("./index2.js"),__vite__mapDeps([11,9,10]),import.meta.url),data:null,styles:[]},"mcapp/worlds":{id:"mcapp/worlds",type:"component",load:()=>r(()=>import("./worlds.js"),__vite__mapDeps([12,9,10]),import.meta.url),data:null,styles:[]},readme:{id:"readme",type:"markdown",html:`<p></p><h1 id="finder">finder</h1><p><a href="https://github.com/ShadowDara/finder/actions/workflows/release.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/release.yml/badge.svg" alt="Build Status"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml/badge.svg" alt="Build Check"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml/badge.svg" alt="Deploy GitHub Pages"></a><a href="https://github.com/shadowdara/finder/graphs/contributors" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/contributors/shadowdara/finder" alt="GitHub contributors"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/commit-activity/m/shadowdara/finder" alt="GitHub commit activity (branch)"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/last-commit/shadowdara/finder" alt="Last Commit"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/downloads/shadowdara/finder/total?logo=github" alt="GitHub all releases"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/v/release/shadowdara/finder?logo=github" alt="GitHub release (with filter)"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/languages/code-size/shadowdara/finder?logo=github" alt="GitHub code size in bytes"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/repo-size/shadowdara/finder?logo=github" alt="GitHub repo size"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/lang-count/shadowdara/finder" alt="Lang Count"></a><img src="https://img.shields.io/github/stars/shadowdara/finder" alt="GitHub Repo stars"> <img src="https://img.shields.io/github/forks/shadowdara/finder" alt="GitHub forks"> <img src="https://badges.ws/maintenance/yes/2026" alt="Maintained"> <img src="https://badges.ws/handmade" alt="Handmade"> <a href="https://pkg.go.dev/github.com/shadowdara/finder" target="_blank" rel="noopener noreferrer"><img src="https://pkg.go.dev/badge/github.com/shadowdara/finder" alt="Go Reference"></a></p><p>Finder is a small command-line tool written in Go to locate projects based on predefined folder/file structure templates.</p><p>In short: you can search for repositories (e.g. <code>.git</code>), project layouts, or your own custom structures using templates.</p><h2 id="commiting">Commiting</h2><p>feel free to help the Project by committing Code for the project are Templates. Feel although free to submit Templates via Issues!</p><h2 id="features">Features</h2><ul><li>Searches using JSON5 templates stored in <code>internal/structure/templates</code>.</li><li>Supports user templates in the OS-specific configuration folder.</li><li>Lightweight, tested, and easy to extend.</li><li>**Finder can although be used to search single files and is a lot faster</li></ul><h2 id="requirements">Requirements</h2><ul><li>Go 1.18 or newer</li></ul><h2 id="installation">Installation</h2><p>Build from source:</p><pre><code class="language-sh">go build ./cmd/finder</code></pre><p>Or install with <code>go install</code> (Go 1.18+):</p><pre><code class="language-sh">go install github.com/shadowdara/finder/cmd/finder@latest</code></pre><p>The produced binary is <code>finder</code> (on Windows <code>finder.exe</code>).</p><h2 id="usage">Usage</h2><p>Basic syntax:</p><pre><code class="language-sh">finder &lt;template-name&gt;</code></pre><p>Example — find Git repositories:</p><pre><code class="language-sh">finder git</code></pre><p>The program searches the current directory recursively and prints matches based on the template name.</p><h2 id="templates">Templates</h2><p>Default templates are stored in <code>internal/structure/templates</code>. Templates are JSON5 files with fields such as <code>name</code>, <code>files</code>, and <code>folders</code>. A simple template to find Git repositories looks like:</p><pre><code class="language-json"><span class="hljs-comment">// Template for Git</span>
<span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;name&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;*&quot;</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;folders&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-punctuation">{</span> <span class="hljs-attr">&quot;name&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;.git&quot;</span> <span class="hljs-punctuation">}</span><span class="hljs-punctuation">]</span>
<span class="hljs-punctuation">}</span></code></pre><p>And a full template looks like this. Empty Value are not required in the Template. The <code>description</code> will be displayed in the program when searching for the Template and although when displaying all templates. The <code>command</code> runs in the Structure Directory after the Structure is found. The Entrywill only be added is the <code>command</code> returns <code>0</code> when <code>invert_command</code> is <code>false</code>, else <code>1</code>.</p><pre><code class="language-json"><span class="hljs-comment">// Template for Git</span>
<span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;name&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;*&quot;</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;description&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;&quot;</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;folders&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-punctuation">{</span> <span class="hljs-attr">&quot;name&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;.git&quot;</span> <span class="hljs-punctuation">}</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;files&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">[</span><span class="hljs-punctuation">]</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;command&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-string">&quot;&quot;</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;invert_command&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">false</span></span>
<span class="hljs-punctuation">}</span></code></pre><p></p><p></p><p>Then call <code>finder<template-name></template-name></code> to use them.</p><h2 id="config">Config</h2><p>In Version <strong>v0.3.15</strong> and heigher, finder has a global config in <code>~/.finder/config.json5</code>. In case the file doesnt exist, it will result in the default config with looks like this:</p><pre><code class="language-json"><span class="hljs-comment">// And it supports comments</span>
<span class="hljs-punctuation">{</span>
  <span class="hljs-attr">&quot;port&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-number">8080</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">&quot;cache&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">true</span></span><span class="hljs-punctuation">,</span>

  <span class="hljs-comment">// Use git as a database to safe the cache data (maybe cool)</span>
  <span class="hljs-comment">// for stats or etc (idk)</span>
  <span class="hljs-comment">// You dont have to use it obviously</span>
  <span class="hljs-attr">&quot;create_cache_db&quot;</span><span class="hljs-punctuation">:</span> <span class="hljs-literal"><span class="hljs-keyword">false</span></span>
<span class="hljs-punctuation">}</span></code></pre><p>For more and detailed Information and more config values check out the config editor <a href="https://shadowdara.github.io/finder/configeditor" target="_blank" rel="noopener noreferrer">here</a></p><h2 id="mistakes">Mistakes</h2><p>I thing i would change is to use raw JSON for the templates instead of JSON with comments, which i called JSON5 back then, but it is no real JSON5.</p><h2 id="development">Development</h2><p>Run tests:</p><pre><code class="language-sh">go <span class="hljs-built_in">test</span> ./...</code></pre><p>Generate coverage report:</p><pre><code class="language-sh">go <span class="hljs-built_in">test</span> -coverprofile=coverage ./...
go tool cover -html=coverage</code></pre><p>Build:</p><pre><code class="language-sh">go build ./cmd/finder</code></pre><p>Check the available Templates</p><pre><code class="language-sh">go run ./cmd/finder check</code></pre><h2 id="contributing">Contributing</h2><ul><li>Found a missing or inaccurate template? Please open an issue.</li><li>Add new templates via PR. Keep them in JSON5 and provide a short</li></ul><h2 id="roadmap-ideas">Roadmap / Ideas</h2><ul><li>use temporary Template via the Command Line</li><li>Caching/Indexing for faster searches</li><li>Web UI for template management</li><li>Template schema and validation</li></ul><h2 id="license">License</h2><p>See <code>LICENSE</code>.</p><hr><p>Project: <code>https://github.com/shadowdara/finder</code></p><h2 id="extra-info">Extra Info</h2><p>The Project <a href="https://github.com/shadowdara/fs-tools" target="_blank" rel="noopener noreferrer">fs-tools</a> was more or less the prototype for finder.</p><h2 id="info-video">Info Video</h2><p>(<em>a Youtube Video</em>)</p><p><a href="https://www.youtube.com/watch?v=oIRgAYv-mOA" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/oIRgAYv-mOA/0.jpg" alt="INFO Video 1 about Finder"></a></p>`,styles:[m]},regexcreator:{id:"regexcreator",type:"component",load:()=>r(()=>import("./regexcreator.js"),__vite__mapDeps([13,14]),import.meta.url),data:null,styles:[]},samfile:{id:"samfile",type:"component",load:()=>r(()=>import("./samfile.js"),__vite__mapDeps([15,16,17]),import.meta.url),data:null,styles:[]},"tools/markdowneditor":{id:"tools/markdowneditor",type:"component",load:()=>r(()=>import("./markdowneditor.js"),__vite__mapDeps([18,19]),import.meta.url),data:null,styles:[]},"tools/minecraft/tellraw":{id:"tools/minecraft/tellraw",type:"component",load:()=>r(()=>import("./tellraw.js"),__vite__mapDeps([20,16,21]),import.meta.url),data:null,styles:[]},viewer:{id:"viewer",type:"component",load:()=>r(()=>import("./viewer.js"),__vite__mapDeps([22,23]),import.meta.url),data:null,styles:[]}},y=Symbol("html");function t(e,s,...n){if(typeof e=="function")return e({...s??{},children:n});const a=new Set(["disabled","checked","selected","readonly","required","multiple","hidden","autofocus","open"]),u=Object.entries(s??{}).filter(([i])=>i!=="children"&&i!=="key").map(([i,o])=>{if(o==null)return"";const c=i==="className"?"class":i;return typeof o=="boolean"&&a.has(c)?o?` ${c}`:"":typeof o=="boolean"?` ${c}="${o}"`:o===!1?"":` ${c}="${C(String(o))}"`}).join(""),g=n.flat(1/0).filter(i=>i!=null&&i!==!1).map(i=>w(i)?i.value:v(String(i))).join(""),l=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]).has(e)?`<${e}${u}>`:`<${e}${u}>${g}</${e}>`;return q(l)}function E(e){const s=(e.children??[]).flat(1/0).filter(n=>n!=null&&n!==!1).map(n=>w(n)?n.value:v(String(n))).join("");return q(s)}function q(e){return{[y]:!0,value:e,toString(){return e}}}function w(e){return typeof e=="object"&&e!==null&&y in e}function C(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function v(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function G(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function k(e){return q(e)}function I(e){for(const s of e){const n=new URL(s,import.meta.url).href;if(document.head.querySelector(`link[data-page-style="${CSS.escape(n)}"]`))continue;const a=document.createElement("link");a.rel="stylesheet",a.href=n,a.dataset.pageStyle=n,document.head.appendChild(a)}}function A(e){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"No page id was provided."),t("a",{href:"/"},"Go home"))}function L(e,s){const n=Object.keys(s).filter(a=>a!=="__404__").map(a=>t("li",null,t("a",{href:a==="index"?"/":`/${a}`},a))).join("");e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page not found."),t("h2",null,"Available pages"),t("ul",null,k(n)),t("a",{href:"/"},"Go home"))}function O(e,s){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page ",s," not found."),t("a",{href:"/"},"Go home"))}function R(e,s,n){console.error(`[pages] Failed to load page "${s}"`,n),e.innerHTML=t("main",null,t("h1",null,"Failed to load page"),t("p",null,'Could not load "$',s,'".'),t("a",{href:"/"},"Go home"),t("pre",null,`[pages] Failed to load page "${s}"`),t("pre",null,n))}function P(e,s){s.type==="markdown"&&(e.innerHTML=t(E,null,t("a",{href:"../"},"Home"),t("article",{class:"markdown"},k(s.html??""))))}async function F(){const e=document.getElementById("app");if(e==null)throw new Error("Missing #app element");const s=window.PAGE_ID;if(!s){A(e);return}if(s==="__404__"){L(e,b);return}const n=b[s];if(!n){console.error(`[pages] Unknown page id: ${s}`),O(e,s);return}try{if(I(n.styles),n.type==="markdown"){P(e,n);return}await(await n.load()).default(e,n.data)}catch(a){R(e,s,a)}}F();export{E as F,G as e,t as j,k as r};
