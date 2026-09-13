# AGENTS — Finder Template Authoring Guide

This document is for AI assistants such as ChatGPT, Claude, Copilot,
and similar tools that need to create valid Finder templates.

Goal:

- create Finder-compatible JSON5 templates
- work with all supported template features
- prefer valid, minimal, and robust patterns
- avoid false positives and over-constrained matches

## 1) What Finder matches

Finder scans folders on the filesystem and checks whether a directory
matches a template.

A template describes:

- the directory name pattern
- required or forbidden files
- required or forbidden subfolders
- optional file constraints like size and hash
- optional command validation
- tags for discovery

A template is a JSON5 file ending in `.json5`.

Typical locations:

- `~/.finder/templates/`
- `./.finder/templates/`

The filename without `.json5` becomes the template name, for example:

- `my-template.json5` → `my-template`

---

## 2) Core template schema

A valid Finder template looks like this:

```json5
{
  min_version: "0.3.16",
  description: "My custom project type",
  name: "*",
  tags: ["node", "typescript"],
  files: [
    "package.json",
    {
      name: "src",
      existence: "optional",
    },
    {
      name: "*.ts",
      existence: "required",
      size: {
        min: 1,
        min_size_type: "KB",
      },
    },
  ],
  folders: [
    {
      name: "src",
      folders: [],
      files: ["index.ts"],
    },
  ],
  command: "",
  invert_command: false,
  size: {
    min: 10,
    min_size_type: "KB",
  },
}
```

---

## 3) Supported top-level fields

### `description` (string)

Short human-readable explanation.

```json5
"description": "Python service with pyproject.toml"
```

### `name` (string)

Pattern for the directory name.

Use:

- `"*"` for any folder name
- `"my-app"` for exact name
- `"project-*"` for glob wildcard matching
- `"^project-[0-9]+$"` for regex matching

Important:

- Matching is exact-first, then regex, then glob fallback (see
  the "Pattern matching" section below).
- If you want to match all folders, prefer `"*"`.

### `files` (array)

Defines required/optional files.

Can be either:

- old style: string array
- modern style: objects with metadata

Examples:

```json5
"files": [
  "package.json",
  "README.md"
]
```

```json5
"files": [
  {
    "name": "*.go",
    "existence": "required"
  },
  {
    "name": "go.mod",
    "existence": "required"
  },
  {
    "name": "*.dll",
    "existence": "forbidden"
  }
]
```

### `existence` values

- `required` (default): file must exist
- `forbidden`: file must not exist
- `optional`: exists is okay, but not required

Examples:

```json5
{
  name: ".git",
  existence: "required",
}
```

```json5
{
  name: "*.env",
  existence: "forbidden",
}
```

### `size` (file or folder size constraint)

Used under a file object or as a folder-level rule.

```json5
"size": {
  "min": 1,
  "min_size_type": "KB",
  "max": 500,
  "max_size_type": "MB"
}
```

Valid size types:

- `B`
- `KB`
- `MB`
- `GB`

For file-level checking:

- file must exist
- file size must satisfy the condition

For folder-level checking:

- total directory size is checked recursively

### `checksums` (hash-based validation)

You can require exact SHA256 or SHA512 for matching files.

```json5
{
  name: "*.zip",
  checksums: {
    sha256: "abc123...",
    sha512: "def456...",
  },
}
```

Rules:

- both hashes are optional
- if SHA256 is provided, it must match exactly
- if SHA512 is provided, it must match exactly
- hash letters are compared case-insensitive

### `folders` (nested directory patterns)

Used to require subfolders.

```json5
"folders": [
  {
    "name": ".git"
  },
  {
    "name": "src",
    "folders": [
      {
        "name": "components"
      }
    ]
  }
]
```

The nested `Folder` object supports the same shape recursively.

### `command` (string)

Executes a shell command inside the found directory after matching.

```json5
"command": "git status --porcelain"
```

Behavior:

- empty string means no command check
- command success is evaluated according to exit code

### `invert_command` (bool)

Controls logic of command result.

```json5
"invert_command": false
```

Meaning:

- `false` → command must return success (typically exit code 0)
- `true` → command must return failure (typically exit code != 0)

### `tags` (array of strings)

Category labels for browsing or filtering by tag.

```json5
"tags": ["git", "repo", "vcs"]
```

### `min_version` (string)

Minimum finder version compatibility.

```json5
"min_version": "0.3.16"
```

---

## 3.5) Pattern matching: regex, glob, and exact

Every name pattern in a template — the top-level `name`, every file
`name`, and every folder `name` (including nested folders) — is
resolved by the same matching function:

```go
if pattern == name {
    return true           // 1) exact string match
}
if ok, err := regexp.MatchString(pattern, name); err == nil {
    return ok             // 2) full Go regex
}
ok, err := path.Match(pattern, name)
return err == nil && ok   // 3) glob fallback
```

This creates a 3-tier matching strategy:

| Priority | Method                          | Applies when                               |
| -------- | ------------------------------- | ------------------------------------------ |
| 1        | exact string equality           | pattern equals the name verbatim           |
| 2        | Go regex (`regexp.MatchString`) | pattern is a valid regular expression      |
| 3        | glob (`path.Match`)             | pattern is not a valid regex (e.g. `*.ts`) |

### How to choose a pattern

Because regex is attempted before glob, the same character can mean
different things depending on the pattern:

- `"*.go"` is not a valid regex, so it is treated as a glob and
  matches any file ending in `.go`.
- `"^main\.py$"` is a valid regex (anchored, no wildcard ambiguity),
  so it matches exactly one name.
- `"project-*"` is not a valid regex, so it is treated as a glob.

### Go regex syntax (priority 2)

Patterns that compile as a Go regular expression match with full regex
semantics against the entire entry name. Refer to Go's
`regexp/syntax` (RE2) for the full language. Useful constructs:

- anchors: `^...$`
- character classes: `[0-9]`, `[a-zA-Z]`, `[^...]`
- predefined classes: `\d`, `\w`, `\s` (and uppercase negations)
- quantifiers: `*`, `+`, `?`, `{m,n}`
- alternation: `(a|b)`
- groups: `(abc)`, non-capturing `(?:abc)`
- escapes: `\.`, `\\`

Examples:

```json5
// folder names like project-123, project-42 ...
{ name: "^project-[0-9]+$" }
```

```json5
// python entry files: main.py, app.py, ...
{
  name: "^(main|app|server)\\.py$",
  existence: "required",
}
```

Note: Go regex is RE2 — no backreferences and no lookahead/lookbehind.
If your pattern uses those, it fails to compile and falls back to glob.

### Glob syntax (priority 3 fallback)

When a pattern is not a valid regex, it is treated as a glob via Go's
`path.Match`:

- `*` matches any sequence of non-`/` characters
- `?` matches any single non-`/` character
- `[abc]` matches one character from the class
- `[^abc]` / `[!abc]` matches one character not in the class
- `\x` escapes the next character

There is no recursive `**` (doublestar) support — `**` does not
descend into subdirectories.

Examples:

```json5
"name": "*.ts",
```

```json5
"name": "file?.txt",
```

```json5
"name": "[abc].go",
```

### Where these patterns apply

- top-level `name` → the scanned directory name
- `files[].name` → file names inside the directory
- `folders[].name` → subfolder names (recursively for nested folders)

Regex patterns work in all of these places. Exact glob patterns like
`"src"` or `"package.json"` work exactly as before.

### Compatibility note

Regex support was added in finder 0.3.17. If your template relies on
regex patterns, set:

```json5
"min_version": "0.3.17"
```

Templates for older finder versions should keep using glob or exact
patterns only.

---

## 4) Matching semantics

A directory is considered a match only if all required conditions are
satisfied.

This includes:

- `name` matches the folder name
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

```json5
{
  name: "*",
  files: ["package.json", "tsconfig.json"],
}
```

Bad:

```json5
{
  name: "my-app",
  files: ["package.json"],
}
```

The second version is overly restrictive and will miss most valid
project folders.

### Require the smallest useful signal

For example, a Go project should usually require:

- `go.mod`
- one or more `*.go` files

Not a huge list of optional files.

### Avoid false positives

If your project has a `README.md` in many folders, do not require it
unless it is central to your pattern.

### Use wildcards and regex carefully

```json5
"name": "*.git" // if you intended a hidden git folder, this is special-case logic
```

Use patterns like `"*"`, `"src"`, `"*.ts"`, `"package.json"` rather
than complex regex-style expressions when a simple glob suffices.

When you do need regex (e.g. matching `project-123` with
`^project-[0-9]+$`), anchor with `^` and `$` to avoid unintended
matches.

---

## 6) Examples

### Example A: Git repository

```json5
{
  description: "Git repository root",
  name: "*",
  folders: [
    {
      name: ".git",
    },
  ],
  tags: ["git", "repo"],
}
```

### Example B: Node project

```json5
{
  description: "Node.js project",
  name: "*",
  files: ["package.json", "src", "README.md"],
  tags: ["node", "javascript", "typescript"],
}
```

### Example C: Python project

```json5
{
  description: "Python project with pyproject.toml",
  name: "*",
  files: [
    "pyproject.toml",
    {
      name: "*.py",
      existence: "required",
    },
  ],
  tags: ["python", "project"],
}
```

### Example D: strict checksum template

```json5
{
  name: "*",
  description: "test for checksums",
  files: [
    {
      name: "*",
      checksums: {
        sha256: "26be688daf71f2c8e64eecfa7fdf7d1f3649b6aae80dbb686ec3a9beb9def05b",
      },
    },
  ],
  min_version: "0.3.16",
}
```

This matches only folders containing a file whose SHA256 matches
exactly.

### Example E: custom monorepo

```json5
{
  description: "Monorepo with apps and packages",
  name: "*",
  files: ["pnpm-workspace.yaml", "package.json"],
  folders: [
    {
      name: "apps",
      folders: [
        {
          name: "*",
          files: ["package.json"],
        },
      ],
    },
    {
      name: "packages",
      folders: [
        {
          name: "*",
          files: ["package.json"],
        },
      ],
    },
  ],
  tags: ["monorepo", "workspace"],
}
```

### Example F: regex-matched folder name

```json5
{
  description: "Numbered project folder",
  name: "^project-[0-9]+$",
  files: [
    {
      name: "^(main|app)\\.py$",
      existence: "required",
    },
  ],
  tags: ["python", "numbered"],
  min_version: "0.3.17",
}
```

This matches folders like `project-123` or `project-42` and requires
exactly one of `main.py` or `app.py` to be present. The name uses a
Go regex (RE2) — note the escaped dots `\\.` and anchors `^...$`.

### Example G: regex file pattern with glob fallback

```json5
{
  description: "JavaScript project with strict entry points",
  name: "*",
  files: [
    "package.json",
    {
      name: "^(index|main|app)\\.(js|ts|jsx|tsx)$",
      existence: "required",
    },
    {
      name: "\\.env$",
      existence: "forbidden",
    },
  ],
  tags: ["javascript", "strict"],
  min_version: "0.3.17",
}
```

This requires one of `index.js`, `main.js`, `app.js`, `index.ts`, etc.
and forbids any file ending in `.env`. Note that `"*.env"` would also
work as a glob — the regex version is more explicit.

---

## 7) Rules for AI-generated Finder templates

When generating a Finder template, the assistant should follow this
checklist:

1. Create a valid `.json5` file.
2. Use `name: "*"` unless the directory name is intentionally constrained.
3. Keep required files minimal and specific.
4. Prefer `required` over broad file matching if a file is essential.
5. Use `forbidden` only for truly disqualifying files.
6. Use `size` only when it genuinely distinguishes the target project type.
7. Use `checksums` only when exact file identity is important.
8. Add `tags` for discoverability.
9. Keep `description` clear and concise.
10. Prefer a deliberately narrow but realistic match over a very broad guess.
11. Validate with the project command before claiming success.

---

## 8) Validation commands

After writing a template, validate it with one of these project commands:

```bash
./finder check
```

Or test a specific template:

```bash
./finder my-template-name
```

If a template exists in the custom template folder, it will be loaded
automatically.

---

## 9) Common mistakes

### Mistake 1: too strict `name`

```json5
"name": "root"
```

This will match almost nothing unless the folder is literally named `root`.

Use:

```json5
"name": "*"
```

unless you intentionally want a fixed directory name.

### Mistake 2: requiring too many files

Large project templates often become unreliable if they require too
many files.

Prefer the smallest signal that distinguishes the project type.

### Mistake 3: mixing regex and glob syntax unintentionally

Finder tries regex first, then falls back to glob. This is usually
fine, but remember that a pattern that looks like a regex is treated
as a regex:

- `"*.ts"` is invalid regex → glob, matches any `.ts` file
- `"^main\\.py$"` is valid regex → only matches exactly `main.py`

Use:

- `*.ts`
- `package.json`
- `src`
- `^project-[0-9]+$` (regex, only when you need it)

Do not write patterns that accidentally compile as a regex and change
meaning. If in doubt, prefer glob or exact names.

### Mistake 4: forgetting the `.json5` extension

The file must end in `.json5`.

### Mistake 5: writing invalid JSON5

Remember:

- trailing commas may be allowed depending on parser handling
- keep object structure valid
- avoid broken braces and trailing commas in awkward spots

### Mistake 6: requiring impossible signals

For example, requiring a project-specific file that is generated only
in CI or only in a subset of repositories will make your template
unreliable.

---

## 10) Recommended prompt pattern for AI generation

Use this when asking an AI to generate a Finder template:

```text
Create a Finder template as a JSON5 file for <project type>.
Use a custom template file in ~/.finder/templates/ or ./.finder/templates/.
Requirements:
- match folders with name "*" unless a narrower pattern is necessary
- require the smallest set of meaningful files/folders
- include tags and a clear description
- allow optional files if needed
- do not use overly strict name filters
- ensure the structure is valid Finder JSON5
- include examples of required files and nested folders if relevant
- add a realistic command check only when needed
- keep the template robust and not prone to false positives
```

---

## 11) Final rule

A good Finder template should be:

- valid JSON5
- minimal but discriminative
- not too broad
- not too narrow
- easy to debug
- easy to maintain

If you are unsure, prefer a simple template with the most reliable
markers:

- folder names
- known files
- known subfolders
- one or two strong signs of the project type

---

## 12) One minimal example to copy

```json5
{
  description: "Simple project template",
  name: "*",
  files: [
    "package.json",
    {
      name: "src",
      existence: "optional",
    },
  ],
  tags: ["project"],
}
```

This is intentionally simple and often a good starting point for custom
templates.

---

## 13) When writing a new template for this repo

If the task is to add a template to this project, keep in mind:

- put it in the template directory used by the runtime
- follow the repo’s JSON5 style closely
- avoid accidental false positives
- validate with finder checks after creation

This repo has built-in examples in the templates folder and the project
docs in the root files.
