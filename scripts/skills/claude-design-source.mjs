/**
 * What the component source says that the published declarations cannot:
 * which component directory each export was declared in, and the defaults a
 * component gives its props in its parameter list.
 */
import fs from "node:fs";
import path from "node:path";
import { ts } from "./claude-design-typescript.mjs";

export const COMPONENTS = "packages/react/src/components";

/** The modules outside components/ that export something, by card name. */
const OTHER_MODULES = [
  "packages/react/src/context",
  "packages/react/src/theme",
  "packages/react/src/utils",
  "packages/react/src/hooks",
  "packages/react/src/utils.ts",
];

const isSourceFile = (file) =>
  /\.(ts|tsx)$/.test(file) &&
  !/\.(test|spec|stories|figma)\.[jt]sx?$/.test(file) &&
  !file.endsWith(".d.ts") &&
  !/(^|\/)index\.ts$/.test(file);

const parse = (file) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

const exported = (node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );

/**
 * The names a file declares and exports, in the order it declares them. A
 * re-export (`export … from`) is left to the file that declares the name, so
 * a type that one component passes along belongs to the component it is.
 */
export function declaredExports(source) {
  const names = [];
  const local = new Set();
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations)
        if (ts.isIdentifier(d.name)) {
          local.add(d.name.text);
          if (exported(statement)) names.push(d.name.text);
        }
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      local.add(statement.name.text);
      if (exported(statement)) names.push(statement.name.text);
    }
  }
  for (const statement of source.statements)
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        if (local.has((element.propertyName ?? element.name).text))
          names.push(element.name.text);
  return names;
}

/**
 * The names a file passes on from another module by name (`export { X } from
 * "../DatePicker/DatePicker"`). A component directory that does this is
 * saying the name is its own: DateRangePicker is declared beside DatePicker
 * and published from its own directory.
 */
export function reexportedNames(source) {
  const names = [];
  for (const statement of source.statements)
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        names.push(element.name.text);
  return names;
}

function filesIn(target) {
  if (!fs.existsSync(target)) return [];
  if (fs.statSync(target).isFile()) return isSourceFile(target) ? [target] : [];
  return fs
    .readdirSync(target)
    .map((f) => path.join(target, f))
    .filter((f) => fs.statSync(f).isFile() && isSourceFile(f))
    .sort();
}

/**
 * Every module that declares an export: one per component directory (its
 * `<Name>.tsx` first, then the rest of its files), and one per file of the
 * providers, hooks and utilities outside components/.
 */
export function readModules(root, componentNames) {
  const modules = [];
  for (const name of componentNames) {
    const dir = path.join(root, COMPONENTS, name);
    const main = path.join(dir, `${name}.tsx`);
    const files = filesIn(dir).sort((a, b) =>
      a === main ? -1 : b === main ? 1 : a.localeCompare(b),
    );
    const sources = files.map(parse);
    modules.push({
      name,
      kind: "component",
      dir,
      sources,
      names: sources.flatMap(declaredExports),
      reexports: sources.flatMap(reexportedNames),
    });
  }
  for (const target of OTHER_MODULES)
    for (const file of filesIn(path.join(root, target))) {
      const source = parse(file);
      modules.push({
        name: path.basename(file).replace(/\.tsx?$/, ""),
        kind: "module",
        dir: path.dirname(file),
        sources: [source],
        names: declaredExports(source),
        reexports: [],
      });
    }
  return modules;
}

/**
 * Which module each export belongs to. A directory that re-exports a name by
 * name publishes it as its own (DateRangePicker, declared beside DatePicker);
 * otherwise a name is its declaring module's. `declarer` is where it is
 * declared, which is still where its defaults are.
 */
export function exportOwners(modules, exportNames) {
  const owner = new Map();
  const declarer = new Map();
  for (const module of modules)
    for (const name of module.reexports)
      if (exportNames.has(name) && !owner.has(name)) owner.set(name, module);
  for (const module of modules)
    for (const name of module.names) {
      if (!exportNames.has(name)) continue;
      if (!declarer.has(name)) declarer.set(name, module);
      if (!owner.has(name)) owner.set(name, module);
    }
  const ownedBy = (module) =>
    [...new Set([...module.reexports, ...module.names])].filter(
      (name) => owner.get(name) === module,
    );
  return { owner, declarer, ownedBy };
}

/** The function a component is: `forwardRef((props, ref) => …)`, `function X(…)`. */
function implementationOf(sources, name) {
  for (const source of sources)
    for (const statement of source.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name?.text === name)
        return statement;
      if (!ts.isVariableStatement(statement)) continue;
      const declaration = statement.declarationList.declarations.find(
        (d) => ts.isIdentifier(d.name) && d.name.text === name,
      );
      if (!declaration?.initializer) continue;
      let found = null;
      const visit = (node) => {
        if (found) return;
        if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
          found = node;
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(declaration.initializer);
      return found;
    }
  return null;
}

const shortText = (node) => {
  const text = node.getText().replace(/\s+/g, " ").trim();
  return text.length <= 80 ? text : null;
};

/** `{ a = 1, b: renamed = "x" }` → a: 1, b: "x". */
function bindingDefaults(pattern, into) {
  for (const element of pattern.elements) {
    if (!element.initializer || element.dotDotDotToken) continue;
    const key = element.propertyName ?? element.name;
    if (!ts.isIdentifier(key) && !ts.isStringLiteral(key)) continue;
    const text = shortText(element.initializer);
    if (text) into.set(key.text, text);
  }
}

/** The `defaultVariants` of each `cva(…)` in a module, by the variable holding it. */
function cvaDefaults(sources) {
  const byName = new Map();
  for (const source of sources) {
    const visit = (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        node.initializer.expression.getText() === "cva"
      ) {
        const config = node.initializer.arguments[1];
        const defaults = new Map();
        const block =
          config &&
          ts.isObjectLiteralExpression(config) &&
          config.properties.find(
            (p) => p.name?.getText() === "defaultVariants",
          );
        if (block && ts.isObjectLiteralExpression(block.initializer))
          for (const p of block.initializer.properties)
            if (ts.isPropertyAssignment(p)) {
              const text = shortText(p.initializer);
              if (text)
                defaults.set(
                  p.name.getText().replace(/^["']|["']$/g, ""),
                  text,
                );
            }
        byName.set(node.name.text, defaults);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return byName;
}

/**
 * The defaults a component gives its props: those in its parameter list (or
 * in the first destructuring of its props), then the `defaultVariants` of the
 * cva recipes its props interface takes its variants from.
 */
export function defaultsOf(module, name, propsText) {
  const defaults = new Map();
  const implementation = implementationOf(module.sources, name);
  const first = implementation?.parameters[0];
  if (first && ts.isObjectBindingPattern(first.name))
    bindingDefaults(first.name, defaults);
  else if (
    first &&
    ts.isIdentifier(first.name) &&
    implementation.body &&
    ts.isBlock(implementation.body)
  )
    for (const statement of implementation.body.statements)
      if (ts.isVariableStatement(statement))
        for (const d of statement.declarationList.declarations)
          if (
            ts.isObjectBindingPattern(d.name) &&
            d.initializer?.getText() === first.name.text
          )
            bindingDefaults(d.name, defaults);
  if (propsText && /^\w+$/.test(propsText)) {
    const recipes = cvaDefaults(module.sources);
    for (const source of module.sources)
      for (const statement of source.statements)
        if (
          (ts.isInterfaceDeclaration(statement) ||
            ts.isTypeAliasDeclaration(statement)) &&
          statement.name.text === propsText
        )
          for (const match of statement
            .getText()
            .matchAll(/VariantProps<\s*typeof\s+(\w+)\s*>/g))
            for (const [key, value] of recipes.get(match[1]) ?? [])
              if (!defaults.has(key)) defaults.set(key, value);
  }
  return defaults;
}
