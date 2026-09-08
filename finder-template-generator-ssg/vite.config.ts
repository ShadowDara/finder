import { defineConfig } from "vite";
import { pagesPlugin } from "./pages-ssg-plugin";
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
  const outDir = mode === "static" ? "dist-static" : "dist";
  return {
    base: mode === "static" ? "/finder/" : "./",
    esbuild: {
      jsxFactory: "jsx",
      jsxFragment: "Fragment",
    },
    root: ".",
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      yaml(),
      // eslint(),
      string({ include: "**/*.html" }),
      DevTools(),
      dependenciesPlugin(outDir),
      tailwindcss(),
      visualizer({
        filename: "./stats.html",
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
        // splitMarkdown: true,
        prettyUrls: true,
        entry: "src/main.ts",
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
          entryFileNames: "assets/index.js",
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
