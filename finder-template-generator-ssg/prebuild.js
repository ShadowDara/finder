import { copyFile } from "fs/promises";

await copyFile("./../CHANGELOG.md", "./docs/changelog.md");

// Save all templates for static frontend

import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const templatesDir = path.resolve("../internal/templates");
const outputFile = path.resolve("./src/templates.js");

const files = await readdir(templatesDir);

const templates = {};

for (const file of files) {
  if (!file.endsWith(".json5")) {
    continue;
  }

  const filePath = path.join(templatesDir, file);
  const content = await readFile(filePath, "utf8");

  templates[file] = JSON.parse(content);
}

const output = `// INFO
// THIS FILE IS AUTO GENERATED FROM ALL BUILTIN TEMPLATES
// DO NOT EDIT IT!!!

export default ${JSON.stringify(templates, null, 2)};\n`;

await writeFile(outputFile, output, "utf8");

console.log(`Generated ${outputFile}`);
console.log(`Loaded ${Object.keys(templates).length} templates`);
