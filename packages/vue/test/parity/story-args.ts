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
const isHandler = (key: string, node: ts.Expression) =>
  /^on[A-Z]/.test(key) &&
  (ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "fn"));

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
    // An `on…` function is a handler, which draws nothing; any other function
    // (`tint`, `renderIcon`, `formatValue`) draws, and is not read.
    if (isHandler(key, property.initializer)) continue;
    const value = literal(property.initializer);
    if (value === NOT_READ) unread.push(key);
    else args[key] = value;
  }
  return { args, unread };
}

/**
 * A story's or the meta's property: its value, `true` for a method
 * (`render(args) { … }`), an identifier for a shorthand (`{ args }`), or
 * undefined when it has none.
 */
const property = (
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | true | undefined => {
  for (const candidate of object.properties) {
    if (!candidate.name || !ts.isIdentifier(candidate.name)) continue;
    if (candidate.name.text !== name) continue;
    if (ts.isPropertyAssignment(candidate)) return candidate.initializer;
    if (ts.isShorthandPropertyAssignment(candidate)) return candidate.name;
    if (ts.isMethodDeclaration(candidate)) return true;
  }
  return undefined;
};

/**
 * Every story in a CSF file: those drawn from their args, and the names of
 * those that are not. Read from the source, so the cases are the stories'
 * own and never a copy.
 *
 * A story is drawn from its args unless it, a story it spreads
 * (`{ ...Default, args }`), or the meta has a `render`; those are returned
 * in `rendered`, for the caller to cover another way. A story that is not
 * an object (`voiceStory("…")`, `Template.bind({})`) is returned with
 * `unread: ["story"]`, never dropped; one that names another story
 * (`export const Default = Detailed`) is that story.
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
  interface Read {
    args: StoryArgs;
    unread: string[];
    render: boolean;
  }
  const read = new Map<string, Read>();
  let meta: Read = { args: {}, unread: [], render: false };
  const stories: StoryCase[] = [];
  const rendered: string[] = [];
  const unwrap = (node: ts.Expression): ts.Expression =>
    ts.isSatisfiesExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isParenthesizedExpression(node)
      ? unwrap(node.expression)
      : node;
  /** A story or meta object: its args, and whether it, or one it spreads, renders. */
  const readStory = (value: ts.ObjectLiteralExpression): Read => {
    let base: Read = { args: {}, unread: [], render: false };
    for (const element of value.properties)
      if (ts.isSpreadAssignment(element)) {
        const from = ts.isIdentifier(element.expression)
          ? read.get(element.expression.text)
          : undefined;
        base = from
          ? {
              args: { ...base.args, ...from.args },
              unread: [...base.unread, ...from.unread],
              render: base.render || from.render,
            }
          : {
              ...base,
              unread: [...base.unread, `...${element.expression.getText()}`],
            };
      }
    const args = property(value, "args");
    // A shorthand (`{ args }`) names an object read elsewhere: not read here.
    const own =
      args === undefined
        ? { args: {} as StoryArgs, unread: [] as string[] }
        : args === true || ts.isIdentifier(args)
          ? { args: {} as StoryArgs, unread: ["args"] }
          : readArgs(args, read);
    return {
      // A story's own args replace the spread story's, key by key.
      args: { ...(args ? {} : base.args), ...own.args },
      unread: [...new Set([...(args ? [] : base.unread), ...own.unread])],
      render: base.render || !!property(value, "render"),
    };
  };
  for (const statement of source.statements) {
    // `export default { … }`: the meta written in place.
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const value = unwrap(statement.expression);
      if (ts.isObjectLiteralExpression(value)) meta = readStory(value);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer || !ts.isIdentifier(declaration.name))
        continue;
      const name = declaration.name.text;
      const value = unwrap(declaration.initializer);
      let story: Read;
      if (ts.isObjectLiteralExpression(value)) story = readStory(value);
      else if (ts.isIdentifier(value) && read.has(value.text))
        story = read.get(value.text)!;
      else if (!exported) continue;
      else story = { args: {}, unread: ["story"], render: false };
      read.set(name, story);
      if (name === "meta" && !exported) {
        meta = story;
        continue;
      }
      if (!exported) continue;
      if (story.render || meta.render) rendered.push(name);
      else
        stories.push({
          name,
          args: { ...meta.args, ...story.args },
          // The meta's unread keys count only where the story does not
          // set them itself.
          unread: [
            ...new Set([
              ...meta.unread.filter((key) => !(key in story.args)),
              ...story.unread,
            ]),
          ],
        });
    }
  }
  return { stories, rendered };
}
