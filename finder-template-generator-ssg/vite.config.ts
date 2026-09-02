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
        changelog: ["/src/markdownstyle.css"],
        index: ["/src/markdownstyle.css"],
        readme: ["/src/markdownstyle.css"],
      },
      // relativePaths: true,
      extensions: [".ts", ".tsx"],
      prettyUrls: true,
      pagesDir: "pages",
      docsDir: "docs",
      entry: "src/main.ts",
      minify: true,
      title: (id) => {
        const titles: Record<string, string> = {
          index: "Finder",
          "viewer/index": "Template Viewer",
          about: "About",
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
        chunkFileNames: "assets/[name]-[hash].js",

        assetFileNames: (assetInfo) => {
          // if (assetInfo.name?.endsWith(".css")) {
          //   return "assets/index.css";
          // }

          return "assets/[name]-[hash][extname]";
        },
      },
    },
    outDir: mode === "static" ? "dist-static" : "dist",
  },
}));
