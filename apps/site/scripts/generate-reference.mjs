#!/usr/bin/env node
/**
 * Generates the component reference's data from the design system's own
 * sources, so the site never restates by hand what the repository already
 * says:
 *
 *  - the component list and its lanes from scripts/skills/check-completion.ts
 *    (the same sets that build STATUS.md);
 *  - each component's description and its React, Vue, SwiftUI and Compose
 *    snippets from its .mdx documentation (the PlatformSnippets block);
 *  - each component's parts — the PascalCase exports of its folder that the
 *    built package really exports — and their props, read with the
 *    TypeScript compiler: the members each `<Part>Props` declares itself
 *    (not what it inherits from an element), the variants of a `cva()` it
 *    extends, and the defaults its destructuring or `defaultVariants` give.
 *
 * Output (gitignored, rebuilt by `pnpm generate` before dev, build and
 * typecheck): src/generated/components.json — the index — and
 * src/generated/components/<slug>.json, one per component, and a copy of
 * the tokens package's contrast contract.
 *
 *   node scripts/generate-reference.mjs            # write
 *   node scripts/generate-reference.mjs --check    # fail if the output would change
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(SITE_ROOT, "..", "..");
const COMPONENTS_DIR = path.join(REPO_ROOT, "packages/react/src/components");
const STATUS_SCRIPT = path.join(
  REPO_ROOT,
  "scripts/skills/check-completion.ts",
);
const REACT_TSCONFIG = path.join(REPO_ROOT, "packages/react/tsconfig.json");
const REACT_PACKAGE = path.join(
  REPO_ROOT,
  "packages/react/dist/kozmos-react.mjs",
);
const CONTRAST_CONTRACT = path.join(
  REPO_ROOT,
  "packages/tokens/src/contrast-contract.json",
);
const OUT_DIR = path.join(SITE_ROOT, "src/generated");

export const LANES = {
  core: "Core",
  "code-only": "Code-only / utility",
  "product-sdk": "Product / SDK",
  "platform-form-factor": "Platform / form factor",
};

/** PascalCase to kebab-case, keeping acronyms whole: POIDetailPanel → poi-detail-panel. */
export function slugOf(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/** The name sets the status script classifies by, read from its source. */
export function readLaneSets(source) {
  const setOf = (constant) => {
    const match = source.match(
      new RegExp(`const ${constant} = new Set\\(\\[([\\s\\S]*?)\\]\\)`),
    );
    if (!match) throw new Error(`${constant} not found in check-completion.ts`);
    return new Set(
      [...match[1].matchAll(/"([A-Za-z0-9]+)"/g)].map((m) => m[1]),
    );
  };
  return {
    internal: setOf("INTERNAL_COMPONENT_NAMES"),
    productSdk: setOf("PRODUCT_SDK_COMPONENT_NAMES"),
    codeOnly: setOf("CODE_ONLY_UTILITY_COMPONENT_NAMES"),
    platform: setOf("PLATFORM_FORM_FACTOR_COMPONENT_NAMES"),
  };
}

export function laneOf(name, sets) {
  if (sets.codeOnly.has(name)) return "code-only";
  if (sets.productSdk.has(name)) return "product-sdk";
  if (sets.platform.has(name)) return "platform-form-factor";
  return "core";
}

/**
 * The first paragraph after the mdx's title: prose, not an import, a JSX
 * block or a heading. Markdown emphasis is dropped; inline code is kept.
 */
export function readDescription(mdx) {
  const lines = mdx.split("\n");
  const title = lines.findIndex((line) => /^#\s+\S/.test(line));
  const paragraph = [];
  for (const line of lines.slice(title + 1)) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph.length) break;
      continue;
    }
    if (/^(import |<|#|export )/.test(trimmed)) {
      if (paragraph.length) break;
      continue;
    }
    paragraph.push(trimmed);
  }
  return paragraph
    .join(" ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2");
}

function dedent(code) {
  const lines = code.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^\s*/)[0].length),
  );
  return lines
    .map((line) => line.slice(Number.isFinite(indent) ? indent : 0))
    .join("\n");
}

/** The PlatformSnippets block's code, per platform, from an mdx source. */
/** A fenced block's language, as the platform whose code it is. */
const FENCED_PLATFORM = {
  tsx: "react",
  jsx: "react",
  swift: "swift",
  kotlin: "kotlin",
  kt: "kotlin",
};

/**
 * A component's code on each platform, from its docs: the PlatformSnippets
 * block, and failing that, the first fenced block in each platform's language
 * (some docs show their code under headings instead: "## iOS SwiftUI").
 */
export function readSnippets(mdx) {
  const snippets = {};
  for (const match of mdx.matchAll(
    /\b(react|vue|swift|kotlin)=\{`([\s\S]*?)`\}/g,
  )) {
    const [, platform, code] = match;
    if (!(platform in snippets)) snippets[platform] = dedent(code);
  }
  for (const match of mdx.matchAll(/^```(\w+)[^\n]*\n([\s\S]*?)^```/gm)) {
    const platform = FENCED_PLATFORM[match[1]];
    if (platform && !(platform in snippets))
      snippets[platform] = match[2].trimEnd();
  }
  return snippets;
}

/** A folder's component sources: the .tsx files, not its stories, tests, mappings or barrel. */
function sourceFilesOf(directory) {
  return fs
    .readdirSync(directory)
    .filter(
      (name) =>
        /\.tsx$/.test(name) && !/\.(stories|test|spec|figma)\.tsx$/.test(name),
    )
    .map((name) => path.join(directory, name));
}

/** A React component's name, as opposed to a helper (`buttonVariants`) or a constant (`BUTTON_EMOTIONS`). */
export function isComponentName(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name) && !/^[A-Z0-9_]+$/.test(name);
}

/** The runtime export names of the built package, so a part is something a consumer can import. */
export async function readPackageExports() {
  const module = await import(pathToFileURL(REACT_PACKAGE).href);
  return new Set(Object.keys(module));
}

// ---- Props, through the TypeScript compiler --------------------------------

function hasExportModifier(node) {
  return Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
}

function jsDocOf(node) {
  const docs = ts.getJSDocCommentsAndTags(node);
  const texts = docs
    .filter((doc) => ts.isJSDoc(doc))
    .map((doc) =>
      typeof doc.comment === "string"
        ? doc.comment
        : ts.getTextOfJSDocComment(doc.comment),
    )
    .filter(Boolean);
  return texts.join("\n").trim();
}

/**
 * Where a property was declared: the repository's own source, a Radix
 * primitive the part wraps (worth showing, marked), or the DOM's attribute
 * types and other libraries (left out: every element takes those).
 */
function originOf(symbol) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) return { keep: false };
  const file = declaration.getSourceFile().fileName;
  if (!file.includes("/node_modules/"))
    return { keep: true, declaration, source: null };
  const radix = file.match(/node_modules\/(@radix-ui\/[^/]+)/);
  if (radix) return { keep: true, declaration, source: radix[1] };
  return { keep: false };
}

/**
 * A prop's type as one line. A union of literals is spelled out (`"sm" |
 * "lg"`), which is what a reader wants from an alias like `SurfaceVariant`;
 * anything else is the source text where there is one, which keeps names
 * like `ReactNode`, or the checker's own rendering.
 */
export function typeTextOf(checker, type, declaration) {
  if (type.flags & ts.TypeFlags.Boolean) return "boolean";
  if (type.isUnion()) {
    const parts = type.types.filter(
      (part) => !(part.flags & ts.TypeFlags.Undefined),
    );
    const booleans = parts.filter(
      (part) => part.flags & ts.TypeFlags.BooleanLiteral,
    );
    const nulls = parts.filter((part) => part.flags & ts.TypeFlags.Null);
    const literals = parts.filter((part) => part.isLiteral());
    if (
      parts.length &&
      booleans.length + literals.length + nulls.length === parts.length
    ) {
      const names = literals.map((part) =>
        typeof part.value === "string" ? `"${part.value}"` : String(part.value),
      );
      if (booleans.length === 2) names.push("boolean");
      else if (booleans.length === 1)
        names.push(checker.typeToString(booleans[0]));
      if (nulls.length) names.push("null");
      return names.join(" | ");
    }
  }
  if (declaration && ts.isPropertySignature(declaration) && declaration.type) {
    return declaration.type.getText().replace(/\s+/g, " ");
  }
  const nonUndefined = type.isUnion()
    ? type.types.filter((part) => !(part.flags & ts.TypeFlags.Undefined))
    : null;
  if (nonUndefined && nonUndefined.length === 1) {
    return checker.typeToString(
      nonUndefined[0],
      undefined,
      ts.TypeFormatFlags.NoTruncation,
    );
  }
  return checker
    .typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
    .replace(/ \| undefined$/, "");
}

/**
 * A default as the props table shows it: a string in double quotes, as the
 * type column writes a string's type, and anything else as it is written.
 */
function defaultText(node, sourceFile) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? JSON.stringify(node.text)
    : node.getText(sourceFile).replace(/\s+/g, " ");
}

/** `const xVariants = cva(base, { defaultVariants: {...} })`: the defaults, by variant name. */
function cvaDefaultsOf(sourceFile) {
  const defaults = new Map();
  const unquote = (text) => text.replace(/^["']|["']$/g, "");
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "cva" &&
      node.arguments[1] &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      for (const property of node.arguments[1].properties) {
        if (
          ts.isPropertyAssignment(property) &&
          property.name.getText(sourceFile) === "defaultVariants" &&
          ts.isObjectLiteralExpression(property.initializer)
        ) {
          for (const entry of property.initializer.properties) {
            if (ts.isPropertyAssignment(entry)) {
              defaults.set(
                unquote(entry.name.getText(sourceFile)),
                defaultText(entry.initializer, sourceFile),
              );
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return defaults;
}

/** Defaults from destructuring: `({ size = "md", ...props })` anywhere in the file. */
function destructuringDefaultsOf(sourceFile) {
  const defaults = new Map();
  const visit = (node) => {
    if (
      ts.isBindingElement(node) &&
      node.initializer &&
      ts.isIdentifier(node.name)
    ) {
      const key = node.propertyName
        ? node.propertyName.getText(sourceFile)
        : node.name.text;
      if (!defaults.has(key)) {
        defaults.set(key, defaultText(node.initializer, sourceFile));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return defaults;
}

/** Exported component declarations in a file, by name: the statement and the node that carries its type. */
function declarationsOf(sourceFile, checker) {
  const found = new Map();
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name))
          found.set(declaration.name.text, { statement, declaration });
      }
    } else if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      hasExportModifier(statement)
    ) {
      found.set(statement.name.text, { statement, declaration: statement });
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        if (statement.moduleSpecifier) {
          // `export { X } from "../Other/Other"`: a folder that re-exports a
          // part declared elsewhere (DateRangePicker lives in DatePicker.tsx).
          const target = checker.getExportSpecifierLocalTargetSymbol(element);
          const resolved =
            target && target.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(target)
              : target;
          const declaration = resolved?.declarations?.find(
            (node) =>
              ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node),
          );
          if (declaration) {
            const owner = ts.isVariableDeclaration(declaration)
              ? declaration.parent.parent
              : declaration;
            found.set(element.name.text, { statement: owner, declaration });
          }
          continue;
        }
        // `export { X }` after `const X = …`: find the declaration it names.
        const local = (element.propertyName ?? element.name).text;
        for (const other of sourceFile.statements) {
          if (ts.isVariableStatement(other)) {
            for (const declaration of other.declarationList.declarations) {
              if (
                ts.isIdentifier(declaration.name) &&
                declaration.name.text === local
              ) {
                found.set(element.name.text, { statement: other, declaration });
              }
            }
          } else if (
            ts.isFunctionDeclaration(other) &&
            other.name?.text === local
          ) {
            found.set(element.name.text, {
              statement: other,
              declaration: other,
            });
          }
        }
      }
    }
  }
  return found;
}

/**
 * The props type of a component: the second type argument of
 * `React.forwardRef<E, P>`, the argument of `React.FC<P>`, or the first
 * parameter's type of a function or arrow function.
 */
function propsTypeOf(checker, declaration) {
  const fromNode = (node) =>
    node ? checker.getTypeFromTypeNode(node) : undefined;
  if (ts.isFunctionDeclaration(declaration)) {
    return fromNode(declaration.parameters[0]?.type);
  }
  if (
    declaration.type &&
    ts.isTypeReferenceNode(declaration.type) &&
    declaration.type.typeArguments?.[0]
  ) {
    return fromNode(declaration.type.typeArguments[0]);
  }
  let initializer = declaration.initializer;
  while (
    initializer &&
    (ts.isAsExpression(initializer) ||
      ts.isParenthesizedExpression(initializer))
  ) {
    initializer = initializer.expression;
  }
  if (!initializer) return undefined;
  // `export const DateRangePicker = SomeOtherComponent`: follow the alias.
  if (
    ts.isIdentifier(initializer) ||
    ts.isPropertyAccessExpression(initializer)
  ) {
    const symbol = checker.getSymbolAtLocation(initializer);
    const target =
      symbol && symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    const aliased = target?.declarations?.find(
      (node) =>
        ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node),
    );
    return aliased ? propsTypeOf(checker, aliased) : undefined;
  }
  if (ts.isCallExpression(initializer)) {
    if (initializer.typeArguments?.[1])
      return fromNode(initializer.typeArguments[1]);
    // forwardRef((props: P, ref) => …) or memo((props: P) => …) without type arguments.
    const inner = initializer.arguments[0];
    if (
      inner &&
      (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner))
    ) {
      return fromNode(inner.parameters[0]?.type);
    }
    return undefined;
  }
  if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
    return fromNode(initializer.parameters[0]?.type);
  }
  return undefined;
}

function compilerOptions() {
  const config = ts.readConfigFile(REACT_TSCONFIG, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
    );
  return ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(REACT_TSCONFIG),
  ).options;
}

/**
 * The parts of every file, with their props: a map from file path to a list
 * of { name, description, props }. A prop is kept when the repository or a
 * Radix primitive declares it; the DOM's attributes are left out.
 */
export function readParts(files, packageExports) {
  const program = ts.createProgram(files, compilerOptions());
  const checker = program.getTypeChecker();
  const byFile = new Map();
  for (const file of files) {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) continue;
    const defaults = destructuringDefaultsOf(sourceFile);
    const cvaDefaults = cvaDefaultsOf(sourceFile);
    const parts = [];
    for (const [name, { statement, declaration }] of declarationsOf(
      sourceFile,
      checker,
    )) {
      if (!isComponentName(name) || !packageExports.has(name)) continue;
      const type = propsTypeOf(checker, declaration);
      const props = [];
      if (type) {
        // A union props type (RouteSummary's estimate or navigation form) lists
        // every member's props; one is required only if every member requires it.
        const members = type.isUnion() ? type.types : [type];
        const byName = new Map();
        for (const member of members) {
          for (const symbol of checker.getPropertiesOfType(member)) {
            const origin = originOf(symbol);
            if (!origin.keep) continue;
            const name = symbol.getName();
            const required = !(symbol.flags & ts.SymbolFlags.Optional);
            const propType = checker.getTypeOfSymbolAtLocation(
              symbol,
              origin.declaration,
            );
            const existing = byName.get(name);
            if (existing) {
              existing.required = existing.required && required;
              existing.seen += 1;
              // A discriminator declared `undefined` in one form: show the other's type.
              if (existing.type === "undefined")
                existing.type = typeTextOf(
                  checker,
                  propType,
                  origin.declaration,
                );
              continue;
            }
            byName.set(name, {
              name,
              type: typeTextOf(checker, propType, origin.declaration),
              required,
              seen: 1,
              defaultValue: defaults.get(name) ?? cvaDefaults.get(name) ?? null,
              description: ts
                .displayPartsToString(symbol.getDocumentationComment(checker))
                .trim(),
              source: origin.source,
            });
          }
        }
        for (const prop of byName.values()) {
          if (prop.seen < members.length) prop.required = false;
          delete prop.seen;
          props.push(prop);
        }
      }
      props.sort((a, b) => a.name.localeCompare(b.name));
      parts.push({ name, description: jsDocOf(statement), props });
    }
    byFile.set(file, parts);
  }
  return byFile;
}

// ---- The whole reference ----------------------------------------------------

export async function generate() {
  const sets = readLaneSets(fs.readFileSync(STATUS_SCRIPT, "utf8"));
  const packageExports = await readPackageExports();
  const names = fs
    .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !sets.internal.has(entry.name))
    .map((entry) => entry.name)
    // One fixed locale, so every machine writes the same order.
    .sort((a, b) => a.localeCompare(b, "en"));

  const allFiles = names.flatMap((name) =>
    sourceFilesOf(path.join(COMPONENTS_DIR, name)),
  );
  const partsByFile = readParts(allFiles, packageExports);

  const components = names.map((name) => {
    const directory = path.join(COMPONENTS_DIR, name);
    const mdxPath = path.join(directory, `${name}.mdx`);
    const mdx = fs.existsSync(mdxPath) ? fs.readFileSync(mdxPath, "utf8") : "";
    const seen = new Set();
    const parts = sourceFilesOf(directory)
      .flatMap((file) => partsByFile.get(file) ?? [])
      .filter((part) => (seen.has(part.name) ? false : seen.add(part.name)))
      .sort((a, b) =>
        a.name === name
          ? -1
          : b.name === name
            ? 1
            : a.name.localeCompare(b.name, "en"),
      );
    return {
      name,
      slug: slugOf(name),
      lane: laneOf(name, sets),
      // The docs' first paragraph; failing that, the component's own doc comment.
      description:
        readDescription(mdx) ||
        parts
          .find((part) => part.name === name)
          ?.description.split("\n\n")[0] ||
        "",
      snippets: readSnippets(mdx),
      parts,
    };
  });

  return {
    index: {
      lanes: LANES,
      components: components.map(
        ({ name, slug, lane, description, parts, snippets }) => ({
          name,
          slug,
          lane,
          description,
          exports: parts.map((part) => part.name),
          // Which platforms' code the docs carry, so the index can count them.
          code: ["react", "swift", "kotlin"].filter(
            (platform) => platform in snippets,
          ),
        }),
      ),
    },
    components,
  };
}

function writeIfChanged(file, content, check) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) return false;
  if (check) return true;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const { index, components } = await generate();
  const changed = [];
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  if (
    writeIfChanged(path.join(OUT_DIR, "components.json"), json(index), check)
  ) {
    changed.push("components.json");
  }
  // The contrast contract, as CI checks it, for the colour page to measure.
  const contract = JSON.parse(fs.readFileSync(CONTRAST_CONTRACT, "utf8"));
  if (
    writeIfChanged(
      path.join(OUT_DIR, "contrast-contract.json"),
      json(contract),
      check,
    )
  ) {
    changed.push("contrast-contract.json");
  }
  for (const component of components) {
    const file = path.join(OUT_DIR, "components", `${component.slug}.json`);
    if (writeIfChanged(file, json(component), check))
      changed.push(path.basename(file));
  }
  // Drop files for components that no longer exist.
  const componentsDir = path.join(OUT_DIR, "components");
  if (fs.existsSync(componentsDir)) {
    const expected = new Set(components.map((c) => `${c.slug}.json`));
    for (const name of fs.readdirSync(componentsDir)) {
      if (!expected.has(name)) {
        if (!check) fs.rmSync(path.join(componentsDir, name));
        changed.push(`- ${name}`);
      }
    }
  }
  if (check && changed.length) {
    console.error(
      `generate-reference: ${changed.length} file(s) out of date: ${changed.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `generate-reference: ${components.length} components, ${components.reduce((n, c) => n + c.parts.length, 0)} parts${changed.length ? `, ${changed.length} file(s) written` : ", unchanged"}.`,
  );
}
