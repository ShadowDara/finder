import {
  Program,
  FlingStmt,
  FlingExpr,
  BinaryExpr,
} from "./ir";

const INDENT = "  "; // spec §11.6: 2-space indentation, K&R braces

// Precedence table straight out of spec §3.4. Higher number = binds tighter.
const PREC = {
  ASSIGN: 1,
  LOGICAL: 2, // && and || -- SAME tier in Fling, unlike JS
  COMPARISON: 3, // == != < > <= >= -- also flattened into ONE tier in Fling
  ADDITIVE: 4,
  MULTIPLICATIVE: 5,
  UNARY: 6,
  POSTFIX: 7,
  PRIMARY: 8,
} as const;

function isLogicalOp(op: string): boolean {
  return op === "&&" || op === "||";
}
function isComparisonOp(op: string): boolean {
  return ["==", "!=", "<", ">", "<=", ">="].includes(op);
}
function isAdditiveOp(op: string): boolean {
  return op === "+" || op === "-";
}

function precedenceOf(node: FlingExpr): number {
  switch (node.type) {
    case "Identifier":
    case "NumericLiteral":
    case "StringLiteral":
    case "ArrayLiteral":
    case "ObjectLiteral":
      return PREC.PRIMARY;
    case "CallExpr":
    case "MemberExpr":
      return PREC.POSTFIX;
    case "UnaryExpr":
      return PREC.UNARY;
    case "AssignmentExpr":
      return PREC.ASSIGN;
    case "BinaryExpr": {
      const op = node.operator;
      if (isLogicalOp(op)) return PREC.LOGICAL;
      if (isComparisonOp(op)) return PREC.COMPARISON;
      if (isAdditiveOp(op)) return PREC.ADDITIVE;
      return PREC.MULTIPLICATIVE; // * / %
    }
  }
}

export function emitProgram(program: Program): string {
  return program.body.map((s) => emitStmt(s, 0)).join("\n") + "\n";
}

function ind(depth: number): string {
  return INDENT.repeat(depth);
}

function emitBlockBody(stmts: FlingStmt[], depth: number): string {
  if (stmts.length === 0) return "";
  return stmts.map((s) => emitStmt(s, depth)).join("\n") + "\n";
}

function emitStmt(stmt: FlingStmt, depth: number): string {
  const pad = ind(depth);
  switch (stmt.type) {
    case "VarDeclaration": {
      const kw = stmt.constant ? "const" : "let";
      const init = stmt.value ? ` = ${emitExpr(stmt.value, PREC.ASSIGN)}` : "";
      // §3.2: semicolon is MANDATORY (and the only place it's allowed) here.
      return `${pad}${kw} ${stmt.identifier}${init};`;
    }
    case "FunctionDeclaration": {
      const params = stmt.parameters.join(", ");
      const body = emitBlockBody(stmt.body, depth + 1);
      return `${pad}fn ${stmt.name}(${params}) {\n${body}${pad}}`;
    }
    case "IfStatement": {
      const thenBody = emitBlockBody(stmt.thenBranch, depth + 1);
      let out = `${pad}if ${emitExpr(stmt.condition, PREC.ASSIGN + 1)} {\n${thenBody}${pad}}`;
      if (stmt.elseBranch) {
        const elseBody = emitBlockBody(stmt.elseBranch, depth + 1);
        out += ` else {\n${elseBody}${pad}}`;
      }
      return out;
    }
    case "WhileStatement": {
      const body = emitBlockBody(stmt.body, depth + 1);
      return `${pad}while ${emitExpr(stmt.condition, PREC.ASSIGN + 1)} {\n${body}${pad}}`;
    }
    case "ExpressionStatement": {
      // §3.6 / bug B14: an expression-statement must NOT be terminated with
      // ';' -- the reference parser doesn't consume it, which desyncs the
      // rest of the file. Never emit one here.
      return `${pad}${emitExpr(stmt.expression, PREC.ASSIGN)}`;
    }
  }
}

function paren(s: string): string {
  return `(${s})`;
}

/**
 * @param minPrec the minimum precedence the surrounding context requires;
 * if this node binds looser than that, it gets wrapped in parens.
 */
function emitExpr(node: FlingExpr, minPrec: number): string {
  const own = precedenceOf(node);
  const rendered = emitExprInner(node);
  return own < minPrec ? paren(rendered) : rendered;
}

function emitExprInner(node: FlingExpr): string {
  switch (node.type) {
    case "Identifier":
      return node.symbol;
    case "NumericLiteral":
      return String(node.value);
    case "StringLiteral":
      return `"${node.value}"`;
    case "ArrayLiteral":
      return `[${node.elements.map((e) => emitExpr(e, PREC.ASSIGN)).join(", ")}]`;
    case "ObjectLiteral":
      return `{ ${node.properties
        .map((p) => (p.value ? `${p.key}: ${emitExpr(p.value, PREC.ASSIGN)}` : p.key))
        .join(", ")} }`;
    case "UnaryExpr":
      return `${node.operator}${emitExpr(node.operand, PREC.UNARY)}`;
    case "AssignmentExpr":
      // right-assoc: right side may itself be an assignment without parens
      return `${node.target.symbol} = ${emitExpr(node.value, PREC.ASSIGN)}`;
    case "CallExpr":
      return `${emitExpr(node.callee, PREC.POSTFIX)}(${node.args
        .map((a) => emitExpr(a, PREC.ASSIGN))
        .join(", ")})`;
    case "MemberExpr":
      return node.computed
        ? `${emitExpr(node.object, PREC.POSTFIX)}[${emitExpr(node.property, PREC.ASSIGN)}]`
        : `${emitExpr(node.object, PREC.POSTFIX)}.${(node.property as { symbol: string }).symbol}`;
    case "BinaryExpr":
      return emitBinary(node);
  }
}

function emitBinary(node: BinaryExpr): string {
  const op = node.operator;

  if (isLogicalOp(op) || isComparisonOp(op)) {
    // Fling flattens && / || into one precedence tier (unlike JS, which
    // ranks && tighter than ||) and flattens ==,!=,<,>,<=,>= into one tier
    // too (unlike JS, which ranks relational tighter than equality). A
    // left-to-right re-emission at those tiers can therefore silently
    // change *meaning*, not just style -- so any nested logical-in-logical
    // or comparison-in-comparison is ALWAYS parenthesized, regardless of
    // whether the operators match, to force the grouping Babel's AST (i.e.
    // JS's real precedence) already determined.
    const childMustGroup = (child: FlingExpr) =>
      child.type === "BinaryExpr" &&
      ((isLogicalOp(op) && isLogicalOp(child.operator)) ||
        (isComparisonOp(op) && isComparisonOp(child.operator)));

    const leftStr = childMustGroup(node.left)
      ? paren(emitExprInner(node.left))
      : emitExpr(node.left, isLogicalOp(op) ? PREC.LOGICAL : PREC.COMPARISON);
    const rightStr = childMustGroup(node.right)
      ? paren(emitExprInner(node.right))
      : emitExpr(node.right, isLogicalOp(op) ? PREC.LOGICAL : PREC.COMPARISON);
    return `${leftStr} ${op} ${rightStr}`;
  }

  // Additive / multiplicative: precedence tiers line up 1:1 with JS, so
  // ordinary left-assoc paren rules (left: same tier, right: tier+1) apply.
  const tier = isAdditiveOp(op) ? PREC.ADDITIVE : PREC.MULTIPLICATIVE;
  const leftStr = emitExpr(node.left, tier);
  const rightStr = emitExpr(node.right, tier + 1);
  return `${leftStr} ${op} ${rightStr}`;
}
