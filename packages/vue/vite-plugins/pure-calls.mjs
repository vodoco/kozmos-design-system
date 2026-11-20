/**
 * Parts an app's bundler can leave out when the app does not use them, as
 * @kozmos-ds/react's vite-plugins/shakable-components.mjs does for React's
 * (decision 128), and for the same reason.
 *
 * The ES build is one file per module and package.json declares it free of
 * side effects, so a module nothing imports from is left out whole. A module
 * something does import from is kept, and with it every top-level call a
 * bundler cannot prove pure: Vue's `defineComponent`, `cva`,
 * `extendTailwindMerge` and `Symbol` are calls into code the bundler does
 * not read (Vue and the class helpers are the app's own, left external),
 * so it keeps them and all they make. KozmosButton reports to the analytics
 * provider through `useKozmosAnalytics`, from AnalyticsProvider's module,
 * and so kept KozmosAnalyticsProvider, which it never draws.
 *
 * After esbuild has compiled a module (`enforce: "post"`), this marks those
 * calls `/* @__PURE__ *\/` at the module's top level. Calls inside functions
 * run later, if ever, and are left alone.
 */

const PURE = "/* @__PURE__ */ ";

/**
 * The calls that only make something, by the module they are imported from;
 * `globals` are called without an import.
 */
export const PURE_CALLS = {
  imports: {
    vue: ["defineComponent"],
    "class-variance-authority": ["cva"],
    "tailwind-merge": ["extendTailwindMerge"],
  },
  globals: ["Symbol"],
};

/**
 * @param {{ include?: (id: string) => boolean }} [options]
 */
export function pureCalls(options = {}) {
  const include = options.include ?? (() => true);
  return {
    name: "kozmos-vue-pure-calls",
    enforce: "post",
    /** @param {string} code @param {string} id */
    transform(code, id) {
      if (!include(id)) return null;
      const result = markPureCalls(code, this.parse(code));
      return result.marked ? { code: result.code, map: null } : null;
    },
  };
}

/**
 * The rewrite itself, on code and its ESTree program (Rollup's `this.parse`
 * or `parseAst`), so a test can run it without a build.
 *
 * @param {string} code
 * @param {any} program
 * @returns {{ code: string, marked: number }}
 */
export function markPureCalls(code, program) {
  const callees = new Set();
  const shadowed = new Set();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const names = PURE_CALLS.imports[statement.source.value] ?? [];
    for (const specifier of statement.specifiers) {
      shadowed.add(specifier.local.name);
      if (specifier.type !== "ImportSpecifier") continue;
      const imported = specifier.imported.name ?? specifier.imported.value;
      if (names.includes(imported)) callees.add(specifier.local.name);
    }
  }
  for (const name of PURE_CALLS.globals)
    if (!shadowed.has(name)) callees.add(name);

  const alreadyPure = (start) =>
    /\/\*\s*[#@]__PURE__\s*\*\/\s*$/.test(
      code.slice(Math.max(0, start - 24), start),
    );
  /** @type {number[]} */
  const at = [];
  for (const statement of program.body)
    walk(statement, (node) => {
      if (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        callees.has(node.callee.name) &&
        !alreadyPure(node.start)
      )
        at.push(node.start);
    });

  let out = code;
  at.sort((a, b) => b - a).forEach((start) => {
    out = out.slice(0, start) + PURE + out.slice(start);
  });
  return { code: out, marked: at.length };
}

/** The module's own top-level code; a function's body runs later, if ever. */
function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  if (/Function/.test(node.type)) return;
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    )
      walk(value, visit);
  }
}
