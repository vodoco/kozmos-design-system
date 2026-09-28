/**
 * One example per card, taken from the component's own stories.
 *
 * A story is written against the component's source and Storybook: it
 * imports `./POIResultCard`, spreads `args`, and passes `fn()` for a
 * callback. An example is written against the published packages, as an app
 * would write it. So a story is converted, never copied:
 *
 *   - its args (the meta's, then the story's) become JSX attributes, and a
 *     render function's `{...args}` and `args.x` are replaced by them;
 *   - `fn()` from @storybook/test becomes `() => {}`;
 *   - an import from a component's source becomes one from
 *     `@kozmos-ds/react`, and only if the package exports that name;
 *   - a constant, helper or fixture the story uses is carried along with it;
 *   - the render is wrapped in a ThemeProvider, since nothing outside one is
 *     themed.
 *
 * Anything else a story leans on — a decorator, the Storybook context, an
 * import the packages do not offer — is not something an app can do, so a
 * story that needs it is passed over for the next. A component none of whose
 * stories convert gets an example drawn from its types instead: the
 * component with its required props. Either way every candidate is
 * type-checked against the built declarations, and the first that compiles
 * is the card's example.
 */
import fs from "node:fs";
import path from "node:path";
import { ts } from "./claude-design-typescript.mjs";

/** What an example may import besides `@kozmos-ds/react`. */
const PACKAGES = new Set([
  "react",
  "@kozmos-ds/icons",
  "@kozmos-ds/product-contracts",
  "@kozmos-ds/tokens",
]);

/** Parts that are the theme themselves: an example of one is not wrapped in another. */
export const PROVIDERS = new Set([
  "ThemeProvider",
  "DesignConfigProvider",
  "KozmosTheme",
]);

export class Unconvertible extends Error {}
const refuse = (message) => {
  throw new Unconvertible(message);
};

const isFixture = (file) => /\.fixtures\.tsx?$/.test(file);

/**
 * The stories, parsed and bound in one program. Nothing is resolved: an
 * identifier is traced to its own import or declaration, which is all the
 * conversion needs, and a fixture file a story imports is read alongside it.
 */
export function storyProgram(files) {
  const extra = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const base = path.resolve(path.dirname(file), match[1]);
      for (const candidate of [`${base}.ts`, `${base}.tsx`])
        if (isFixture(candidate) && fs.existsSync(candidate))
          extra.add(candidate);
    }
  }
  const program = ts.createProgram({
    rootNames: [...files, ...extra],
    options: {
      noResolve: true,
      noEmit: true,
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2022,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      types: [],
    },
  });
  const fixtures = new Map(
    [...extra].map((file) => [file, program.getSourceFile(file)]),
  );
  return { program, checker: program.getTypeChecker(), fixtures };
}

const unwrap = (node) => {
  while (
    node &&
    (ts.isSatisfiesExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isParenthesizedExpression(node))
  )
    node = node.expression;
  return node;
};

const propertyOf = (object, key) =>
  object && ts.isObjectLiteralExpression(object)
    ? object.properties.find(
        (p) =>
          (ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)) &&
          p.name &&
          (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
          p.name.text === key,
      )
    : undefined;

/** A property's value: `render: () => …` and `render() { … }` alike. */
const valueOf = (property) =>
  !property
    ? null
    : ts.isMethodDeclaration(property)
      ? property
      : unwrap(property.initializer);

const isExported = (statement) =>
  (ts.getModifiers(statement) ?? []).some(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );

/** The meta and the stories of a stories file, in the order Storybook lists them. */
export function readStories(program, file) {
  const source = program.getSourceFile(file);
  const consts = new Map();
  const stories = [];
  let meta = null;
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        consts.set(d.name.text, d);
        if (isExported(statement))
          stories.push({ name: d.name.text, node: unwrap(d.initializer) });
      }
    } else if (ts.isExportAssignment(statement)) {
      const expression = unwrap(statement.expression);
      meta = ts.isIdentifier(expression)
        ? unwrap(consts.get(expression.text)?.initializer)
        : expression;
    }
  }
  const title = valueOf(propertyOf(meta, "title"));
  return {
    source,
    meta: {
      node: meta,
      title: title && ts.isStringLiteral(title) ? title.text : null,
      component: valueOf(propertyOf(meta, "component")),
      args: valueOf(propertyOf(meta, "args")),
      render: valueOf(propertyOf(meta, "render")),
    },
    stories: stories
      .filter(
        (s) =>
          s.node &&
          (ts.isObjectLiteralExpression(s.node) || ts.isArrowFunction(s.node)),
      )
      .map((s) =>
        ts.isArrowFunction(s.node)
          ? { name: s.name, args: null, render: s.node }
          : {
              name: s.name,
              args: valueOf(propertyOf(s.node, "args")),
              render: valueOf(propertyOf(s.node, "render")),
            },
      ),
  };
}

const isUndefined = (node) =>
  ts.isIdentifier(node) && node.text === "undefined";

const isJsx = (node) =>
  ts.isJsxElement(node) ||
  ts.isJsxSelfClosingElement(node) ||
  ts.isJsxFragment(node);

/** An attribute name JSX can write. */
const ATTRIBUTE = /^[A-Za-z_$][\w$-]*$/;

/** A string JSX can hold, as an attribute or as text, without braces. */
const plainString = (text) => !/["'\\&{}<>\n\r\t]|^\s|\s$/.test(text);

/**
 * Converts one story into an example module, or throws Unconvertible with
 * why it cannot be one.
 */
export function convertStory({
  checker,
  fixtures,
  source,
  meta,
  story,
  exportNames,
  exampleName,
  packageRoot,
}) {
  // ---- the args: the meta's, then the story's --------------------------------
  const args = new Map();
  const addArgs = (object) => {
    if (!object) return;
    if (!ts.isObjectLiteralExpression(object))
      refuse("its args are not an object literal");
    for (const property of object.properties) {
      if (ts.isPropertyAssignment(property)) {
        const key = property.name;
        if (!ts.isIdentifier(key) && !ts.isStringLiteral(key))
          refuse("an arg has a computed name");
        const value = unwrap(property.initializer);
        // An arg set to undefined is an arg taken away, as in Storybook.
        if (isUndefined(value)) args.delete(key.text);
        else args.set(key.text, value);
      } else if (ts.isShorthandPropertyAssignment(property))
        args.set(property.name.text, property.name);
      else if (ts.isSpreadAssignment(property)) {
        const spread = unwrap(property.expression);
        const symbol = ts.isIdentifier(spread)
          ? checker.getSymbolAtLocation(spread)
          : null;
        const declaration = symbol?.declarations?.[0];
        if (!declaration || !ts.isVariableDeclaration(declaration))
          refuse("its args spread something other than a constant");
        addArgs(unwrap(declaration.initializer));
      } else refuse("an arg is a method or an accessor");
    }
  };
  addArgs(meta.args);
  addArgs(story.args);

  // ---- the render function, if there is one ----------------------------------
  const render = story.render ?? meta.render;
  // What names the args inside the render: `(args) =>` gives the whole object,
  // `({ side, ...rest }) =>` one arg per name and the rest without them.
  let argsSymbol = null;
  const excluded = new Set();
  const bound = new Map(); // symbol → { key, initializer }
  let statements = [];
  let returned = null;
  if (render) {
    if (
      !ts.isArrowFunction(render) &&
      !ts.isFunctionExpression(render) &&
      !ts.isMethodDeclaration(render)
    )
      refuse("its render is not a function");
    const [first, second] = render.parameters;
    if (first && ts.isIdentifier(first.name))
      argsSymbol = checker.getSymbolAtLocation(first.name);
    else if (first && ts.isObjectBindingPattern(first.name)) {
      for (const element of first.name.elements) {
        if (!ts.isIdentifier(element.name))
          refuse("its render destructures its args more than one level deep");
        if (element.dotDotDotToken) {
          argsSymbol = checker.getSymbolAtLocation(element.name);
          continue;
        }
        const key = element.propertyName ?? element.name;
        if (!ts.isIdentifier(key) && !ts.isStringLiteral(key))
          refuse("its render destructures a computed arg");
        excluded.add(key.text);
        bound.set(checker.getSymbolAtLocation(element.name), {
          key: key.text,
          initializer: element.initializer ?? null,
        });
      }
    } else if (first)
      refuse("its render takes its args in a form it cannot read");
    if (second) {
      const context = checker.getSymbolAtLocation(second.name);
      const reads = (node) =>
        (ts.isIdentifier(node) &&
          node !== second.name &&
          checker.getSymbolAtLocation(node) === context) ||
        ts.forEachChild(node, reads);
      if (reads(render.body)) refuse("its render reads the Storybook context");
    }
    if (ts.isBlock(render.body)) {
      const body = [...render.body.statements];
      const last = body.pop();
      if (!last || !ts.isReturnStatement(last) || !last.expression)
        refuse("its render does not end in its one return");
      const early = (node) =>
        !ts.isFunctionLike(node) &&
        (ts.isReturnStatement(node) || ts.forEachChild(node, early));
      if (body.some(early)) refuse("its render returns early");
      statements = body;
      returned = unwrap(last.expression);
    } else returned = unwrap(render.body);
  }

  // ---- how the story's text becomes the example's -----------------------------
  const isArgs = (node) =>
    argsSymbol !== null &&
    ts.isIdentifier(node) &&
    checker.getSymbolAtLocation(node) === argsSymbol;
  /** A destructured arg's value where its name is read, or null. */
  const boundValue = (node) => {
    if (!bound.size || !ts.isIdentifier(node)) return null;
    const binding = bound.get(checker.getSymbolAtLocation(node));
    if (!binding) return null;
    const value = args.get(binding.key) ?? binding.initializer;
    return { value };
  };
  const spreadsArgs = (attributes) =>
    attributes.properties.some(
      (p) => ts.isJsxSpreadAttribute(p) && isArgs(unwrap(p.expression)),
    );
  const importOf = (identifier) => {
    const declaration =
      checker.getSymbolAtLocation(identifier)?.declarations?.[0];
    if (!declaration || !ts.isImportSpecifier(declaration)) return null;
    return {
      module: ts.findAncestor(declaration, ts.isImportDeclaration)
        .moduleSpecifier.text,
      name: (declaration.propertyName ?? declaration.name).text,
    };
  };

  /** An element's attributes with `{...args}` written out, later ones winning. */
  function attributesWithArgs(attributes) {
    const written = new Map();
    const uses = [];
    let spreads = 0;
    for (const property of attributes.properties) {
      if (
        ts.isJsxSpreadAttribute(property) &&
        isArgs(unwrap(property.expression))
      ) {
        for (const [name, value] of args) {
          if (name === "children" || excluded.has(name)) continue;
          written.delete(name);
          written.set(name, attribute(name, value));
          uses.push(value);
        }
      } else {
        const name = ts.isJsxAttribute(property)
          ? property.name.getText()
          : `…${spreads++}`;
        written.delete(name);
        written.set(name, print(property));
        uses.push(property);
      }
    }
    return { text: [...written.values()].join(" "), uses };
  }

  /** How a node is replaced: its text, and the nodes that text came from. */
  function replacement(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const imported = importOf(node.expression);
      if (imported?.module === "@storybook/test" && imported.name === "fn") {
        if (node.arguments.length === 0) return { text: "() => {}", uses: [] };
        if (node.arguments.length === 1)
          return { text: print(node.arguments[0]), uses: [node.arguments[0]] };
        refuse("it calls fn() with more than one argument");
      }
    }
    if (bound.size) {
      // `side={side}` is written as the arg it names, or left out without one.
      if (
        ts.isJsxAttribute(node) &&
        node.initializer &&
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression &&
        boundValue(node.initializer.expression)
      ) {
        const { value } = boundValue(node.initializer.expression);
        return value
          ? { text: attribute(node.name.getText(), value), uses: [value] }
          : { text: "", uses: [] };
      }
      if (ts.isShorthandPropertyAssignment(node) && boundValue(node.name)) {
        const { value } = boundValue(node.name);
        return {
          text: `${node.name.text}: ${value ? printValue(value) : "undefined"}`,
          uses: value ? [value] : [],
        };
      }
      const read = boundValue(node);
      if (read)
        return read.value
          ? { text: `(${printValue(read.value)})`, uses: [read.value] }
          : { text: "undefined", uses: [] };
    }
    if (argsSymbol === null) return null;
    if (ts.isPropertyAccessExpression(node) && isArgs(node.expression)) {
      const value = excluded.has(node.name.text)
        ? null
        : args.get(node.name.text);
      return value
        ? { text: `(${printValue(value)})`, uses: [value] }
        : { text: "undefined", uses: [] };
    }
    if (ts.isJsxSelfClosingElement(node) && spreadsArgs(node.attributes)) {
      const { text, uses } = attributesWithArgs(node.attributes);
      const tag = print(node.tagName);
      const children = excluded.has("children") ? null : args.get("children");
      return children
        ? {
            text: `<${tag} ${text}>${child(children)}</${tag}>`,
            uses: [node.tagName, ...uses, children],
          }
        : { text: `<${tag} ${text} />`, uses: [node.tagName, ...uses] };
    }
    // An element with children of its own keeps them; its args' children lose.
    if (ts.isJsxAttributes(node) && spreadsArgs(node))
      return attributesWithArgs(node);
    if (isArgs(node))
      refuse("its render uses args other than to spread or read them");
    return null;
  }

  /** The source text of `node`, with every replacement made. */
  function print(node) {
    const own = replacement(node);
    if (own) return own.text;
    const file = node.getSourceFile();
    const edits = [];
    const visit = (inner) => {
      const replaced = replacement(inner);
      if (replaced)
        edits.push([inner.getStart(file), inner.getEnd(), replaced.text]);
      else ts.forEachChild(inner, visit);
    };
    ts.forEachChild(node, visit);
    const start = node.getStart(file);
    let text = file.text.slice(start, node.getEnd());
    for (const [from, to, written] of edits.sort((a, b) => b[0] - a[0]))
      text = text.slice(0, from - start) + written + text.slice(to - start);
    return text;
  }

  const printValue = (value) =>
    ts.isIdentifier(value) ? value.text : print(value);

  function attribute(name, value) {
    if (!ATTRIBUTE.test(name))
      refuse(`an arg's name, ${name}, is not one JSX can write`);
    if (ts.isStringLiteral(value) && plainString(value.text))
      return `${name}="${value.text}"`;
    if (value.kind === ts.SyntaxKind.TrueKeyword) return name;
    return `${name}={${printValue(value)}}`;
  }

  function child(value) {
    if (
      (ts.isStringLiteral(value) ||
        ts.isNoSubstitutionTemplateLiteral(value)) &&
      plainString(value.text)
    )
      return value.text;
    if (isJsx(value)) return print(value);
    return `{${printValue(value)}}`;
  }

  // ---- the example's JSX -------------------------------------------------------
  let jsx;
  if (returned) {
    jsx = print(returned);
    if (!isJsx(returned)) jsx = `{${jsx}}`;
  } else {
    if (!meta.component || !ts.isIdentifier(meta.component))
      refuse("its meta names no component to render");
    const tag = meta.component.text;
    const attributes = [...args]
      .filter(([name]) => name !== "children")
      .map(([name, value]) => attribute(name, value));
    const children = args.get("children");
    jsx = children
      ? `<${tag} ${attributes.join(" ")}>${child(children)}</${tag}>`
      : `<${tag} ${attributes.join(" ")} />`;
  }
  const body = statements.map(print);

  // ---- what the example needs: imports, and the story's own declarations ------
  const imports = new Map(); // module → Map(local name → { name, type })
  const hoisted = new Map(); // statement → its text
  // Anything declared inside what is printed is the example's own.
  const printed = new Set([render, ...args.values()].filter(Boolean));
  const withinPrinted = (node) => {
    for (let n = node; n; n = n.parent) if (printed.has(n)) return true;
    return false;
  };
  const storyStatements = new Set(
    source.statements.filter(
      (s) =>
        ts.isVariableStatement(s) &&
        (isExported(s) ||
          s.declarationList.declarations.some(
            (d) => unwrap(d.initializer) === meta.node,
          )),
    ),
  );

  const addImport = (module, name, localName, typeOnly) => {
    if (!imports.has(module)) imports.set(module, new Map());
    const names = imports.get(module);
    const existing = names.get(localName);
    if (existing && existing.name !== name)
      refuse(`two imports are both called ${localName}`);
    names.set(localName, {
      name,
      type: typeOnly && (existing ? existing.type : true),
    });
  };

  function hoist(statement) {
    if (hoisted.has(statement)) return;
    if (storyStatements.has(statement))
      refuse("it reads another story, or the meta");
    if (
      !ts.isVariableStatement(statement) &&
      !ts.isFunctionDeclaration(statement) &&
      !ts.isInterfaceDeclaration(statement) &&
      !ts.isTypeAliasDeclaration(statement) &&
      !ts.isEnumDeclaration(statement)
    )
      refuse("it needs a statement that cannot be carried");
    hoisted.set(statement, null);
    printed.add(statement);
    collect(statement);
    hoisted.set(statement, print(statement).replace(/^export\s+/, ""));
  }

  function resolveImport(declaration, identifier) {
    const statement = ts.findAncestor(declaration, ts.isImportDeclaration);
    const module = statement.moduleSpecifier.text;
    const typeOnly =
      statement.importClause.isTypeOnly ||
      (ts.isImportSpecifier(declaration) && declaration.isTypeOnly);
    const localName = identifier.text;
    if (!ts.isImportSpecifier(declaration)) {
      if (module !== "react") refuse(`it imports ${module} whole`);
      addImport(
        module,
        ts.isNamespaceImport(declaration) ? "*" : "default",
        localName,
        typeOnly,
      );
      return;
    }
    const name = (declaration.propertyName ?? declaration.name).text;
    if (module.startsWith(".")) {
      const target = path.resolve(
        path.dirname(statement.getSourceFile().fileName),
        module,
      );
      if (!target.startsWith(packageRoot))
        refuse(`it imports from ${module}, outside the package`);
      if (exportNames.has(name))
        return addImport("@kozmos-ds/react", name, localName, typeOnly);
      const fixture =
        fixtures.get(`${target}.ts`) ?? fixtures.get(`${target}.tsx`);
      const carried = fixture?.statements.find(
        (s) =>
          (ts.isVariableStatement(s) &&
            s.declarationList.declarations.some(
              (d) => ts.isIdentifier(d.name) && d.name.text === name,
            )) ||
          ((ts.isFunctionDeclaration(s) ||
            ts.isInterfaceDeclaration(s) ||
            ts.isTypeAliasDeclaration(s)) &&
            s.name?.text === name),
      );
      if (!carried || localName !== name)
        refuse(
          `it imports ${name} from ${module}, which @kozmos-ds/react does not export`,
        );
      hoist(carried);
      return;
    }
    if (module === "@storybook/test")
      refuse(`it uses ${name} from @storybook/test`);
    if (!PACKAGES.has(module)) refuse(`it imports from ${module}`);
    addImport(module, name, localName, typeOnly);
  }

  const NAME_ONLY = [
    ts.isPropertyAssignment,
    ts.isPropertySignature,
    ts.isPropertyDeclaration,
    ts.isMethodDeclaration,
    ts.isMethodSignature,
    ts.isEnumMember,
    ts.isVariableDeclaration,
    ts.isParameter,
    ts.isFunctionDeclaration,
    ts.isTypeParameterDeclaration,
    ts.isInterfaceDeclaration,
    ts.isTypeAliasDeclaration,
    ts.isJsxAttribute,
  ];

  function resolve(identifier) {
    const parent = identifier.parent;
    if (
      (ts.isPropertyAccessExpression(parent) && parent.name === identifier) ||
      (ts.isQualifiedName(parent) && parent.right === identifier) ||
      (NAME_ONLY.some((is) => is(parent)) && parent.name === identifier) ||
      (ts.isBindingElement(parent) &&
        (parent.propertyName === identifier || parent.name === identifier)) ||
      ts.isImportSpecifier(parent) ||
      ts.isImportClause(parent) ||
      ts.isNamespaceImport(parent) ||
      ts.isExportSpecifier(parent)
    )
      return;
    const symbol =
      ts.isShorthandPropertyAssignment(parent) && parent.name === identifier
        ? checker.getShorthandAssignmentValueSymbol(parent)
        : checker.getSymbolAtLocation(identifier);
    const declaration = symbol?.declarations?.[0];
    if (!declaration) return;
    if (
      ts.isImportSpecifier(declaration) ||
      ts.isImportClause(declaration) ||
      ts.isNamespaceImport(declaration)
    )
      return resolveImport(declaration, identifier);
    const file = declaration.getSourceFile();
    if (file !== source && !isFixture(file.fileName)) return; // a global
    if (withinPrinted(declaration)) return;
    let statement = declaration;
    while (statement.parent && !ts.isSourceFile(statement.parent))
      statement = statement.parent;
    if (statement.parent) hoist(statement);
  }

  function collect(node) {
    const replaced = replacement(node);
    if (replaced) {
      replaced.uses.forEach(collect);
      return;
    }
    if (ts.isIdentifier(node)) resolve(node);
    ts.forEachChild(node, collect);
  }

  if (returned) {
    statements.forEach(collect);
    collect(returned);
  } else {
    collect(meta.component);
    for (const value of args.values()) collect(value);
  }

  // ---- the module --------------------------------------------------------------
  const tagOf = (node) =>
    ts.isJsxElement(node)
      ? node.openingElement.tagName.getText()
      : ts.isJsxSelfClosingElement(node)
        ? node.tagName.getText()
        : null;
  const rootTag = returned ? tagOf(returned) : meta.component.text;
  const wrap = !PROVIDERS.has(rootTag);
  if (wrap) {
    for (const [module, names] of imports)
      if (module !== "@kozmos-ds/react" && names.has("ThemeProvider"))
        refuse("it has a ThemeProvider of its own");
    if ([...hoisted.values()].some((text) => /\bThemeProvider\b/.test(text)))
      refuse("it declares a ThemeProvider of its own");
    addImport("@kozmos-ds/react", "ThemeProvider", "ThemeProvider", false);
  }
  if (
    [...hoisted.values(), ...body].some((text) =>
      new RegExp(`\\b${exampleName}\\b`).test(text),
    )
  )
    refuse(`it declares ${exampleName} itself`);

  const importLines = [...imports]
    .sort(([a], [b]) =>
      a === "react" ? -1 : b === "react" ? 1 : a.localeCompare(b),
    )
    .map(([module, names]) => {
      const entries = [...names].sort(([a], [b]) => a.localeCompare(b));
      const lines = entries
        .filter(([, v]) => v.name === "*" || v.name === "default")
        .map(([localName, v]) =>
          v.name === "*"
            ? `import * as ${localName} from "${module}";`
            : `import ${localName} from "${module}";`,
        );
      const named = entries.filter(
        ([, v]) => v.name !== "*" && v.name !== "default",
      );
      if (named.length) {
        const allTypes = named.every(([, v]) => v.type);
        const list = named
          .map(
            ([localName, v]) =>
              `${!allTypes && v.type ? "type " : ""}${v.name === localName ? localName : `${v.name} as ${localName}`}`,
          )
          .join(", ");
        lines.push(
          `import ${allTypes ? "type " : ""}{ ${list} } from "${module}";`,
        );
      }
      return lines.join("\n");
    });
  // A fixture's declarations first, then the story's, each in source order.
  const declarations = [...hoisted.keys()]
    .sort(
      (a, b) =>
        Number(a.getSourceFile() === source) -
          Number(b.getSourceFile() === source) || a.getStart() - b.getStart(),
    )
    .map((statement) => hoisted.get(statement));
  const content = wrap
    ? `<ThemeProvider defaultTheme="light">\n${jsx}\n</ThemeProvider>`
    : jsx;
  return [
    importLines.join("\n"),
    ...declarations,
    `export function ${exampleName}() {\n${body.join("\n")}\nreturn (\n${content}\n);\n}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

/** `panelLabel` → "Panel label": a readable stand-in for a required string. */
export const humanize = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/ ([A-Z])(?=[a-z])/g, (_, c) => ` ${c.toLowerCase()}`);

/**
 * A value of `type` written as code, for a required prop no story gives: a
 * word for a string, the first of a union of literals, an empty list, a
 * callback that does nothing, an object with its own required fields.
 */
export function valueOfType(checker, type, name, depth = 0) {
  if (depth > 5) return null;
  const flags = type.flags;
  if (type.isUnion()) {
    const members = type.types.filter(
      (t) =>
        !(
          t.flags &
          (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)
        ),
    );
    const literal = members.find((t) => t.isStringLiteral());
    if (literal) return JSON.stringify(literal.value);
    if (members.every((t) => t.flags & ts.TypeFlags.BooleanLiteral))
      return "false";
    const number = members.find((t) => t.isNumberLiteral());
    if (number) return String(number.value);
    for (const member of members) {
      const value = valueOfType(checker, member, name, depth + 1);
      if (value !== null) return value;
    }
    return null;
  }
  if (flags & (ts.TypeFlags.String | ts.TypeFlags.TemplateLiteral))
    return JSON.stringify(humanize(name));
  if (flags & ts.TypeFlags.StringLiteral) return JSON.stringify(type.value);
  if (flags & ts.TypeFlags.Number) return "0";
  if (flags & ts.TypeFlags.NumberLiteral) return String(type.value);
  if (flags & ts.TypeFlags.BooleanLiteral)
    return checker.typeToString(type) === "true" ? "true" : "false";
  if (flags & ts.TypeFlags.Boolean) return "false";
  if (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
    return JSON.stringify(humanize(name));
  const text = checker.typeToString(type);
  if (/ReactNode|ReactElement|JSX\.Element/.test(text))
    return JSON.stringify(humanize(name));
  if (checker.isArrayType(type)) return "[]";
  if (checker.isTupleType(type)) {
    const elements = checker
      .getTypeArguments(type)
      .map((t, i) => valueOfType(checker, t, `${name}${i}`, depth + 1));
    return elements.includes(null) ? null : `[${elements.join(", ")}]`;
  }
  const signature = type.getCallSignatures()[0];
  if (signature) {
    const returns = signature.getReturnType();
    if (
      returns.flags &
      (ts.TypeFlags.Void |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Any |
        ts.TypeFlags.Unknown)
    )
      return "() => {}";
    const value = valueOfType(checker, returns, name, depth + 1);
    return value === null ? null : `() => (${value})`;
  }
  if (text === "Date") return "new Date(0)";
  if (flags & ts.TypeFlags.Object) {
    const fields = [];
    for (const property of checker.getPropertiesOfType(type)) {
      if (property.flags & ts.SymbolFlags.Optional) continue;
      // A mapped type's members (a Record's keys) have no declaration of their own.
      const value = valueOfType(
        checker,
        checker.getTypeOfSymbol(property),
        property.name,
        depth + 1,
      );
      if (value === null) return null;
      const key = /^[A-Za-z_$][\w$]*$/.test(property.name)
        ? property.name
        : JSON.stringify(property.name);
      fields.push(`${key}: ${value}`);
    }
    return `{ ${fields.join(", ")} }`;
  }
  return null;
}

/**
 * The component with its required props and nothing else, in a
 * ThemeProvider: what a card shows when none of its stories converts. Throws
 * Unconvertible when a required prop's type has no value this can write.
 */
export function synthesizeExample({ api, description, exampleName }) {
  const { checker } = api;
  const attributes = [];
  let children = null;
  for (const prop of checker.getPropertiesOfType(
    description.entry.component.propsType,
  )) {
    if (
      prop.flags & ts.SymbolFlags.Optional ||
      prop.name === "key" ||
      prop.name === "ref"
    )
      continue;
    const value = valueOfType(
      checker,
      checker.getTypeOfSymbol(prop),
      prop.name,
    );
    if (value === null)
      refuse(
        `its required prop ${prop.name} has no value that can be written for it`,
      );
    if (prop.name === "children") children = value;
    else if (/^"[^"\\&{}<>]*"$/.test(value))
      attributes.push(`${prop.name}=${value}`);
    else attributes.push(`${prop.name}={${value}}`);
  }
  const tag = description.name;
  const text =
    children && /^"[^"\\&{}<>]*"$/.test(children)
      ? JSON.parse(children).replace(/^Children$/, "Content")
      : null;
  const element = children
    ? `<${tag} ${attributes.join(" ")}>${text ?? `{${children}}`}</${tag}>`
    : `<${tag} ${attributes.join(" ")} />`;
  const wrap = !PROVIDERS.has(tag);
  const names = [...new Set([tag, ...(wrap ? ["ThemeProvider"] : [])])].sort();
  return [
    `import { ${names.join(", ")} } from "@kozmos-ds/react";`,
    `export function ${exampleName}() {\nreturn (\n${wrap ? `<ThemeProvider defaultTheme="light">\n${element}\n</ThemeProvider>` : element}\n);\n}`,
  ]
    .join("\n\n")
    .concat("\n");
}
