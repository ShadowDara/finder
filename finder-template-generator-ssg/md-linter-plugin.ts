import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { glob } from "tinyglobby";
import type { Plugin } from "vite";

export interface MarkdownLintOptions {
  /**
   * Maximum allowed line length.
   * @default 72
   */
  maxLineLength?: number;

  /**
   * Glob patterns for files that should be ignored.
   *
   * @default []
   */
  ignore?: string[];
}

export function markdownLint(options: MarkdownLintOptions = {}): Plugin {
  const maxLineLength = options.maxLineLength ?? 72;
  const ignore = options.ignore ?? [];
  let filescount = 0;

  return {
    name: "vite-plugin-markdown-lint",

    apply: "build",

    async buildStart() {
      const root = this.environment?.config.root ?? process.cwd();

      const files = await glob("**/*.md", {
        cwd: root,
        ignore: ["node_modules/**", "dist/**", ...ignore],
        absolute: true,
      });

      let warningCount = 0;

      for (const file of files) {
        const content = readFileSync(file, "utf8");
        const lines = content.split(/\r?\n/);
        let warn = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.length <= maxLineLength) {
            continue;
          }

          const relativePath = relative(root, file);

          this.warn({
            message: `Line ${i + 1} is ${line.length} characters long (max ${maxLineLength})`,
            id: file,
            location: {
              line: i + 1,
              column: maxLineLength + 1,
            },
          });

          warningCount++;
          warn = true;
        }

        if (warn) {
          filescount++;
        }
      }

      if (warningCount > 0) {
        this.warn(
          `Markdown linting found ${warningCount} warning${
            warningCount === 1 ? "" : "s"
          } in ${filescount} files${filescount === 1 ? "" : "s"}.`,
        );
      }
    },
  };
}
