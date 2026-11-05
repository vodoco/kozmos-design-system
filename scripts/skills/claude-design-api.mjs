/**
 * What @kozmos-ds/react publishes, read from its built declarations.
 *
 * `packages/react/dist/index.d.ts` is what an app compiles against and what
 * the Claude Design artifact carries as its `index.d.ts`, so it is the one
 * source of the props here: not the component source, which can say more
 * than the package exports, and not a hand-kept list, which is how the
 * artifact's cards came to stop after three props (GAP-090). The source is
 * read for one thing the declarations cannot carry: a prop's default, which
 * lives in the component's parameter list.
 */
import fs from "node:fs";
import path from "node:path";
import { compilerOptions, hostWith, ts } from "./claude-design-typescript.mjs";

export const DECLARATIONS = "packages/react/dist/index.d.ts";

/** Where a declaration lives, which decides whether a card lists it. */
export function originOf(file) {
  if (file.includes("/@types/react/")) return "react";
  if (/\/(framer-motion|motion-dom|motion-utils)\//.test(file)) return "motion";
  if (file.includes("/@radix-ui/")) return "radix";
  return "kozmos";
}

/**
 * The bundler's names, as a reader would write them. API Extractor imports
 * React under names of its own (`default_2`, `React_2`, `JSX_2` today), and
 * renames an export that collides with a global (`Text_2 as Text`); a card
 * says `React.ReactNode`, `JSX.Element` and `Text`. The names are read from
 * the bundle's own imports and exports, not assumed.
 */
function renamer(dts) {
  const namespaces = new Map(); // a local name → what a reader calls it
  const renames = new Map();
  for (const statement of dts.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.importClause?.namedBindings
    ) {
      const from = statement.moduleSpecifier.text;
      const bindings = statement.importClause.namedBindings;
      if (from === "react" && ts.isNamespaceImport(bindings))
        namespaces.set(bindings.name.text, "React");
      else if (ts.isNamedImports(bindings))
        for (const element of bindings.elements) {
          const imported = (element.propertyName ?? element.name).text;
          if (from === "react" && imported === "default")
            namespaces.set(element.name.text, "React");
          if (from === "react/jsx-runtime" && imported === "JSX")
            namespaces.set(element.name.text, "JSX");
        }
    }
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        if (element.propertyName)
          renames.set(element.propertyName.text, element.name.text);
  }
  return (text) =>
    text
      .replace(/\b([A-Za-z_]\w*)\./g, (whole, name) =>
        namespaces.has(name) ? `${namespaces.get(name)}.` : whole,
      )
      .replace(/\b[A-Za-z]\w*_\d+\b/g, (name) => renames.get(name) ?? name);
}

/**
 * A type on one line: comments dropped, whitespace collapsed, and none left
 * just inside a `<`. unplugin-dts writes `Omit< X` where it turns
 * `Omit<import("x").X` into a static import; the type is the same.
 */
const oneLine = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/;\s*}/g, " }")
    .replace(/< /g, "<")
    .trim();

/** A declaration as written, with its doc comment and without `export declare`. */
function declarationSource(node, rename) {
  const docs = ts
    .getJSDocCommentsAndTags(node)
    .filter((doc) => ts.isJSDoc(doc))
    .map((doc) => doc.getText());
  const body = node
    .getText()
    .replace(/^export\s+/, "")
    .replace(/^declare\s+/, "");
  return rename([...docs, body].join("\n"));
}

/** The doc comment of a symbol, as prose, and its tags. */
function documentation(symbol, checker) {
  const text = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .trim();
  const tags = symbol.getJsDocTags(checker).map((tag) => ({
    name: tag.name,
    text: ts.displayPartsToString(tag.text ?? []).trim(),
  }));
  return { text, tags };
}

/** The first sentence of a doc comment: what the Design System calls a summary. */
export function firstSentence(text) {
  const paragraph = text
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, " ")
    .trim();
  const match = paragraph.match(/^(.+?[.!?])(?=\s+[A-Z(`"“]|$)/);
  return match ? match[1] : paragraph;
}

/**
 * The published API: every export of the declarations, what kind of thing it
 * is, and — for a component — each prop it takes.
 *
 * `declarations` and `virtual` read another entry point instead, from memory
 * (path → text): the tests hand it declarations they emitted from sources of
 * their own.
 */
export function readPublishedApi(
  root,
  { declarations = path.join(root, DECLARATIONS), virtual = new Map() } = {},
) {
  const file = declarations;
  if (!virtual.has(file) && !fs.existsSync(file))
    throw new Error(
      `${DECLARATIONS} is missing. The Claude Design cards are read from the built types: run \`pnpm --filter "@kozmos-ds/react..." build\` first.`,
    );
  const program = ts.createProgram({
    rootNames: [file],
    options: compilerOptions,
    host: hostWith(virtual),
  });
  const checker = program.getTypeChecker();
  const dts = program.getSourceFile(file);
  const rename = renamer(dts);
  const moduleSymbol = checker.getSymbolAtLocation(dts);
  const entries = new Map();
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const target =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    entries.set(exported.name, classify(exported.name, target));
  }

  function classify(name, symbol) {
    const declarations = symbol.declarations ?? [];
    const value = declarations.find(
      (d) => ts.isVariableDeclaration(d) || ts.isFunctionDeclaration(d),
    );
    const typeDeclaration = declarations.find(
      (d) =>
        ts.isInterfaceDeclaration(d) ||
        ts.isTypeAliasDeclaration(d) ||
        ts.isEnumDeclaration(d),
    );
    const from = declarations[0]
      ? packageOf(declarations[0].getSourceFile().fileName)
      : "@kozmos-ds/react";
    const entry = {
      name,
      symbol,
      from,
      doc: documentation(symbol, checker),
      value: value ?? null,
      type: typeDeclaration ?? null,
      component: null,
    };
    if (value && /^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name)) {
      const signature = checker
        .getTypeOfSymbolAtLocation(symbol, dts)
        .getCallSignatures()[0];
      const returns = signature
        ? checker.typeToString(signature.getReturnType())
        : "";
      const parameter = signature?.getParameters()[0];
      if (parameter && /Element|ReactNode|ReactPortal|null/.test(returns))
        entry.component = {
          propsType: checker.getTypeOfSymbolAtLocation(parameter, dts),
        };
    }
    return entry;
  }

  function packageOf(fileName) {
    // A file served from memory has no real path of its own.
    const real = fs.existsSync(fileName) ? fs.realpathSync(fileName) : fileName;
    const match = real.match(/\/packages\/([^/]+)\/dist\//);
    if (match) return `@kozmos-ds/${match[1]}`;
    const npm = real.match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)\//g);
    return npm ? npm.at(-1).replace(/^\/node_modules\/|\/$/g, "") : fileName;
  }

  return {
    root,
    program,
    checker,
    dts,
    rename,
    entries,
    packageOf,
    typeText: (node) => oneLine(rename(node.getText())),
    declarationSource: (node) => declarationSource(node, rename),
  };
}

/** A method signature (`onOpenChange?(open: boolean): void`) as a function type. */
function signatureText(api, node) {
  const parameters = node.parameters.map((p) => api.typeText(p)).join(", ");
  const returns = node.type ? api.typeText(node.type) : "void";
  return `(${parameters}) => ${returns}`;
}

/**
 * How a component export states its props, from its declaration: the props
 * type it takes (`POIResultCardProps`), what that type extends, and the
 * element its ref reaches.
 */
function propsDeclaration(api, entry) {
  const node = entry.value;
  let typeNode = null;
  if (ts.isFunctionDeclaration(node)) typeNode = node.parameters[0]?.type;
  else if (node.type) {
    let current = node.type;
    // React.MemoExoticComponent<React.ForwardRefExoticComponent<P>> and the like.
    while (
      ts.isTypeReferenceNode(current) &&
      current.typeArguments?.length === 1 &&
      /(?:Memo|Lazy)ExoticComponent$/.test(current.typeName.getText())
    )
      current = current.typeArguments[0];
    if (ts.isTypeReferenceNode(current) && current.typeArguments?.length)
      typeNode = current.typeArguments[0];
    else if (ts.isTypeLiteralNode(current)) {
      const call = current.members.find((m) =>
        ts.isCallSignatureDeclaration(m),
      );
      typeNode = call?.parameters[0]?.type ?? null;
    }
  }
  let ref = null;
  let propsText = null;
  if (typeNode) {
    const parts = ts.isIntersectionTypeNode(typeNode)
      ? [...typeNode.types]
      : [typeNode];
    const own = [];
    for (const part of parts) {
      const refMatch = part.getText().match(/^(?:\w+\.)?RefAttributes<(.+)>$/s);
      if (refMatch) ref = api.rename(refMatch[1]);
      else own.push(api.typeText(part));
    }
    propsText = own.join(" & ") || null;
  }
  // What a named props interface extends, and what a props alias stands for.
  let heritage = null;
  if (propsText && /^\w+$/.test(propsText)) {
    const named = api.entries.get(propsText)?.type ?? findLocal(api, propsText);
    if (named && ts.isInterfaceDeclaration(named) && named.heritageClauses)
      heritage = named.heritageClauses
        .map((clause) => api.typeText(clause))
        .join(" ");
    else if (named && ts.isTypeAliasDeclaration(named))
      heritage = `= ${api.typeText(named.type)}`;
  }
  return { propsText, heritage, ref };
}

/** A declaration in the bundle that is not exported under its own name. */
function findLocal(api, name) {
  for (const statement of api.dts.statements)
    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === name
    )
      return statement;
  return null;
}

/**
 * Where a prop is declared, when the symbol a mapped type made for it has
 * lost that. framer-motion's `HTMLMotionProps` maps React's attributes over
 * a key set of its own, and a prop that comes through it no longer says it
 * is React's; it is found again in the types the props were built from: the
 * arguments of an `Omit` or a `Pick`, an interface's bases, an
 * intersection's parts.
 */
export function declarationsOf(checker, type, name, seen = new Set()) {
  if (!type || seen.has(type) || seen.size > 64) return [];
  seen.add(type);
  const own = checker.getPropertyOfType(type, name)?.declarations;
  if (own?.length) return own;
  const next = [
    ...(type.isUnionOrIntersection() ? type.types : []),
    ...(type.aliasTypeArguments ?? []),
    ...(type.isClassOrInterface() ? checker.getBaseTypes(type) : []),
    ...(type.objectFlags & ts.ObjectFlags.Reference
      ? checker.getTypeArguments(type)
      : []),
  ];
  for (const inner of next) {
    const found = declarationsOf(checker, inner, name, seen);
    if (found.length) return found;
  }
  return [];
}

/**
 * Every prop a component takes. Kozmos's own and Radix's are listed one by
 * one; React's DOM attributes and framer-motion's animation props, which
 * every element of that kind takes, are counted and named by where they
 * come from rather than listed 260 times over.
 *
 * Props that are a union of props (RouteSummary's estimate or navigation
 * layout, Accordion's single or multiple) are read member by member: a prop
 * of any member is listed, with the types each member gives it, required
 * only where every member requires it, and `where` says which members take
 * it and require it when they differ. A member that types a prop `undefined`
 * (`destination?: undefined`) does not take it.
 */
export function describeComponent(api, name, defaults = new Map()) {
  const { checker } = api;
  const entry = api.entries.get(name);
  if (!entry?.component) throw new Error(`${name} is not a component export`);
  const { propsText, heritage, ref } = propsDeclaration(api, entry);
  const propsType = entry.component.propsType;
  const members = propsType.isUnion() ? propsType.types : [propsType];
  const memberName = memberNamer(api, members, `${propsText} ${heritage}`);
  // Each prop, by name, with the member and symbol each member gives it.
  const byName = new Map();
  for (const member of members)
    for (const symbol of checker.getPropertiesOfType(member)) {
      if (symbol.name === "key" || symbol.name === "ref") continue;
      if (!byName.has(symbol.name)) byName.set(symbol.name, []);
      byName.get(symbol.name).push({ member, symbol });
    }
  const listed = [];
  const summarised = { react: [], motion: [] };
  for (const [propName, all] of byName) {
    const read = all.map(({ member, symbol }) => {
      const declarations = symbol.declarations?.length
        ? symbol.declarations
        : declarationsOf(checker, member, propName);
      const own =
        declarations.find(
          (d) => originOf(d.getSourceFile().fileName) === "kozmos",
        ) ?? declarations[0];
      return {
        member,
        symbol,
        own,
        type: typeOfProp(api, symbol, declarations, own),
        optional: !!(symbol.flags & ts.SymbolFlags.Optional),
      };
    });
    const first = read.find((r) => r.own) ?? read[0];
    const origin = first.own
      ? originOf(first.own.getSourceFile().fileName)
      : "kozmos";
    if (
      (origin === "react" || origin === "motion") &&
      propName !== "children"
    ) {
      summarised[origin].push(propName);
      continue;
    }
    // A member that types it `undefined` forbids it rather than takes it.
    const taking = read.filter(
      (r) => members.length === 1 || !/^(?:undefined|never)$/.test(r.type),
    );
    const takers = taking.length ? taking : read;
    const requiring = takers.filter((r) => !r.optional);
    const required =
      takers.length === members.length && requiring.length === members.length;
    const texts = [...new Set(takers.map((r) => r.type))];
    let type =
      texts.length > 1
        ? texts
            .map((text) => (/=>/.test(text) ? `(${text})` : text))
            .join(" | ")
        : texts[0];
    // `?:` already says a prop may be left out.
    if (!required) type = type.replace(/\s*\|\s*undefined$/, "");
    const docs = takers.map((r) => documentation(r.symbol, checker));
    const doc = [...new Set(docs.map((d) => d.text).filter(Boolean))].join(
      "\n",
    );
    const tags = docs.flatMap((d) => d.tags);
    const defaultTag = tags.find(
      (t) => t.name === "default" || t.name === "defaultValue",
    );
    let where = null;
    if (members.length > 1) {
      const names = (list) =>
        list.map((r) => `\`${memberName(r.member)}\``).join(" and ");
      const others = members.filter(
        (m) => !requiring.some((r) => r.member === m),
      );
      if (takers.length < members.length)
        where =
          `Only in ${names(takers)}` +
          (requiring.length === takers.length
            ? ", where it is **required**."
            : requiring.length
              ? `; **required** in ${names(requiring)}.`
              : ".");
      else if (requiring.length && !required)
        where = `**Required** in ${names(requiring)}; optional in ${others
          .map((m) => `\`${memberName(m)}\``)
          .join(" and ")}.`;
    }
    listed.push({
      name: propName,
      required,
      type,
      doc,
      deprecated: tags.find((t) => t.name === "deprecated")?.text ?? null,
      default: defaults.get(propName) ?? defaultTag?.text ?? null,
      origin,
      where,
      node: first.own ?? null,
    });
  }
  // Kozmos's own first, then Radix's, then `children` when React declares it.
  const rank = { kozmos: 0, radix: 1, react: 2, motion: 2 };
  listed.sort((a, b) => rank[a.origin] - rank[b.origin]);
  return { name, propsText, heritage, ref, props: listed, summarised, entry };
}

/** A prop's type as one member of the props declares it. */
function typeOfProp(api, symbol, declarations, own) {
  const { checker, dts } = api;
  // A prop declared in more than one of Kozmos's own types takes any of
  // their types.
  const each = declarations.filter(
    (d) =>
      originOf(d.getSourceFile().fileName) === "kozmos" &&
      (ts.isPropertySignature(d) || ts.isPropertyDeclaration(d)) &&
      d.type,
  );
  const texts = [...new Set(each.map((d) => api.typeText(d.type)))];
  if (texts.length > 1)
    return texts
      .map((text) => (/=>/.test(text) ? `(${text})` : text))
      .join(" | ");
  if (
    own &&
    (ts.isPropertySignature(own) || ts.isPropertyDeclaration(own)) &&
    own.type
  )
    return api.typeText(own.type);
  if (own && ts.isMethodSignature(own)) return signatureText(api, own);
  return api.rename(
    checker.typeToString(
      checker.getTypeOfSymbolAtLocation(symbol, dts),
      undefined,
      ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
    ),
  );
}

/**
 * What a reader calls each member of a union of props: its own name
 * (`RouteSummaryEstimateProps`), or, for an intersection, the parts no other
 * member shares. A name is written as the props declaration writes it
 * (`AccordionPrimitive.AccordionSingleProps`), so the card's reader finds it
 * there.
 */
function memberNamer(api, members, declared) {
  const { checker } = api;
  const partsOf = (member) =>
    (member.isIntersection() ? member.types : [member]).map((part) =>
      api.rename(
        checker.typeToString(
          part,
          undefined,
          ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        ),
      ),
    );
  const asDeclared = (part) =>
    declared.match(new RegExp(`\\b((?:\\w+\\.)+${part})\\b`))?.[1] ?? part;
  const parts = new Map(members.map((m) => [m, partsOf(m).map(asDeclared)]));
  return (member) => {
    const own = parts.get(member);
    const distinct = own.filter(
      (part) => !members.every((m) => parts.get(m).includes(part)),
    );
    return (distinct.length ? distinct : own).join(" & ");
  };
}

/**
 * The Kozmos types a set of props takes, and the types those take, in the
 * order a reader meets them: everything needed to build a value for a
 * required prop, and nothing from React or Radix.
 */
export function referencedTypes(api, nodes, exclude = new Set()) {
  const { checker } = api;
  const found = new Map();
  const queue = [...nodes];
  const visit = (node) => {
    if (
      ts.isTypeReferenceNode(node) ||
      ts.isExpressionWithTypeArguments(node)
    ) {
      const nameNode = ts.isTypeReferenceNode(node)
        ? node.typeName
        : node.expression;
      let symbol = checker.getSymbolAtLocation(
        ts.isQualifiedName(nameNode) ? nameNode.right : nameNode,
      );
      if (symbol && symbol.flags & ts.SymbolFlags.Alias)
        symbol = checker.getAliasedSymbol(symbol);
      const declaration = symbol?.declarations?.find(
        (d) =>
          ts.isInterfaceDeclaration(d) ||
          ts.isTypeAliasDeclaration(d) ||
          ts.isEnumDeclaration(d),
      );
      if (
        declaration &&
        originOf(declaration.getSourceFile().fileName) === "kozmos" &&
        api
          .packageOf(declaration.getSourceFile().fileName)
          .startsWith("@kozmos-ds/") &&
        !exclude.has(symbol.name) &&
        !found.has(symbol.name)
      ) {
        found.set(symbol.name, {
          name: symbol.name,
          from: api.packageOf(declaration.getSourceFile().fileName),
          source: api.declarationSource(declaration),
          exported:
            api.entries.has(symbol.name) ||
            api.packageOf(declaration.getSourceFile().fileName) !==
              "@kozmos-ds/react",
        });
        queue.push(declaration);
      }
    }
    ts.forEachChild(node, visit);
  };
  while (queue.length) {
    const node = queue.shift();
    if (
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)
    )
      ts.forEachChild(node, visit);
    else visit(node);
  }
  return [...found.values()];
}

/** A non-component export in one line: its kind and its declared type. */
export function describeValue(api, name) {
  const entry = api.entries.get(name);
  if (entry.type && !entry.value) {
    const kind = ts.isInterfaceDeclaration(entry.type)
      ? "interface"
      : ts.isEnumDeclaration(entry.type)
        ? "enum"
        : "type";
    return { name, kind, entry };
  }
  const node = entry.value;
  let text;
  if (ts.isFunctionDeclaration(node)) {
    const parameters = node.parameters.map((p) => api.typeText(p)).join(", ");
    text = `(${parameters}) => ${node.type ? api.typeText(node.type) : "void"}`;
  } else if (node.type) text = api.typeText(node.type);
  else if (node.initializer) text = `= ${api.typeText(node.initializer)}`;
  // A constant whose type is an object of its own reads better as written.
  const statement = ts.isVariableDeclaration(node) ? node.parent?.parent : null;
  const long =
    text && text.length > 100 && statement && ts.isVariableStatement(statement);
  return {
    name,
    kind: ts.isFunctionDeclaration(node) ? "function" : "const",
    text: text ?? null,
    source: long ? api.declarationSource(statement) : null,
    entry,
  };
}
