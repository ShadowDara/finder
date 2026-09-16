// A small, purpose-built AST for the *output* language (Fling). Kept
// separate from Babel's AST so the emitter only ever has to deal with
// constructs Fling can actually express -- anything that can't be
// represented is rejected during the transform step (see astTransforms.ts /
// toFlingIR.ts) rather than smuggled through as an approximation.

export type FlingStmt =
  | VarDeclaration
  | FunctionDeclaration
  | IfStatement
  | WhileStatement
  | ExpressionStatement;

export type FlingExpr =
  | Identifier
  | NumericLiteral
  | StringLiteral
  | ArrayLiteral
  | ObjectLiteral
  | BinaryExpr
  | UnaryExpr
  | AssignmentExpr
  | CallExpr
  | MemberExpr;

export interface Program {
  type: "Program";
  body: FlingStmt[];
}

export interface VarDeclaration {
  type: "VarDeclaration";
  constant: boolean;
  identifier: string;
  value: FlingExpr | null;
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  parameters: string[];
  body: FlingStmt[];
}

export interface IfStatement {
  type: "IfStatement";
  condition: FlingExpr;
  thenBranch: FlingStmt[];
  /** Fling has no `else if` -- a JS else-if chain is represented as a
   * single nested IfStatement inside this array (§3.3 / B: "else if"). */
  elseBranch: FlingStmt[] | null;
}

export interface WhileStatement {
  type: "WhileStatement";
  condition: FlingExpr;
  body: FlingStmt[];
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: FlingExpr;
}

export interface Identifier {
  type: "Identifier";
  symbol: string;
}

export interface NumericLiteral {
  type: "NumericLiteral";
  value: number; // must be a non-negative integer -- see astTransforms/toFlingIR
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string; // must not require escaping -- see toFlingIR
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: FlingExpr[];
}

export interface ObjectProperty {
  key: string;
  value: FlingExpr | null; // null => shorthand `{ key }`
}

export interface ObjectLiteral {
  type: "ObjectLiteral";
  properties: ObjectProperty[];
}

export type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "&&"
  | "||";

export interface BinaryExpr {
  type: "BinaryExpr";
  operator: BinaryOp;
  left: FlingExpr;
  right: FlingExpr;
}

export interface UnaryExpr {
  type: "UnaryExpr";
  operator: "!" | "-";
  operand: FlingExpr;
}

export interface AssignmentExpr {
  type: "AssignmentExpr";
  /** Fling only supports plain identifiers as assignment targets (§6.4 / B6) */
  target: Identifier;
  value: FlingExpr;
}

export interface CallExpr {
  type: "CallExpr";
  callee: FlingExpr;
  args: FlingExpr[];
}

export interface MemberExpr {
  type: "MemberExpr";
  object: FlingExpr;
  computed: boolean;
  /** Identifier when !computed, arbitrary expr when computed */
  property: FlingExpr;
}
