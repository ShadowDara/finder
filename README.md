<!--
go build ./cmd/finder
-->

# finder

Finder is a small command-line tool written in Go to locate projects
based on predefined folder/file structure templates.

In short: you can search for repositories (e.g. `.git`), project layouts,
or your own custom structures using templates.

## Commiting

feel free to help the Project by committing Code for the project are Templates.
Feel although free to submit Templates via Issues!

## Features

- Searches using JSON5 templates stored in `internal/structure/templates`.
- Supports user templates in the OS-specific configuration folder.
- Lightweight, tested, and easy to extend.

## Requirements

- Go 1.18 or newer

## Installation

Build from source:

```bash
go build ./cmd/finder
```

Or install with `go install` (Go 1.18+):

```bash
go install github.com/shadowdara/finder/cmd/finder@latest
```

The produced binary is `finder` (on Windows `finder.exe`).

## Usage

Basic syntax:

```bash
finder <template-name>
```

Example — find Git repositories:

```bash
finder git
```

The program searches the current directory recursively and prints
matches based on the template name.

## Templates

Default templates are stored in `internal/structure/templates`.
Templates are JSON5 files with fields such as `name`, `files`, and
`folders`. A simple template to find Git repositories looks like:

```json5
{
    "name": "*",
    "folders": [
        { "name": ".git" }
    ],
}
```

And a full template looks like this. Empty Value are not required
in the Template. The `description` will be displayed in the program
when searching for the Template and although when displaying all
templates. The `command` runs in the Structure Directory after the
Structure is found. The Entrywill only be added is the `command` 
returns `0` when `invert_command` is `false`, else `1`.

```json5
{
    "name": "*",
    "description": "",
    "folders": [
        { "name": ".git" }
    ],
    "files": [],
    "command": "",
    "invert_command": false
}
```

<!-- Place custom templates in the following folder: -->

<!-- - Windows: `%AppData%\\finder`
- Linux: `~/.config/finder`
- macOS: `~/Library/Application Support/finder` -->

Then call `finder <template-name>` to use them.

## Development

Run tests:

```bash
go test ./...
```

Generate coverage report:

```bash
go test -coverprofile=coverage ./...
go tool cover -html=coverage
```

Build:

```bash
go build ./cmd/finder
```

## Contributing

- Found a missing or inaccurate template? Please open an issue.
- Add new templates via PR. Keep them in JSON5 and provide a short
    description of what the template matches.

## Roadmap / Ideas

- use temporary Template via the Command Line
- Caching/Indexing for faster searches
- Web UI for template management
- Template schema and validation

## License

See `LICENSE`.

---

Project: `https://github.com/shadowdara/finder`
