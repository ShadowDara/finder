import { RESERVED_OR_GLOBAL } from "./keywords";

const VALID_IDENTIFIER = /^[A-Za-z][A-Za-z0-9]*$/;

export function isValidFlingIdentifier(name: string): boolean {
  return VALID_IDENTIFIER.test(name);
}

/**
 * Fling identifiers are `[A-Za-z][A-Za-z0-9]*` -- ASCII only, no `_`, no `$`,
 * first char can't be a digit (spec §2.4 / bug B9). This tries to produce a
 * legal, still-readable name for the common JS shapes:
 *   my_var        -> myVar        (snake_case -> camelCase)
 *   _private      -> private0     (leading underscore has no letter to anchor on)
 *   $el, jQuery$1 -> el, jQuery1  (dollar signs stripped)
 *   fn, let, if…  -> fn_, let_…   (collides with a Fling keyword/global)
 *
 * Returns null if nothing reasonable can be salvaged (e.g. a name that is
 * *only* punctuation once `_`/`$` are stripped) -- callers should treat that
 * as a hard compile error rather than emit something misleading.
 */
export function sanitizeIdentifier(original: string): string | null {
  // 1. snake_case / SCREAMING_SNAKE -> camelCase, drop bare underscores/$ elsewhere.
  let name = original.replace(/[_$]+([A-Za-z0-9])/g, (_m, c: string) => c.toUpperCase());
  name = name.replace(/[_$]+/g, ""); // any leftover leading/trailing underscores/$

  if (name.length === 0) return null;

  // 2. Must start with a letter.
  if (!/^[A-Za-z]/.test(name)) {
    if (/^[0-9]/.test(name)) {
      name = "n" + name; // numeric-looking after stripping -> prefix a letter
    } else {
      return null;
    }
  }

  // 3. Strip anything that still isn't [A-Za-z0-9] (unicode identifiers, etc).
  name = name.replace(/[^A-Za-z0-9]/g, "");
  if (name.length === 0 || !/^[A-Za-z]/.test(name)) return null;

  // 4. Dodge Fling keywords/predeclared globals.
  if (RESERVED_OR_GLOBAL.has(name)) {
    name = name + "_";
  }

  return isValidFlingIdentifier(name) ? name : null;
}

/** True if `sanitizeIdentifier` would have to change the name at all -- used
 * to decide whether a rename (and a corresponding warning) is needed. */
export function needsSanitizing(name: string): boolean {
  return !isValidFlingIdentifier(name) || RESERVED_OR_GLOBAL.has(name);
}
