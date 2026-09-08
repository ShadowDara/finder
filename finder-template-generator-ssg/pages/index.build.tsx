import fs from "node:fs";
import path from "node:path";

export async function build(): Promise<string> {
  const file = path.resolve("data/agents.md");

  const products = fs.readFileSync(file, "utf8");

  return products;
}
