import { defineConfig } from "vite";
import { pagesPlugin } from "./pages-ssg-plugin";
import { visualizer } from "rollup-plugin-visualizer";

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
        "docs/config": ["/src/markdownstyle.css"],
      },
      extensions: [".ts", ".tsx"],
      prettyUrls: true,
      pagesDir: "pages",
      docsDir: "docs",
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
