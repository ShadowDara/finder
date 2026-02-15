# CLI Architecture Documentation

## Overview

The CLI module (`internal/cli/`) has been reorganized into a clean, modular architecture that separates concerns:

- **Argument Parsing** → `parser.go`
- **Command Routing** → `commands.go`
- **Command Handlers** → `handlers.go`
- **Help Text** → `help.go`

## File Structure

```
internal/cli/
├── commands.go         # Main entry point (HandleCommand) & routing logic
├── parser.go           # CLI argument parsing & CLIOptions struct
├── handlers.go         # Individual command handler functions
├── help.go             # Help text generation
├── color/              # Terminal color utilities
├── commands_test.go    # Tests for command & integration
├── parser_test.go      # Tests for parsing logic
└── help_test.go        # Tests for help text
```

## Data Flow

```
Raw Arguments ([]string)
         ↓
    ParseCLI()  [parser.go]
         ↓
  CLIOptions struct
         ↓
 routeCommand()  [commands.go]
         ↓
  HandlerFunc
         ↓
Handler Execution [handlers.go]
         ↓
   Output
```

## Key Components

### 1. CLIOptions Struct (parser.go)

Represents parsed command-line arguments in a structured way:

```go
type CLIOptions struct {
    Command    string     // The main command (help, list, -f, etc.)
    Args       []string   // Remaining arguments
    OutputType string     // "normal", "json", or "clear"
    Verbose    bool
}
```

**Methods:**
- `IsHelp()` - Detects help commands
- `IsList()` - Detects list command
- `IsCheck()` - Detects check command
- `IsFileLoad()` - Detects -f/--file command
- `IsDirectLoad()` - Detects -c/--config command
- `IsTemplateSearch()` - Detects template name search
- `GetFileArg()` - Safely extracts file path
- `GetDirectLoadArg()` - Safely extracts JSON string
- `GetTemplateName()` - Returns template name

### 2. ParseCLI() Function (parser.go)

```go
func ParseCLI(args []string) (*CLIOptions, error)
```

**Responsibilities:**
- Validates minimum argument count
- Scans for global flags (`--json`, `--clear`, `--verbose`)
- Extracts the main command
- Collects remaining arguments
- Returns structured options or error

**Parsing Strategy:**
1. First pass: Detect and normalize global flags
2. Second pass: Extract main command (position 1)
3. Third pass: Collect remaining args

### 3. HandlerFunc Type (handlers.go)

```go
type HandlerFunc func(opts *CLIOptions) error
```

All command handlers follow this signature, enabling:
- Consistent error handling
- Easy handler registration
- Clear separation of concerns

### 4. Command Handlers (handlers.go)

Individual functions for each command type:

- `handleHelp(opts)` - Displays help information
- `handleList(opts)` - Lists available templates
- `handleCheck(opts)` - Validates all templates
- `handleFileLoad(opts)` - Loads custom JSON files
- `handleDirectLoad(opts)` - Processes inline JSON
- `handleTemplateSearch(opts)` - Searches and applies templates

### 5. routeCommand() Function (commands.go)

```go
func routeCommand(opts *CLIOptions) HandlerFunc
```

Maps parsed options to the appropriate handler:

```go
switch {
case opts.IsHelp():
    return handleHelp
case opts.IsList():
    return handleList
// ... etc
default:
    return nil
}
```

### 6. HandleCommand() Entry Point (commands.go)

```go
func HandleCommand(args []string)
```

The public API that orchestrates:
1. Parse CLI arguments
2. Print header (unless `--clear`)
3. Route to appropriate handler
4. Execute handler and display errors

## Supported Commands

| Command | Syntax | Purpose |
|---------|--------|---------|
| Help | `help`, `h`, `-h`, `--help` | Display help information |
| List | `list`, `ls` | List all available templates |
| Check | `check` | Validate all templates |
| File Load | `-f`, `--file <path>` | Load structure from JSON file |
| Direct Load | `-c`, `--config <json>` | Load structure from inline JSON |
| Template Search | `<template-name>` | Detect project structure using template |

## Supported Flags

| Flag | Scope | Purpose |
|------|-------|---------|
| `--json` | Global | Output results as JSON |
| `--clear` | Global | Suppress header/metadata output |
| `--verbose` | Global | Enable verbose output mode |

## Example Usage

```bash
# Help
finder help
finder -h

# List templates
finder list
finder list --verbose

# Check templates
finder check

# Load from file
finder -f ./my-project.json5
finder --file path/to/config.json5 --json

# Load from command line
finder -c '{"name": "test", "files": []}'

# Template search
finder react
finder django --json
finder custom-template --clear
```

## Error Handling

The architecture provides:

1. **Parser-level errors** - Missing required arguments, invalid syntax
2. **Handler-level errors** - File not found, invalid JSON, template not found
3. **User feedback** - Color-coded error messages with helpful hints

Example:
```
finder nonexistent-template
→ Template 'nonexistent-template' not found.
→ Available templates: react, django, next, ...
```

## Testing

### Parser Tests (`parser_test.go`)
- Command recognition (help, list, check, etc.)
- Flag parsing (-f, -c, --json, --clear, --verbose)
- Argument extraction
- Error conditions
- Command precedence

### Handler Integration Tests (`commands_test.go`)
- End-to-end command execution
- Output validation
- Error message verification
- Flag combinations

### Help Tests (`help_test.go`)
- Help text content
- Platform paths
- Blocked template names
- Command descriptions

## Extending the CLI

To add a new command:

1. **Add command detection method** in `CLIOptions` (parser.go):
   ```go
   func (o *CLIOptions) IsMyCommand() bool {
       return o.Command == "mycommand" || o.Command == "mc"
   }
   ```

2. **Create handler function** in `handlers.go`:
   ```go
   func handleMyCommand(opts *CLIOptions) error {
       // Implementation
       return nil
   }
   ```

3. **Add route case** in `routeCommand()` (commands.go):
   ```go
   case opts.IsMyCommand():
       return handleMyCommand
   ```

4. **Add tests** in appropriate `*_test.go` file

5. **Update help text** in `help.go`

## Benefits of This Architecture

✅ **Separation of Concerns**
- Parsing logic isolated from execution
- Each handler focuses on one command

✅ **Testability**
- Each component can be tested independently
- CLIOptions enables unit testing without actual CLI invocation

✅ **Maintainability**
- Clear code flow and responsibility allocation
- Easy to locate and modify specific command logic

✅ **Extensibility**
- Simple to add new commands
- Consistent patterns across handlers

✅ **Readability**
- Explicit command routing
- Descriptive method names
- Self-documenting code

## Single Responsibility Principle

| Module | Responsibility |
|--------|-----------------|
| parser.go | Parse arguments into structures |
| commands.go | Route to appropriate handler |
| handlers.go | Execute specific commands |
| help.go | Generate help text |

Each file has one clear purpose, making the codebase easier to understand and maintain.
