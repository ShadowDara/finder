import fs from "fs";
import path from "path";

import {
  parseMarkdown as parse,
  exportCompressedMarkdownCSS as exportCompressedCSS,
  type MarkdownParseOptions,
} from "@shadowdara/dlib";
import type { MiniSiteAsset } from "./types.js";

/**
 * Parse-Optionen: deckungsgleich mit dlibs MarkdownParseOptions,
 * lokal definiert, damit wir keinen dlib-Typen exportieren müssen.
 */
export interface ParseOptions extends MarkdownParseOptions {}

/** MIME-Types, die als rohen Text in ein <pre> gepackt werden. */
const TEXT_TYPES = [
  "text/",
  "application/json",
  "application/javascript",
  "application/xml",
  "application/x-sh",
];

const FILE_TEXT_EXTENSIONS = [
  ".txt",
  ".json",
  ".md",
  ".log",
  ".js",
  ".ts",
  ".css",
  ".xml",
  ".yaml",
  ".yml",
  ".csv",
  ".sh",
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function isTextAsset(asset: MiniSiteAsset, mimeType: string): boolean {
  if (TEXT_TYPES.some((t) => mimeType.startsWith(t))) return true;
  return FILE_TEXT_EXTENSIONS.some((ext) =>
    asset.file.toLowerCase().endsWith(ext),
  );
}

/**
 * Wandelt ein Asset in ein HTML-Fragment um:
 * - Bilder/Videos/PDFs/Daten werden als base64-Data-URI eingebettet
 * - Textdateien werden als escaped <pre> angezeigt
 * - alles andere bekommt einen Download-Link
 */
export function renderAsset(
  asset: MiniSiteAsset,
  root: string,
  routePrefix = "",
): string {
  const filePath = path.isAbsolute(asset.file)
    ? asset.file
    : path.join(root, asset.file);
  if (!fs.existsSync(filePath)) {
    return `<h2>${escapeHtml(asset.slug)}</h2><p class="error">Datei nicht gefunden: ${escapeHtml(asset.file)}</p>`;
  }

  const mimeType = asset.type || "application/octet-stream";

  // Bilder direkt einbetten
  if (mimeType.startsWith("image/")) {
    const base64 = fs.readFileSync(filePath).toString("base64");
    const url = `data:${mimeType};base64,${base64}`;
    return `<img src="${url}" alt="${escapeHtml(asset.slug)}" style="max-width:100%;">`;
  }

  // Videos
  if (mimeType.startsWith("video/")) {
    const base64 = fs.readFileSync(filePath).toString("base64");
    const url = `data:${mimeType};base64,${base64}`;
    return `
            <h2>${escapeHtml(asset.slug)}</h2>
            <video controls style="max-width:100%;height:auto;">
                <source src="${url}" type="${mimeType}">
                Dein Browser unterstützt das Video-Tag nicht.
            </video>
            <p><a href="${url}" download>Download Video</a></p>
        `;
  }

  // PDF
  if (mimeType === "application/pdf") {
    const base64 = fs.readFileSync(filePath).toString("base64");
    const url = `data:application/pdf;base64,${base64}`;
    return `
            <h2>${escapeHtml(asset.slug)}</h2>
            <iframe src="${url}" style="width:100%;height:80vh;"></iframe>
            <p><a href="${url}" download>Download</a></p>
        `;
  }

  // Textdateien als <pre> anzeigen
  if (isTextAsset(asset, mimeType)) {
    const text = fs.readFileSync(filePath, "utf8");
    const escaped = escapeHtml(text);
    return `
            <h2>${escapeHtml(asset.slug)}</h2>
            <pre style="
                white-space: pre-wrap;
                word-wrap: break-word;
                background: #111;
                color: #eee;
                padding: 12px;
                border-radius: 6px;
                overflow-x: auto;
            ">${escaped}</pre>
        `;
  }

  // Alles andere: Download-Link mit base64-Data-URI
  const base64 = fs.readFileSync(filePath).toString("base64");
  const url = `data:${mimeType};base64,${base64}`;
  return `
        <h2>${escapeHtml(asset.slug)}</h2>
        <a href="${url}" download>Download file</a>
    `;
}

/** Läuft rekursiv durch den Seiten-Ordner und liefert Route → Markdown-Inhalt. */
export function collectMarkdownPages(pagesDir: string): Record<string, string> {
  const pages: Record<string, string> = {};

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Ordner existiert noch nicht
    }

    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(filePath);
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".md")) continue;

      const route = toPosix(path.relative(pagesDir, filePath))
        .replace(/\.md$/i, "")
        .replace(/\/index$/i, "");

      pages[route] = fs.readFileSync(filePath, "utf8");
    }
  }

  walk(pagesDir);
  return pages;
}

/** Kompiliert Markdown-Seiten und Assets zu einer Route→HTML-Tabelle. */
export function compilePages(
  pagesDir: string,
  root: string,
  assets: MiniSiteAsset[] = [],
  markdownOptions: ParseOptions = {},
  routePrefix = "",
): Record<string, string> {
  const pages: Record<string, string> = {};

  // Markdown-Dateien parsen
  for (const [route, md] of Object.entries(collectMarkdownPages(pagesDir))) {
    pages[route] = parse(md, markdownOptions);
  }

  // Assets unter ___assets___/<slug>
  for (const asset of assets) {
    const route = `${routePrefix}___assets___/${asset.slug}`.replace(
      /\/+/g,
      "/",
    );
    pages[route] = renderAsset(asset, root);
  }

  return pages;
}

/** Baut aus der Page-Tabelle und dem Template das fertige HTML-Dokument. */
export function renderHtml(
  pages: Record<string, string>,
  template: string,
): string {
  return template
    .replace("__PAGES__", JSON.stringify(pages))
    .replace("/*__CSS__{}*/", exportCompressedCSS())
    .replace("__CSS__{}", exportCompressedCSS())
    .replace("__CSS__", exportCompressedCSS());
}
