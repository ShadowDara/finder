import * as t from "@babel/types";
import { DiagnosticBag, UnsupportedError, locOf } from "./diagnostics";
import { walkSkippingNestedFunctions } from "./walk";

const FLAG_NAME = "flingReturned"; // internal only -- see README "Reserved names"

function stmtsOf(body: t.Statement): t.Statement[] {
  return t.isBlockStatement(body) ? body.body : [body];
}

/** Does `node` contain a `return` anywhere, without crossing into a nested
 * function's own body (a nested function has its own independent return
 * elimination pass). */
function maybeReturns(node: t.Node): boolean {
  let found = false;
  walkSkippingNestedFunctions(node, (n) => {
    if (t.isReturnStatement(n)) found = true;
  });
  return found;
}

function findLoop(node: t.Statement): t.Statement | null {
  if (t.isWhileStatement(node) || t.isForStatement(node) || t.isDoWhileStatement(node)) return node;
  return null;
}

export interface EliminateResult {
  stmts: t.Statement[];
  usesResult: boolean;
}

/**
 * @param topLevelBindingNames identifiers already bound directly in this
 * function's own body/params -- used to detect a collision with Fling's
 * magic `result` fallback-return variable (spec §6.5).
 */
export function eliminateReturns(
  body: t.Statement[],
  topLevelBindingNames: Set<string>,
  diagnostics: DiagnosticBag
): EliminateResult {
  const returnCount = countReturns(body);
  if (returnCount === 0) {
    return { stmts: body, usesResult: false };
  }

  // Trivial, very common case: the ONLY return is the last statement of the
  // function, nothing nested. No machinery needed -- just drop `return`.
  const last = body[body.length - 1];
  if (
    returnCount === 1 &&
    t.isReturnStatement(last) &&
    !body.slice(0, -1).some((s) => maybeReturns(s))
  ) {
    const expr = last.argument;
    const tailExpr: t.Statement = expr
      ? t.expressionStatement(expr)
      : t.expressionStatement(t.identifier("null"));
    return { stmts: [...body.slice(0, -1), tailExpr], usesResult: false };
  }

  if (topLevelBindingNames.has("result")) {
    throw new UnsupportedError(
      "This function both needs Fling's implicit multi-path return convention and already declares its own variable named `result`. " +
        "Fling uses the name `result` itself as a fallback return value (spec §6.5) -- please rename your variable.",
      { loc: locOf(body[0] ?? ({} as any)) }
    );
  }
  if (topLevelBindingNames.has(FLAG_NAME)) {
    throw new UnsupportedError(
      `This function has multiple/early return paths, which this compiler tracks internally using a variable named \`${FLAG_NAME}\` -- but the function already declares its own variable with that exact name. Please rename it.`,
      { loc: locOf(body[0] ?? ({} as any)) }
    );
  }

  let usesResult = false;

  function resultAssign(expr: t.Expression | null): t.Statement[] {
    usesResult = true;
    const value = expr ?? t.identifier("null");
    return [
      t.expressionStatement(t.assignmentExpression("=", t.identifier("result"), value)),
      t.expressionStatement(t.assignmentExpression("=", t.identifier(FLAG_NAME), t.booleanLiteral(true))),
    ];
  }

  function restructure(list: t.Statement[]): t.Statement[] {
    const out: t.Statement[] = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];

      const loop = findLoop(s);
      if (loop) {
        const body =
          t.isForStatement(loop) || t.isWhileStatement(loop) || t.isDoWhileStatement(loop)
            ? (loop as any).body
            : null;
        if (body && maybeReturns(body)) {
          throw new UnsupportedError(
            "`return` inside a loop body is not supported: Fling has no `break`/early-exit, so a mid-loop return cannot be represented.",
            { loc: locOf(s) }
          );
        }
        out.push(s); // converted normally later; no return risk left inside
        continue;
      }

      if (t.isReturnStatement(s)) {
        out.push(...resultAssign(s.argument ?? null));
        return out; // textually-following siblings are genuinely dead code
      }

      if (t.isIfStatement(s)) {
        const consequentReturnable = maybeReturns(s.consequent);
        const alternateReturnable = s.alternate ? maybeReturns(s.alternate) : false;
        const consT = restructure(stmtsOf(s.consequent));
        const altT = s.alternate ? restructure(stmtsOf(s.alternate)) : null;
        out.push(
          t.ifStatement(
            s.test,
            t.blockStatement(consT),
            altT ? t.blockStatement(altT) : null
          )
        );

        const restOriginal = list.slice(i + 1);
        if (restOriginal.length === 0) return out;

        const restT = restructure(restOriginal);
        if (consequentReturnable || alternateReturnable) {
          out.push(
            t.ifStatement(
              t.unaryExpression("!", t.identifier(FLAG_NAME), true),
              t.blockStatement(restT),
              null
            )
          );
        } else {
          out.push(...restT);
        }
        return out;
      }

      out.push(s);
    }
    return out;
  }

  const stmts = restructure(body);
  const prelude: t.Statement[] = usesResult
    ? [
        t.variableDeclaration("let", [t.variableDeclarator(t.identifier("result"), t.nullLiteral())]),
        t.variableDeclaration("let", [
          t.variableDeclarator(t.identifier(FLAG_NAME), t.booleanLiteral(false)),
        ]),
      ]
    : [];
  return { stmts: [...prelude, ...stmts], usesResult };
}

function countReturns(list: t.Statement[]): number {
  let count = 0;
  for (const s of list) {
    walkSkippingNestedFunctions(s, (n) => {
      if (t.isReturnStatement(n)) count++;
    });
  }
  return count;
}
