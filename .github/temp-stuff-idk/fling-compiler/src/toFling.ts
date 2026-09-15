import * as t from "@babel/types";
import {
  Program as FProgram,
  FlingStmt,
  FlingExpr,
  Identifier,
  StringLiteral,
  ObjectProperty,
  BinaryOp,
  FunctionDeclaration as FFunctionDeclaration,
  IfStatement as FIfStatement,
} from "./ir";
import { DiagnosticBag, UnsupportedError, locOf } from "./diagnostics";
import { eliminateReturns } from "./functionReturn";
import { walkSkippingNestedFunctions } from "./walk";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function stmtsOf(body: t.Statement): t.Statement[] {
  return t.isBlockStatement(body) ? body.body : [body];
}

function unwrapTS(expr: t.Expression): t.Expression {
  let e: t.Node = expr;
  while (
    t.isTSAsExpression(e) ||
    t.isTSSatisfiesExpression(e) ||
    t.isTSNonNullExpression(e) ||
    t.isTSTypeAssertion(e) ||
    t.isTSInstantiationExpression(e) ||
    t.isParenthesizedExpression(e)
  ) {
    e = (e as any).expression;
  }
  return e as t.Expression;
}

function assignStmt(name: string, value: FlingExpr): FlingStmt {
  return {
    type: "ExpressionStatement",
    expression: { type: "AssignmentExpr", target: { type: "Identifier", symbol: name }, value },
  };
}

function stringLiteralIR(value: string, node: t.Node): StringLiteral {
  if (value.includes('"')) {
    throw new UnsupportedError(
      `String literal contains a literal '"' character, which would prematurely close the Fling string -- Fling has no escape sequences at all (spec §2.5, bug B10).`,
      { loc: locOf(node), ref: "B10" }
    );
  }
  return { type: "StringLiteral", value };
}

function looksLikeString(e: t.Node): boolean {
  const u = t.isExpression(e) ? unwrapTS(e) : e;
  return t.isStringLiteral(u) || t.isTemplateLiteral(u);
}

/**
 * Lowers a (possibly nested) ternary into if/else statements. `wrap` turns a
 * resolved leaf branch (itself possibly still a ternary, handled by the
 * recursion) into the Fling statement(s) that should run for that branch.
 * This is the ONE place ternaries are supported -- everywhere else they are
 * a hard compile error, since Fling has no `?:` at all (spec §10).
 */
function lowerConditionalToIf(
  expr: t.Expression,
  wrap: (leaf: t.Expression) => FlingStmt[],
  diagnostics: DiagnosticBag
): FlingStmt[] {
  const e = unwrapTS(expr);
  if (t.isConditionalExpression(e)) {
    const condition = convertExpr(unwrapTS(e.test), diagnostics);
    const thenBranch = lowerConditionalToIf(e.consequent, wrap, diagnostics);
    const elseBranch = lowerConditionalToIf(e.alternate, wrap, diagnostics);
    const stmt: FIfStatement = { type: "IfStatement", condition, thenBranch, elseBranch };
    return [stmt];
  }
  return wrap(e);
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

export function convertProgram(file: t.File, diagnostics: DiagnosticBag): FProgram {
  const body: FlingStmt[] = [];
  for (const stmt of file.program.body) {
    body.push(...convertStatement(stmt, diagnostics));
  }
  return { type: "Program", body };
}

export function convertBodyStatements(list: t.Statement[], diagnostics: DiagnosticBag): FlingStmt[] {
  const out: FlingStmt[] = [];
  for (const s of list) out.push(...convertStatement(s, diagnostics));
  return out;
}

function convertStatement(stmt: t.Statement, diagnostics: DiagnosticBag): FlingStmt[] {
  switch (stmt.type) {
    case "VariableDeclaration":
      return convertVariableDeclaration(stmt, diagnostics);

    case "FunctionDeclaration":
      return [convertFunctionDeclaration(stmt, diagnostics)];

    case "IfStatement":
      return [convertIf(stmt, diagnostics)];

    case "WhileStatement":
      return [
        {
          type: "WhileStatement",
          condition: convertExpr(unwrapTS(stmt.test), diagnostics),
          body: convertBodyStatements(stmtsOf(stmt.body), diagnostics),
        },
      ];

    case "ForStatement":
      return convertFor(stmt, diagnostics);

    case "DoWhileStatement":
      return convertDoWhile(stmt, diagnostics);

    case "BlockStatement":
      diagnostics.info(
        "A standalone `{ ... }` block has no Fling equivalent (spec §10) -- its statements are inlined directly into the surrounding scope. Since Fling doesn't block-scope `if`/`else` either (bug B8), this is usually harmless, but shadowing inside the block will behave differently.",
        locOf(stmt)
      );
      return convertBodyStatements(stmt.body, diagnostics);

    case "ExpressionStatement":
      return convertExpressionAsStatement(stmt.expression, diagnostics);

    case "EmptyStatement":
      return [];

    case "ReturnStatement":
      // Should already have been eliminated by eliminateReturns() before we
      // ever get here (function bodies are pre-processed). If we see one, a
      // `return` exists somewhere return-elimination doesn't cover.
      throw new UnsupportedError(
        "`return` is not supported at this position (only inside a directly-enclosing function's body, not inside e.g. a loop).",
        { loc: locOf(stmt) }
      );

    case "TSTypeAliasDeclaration":
    case "TSInterfaceDeclaration":
    case "TSDeclareFunction":
      return []; // type-only, no runtime effect -- safe to drop

    case "TSEnumDeclaration":
      throw new UnsupportedError(
        "TypeScript `enum` is not supported: it compiles to a runtime object with reverse mappings, which has no Fling equivalent. Use plain `const` values instead.",
        { loc: locOf(stmt) }
      );

    case "TSModuleDeclaration":
      throw new UnsupportedError("TypeScript namespaces/modules are not supported.", { loc: locOf(stmt) });

    case "ExportNamedDeclaration":
    case "ExportDefaultDeclaration":
      if ((stmt as any).declaration) {
        return convertStatement((stmt as any).declaration, diagnostics);
      }
      throw new UnsupportedError(
        "Re-exports / export lists are not supported -- Fling has no module system (spec §10). Compile a single self-contained file.",
        { loc: locOf(stmt) }
      );

    case "ImportDeclaration":
      throw new UnsupportedError(
        "`import` is not supported -- Fling has no module system (spec §10). Inline everything into one file.",
        { loc: locOf(stmt) }
      );

    case "ClassDeclaration":
      throw new UnsupportedError(
        "Classes are not supported -- Fling has no classes/structs/inheritance/methods (spec §10). Use plain functions and object literals instead.",
        { loc: locOf(stmt) }
      );

    case "SwitchStatement":
      throw new UnsupportedError(
        "`switch` is not supported -- Fling only has `if`/`else` (spec §10). Rewrite as an if/else-if chain.",
        { loc: locOf(stmt) }
      );

    case "TryStatement":
      throw new UnsupportedError(
        "`try`/`catch` is not supported -- Fling has no exceptions (spec §10); the reference interpreter just prints errors to stdout/stderr and keeps going with `Null`.",
        { loc: locOf(stmt) }
      );

    case "ThrowStatement":
      throw new UnsupportedError("`throw` is not supported -- Fling has no exceptions.", { loc: locOf(stmt) });

    case "BreakStatement":
      throw new UnsupportedError(
        "`break` is not supported -- Fling has no loop-exit construct (spec §10). Restructure the loop condition instead.",
        { loc: locOf(stmt) }
      );

    case "ContinueStatement":
      throw new UnsupportedError(
        "`continue` is not supported -- Fling has no loop-control construct (spec §10). Restructure with an `if` guarding the rest of the loop body instead.",
        { loc: locOf(stmt) }
      );

    case "LabeledStatement":
      throw new UnsupportedError("Labeled statements are not supported.", { loc: locOf(stmt) });

    case "DebuggerStatement":
      return [];

    default:
      throw new UnsupportedError(`Unsupported statement type: ${stmt.type}`, { loc: locOf(stmt) });
  }
}

function convertVariableDeclaration(node: t.VariableDeclaration, diagnostics: DiagnosticBag): FlingStmt[] {
  const isConst = node.kind === "const";
  if (node.kind === "var") {
    diagnostics.warn(
      "`var` is compiled as `let`; JS's function-scoping/hoisting semantics for `var` are not replicated (Fling only has block-ish `let`/`const`).",
      locOf(node)
    );
  }

  const out: FlingStmt[] = [];
  for (const decl of node.declarations) {
    if (!t.isIdentifier(decl.id)) {
      throw new UnsupportedError(
        "Destructuring in a variable declaration is not supported -- Fling has no destructuring (spec §10).",
        { loc: locOf(decl) }
      );
    }
    const name = decl.id.name;

    if (!decl.init) {
      if (isConst) {
        throw new UnsupportedError(
          "`const` without an initializer is invalid in Fling (spec §3.2) -- `const` always requires a value.",
          { loc: locOf(decl) }
        );
      }
      out.push({ type: "VarDeclaration", constant: false, identifier: name, value: null });
      continue;
    }

    const init = unwrapTS(decl.init);
    if (t.isConditionalExpression(init)) {
      if (isConst) {
        diagnostics.warn(
          `\`const ${name}\` is compiled as \`let\`: its value depends on a ternary, and Fling has no ternary operator, so the assignment has to happen in a later statement.`,
          locOf(decl)
        );
      }
      out.push({ type: "VarDeclaration", constant: false, identifier: name, value: null });
      out.push(
        ...lowerConditionalToIf(init, (leaf) => [assignStmt(name, convertExpr(leaf, diagnostics))], diagnostics)
      );
    } else {
      out.push({
        type: "VarDeclaration",
        constant: isConst,
        identifier: name,
        value: convertExpr(init, diagnostics),
      });
    }
  }
  return out;
}



function functionOwnDeclaredNames(bodyStmts: t.Statement[]): Set<string> {
  const names = new Set<string>();
  for (const s of bodyStmts) {
    walkSkippingNestedFunctions(s, (n) => {
      if (t.isVariableDeclarator(n) && t.isIdentifier(n.id)) names.add(n.id.name);
    });
  }
  return names;
}

function convertFunctionDeclaration(node: t.FunctionDeclaration, diagnostics: DiagnosticBag): FFunctionDeclaration {
  if (!node.id) {
    throw new UnsupportedError("Anonymous function declarations are not supported.", { loc: locOf(node) });
  }
  if (node.generator) {
    throw new UnsupportedError("Generator functions are not supported.", { loc: locOf(node) });
  }
  if (node.async) {
    throw new UnsupportedError(
      "`async` functions are not supported -- Fling is single-threaded/synchronous with no Promises.",
      { loc: locOf(node) }
    );
  }

  const params: string[] = [];
  for (const p of node.params) {
    if (!t.isIdentifier(p)) {
      throw new UnsupportedError(
        "Only plain identifier parameters are supported -- no default values, rest parameters, or destructuring (spec §3.2).",
        { loc: locOf(p) }
      );
    }
    params.push(p.name);
  }

  const RESERVED_HELPER_NAMES = ["result", "flingReturned"];
  const declared = functionOwnDeclaredNames(node.body.body);
  const bindingNames = new Set<string>(
    RESERVED_HELPER_NAMES.filter((n) => params.includes(n) || declared.has(n))
  );

  const { stmts } = eliminateReturns(node.body.body, bindingNames, diagnostics);
  const body = convertBodyStatements(stmts, diagnostics);
  return { type: "FunctionDeclaration", name: node.id.name, parameters: params, body };
}

function convertIf(node: t.IfStatement, diagnostics: DiagnosticBag): FIfStatement {
  const condition = convertExpr(unwrapTS(node.test), diagnostics);
  const thenBranch = convertBodyStatements(stmtsOf(node.consequent), diagnostics);
  const elseBranch = node.alternate ? convertBodyStatements(stmtsOf(node.alternate), diagnostics) : null;
  return { type: "IfStatement", condition, thenBranch, elseBranch };
}

function convertFor(node: t.ForStatement, diagnostics: DiagnosticBag): FlingStmt[] {
  const initStmts: FlingStmt[] = [];
  if (node.init) {
    if (t.isVariableDeclaration(node.init)) {
      initStmts.push(...convertVariableDeclaration(node.init, diagnostics));
    } else {
      initStmts.push(...convertExpressionAsStatement(node.init, diagnostics));
    }
  }

  const condition: FlingExpr = node.test
    ? convertExpr(unwrapTS(node.test), diagnostics)
    : { type: "Identifier", symbol: "true" };

  const bodyStmts = convertBodyStatements(stmtsOf(node.body), diagnostics);
  const updateStmts = node.update ? convertExpressionAsStatement(node.update, diagnostics) : [];

  return [...initStmts, { type: "WhileStatement", condition, body: [...bodyStmts, ...updateStmts] }];
}

function convertDoWhile(node: t.DoWhileStatement, diagnostics: DiagnosticBag): FlingStmt[] {
  diagnostics.info(
    "`do...while` has no Fling equivalent, so it is simulated by duplicating the loop body: once unconditionally, then again inside a `while`.",
    locOf(node)
  );
  const first = convertBodyStatements(stmtsOf(node.body), diagnostics);
  const again = convertBodyStatements(stmtsOf(node.body), diagnostics);
  const condition = convertExpr(unwrapTS(node.test), diagnostics);
  return [...first, { type: "WhileStatement", condition, body: again }];
}

function convertExpressionAsStatement(exprIn: t.Expression, diagnostics: DiagnosticBag): FlingStmt[] {
  const expr = unwrapTS(exprIn);

  if (t.isConditionalExpression(expr)) {
    return lowerConditionalToIf(expr, (leaf) => convertExpressionAsStatement(leaf, diagnostics), diagnostics);
  }

  if (t.isSequenceExpression(expr)) {
    throw new UnsupportedError("The comma operator (`a, b, c`) is not supported.", { loc: locOf(expr) });
  }

  if (t.isUpdateExpression(expr)) {
    if (!t.isIdentifier(expr.argument)) {
      throw new UnsupportedError("`++`/`--` is only supported on a plain variable.", { loc: locOf(expr) });
    }
    const target: Identifier = { type: "Identifier", symbol: expr.argument.name };
    const op: BinaryOp = expr.operator === "++" ? "+" : "-";
    const value: FlingExpr = {
      type: "BinaryExpr",
      operator: op,
      left: target,
      right: { type: "NumericLiteral", value: 1 },
    };
    return [{ type: "ExpressionStatement", expression: { type: "AssignmentExpr", target, value } }];
  }

  if (t.isAssignmentExpression(expr) && expr.operator === "=") {
    if (t.isObjectPattern(expr.left) || t.isArrayPattern(expr.left)) {
      throw new UnsupportedError("Destructuring assignment is not supported.", { loc: locOf(expr) });
    }
    if (!t.isIdentifier(expr.left)) {
      throw new UnsupportedError(
        "Assignment to anything other than a plain variable (e.g. `obj.x = ...`, `arr[0] = ...`) is not supported: it's syntactically accepted by the reference parser but causes undefined behavior at runtime (spec §6.4, bug B6).",
        { loc: locOf(expr), ref: "B6" }
      );
    }
    const name = expr.left.name;
    const rhs = unwrapTS(expr.right);
    if (t.isConditionalExpression(rhs)) {
      return lowerConditionalToIf(rhs, (leaf) => [assignStmt(name, convertExpr(leaf, diagnostics))], diagnostics);
    }
    return [assignStmt(name, convertExpr(rhs, diagnostics))];
  }

  return [{ type: "ExpressionStatement", expression: convertExpr(expr, diagnostics) }];
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

function convertExpr(exprIn: t.Expression, diagnostics: DiagnosticBag): FlingExpr {
  const expr = unwrapTS(exprIn);
  switch (expr.type) {
    case "Identifier":
      return convertIdentifier(expr, diagnostics);
    case "NumericLiteral":
      return convertNumeric(expr);
    case "StringLiteral":
      return stringLiteralIR(expr.value, expr);
    case "TemplateLiteral":
      return convertTemplateAsString(expr);
    case "BooleanLiteral":
      return { type: "Identifier", symbol: expr.value ? "true" : "false" };
    case "NullLiteral":
      return { type: "Identifier", symbol: "null" };
    case "ArrayExpression":
      return convertArray(expr, diagnostics);
    case "ObjectExpression":
      return convertObject(expr, diagnostics);
    case "BinaryExpression":
      return convertBinary(expr, diagnostics);
    case "LogicalExpression":
      return convertLogical(expr, diagnostics);
    case "UnaryExpression":
      return convertUnary(expr, diagnostics);
    case "AssignmentExpression":
      return convertAssignment(expr, diagnostics);
    case "UpdateExpression":
      return convertUpdateAsExpr(expr);
    case "CallExpression":
      return convertCall(expr, diagnostics);
    case "MemberExpression":
      return convertMember(expr, diagnostics);
    case "ConditionalExpression":
      throw new UnsupportedError(
        "Ternary `?:` expressions are only supported directly in a `let`/`const` initializer, a plain `x = ...` assignment, or as a whole statement (this compiler lowers those three positions to `if`/`else` automatically). Assign it to a variable first.",
        { loc: locOf(expr) }
      );
    default:
      throw new UnsupportedError(
        `Unsupported expression: ${expr.type} -- this JS/TS construct has no Fling equivalent.`,
        { loc: locOf(expr) }
      );
  }
}

function convertIdentifier(node: t.Identifier, _diagnostics: DiagnosticBag): FlingExpr {
  if (node.name === "undefined") {
    throw new UnsupportedError("`undefined` does not exist in Fling -- use `null` instead.", { loc: locOf(node) });
  }
  if (node.name === "NaN" || node.name === "Infinity") {
    throw new UnsupportedError(`\`${node.name}\` does not exist in Fling.`, { loc: locOf(node) });
  }
  return { type: "Identifier", symbol: node.name };
}

function convertNumeric(node: t.NumericLiteral): FlingExpr {
  if (!Number.isInteger(node.value) || node.value < 0) {
    throw new UnsupportedError(
      `Numeric literal \`${(node.extra?.raw as string) ?? node.value}\` cannot be represented: the Fling lexer only tokenizes plain integer digit sequences, with no decimal-point support at all (spec §2.5, bug B2).`,
      { loc: locOf(node), ref: "B2" }
    );
  }
  return { type: "NumericLiteral", value: node.value };
}

function convertTemplateAsString(node: t.TemplateLiteral): FlingExpr {
  if (node.expressions.length > 0) {
    throw new UnsupportedError(
      "A template literal with `${...}` interpolation can't be represented as a single Fling string (Fling has no string concatenation or interpolation, spec §10). This IS supported directly as an argument to `print`/`console.log`, where it's automatically split into multiple print arguments instead.",
      { loc: locOf(node) }
    );
  }
  return stringLiteralIR(node.quasis[0].value.cooked ?? "", node);
}

function convertArray(node: t.ArrayExpression, diagnostics: DiagnosticBag): FlingExpr {
  const elements: FlingExpr[] = [];
  for (const el of node.elements) {
    if (el === null) {
      throw new UnsupportedError("Sparse array elements (holes, e.g. `[1, , 3]`) are not supported.", {
        loc: locOf(node),
      });
    }
    if (t.isSpreadElement(el)) {
      throw new UnsupportedError("Spread syntax (`...arr`) is not supported -- Fling has no spread/rest (spec §10).", {
        loc: locOf(el),
      });
    }
    elements.push(convertExpr(el, diagnostics));
  }
  return { type: "ArrayLiteral", elements };
}

function convertObject(node: t.ObjectExpression, diagnostics: DiagnosticBag): FlingExpr {
  const properties: ObjectProperty[] = [];
  for (const prop of node.properties) {
    if (t.isSpreadElement(prop)) {
      throw new UnsupportedError("Object spread (`...obj`) is not supported.", { loc: locOf(prop) });
    }
    if (!t.isObjectProperty(prop)) {
      throw new UnsupportedError(
        "Object methods (`{ foo() {...} }`) are not supported -- Fling object literals only hold plain key/value data, no functions attached as methods (spec §5).",
        { loc: locOf(prop) }
      );
    }
    if (prop.computed) {
      throw new UnsupportedError(
        "Computed object keys (`{ [expr]: value }`) are not supported -- Fling object keys must be plain identifiers (spec §5).",
        { loc: locOf(prop) }
      );
    }
    let key: string;
    if (t.isIdentifier(prop.key)) {
      key = prop.key.name;
    } else if (t.isStringLiteral(prop.key) && /^[A-Za-z][A-Za-z0-9]*$/.test(prop.key.value)) {
      key = prop.key.value;
    } else {
      throw new UnsupportedError(
        "Object keys must be plain identifiers in Fling -- no string keys (unless they happen to already look like a bare identifier) and no numeric keys (spec §5).",
        { loc: locOf(prop) }
      );
    }
    if (prop.shorthand) {
      properties.push({ key, value: null });
    } else if (t.isExpression(prop.value)) {
      properties.push({ key, value: convertExpr(prop.value, diagnostics) });
    } else {
      throw new UnsupportedError("Unsupported object property value.", { loc: locOf(prop) });
    }
  }
  return { type: "ObjectLiteral", properties };
}

const BINARY_OP_MAP: Record<string, BinaryOp | undefined> = {
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "%": "%",
  "==": "==",
  "===": "==",
  "!=": "!=",
  "!==": "!=",
  "<": "<",
  ">": ">",
  "<=": "<=",
  ">=": ">=",
};

function convertBinary(node: t.BinaryExpression, diagnostics: DiagnosticBag): FlingExpr {
  const mapped = BINARY_OP_MAP[node.operator];
  if (!mapped) {
    throw new UnsupportedError(
      `Operator \`${node.operator}\` has no Fling equivalent -- Fling only has + - * / % == != < > <= >= (spec §2.6, §3.4). Bitwise, \`**\`, \`in\`, and \`instanceof\` are all unsupported.`,
      { loc: locOf(node) }
    );
  }
  if (node.operator === "==" || node.operator === "!=") {
    diagnostics.warn(
      `JS's loose \`${node.operator}\` performs type coercion; Fling's \`${mapped}\` is type-strict (a type mismatch is immediately false/true, spec §6.6) -- it behaves like JS's \`${
        node.operator === "==" ? "===" : "!=="
      }\`, not \`${node.operator}\`. Double-check the operand types line up.`,
      locOf(node)
    );
  }

  if (!t.isExpression(node.left) || !t.isExpression(node.right)) {
    throw new UnsupportedError("Unsupported binary operand.", { loc: locOf(node) });
  }

  if (mapped === "+" && (looksLikeString(node.left) || looksLikeString(node.right))) {
    // NOTE: per an updated reference interpreter, `+` on String+String now
    // concatenates (the original spec's bug B3 -- "always Null" -- has been
    // patched). We no longer reject this. Mixed Number+String is NOT
    // confirmed to work, though, so flag it distinctly from the now-fine
    // String+String case.
    const bothLookLikeStrings = looksLikeString(node.left) && looksLikeString(node.right);
    if (!bothLookLikeStrings) {
      diagnostics.warn(
        "`+` with one side a string and the other apparently not: string+string concatenation is supported (patched B3), but mixed Number+String has not been confirmed to concatenate/coerce -- verify both operands are actually strings at runtime, or this may still silently produce `Null`.",
        locOf(node),
        "B3"
      );
    }
  }

  let left = convertExpr(node.left, diagnostics);
  let right = convertExpr(node.right, diagnostics);

  if (mapped === "%") {
    diagnostics.info(
      "`%` operands are swapped in the generated Fling code to counteract a reference-interpreter bug where `a % b` actually evaluates `b % a` (spec §6.6, bug B1).",
      locOf(node),
      "B1"
    );
    [left, right] = [right, left];
  }

  return { type: "BinaryExpr", operator: mapped, left, right };
}

function convertLogical(node: t.LogicalExpression, diagnostics: DiagnosticBag): FlingExpr {
  if (node.operator === "??") {
    throw new UnsupportedError("Nullish coalescing (`??`) is not supported.", { loc: locOf(node) });
  }
  diagnostics.warn(
    "Fling's `&&`/`||` do not short-circuit -- both sides are always evaluated regardless of the left side's value (spec §6.6, bug B7). If either side has a side effect, it will always run.",
    locOf(node),
    "B7"
  );
  const left = convertExpr(node.left, diagnostics);
  const right = convertExpr(node.right, diagnostics);
  return { type: "BinaryExpr", operator: node.operator as "&&" | "||", left, right };
}

function convertUnary(node: t.UnaryExpression, diagnostics: DiagnosticBag): FlingExpr {
  if (!t.isExpression(node.argument)) {
    throw new UnsupportedError("Unsupported unary operand.", { loc: locOf(node) });
  }
  if (node.operator === "!") {
    return { type: "UnaryExpr", operator: "!", operand: convertExpr(node.argument, diagnostics) };
  }
  if (node.operator === "-") {
    return { type: "UnaryExpr", operator: "-", operand: convertExpr(node.argument, diagnostics) };
  }
  throw new UnsupportedError(
    `Unary operator \`${node.operator}\` is not supported -- Fling only has unary \`!\` and \`-\` (spec §2.6).`,
    { loc: locOf(node) }
  );
}

const COMPOUND_OP_MAP: Record<string, BinaryOp | undefined> = {
  "+=": "+",
  "-=": "-",
  "*=": "*",
  "/=": "/",
  "%=": "%",
};

function convertAssignment(node: t.AssignmentExpression, diagnostics: DiagnosticBag): FlingExpr {
  if (t.isObjectPattern(node.left) || t.isArrayPattern(node.left)) {
    throw new UnsupportedError("Destructuring assignment is not supported.", { loc: locOf(node) });
  }
  if (!t.isIdentifier(node.left)) {
    throw new UnsupportedError(
      "Assignment to anything other than a plain variable (e.g. `obj.x = ...`, `arr[0] = ...`) is not supported: it's syntactically accepted by the reference parser but causes undefined behavior at runtime (spec §6.4, bug B6).",
      { loc: locOf(node), ref: "B6" }
    );
  }
  const target: Identifier = { type: "Identifier", symbol: node.left.name };
  const rhs = unwrapTS(node.right);

  if (node.operator === "=") {
    if (t.isConditionalExpression(rhs)) {
      throw new UnsupportedError(
        "A ternary on the right-hand side is only supported when the assignment is its own statement (e.g. `x = cond ? a : b;`), not nested inside a larger expression.",
        { loc: locOf(node) }
      );
    }
    return { type: "AssignmentExpr", target, value: convertExpr(rhs, diagnostics) };
  }

  const mapped = COMPOUND_OP_MAP[node.operator];
  if (!mapped) {
    throw new UnsupportedError(
      `Compound assignment \`${node.operator}\` is not supported -- Fling has no logical-assignment or bitwise-assignment operators.`,
      { loc: locOf(node) }
    );
  }
  if (mapped === "+" && looksLikeString(rhs)) {
    diagnostics.warn(
      "`+=` with a string right-hand side: String+String concatenation is supported (patched B3), but this compiler can't confirm the left-hand variable is also a string -- verify it at runtime, or this may still silently produce `Null`.",
      locOf(node),
      "B3"
    );
  }
  let left: FlingExpr = target;
  let right = convertExpr(rhs, diagnostics);
  if (mapped === "%") {
    diagnostics.info(
      "`%` operands swapped to counteract reference-interpreter bug B1 (`a % b` actually computes `b % a`).",
      locOf(node),
      "B1"
    );
    [left, right] = [right, left];
  }
  return { type: "AssignmentExpr", target, value: { type: "BinaryExpr", operator: mapped, left, right } };
}

function convertUpdateAsExpr(node: t.UpdateExpression): FlingExpr {
  if (!t.isIdentifier(node.argument)) {
    throw new UnsupportedError("`++`/`--` is only supported on a plain variable.", { loc: locOf(node) });
  }
  if (!node.prefix) {
    throw new UnsupportedError(
      "Postfix `x++`/`x--` used as a *value* is not supported: Fling's assignment expression evaluates to the new value, which only matches the prefix form (`++x`/`--x`). Split this into its own statement, or use the prefix form if the old value isn't needed.",
      { loc: locOf(node) }
    );
  }
  const target: Identifier = { type: "Identifier", symbol: node.argument.name };
  const op: BinaryOp = node.operator === "++" ? "+" : "-";
  const value: FlingExpr = {
    type: "BinaryExpr",
    operator: op,
    left: target,
    right: { type: "NumericLiteral", value: 1 },
  };
  return { type: "AssignmentExpr", target, value };
}

const CONSOLE_METHODS = new Set(["log", "info", "warn", "error", "debug"]);

function convertCall(node: t.CallExpression, diagnostics: DiagnosticBag): FlingExpr {
  if (node.optional) {
    throw new UnsupportedError("Optional call (`fn?.()`) is not supported.", { loc: locOf(node) });
  }
  if (!t.isExpression(node.callee)) {
    throw new UnsupportedError("Unsupported call target (e.g. `super(...)`).", { loc: locOf(node) });
  }
  const callee = unwrapTS(node.callee);

  const isConsoleCall =
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.object) &&
    callee.object.name === "console" &&
    t.isIdentifier(callee.property) &&
    CONSOLE_METHODS.has(callee.property.name);
  const isPrintCall = t.isIdentifier(callee) && callee.name === "print";

  if (isConsoleCall || isPrintCall) {
    return { type: "CallExpr", callee: { type: "Identifier", symbol: "print" }, args: expandPrintArgs(node.arguments, diagnostics) };
  }

  if (t.isCallExpression(callee)) {
    throw new UnsupportedError(
      "Chained calls (`foo()()`) work in Fling, but this looks like a call on the *result* of a call, i.e. `something()(...)` where the callee itself needs evaluating as a call target that isn't a simple curried call -- double-check this against spec §3.5 (bug B13); member/index access after a call is definitely unsupported.",
      { loc: locOf(node) }
    );
  }

  const calleeExpr = convertExpr(callee, diagnostics);
  const args: FlingExpr[] = [];
  for (const a of node.arguments) {
    if (t.isSpreadElement(a)) {
      throw new UnsupportedError("Spread arguments (`...args`) are not supported.", { loc: locOf(a) });
    }
    if (!t.isExpression(a)) {
      throw new UnsupportedError("Unsupported call argument.", { loc: locOf(a) });
    }
    const ua = unwrapTS(a);
    if (t.isTemplateLiteral(ua) && ua.expressions.length > 0) {
      throw new UnsupportedError(
        "A template literal with `${...}` can only be auto-expanded as a direct `print`/`console.log` argument; elsewhere it can't be represented (no string concatenation in Fling).",
        { loc: locOf(ua) }
      );
    }
    if (t.isConditionalExpression(ua)) {
      throw new UnsupportedError(
        "A ternary can't be used directly as a function-call argument (Fling has no ternary) -- assign it to a variable first.",
        { loc: locOf(ua) }
      );
    }
    args.push(convertExpr(ua, diagnostics));
  }
  return { type: "CallExpr", callee: calleeExpr, args };
}

type TemplatePart = { kind: "str"; value: string } | { kind: "expr"; expr: t.Expression };

function interleaveTemplate(node: t.TemplateLiteral): TemplatePart[] {
  const parts: TemplatePart[] = [];
  node.quasis.forEach((q: t.TemplateElement, i: number) => {
    parts.push({ kind: "str", value: q.value.cooked ?? "" });
    if (i < node.expressions.length) {
      const e = node.expressions[i];
      if (!t.isExpression(e)) {
        throw new UnsupportedError("Unsupported template literal interpolation.", { loc: locOf(node) });
      }
      parts.push({ kind: "expr", expr: e });
    }
  });
  return parts;
}

function expandPrintArgs(
  rawArgs: (t.Expression | t.SpreadElement | t.ArgumentPlaceholder)[],
  diagnostics: DiagnosticBag
): FlingExpr[] {
  const out: FlingExpr[] = [];
  for (const a of rawArgs) {
    if (t.isSpreadElement(a)) {
      throw new UnsupportedError("Spread arguments to `print` are not supported.", { loc: locOf(a) });
    }
    if (!t.isExpression(a)) continue;
    const ua = unwrapTS(a);
    if (t.isTemplateLiteral(ua)) {
      for (const part of interleaveTemplate(ua)) {
        if (part.kind === "str") {
          if (part.value !== "") out.push(stringLiteralIR(part.value, ua));
        } else {
          out.push(convertExpr(part.expr, diagnostics));
        }
      }
    } else if (t.isConditionalExpression(ua)) {
      throw new UnsupportedError(
        "A ternary can't be used directly as a `print` argument (Fling has no ternary) -- assign it to a variable first.",
        { loc: locOf(ua) }
      );
    } else {
      out.push(convertExpr(ua, diagnostics));
    }
  }
  return out;
}

function convertMember(node: t.MemberExpression, diagnostics: DiagnosticBag): FlingExpr {
  if (node.optional) {
    throw new UnsupportedError("Optional chaining (`?.`) is not supported.", { loc: locOf(node) });
  }
  if (t.isSuper(node.object)) {
    throw new UnsupportedError("`super` is not supported (no classes/inheritance in Fling).", { loc: locOf(node) });
  }
  const objRaw = unwrapTS(node.object);
  if (t.isCallExpression(objRaw)) {
    throw new UnsupportedError(
      "Member access after a function call (e.g. `foo().bar`, `foo()[0]`) is not supported by the reference parser (spec §3.5, bug B13). Store the call's result in a variable first, then access the member on that.",
      { loc: locOf(node), ref: "B13" }
    );
  }
  const object = convertExpr(objRaw, diagnostics);

  if (node.computed) {
    diagnostics.warn(
      "Computed member access (`x[y]`) only behaves correctly in the reference interpreter when `x` is an Array with a numeric index -- on Objects the key lookup is broken (bug B4) and on Strings it's undefined behavior (bug B5). Make sure `x` here is an array.",
      locOf(node)
    );
    if (!t.isExpression(node.property)) {
      throw new UnsupportedError("Unsupported computed member property.", { loc: locOf(node) });
    }
    const property = convertExpr(unwrapTS(node.property), diagnostics);
    return { type: "MemberExpr", object, computed: true, property };
  }

  if (!t.isIdentifier(node.property)) {
    throw new UnsupportedError("Unsupported member property.", { loc: locOf(node) });
  }
  const property: Identifier = { type: "Identifier", symbol: node.property.name };
  return { type: "MemberExpr", object, computed: false, property };
}
