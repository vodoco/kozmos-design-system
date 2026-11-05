import fs from "node:fs";
import ts from "typescript";

export type StoryArgs = Record<string, string | number | boolean | null>;
export interface StoryCase {
  /** The story's export name. */
  name: string;
  /** The meta's literal args, then the story's own. */
  args: StoryArgs;
}

/** A literal value, or undefined for anything that is not one (a function, an identifier). */
function literal(
  node: ts.Expression,
): string | number | boolean | null | undefined {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);
  return undefined;
}

/** An object literal's literal properties; the rest (`onClick: fn()`) are left out. */
function literalArgs(node: ts.Expression | undefined): StoryArgs {
  const args: StoryArgs = {};
  if (!node || !ts.isObjectLiteralExpression(node)) return args;
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key =
      ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : undefined;
    const read = literal(property.initializer);
    if (key !== undefined && read !== undefined) args[key] = read;
  }
  return args;
}

const property = (object: ts.ObjectLiteralExpression, name: string) =>
  object.properties.find(
    (candidate): candidate is ts.PropertyAssignment =>
      ts.isPropertyAssignment(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === name,
  )?.initializer;

/**
 * Every story in a CSF file that is drawn from its args: an exported object
 * with `args` and no `render`. Read from the source, so the cases are the
 * stories' own and never a copy. A story with its own `render` is returned in
 * `rendered`, for the caller to cover another way.
 */
export function readStoryArgs(file: string): {
  stories: StoryCase[];
  rendered: string[];
} {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let metaArgs: StoryArgs = {};
  const stories: StoryCase[] = [];
  const rendered: string[] = [];
  const unwrap = (node: ts.Expression): ts.Expression =>
    ts.isSatisfiesExpression(node) || ts.isAsExpression(node)
      ? unwrap(node.expression)
      : node;
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!declaration.initializer || !ts.isIdentifier(declaration.name))
          continue;
        const value = unwrap(declaration.initializer);
        if (!ts.isObjectLiteralExpression(value)) continue;
        const name = declaration.name.text;
        const exported = statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        );
        if (name === "meta" && !exported) {
          metaArgs = literalArgs(property(value, "args"));
          continue;
        }
        if (!exported) continue;
        if (property(value, "render")) rendered.push(name);
        else stories.push({ name, args: literalArgs(property(value, "args")) });
      }
    }
  }
  return {
    stories: stories.map((story) => ({
      name: story.name,
      args: { ...metaArgs, ...story.args },
    })),
    rendered,
  };
}
