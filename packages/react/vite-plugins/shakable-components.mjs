/**
 * Component names in development only, and components an app's bundler can
 * leave out when the app does not use them (decision 128: D2 and D3).
 *
 * Each part is written `const X = React.forwardRef(…)`, followed by a
 * top-level `X.displayName = "X"`. A bundler has to keep that assignment, since
 * it sets a property on an object it cannot see into, and with it X. So an app
 * that took one export of a module paid for every component in it: importing
 * `DEFAULT_PANEL_DETENTS`, a constant, cost the whole map shell (8 KB), and
 * `DialogTrigger` the whole Dialog.
 *
 * After esbuild has compiled a module (`enforce: "post"`), this:
 *
 * - gates every `….displayName = …` statement on
 *   `process.env.NODE_ENV !== "production"`. The library's build leaves
 *   `process.env.NODE_ENV` as it is (Vite does not replace it in a library);
 *   the app's bundler replaces it. In a production build the statement is
 *   dead, so the bundler drops it before tree-shaking and, with it, any part
 *   nothing else uses; in development every part keeps its name, as before;
 * - marks pure the calls that only make something: React's `forwardRef`,
 *   `memo` and `createContext`, `cva`, and the factories named in
 *   `pureFactories` (`createThemePortal`), so a part nothing uses is free to
 *   go.
 *
 * The gate is written plainly, as React's own entry writes it: a guard such as
 * `typeof process !== "undefined" &&` would stay true or false at run time in
 * a browser, where there is no `process`, and so take every name away from
 * development builds as well.
 */

const REACT_FACTORIES = new Set(["forwardRef", "memo", "createContext"]);
const PURE = "/* @__PURE__ */ ";
export const DEVELOPMENT = 'process.env.NODE_ENV !== "production"';

/**
 * @typedef {{ pureFactories?: string[] }} RewriteOptions
 */

/**
 * @param {RewriteOptions & { include?: (id: string) => boolean }} [options]
 */
export function shakableComponents(options = {}) {
  const include = options.include ?? (() => true);
  return {
    name: "kozmos-shakable-components",
    enforce: "post",
    /** @param {string} code @param {string} id */
    transform(code, id) {
      if (!include(id)) return null;
      const result = rewriteModule(code, this.parse(code), options);
      return result.code === code ? null : { code: result.code, map: null };
    },
  };
}

/**
 * The rewrite itself, on code and its ESTree program (Rollup's `this.parse`
 * or `parseAst`), so a test can run it without a build.
 *
 * @param {string} code
 * @param {any} program
 * @param {RewriteOptions} [options]
 * @returns {{ code: string, gated: number, marked: number }}
 */
export function rewriteModule(code, program, options = {}) {
  const factories = new Set(options.pureFactories ?? []);
  const reactNamespaces = new Set();
  const pureCallees = new Set();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = statement.source.value;
    for (const specifier of statement.specifiers) {
      const name =
        specifier.type === "ImportSpecifier"
          ? (specifier.imported.name ?? specifier.imported.value)
          : null;
      if (source === "react") {
        if (name === null) reactNamespaces.add(specifier.local.name);
        else if (REACT_FACTORIES.has(name))
          pureCallees.add(specifier.local.name);
      } else if (source === "class-variance-authority" && name === "cva") {
        pureCallees.add(specifier.local.name);
      } else if (
        source.startsWith(".") &&
        name !== null &&
        factories.has(name)
      ) {
        pureCallees.add(specifier.local.name);
      }
    }
  }

  const isPureCall = (node) =>
    node?.type === "CallExpression" &&
    ((node.callee.type === "Identifier" && pureCallees.has(node.callee.name)) ||
      (node.callee.type === "MemberExpression" &&
        !node.callee.computed &&
        node.callee.object.type === "Identifier" &&
        reactNamespaces.has(node.callee.object.name) &&
        REACT_FACTORIES.has(node.callee.property.name)));
  const alreadyPure = (start) =>
    /\/\*\s*[#@]__PURE__\s*\*\/\s*$/.test(
      code.slice(Math.max(0, start - 24), start),
    );
  const namesAComponent = (node) =>
    node.type === "ExpressionStatement" &&
    node.expression.type === "AssignmentExpression" &&
    node.expression.operator === "=" &&
    node.expression.left.type === "MemberExpression" &&
    !node.expression.left.computed &&
    node.expression.left.property.name === "displayName";

  /** @type {[number, string][]} */
  const edits = [];
  let gated = 0;
  let marked = 0;

  // Every name, wherever it is set: at the top level, or in a function that
  // makes a part (createThemePortal).
  walk(program, (node, parent) => {
    if (!namesAComponent(node)) return;
    // Already gated, by hand or by an earlier run.
    if (
      parent?.type === "IfStatement" &&
      code
        .slice(parent.test.start, parent.test.end)
        .includes("process.env.NODE_ENV")
    )
      return;
    // Directly in a block, a plain `if`; anywhere else (the body of an `if`
    // with an `else`), braces, so no `else` can change hands.
    const inBlock =
      parent?.type === "Program" || parent?.type === "BlockStatement";
    edits.push([
      node.start,
      inBlock ? `if (${DEVELOPMENT}) ` : `{ if (${DEVELOPMENT}) `,
    ]);
    if (!inBlock) edits.push([node.end, " }"]);
    gated += 1;
  });

  // Mark the making calls of the module's own top-level code; what runs
  // later, inside functions, is left alone.
  for (const statement of program.body)
    walk(
      statement,
      (node) => {
        if (isPureCall(node) && !alreadyPure(node.start)) {
          edits.push([node.start, PURE]);
          marked += 1;
        }
      },
      (node) =>
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression",
    );

  let out = code;
  edits
    .sort((a, b) => b[0] - a[0])
    .forEach(([at, text]) => {
      out = out.slice(0, at) + text + out.slice(at);
    });
  return { code: out, gated, marked };
}

/** Every node under `node`; `skip` stops the descent below a node it matches. */
function walk(node, visit, skip, parent = null) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parent);
  if (skip?.(node)) return;
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value))
      value.forEach((child) => walk(child, visit, skip, node));
    else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    )
      walk(value, visit, skip, node);
  }
}
