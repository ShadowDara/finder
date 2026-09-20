import { defineConfig } from "vite";
import { pagesPlugin } from "twynejs";
import { visualizer } from "rollup-plugin-visualizer";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import viteRemove from "unplugin-remove/vite";
import { DevTools } from "@vitejs/devtools";
import { string } from "rollup-plugin-string";
import fs from "node:fs";
import licenseChecker from "license-checker";
import eslint from "vite-plugin-eslint";
import yaml from "@rollup/plugin-yaml";
import { buildStats } from "./vite-plugin-build-stats";
import { markdownLint } from "./md-linter-plugin";
import i18nextLoader from "vite-plugin-i18next-loader";
import _monacoEditorPlugin from "vite-plugin-monaco-editor";

const monacoEditorPlugin =
  typeof _monacoEditorPlugin === "function"
    ? _monacoEditorPlugin
    : (_monacoEditorPlugin as any).default;

function dependenciesPlugin(outDir: string) {
  return {
    name: "dependencies-list",

    async buildStart() {
      const reportPath = path.join("public", "dependencies.txt");

      const dependencies = await new Promise<
        Record<
          string,
          {
            licenses?: string;
          }
        >
      >((resolve, reject) => {
        licenseChecker.init(
          {
            start: process.cwd(),
            production: false,
          },
          (error, packages) => {
            if (error) {
              reject(error);
            } else {
              resolve(packages);
            }
          },
        );
      });

      const lines = Object.entries(dependencies)
        .map(([name, info]) => {
          const license = info.licenses ?? "UNKNOWN";
          return `${name} -- ${license}`;
        })
        .sort((a, b) => a.localeCompare(b));

      fs.writeFileSync(reportPath, lines.join("\n") + "\n", "utf8");

      console.log(`Generated ${lines.length} dependency license entries`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const name = mode === "static" ? "gh-pages" : "backend";
  const statsname = mode === "static" ? "static-stats.html" : "stats.html";
  const outDir = mode === "static" ? "dist-static" : "dist";
  return {
    base: mode === "static" ? "/finder/" : "./",
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        mode === "production" ? "production" : "development",
      ),
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "twynejs",
    },
    root: ".",
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:13420",
          changeOrigin: true,
          ws: true,
        },
      },
    },
    plugins: [
      // i18nextLoader({
      //   paths: ["./src/locales"],
      // }),
      monacoEditorPlugin({}),
      markdownLint({
        maxLineLength: 72,

        ignore: [
          "docs/generated/**",
          "README.md",
          "**/CHANGELOG.md",
          "dist-static/**",
        ],
      }),
      yaml(),
      // eslint(),
      string({ include: "**/*.html" }),
      DevTools(),
      dependenciesPlugin(outDir),
      tailwindcss(),
      visualizer({
        filename: "./" + statsname,
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
      pagesPlugin({
        styles: {
          changelog: ["/src/markdownrootstyle.css"],
          index: ["/src/markdownrootstyle.css"],
          readme: ["/src/markdownrootstyle.css"],
          configeditor: ["/src/markdownstyle.css"],
          "docs/config": ["/src/markdownrootstyle.css"],
          "docs/index": ["/src/markdownrootstyle.css"],
        },
        head: {
          index: `<link rel="icon" type="image/svg+xml" href="./favicon.svg" />`,
        },
        splitMarkdown: true,
        prettyUrls: true,
        entry: "src/main.ts",
        removeConsole: true,
        minify: true,
        title: (id) => {
          const titles: Record<string, string> = {
            index: "Finder",
            viewer: "Template Viewer",
            configeditor: "Finder Config Editor",
          };

          return titles[id] ?? "Finder";
        },
      }),
      viteRemove({
        /* options */
      }),
      buildStats({ filename: "../data/" + name + ".json" }),
    ],
    build: {
      rollupOptions: {
        // Single shared entry — every generated HTML page loads this bundle.
        input: "src/main.ts",
        output: {
          entryFileNames: "assets/main_entry.js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: (_assetInfo) => {
            return "assets/[name][extname]";
          },
        },
      },
      outDir,
    },
  };
});
