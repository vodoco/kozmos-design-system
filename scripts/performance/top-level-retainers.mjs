// What, at a module's top level in the built ES files, would make an app's
// bundler keep a component nobody imports (decision 128): a `….displayName =`
// assignment that is not gated on `process.env.NODE_ENV`, or a call that makes
// a part (React's forwardRef, memo or createContext, cva) without a pure mark.
// Either keeps every part of the module once anything from it is imported. A
// name gated on `process.env.NODE_ENV !== "production"` is fine: an app's
// production build replaces the variable and drops the statement before it
// tree-shakes.
import fs from "node:fs";
import path from "node:path";

const REACT_FACTORIES = new Set(["forwardRef", "memo", "createContext"]);

/**
 * @param {string} esmDir dist/esm
 * @param {(code: string) => any} parse an ESTree parser (Rollup's parseAst)
 * @returns {string[]} one line per retainer: module, then what it is
 */
export function topLevelRetainers(esmDir, parse) {
  const found = [];
  const files = fs
    .readdirSync(esmDir, { recursive: true })
    .filter((file) => file.endsWith(".mjs"));
  for (const file of files) {
    const code = fs.readFileSync(path.join(esmDir, file), "utf8");
    const program = parse(code);
    const reactNamespaces = new Set();
    const factories = new Set();
    for (const statement of program.body) {
      if (statement.type !== "ImportDeclaration") continue;
      for (const specifier of statement.specifiers) {
        const imported =
          specifier.type === "ImportSpecifier"
            ? (specifier.imported.name ?? specifier.imported.value)
            : null;
        if (statement.source.value === "react") {
          if (imported === null) reactNamespaces.add(specifier.local.name);
          else if (REACT_FACTORIES.has(imported))
            factories.add(specifier.local.name);
        } else if (
          statement.source.value === "class-variance-authority" &&
          imported === "cva"
        )
          factories.add(specifier.local.name);
      }
    }
    const makes = (node) =>
      node.type === "CallExpression" &&
      ((node.callee.type === "Identifier" && factories.has(node.callee.name)) ||
        (node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.object.type === "Identifier" &&
          reactNamespaces.has(node.callee.object.name) &&
          REACT_FACTORIES.has(node.callee.property.name)));
    const pure = (node) =>
      /\/\*\s*[#@]__PURE__\s*\*\/\s*$/.test(
        code.slice(Math.max(0, node.start - 24), node.start),
      );
    const gated = (statement) => {
      const test =
        statement.type === "IfStatement"
          ? statement.test
          : statement.type === "ExpressionStatement" &&
              statement.expression.type === "LogicalExpression" &&
              statement.expression.operator === "&&"
            ? statement.expression.left
            : null;
      return (
        test !== null &&
        /process\.env\.NODE_ENV\s*!==?\s*["']production["']/.test(
          code.slice(test.start, test.end),
        )
      );
    };
    for (const statement of program.body) {
      let names = false;
      walk(statement, (node) => {
        if (
          node.type === "AssignmentExpression" &&
          node.left.type === "MemberExpression" &&
          !node.left.computed &&
          node.left.property.name === "displayName"
        )
          names = true;
      });
      if (names && !gated(statement))
        found.push(
          `${file}: ${code.slice(statement.start, statement.end).slice(0, 80)}`,
        );
      walk(statement, (node) => {
        if (makes(node) && !pure(node))
          found.push(
            `${file}: an unmarked ${code.slice(node.callee.start, node.callee.end)}(…)`,
          );
      });
    }
  }
  return found;
}

// The module's own top-level code; a function's body runs later, if ever.
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
