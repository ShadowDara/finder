# finder

[![Build Status](https://github.com/ShadowDara/finder/actions/workflows/release.yml/badge.svg)](https://github.com/ShadowDara/finder/actions/workflows/release.yml)
[![Build Check](https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml/badge.svg)](https://github.com/ShadowDara/finder/actions/workflows/buildcheck.yml)
[![Deploy GitHub Pages](https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml/badge.svg)](https://github.com/ShadowDara/finder/actions/workflows/deploywebpage.yml)
[![GitHub contributors](https://img.shields.io/github/contributors/shadowdara/finder)](https://github.com/shadowdara/finder/graphs/contributors)
[![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/m/shadowdara/finder)](https://github.com/shadowdara/finder/commits)
[![Last Commit](https://badges.ws/github/last-commit/shadowdara/finder)](https://github.com/shadowdara/finder/commits)
[![GitHub all releases](https://img.shields.io/github/downloads/shadowdara/finder/total?logo=github)](https://github.com/shadowdara/finder/releases)
[![GitHub release (with filter)](https://img.shields.io/github/v/release/shadowdara/finder?logo=github)](https://github.com/shadowdara/finder/releases)
[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/shadowdara/finder?logo=github)](https://github.com/shadowdara/finder.git)
[![GitHub repo size](https://img.shields.io/github/repo-size/shadowdara/finder?logo=github)](https://github.com/shadowdara/finder.git)
[![Lang Count](https://badges.ws/github/lang-count/shadowdara/finder)](https://github.com/shadowdara/finder.git)
![GitHub Repo stars](https://img.shields.io/github/stars/shadowdara/finder)
![GitHub forks](https://img.shields.io/github/forks/shadowdara/finder)
![Maintained](https://badges.ws/maintenance/yes/2026)
![Handmade](https://badges.ws/handmade)
[![Go Reference](https://pkg.go.dev/badge/github.com/shadowdara/finder)](https://pkg.go.dev/github.com/shadowdara/finder)

Finder is a lightweight command-line tool written in Go to locate
projects and files based on predefined folder/file structure templates.
It ships with **370+ built-in templates** covering a huge range of
technologies, frameworks, and services — and you can add your own
without recompiling.

> **Current version: 0.3.17**

## Features

- **Template-based search** — find projects by folder/file structure
  using JSON5 templates (370+ built-in).
- **Custom templates** — drop `.json5` files into
  `~/.finder/templates/` or `./.finder/templates/` and they are
  loaded automatically. User templates can override built-in ones.
- **Regex support** — use regular expressions in template patterns
  for advanced matching.
- **Async search** — searches all drives (Windows) or root `/`
  (Linux/macOS) in parallel for maximum speed.
- **Caching** — create and reuse a cache for significantly faster
  repeat searches.
- **JSON output** — pipe results into other tools with `--json`.
- **Tag search** — browse templates by tag (`-t <tag>`).
- **Binary search** — find executables in your `$PATH` (`-b`).
- **File size & checksum validation** — templates can require
  minimum/maximum file sizes and SHA-256/SHA-512 checksums.
- **Command validation** — templates can run a shell command after
  matching and filter by exit code.
- **Web UI (`findergen`)** — a built-in HTTP server for browsing,
  creating, and editing templates, viewing the cache, and more.
- **Cross-platform** — works on Windows, Linux, and macOS.

## Requirements

- Go 1.18 or newer

## Binaries

The repository contains several binaries:

| Binary      | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `finder`    | Main CLI — search for projects and files using templates                     |
| `findergen` | HTTP server & web UI for template management, cache viewer, config editor    |
| `csf`       | Build helper — compile scripts, `go install` with CGO, git repo pack/restore |
| `tester`    | Template test tool — validates template files                                |

## Installation

### Build from source

```sh
go build ./cmd/finder
```

Or install directly (Go 1.18+):

```sh
go install github.com/shadowdara/finder/cmd/finder@latest
```

The produced binary is `finder` (on Windows `finder.exe`).

### Build all binaries

```sh
# Windows
build.bat

# Linux / macOS
go build ./cmd/finder
go build ./cmd/findergen
go build ./cmd/tester
```

Or using `make`:

```sh
make          # debug build
make release  # release build with stripped symbols
make install  # build release + copy to /usr/local/bin
```

## Usage

### Basic search

```sh
finder <template-name>
```

Find Git repositories:

```sh
finder git
```

### Commands

| Command                  | Aliases   | Description                                        |
| ------------------------ | --------- | -------------------------------------------------- |
| `finder <template>`      |           | Search for projects matching a template            |
| `finder check`           |           | Validate all built-in and custom templates         |
| `finder validate`        | `val`     | Validate a single template file                    |
| `finder list`            | `ls`      | List all available templates                       |
| `finder tags`            | `tag`     | Show all tags in the console                       |
| `finder -t <tag>`        |           | Search for templates by tag                        |
| `finder -b`              |           | Search for executables in your `$PATH`             |
| `finder cp`              |           | Print the path to the global config file           |
| `finder version`         | `-v`, `v` | Print the current version                          |
| `finder template <name>` | `tpl`     | Search using an explicit template name             |
| `finder view <name>`     |           | View the content of a template in the command line |

### Global flags

| Flag        | Aliases | Description            |
| ----------- | ------- | ---------------------- |
| `--json`    | `-j`    | Output results as JSON |
| `--verbose` | `-vv`   | Enable verbose output  |

### Cache flags

| Flag                | Aliases | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| `--cache`           | `-c`    | Use the existing cache instead of searching |
| `--create-cache`    | `-cc`   | Create a new cache                          |
| `--create-cache-db` | `-ccd`  | Create a Git database from cache data       |

### Example

```sh
# Find all React projects
finder react

# Find with JSON output
finder --json react

# Create a cache for faster repeat searches
finder --create-cache git

# Use the cache
finder --cache git

# Find templates tagged with "python"
finder -t python

# List all templates
finder list
```

### Validate a single template

```bash
# Validate a template file by path
finder validate my-template.json5

# Validate a built-in or custom template by name
finder validate go

# Validate multiple templates at once
finder validate templates/go.json5 templates/django.json5

# Short alias
finder val my-template.json5
```

If a template file is not plain JSON and only parses after the JSON5
preprocessor runs, a warning is printed so you know the template
depends on JSON5 features (e.g. unquoted keys):

```text
File                       Result     Warning
my-template.json5          OK (File)  Template is not plain JSON - it needs the JSON5 preprocessor to be parsed
```

## Templates

### Built-in templates

370+ templates are shipped in `templates/` and compiled into
`internal/templates/`. They cover frameworks, languages, databases,
CI/CD systems, cloud services, AI/ML tools, and much more.

### Template format

Templates are JSON5 files. A minimal template:

```json5
{
  name: "*",
  folders: [{ name: ".git" }],
}
```

A full template with all supported fields:

```json5
{
  min_version: "0.3.6",
  description: "My Custom Project Type",
  name: "*",
  tags: ["node", "typescript"],
  folders: [
    {
      name: "src",
      folders: [],
      files: ["index.ts"],
    },
  ],
  files: [
    "package.json",
    {
      name: "*.ts",
      existence: "required",
      size: {
        min: 1,
        min_size_type: "KB",
      },
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

### Custom templates

> [!IMPORTANT]
> Starting with Finder version 0.3.18, Finder supports the following template file extensions: [`.json`, `.jsonc`, `.json5`]

> [!WARNING]
> Starting with finder version 0.3.25 (not released yet), running a template which end with `.json5` while create a warning

Place your own `.json5` template files in:

| OS      | Path                               |
| ------- | ---------------------------------- |
| Windows | `%USERPROFILE%\.finder\templates\` |
| Linux   | `~/.finder/templates/`             |
| macOS   | `~/.finder/templates/`             |

Or in the project-local directory:

```
./.finder/templates/
```

User templates take precedence over built-in templates with the
same name. See [`CUSTOM_TEMPLATES.md`](CUSTOM_TEMPLATES.md) for the
full guide.

### Pattern matching (exact and glob); regex via `name_regex`

The `name` field (top-level, files, and folders) uses a **2-tier
matching strategy** — exact match first, then glob (`path.Match`).
Regular expressions are **not** interpreted inside `name` anymore.

| Priority | Method                | Applies when                     |
| -------- | --------------------- | -------------------------------- |
| 1        | Exact string equality | pattern equals the name verbatim |
| 2        | Glob (`path.Match`)   | pattern contains `*`/`?`/`[`     |

For regex matching use the separate **`name_regex`** field (available
on top-level templates, files, and folders). It is matched with a full
Go regex (RE2) against the name. When both `name` and `name_regex` are
set, **both** must match.

This means:

- `"src"` → exact match
- `"*"` → matches any name
- `"*.ts"` → glob, matches any `.ts` file
- `"^project-[0-9]+$"` in `name` → **not** a regex anymore; a `^`/`$`
  literal pattern like this matches only an identical literal name.
  Put regexes into `name_regex` instead.

Regex patterns live in the `name_regex` field:

```json5
// top-level name_regex: match folder names like project-42, project-99
{
  name: "*",
  name_regex: "^project-[0-9]+$",
  min_version: "0.3.18",
  files: [
    {
      // file name_regex: match exactly main.py, app.py, or server.py
      name_regex: "^(main|app|server)\\.py$",
      existence: "required",
    },
  ],
  folders: [
    {
      // folder name_regex: match src, lib, or pkg
      name_regex: "^(src|lib|pkg)$",
    },
  ],
}
```

> **Note:** Go regex is RE2 — no backreferences and no
> lookahead/lookbehind. An invalid regex never matches (it fails
> closed); use `finder check`/`finder validate` to catch mistakes.

Templates that rely on `name_regex` should set
`"min_version": "0.3.18"`.

## Config

Since **v0.3.15**, finder has a global config file at
`~/.finder/config.json5`. If the file does not exist, defaults are
used:

```json5
{
  port: 8080,
  cache: false,
  create_cache_db: false,
  finder_instances: 8,
}
```

| Key                | Type | Default | Description                                |
| ------------------ | ---- | ------- | ------------------------------------------ |
| `port`             | int  | `13420` | HTTP server port for `findergen`           |
| `cache`            | bool | `false` | Enable cache by default                    |
| `create_cache_db`  | bool | `false` | Create a Git database from cache data      |
| `finder_instances` | int  | `8`     | Max parallel instances when creating cache |

For a visual config editor, visit
[https://shadowdara.github.io/finder/configeditor](https://shadowdara.github.io/finder/configeditor).

## Web UI (`findergen`)

`findergen` starts a local HTTP server with a web interface for:

- **Template Creator** — create and edit JSON5 templates visually
- **Template Viewer** — browse all built-in and custom templates
- **Config Editor** — edit `config.json5` through the browser
- **Cache Viewer** — inspect cached search results
- **Regex Creator** — build and test regular expressions for templates
- **Minecraft World Dashboard** — view Minecraft worlds from the cache

```sh
# Start the web UI on the default port
./findergen

# Use a custom port
./findergen --port 3000

# Collect Minecraft worlds from cache
./findergen worlds
```

## Project structure

```
finder/
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
└── finder-template-generator-ssg/  # Static site generator for docs
```

## Development

### Run tests

```sh
go test ./...
```

### Generate coverage report

```sh
go test -coverprofile=coverage ./...
go tool cover -html=coverage
```

### Build

```sh
go build ./cmd/finder
```

### Validate templates

```sh
go run ./cmd/finder check
```

### List all templates

```sh
go run ./cmd/finder list
```

## Contributing

- Found a missing or inaccurate template? Please open an issue.
- Add new templates via PR. Keep them in JSON5 and provide a short
  description of what the template matches.
- Feel free to contribute code improvements or new features.

### Clone the Repo

```sh
git clone --depth=1 https://github.com/shadowdara/finder
```

## Roadmap

- [ ] Temporary templates via command-line arguments
- [ ] Template schema validation
- [ ] Improved search history
- [ ] Extended web UI features

## License

See [`LICENSE`](LICENSE).

---

**Project:** [https://github.com/shadowdara/finder](https://github.com/shadowdara/finder)
**Website:** [https://shadowdara.github.io/finder](https://shadowdara.github.io/finder)

## Extra Info

The Project [fs-tools](https://github.com/shadowdara/fs-tools) was more or less
the prototype for finder.

## Info Video

(_a Youtube Video_)

[![INFO Video 1 about Finder](https://img.youtube.com/vi/oIRgAYv-mOA/0.jpg)](https://www.youtube.com/watch?v=oIRgAYv-mOA)
