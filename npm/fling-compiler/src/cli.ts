#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { compileSource } from "./compile";

function usage(): never {
  console.error(
    "Usage: flingc <input.ts|input.js> [-o output.fling] [--warnings-as-errors]",
  );
  process.exit(2);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) usage();

  let input: string | null = null;
  let output: string | null = null;
  let warningsAsErrors = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--output") {
      output = argv[++i];
    } else if (a === "--warnings-as-errors") {
      warningsAsErrors = true;
    } else if (a === "-h" || a === "--help") {
      usage();
    } else if (!input) {
      input = a;
    } else {
      usage();
    }
  }
  if (!input) usage();

  const source = fs.readFileSync(input, "utf8");
  const result = compileSource(source, path.basename(input));

  const errorCount = result.diagnostics.items.filter(
    (d) => d.severity === "error",
  ).length;
  const warnCount = result.diagnostics.items.filter(
    (d) => d.severity === "warning",
  ).length;

  if (result.diagnostics.items.length > 0) {
    console.error(result.diagnostics.format());
    console.error("");
  }

  const failed = result.fling === null || (warningsAsErrors && warnCount > 0);
  if (failed) {
    console.error(
      `Compilation failed: ${errorCount} error(s), ${warnCount} warning(s).`,
    );
    process.exit(1);
  }

  const outPath = output ?? input.replace(/\.[tj]sx?$/, "") + ".fling";
  fs.writeFileSync(outPath, result.fling as string, "utf8");
  console.error(`Wrote ${outPath} (${warnCount} warning(s)).`);
}

main();
