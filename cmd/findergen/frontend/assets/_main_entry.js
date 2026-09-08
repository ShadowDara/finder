const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./cacheviewer.js","./cacheviewer.css","./configeditor.js","./configeditor.css","./creator.js","./creator.css","./home.js","./home.css","./samfile.js","./jquery.module.js","./samfile.css","./markdowneditor.js","./markdowneditor.css","./tellraw.js","./tellraw.css","./viewer.js","./viewer.css"])))=>i.map(i=>d[i]);
const _="modulepreload",S=function(e,r){return new URL(e,r).href},b={},d=function(r,n,s){let m=Promise.resolve();if(n&&n.length>0){const c=document.getElementsByTagName("link"),i=document.querySelector("meta[property=csp-nonce]"),o=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));m=Promise.allSettled(n.map(a=>{if(a=S(a,s),a in b)return;b[a]=!0;const l=a.endsWith(".css"),x=l?'[rel="stylesheet"]':"";if(!!s)for(let h=c.length-1;h>=0;h--){const f=c[h];if(f.href===a&&(!l||f.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${a}"]${x}`))return;const p=document.createElement("link");if(p.rel=l?"stylesheet":_,l||(p.as="script"),p.crossOrigin="",p.href=a,o&&p.setAttribute("nonce",o),document.head.appendChild(p),l)return new Promise((h,f)=>{p.addEventListener("load",h),p.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${a}`)))})}))}function g(c){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=c,window.dispatchEvent(i),!i.defaultPrevented)throw c}return m.then(c=>{for(const i of c||[])i.status==="rejected"&&g(i.reason);return r().catch(g)})},u=""+new URL("markdownrootstyle.css",import.meta.url).href,E=""+new URL("markdownstyle.css",import.meta.url).href,w={cacheviewer:{id:"cacheviewer",type:"component",load:()=>d(()=>import("./cacheviewer.js"),__vite__mapDeps([0,1]),import.meta.url),data:null,styles:[]},changelog:{id:"changelog",type:"markdown",html:'<h1 id="changelog">CHANGELOG</h1><p><em>The whole finder CHANGELOG</em></p><h2 id="newest-version-prob-0316">Newest Version : prob 0.3.16</h2><ul><li>added cache creation</li><li>added config editor</li><li>added cache viewer</li><li>Moved every site on the finder website to TSX instead</li><li>add code to the ssg plugin which runs on build time - 07.09.2026</li><li>the search function should return an array of</li><li>added size plugin for the frontend</li><li>added syntax highliting for the markdown codeblocks</li><li>updated some templates</li><li>renamed checksums file in the release from <code>SHA256SUMS</code> to <code>SHA256SUMS.txt</code></li><li>added some helpfule vite plugins</li><li>added file content checksum check</li><li>fixed that to old template warning because it showed up the finder and the template where in the same version</li></ul><h2 id="0315---02092025">0.3.15 - 02.09.2025</h2><ul><li>added new Templates</li><li>added a HTML Server with go backend to create and view all templates</li><li>added json output support to finder, just add <code>--json</code> to command</li><li>added tags and min version to a lot of the templates</li><li>the Templates are now saved as minified json</li></ul><h2 id="0314---25062026">0.3.14 - 25.06.2026</h2><h2 id="0313---22062026">0.3.13 - 22.06.2026</h2><h2 id="0312---22062026">0.3.12 - 22.06.2026</h2><h2 id="0311---10042026">0.3.11 - 10.04.2026</h2><h2 id="0310---10042026">0.3.10 - 10.04.2026</h2><h2 id="039---09042026">0.3.9 - 09.04.2026</h2><ul><li>fixed Binary Search</li></ul><h2 id="038---27022026">0.3.8 - 27.02.2026</h2><ul><li>added Checksums</li></ul><h2 id="037---24022026">0.3.7 - 24.02.2026</h2><ul><li>only for releasing</li></ul><h2 id="036---24022026">0.3.6 - 24.02.2026</h2><ul><li>added Size option to the Templates</li><li>updated README File</li><li>updates <code>CUSTOM_TEMPLATES</code></li><li>added a new entry to the Template: <strong>min finder version</strong> which should</li><li>added Version package</li></ul><h2 id="035---18022026">0.3.5 - 18.02.2026</h2><ul><li>made a Folder public for public finder modules</li><li>added Template for<ul><li>flax</li></ul></li><li>added Time which the searching took</li><li>resturctured the argparser</li><li>added version Command</li><li>added Argparser package</li><li>removed loading templates directly from the Console or via a custom filepath!</li><li>json output is broken in this Release, but will we fixed in future Releases</li><li>formatted the tag Search output correctly</li></ul><h2 id="034---16022026">0.3.4 - 16.02.2026</h2><ul><li>changed Go Version to 1.18</li><li>fixed <em><code>Search on all Drives on Windows</code></em> from 0.3.3, it</li><li>added Async Search</li><li>made color package public</li></ul><h2 id="033---15022026">0.3.3 - 15.02.2026</h2><ul><li>added JSON Shema</li><li>added File Options</li><li>Search on all Drives on Windows</li><li>added Tag Search</li></ul><h2 id="032---15022026">0.3.2 - 15.02.2026</h2><ul><li>little Fixes</li></ul><h2 id="031---15022026">0.3.1 - 15.02.2026</h2><h3 id="-features">✨ Features</h3><h4 id="runtime-custom-template-system">Runtime Custom Template System</h4><ul><li><strong>Custom Templates without Recompilation</strong>: Users can now create templates in <code>~/.finder/templates/</code> or <code>./.finder/templates/</code> without recompiling the program</li><li><strong>Automatic Template Discovery</strong>: New <code>.json5</code> files are automatically detected and loaded on startup</li><li><strong>User Templates Override</strong>: User-defined templates can override built-in templates with the same name</li><li><strong>Precedence System</strong>: User templates take precedence over built-in templates</li></ul><h4 id="cli-reorganization-modernization">CLI Reorganization & Modernization</h4><ul><li><strong>Modular CLI Architecture</strong>: Complete restructuring from monolithic design<ul><li><code>parser.go</code>: Dedicated argument parsing logic</li><li><code>handlers.go</code>: Isolated command handlers</li><li><code>commands.go</code>: Clean routing (reduced from 300+ to 60 lines)</li></ul></li><li><strong>Command Aliases</strong>: New shorter forms for common commands<ul><li><code>h</code>, <code>-h</code>, <code>--help</code> in addition to <code>help</code></li><li><code>ls</code> in addition to <code>list</code></li><li><code>--file</code> in addition to <code>-f</code></li><li><code>--config</code> in addition to <code>-c</code></li></ul></li><li><strong>CLIOptions Struct</strong>: Structured argument representation with predicates<ul><li><code>.IsHelp()</code>, <code>.IsList()</code>, <code>.IsCheck()</code>, <code>.IsFileLoad()</code>, <code>.IsDirectLoad()</code>, <code>.IsTemplateSearch()</code></li><li><code>.GetFileArg()</code>, <code>.GetDirectLoadArg()</code>, <code>.GetTemplateName()</code></li></ul></li><li><strong>Verbose Mode</strong>: New <code>--verbose</code> flag for extended output</li></ul><h4 id="enhanced-help-system">Enhanced Help System</h4><ul><li><strong>Better Help Structure</strong>: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS</li><li><strong>Table Layout</strong>: Improved readability with consistent formatting</li><li><strong>Custom Templates Info</strong>: Documentation for user template setup</li><li><strong>Detailed Descriptions</strong>: Each command with clear explanation</li></ul><h4 id="enhanced-list-check-commands">Enhanced List & Check Commands</h4><ul><li><strong>Separated Display</strong>: Built-in and custom templates are listed separately</li><li><strong>Template Sources</strong>: Source attribute shows whether template is built-in or custom</li><li><strong>Helpful Hints</strong>: Paths for custom template setup are displayed</li><li><strong>Improved Validation</strong>: Check command validates with source information</li></ul><h3 id="-testing">🧪 Testing</h3><ul><li><strong>40+ new unit tests</strong> for CLI parser logic</li><li><strong>Parser Tests</strong>: Comprehensive coverage for command recognition, flag parsing, argument extraction</li><li><strong>Integration Tests</strong>: End-to-end tests for command execution</li><li><strong>Routing Tests</strong>: Tests for handler mapping</li><li><strong>Error Handling Tests</strong>: Validation of error handling and user feedback</li></ul><h3 id="-documentation">📖 Documentation</h3><ul><li><strong>ARCHITECTURE.md</strong>: Detailed technical documentation of the new CLI structure</li><li><strong>REORGANIZATION.md</strong>: Comprehensive before/after comparison and explanation</li><li><strong>QUICKSTART.md</strong>: Practical guide for adding new commands</li><li><strong>CUSTOM_TEMPLATES.md</strong>: User guide for custom template creation</li><li><strong>Inline Code Comments</strong>: Improved code documentation</li></ul><h3 id="-infrastructure">🔧 Infrastructure</h3><ul><li><strong>Enhanced Template Loader</strong> (<code>templateloader.go</code>)<ul><li><code>LoadUserTemplates()</code>: Discovers user templates from filesystem</li><li><code>JSONtemplateLoaderWithUserTemplates()</code>: Intelligent loading with user override</li><li><code>LoadAllWithUserTemplates()</code>: Combined built-in + custom template discovery</li></ul></li><li><strong>Template Override Mechanism</strong>: User templates can replace built-in templates</li><li><strong>Graceful Error Handling</strong>: Missing user template directories are not fatal</li></ul><h3 id="-quality-improvements">🎯 Quality Improvements</h3><ul><li><strong>Clean Code Structure</strong>: Single Responsibility Principle consistently applied</li><li><strong>Better Testability</strong>: Each module can be tested in isolation</li><li><strong>Extensibility</strong>: New commands can be added in 5 simple steps</li><li><strong>Backward Compatibility</strong>: External API (<code>HandleCommand()</code>) unchanged</li></ul><h3 id="-user-experience">👥 User Experience</h3><ul><li><strong>Better Error Messages</strong>: Context-sensitive error messages with suggestions</li><li><strong>Helpful Hints</strong>: Tips for common tasks (e.g., where to place templates)</li><li><strong>Flexible Command Syntax</strong>: Multiple synonyms for each command</li><li><strong>Consistent Output Formatting</strong>: Unified design across all commands</li></ul><h3 id="-performance">📊 Performance</h3><ul><li><strong>No Recompilation Required</strong>: Custom templates are loaded at runtime</li><li><strong>Efficient Template Discovery</strong>: Fast filesystem traversal</li><li><strong>Minimal Overhead</strong>: Template loading has negligible performance impact</li></ul><h3 id="-bug-fixes-improvements">🐛 Bug Fixes & Improvements</h3><ul><li>Improved error handling in template loading</li><li>Better handling of missing or malformed user templates</li><li>Consistent error messages across all commands</li><li>Fixed edge cases in CLI argument parsing</li></ul><h3 id="-breaking-changes">📝 Breaking Changes</h3><ul><li><strong>No Breaking Changes</strong>: All existing commands work unchanged</li><li>Internal structure completely refactored, but public API remains stable</li></ul><h3 id="-highlights">🙏 Highlights</h3><p>This version brings the biggest improvement since 0.2.0:</p><ul><li>Users can now create their own templates</li><li>Codebase is more maintainable and extensible</li><li>Test coverage drastically improved</li></ul><hr><h2 id="030---23012026">0.3.0 - 23.01.2026</h2><p>Template System & CLI Foundations</p><h2 id="020---23012026">0.2.0 - 23.01.2026</h2><p>More Templates Better Console Output Help Message</p><h2 id="010---17112025">0.1.0 - 17.11.2025</h2><p>Programm Init</p><h2 id="000---30112025">0.0.0 - 30.11.2025</h2><p>the start</p>',styles:[u]},configeditor:{id:"configeditor",type:"component",load:()=>d(()=>import("./configeditor.js"),__vite__mapDeps([2,3]),import.meta.url),data:null,styles:[E]},creator:{id:"creator",type:"component",load:()=>d(()=>import("./creator.js"),__vite__mapDeps([4,5]),import.meta.url),data:null,styles:[]},"docs/config":{id:"docs/config",type:"markdown",html:'<h1 id="config-fields">Config fields</h1><h2 id="port">Port</h2><p>Port for the findergen server to view and create templates.</p><h2 id="cache">Cache</h2><p>When set to true, the results of will be saved as a cache and can then be used afterwards</p><h2 id="create-cache-database">Create Cache Database</h2><p>When set to true, the cache data of finder will be saved in a Git DB. Git is required for this.</p><h2 id="finder-instances">Finder Instances</h2><p>Finder instances which will run at the same time when creating cache for all templates</p>',styles:[u]},"docs/index":{id:"docs/index",type:"markdown",html:'<h1 id="finder-docs">Finder Docs</h1><p><em>soon</em></p>',styles:[u]},home:{id:"home",type:"component",load:()=>d(()=>import("./home.js"),__vite__mapDeps([6,7]),import.meta.url),data:null,styles:[]},index:{id:"index",type:"component",load:()=>d(()=>import("./index.js"),[],import.meta.url),data:`# AGENTS — Finder Template Authoring Guide\r
\r
This document is for AI assistants such as ChatGPT, Claude, Copilot,\r
and similar tools that need to create valid Finder templates.\r
\r
Goal:\r
\r
- create Finder-compatible JSON5 templates\r
- work with all supported template features\r
- prefer valid, minimal, and robust patterns\r
- avoid false positives and over-constrained matches\r
\r
## 1) What Finder matches\r
\r
Finder scans folders on the filesystem and checks whether a directory\r
matches a template.\r
\r
A template describes:\r
\r
- the directory name pattern\r
- required or forbidden files\r
- required or forbidden subfolders\r
- optional file constraints like size and hash\r
- optional command validation\r
- tags for discovery\r
\r
A template is a JSON5 file ending in \`.json5\`.\r
\r
Typical locations:\r
\r
- \`~/.finder/templates/\`\r
- \`./.finder/templates/\`\r
\r
The filename without \`.json5\` becomes the template name, for example:\r
\r
- \`my-template.json5\` → \`my-template\`\r
\r
---\r
\r
## 2) Core template schema\r
\r
A valid Finder template looks like this:\r
\r
\`\`\`json5\r
{\r
  min_version: "0.3.16",\r
  description: "My custom project type",\r
  name: "*",\r
  tags: ["node", "typescript"],\r
  files: [\r
    "package.json",\r
    {\r
      name: "src",\r
      existence: "optional",\r
    },\r
    {\r
      name: "*.ts",\r
      existence: "required",\r
      size: {\r
        min: 1,\r
        min_size_type: "KB",\r
      },\r
    },\r
  ],\r
  folders: [\r
    {\r
      name: "src",\r
      folders: [],\r
      files: ["index.ts"],\r
    },\r
  ],\r
  command: "",\r
  invert_command: false,\r
  size: {\r
    min: 10,\r
    min_size_type: "KB",\r
  },\r
}\r
\`\`\`\r
\r
---\r
\r
## 3) Supported top-level fields\r
\r
### \`description\` (string)\r
\r
Short human-readable explanation.\r
\r
\`\`\`json5\r
"description": "Python service with pyproject.toml"\r
\`\`\`\r
\r
### \`name\` (string)\r
\r
Pattern for the directory name.\r
\r
Use:\r
\r
- \`"*"\` for any folder name\r
- \`"my-app"\` for exact name\r
- \`"project-*"\` for wildcard matching\r
\r
Important:\r
\r
- This is checked with glob-like matching, not arbitrary regex.\r
- If you want to match all folders, prefer \`"*"\`.\r
\r
### \`files\` (array)\r
\r
Defines required/optional files.\r
\r
Can be either:\r
\r
- old style: string array\r
- modern style: objects with metadata\r
\r
Examples:\r
\r
\`\`\`json5\r
"files": [\r
  "package.json",\r
  "README.md"\r
]\r
\`\`\`\r
\r
\`\`\`json5\r
"files": [\r
  {\r
    "name": "*.go",\r
    "existence": "required"\r
  },\r
  {\r
    "name": "go.mod",\r
    "existence": "required"\r
  },\r
  {\r
    "name": "*.dll",\r
    "existence": "forbidden"\r
  }\r
]\r
\`\`\`\r
\r
### \`existence\` values\r
\r
- \`required\` (default): file must exist\r
- \`forbidden\`: file must not exist\r
- \`optional\`: exists is okay, but not required\r
\r
Examples:\r
\r
\`\`\`json5\r
{\r
  name: ".git",\r
  existence: "required",\r
}\r
\`\`\`\r
\r
\`\`\`json5\r
{\r
  name: "*.env",\r
  existence: "forbidden",\r
}\r
\`\`\`\r
\r
### \`size\` (file or folder size constraint)\r
\r
Used under a file object or as a folder-level rule.\r
\r
\`\`\`json5\r
"size": {\r
  "min": 1,\r
  "min_size_type": "KB",\r
  "max": 500,\r
  "max_size_type": "MB"\r
}\r
\`\`\`\r
\r
Valid size types:\r
\r
- \`B\`\r
- \`KB\`\r
- \`MB\`\r
- \`GB\`\r
\r
For file-level checking:\r
\r
- file must exist\r
- file size must satisfy the condition\r
\r
For folder-level checking:\r
\r
- total directory size is checked recursively\r
\r
### \`checksums\` (hash-based validation)\r
\r
You can require exact SHA256 or SHA512 for matching files.\r
\r
\`\`\`json5\r
{\r
  name: "*.zip",\r
  checksums: {\r
    sha256: "abc123...",\r
    sha512: "def456...",\r
  },\r
}\r
\`\`\`\r
\r
Rules:\r
\r
- both hashes are optional\r
- if SHA256 is provided, it must match exactly\r
- if SHA512 is provided, it must match exactly\r
- hash letters are compared case-insensitive\r
\r
### \`folders\` (nested directory patterns)\r
\r
Used to require subfolders.\r
\r
\`\`\`json5\r
"folders": [\r
  {\r
    "name": ".git"\r
  },\r
  {\r
    "name": "src",\r
    "folders": [\r
      {\r
        "name": "components"\r
      }\r
    ]\r
  }\r
]\r
\`\`\`\r
\r
The nested \`Folder\` object supports the same shape recursively.\r
\r
### \`command\` (string)\r
\r
Executes a shell command inside the found directory after matching.\r
\r
\`\`\`json5\r
"command": "git status --porcelain"\r
\`\`\`\r
\r
Behavior:\r
\r
- empty string means no command check\r
- command success is evaluated according to exit code\r
\r
### \`invert_command\` (bool)\r
\r
Controls logic of command result.\r
\r
\`\`\`json5\r
"invert_command": false\r
\`\`\`\r
\r
Meaning:\r
\r
- \`false\` → command must return success (typically exit code 0)\r
- \`true\` → command must return failure (typically exit code != 0)\r
\r
### \`tags\` (array of strings)\r
\r
Category labels for browsing or filtering by tag.\r
\r
\`\`\`json5\r
"tags": ["git", "repo", "vcs"]\r
\`\`\`\r
\r
### \`min_version\` (string)\r
\r
Minimum finder version compatibility.\r
\r
\`\`\`json5\r
"min_version": "0.3.16"\r
\`\`\`\r
\r
---\r
\r
## 4) Matching semantics\r
\r
A directory is considered a match only if all required conditions are\r
satisfied.\r
\r
This includes:\r
\r
- \`name\` matches the folder name\r
- required files exist\r
- forbidden files do not exist\r
- required subfolders exist\r
- size constraints pass\r
- checksum constraints pass\r
- command condition passes\r
\r
If any required rule fails, the directory is rejected.\r
\r
---\r
\r
## 5) Good patterns for template design\r
\r
### Prefer broad matching first\r
\r
Good default:\r
\r
\`\`\`json5\r
{\r
  name: "*",\r
  files: ["package.json", "tsconfig.json"],\r
}\r
\`\`\`\r
\r
Bad:\r
\r
\`\`\`json5\r
{\r
  name: "my-app",\r
  files: ["package.json"],\r
}\r
\`\`\`\r
\r
The second version is overly restrictive and will miss most valid\r
project folders.\r
\r
### Require the smallest useful signal\r
\r
For example, a Go project should usually require:\r
\r
- \`go.mod\`\r
- one or more \`*.go\` files\r
\r
Not a huge list of optional files.\r
\r
### Avoid false positives\r
\r
If your project has a \`README.md\` in many folders, do not require it\r
unless it is central to your pattern.\r
\r
### Use wildcards carefully\r
\r
\`\`\`json5\r
"name": "*.git" // if you intended a hidden git folder, this is special-case logic\r
\`\`\`\r
\r
Use patterns like \`"*"\`, \`"src"\`, \`"*.ts"\`, \`"package.json"\` rather\r
than complex regex-style expressions.\r
\r
---\r
\r
## 6) Examples\r
\r
### Example A: Git repository\r
\r
\`\`\`json5\r
{\r
  description: "Git repository root",\r
  name: "*",\r
  folders: [\r
    {\r
      name: ".git",\r
    },\r
  ],\r
  tags: ["git", "repo"],\r
}\r
\`\`\`\r
\r
### Example B: Node project\r
\r
\`\`\`json5\r
{\r
  description: "Node.js project",\r
  name: "*",\r
  files: ["package.json", "src", "README.md"],\r
  tags: ["node", "javascript", "typescript"],\r
}\r
\`\`\`\r
\r
### Example C: Python project\r
\r
\`\`\`json5\r
{\r
  description: "Python project with pyproject.toml",\r
  name: "*",\r
  files: [\r
    "pyproject.toml",\r
    {\r
      name: "*.py",\r
      existence: "required",\r
    },\r
  ],\r
  tags: ["python", "project"],\r
}\r
\`\`\`\r
\r
### Example D: strict checksum template\r
\r
\`\`\`json5\r
{\r
  name: "*",\r
  description: "test for checksums",\r
  files: [\r
    {\r
      name: "*",\r
      checksums: {\r
        sha256: "26be688daf71f2c8e64eecfa7fdf7d1f3649b6aae80dbb686ec3a9beb9def05b",\r
      },\r
    },\r
  ],\r
  min_version: "0.3.16",\r
}\r
\`\`\`\r
\r
This matches only folders containing a file whose SHA256 matches\r
exactly.\r
\r
### Example E: custom monorepo\r
\r
\`\`\`json5\r
{\r
  description: "Monorepo with apps and packages",\r
  name: "*",\r
  files: ["pnpm-workspace.yaml", "package.json"],\r
  folders: [\r
    {\r
      name: "apps",\r
      folders: [\r
        {\r
          name: "*",\r
          files: ["package.json"],\r
        },\r
      ],\r
    },\r
    {\r
      name: "packages",\r
      folders: [\r
        {\r
          name: "*",\r
          files: ["package.json"],\r
        },\r
      ],\r
    },\r
  ],\r
  tags: ["monorepo", "workspace"],\r
}\r
\`\`\`\r
\r
---\r
\r
## 7) Rules for AI-generated Finder templates\r
\r
When generating a Finder template, the assistant should follow this\r
checklist:\r
\r
1. Create a valid \`.json5\` file.\r
2. Use \`name: "*"\` unless the directory name is intentionally constrained.\r
3. Keep required files minimal and specific.\r
4. Prefer \`required\` over broad file matching if a file is essential.\r
5. Use \`forbidden\` only for truly disqualifying files.\r
6. Use \`size\` only when it genuinely distinguishes the target project type.\r
7. Use \`checksums\` only when exact file identity is important.\r
8. Add \`tags\` for discoverability.\r
9. Keep \`description\` clear and concise.\r
10. Prefer a deliberately narrow but realistic match over a very broad guess.\r
11. Validate with the project command before claiming success.\r
\r
---\r
\r
## 8) Validation commands\r
\r
After writing a template, validate it with one of these project commands:\r
\r
\`\`\`bash\r
./finder check\r
\`\`\`\r
\r
Or test a specific template:\r
\r
\`\`\`bash\r
./finder my-template-name\r
\`\`\`\r
\r
If a template exists in the custom template folder, it will be loaded\r
automatically.\r
\r
---\r
\r
## 9) Common mistakes\r
\r
### Mistake 1: too strict \`name\`\r
\r
\`\`\`json5\r
"name": "root"\r
\`\`\`\r
\r
This will match almost nothing unless the folder is literally named \`root\`.\r
\r
Use:\r
\r
\`\`\`json5\r
"name": "*"\r
\`\`\`\r
\r
unless you intentionally want a fixed directory name.\r
\r
### Mistake 2: requiring too many files\r
\r
Large project templates often become unreliable if they require too\r
many files.\r
\r
Prefer the smallest signal that distinguishes the project type.\r
\r
### Mistake 3: using regex-like expressions instead of glob matching\r
\r
Finder uses glob-like matching through \`path.Match\`, not full regex.\r
\r
Use:\r
\r
- \`*.ts\`\r
- \`package.json\`\r
- \`src\`\r
\r
not arbitrary regex syntax.\r
\r
### Mistake 4: forgetting the \`.json5\` extension\r
\r
The file must end in \`.json5\`.\r
\r
### Mistake 5: writing invalid JSON5\r
\r
Remember:\r
\r
- trailing commas may be allowed depending on parser handling\r
- keep object structure valid\r
- avoid broken braces and trailing commas in awkward spots\r
\r
### Mistake 6: requiring impossible signals\r
\r
For example, requiring a project-specific file that is generated only\r
in CI or only in a subset of repositories will make your template\r
unreliable.\r
\r
---\r
\r
## 10) Recommended prompt pattern for AI generation\r
\r
Use this when asking an AI to generate a Finder template:\r
\r
\`\`\`text\r
Create a Finder template as a JSON5 file for <project type>.\r
Use a custom template file in ~/.finder/templates/ or ./.finder/templates/.\r
Requirements:\r
- match folders with name "*" unless a narrower pattern is necessary\r
- require the smallest set of meaningful files/folders\r
- include tags and a clear description\r
- allow optional files if needed\r
- do not use overly strict name filters\r
- ensure the structure is valid Finder JSON5\r
- include examples of required files and nested folders if relevant\r
- add a realistic command check only when needed\r
- keep the template robust and not prone to false positives\r
\`\`\`\r
\r
---\r
\r
## 11) Final rule\r
\r
A good Finder template should be:\r
\r
- valid JSON5\r
- minimal but discriminative\r
- not too broad\r
- not too narrow\r
- easy to debug\r
- easy to maintain\r
\r
If you are unsure, prefer a simple template with the most reliable\r
markers:\r
\r
- folder names\r
- known files\r
- known subfolders\r
- one or two strong signs of the project type\r
\r
---\r
\r
## 12) One minimal example to copy\r
\r
\`\`\`json5\r
{\r
  description: "Simple project template",\r
  name: "*",\r
  files: [\r
    "package.json",\r
    {\r
      name: "src",\r
      existence: "optional",\r
    },\r
  ],\r
  tags: ["project"],\r
}\r
\`\`\`\r
\r
This is intentionally simple and often a good starting point for custom\r
templates.\r
\r
---\r
\r
## 13) When writing a new template for this repo\r
\r
If the task is to add a template to this project, keep in mind:\r
\r
- put it in the template directory used by the runtime\r
- follow the repo’s JSON5 style closely\r
- avoid accidental false positives\r
- validate with finder checks after creation\r
\r
This repo has built-in examples in the templates folder and the project\r
docs in the root files.\r
`,styles:[u]},readme:{id:"readme",type:"markdown",html:`<p></p><h1 id="finder">finder</h1><p><a href="https://github.com/ShadowDara/finder/actions/workflows/release.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/release.yml/badge.svg" alt="Build Status"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml/badge.svg" alt="Build Check"></a><a href="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml" target="_blank" rel="noopener noreferrer"><img src="https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml/badge.svg" alt="Deploy GitHub Pages"></a><a href="https://github.com/shadowdara/finder/graphs/contributors" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/contributors/shadowdara/finder" alt="GitHub contributors"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/commit-activity/m/shadowdara/finder" alt="GitHub commit activity (branch)"></a><a href="https://github.com/shadowdara/finder/commits" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/last-commit/shadowdara/finder" alt="Last Commit"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/downloads/shadowdara/finder/total?logo=github" alt="GitHub all releases"></a><a href="https://github.com/shadowdara/finder/releases" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/v/release/shadowdara/finder?logo=github" alt="GitHub release (with filter)"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/languages/code-size/shadowdara/finder?logo=github" alt="GitHub code size in bytes"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/github/repo-size/shadowdara/finder?logo=github" alt="GitHub repo size"></a><a href="https://github.com/shadowdara/finder.git" target="_blank" rel="noopener noreferrer"><img src="https://badges.ws/github/lang-count/shadowdara/finder" alt="Lang Count"></a><img src="https://img.shields.io/github/stars/shadowdara/finder" alt="GitHub Repo stars"> <img src="https://img.shields.io/github/forks/shadowdara/finder" alt="GitHub forks"> <img src="https://badges.ws/maintenance/yes/2026" alt="Maintained"> <img src="https://badges.ws/handmade" alt="Handmade"> <a href="https://pkg.go.dev/github.com/shadowdara/finder" target="_blank" rel="noopener noreferrer"><img src="https://pkg.go.dev/badge/github.com/shadowdara/finder" alt="Go Reference"></a></p><p>Finder is a small command-line tool written in Go to locate projects based on predefined folder/file structure templates.</p><p>In short: you can search for repositories (e.g. <code>.git</code>), project layouts, or your own custom structures using templates.</p><h2 id="commiting">Commiting</h2><p>feel free to help the Project by committing Code for the project are Templates. Feel although free to submit Templates via Issues!</p><h2 id="features">Features</h2><ul><li>Searches using JSON5 templates stored in <code>internal/structure/templates</code>.</li><li>Supports user templates in the OS-specific configuration folder.</li><li>Lightweight, tested, and easy to extend.</li><li>**Finder can although be used to search single files and is a lot faster</li></ul><h2 id="requirements">Requirements</h2><ul><li>Go 1.18 or newer</li></ul><h2 id="installation">Installation</h2><p>Build from source:</p><pre><code class="language-sh">go build ./cmd/finder</code></pre><p>Or install with <code>go install</code> (Go 1.18+):</p><pre><code class="language-sh">go install github.com/shadowdara/finder/cmd/finder@latest</code></pre><p>The produced binary is <code>finder</code> (on Windows <code>finder.exe</code>).</p><h2 id="usage">Usage</h2><p>Basic syntax:</p><pre><code class="language-sh">finder &lt;template-name&gt;</code></pre><p>Example — find Git repositories:</p><pre><code class="language-sh">finder git</code></pre><p>The program searches the current directory recursively and prints matches based on the template name.</p><h2 id="templates">Templates</h2><p>Default templates are stored in <code>internal/structure/templates</code>. Templates are JSON5 files with fields such as <code>name</code>, <code>files</code>, and <code>folders</code>. A simple template to find Git repositories looks like:</p><pre><code class="language-json"><span class="hljs-comment">// Template for Git</span>
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
go tool cover -html=coverage</code></pre><p>Build:</p><pre><code class="language-sh">go build ./cmd/finder</code></pre><p>Check the available Templates</p><pre><code class="language-sh">go run ./cmd/finder check</code></pre><h2 id="contributing">Contributing</h2><ul><li>Found a missing or inaccurate template? Please open an issue.</li><li>Add new templates via PR. Keep them in JSON5 and provide a short</li></ul><h2 id="roadmap-ideas">Roadmap / Ideas</h2><ul><li>use temporary Template via the Command Line</li><li>Caching/Indexing for faster searches</li><li>Web UI for template management</li><li>Template schema and validation</li></ul><h2 id="license">License</h2><p>See <code>LICENSE</code>.</p><hr><p>Project: <code>https://github.com/shadowdara/finder</code></p><h2 id="extra-info">Extra Info</h2><p>The Project <a href="https://github.com/shadowdara/fs-tools" target="_blank" rel="noopener noreferrer">fs-tools</a> was more or less the prototype for finder.</p><h2 id="info-video">Info Video</h2><p>(<em>a Youtube Video</em>)</p><p><a href="https://www.youtube.com/watch?v=oIRgAYv-mOA" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/oIRgAYv-mOA/0.jpg" alt="INFO Video 1 about Finder"></a></p>`,styles:[u]},samfile:{id:"samfile",type:"component",load:()=>d(()=>import("./samfile.js"),__vite__mapDeps([8,9,10]),import.meta.url),data:null,styles:[]},"tools/markdowneditor":{id:"tools/markdowneditor",type:"component",load:()=>d(()=>import("./markdowneditor.js"),__vite__mapDeps([11,12]),import.meta.url),data:null,styles:[]},"tools/minecraft/tellraw":{id:"tools/minecraft/tellraw",type:"component",load:()=>d(()=>import("./tellraw.js"),__vite__mapDeps([13,9,14]),import.meta.url),data:null,styles:[]},viewer:{id:"viewer",type:"component",load:()=>d(()=>import("./viewer.js"),__vite__mapDeps([15,16]),import.meta.url),data:null,styles:[]}},j=Symbol("html");function t(e,r,...n){if(typeof e=="function")return e({...r??{},children:n});const s=new Set(["disabled","checked","selected","readonly","required","multiple","hidden","autofocus","open"]),m=Object.entries(r??{}).filter(([o])=>o!=="children"&&o!=="key").map(([o,a])=>{if(a==null)return"";const l=o==="className"?"class":o;return typeof a=="boolean"&&s.has(l)?a?` ${l}`:"":typeof a=="boolean"?` ${l}="${a}"`:a===!1?"":` ${l}="${q(String(a))}"`}).join(""),g=n.flat(1/0).filter(o=>o!=null&&o!==!1).map(o=>v(o)?o.value:k(String(o))).join(""),i=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]).has(e)?`<${e}${m}>`:`<${e}${m}>${g}</${e}>`;return y(i)}function C(e){const r=(e.children??[]).flat(1/0).filter(n=>n!=null&&n!==!1).map(n=>v(n)?n.value:k(String(n))).join("");return y(r)}function y(e){return{[j]:!0,value:e,toString(){return e}}}function v(e){return typeof e=="object"&&e!==null&&j in e}function q(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function k(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function M(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function T(e){return y(e)}function I(e){for(const r of e){const n=new URL(r,import.meta.url).href;if(document.head.querySelector(`link[data-page-style="${CSS.escape(n)}"]`))continue;const s=document.createElement("link");s.rel="stylesheet",s.href=n,s.dataset.pageStyle=n,document.head.appendChild(s)}}function A(e){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"No page id was provided."),t("a",{href:"/"},"Go home"))}function L(e,r){const n=Object.keys(r).filter(s=>s!=="__404__").map(s=>t("li",null,t("a",{href:s==="index"?"/":`/${s}`},s))).join("");e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page not found."),t("h2",null,"Available pages"),t("ul",null,T(n)),t("a",{href:"/"},"Go home"))}function O(e,r){e.innerHTML=t("main",null,t("h1",null,"404"),t("p",null,"Page ",r," not found."),t("a",{href:"/"},"Go home"))}function F(e,r,n){console.error(`[pages] Failed to load page "${r}"`,n),e.innerHTML=t("main",null,t("h1",null,"Failed to load page"),t("p",null,'Could not load "$',r,'".'),t("a",{href:"/"},"Go home"),t("pre",null,`[pages] Failed to load page "${r}"`),t("pre",null,n))}function R(e,r){r.type==="markdown"&&(e.innerHTML=t(C,null,t("a",{href:"../"},"Home"),t("article",{class:"markdown"},T(r.html??""))))}async function G(){const e=document.getElementById("app");if(e==null)throw new Error("Missing #app element");const r=window.PAGE_ID;if(!r){A(e);return}if(r==="__404__"){L(e,w);return}const n=w[r];if(!n){console.error(`[pages] Unknown page id: ${r}`),O(e,r);return}try{if(I(n.styles),n.type==="markdown"){R(e,n);return}await(await n.load()).default(e,n.data)}catch(s){F(e,r,s)}}G();export{C as F,M as e,t as j,T as r};
