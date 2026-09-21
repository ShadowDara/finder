const s=`<pre><code class="language-md"><span class="hljs-section"># AGENTS — Finder Template Authoring Guide</span>

This document is for AI assistants such as ChatGPT, Claude, Copilot,
and similar tools that need to create valid Finder templates.

Goal:

<span class="hljs-bullet">-</span> create Finder-compatible JSON5/JSON/JSONC templates
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

A template is a JSON5, JSON, or JSONC file. Supported extensions:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`.json5\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`.json\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`.jsonc\`</span>

Content can use JSON5 syntax (unquoted keys, trailing commas, comments)
regardless of the extension — Finder preprocesses JSON5 syntax before
parsing. Plain JSON is always valid.

Typical locations:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`~/.finder/templates/\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`./.finder/templates/\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`~/.finder/installed/templates/\`</span> (installed via <span class="hljs-code">\`finder install\`</span>)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`./.finder/installed/templates/\`</span> (project-local, installed via <span class="hljs-code">\`finder install\`</span>)

Installed templates keep their URL-derived relative sub-path as the
name, so a template fetched from
<span class="hljs-code">\`https://example.com/foo/template.json5\`</span> is reachable as
<span class="hljs-code">\`example.com/foo/template\`</span>.

Those long installed names can be shortened with <span class="hljs-strong">**template aliases**</span>
(CLI-only, stored in <span class="hljs-code">\`~/.finder/aliases.json\`</span> — not a template field).
See section 8.5.

The filename without its extension becomes the template name, for
example:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`my-template.json5\`</span> → <span class="hljs-code">\`my-template\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`my-template.json\`</span> → <span class="hljs-code">\`my-template\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`my-template.jsonc\`</span> → <span class="hljs-code">\`my-template\`</span>

When the same base name exists with multiple extensions, the highest
priority extension wins:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`.jsonc\`</span> (highest priority)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`.json\`</span>
<span class="hljs-bullet">-</span> <span class="hljs-code">\`.json5\`</span> (lowest priority)

So if <span class="hljs-code">\`my-template.json5\`</span>, <span class="hljs-code">\`my-template.json\`</span> and <span class="hljs-code">\`my-template.jsonc\`</span>
all exist, the <span class="hljs-code">\`.jsonc\`</span> file is used.

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

Important:

<span class="hljs-bullet">-</span> Matching is exact-first, then glob fallback (see the &quot;Pattern
  matching&quot; section below). Regular expressions are <span class="hljs-strong">**not**</span> interpreted
  inside <span class="hljs-code">\`name\`</span> — use the dedicated <span class="hljs-code">\`name_regex\`</span> field instead.
<span class="hljs-bullet">-</span> If you want to match all folders, prefer <span class="hljs-code">\`&quot;*&quot;\`</span>.

<span class="hljs-section">### \`name<span class="hljs-emphasis">_regex\` (string)

Optional Go regular expression (RE2) matched against the directory
name. It is a separate field, so \`name\` keeps its exact/glob behaviour.

\`\`\`json5
&quot;name_</span>regex&quot;: &quot;^project-[0-9]+$&quot;</span>
<span class="hljs-code">\`\`\`

Rules:

- both \`name\` and \`name_regex\` can be set; when both are set, **both**
  must match
- the regex must compile; an invalid regex never matches (fails closed)
- since 0.3.18 — set \`&quot;min_version&quot;: &quot;0.3.18&quot;\` when you use it

### \`files\` (array)

Defines required/optional files.

Can be either:

- old style: string array
- modern style: objects with metadata

Examples:

\`\`\`</span>json5
&quot;files&quot;: [
  &quot;package.json&quot;,
  &quot;README.md&quot;
]
<span class="hljs-code">\`\`\`

\`\`\`</span>json5
&quot;files&quot;: [
  {
<span class="hljs-code">    &quot;name&quot;: &quot;*.go&quot;,
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
\`\`\`
</span>
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

### \`author\` (string)

Optional single author attribution of the template. Ignored during
matching; displayed in the web UI / template hub. Since 0.3.18.

\`\`\`json5
&quot;author&quot;: &quot;shadowdara&quot;
\`\`\`

### \`authors\` (array of strings)

Optional list of co-authors or contributors. Ignored during matching;
displayed in the web UI / template hub. Since 0.3.18.

\`\`\`json5
&quot;authors&quot;: [&quot;shadowdara&quot;, &quot;someone-else&quot;]
\`\`\`

---

## 3.5) Pattern matching: exact and glob; regex via \`name_</span>regex\`

Every <span class="hljs-code">\`name\`</span> pattern in a template — the top-level <span class="hljs-code">\`name\`</span>, every file
<span class="hljs-code">\`name\`</span>, and every folder <span class="hljs-code">\`name\`</span> (including nested folders) — is
resolved by the same matching function:

<span class="hljs-code">\`\`\`go
if pattern == name {
    return true           // 1) exact string match
}
ok, err := path.Match(pattern, name)
return err == nil &amp;&amp; ok   // 2) glob fallback
\`\`\`</span>

This creates a 2-tier matching strategy for <span class="hljs-code">\`name\`</span>:

| Priority | Method                | Applies when                     |
| -------- | --------------------- | -------------------------------- |
| 1        | exact string equality | pattern equals the name verbatim |
| 2        | glob (<span class="hljs-code">\`path.Match\`</span>)   | pattern contains <span class="hljs-code">\`*\`</span>, <span class="hljs-code">\`?\`</span> or <span class="hljs-code">\`[\`</span> |

Regular expressions are <span class="hljs-strong">**not**</span> interpreted inside <span class="hljs-code">\`name\`</span> — they live
in the separate <span class="hljs-strong">**\`name<span class="hljs-emphasis">_regex\`** field (available on top-level
templates, files, and folders). When both \`name\` and \`name_</span>regex\` are
set, **</span>both** must match.

<span class="hljs-section">### How to choose a pattern</span>

<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;*.go&quot;\`</span> is a glob and matches any file ending in <span class="hljs-code">\`.go\`</span>.
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;project-*&quot;\`</span> is a glob.
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;^main\\.py$&quot;\`</span> in <span class="hljs-code">\`name\`</span> matches the literal name <span class="hljs-code">\`^main\\.py$\`</span> —
  put anchored regexes into <span class="hljs-code">\`name_regex\`</span> instead.

<span class="hljs-section">### Go regex syntax (in \`name<span class="hljs-emphasis">_regex\`)

\`name_</span>regex\` patterns match with full Go regex semantics (RE2)</span>
against the entire entry name. Refer to Go&#x27;s <span class="hljs-code">\`regexp/syntax\`</span> (RE2)
for the full language. Useful constructs:

<span class="hljs-bullet">-</span> anchors: <span class="hljs-code">\`^...$\`</span>
<span class="hljs-bullet">-</span> character classes: <span class="hljs-code">\`[0-9]\`</span>, <span class="hljs-code">\`[a-zA-Z]\`</span>, <span class="hljs-code">\`[^...]\`</span>
<span class="hljs-bullet">-</span> predefined classes: <span class="hljs-code">\`\\d\`</span>, <span class="hljs-code">\`\\w\`</span>, <span class="hljs-code">\`\\s\`</span> (and uppercase negations)
<span class="hljs-bullet">-</span> quantifiers: <span class="hljs-code">\`*\`</span>, <span class="hljs-code">\`+\`</span>, <span class="hljs-code">\`?\`</span>, <span class="hljs-code">\`{m,n}\`</span>
<span class="hljs-bullet">-</span> alternation: <span class="hljs-code">\`(a|b)\`</span>
<span class="hljs-bullet">-</span> groups: <span class="hljs-code">\`(abc)\`</span>, non-capturing <span class="hljs-code">\`(?:abc)\`</span>
<span class="hljs-bullet">-</span> escapes: <span class="hljs-code">\`\\.\`</span>, <span class="hljs-code">\`\\\\\`</span>

Examples:

<span class="hljs-code">\`\`\`json5
// folder names like project-123, project-42 ...
{ name_regex: &quot;^project-[0-9]+$&quot; }
\`\`\`</span>

<span class="hljs-code">\`\`\`json5
// python entry files: main.py, app.py, ...
{
  name_regex: &quot;^(main|app|server)\\\\.py$&quot;,
  existence: &quot;required&quot;,
}
\`\`\`</span>

Note: Go regex is RE2 — no backreferences and no lookahead/lookbehind.
An invalid <span class="hljs-code">\`name_regex\`</span> never matches (fails closed).

<span class="hljs-section">### Glob syntax (in \`name\`)</span>

<span class="hljs-code">\`name\`</span> patterns are handled via Go&#x27;s <span class="hljs-code">\`path.Match\`</span>:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`*\`</span> matches any sequence of non-<span class="hljs-code">\`/\`</span> characters
<span class="hljs-bullet">-</span> <span class="hljs-code">\`?\`</span> matches any single non-<span class="hljs-code">\`/\`</span> character
<span class="hljs-bullet">-</span> <span class="hljs-code">\`[abc]\`</span> matches one character from the class
<span class="hljs-bullet">-</span> <span class="hljs-code">\`[^abc]\`</span> / <span class="hljs-code">\`[!abc]\`</span> matches one character not in the class
<span class="hljs-bullet">-</span> <span class="hljs-code">\`\\x\`</span> escapes the next character

There is no recursive <span class="hljs-code">\`**\`</span> (doublestar) support — <span class="hljs-code">\`**\`</span> does not
descend into subdirectories.

Examples:

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;*.ts&quot;,
\`\`\`</span>

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;file?.txt&quot;,
\`\`\`</span>

<span class="hljs-code">\`\`\`json5
&quot;name&quot;: &quot;[abc].go&quot;,
\`\`\`</span>

<span class="hljs-section">### Where these patterns apply</span>

<span class="hljs-bullet">-</span> top-level <span class="hljs-code">\`name\`</span> / <span class="hljs-code">\`name_regex\`</span> → the scanned directory name
<span class="hljs-bullet">-</span> <span class="hljs-code">\`files[].name\`</span> / <span class="hljs-code">\`files[].name_regex\`</span> → file names inside the directory
<span class="hljs-bullet">-</span> <span class="hljs-code">\`folders[].name\`</span> / <span class="hljs-code">\`folders[].name_regex\`</span> → subfolder names
  (recursively for nested folders)

Exact glob patterns like <span class="hljs-code">\`&quot;src&quot;\`</span> or <span class="hljs-code">\`&quot;package.json&quot;\`</span> work exactly as
before.

<span class="hljs-section">### Compatibility note</span>

The separate <span class="hljs-code">\`name_regex\`</span> field was added in finder 0.3.18. If your
template relies on regex patterns, set:

<span class="hljs-code">\`\`\`json5
&quot;min_version&quot;: &quot;0.3.18&quot;
\`\`\`</span>

Templates for older finder versions should keep using glob or exact
patterns only.

---

<span class="hljs-section">## 4) Matching semantics</span>

A directory is considered a match only if all required conditions are
satisfied.

This includes:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`name\`</span> matches the folder name
<span class="hljs-bullet">-</span> required files exist
<span class="hljs-bullet">-</span> forbidden files do not exist
<span class="hljs-bullet">-</span> required subfolders exist
<span class="hljs-bullet">-</span> size constraints pass
<span class="hljs-bullet">-</span> checksum constraints pass
<span class="hljs-bullet">-</span> command condition passes

If any required rule fails, the directory is rejected.

---

<span class="hljs-section">## 5) Good patterns for template design</span>

<span class="hljs-section">### Prefer broad matching first</span>

Good default:

<span class="hljs-code">\`\`\`json5
{
  name: &quot;*&quot;,
  files: [&quot;package.json&quot;, &quot;tsconfig.json&quot;],
}
\`\`\`</span>

Bad:

<span class="hljs-code">\`\`\`json5
{
  name: &quot;my-app&quot;,
  files: [&quot;package.json&quot;],
}
\`\`\`</span>

The second version is overly restrictive and will miss most valid
project folders.

<span class="hljs-section">### Require the smallest useful signal</span>

For example, a Go project should usually require:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`go.mod\`</span>
<span class="hljs-bullet">-</span> one or more <span class="hljs-code">\`*.go\`</span> files

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
<span class="hljs-code">\`^project-[0-9]+$\`</span>), keep it in the <span class="hljs-code">\`name_regex\`</span> field, anchor with
<span class="hljs-code">\`^\`</span> and <span class="hljs-code">\`$\`</span> to avoid unintended matches, and set
<span class="hljs-code">\`&quot;min_version&quot;: &quot;0.3.18&quot;\`</span>.

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
  name: &quot;*&quot;,
  name_regex: &quot;^project-[0-9]+$&quot;,
  files: [
    {
      name_regex: &quot;^(main|app)\\\\.py$&quot;,
      existence: &quot;required&quot;,
    },
  ],
  tags: [&quot;python&quot;, &quot;numbered&quot;],
  min_version: &quot;0.3.18&quot;,
}
\`\`\`</span>

This matches folders like <span class="hljs-code">\`project-123\`</span> or <span class="hljs-code">\`project-42\`</span> and requires
exactly one of <span class="hljs-code">\`main.py\`</span> or <span class="hljs-code">\`app.py\`</span> to be present. The regex lives in
<span class="hljs-code">\`name_regex\`</span> — note the escaped dots <span class="hljs-code">\`\\\\.\`</span> and anchors <span class="hljs-code">\`^...$\`</span>.

<span class="hljs-section">### Example G: regex file pattern with glob fallback</span>

<span class="hljs-code">\`\`\`json5
{
  description: &quot;JavaScript project with strict entry points&quot;,
  name: &quot;*&quot;,
  files: [
    &quot;package.json&quot;,
    {
      name_regex: &quot;^(index|main|app)\\\\.(js|ts|jsx|tsx)$&quot;,
      existence: &quot;required&quot;,
    },
    {
      name_regex: &quot;\\\\.env$&quot;,
      existence: &quot;forbidden&quot;,
    },
  ],
  tags: [&quot;javascript&quot;, &quot;strict&quot;],
  min_version: &quot;0.3.18&quot;,
}
\`\`\`</span>

This requires one of <span class="hljs-code">\`index.js\`</span>, <span class="hljs-code">\`main.js\`</span>, <span class="hljs-code">\`app.js\`</span>, <span class="hljs-code">\`index.ts\`</span>, etc.
and forbids any file ending in <span class="hljs-code">\`.env\`</span>. Note that <span class="hljs-code">\`&quot;*.env&quot;\`</span> would also
work as a glob in <span class="hljs-code">\`name\`</span> — the <span class="hljs-code">\`name_regex\`</span> version is more explicit.

---

<span class="hljs-section">## 7) Rules for AI-generated Finder templates</span>

When generating a Finder template, the assistant should follow this
checklist:

<span class="hljs-bullet">1.</span> Create a valid <span class="hljs-code">\`.json5\`</span>, <span class="hljs-code">\`.json\`</span>, or <span class="hljs-code">\`.jsonc\`</span> file.
<span class="hljs-bullet">2.</span> Use <span class="hljs-code">\`name: &quot;*&quot;\`</span> unless the directory name is intentionally constrained.
<span class="hljs-bullet">3.</span> Keep required files minimal and specific.
<span class="hljs-bullet">4.</span> Prefer <span class="hljs-code">\`required\`</span> over broad file matching if a file is essential.
<span class="hljs-bullet">5.</span> Use <span class="hljs-code">\`forbidden\`</span> only for truly disqualifying files.
<span class="hljs-bullet">6.</span> Use <span class="hljs-code">\`size\`</span> only when it genuinely distinguishes the target project type.
<span class="hljs-bullet">7.</span> Use <span class="hljs-code">\`checksums\`</span> only when exact file identity is important.
<span class="hljs-bullet">8.</span> Add <span class="hljs-code">\`tags\`</span> for discoverability.
<span class="hljs-bullet">9.</span> Keep <span class="hljs-code">\`description\`</span> clear and concise.
<span class="hljs-bullet">10.</span> Add <span class="hljs-code">\`author\`</span>/<span class="hljs-code">\`authors\`</span> when the template has known attribution.
<span class="hljs-bullet">11.</span> Prefer a deliberately narrow but realistic match over a very broad guess.
<span class="hljs-bullet">12.</span> Validate with the project command before claiming success.

---

<span class="hljs-section">## 8) Validation commands</span>

After writing a template, validate it with one of these project commands:

<span class="hljs-code">\`\`\`bash
./finder check
\`\`\`</span>

Validate a single template file or name (since 0.3.18):

<span class="hljs-code">\`\`\`bash
./finder validate my-template.json5
./finder validate my-template-name
\`\`\`</span>

Or test a specific template:

<span class="hljs-code">\`\`\`bash
./finder my-template-name
\`\`\`</span>

If a template exists in the custom template folder, it will be loaded
automatically. Templates installed from the web (\`finder install
<span class="language-xml"><span class="hljs-tag">&lt;<span class="hljs-name">url-or-name</span>&gt;</span></span><span class="hljs-code">\`) are looked up in \`</span>~/.finder/installed/templates/\` (and
<span class="hljs-code">\`./.finder/installed/templates/\`</span>) under their URL-derived name.

---

<span class="hljs-section">## 8.5) Template aliases (CLI, not a template field)</span>

Aliases are user-defined short names for templates. They are <span class="hljs-strong">**not**</span>
part of the template JSON schema — do not add an <span class="hljs-code">\`aliases\`</span> (or
<span class="hljs-code">\`alias\`</span>) field to a template file. Finder will ignore it during
matching.

Aliases live in <span class="hljs-code">\`~/.finder/aliases.json\`</span> and are managed with the CLI:

<span class="hljs-code">\`\`\`bash
# Create an alias for a (usually installed) template
finder alias myvue shadowdara.github.io/test/template

# Search / view using the alias — resolved before the template loads
finder myvue
finder view myvue

# List aliases
finder aliases          # alias: alias-list

# Remove an alias
finder unalias myvue    # alias: alias-remove
\`\`\`</span>

An alias whose name ends with <span class="hljs-code">\`/\`</span> is a <span class="hljs-strong">**start-path alias**</span>. It
expands a prefix of the searched name; the rest of the input is
appended to the target. The longest matching prefix wins:

<span class="hljs-code">\`\`\`bash
finder alias s/ shadowdara.github.io/templates/
finder s/test
# → searches shadowdara.github.io/templates/test
\`\`\`</span>

Rules for assistants:

<span class="hljs-bullet">-</span> never write <span class="hljs-code">\`aliases\`</span> / <span class="hljs-code">\`alias\`</span> into a generated template file
<span class="hljs-bullet">-</span> tell the user to create aliases with <span class="hljs-code">\`finder alias &lt;name&gt; &lt;template&gt;\`</span>
<span class="hljs-bullet">-</span> resolution is single-level (no alias chains)
<span class="hljs-bullet">-</span> exact match is tried first; otherwise the longest start-path prefix
  (keys ending with <span class="hljs-code">\`/\`</span>) wins
<span class="hljs-bullet">-</span> alias names cannot contain <span class="hljs-code">\`\\\`</span> or inner <span class="hljs-code">\`/\`</span>; the only allowed slash
  is a single trailing <span class="hljs-code">\`/\`</span> for start-path aliases
<span class="hljs-bullet">-</span> overwriting an existing alias is allowed (upsert)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`finder s/\`</span> alone resolves to the start path itself (no trailing
  slash)
<span class="hljs-bullet">-</span> aliases apply to <span class="hljs-code">\`finder &lt;name&gt;\`</span>, <span class="hljs-code">\`finder template &lt;name&gt;\`</span>, and
  <span class="hljs-code">\`finder view &lt;name&gt;\`</span>

This is the recommended way to shorten installed template names such
as <span class="hljs-code">\`shadowdara.github.io/test/template\`</span>.

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

<span class="hljs-code">\`name\`</span> only supports exact and glob syntax; regex patterns belong in
the separate <span class="hljs-code">\`name_regex\`</span> field. Putting a regex into <span class="hljs-code">\`name\`</span> makes it
a literal/glob pattern that will not match what you expect:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;*.ts&quot;\`</span> in <span class="hljs-code">\`name\`</span> → glob, matches any <span class="hljs-code">\`.ts\`</span> file
<span class="hljs-bullet">-</span> <span class="hljs-code">\`&quot;^main\\\\.py$&quot;\`</span> in <span class="hljs-code">\`name\`</span> → literal pattern, matches a folder that
  is literally named <span class="hljs-code">\`^main\\.py$\`</span> — put it into <span class="hljs-code">\`name_regex\`</span> instead

Use:

<span class="hljs-bullet">-</span> <span class="hljs-code">\`*.ts\`</span> (name)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`package.json\`</span> (name)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`src\`</span> (name)
<span class="hljs-bullet">-</span> <span class="hljs-code">\`^project-[0-9]+$\`</span> (in <span class="hljs-code">\`name_regex\`</span>, only when you need it)

Do not write regex-looking patterns into <span class="hljs-code">\`name\`</span> and expect them to be
interpreted as regex. If in doubt, prefer glob or exact names.

<span class="hljs-section">### Mistake 4: forgetting a supported file extension</span>

The file must end in <span class="hljs-code">\`.json5\`</span>, <span class="hljs-code">\`.json\`</span>, or <span class="hljs-code">\`.jsonc\`</span>.

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

<span class="hljs-section">## 14) Sync policy for this guide</span>

<span class="hljs-code">\`AGENTS.md\`</span> in the repo root is the source of truth for this guide.
Its generated copy is kept in sync at <span class="hljs-code">\`npm/site/data/agents.md\`</span> (and
bundled into the findergen frontend assets). When updating <span class="hljs-code">\`AGENTS.md\`</span>,
apply the same changes to the synced copies so the documentation stays
consistent everywhere.
</code></pre>`;export{s as default};
