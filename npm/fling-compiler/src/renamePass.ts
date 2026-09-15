import * as t from "@babel/types";
import traverseModule from "@babel/traverse";
import { DiagnosticBag, UnsupportedError, locOf } from "./diagnostics";
import { sanitizeIdentifier, needsSanitizing } from "./identifiers";

// @babel/traverse ships as CJS with a default export; depending on the
// interop settings the import above can itself already be the function, or
// an object with a `.default` -- handle both.
const traverse: typeof traverseModule = (traverseModule as any).default ?? traverseModule;

/**
 * Walks every scope in the file and renames any binding whose name isn't a
 * legal Fling identifier (contains `_`/`$`, starts with a digit, or collides
 * with a Fling keyword/global -- see identifiers.ts) to a sanitized
 * equivalent, using Babel's scope-aware rename so every reference (not just
 * the declaration) is updated consistently.
 */
export function sanitizeAllIdentifiers(file: t.File, diagnostics: DiagnosticBag): void {
  const usedNames = new Set<string>();

  traverse(file, {
    Scopable(path: any) {
      const bindingNames = Object.keys(path.scope.bindings);
      for (const name of bindingNames) {
        if (!needsSanitizing(name)) {
          usedNames.add(name);
          continue;
        }
        let sanitized = sanitizeIdentifier(name);
        if (!sanitized) {
          const binding = path.scope.bindings[name];
          throw new UnsupportedError(
            `Identifier \`${name}\` can't be represented in Fling: Fling identifiers must match [A-Za-z][A-Za-z0-9]* (spec §2.4, bug B9), and nothing usable is left after stripping the invalid characters. Please rename it in the source.`,
            { loc: locOf(binding.identifier) }
          );
        }
        // Avoid collisions with a name already in use anywhere in the file.
        let candidate = sanitized;
        let suffix = 2;
        while (usedNames.has(candidate)) {
          candidate = `${sanitized}${suffix}`;
          suffix++;
        }
        usedNames.add(candidate);
        diagnostics.info(
          `Renamed identifier \`${name}\` -> \`${candidate}\` (Fling identifiers can't contain \`_\`/\`$\`, can't start with a digit, and can't collide with a Fling keyword -- spec §2.4/§2.3, bug B9).`,
          locOf(path.scope.bindings[name].identifier)
        );
        path.scope.rename(name, candidate);
      }
    },
  });
}
