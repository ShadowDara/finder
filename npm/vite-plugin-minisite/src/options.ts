import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { compilePages, renderHtml } from "./compile.js";
import type { MiniSiteContext, MiniSiteOptions, ResolvedMiniSiteOptions } from "./types.js";
import type { ResolvedConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Lädt das mitgelieferte Template (dist/ oder direkt aus src/ bei Dev-Build). */
function loadDefaultTemplate(): string {
    const candidates = [
        path.join(__dirname, "template.html"),
        path.join(__dirname, "..", "src", "template.html"),
        path.join(__dirname, "..", "..", "src", "template.html"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return fs.readFileSync(candidate, "utf8");
        }
    }
    throw new Error(
        "vite-plugin-minisite: Standard-Template (template.html) wurde nicht gefunden."
    );
}

const DEFAULT_TEMPLATE_HTML = loadDefaultTemplate();

function toPosix(p: string): string {
    return p.replace(/\\/g, "/");
}

/** Löst die Plugin-Optionen mit Defaults und Vite-Config auf. */
export function resolveOptions(config: ResolvedConfig, options: MiniSiteOptions = {}): ResolvedMiniSiteOptions {
    const root = config.root;

    return {
        root,
        pagesDir: options.pagesDir ?? "pages",
        templateFile: options.template ? path.resolve(root, options.template) : null,
        htmlTemplate: DEFAULT_TEMPLATE_HTML,
        markdown: {
            externalLinks: true,
            sanitize: true,
            ...(options.markdown ?? {}),
        },
        assets: options.assets ?? [],
        outFile: options.outFile ?? "index.html",
        mounts: options.mounts ?? [],
    };
}

/**
 * Kompiliert alle Seiten (Markdown + Assets) und füllt den Context.
 * Sucht das Template zuerst in der Vite-Root, fällt auf das mitgelieferte zurück.
 */
export function buildContext(ctx: MiniSiteContext): void {
    const opts = ctx.options;

    // Template aus Projekt oder Paket laden
    let template = opts.htmlTemplate;
    if (opts.templateFile && fs.existsSync(opts.templateFile)) {
        template = fs.readFileSync(opts.templateFile, "utf8");
    } else {
        const local = path.join(opts.root, "template.html");
        if (fs.existsSync(local)) {
            template = fs.readFileSync(local, "utf8");
        }
    }

    const pagesDir = path.resolve(opts.root, opts.pagesDir);
    const pages = compilePages(
        pagesDir,
        opts.root,
        opts.assets,
        opts.markdown,
        "" // Route-Präfix über Mounts nicht nötig für die echte Seite
    );

    ctx.pages = pages;
    ctx.compiledHtml = renderHtml(pages, template);
    ctx.buildCount++;
}

/** Baut das virtuelle Modul, das bei Bedarf den Seiten-Code als JS bereitstellt. */
export function virtualModule(ctx: MiniSiteContext): string {
    return `export default ${JSON.stringify(ctx.pages)};`;
}

/** Gibt die Mount-Routen (z.B. "/mini") als Pfad-Präfix in der Route zurück. */
export function mountPathFor(mount: string, pagesDir: string): string {
    // z.B. "/mini" → "mini/"
    const normalized = mount
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .replace(/^\./, "");

    if (!normalized) return "";
    return `${normalized}/`;
}

/** Normalisiert einen Asset-Pfad bezüglich des Mounts (nur für das virtuelle Modul). */
export function mountAssetRoute(mount: string, assetSlug: string): string {
    const prefix = mountPathFor(mount, "pages");
    return `${prefix}___assets___/${assetSlug}`.replace(/\/+/g, "/");
}