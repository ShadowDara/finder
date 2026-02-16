# CHANGELOG

## Newest ... -> 0.3.4 prob

## 0.3.4
- changed Go Version to 1.18
- fixed *`Search on all Drives on Windows`* from 0.3.3, it
didn't quite well before
- added Async Search
- made color package public

## 0.3.3
- added JSON Shema
- added File Options
- Search on all Drives on Windows
- added Tag Search

## 0.3.2
- little Fixes

## 0.3.1 - 15.02.2026

### ✨ Features

#### Runtime Custom Template System
- **Custom Templates without Recompilation**: Users can now create templates in `~/.finder/templates/` or `./.finder/templates/` without recompiling the program
- **Automatic Template Discovery**: New `.json5` files are automatically detected and loaded on startup
- **User Templates Override**: User-defined templates can override built-in templates with the same name
- **Precedence System**: User templates take precedence over built-in templates

#### CLI Reorganization & Modernization
- **Modular CLI Architecture**: Complete restructuring from monolithic design
  - `parser.go`: Dedicated argument parsing logic
  - `handlers.go`: Isolated command handlers
  - `commands.go`: Clean routing (reduced from 300+ to 60 lines)
- **Command Aliases**: New shorter forms for common commands
  - `h`, `-h`, `--help` in addition to `help`
  - `ls` in addition to `list`
  - `--file` in addition to `-f`
  - `--config` in addition to `-c`
- **CLIOptions Struct**: Structured argument representation with predicates
  - `.IsHelp()`, `.IsList()`, `.IsCheck()`, `.IsFileLoad()`, `.IsDirectLoad()`, `.IsTemplateSearch()`
  - `.GetFileArg()`, `.GetDirectLoadArg()`, `.GetTemplateName()`
- **Verbose Mode**: New `--verbose` flag for extended output

#### Enhanced Help System
- **Better Help Structure**: Organized into COMMANDS, FILE & CONFIG OPERATIONS, GLOBAL FLAGS
- **Table Layout**: Improved readability with consistent formatting
- **Custom Templates Info**: Documentation for user template setup
- **Detailed Descriptions**: Each command with clear explanation

#### Enhanced List & Check Commands
- **Separated Display**: Built-in and custom templates are listed separately
- **Template Sources**: Source attribute shows whether template is built-in or custom
- **Helpful Hints**: Paths for custom template setup are displayed
- **Improved Validation**: Check command validates with source information

### 🧪 Testing
- **40+ new unit tests** for CLI parser logic
- **Parser Tests**: Comprehensive coverage for command recognition, flag parsing, argument extraction
- **Integration Tests**: End-to-end tests for command execution
- **Routing Tests**: Tests for handler mapping
- **Error Handling Tests**: Validation of error handling and user feedback

### 📖 Documentation
- **ARCHITECTURE.md**: Detailed technical documentation of the new CLI structure
- **REORGANIZATION.md**: Comprehensive before/after comparison and explanation
- **QUICKSTART.md**: Practical guide for adding new commands
- **CUSTOM_TEMPLATES.md**: User guide for custom template creation
- **Inline Code Comments**: Improved code documentation

### 🔧 Infrastructure
- **Enhanced Template Loader** (`templateloader.go`)
  - `LoadUserTemplates()`: Discovers user templates from filesystem
  - `JSONtemplateLoaderWithUserTemplates()`: Intelligent loading with user override
  - `LoadAllWithUserTemplates()`: Combined built-in + custom template discovery
- **Template Override Mechanism**: User templates can replace built-in templates
- **Graceful Error Handling**: Missing user template directories are not fatal

### 🎯 Quality Improvements
- **Clean Code Structure**: Single Responsibility Principle consistently applied
- **Better Testability**: Each module can be tested in isolation
- **Extensibility**: New commands can be added in 5 simple steps
- **Backward Compatibility**: External API (`HandleCommand()`) unchanged

### 👥 User Experience
- **Better Error Messages**: Context-sensitive error messages with suggestions
- **Helpful Hints**: Tips for common tasks (e.g., where to place templates)
- **Flexible Command Syntax**: Multiple synonyms for each command
- **Consistent Output Formatting**: Unified design across all commands

### 📊 Performance
- **No Recompilation Required**: Custom templates are loaded at runtime
- **Efficient Template Discovery**: Fast filesystem traversal
- **Minimal Overhead**: Template loading has negligible performance impact

### 🐛 Bug Fixes & Improvements
- Improved error handling in template loading
- Better handling of missing or malformed user templates
- Consistent error messages across all commands
- Fixed edge cases in CLI argument parsing

### 📝 Breaking Changes
- **No Breaking Changes**: All existing commands work unchanged
- Internal structure completely refactored, but public API remains stable

### 🙏 Highlights
This version brings the biggest improvement since 0.2.0:
- Users can now create their own templates
- Codebase is more maintainable and extensible
- Test coverage drastically improved

---

## 0.3.0 - 23.01.2026
Template System & CLI Foundations

# 0.2.0 - 23.01.2026
More Templates
Better Console Output
Help Message

# 0.1.0 - 17.05.2025
Programm Init
