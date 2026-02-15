# Custom Templates Guide

> [!WARNING] 
> This file could be not updated, but there `json shema files` in
> `.finder/shema` available which will always be updated!

## How to Create Your Own Templates

Finder now supports loading custom templates from the filesystem without requiring recompilation. You can add your own project detection templates easily!

## Template Locations

Finder looks for custom templates in these directories (in order):

1. **User home directory:** `~/.finder/templates/`
2. **Local project directory:** `./.finder/templates/`

### Example directory structure:
```
~/.finder/templates/
├── myproject.json5
├── custom_framework.json5
└── proprietary_tech.json5

# OR

./.finder/templates/
├── myproject.json5
└── company_standards.json5
```

## Creating a Custom Template

Templates are JSON5 files that describe the folder structure and file patterns of a project type.

### Basic Template Structure:

```json5
{
    "description": "My Custom Project Type",
    "name": "*",
    "folders": [
        {
            "name": "src",
            "folders": [],
            "files": ["*.ts", "*.tsx", "*.js", "*.jsx"]
        },
        {
            "name": "tests",
            "folders": [],
            "files": ["*.test.ts", "*.test.js"]
        }
    ],
    "files": [
        "package.json",
        "tsconfig.json",
        "README.md"
    ]
}
```

### Template Fields Explained:

- **`description`** *(string)* - Short description of the project type
- **`name`** *(string)* - Usually set to `"*"` (matches any name)
- **`folders`** *(array)* - Nested folder structure patterns
  - **`folders[].name`** - Folder name to look for
  - **`folders[].folders`** - Nested subfolders (recursive)
  - **`folders[].files`** - File patterns to match (supports glob patterns like `*.ts`)
- **`files`** *(array)* - Top-level files to match (glob patterns supported)

### Example: Custom Monorepo Template

```json5
{
    "description": "Our Company Monorepo Standard",
    "name": "*",
    "folders": [
        {
            "name": "packages",
            "folders": [
                {
                    "name": "*",
                    "folders": [],
                    "files": ["package.json"]
                }
            ],
            "files": []
        },
        {
            "name": "scripts",
            "folders": [],
            "files": ["*.sh", "*.ps1"]
        }
    ],
    "files": [
        "pnpm-workspace.yaml",
        "root-package.json",
        "turbo.json"
    ]
}
```

## Using Custom Templates

Once you've created a template file, finder will automatically detect it!

### List all available templates (including custom ones):
```bash
finder list
```

You'll see output like:
```
Built-in Templates (370):
  react
  next
  vue
  ...

Custom Templates (2):
  myproject  (from ~/.finder/templates/ or ./.finder/templates/)
  monorepo   (from ~/.finder/templates/ or ./.finder/templates/)
```

### Use a custom template:
```bash
finder myproject
```

Finder will scan the current directory using your custom template!

### Check if templates are valid:
```bash
finder check
```

This validates both built-in and custom templates.

## Overriding Built-in Templates

If you place a custom template with the same name as a built-in template, your custom version will take precedence.

For example, if you create `~/.finder/templates/react.json5`, it will override the built-in React template.

## Tips & Best Practices

1. **Use glob patterns** for flexible file matching:
   - `*.ts` - matches all TypeScript files
   - `*.{json,yaml}` - matches JSON or YAML files
   - `*.test.{ts,js}` - matches test files in TypeScript or JavaScript

2. **Keep descriptions clear** - They appear when running `finder check`

3. **Test your template** - Run `finder check` to validate the JSON5 syntax

4. **Name it meaningfully** - The filename (without `.json5`) becomes the template name

5. **Don't need nested folders?** - Leave the `folders` array empty: `"folders": []`

## Examples

Check the built-in templates in `/internal/templates/` for more examples:
- Simple project: `python.json5`, `go.json5`
- Complex: `next.json5`, `spring-boot.json5`
- Monorepo: `monorepo.json5`, `turborepo.json5` (would be custom)

## Troubleshooting

### Template not loading?
1. Ensure the file ends with `.json5`
2. Check the file is in the right directory: `~/.finder/templates/` or `./.finder/templates/`
3. Verify JSON5 syntax with `finder check`

### Template loads but gives wrong results?
1. Review your folder and file patterns
2. Make sure glob patterns are correct
3. Test with `finder check` to see the description

### Need help?
Run `finder help` for more command options.
