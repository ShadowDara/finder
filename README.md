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

| Binary | Description |
| ------ | ----------- |
| `finder` | Main CLI — search for projects and files using templates |
| `findergen` | HTTP server & web UI for template management, cache viewer, config editor |
| `csf` | Build helper — compile scripts, `go install` with CGO, git repo pack/restore |
| `tester` | Template test tool — validates template files |

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

| Command | Aliases | Description |
| ------- | ------- | ----------- |
| `finder <template>` | | Search for projects matching a template |
| `finder check` | | Validate all built-in and custom templates |
| `finder list` | `ls` | List all available templates |
| `finder tags` | `tag` | Show all tags in the console |
| `finder -t <tag>` | | Search for templates by tag |
| `finder -b` | | Search for executables in your `$PATH` |
| `finder cp` | | Print the path to the global config file |
| `finder version` | `-v`, `v` | Print the current version |
| `finder template <name>` | `tpl` | Search using an explicit template name |

### Global flags

| Flag | Aliases | Description |
| ---- | ------- | ----------- |
| `--json` | `-j` | Output results as JSON |
| `--verbose` | `-vv` | Enable verbose output |

### Cache flags

| Flag | Aliases | Description |
| ---- | ------- | ----------- |
| `--cache` | `-c` | Use the existing cache instead of searching |
| `--create-cache` | `-cc` | Create a new cache |
| `--create-cache-db` | `-ccd` | Create a Git database from cache data |

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

## Templates

### Built-in templates

370+ templates are shipped in `templates/` and compiled into
`internal/templates/`. They cover frameworks, languages, databases,
CI/CD systems, cloud services, AI/ML tools, and much more.

### Template format

Templates are JSON5 files. A minimal template:

```json5
{
  "name": "*",
  "folders": [{ "name": ".git" }]
}
```

A full template with all supported fields:

```json5
{
  "min_version": "0.3.6",
  "description": "My Custom Project Type",
  "name": "*",
  "tags": ["node", "typescript"],
  "folders": [
    {
      "name": "src",
      "folders": [],
      "files": ["index.ts"]
    }
  ],
  "files": [
    "package.json",
    {
      "name": "*.ts",
      "existence": "required",
      "size": {
        "min": 1,
        "min_size_type": "KB"
      }
    }
  ],
  "command": "",
  "invert_command": false,
  "size": {
    "min": 10,
    "min_size_type": "KB"
  }
}
```

### Custom templates

Place your own `.json5` template files in:

| OS | Path |
| -- | ---- |
| Windows | `%USERPROFILE%\.finder\templates\` |
| Linux | `~/.finder/templates/` |
| macOS | `~/.finder/templates/` |

Or in the project-local directory:

```
./.finder/templates/
```

User templates take precedence over built-in templates with the
same name. See [`CUSTOM_TEMPLATES.md`](CUSTOM_TEMPLATES.md) for the
full guide.

### Pattern matching (exact, regex, glob)

Since **v0.3.17**, every name pattern in a template — the top-level
`name`, every file `name`, and every folder `name` (including nested
folders) — is resolved by a **3-tier matching strategy**:

| Priority | Method | Applies when |
| -------- | ------ | ------------ |
| 1 | Exact string equality | pattern equals the name verbatim |
| 2 | Go regex (`regexp.MatchString`) | pattern compiles as a valid regex (RE2) |
| 3 | Glob (`path.Match`) | pattern is not a valid regex (e.g. `*.ts`) |

This means:

- `"src"` → exact match
- `"^project-[0-9]+$"` → valid regex, matches `project-123`, `project-42`, …
- `"*.ts"` → not a valid regex → glob fallback, matches any `.ts` file
- `"^(main|app|server)\.py$"` → valid regex, matches exactly `main.py`,
  `app.py`, or `server.py`

Regex patterns work in **all** name fields:

```json5
// top-level name: match folder names like project-42, project-99
{
  "name": "^project-[0-9]+$",
  "min_version": "0.3.17",
  "files": [
    {
      // file name: match exactly main.py, app.py, or server.py
      "name": "^(main|app|server)\\.py$",
      "existence": "required"
    }
  ],
  "folders": [
    {
      // folder name: match src, lib, or pkg
      "name": "^(src|lib|pkg)$"
    }
  ]
}
```

> **Note:** Go regex is RE2 — no backreferences and no
> lookahead/lookbehind. If your pattern uses unsupported syntax, it
> fails to compile and falls back to glob matching.

If your template relies on regex patterns, set `"min_version": "0.3.17"`
to indicate the minimum Finder version required.

## Config

Since **v0.3.15**, finder has a global config file at
`~/.finder/config.json5`. If the file does not exist, defaults are
used:

```json5
{
  "port": 8080,
  "cache": false,
  "create_cache_db": false,
  "finder_instances": 8
}
```

| Key | Type | Default | Description |
| --- | ---- | ------- | ----------- |
| `port` | int | `8080` | HTTP server port for `findergen` |
| `cache` | bool | `false` | Enable cache by default |
| `create_cache_db` | bool | `false` | Create a Git database from cache data |
| `finder_instances` | int | `8` | Max parallel instances when creating cache |

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
