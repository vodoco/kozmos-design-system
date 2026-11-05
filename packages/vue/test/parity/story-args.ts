import fs from "node:fs";
import ts from "typescript";

export type StoryValue =
  | string
  | number
  | boolean
  | null
  | StoryValue[]
  | { [key: string]: StoryValue };
export type StoryArgs = Record<string, StoryValue>;
export interface StoryCase {
  /** The story's export name. */
  name: string;
  /** The meta's literal args, then the story's own. */
  args: StoryArgs;
  /**
   * Args the reader could not read as values: JSX, identifiers, computed
   * values, a spread of something other than a story's args. A story with
   * any is not drawn from its args (it would draw less than the story); it
   * is named in `ports.ts` with the spec that draws it. Handlers (`fn()`,
   * arrow and function expressions) draw nothing and are left out freely.
   */
  unread: string[];
}

const NOT_READ = Symbol("not read");

/** A literal value, an array or object of them, or NOT_READ. */
function literal(node: ts.Expression): StoryValue | typeof NOT_READ {
  if (ts.isParenthesizedExpression(node)) return literal(node.expression);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node))
    return literal(node.expression);
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
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((element) =>
      ts.isSpreadElement(element) ? NOT_READ : literal(element),
    );
    return items.includes(NOT_READ) ? NOT_READ : (items as StoryValue[]);
  }
  if (ts.isObjectLiteralExpression(node)) {
    const object: Record<string, StoryValue> = {};
    for (const property of node.properties) {
      const key = keyOf(property);
      if (!ts.isPropertyAssignment(property) || key === undefined)
        return NOT_READ;
      const value = literal(property.initializer);
      if (value === NOT_READ) return NOT_READ;
      object[key] = value;
    }
    return object;
  }
  return NOT_READ;
}

function keyOf(property: ts.ObjectLiteralElementLike): string | undefined {
  const name = property.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name))
    ? name.text
    : undefined;
}

/** A handler: it draws nothing, so leaving it out changes no render. */
const isHandler = (node: ts.Expression) =>
  ts.isArrowFunction(node) ||
  ts.isFunctionExpression(node) ||
  (ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "fn");

/**
 * An `args` object: its readable values, and the keys it could not read.
 * `...Other.args` takes another story's args, already read.
 */
function readArgs(
  node: ts.Expression | undefined,
  storyArgs: Map<string, { args: StoryArgs; unread: string[] }>,
): { args: StoryArgs; unread: string[] } {
  const args: StoryArgs = {};
  const unread: string[] = [];
  if (!node) return { args, unread };
  if (!ts.isObjectLiteralExpression(node)) return { args, unread: ["args"] };
  for (const property of node.properties) {
    if (ts.isSpreadAssignment(property)) {
      const spread = property.expression;
      const from =
        ts.isPropertyAccessExpression(spread) &&
        spread.name.text === "args" &&
        ts.isIdentifier(spread.expression)
          ? storyArgs.get(spread.expression.text)
          : undefined;
      if (from) {
        Object.assign(args, from.args);
        unread.push(...from.unread);
      } else unread.push(`...${spread.getText()}`);
      continue;
    }
    const key = keyOf(property);
    if (key === undefined) {
      unread.push(property.getText());
      continue;
    }
    if (!ts.isPropertyAssignment(property)) {
      unread.push(key); // a shorthand or a method
      continue;
    }
    if (isHandler(property.initializer)) continue;
    const value = literal(property.initializer);
    if (value === NOT_READ) unread.push(key);
    else args[key] = value;
  }
  return { args, unread };
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
 * with no `render`. Read from the source, so the cases are the stories' own
 * and never a copy. A story with its own `render` is returned in `rendered`,
 * for the caller to cover another way.
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
  const read = new Map<string, { args: StoryArgs; unread: string[] }>();
  let meta: { args: StoryArgs; unread: string[] } = { args: {}, unread: [] };
  const stories: StoryCase[] = [];
  const rendered: string[] = [];
  const unwrap = (node: ts.Expression): ts.Expression =>
    ts.isSatisfiesExpression(node) || ts.isAsExpression(node)
      ? unwrap(node.expression)
      : node;
  for (const statement of source.statements) {
    // `export default { … }`: the meta written in place.
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const value = unwrap(statement.expression);
      if (ts.isObjectLiteralExpression(value))
        meta = readArgs(property(value, "args"), read);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer || !ts.isIdentifier(declaration.name))
        continue;
      const value = unwrap(declaration.initializer);
      if (!ts.isObjectLiteralExpression(value)) continue;
      const name = declaration.name.text;
      const exported = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
      const own = readArgs(property(value, "args"), read);
      read.set(name, own);
      if (name === "meta" && !exported) {
        meta = own;
        continue;
      }
      if (!exported) continue;
      if (property(value, "render")) rendered.push(name);
      else
        stories.push({
          name,
          args: { ...meta.args, ...own.args },
          // The meta's unread keys count only where the story does not
          // set them itself.
          unread: [
            ...new Set([
              ...meta.unread.filter((key) => !(key in own.args)),
              ...own.unread,
            ]),
          ],
        });
    }
  }
  return { stories, rendered };
}
