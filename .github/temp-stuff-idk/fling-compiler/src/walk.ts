import * as t from "@babel/types";

const SKIP_KEYS = new Set(["loc", "start", "end", "leadingComments", "trailingComments", "innerComments"]);

/**
 * Visits every node in `node`'s subtree, calling `visit` on each, but never
 * descends into a *nested* function's own body/params (the root node itself
 * is always visited and descended into, even if it happens to be a
 * function). Used for questions like "does this function contain a
 * `return`/declare a variable called X anywhere in ITS OWN body" without
 * accidentally reaching into an inner `fn`'s independent scope.
 */
export function walkSkippingNestedFunctions(
  node: t.Node,
  visit: (n: t.Node) => void,
  isRoot = true
): void {
  if (!isRoot && t.isFunction(node)) return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const val: any = (node as any)[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item.type === "string") walkSkippingNestedFunctions(item, visit, false);
      }
    } else if (typeof val.type === "string") {
      walkSkippingNestedFunctions(val, visit, false);
    }
  }
}
