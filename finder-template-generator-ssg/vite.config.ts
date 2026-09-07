import { defineConfig } from "vite";
import { pagesPlugin } from "./pages-ssg-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import { buildSize } from "./size-plugin";

export default defineConfig(({ mode }) => ({
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
    buildSize(),
  ],
  build: {
    rollupOptions: {
      // Single shared entry — every generated HTML page loads this bundle.
      input: "src/main.ts",
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          return "assets/[name][extname]";
        },
      },
    },
    outDir: mode === "static" ? "dist-static" : "dist",
  },
}));
