import { parse } from "@babel/parser";
import { DiagnosticBag, UnsupportedError } from "./diagnostics";
import { sanitizeAllIdentifiers } from "./renamePass";
import { convertProgram } from "./toFling";
import { emitProgram } from "./emit";

export interface CompileResult {
  /** The generated Fling source, or null if compilation failed. */
  fling: string | null;
  diagnostics: DiagnosticBag;
}

export function compileSource(source: string, filename = "input.ts"): CompileResult {
  const diagnostics = new DiagnosticBag();

  try {
    const file = parse(source, {
      sourceFilename: filename,
      sourceType: "module",
      plugins: ["typescript"],
      errorRecovery: false,
    });

    sanitizeAllIdentifiers(file, diagnostics);
    const program = convertProgram(file, diagnostics);

    if (diagnostics.hasErrors) {
      return { fling: null, diagnostics };
    }

    return { fling: emitProgram(program), diagnostics };
  } catch (err) {
    if (err instanceof UnsupportedError) {
      diagnostics.error(err.message, err.loc, err.ref);
    } else if (err instanceof Error) {
      // Parse errors from @babel/parser carry a loc property too.
      const loc = (err as any).loc ? { line: (err as any).loc.line, column: (err as any).loc.column + 1 } : null;
      diagnostics.error(err.message, loc);
    } else {
      diagnostics.error(String(err));
    }
    return { fling: null, diagnostics };
  }
}
