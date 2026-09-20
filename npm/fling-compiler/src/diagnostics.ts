export type Severity = "error" | "warning" | "info";

export interface SourceLoc {
  line: number;
  column: number;
}

export interface Diagnostic {
  severity: Severity;
  message: string;
  loc?: SourceLoc | null;
  /** e.g. "B3" cross-referencing the known-bug list in the Fling spec, §9 */
  ref?: string;
}

/**
 * Thrown internally to abort compilation of the current node/function once an
 * unrecoverable "this JS construct cannot be represented in Fling" situation
 * is hit. The CLI/compile() entry point catches this, records the diagnostic
 * that was attached, and reports failure -- we never want to silently emit
 * Fling code that doesn't mean what the input meant (the whole point of this
 * tool is to avoid the "silent Null" failure mode the reference interpreter
 * itself has -- see spec §8).
 */
export class UnsupportedError extends Error {
  ref?: string;
  loc?: SourceLoc | null;
  constructor(message: string, opts?: { ref?: string; loc?: SourceLoc | null }) {
    super(message);
    this.ref = opts?.ref;
    this.loc = opts?.loc ?? null;
  }
}

export class DiagnosticBag {
  readonly items: Diagnostic[] = [];

  error(message: string, loc?: SourceLoc | null, ref?: string) {
    this.items.push({ severity: "error", message, loc, ref });
  }

  warn(message: string, loc?: SourceLoc | null, ref?: string) {
    this.items.push({ severity: "warning", message, loc, ref });
  }

  info(message: string, loc?: SourceLoc | null, ref?: string) {
    this.items.push({ severity: "info", message, loc, ref });
  }

  get hasErrors(): boolean {
    return this.items.some((d) => d.severity === "error");
  }

  format(): string {
    return this.items
      .map((d) => {
        const where = d.loc ? `${d.loc.line}:${d.loc.column}` : "?:?";
        const refTag = d.ref ? ` [${d.ref}]` : "";
        return `${d.severity.toUpperCase()}${refTag} (${where}): ${d.message}`;
      })
      .join("\n");
  }
}

/** Small helper to pull a `{line, column}` out of a babel node in a
 * null-safe way (babel columns are 0-based; we report 1-based like most
 * editors, matching the Fling lexer's own line/column tracking style). */
export function locOf(node: { loc?: { start: { line: number; column: number } } | null }): SourceLoc | null {
  if (!node.loc) return null;
  return { line: node.loc.start.line, column: node.loc.start.column + 1 };
}
