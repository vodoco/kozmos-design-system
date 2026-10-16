/**
 * The static half of scripts/check-sdk-density.mjs: SDK parts keep the SDK's
 * touch geometry under any density (decision 89), so every component an SDK
 * directory exports returns a touch DensityScope root on every path, and a
 * part or a path the stories don't reach is held too.
 *
 * What holds a root, read from the source:
 *
 * - Kozmos's `<DensityScope density="touch" asChild>` (by its import, under
 *   any local name), with `asChild` bare or `{true}` and no spread that could
 *   override either, around exactly one JSX element whose tag is intrinsic or
 *   a component known to pass `data-*` on to its element (FORWARDS_DATA, each
 *   confirmed to spread its own props). A fragment, an expression or another
 *   component would lose the mark.
 * - Every way the render returns: each return, both sides of a ternary, the
 *   right of an `&&`; a function inside the render returns for itself.
 * - A wrapper that renders no element (a context provider, Dialog.Root) is
 *   looked into; it must hold one child.
 * - A fragment's children are each held, but for a plain intrinsic element
 *   with a bare `hidden` and no class or style, which has no geometry to hold.
 * - A returned identifier is followed only to a `const` of its own render's
 *   top-level block that nothing reassigns or shadows.
 * - A component of the same file is followed into its own render, once.
 *
 * Nothing in an SDK directory, in any file, marks a density by hand or sets
 * one inside a part (a DensityScope other than touch, a provider's
 * `density`): a bare attribute would hold the CSS but not the providers and
 * popovers inside. An export of a shape this can't follow is named, never
 * skipped. Reviewed adversarially on 16 Oct: each rule has a self-test that
 * fails when the rule is taken out.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const ts = createRequire(path.join(root, "packages/react/package.json"))(
  "typescript",
);

export const COMPONENTS = path.join(root, "packages/react/src/components");

/**
 * Kozmos components that spread their remaining props onto the one element
 * they render, so a DensityScope's mark reaches the DOM through them.
 * `checkSdkParts` confirms each still does.
 */
export const FORWARDS_DATA = ["Button", "Card"];

/** Wrappers that render no element of their own, beside `…Provider`. */
const RENDERS_NO_ELEMENT = new Set(["Dialog.Root"]);
const rendersNoElement = (tag) =>
  /Provider$/.test(tag) || RENDERS_NO_ELEMENT.has(tag);

/**
 * Exported components with no geometry the density changes, and why. A name
 * here that an SDK directory no longer exports fails the check.
 */
export const EXEMPT = {
  DirectionIcon:
    "a decorative arrow: its size is its caller's class, and nothing in it follows the density",
};

const unwrap = (node) => {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node))
  )
    node = node.expression;
  return node;
};
const opening = (node) => (ts.isJsxElement(node) ? node.openingElement : node);
const tagOf = (node, sf) => opening(node).tagName.getText(sf);
const attribute = (node, name, sf) =>
  opening(node).attributes.properties.find(
    (property) =>
      ts.isJsxAttribute(property) && property.name.getText(sf) === name,
  );
const line = (node, sf) =>
  sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
// The children that render: no blank text, no empty `{/* … */}`.
const rendered = (children) =>
  children.filter((child) =>
    ts.isJsxText(child)
      ? child.text.trim()
      : !ts.isJsxExpression(child) || child.expression,
  );
const isElement = (node) =>
  ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
// Only a bare `hidden` on a plain intrinsic element is surely hidden: a
// component may ignore it, and the stylesheet's [hidden] rule has no weight,
// so any class or style that sets display shows the element.
const bareHidden = (node, sf) => {
  const hidden = attribute(node, "hidden", sf);
  if (!hidden || hidden.initializer) return false;
  if (!/^[a-z][\w-]*$/.test(tagOf(node, sf))) return false;
  return opening(node).attributes.properties.every(
    (property) =>
      ts.isJsxAttribute(property) &&
      !["className", "class", "style"].includes(property.name.getText(sf)),
  );
};

// The local names this file gives Kozmos's DensityScope, by its import.
const scopeNames = (sf) => {
  const names = new Set();
  for (const statement of sf.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !/(^|\/)(theme|DensityScope)$/.test(statement.moduleSpecifier.text)
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const element of bindings.elements)
        if ((element.propertyName ?? element.name).text === "DensityScope")
          names.add(element.name.text);
  }
  return names;
};

/** The function a component named `name` renders with, or null. */
export function renderOf(sf, name) {
  let render = null;
  const find = (node) => {
    if (render) return;
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sf) === name &&
      node.initializer
    ) {
      let init = node.initializer;
      while (
        init &&
        !ts.isArrowFunction(init) &&
        !ts.isFunctionExpression(init) &&
        !ts.isIdentifier(init)
      )
        // forwardRef(fn), memo(fn, compare), memo(forwardRef(fn)): the
        // render is the first argument, never memo's comparator.
        init = ts.isCallExpression(init)
          ? init.arguments[0]
          : ts.isAsExpression(init) || ts.isParenthesizedExpression(init)
            ? init.expression
            : null;
      if (init && ts.isIdentifier(init) && init.text !== name)
        render = renderOf(sf, init.text);
      else render = init ?? null;
    }
    if (ts.isFunctionDeclaration(node) && node.name?.getText(sf) === name)
      render = node;
    ts.forEachChild(node, find);
  };
  find(sf);
  return render;
}

/** Every expression a render returns, outside the functions inside it. */
export function returnsOf(render) {
  const returns = [];
  if (render.body && !ts.isBlock(render.body)) returns.push(render.body);
  const walk = (node) => {
    if (node !== render && ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node) && node.expression)
      returns.push(node.expression);
    ts.forEachChild(node, walk);
  };
  if (render.body && ts.isBlock(render.body)) walk(render.body);
  return returns;
}

// A returned name, followed only to one `const` of the render's own block
// that nothing reassigns and no other declaration shadows.
function constOf(name, render) {
  if (!render.body || !ts.isBlock(render.body))
    return { problem: `returns ${name}, which can't be followed` };
  const own = render.body.statements.flatMap((statement) =>
    ts.isVariableStatement(statement) &&
    statement.declarationList.flags & ts.NodeFlags.Const
      ? statement.declarationList.declarations.filter(
          (declaration) =>
            ts.isIdentifier(declaration.name) && declaration.name.text === name,
        )
      : [],
  );
  let declarations = 0;
  let reassigned = false;
  const named = (node) =>
    node && ts.isIdentifier(unwrap(node)) && unwrap(node).text === name;
  const walk = (node) => {
    if (
      (ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node)) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    )
      declarations += 1;
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name?.text === name
    )
      declarations += 1;
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      named(node.left)
    )
      reassigned = true;
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken) &&
      named(node.operand)
    )
      reassigned = true;
    ts.forEachChild(node, walk);
  };
  for (const parameter of render.parameters ?? []) walk(parameter);
  walk(render.body);
  if (own.length !== 1 || !own[0].initializer)
    return {
      problem: `returns ${name}, which is not a const of the render's own block`,
    };
  if (declarations > 1)
    return { problem: `returns ${name}, which another declaration shadows` };
  if (reassigned) return { problem: `returns ${name}, which is reassigned` };
  return { value: own[0].initializer };
}

// A density written `"touch"` or `{"touch"}`.
const densityOf = (node, sf) => {
  let value = attribute(node, "density", sf)?.initializer;
  if (value && ts.isJsxExpression(value)) value = unwrap(value.expression);
  return value && ts.isStringLiteral(value) ? value.text : value?.getText(sf);
};

function densityScope(node, sf) {
  const problems = [];
  if (opening(node).attributes.properties.some(ts.isJsxSpreadAttribute))
    problems.push(
      "a DensityScope with a spread, which can override its density or asChild",
    );
  const density = densityOf(node, sf);
  if (density !== "touch")
    problems.push(
      `a DensityScope with density ${density ? JSON.stringify(density) : "unset"}`,
    );
  const asChild = attribute(node, "asChild", sf);
  if (!asChild) problems.push("a DensityScope with no asChild");
  else if (
    asChild.initializer &&
    !(
      ts.isJsxExpression(asChild.initializer) &&
      asChild.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword
    )
  )
    problems.push(
      `a DensityScope with asChild=${asChild.initializer.getText(sf)}`,
    );
  if (problems.length) return problems;
  const children = ts.isJsxElement(node) ? rendered(node.children) : [];
  if (children.length !== 1)
    return [`a DensityScope around ${children.length} children, not one`];
  const [child] = children;
  if (ts.isJsxFragment(child))
    return ["a DensityScope around a fragment, which takes no attribute"];
  if (!isElement(child))
    return [`a DensityScope around ${child.getText(sf)}, which can't be read`];
  const tag = tagOf(child, sf);
  if (!/^[a-z][\w-]*$/.test(tag) && !FORWARDS_DATA.includes(tag))
    return [
      `a DensityScope around <${tag}> at line ${line(child, sf)}, which is not known to pass data-* on`,
    ];
  return [];
}

/** What keeps `node`, one way a render returns, from being a touch root. */
function held(node, sf, scope, seen, scopes) {
  node = unwrap(node);
  // Nothing rendered holds nothing.
  if (
    !node ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    (ts.isIdentifier(node) && node.text === "undefined")
  )
    return [];
  if (ts.isIdentifier(node)) {
    // A name is its render's: the same name in another render is another.
    const key = `${scope.pos}:${node.text}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const { value, problem } = constOf(node.text, scope);
    return value ? held(value, sf, scope, seen, scopes) : [problem];
  }
  if (ts.isConditionalExpression(node))
    return [
      ...held(node.whenTrue, sf, scope, seen, scopes),
      ...held(node.whenFalse, sf, scope, seen, scopes),
    ];
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  )
    return held(node.right, sf, scope, seen, scopes);
  const fragment =
    ts.isJsxFragment(node) ||
    (ts.isJsxElement(node) &&
      /^(React\.)?Fragment$/.test(tagOf(node, sf)) &&
      opening(node).attributes.properties.length === 0);
  if (fragment)
    return node.children.flatMap((child) => {
      if (ts.isJsxText(child)) return [];
      if (ts.isJsxExpression(child))
        return child.expression
          ? held(child.expression, sf, scope, seen, scopes)
          : [];
      if (isElement(child) && bareHidden(child, sf)) return [];
      return held(child, sf, scope, seen, scopes);
    });
  if (!isElement(node))
    return [`returns ${ts.SyntaxKind[node.kind]}, which can't be read`];
  // Hidden, it has no geometry to hold.
  if (bareHidden(node, sf)) return [];
  const tag = tagOf(node, sf);
  if (scopes.has(tag)) return densityScope(node, sf);
  // A wrapper that renders no element: look inside.
  if (rendersNoElement(tag) && ts.isJsxElement(node)) {
    const children = rendered(node.children);
    return children.length === 1
      ? held(
          ts.isJsxExpression(children[0])
            ? children[0].expression
            : children[0],
          sf,
          scope,
          seen,
          scopes,
        )
      : [`<${tag}> holds ${children.length} children`];
  }
  // A part of the same file: its own render must hold its root, read once.
  const inner = /^[A-Z]\w*$/.test(tag) && renderOf(sf, tag);
  if (inner) {
    if (seen.has(`part:${tag}`)) return [];
    seen.add(`part:${tag}`);
    return returnsOf(inner).flatMap((expression) =>
      held(expression, sf, inner, seen, scopes),
    );
  }
  return [`returns <${tag}> at line ${line(node, sf)}`];
}

export const parseSource = (fileName, text) =>
  ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

/** What keeps the component `name` in `text` from a touch root, if anything. */
export function checkComponent(text, name, fileName = `${name}.tsx`) {
  const sf = parseSource(fileName, text);
  const render = renderOf(sf, name);
  if (!render) return [`no render function named ${name}`];
  const returns = returnsOf(render);
  if (!returns.length) return ["its render returns nothing"];
  const seen = new Set();
  const scopes = scopeNames(sf);
  return returns.flatMap((expression) =>
    held(expression, sf, render, seen, scopes),
  );
}

const resolveModule = (from, specifier) => {
  const base = path.resolve(path.dirname(from), specifier);
  for (const ending of [".tsx", ".ts", "/index.tsx", "/index.ts"])
    if (fs.existsSync(base + ending)) return base + ending;
  return null;
};

/**
 * The values a module exports, each with the file that declares it. An
 * export of a shape this can't follow comes back as `{ unreadable }`, so it
 * is named rather than skipped.
 */
export function exportsOf(file, seen = new Set()) {
  if (!file || seen.has(file)) return [];
  seen.add(file);
  const sf = parseSource(file, fs.readFileSync(file, "utf8"));
  const out = [];
  const unreadable = (statement) =>
    out.push({ unreadable: statement.getText(sf).split("\n")[0], file });
  const exported = (node) =>
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
  for (const statement of sf.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      const target = statement.moduleSpecifier
        ? resolveModule(file, statement.moduleSpecifier.text)
        : file;
      if (!statement.exportClause) out.push(...exportsOf(target, seen));
      else if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          if (element.isTypeOnly) continue;
          const local = (element.propertyName ?? element.name).text;
          if (local === "default" || element.name.text === "default")
            unreadable(statement);
          else if (statement.moduleSpecifier) {
            // Re-exported from another module: follow it to where it is
            // declared, under the name that module gives it.
            const found = exportsOf(target, new Set(seen)).find(
              (entry) => entry.name === local,
            );
            out.push({
              name: element.name.text,
              local: found?.local ?? local,
              file: found?.file ?? target,
            });
          } else out.push({ name: element.name.text, local, file: target });
        }
      } else unreadable(statement);
    } else if (ts.isExportAssignment(statement)) {
      unreadable(statement);
    } else if (exported(statement)) {
      if (ts.isVariableStatement(statement))
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name))
            out.push({
              name: declaration.name.text,
              local: declaration.name.text,
              file,
            });
          else unreadable(statement);
      if (
        (ts.isFunctionDeclaration(statement) ||
          ts.isClassDeclaration(statement)) &&
        statement.name
      )
        out.push({
          name: statement.name.text,
          local: statement.name.text,
          file,
        });
    }
  }
  return out;
}

// A component's name starts with a capital. A name with a small letter is
// always checked; one in capitals only (POI, or a constant like PANEL_SIZE)
// is a component when its file gives it a render.
const isComponent = (entry) => {
  if (!/^[A-Z]/.test(entry.name)) return false;
  if (/[a-z]/.test(entry.name)) return true;
  if (!entry.file || !fs.existsSync(entry.file)) return false;
  const sf = parseSource(entry.file, fs.readFileSync(entry.file, "utf8"));
  return Boolean(renderOf(sf, entry.local));
};

/** Does the component `name` spread its props onto the element it renders? */
function spreadsProps(componentsDir, name) {
  const file = path.join(componentsDir, name, `${name}.tsx`);
  if (!fs.existsSync(file)) return false;
  const sf = parseSource(file, fs.readFileSync(file, "utf8"));
  const render = renderOf(sf, name);
  // Through the wrappers that render no element, to the one that does.
  const element = (node) => {
    node = unwrap(node);
    if (!node || !isElement(node)) return null;
    if (!rendersNoElement(tagOf(node, sf))) return node;
    const children = ts.isJsxElement(node) ? rendered(node.children) : [];
    return children.length === 1 ? element(children[0]) : null;
  };
  // The render's own props: its first parameter, or the rest of it.
  const first = render?.parameters?.[0]?.name;
  const props =
    first && ts.isIdentifier(first)
      ? first.text
      : first && ts.isObjectBindingPattern(first)
        ? first.elements.find((element) => element.dotDotDotToken)?.name?.text
        : undefined;
  const returns = render ? returnsOf(render).map(element) : [];
  return (
    Boolean(props) &&
    returns.length > 0 &&
    returns.every(
      (node) =>
        node &&
        opening(node).attributes.properties.some(
          (property) =>
            ts.isJsxSpreadAttribute(property) &&
            ts.isIdentifier(unwrap(property.expression)) &&
            unwrap(property.expression).text === props,
        ),
    )
  );
}

// Every source file of a directory, in its subfolders too.
const sourcesOf = (dir, prefix = "") =>
  fs
    .readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(prefix, entry.name);
      if (entry.isDirectory()) return sourcesOf(dir, file);
      return /\.tsx?$/.test(entry.name) &&
        !/\.(test|stories|figma)\.tsx?$/.test(entry.name)
        ? [file]
        : [];
    });

// The densities a file sets inside a part: a DensityScope other than touch,
// or a provider given a density of its own.
const DENSITY_SETTERS = /^(ThemeProvider|DesignConfigProvider|KozmosTheme)$/;
function densitiesSet(text, file) {
  const sf = parseSource(file, text);
  const scopes = scopeNames(sf);
  const found = [];
  const walk = (node) => {
    if (isElement(node)) {
      const tag = tagOf(node, sf);
      const density = attribute(node, "density", sf) && densityOf(node, sf);
      if (scopes.has(tag) && density !== "touch")
        found.push(density ?? "unset");
      else if (DENSITY_SETTERS.test(tag) && density) found.push(density);
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return found;
}

/**
 * Every SDK directory (one with a story titled `SDK/…`): each component its
 * index exports must return a touch DensityScope root on every path.
 */
export function checkSdkParts(componentsDir = COMPONENTS) {
  const unheld = [];
  const components = [];
  let parts = 0;
  const exempted = new Set();
  for (const name of FORWARDS_DATA)
    if (!spreadsProps(componentsDir, name))
      unheld.push(
        `${name} is listed as passing data-* on, but its render does not spread its props onto its element`,
      );
  for (const name of fs.readdirSync(componentsDir).sort()) {
    const dir = path.join(componentsDir, name);
    const story = path.join(dir, `${name}.stories.tsx`);
    if (!fs.existsSync(story)) continue;
    if (!/title:\s*"SDK\//.test(fs.readFileSync(story, "utf8"))) continue;
    parts += 1;
    for (const file of sourcesOf(dir)) {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      if (/data-kozmos-density/.test(text))
        unheld.push(`${name}: ${file} marks a density by hand`);
      for (const density of densitiesSet(text, file))
        unheld.push(
          `${name}: ${file} sets density ${JSON.stringify(density)} inside the part`,
        );
    }
    const index = ["index.ts", "index.tsx"]
      .map((file) => path.join(dir, file))
      .find((file) => fs.existsSync(file));
    const all = index
      ? exportsOf(index)
      : [{ name, local: name, file: path.join(dir, `${name}.tsx`) }];
    for (const entry of all)
      if (entry.unreadable)
        unheld.push(`${name}: an export it can't read: ${entry.unreadable}`);
    const exports = all.filter(
      (entry) => !entry.unreadable && isComponent(entry),
    );
    if (!exports.length) unheld.push(`${name}: its index exports no component`);
    for (const entry of exports) {
      if (Object.hasOwn(EXEMPT, entry.name)) {
        exempted.add(entry.name);
        continue;
      }
      if (!entry.file || !fs.existsSync(entry.file)) {
        unheld.push(`${name}: ${entry.name}'s module can't be found`);
        continue;
      }
      components.push(entry.name);
      const problems = checkComponent(
        fs.readFileSync(entry.file, "utf8"),
        entry.local,
        entry.file,
      );
      for (const problem of problems)
        unheld.push(
          `${name}: ${entry.name} ${problem}, not a touch DensityScope root`,
        );
    }
  }
  for (const name of Object.keys(EXEMPT))
    if (!exempted.has(name))
      unheld.push(`${name} is exempt, but no SDK directory exports it`);
  return { parts, components, exempt: [...exempted], unheld };
}
