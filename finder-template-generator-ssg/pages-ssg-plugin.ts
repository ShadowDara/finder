import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { minify } from "html-minifier-terser";
import { parseMarkdown } from "@shadowdara/dlib";
import { transformWithEsbuild } from "vite";

const VIRTUAL_MODULE_ID = "virtual:pages";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const STYLE_PREFIX = "virtual:page-style:";
const RESOLVED_STYLE_PREFIX = "\0" + STYLE_PREFIX;

export interface PagesPluginOptions {
  /**
   * Directory containing the page modules (one `.ts`/`.tsx` file per page).
   *
   * @default "pages"
   */
  pagesDir?: string;

  /**
   * Directory for the Markdown files
   *
   * @default "docs"
   */
  docsDir?: string;

  /**
   * File extensions that count as a page.
   *
   * @default [".ts", ".tsx"]
   */
  extensions?: string[];

  /**
   * Name of the global the shared entry reads to know which page to
   * render, e.g. `"PAGE_ID"` → `window.PAGE_ID`.
   *
   * @default "PAGE_ID"
   */
  globalVar?: string;

  /**
   * Emit `<id>/index.html` instead of `<id>.html` (pretty / extensionless
   * URLs). The page with id `"index"` is always emitted as the top-level
   * `index.html`, never `index/index.html`.
   *
   * @default false
   */
  prettyUrls?: boolean;

  /**
   * Per-page `<title>`. Receives the page id (e.g. `"guide/install"`).
   *
   * @default (id) => id
   */
  title?: (id: string) => string;

  /**
   * Wrap/replace the emitted HTML shell entirely. Receives the computed
   * script/style tags and page metadata; must return a full HTML document.
   * Falls back to a minimal built-in template.
   */
  template?: (ctx: PageRenderContext) => string;

  /** Minify emitted HTML with html-minifier-terser. @default false */
  minify?: boolean;

  /**
   * Write a `pages.d.ts` ambient module declaration next to `vite.config.ts`
   * so `import { pages } from "virtual:pages"` is typed in consumers.
   *
   * @default true
   */
  dts?: boolean;

  /** Skip a file (by page id) from becoming a page. Default: ids starting with "_". */
  ignore?: (id: string) => boolean;

  /**
   * Path (relative to `root`) of the shared client entry, e.g. `"src/index.ts"`.
   * Only used to serve pages during `vite dev` — production builds get the
   * bundled entry automatically from Rollup's output. Required for the dev
   * server route to work; dev falls back to a 404 passthrough if omitted.
   */
  entry?: string;

  /**
   * Additional CSS files per page route.
   *
   * Example:
   *
   * {
   *   "viewer/index": ["./pages/viewer/style.css"],
   *   "getting-started": ["./docs/docs.css"]
   * }
   */
  styles?: Record<string, string[]>;

  /**
   * If the raw Markown should be included in the build,
   * for example for better search result
   *
   * @default false
   */
  addRawMarkdown?: boolean;
}

export interface PageRenderContext {
  id: string;
  title: string;
  globalVar: string;
  scriptTag: string;
  styleTag: string;
}

type PageType = "component" | "markdown";

interface PageEntry {
  /** Route id, e.g. "guide/installation" (posix, no extension). */
  id: string;
  /** Absolute path on disk. */
  source: string;

  /** Markdown or component (typescript) */
  type: PageType;

  /** Root-absolute import specifier Vite/Rollup can resolve, e.g. "/pages/guide/installation.ts". */
  importPath?: string;

  // Nur für markdown
  markdown?: string;
  html?: string;

  // Zusätzliche CSS-Dateien für diese Route
  styles: string[];
}

let resolvedStyles = new Map<string, string>();

const DEFAULT_EXTENSIONS = [".ts", ".tsx"];

export function pagesPlugin(options: PagesPluginOptions = {}): Plugin {
  const addRawMarkdown = options.addRawMarkdown ?? false;
  const pagesDirOpt = options.pagesDir ?? "pages";
  const docsDir = options.docsDir ?? "docs";
  const extensions = (options.extensions ?? DEFAULT_EXTENSIONS).map((ext) =>
    ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`,
  );
  const globalVar = options.globalVar ?? "PAGE_ID";
  const prettyUrls = options.prettyUrls ?? false;
  const shouldIgnore =
    options.ignore ?? ((id: string) => id.split("/").pop()!.startsWith("_"));
  const getTitle = options.title ?? ((id: string) => id);
  const writeDts = options.dts ?? true;

  let config: ResolvedConfig;
  let pages: PageEntry[] = [];

  function getPagesDir(): string {
    return path.resolve(config.root, pagesDirOpt);
  }

  function resolveStylePath(style: string): string {
    const clean = style.replace(/^\/+/, "");

    return path.resolve(config.root, clean);
  }

  function scanDocs(): PageEntry[] {
    const root = path.resolve(config.root, docsDir);

    if (!fs.existsSync(root)) {
      return [];
    }

    const pages: PageEntry[] = [];

    function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, {
        withFileTypes: true,
      })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }

        if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === ".md"
        ) {
          const relativePath = path.relative(root, fullPath);

          const id = relativePath.replace(/\\/g, "/").replace(/\.md$/i, "");

          const markdown = fs.readFileSync(fullPath, "utf8");
          const html = parseMarkdown(markdown) as string;

          pages.push({
            id,
            source: fullPath,
            type: "markdown",
            markdown,
            html,
            styles: options.styles?.[id] ?? [],
          });
        }
      }
    }

    walk(root);

    return pages;
  }

  function scanPages(): PageEntry[] {
    const root = getPagesDir();

    if (!fs.existsSync(root)) {
      throw new Error(
        `[vite-plugin-pages-ssg] Pages directory does not exist: ${root}`,
      );
    }

    const files: string[] = [];

    function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }

        if (
          entry.isFile() &&
          extensions.includes(path.extname(entry.name).toLowerCase())
        ) {
          files.push(fullPath);
        }
      }
    }

    walk(root);

    return files
      .sort()
      .map((file): PageEntry => {
        const relativePath = path.relative(root, file).replace(/\\/g, "/");
        const ext = path.extname(relativePath);
        const id = relativePath.slice(0, -ext.length);

        // Root-absolute specifier, e.g. "/pages/guide/installation.ts".
        // Vite resolves a leading "/" against `config.root` in both dev
        // and build, so this works for the dynamic import() calls the
        // virtual module hands to the shared entry.
        const importPath =
          "/" + path.relative(config.root, file).replace(/\\/g, "/");

        return {
          id,
          source: file,
          importPath,
          type: "component",
          styles: options.styles?.[id] ?? [],
        };
      })
      .filter((page) => !shouldIgnore(page.id));
  }

  function createVirtualModule(): string {
    const styleImports = new Map<string, string>();

    for (const page of pages) {
      for (const style of page.styles) {
        if (!styleImports.has(style)) {
          styleImports.set(style, `style_${styleImports.size}`);
        }
      }
    }

    const imports = [...styleImports.entries()]
      .map(([style, variable]) => {
        const resolved = resolvedStyles.get(style);

        if (!resolved) {
          throw new Error(
            `[vite-plugin-pages-ssg] Style was not resolved: ${style}`,
          );
        }

        return `import ${variable} from ${JSON.stringify(resolved + "?url")};`;
      })
      .join("\n");

    const entries = pages
      .map((page) => {
        const styles = page.styles
          .map((style) => styleImports.get(style)!)
          .join(", ");

        if (page.type === "markdown") {
          return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "markdown",
    markdown: ${JSON.stringify(page.markdown ?? "")},
    html: ${JSON.stringify(page.html ?? "")},
    styles: [${styles}]
  }`;
        }

        return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "component",
    load: () => import(${JSON.stringify(page.importPath)}),
    styles: [${styles}]
  }`;
      })
      .join(",\n");

    return `${imports}

export const pages = {
${entries}
};
`;
  }

  function writeTypeDeclaration() {
    const dtsPath = path.resolve(config.root, "src/pages.d.ts");

    const content = `// Auto-generated by vite-plugin-pages-ssg. Do not edit by hand.

declare module "virtual:pages" {
  export interface PageModule {
    /** Called with the mount element on the client. */
    default: (el: HTMLElement) => void | Promise<void>;
    [key: string]: unknown;
  }

  export interface ComponentPage {
    id: string;
    type: "component";
    load: () => Promise<PageModule>;
    styles: string[];
  }

  export interface MarkdownPage {
    id: string;
    type: "markdown";
    markdown: string;
    html: string;
    styles: string[];
  }

  export type PageEntry = ComponentPage | MarkdownPage;

  export const pages: Record<string, PageEntry>;
}
`;

    fs.writeFileSync(dtsPath, content, "utf8");
  }

  function outputFileName(id: string): string {
    if (!prettyUrls) {
      return `${id}.html`;
    }

    if (id === "index") {
      return "index.html";
    }

    if (id.endsWith("/index")) {
      return `${id.slice(0, -"/index".length)}/index.html`;
    }

    return `${id}/index.html`;
  }

  function defaultTemplate(ctx: PageRenderContext): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ctx.title)}</title>
  ${ctx.styleTag}
</head>
<body>
  <div id="app"></div>

  <script>
    window.${ctx.globalVar} = ${JSON.stringify(ctx.id)};
  </script>

  ${ctx.scriptTag}
</body>
</html>
`;
  }

  return {
    name: "vite-plugin-pages-ssg",

    enforce: "pre",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      pages = [...scanPages(), ...scanDocs()].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      console.log(`[vite-plugin-pages-ssg] Found ${pages.length} page(s)`);
      for (const page of pages) {
        console.log(`  - ${page.id}`);
      }

      if (writeDts) {
        writeTypeDeclaration();
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }

      if (id.startsWith(STYLE_PREFIX)) {
        return RESOLVED_STYLE_PREFIX + id.slice(STYLE_PREFIX.length);
      }

      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return createVirtualModule();
      }

      if (id.startsWith(RESOLVED_STYLE_PREFIX)) {
        const stylePath = id.slice(RESOLVED_STYLE_PREFIX.length);

        return `export { default } from ${JSON.stringify(stylePath + "?url")};`;
      }

      return null;
    },

    configureServer(server) {
      const pagesRoot = getPagesDir();
      const docsRoot = path.resolve(config.root, docsDir);

      pages = [...scanPages(), ...scanDocs()].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      console.log(
        "[vite-plugin-pages-ssg] DEV PAGES:",
        pages.map((p) => ({
          id: p.id,
          type: p.type,
          source: p.source,
        })),
      );

      server.watcher.add(pagesRoot);
      server.watcher.add(docsRoot);

      const rescan = (file: string) => {
        const isPageFile =
          file.startsWith(pagesRoot) &&
          extensions.includes(path.extname(file).toLowerCase());

        const isDocFile =
          file.startsWith(docsRoot) &&
          path.extname(file).toLowerCase() === ".md";

        if (!isPageFile && !isDocFile) {
          return;
        }

        pages = [...scanPages(), ...scanDocs()].sort((a, b) =>
          a.id.localeCompare(b.id),
        );

        const mod = server.moduleGraph.getModuleById(
          RESOLVED_VIRTUAL_MODULE_ID,
        );

        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }

        if (writeDts) {
          writeTypeDeclaration();
        }

        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", rescan);
      server.watcher.on("unlink", rescan);
      server.watcher.on("change", rescan);

      // Serve each page's HTML on its own dev URL (e.g. /guide/installation
      // or /guide/installation.html), mirroring what generateBundle emits
      // for production, so `vite dev` is multi-page too — not just the build.
      const entry =
        "/" +
        (options.entry ?? "src/main.ts")
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "/";
        const pathname = url.split("?")[0].split("#")[0];

        // Vite internals
        if (
          pathname.startsWith("/@") ||
          pathname.startsWith("/node_modules/") ||
          pathname.startsWith("/src/")
        ) {
          return next();
        }

        // Dateien nicht als Seiten behandeln
        if (path.extname(pathname)) {
          return next();
        }

        const id = getPageId(url, pages);
        const page = pages.find((p) => p.id === id);

        console.log(
          `[vite-plugin-pages-ssg] ${pathname} -> ${id} -> ${
            page ? "FOUND" : "404"
          }`,
        );

        const pageId = page?.id ?? "__404__";

        /*
         * Known page:
         *
         * /             -> index
         * /viewer       -> viewer
         * /foo/bar      -> foo/bar
         */
        if (page) {
          const ctx: PageRenderContext = {
            id: page.id,
            title: getTitle(page.id),
            globalVar,
            scriptTag: `<script type="module" src="${entry}"></script>`,
            styleTag: "",
          };

          const html = (options.template ?? defaultTemplate)(ctx);

          const transformed = await server.transformIndexHtml(url, html);

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(transformed);

          return;
        }

        /*
         * Unknown page:
         *
         * /does-not-exist
         * /foo/bar/baz
         *
         * Still boot the application, but tell it that this
         * is a not-found route.
         */
        const ctx: PageRenderContext = {
          id: "__404__",
          title: "Page Not Found",
          globalVar,
          scriptTag: `<script type="module" src="${entry}"></script>`,
          styleTag: "",
        };

        const html = (options.template ?? defaultTemplate)(ctx);

        const transformed = await server.transformIndexHtml(url, html);

        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(transformed);
      });
    },

    async transform(code, id) {
      if (!id.endsWith(".tsx")) {
        return null;
      }

      const result = await transformWithEsbuild(code, id, {
        loader: "tsx",
        target: "esnext",
        jsxFactory: "jsx",
        jsxFragment: "Fragment",
        sourcemap: true,
      });

      const runtimePath = path.resolve(config.root, "src/jsx-runtime.ts");

      return {
        code: [
          `import { jsx, Fragment } from ${JSON.stringify(runtimePath)};`,
          result.code,
        ].join("\n"),
        map: result.map as any,
      };
    },

    async buildStart() {
      resolvedStyles.clear();

      for (const page of pages) {
        for (const style of page.styles) {
          if (resolvedStyles.has(style)) {
            continue;
          }

          const resolved = await this.resolve(style, undefined, {
            skipSelf: true,
          });

          if (!resolved) {
            this.error(
              `[vite-plugin-pages-ssg] Could not resolve style: ${style}`,
            );
          }

          resolvedStyles.set(style, resolved.id);
        }
      }
    },

    async generateBundle(_outputOptions, bundle) {
      const jsChunk = Object.values(bundle).find(
        (item) =>
          item.type === "chunk" &&
          item.isEntry &&
          item.fileName.endsWith(".js"),
      );

      if (!jsChunk || jsChunk.type !== "chunk") {
        this.error(
          "[vite-plugin-pages-ssg] Could not find the generated entry .js chunk.",
        );
      }

      for (const page of pages) {
        const htmlFileName = outputFileName(page.id);
        const htmlDir = path.dirname(htmlFileName);

        const scriptPath = path
          .relative(htmlDir, jsChunk.fileName)
          .replace(/\\/g, "/");

        const scriptTag = `<script type="module" src="${scriptPath}"></script>`;

        /*
         * Find the Rollup chunk belonging to this page.
         */
        const pageChunk = Object.values(bundle).find(
          (item) =>
            item.type === "chunk" &&
            Object.keys(item.modules).some(
              (moduleId) => path.resolve(moduleId) === page.source,
            ),
        );

        let styleTag = "";

        if (pageChunk?.type === "chunk" && pageChunk.viteMetadata) {
          const cssFiles = [...pageChunk.viteMetadata.importedCss];

          styleTag = cssFiles
            .map((cssFile) => {
              const cssPath = path
                .relative(htmlDir, cssFile)
                .replace(/\\/g, "/");

              return `<link rel="stylesheet" href="${cssPath}" />`;
            })
            .join("\n  ");
        }

        const ctx: PageRenderContext = {
          id: page.id,
          title: getTitle(page.id),
          globalVar,
          scriptTag,
          styleTag,
        };

        let html = (options.template ?? defaultTemplate)(ctx);

        if (options.minify) {
          html = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
          });
        }

        this.emitFile({
          type: "asset",
          fileName: htmlFileName,
          source: html,
        });
      }
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPageId(url: string, pages: PageEntry[]): string {
  let pathname = url.split("?")[0].split("#")[0];

  pathname = pathname.replace(/^\/+/, "");
  pathname = pathname.replace(/\.html$/, "");
  pathname = pathname.replace(/\/+$/, "");

  // "/" -> "index"
  if (!pathname) {
    return "index";
  }

  // Direkte Page, z. B.
  // /about -> about
  // /viewer/index -> viewer/index
  const directPage = pages.find((page) => page.id === pathname);

  if (directPage) {
    return directPage.id;
  }

  // Index-Page eines Verzeichnisses:
  //
  // /viewer -> viewer/index
  // /docs -> docs/index
  //
  const indexPage = `${pathname}/index`;

  if (pages.some((page) => page.id === indexPage)) {
    return indexPage;
  }

  return pathname;
}
