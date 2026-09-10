// load package.json and return the version

import fs from "node:fs";
import path from "node:path";

export async function build(): Promise<string> {
  const file = path.resolve("package.json");
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return json.version;
}
