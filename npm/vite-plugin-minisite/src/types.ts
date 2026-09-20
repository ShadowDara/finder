import type { Plugin, ResolvedConfig } from "vite";

/** Ein Asset, das als base64-Daten-URI direkt in die Minisite eingebettet wird. */
export interface MiniSiteAsset {
    /** Dateipfad (relativ zur Vite-Root oder absolut) */
    file: string;
    /** MIME-Type, z.B. "image/png", "video/mp4", "application/pdf" */
    type: string;
    /** Route-Name unter ___assets___/<slug> */
    slug: string;
}

export interface MiniSiteOptions {
    /**
     * Ordner mit den Markdown-Dateien (relativ zur Vite-Root).
     * @default "pages"
     */
    pagesDir?: string;
    /**
     * Pfad des HTML-Templates (relativ zur Vite-Root).
     * Das Template muss die Platzhalter `__PAGES__` und `__CSS__` enthalten.
     * @default mitgeliefertes Standard-Template
     */
    template?: string;
    /**
     * Optionen für den Markdown-Parser.
     * @default { externalLinks: true, sanitize: true }
     */
    markdown?: {
        externalLinks?: boolean;
        breaks?: boolean;
        smartypants?: boolean;
        sanitize?: boolean;
    };
    /**
     * In die Seite eingebettete Assets (Bilder, Videos, PDFs, Textdateien, ...).
     * @default []
     */
    assets?: MiniSiteAsset[];
    /**
     * Ausgabe-Dateiname beim Build (relativ zum Vite-OutDir).
     * @default "index.html"
     */
    outFile?: string;
    /**
     * Server-Mounts zum Registrieren eines virtuellen Moduls
     * (für HMR/native Vite-Anbindung, optional).
     * @default []
     */
    mounts?: string[];
}

export interface ResolvedMiniSiteOptions
    extends Required<Omit<MiniSiteOptions, "template" | "markdown" | "assets" | "mounts">> {
    templateFile: string | null;
    markdown: NonNullable<MiniSiteOptions["markdown"]>;
    assets: MiniSiteAsset[];
    mounts: string[];
    root: string;
    htmlTemplate: string;
}

/** Interner Zustand des Plugins (während Dev/Build aufgebaut). */
export interface MiniSiteContext {
    config: ResolvedConfig;
    options: ResolvedMiniSiteOptions;
    pages: Record<string, string>;
    compiledHtml: string;
    buildCount: number;
    watcher: import("chokidar").FSWatcher | null;
}

export type MiniSitePlugin = Plugin & {
    /** Kompiliert alle Seiten neu und gibt das fertige HTML zurück. */
    render(): string;
};