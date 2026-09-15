// src/index.ts — Browser + Node compatible entry point

// Entferne Node-spezifische Module

// @babel/parser is pure JS, so this works everywhere.

// Exporte nur für Browsernutzung

export { compileSource as jsToFling } from "./compile";
export type { CompileResult } from "./compile";

// Re-export the raw compiler for advanced usage
export { compileSource } from "./compile";
