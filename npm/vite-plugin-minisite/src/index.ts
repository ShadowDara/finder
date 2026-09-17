import fs from "fs";
import path from "path";

import { buildContext, resolveOptions, virtualModule } from "./options.js";
import type { MiniSiteContext, MiniSiteOptions, MiniSitePlugin } from "./types.js";
import type { Plugin, ResolvedConfig } from "vite";
import chokidar from "chokidar";

/**
 * Vite-Plugin "minisite":
 * Kompiliert Markdown-Seiten (+ optional eingebettete Assets) zu einer
 * einzigen, selbstständigen index.html mit Hash-Routing.
 *
 * - `vite build` schreibt die Seite per `closeBundle` ins OutDir
 * - `vite dev` serviert die Seite über eine Virtual-Module/Watch-Kombination
 */
export function minisite(options: MiniSiteOptions = {}): MiniSitePlugin {
    let ctx: MiniSiteContext;

    const plugin: Plugin = {
        name: "vite-plugin-minisite",
        enforce: "pre",

        // Minisite erzeugt die komplette HTML-Seite selbst → kein echter HTML-Entry nötig.
        // Wir geben Rolldown einen virtuellen (leeren) Entry, damit der Build nicht
        // nach einer index.html im Root sucht.
        config(_cfg, env) {
            return {
                appType: "custom",
                build:
                    env.command === "build"
                        ? {
                              rollupOptions: {
                                  input: "virtual:minisite-entry",
                              },
                          }
                        : undefined,
            };
        },

        configResolved(config: ResolvedConfig) {
            ctx = {
                config,
                options: resolveOptions(config, options),
                pages: {},
                compiledHtml: "",
                buildCount: 0,
                watcher: null,
            };
            buildContext(ctx);
        },

        // ------------------------------------------------------------------
        // Virtual Module für Dev-Server
        // ------------------------------------------------------------------
        resolveId(id: string, importer?: string) {
            // Virtueller Build-Entry
            if (id === "virtual:minisite-entry") {
                return "\0virtual:minisite-entry";
            }
            const mounts = ctx?.options.mounts ?? [];
            for (const mount of mounts) {
                const idBase = id.replace(/^\/@id\//, "");
                if (idBase === `virtual:minisite${mount ? ":" + mount : ""}`) {
                    return "\0" + idBase;
                }
            }
            if (id === "virtual:minisite") {
                return "\0virtual:minisite";
            }
            return null;
        },

        load(id: string) {
            // Virtueller Build-Entry (leeres Modul – die Seite kommt aus closeBundle)
            if (id === "\0virtual:minisite-entry") {
                return "export {}";
            }
            if (id === "\0virtual:minisite") {
                return virtualModule(ctx);
            }
            const mounts = ctx?.options.mounts ?? [];
            for (const mount of mounts) {
                if (id === `\0virtual:minisite:${mount}`) {
                    return virtualModule(ctx);
                }
            }
            return null;
        },

        // ------------------------------------------------------------------
        // Datei-Watcher: Seiten-Änderungen lösen Rekompilierung aus
        // ------------------------------------------------------------------
        configureServer(server) {
            const pagesDir = path.resolve(ctx.options.root, ctx.options.pagesDir);

            if (!fs.existsSync(pagesDir)) {
                fs.mkdirSync(pagesDir, { recursive: true });
            }

            // appType "custom": eigene Middleware liefert die Minisite aus
            server.middlewares.use((req, res, next) => {
                const url = (req.url ?? "/").split("?")[0];
                if (url === "/" || url === "/index.html") {
                    buildContext(ctx);
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.end(ctx.compiledHtml);
                    return;
                }
                next();
            });

            ctx.watcher = chokidar.watch(pagesDir, {
                ignoreInitial: true,
                persistent: true,
            });

            const reload = () => {
                buildContext(ctx);
                server.ws.send({ type: "full-reload" });
            };

            ctx.watcher.on("add", reload);
            ctx.watcher.on("change", reload);
            ctx.watcher.on("unlink", reload);
        },

        // ------------------------------------------------------------------
        // Build: fertiges HTML ins OutDir schreiben
        // ------------------------------------------------------------------
        async closeBundle() {
            buildContext(ctx);

            const outDir = ctx.config.build.outDir;
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            const outFile = path.join(outDir, ctx.options.outFile);
            fs.writeFileSync(outFile, ctx.compiledHtml, "utf8");

            // Die Minisite ist eine einzige eigenständige HTML-Datei:
            // generierte (leere) JS-Chunks vom virtuellen Entry wieder entfernen
            const assetsDir = path.join(outDir, "assets");
            if (fs.existsSync(assetsDir)) {
                fs.rmSync(assetsDir, { recursive: true, force: true });
            }

            console.log(`✔ minisite: ${Object.keys(ctx.pages).length} pages → ${toPosix(path.relative(ctx.config.root, outFile))}`);
        },

        // ------------------------------------------------------------------
        // Aufräumen
        // ------------------------------------------------------------------
        closeWatcher() {
            ctx?.watcher?.close();
        },
    };

    // Programm-API an das Plugin hängen
    return Object.assign(plugin, {
        render() {
            if (!ctx) throw new Error("minisite(): Plugin wurde noch nicht initialisiert");
            buildContext(ctx);
            return ctx.compiledHtml;
        },
        get pages() {
            return ctx?.pages ?? {};
        },
    });
}

function toPosix(p: string): string {
    return p.replace(/\\/g, "/");
}

export default minisite;