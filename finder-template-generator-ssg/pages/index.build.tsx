import { parseMarkdown } from "@shadowdara/dlib";
import fs from "node:fs";
import path from "node:path";
import hljs from "highlight.js/lib/common";
// import { minify } from "html-minifier-terser";

export async function build(): Promise<string> {
  const file = path.resolve("data/agents.md");

  let markdown = "````md\n";
  markdown += fs.readFileSync(file, "utf8");
  markdown += "\n````";

  let html = parseMarkdown(markdown, {
    sanitize: false,
    highlight(code, language) {
      if (!hljs.getLanguage(language)) {
        return code;
      }

      return hljs.highlight(code, {
        language,
      }).value;
    },
  });

  return html;
}
