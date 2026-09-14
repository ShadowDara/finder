import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import { minify } from "html-minifier-terser";
import { parseMarkdown } from "@shadowdara/dlib";
import { transformWithEsbuild } from "vite";
import { tsImport } from "tsx/esm/api";
import { escapeHtml } from "./src/jsx-runtime";
import hljs from "highlight.js/lib/common";
import { Liquid } from "liquidjs";

const MARKDOWN_PREFIX = "virtual:page-markdown:";
const RESOLVED_MARKDOWN_PREFIX = "\0" + MARKDOWN_PREFIX;

const VIRTUAL_MODULE_ID = "virtual:pages";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const STYLE_PREFIX = "virtual:page-style:";
const RESOLVED_STYLE_PREFIX = "\0" + STYLE_PREFIX;

/**
 * Placeholder rendered in place of `{{ JS_SCRIPT }}` while Liquid runs.
 * The real script tag (pointing at the built `page.[tj]s`) is only known
 * after bundling (build) or via the dev URL (dev), so it is substituted
 * after rendering. Uses a plain ASCII token so liquidjs / minifiers do
 * not mangle it.
 */
const LIQUID_SCRIPT_PLACEHOLDER = "__PAGES_LIQUID_JS_SCRIPT__";

/**
 * Escape `<...>` sequences that are NOT valid HTML tags, so the output can
 * safely pass through `html-minifier-terser` (which uses a strict HTML
 * parser). Without this, things like
 * `Co-authored-by: Copilot <foo@users.noreply.github.com>` survive
 * `parseMarkdown({ sanitize: false })` as raw text and crash the minifier.
 *
 * Heuristic: a `<` is kept as-is only when it starts a plausible tag
 * (letter, `/`, `!`), otherwise both `<` and its matching `>` are escaped.
 */
function escapeBareAngles(html: string): string {
  return html.replace(/<([^a-zA-Z/!][^>]*)>/g, (_m, inner) => {
    return `&lt;${inner.replace(/</g, "&lt;")}&gt;`;
  });
}

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
   * @default [".ts", ".tsx", ".js", ".jsx"]
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

  /**
   * Set the paths to relative paths
   *
   * @default false
   */
  relativePaths?: boolean;

  /**
   * Bundle all pages into a single JS file.
   *
   * @default false
   */
  singleBundle?: boolean;

  /**
   * More detailed output
   *
   * @default false
   */
  verbose?: boolean;

  /**
   * Put each compiled Markdown page into its own dynamically loaded chunk
   * instead of embedding all Markdown HTML into the main bundle.
   *
   * @default false
   */
  splitMarkdown?: boolean;

  /**
   * Ignored Pathnames
   *
   * @default ["/@", "/node_modules/", "/src/"]
   */
  ignoredPathnames?: string[];
}

export interface PageRenderContext {
  id: string;
  title: string;
  globalVar: string;
  scriptTag: string;
  styleTag: string;

  /**
   * Pre-rendered body content (e.g. Liquid pages). When set, the template
   * renders it as-is instead of bootstrapping the client app.
   */
  content?: string;
}

type PageType = "component" | "markdown" | "liquid";

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

  /** Build-time generated data */
  buildData?: unknown;

  /**
   * Liquid only: the `page.[tj]s` file next to the `.html` template that
   * is built and injected where `{{ JS_SCRIPT }}` appears in the rendered
   * output. Falls back to the `page.build.[tj]s` data file.
   */
  scriptSource?: string;
}

let resolvedStyles = new Map<string, string>();

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

export function pagesPlugin(options: PagesPluginOptions = {}): Plugin {
  const ignoredPathnames = [
    "/@",
    "/node_modules/",
    "/src/",
    "/__devframes_plugin_terminals/",
    ...(options.ignoredPathnames ?? []),
  ].filter((prefix, index, prefixes) => prefixes.indexOf(prefix) === index);
  const splitMarkdown = options.splitMarkdown ?? false;
  const verbose = options.verbose ?? false;
  const singleBundle = options.singleBundle ?? false;
  const relativePath = options.relativePaths ?? false;
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

  function getAssetPath(htmlFileName: string, assetFileName: string): string {
    const normalizedAsset = assetFileName
      .replace(/^\/+/, "")
      .replace(/\\/g, "/");

    // Explizit relative Pfade gewünscht
    if (options.relativePaths) {
      return path.posix
        .relative(path.posix.dirname(htmlFileName), normalizedAsset)
        .replace(/\\/g, "/");
    }

    // Ansonsten Vite's `base` verwenden
    const base = config.base.replace(/\/+$/, "");

    // base: "./"
    if (config.base === "./") {
      return path.posix
        .relative(path.posix.dirname(htmlFileName), normalizedAsset)
        .replace(/\\/g, "/");
    }

    // base: "/"
    if (!base) {
      return `/${normalizedAsset}`;
    }

    // base: "/my-app/"
    return `${base}/${normalizedAsset}`;
  }

  async function preparePages() {
    pages = [...scanPages(), ...(await scanDocs())].sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    for (const page of pages) {
      if (page.type !== "component" && page.type !== "liquid") {
        continue;
      }

      page.buildData = await loadBuildData(page);

      // Liquid pages: render the .html template with the build data at
      // build time, so the emitted page is fully static HTML. `JS_SCRIPT`
      // is rendered as a placeholder here — the real script tag is
      // substituted after bundling (or via the dev URL in dev mode).
      if (page.type === "liquid") {
        page.html = await renderLiquidTemplate(
          fs.readFileSync(page.source, "utf8"),
          {
            ...(page.buildData ?? {}),
            JS_SCRIPT: LIQUID_SCRIPT_PLACEHOLDER,
          },
        );
      }

      if (verbose) {
        console.log(
          `[vite-plugin-pages-ssg] Build data loaded: ${page.id}`,
          page.buildData,
        );
      }
    }
  }

  async function scanDocs(): Promise<PageEntry[]> {
    const root = path.resolve(config.root, docsDir);

    if (!fs.existsSync(root)) {
      return [];
    }

    const pages: PageEntry[] = [];

    async function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, {
        withFileTypes: true,
      })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }

        if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === ".md"
        ) {
          const relativePath = path.relative(root, fullPath);

          const id = relativePath.replace(/\\/g, "/").replace(/\.md$/i, "");

          const markdown = fs.readFileSync(fullPath, "utf8");
          let html = parseMarkdown(markdown, {
            sanitize: false,
            highlight(code, language) {
              if (!hljs.getLanguage(language)) {
                return code;
              }

              return hljs.highlight(code, {
                language,
              }).value;
            },
          });

          if (options.minify) {
            html = await minify(escapeBareAngles(html), {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              minifyCSS: true,
              minifyJS: true,
            });
          }

          pages.push({
            id,
            source: fullPath,
            type: "markdown",
            ...(addRawMarkdown ? { markdown } : {}),
            html,
            styles: options.styles?.[id] ?? [],
          });
        }
      }
    }

    await walk(root);

    return pages;
  }

  function scanPages(): PageEntry[] {
    const root = getPagesDir();

    if (!fs.existsSync(root)) {
      throw new Error(
        `[vite-plugin-pages-ssg] Pages directory does not exist: ${root}`,
      );
    }

    const componentFiles: string[] = [];
    const htmlFiles: string[] = [];

    function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        // Build-data modules (page.build.ts / page.build.js / ...) are not
        // pages themselves — they only feed data into their sibling page.
        if (/\.build\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(entry.name)) {
          continue;
        }

        const extension = path.extname(entry.name).toLowerCase();

        if (extension === ".html") {
          htmlFiles.push(fullPath);
          continue;
        }

        if (extensions.includes(extension)) {
          componentFiles.push(fullPath);
        }
      }
    }

    walk(root);

    const componentPages = componentFiles
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

    // Liquid pages: every `X.html` that has a sibling `X.build.[tj]s`
    // becomes a build-time-rendered Liquid page. The `.html` template is
    // rendered with the data returned by `build()` at build time.
    const liquidPages: PageEntry[] = [];

    for (const file of htmlFiles.sort()) {
      const relativePath = path.relative(root, file).replace(/\\/g, "/");

      let id = relativePath.slice(0, -".html".length);

      // `page.html` acts as the folder's index template:
      //   jekyll/page.html -> jekyll/index
      //   page.html        -> index
      if (path.posix.basename(id) === "page") {
        id = path.posix.join(path.posix.dirname(id), "index");
      }

      if (shouldIgnore(id)) {
        continue;
      }

      // A real component/markdown page with the same id takes precedence.
      if (componentPages.some((page) => page.id === id)) {
        continue;
      }

      const buildFile = [".ts", ".tsx", ".js", ".jsx"]
        .map((ext) => file.slice(0, -".html".length) + `.build${ext}`)
        .find((candidate) => fs.existsSync(candidate));

      if (!buildFile) {
        continue;
      }

      // Script source for `{{ JS_SCRIPT }}`: prefer the plain page module
      // (`page.ts` / `page.js` / ...) next to the template; fall back to
      // the `page.build.[tj]s` data file itself.
      const baseName = file.slice(0, -".html".length);

      const scriptSource =
        [".ts", ".tsx", ".js", ".jsx"]
          .map((ext) => baseName + ext)
          .find((candidate) => fs.existsSync(candidate)) ?? buildFile;

      liquidPages.push({
        id,
        source: file,
        type: "liquid",
        scriptSource,
        styles: options.styles?.[id] ?? [],
      });
    }

    // A `page.js`/`page.ts` next to a `page.html` is used as the Liquid
    // script source, not as its own `…/page` route — the Liquid index
    // page takes precedence.
    const liquidIds = new Set(liquidPages.map((page) => page.id));

    const duplicateComponentIds = componentPages
      .map((page) => page.id)
      .filter((id) => {
        // id "jekyll/page" conflicts with Liquid page "jekyll/index" only
        // when the component is literally `<dir>/page`.
        if (!id.endsWith("/page")) {
          return false;
        }

        return liquidIds.has(id.slice(0, -"/page".length) + "/index");
      });

    const filteredComponentPages = componentPages.filter(
      (page) => !duplicateComponentIds.includes(page.id),
    );

    return [...filteredComponentPages, ...liquidPages];
  }

  function createVirtualModule(): string {
    if (verbose) {
      console.log(
        "[vite-plugin-pages-ssg] Creating virtual module",
        pages.map((p) => ({
          id: p.id,
          type: p.type,
          buildData: p.type === "component" ? p.buildData : undefined,
        })),
      );
    }

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
          const styles = page.styles
            .map((style) => styleImports.get(style)!)
            .join(", ");

          if (splitMarkdown) {
            const markdownModuleId = `${MARKDOWN_PREFIX}${page.id}`;

            return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "markdown",
    load: () => import(${JSON.stringify(markdownModuleId)}),
    styles: [${styles}]
  }`;
          }

          const markdownField = addRawMarkdown
            ? `markdown: ${JSON.stringify(page.markdown ?? "")},`
            : "";

          return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "markdown",
    ${markdownField}
    html: ${JSON.stringify(page.html ?? "")},
    styles: [${styles}]
  }`;
        }

        if (page.type === "liquid") {
          return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "liquid",
    html: ${JSON.stringify(page.html ?? "")},
    styles: [${styles}]
  }`;
        }

        return `  ${JSON.stringify(page.id)}: {
    id: ${JSON.stringify(page.id)},
    type: "component",
    load: () => import(${JSON.stringify(page.importPath)}),
    data: ${JSON.stringify(page.buildData ?? null)},
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

// Ambient module declaration for the \`virtual:pages\` module the plugin
// provides. Commit this file to your project (it doesn't need to be
// regenerated — its content doesn't depend on which pages actually exist,
// only on the shape of PageEntry/PageModule).
//
// Why a static file instead of relying on the plugin's auto-generated
// \`pages.d.ts\`: that file is written by the plugin's \`configResolved\` hook,
// which only runs once Vite itself starts. \`tsc -b\` runs standalone and
// never triggers Vite, so on a clean checkout \`tsc -b && vite build\` fails
// before Vite ever gets a chance to write it. Keeping a static copy in
// source control sidesteps the ordering problem completely.

declare module "virtual:pages" {

  export interface PageModule {
    /** Called with the mount element on the client. */
    default: (el: HTMLElement, data?: unknown) => void | Promise<void>;

    /** Executed only during the Vite build in Node.js. */
    build?: () => unknown | Promise<unknown>;

    [key: string]: unknown;
  }

  export interface ComponentPage {
    id: string;
    type: "component";
    data?: unknown;
    load: () => Promise<PageModule>;
    styles: string[];
  }

  export interface MarkdownPage {
    id: string;
    type: "markdown";
    markdown?: string;
    html: string;
    styles: string[];
    load: () => Promise<{
    default: {
      id: string;
      type: "markdown";
      markdown?: string;
      html: string;
    };
  }>;
  }

  export interface LiquidPage {
    id: string;
    type: "liquid";
    html: string;
    styles: string[];
  }

  export type PageEntry = ComponentPage | MarkdownPage | LiquidPage;

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
    /*
     * Pre-rendered content (e.g. Liquid pages): plain static HTML document
     * without the client-side bootstrapping shell.
     */
    if (ctx.content != null) {
      return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(ctx.title)}</title>
  ${ctx.styleTag}
</head>
<body>
${ctx.content}
</body>
</html>
`;
    }

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

    async configResolved(resolvedConfig) {
      config = resolvedConfig;

      await preparePages();

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

      if (id.startsWith(MARKDOWN_PREFIX)) {
        return RESOLVED_MARKDOWN_PREFIX + id.slice(MARKDOWN_PREFIX.length);
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

      if (id.startsWith(RESOLVED_MARKDOWN_PREFIX)) {
        const pageId = id.slice(RESOLVED_MARKDOWN_PREFIX.length);
        const page = pages.find(
          (page) => page.type === "markdown" && page.id === pageId,
        );

        if (!page) {
          throw new Error(
            `[vite-plugin-pages-ssg] Markdown page not found: ${pageId}`,
          );
        }

        return `
      export default ${JSON.stringify({
        id: page.id,
        type: "markdown",
        ...(addRawMarkdown ? { markdown: page.markdown ?? "" } : {}),
        html: page.html ?? "",
      })};
    `;
      }

      if (id.startsWith(RESOLVED_STYLE_PREFIX)) {
        const stylePath = id.slice(RESOLVED_STYLE_PREFIX.length);

        return `export { default } from ${JSON.stringify(stylePath + "?url")};`;
      }

      return null;
    },

    async configureServer(server) {
      const pagesRoot = getPagesDir();
      const docsRoot = path.resolve(config.root, docsDir);

      await preparePages();

      if (verbose) {
        console.log(
          "[vite-plugin-pages-ssg] DEV PAGES:",
          pages.map((p) => ({
            id: p.id,
            type: p.type,
            source: p.source,
          })),
        );
      }

      server.watcher.add(pagesRoot);
      server.watcher.add(docsRoot);

      const rescan = async (file: string) => {
        const isPageFile =
          file.startsWith(pagesRoot) &&
          extensions.includes(path.extname(file).toLowerCase());

        const isDocFile =
          file.startsWith(docsRoot) &&
          path.extname(file).toLowerCase() === ".md";

        // Liquid templates (page.html) live in the pages dir but have
        // the .html extension, which is not in `extensions`.
        const isLiquidFile =
          file.startsWith(pagesRoot) &&
          path.extname(file).toLowerCase() === ".html";

        if (!isPageFile && !isDocFile && !isLiquidFile) {
          return;
        }

        await preparePages();

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
        if (ignoredPathnames.some((prefix) => pathname.startsWith(prefix))) {
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
          /*
           * Liquid pages are rendered at build time and served as static
           * HTML. `{{ JS_SCRIPT }}` is replaced with a script tag loading
           * the page module (`page.[tj]s`) through the dev server.
           */
          if (page.type === "liquid") {
            const scriptTag = page.scriptSource
              ? `<script type="module" src="/${path
                  .relative(config.root, page.scriptSource)
                  .replace(/\\/g, "/")}"></script>`
              : "";

            // Liquid pages are standalone: serve the rendered content as-is,
            // without wrapping it in the default HTML shell.
            let content =
              page.html
                ?.replaceAll(LIQUID_SCRIPT_PLACEHOLDER, scriptTag)
                // Fallback: wörtliches `{{ JS_SCRIPT }}` ersetzen
                .replaceAll("{{ JS_SCRIPT }}", scriptTag) ?? "";

            if (options.minify) {
              content = await minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true,
              });
            }

            const transformed = await server.transformIndexHtml(url, content);

            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(transformed);

            return;
          }

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

    // for single bundle
    config() {
      if (!singleBundle) {
        return {};
      }

      return {
        build: {
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
      };
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

            return;
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

        return;
      }

      const entryJsChunk = jsChunk;

      for (const page of pages) {
        const htmlFileName = outputFileName(page.id);
        const htmlDir = path.dirname(htmlFileName);

        const scriptPath = getAssetPath(htmlFileName, entryJsChunk.fileName);
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

        const cssFiles = new Set<string>(
          entryJsChunk.viteMetadata?.importedCss ?? [],
        );

        if (pageChunk?.type === "chunk" && pageChunk.viteMetadata) {
          for (const cssFile of pageChunk.viteMetadata.importedCss) {
            cssFiles.add(cssFile);
          }
        }

        if (cssFiles.size > 0) {
          styleTag = [...cssFiles]
            .map((cssFile) => {
              const cssPath = getAssetPath(htmlFileName, cssFile);

              return `<link rel="stylesheet" href="${cssPath}" />`;
            })
            .join("\n  ");
        }

        /*
         * Liquid pages are standalone: emit the rendered content as-is,
         * without wrapping it in the default HTML shell. `{{ JS_SCRIPT }}`
         * is replaced with the built page module (`page.[tj]s`), compiled
         * with esbuild and emitted as its own asset.
         */
        if (page.type === "liquid") {
          let scriptTagForContent = "";

          if (page.scriptSource && fs.existsSync(page.scriptSource)) {
            const scriptSourceCode = fs.readFileSync(page.scriptSource, "utf8");

            const scriptExtension = path
              .extname(page.scriptSource)
              .slice(1)
              .toLowerCase();

            const loader =
              scriptExtension === "ts" || scriptExtension === "tsx"
                ? "ts"
                : scriptExtension === "jsx"
                  ? "jsx"
                  : "js";

            const result = await transformWithEsbuild(
              scriptSourceCode,
              page.scriptSource,
              {
                loader,
                target: "esnext",
              },
            );

            const scriptName = path.basename(
              page.scriptSource,
              path.extname(page.scriptSource),
            );

            // Emit the compiled page script as a plain asset so Vite's
            // import analysis stays happy (prebuilt chunks break
            // `importedCss` in some setups). The file name is
            // deterministic, so the placeholder can be replaced directly.
            const scriptFileName = `assets/${scriptName}.js`;

            this.emitFile({
              type: "asset",
              fileName: scriptFileName,
              source: result.code,
            });

            scriptTagForContent = `<script type="module" src="${getAssetPath(
              htmlFileName,
              scriptFileName,
            )}"></script>`;
          }

          let liquidHtml =
            page.html
              ?.replaceAll(LIQUID_SCRIPT_PLACEHOLDER, scriptTagForContent)
              .replaceAll("{{ JS_SCRIPT }}", scriptTagForContent) ?? "";

          if (options.minify) {
            liquidHtml = await minify(liquidHtml, {
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
            source: liquidHtml,
          });

          continue;
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

// Function to load the build data
async function loadBuildData(page: PageEntry): Promise<unknown> {
  if (page.type !== "component" && page.type !== "liquid") {
    return null;
  }

  let buildFile: string;

  if (page.type === "liquid") {
    // page.html -> page.build.[tj]s
    buildFile =
      [".ts", ".tsx", ".js", ".jsx"]
        .map((ext) => page.source.slice(0, -".html".length) + `.build${ext}`)
        .find((candidate) => fs.existsSync(candidate)) ?? "";
  } else {
    buildFile = page.source.replace(/\.(tsx?|jsx?)$/, ".build.$1");
  }

  if (!buildFile || !fs.existsSync(buildFile)) {
    return null;
  }

  try {
    const fileUrl = pathToFileURL(buildFile).href;
    const module = await tsImport(fileUrl, import.meta.url);

    if (typeof module.build !== "function") {
      return null;
    }

    return await module.build();
  } catch (error) {
    throw new Error(
      `[vite-plugin-pages-ssg] Failed to execute build() for "${page.id}":\n${String(error)}`,
    );
  }
}

// Render a Liquid template with the given data at build time.
//
// Used for `X.html` pages: the template is read from disk and rendered
// with the data returned by the sibling `X.build.[tj]s` module's `build()`
// function, producing fully static HTML.
async function renderLiquidTemplate(
  template: string,
  data: unknown,
): Promise<string> {
  const engine = new Liquid();

  return engine.parseAndRender(template, data as Record<string, unknown>);
}
