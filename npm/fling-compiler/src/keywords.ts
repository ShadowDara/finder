/**
 * Constants describing the Fling language surface, taken directly from the
 * spec (Fling – Sprachspezifikation & Feature-Dokument), section 2.3 / 6.7 / 7.
 */

/** The only 6 reserved words in Fling. Using one of these as a JS identifier
 * requires renaming (see identifiers.ts). */
export const FLING_KEYWORDS = new Set([
  "let",
  "const",
  "fn",
  "if",
  "else",
  "while",
]);

/** Not keywords in Fling -- just predeclared const bindings in the global
 * environment (section 2.3 / 7). They CAN be shadowed, but we still avoid
 * silently colliding with them so generated code keeps its obvious meaning. */
export const FLING_GLOBALS = new Set(["true", "false", "null", "print"]);

/** Everything the emitter/transform needs to steer clear of. */
export const RESERVED_OR_GLOBAL = new Set([
  ...FLING_KEYWORDS,
  ...FLING_GLOBALS,
]);
