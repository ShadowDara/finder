# vite-plugin-minisite

A Vite plugin that compiles a folder of Markdown files (plus optionally embedded assets) into a **single, self-contained `index.html`** – with hash routing and embedded Markdown CSS. No external server, no build steps when shipping.

This is the successor of the `sam-cli minisite` command from `samengine-cli`, now as a real Vite plugin in TypeScript.

## Features

- 📄 Markdown pages from `pages/` (nesting allowed, `index.md` = home page)
- 🏷 Hash routing (`#/sub/route`), optional 404 page via `pages/404.md`
- 🎨 Embedded Markdown CSS (minified)
- 🖼 Assets (images, videos, PDFs, text files, …) embedded directly into the page as base64 data URIs – **100 % offline/standalone**
- 🛠 Vite dev server + watch: changes to `.md` files trigger recompilation
- 📦 Build: writes the finished `index.html` into the `outDir`

## Installation

```bash
npm install --save-dev vite-plugin-minisite
```

## Usage

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { minisite } from "vite-plugin-minisite";

export default defineConfig({
  plugins: [
    minisite({
      // Options (all optional)
      pagesDir: "pages", // Markdown folder
      assets: [
        // embedded files
        { file: "assets/logo.png", type: "image/png", slug: "logo" },
      ],
    }),
  ],
});
```

### Project structure

```
├── vite.config.ts
├── pages/
│   ├── index.md          → Route "#/" (home page)
│   ├── 404.md            → Route "#/404" (fallback)
│   ├── about.md          → Route "#/about"
│   └── docs/
│       └── guide.md      → Route "#/docs/guide"
└── assets/
    └── logo.png
```

After `vite build`, a complete page is written to `dist/index.html` – just drop it on any static host (or double-click it locally).

## Options

| Option     | Type                                               | Default                                   | Description                                                        |
| ---------- | -------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `pagesDir` | `string`                                           | `"pages"`                                 | Folder containing the Markdown files                               |
| `template` | `string`                                           | (built-in)                                | Custom HTML template file (must contain `__PAGES__` and `__CSS__`) |
| `markdown` | `{ externalLinks, breaks, smartypants, sanitize }` | `{ externalLinks: true, sanitize: true }` | Markdown parser options                                            |
| `assets`   | `MiniSiteAsset[]`                                  | `[]`                                      | Embedded assets (`{ file, type, slug }`)                           |
| `outFile`  | `string`                                           | `"index.html"`                            | File name in the `outDir`                                          |
| `mounts`   | `string[]`                                         | `[]`                                      | Additional mount paths for virtual modules (advanced)              |

### Assets

```ts
minisite({
  assets: [
    { file: "assets/logo.png", type: "image/png", slug: "logo" },
    { file: "assets/demo.mp4", type: "video/mp4", slug: "video" },
    { file: "docs/handbuch.pdf", type: "application/pdf", slug: "pdf" },
    { file: "assets/readme.txt", type: "text/plain", slug: "text" },
  ],
});
```

Each asset is reachable under `#/___assets___/<slug>`.

## Template

Default template (bundled). If `template.html` exists in the project root, it takes precedence. It must contain these placeholders:

```html
<style>
/*__CSS__{}*/        <!-- Markdown CSS is injected here -->
</style>
...
<script>
const pages = __PAGES__;   <!-- Pages table is injected here -->
...
```

## Programmatic API

In addition to the plugin integration, you can use the compilation directly:

```ts
import { minisite, compilePages, renderHtml } from "vite-plugin-minisite";

// Option A: via the plugin
const plugin = minisite({ pagesDir: "pages" });
// ...add the plugin to the Vite config, then:
const html = plugin.render(); // after configResolved

// Option B: directly
const pages = compilePages("pages", process.cwd(), [], { sanitize: true });
fs.writeFileSync("index.html", renderHtml(pages, templateHtml));
```

## License

MIT
