# finder (C++20)

A C++20 reimplementation of [shadowdara/finder](https://github.com/shadowdara/finder) —
a CLI tool to locate projects based on predefined folder/file structure templates.

## Features

- Searches recursively using JSON5 templates
- Built-in templates for common project types (git, node, go, rust, python, cmake, docker, maven)
- User templates in `~/.config/finder/templates/` (Linux/macOS) or `%APPDATA%\finder\templates\` (Windows)
- Optional command filter per template (`command` / `invert_command`)
- ANSI colour output on supported terminals
- Zero external dependencies — only C++20 standard library + `<filesystem>`

## Build

Requirements: C++20 compiler (GCC 13+, Clang 16+, MSVC 2022+), CMake 3.25+

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Binary: `build/finder`

## Usage

```
finder <template-name>   # search current directory
finder check             # list all available templates
```

### Examples

```bash
# Find all Git repositories under the current directory
finder git

# Find all Rust projects
finder rust

# List all known templates
finder check
```

## Templates

Templates are JSON5 files with the following structure:

```json5
{
    "name": "*",              // display name  (* = any directory name)
    "description": "",        // shown in 'finder check' and on search
    "folders": [
        { "name": ".git" }    // required sub-directories
    ],
    "files": [],              // required files
    "command": "",            // optional shell command to run in the match dir
    "invert_command": false   // if true: include only when command FAILS
}
```

Place custom templates in:
- `./templates/` (relative to CWD — useful for development)
- `~/.config/finder/templates/` (Linux / macOS)
- `%APPDATA%\finder\templates\` (Windows)

## Built-in Templates

| Key      | Matches                          |
|----------|----------------------------------|
| `git`    | Git repositories (`.git` folder) |
| `node`   | Node.js projects (`package.json`)|
| `golang` | Go modules (`go.mod`)            |
| `rust`   | Rust projects (`Cargo.toml`)     |
| `python` | Python projects (`pyproject.toml`)|
| `cmake`  | CMake projects (`CMakeLists.txt`)|
| `docker` | Docker projects (`Dockerfile`)   |
| `maven`  | Maven Java projects (`pom.xml`)  |

## License

GPL-3.0 — same as the original project.
