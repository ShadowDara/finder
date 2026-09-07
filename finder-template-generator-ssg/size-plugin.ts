import { gzipSync, brotliCompressSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function buildSize(): Plugin {
  return {
    name: "build-size",
    apply: "build",

    closeBundle() {
      const outDir = resolve(process.cwd(), "dist");

      let total = 0;
      let gzip = 0;
      let brotli = 0;

      function walk(dir: string) {
        for (const file of readdirSync(dir)) {
          const path = resolve(dir, file);
          const stat = statSync(path);

          if (stat.isDirectory()) {
            walk(path);
            continue;
          }

          const data = readFileSync(path);

          total += data.length;
          gzip += gzipSync(data).length;
          brotli += brotliCompressSync(data).length;
        }
      }

      walk(outDir);

      console.log(`
📦 Frontend size

   Raw:    ${format(total)}
   Gzip:   ${format(gzip)}
   Brotli: ${format(brotli)}
`);
    },
  };
}

function format(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}
