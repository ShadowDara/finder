import type { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface BuildStatsOptions {
  /**
   * Name of the generated statistics file.
   * @default "stats.json"
   */
  filename?: string;

  /**
   * Directory relative to Vite's outDir.
   * @default "."
   */
  outputDir?: string;
}

interface FileStat {
  path: string;
  extension: string;
  bytes: number;
}

interface ExtensionStats {
  extension: string;
  files: number;
  bytes: number;
  percentage: number;
}

interface BuildStats {
  generatedAt: string;
  total: {
    files: number;
    bytes: number;
    kilobytes: number;
    megabytes: number;
  };
  byExtension: ExtensionStats[];
  files: FileStat[];
}

export function buildStats(options: BuildStatsOptions = {}): Plugin {
  const { filename = "stats.json", outputDir = "." } = options;

  let config: ResolvedConfig;

  return {
    name: "vite-plugin-build-stats",

    // Make this a post plugin so it runs after normal Vite plugins.
    enforce: "post",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    /**
     * closeBundle is the final Rollup/Vite build hook.
     *
     * At this point Vite/Rollup has finished writing the build output.
     */
    async closeBundle() {
      if (config.command !== "build") {
        return;
      }

      const outDir = path.resolve(config.root, config.build.outDir, outputDir);

      const statsPath = path.resolve(outDir, filename);

      const files = await collectFiles(outDir, statsPath);

      const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);

      const extensionMap = new Map<string, { files: number; bytes: number }>();

      for (const file of files) {
        const existing = extensionMap.get(file.extension);

        if (existing) {
          existing.files++;
          existing.bytes += file.bytes;
        } else {
          extensionMap.set(file.extension, {
            files: 1,
            bytes: file.bytes,
          });
        }
      }

      const byExtension: ExtensionStats[] = [...extensionMap.entries()]
        .map(([extension, stats]) => ({
          extension,
          files: stats.files,
          bytes: stats.bytes,
          percentage:
            totalBytes === 0
              ? 0
              : Number(((stats.bytes / totalBytes) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.bytes - a.bytes);

      const result: BuildStats = {
        generatedAt: new Date().toISOString(),

        total: {
          files: files.length,
          bytes: totalBytes,
          kilobytes: round(totalBytes / 1024),
          megabytes: round(totalBytes / 1024 / 1024),
        },

        byExtension,

        files: files.sort((a, b) => b.bytes - a.bytes),
      };

      await fs.mkdir(path.dirname(statsPath), {
        recursive: true,
      });

      await fs.writeFile(statsPath, JSON.stringify(result, null, 2), "utf8");

      printStats(result, statsPath);
    },
  };
}

async function collectFiles(
  directory: string,
  excludedFile: string,
): Promise<FileStat[]> {
  const result: FileStat[] = [];

  async function walk(currentDirectory: string) {
    const entries = await fs.readdir(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (fullPath === excludedFile) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stat = await fs.stat(fullPath);

      result.push({
        path: path.relative(directory, fullPath).split(path.sep).join("/"),

        extension: getExtension(fullPath),

        bytes: stat.size,
      });
    }
  }

  await walk(directory);

  return result;
}

function getExtension(filename: string): string {
  const basename = path.basename(filename);
  const extension = path.extname(basename);

  if (!extension) {
    return "[no extension]";
  }

  return extension.toLowerCase();
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function printStats(stats: BuildStats, statsPath: string) {
  console.log("");
  console.log("📦 Build statistics");
  console.log("────────────────────────────────");

  console.log(
    `Total: ${formatBytes(stats.total.bytes)} ` +
      `(${stats.total.files} files)`,
  );

  console.log("");
  console.log("By extension:");

  for (const group of stats.byExtension) {
    console.log(
      `  ${group.extension.padEnd(15)} ` +
        `${formatBytes(group.bytes).padStart(12)} ` +
        `${String(group.files).padStart(5)} files ` +
        `(${group.percentage.toFixed(2)}%)`,
    );
  }

  console.log("");
  console.log(`Stats: ${statsPath}`);
  console.log("");
}
