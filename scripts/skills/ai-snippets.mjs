/**
 * The code in `.ai-skills`, held to what @kozmos-ds publishes (the review's
 * T3).
 *
 * The check this replaces took its list of exports from the names of the
 * component directories, so it refused `DialogContent` and `DialogTitle`,
 * which the package exports, and let `Radio` through, which it does not; and
 * it read one line at a time, so an import or a tag written across lines, or
 * the second tag on a line, was never looked at.
 *
 * Now every fenced TypeScript or JavaScript block is parsed whole, with the
 * TypeScript parser, and checked against the facts read from the built
 * declarations (ai-facts.mjs):
 *
 *   - an import from `@kozmos-ds/<name>` must name a public package and
 *     things it exports; the `@kozmos` scope is the one before the rename, and any
 *     other package must be installed somewhere in the workspace;
 *   - a Kozmos component in JSX — imported, aliased, reached through a
 *     namespace import, or named without an import in a fragment — may only
 *     take props it has, and a literal value only where its type takes it;
 *   - a React tag named `Kozmos…` must be an export: the prefix is the
 *     SwiftUI and Compose naming, and guides had invented React components
 *     under it (`KozmosSkipLink`, `KozmosModal`);
 *   - a CSS variable, `var(--name)`, must be one the built stylesheets
 *     define or the document itself does;
 *   - no command may run a Kozmos package through npx, dlx or bunx: none
 *     provides one, so the command would run whatever npm served under the
 *     name.
 *
 * A block that is a whole module is also compiled against the build, with
 * the setup the Claude Design cards are compiled with
 * (claude-design-typescript.mjs); a JavaScript block is parsed. A block that
 * is not a whole module says so in its first comment lines, and why:
 *
 *     // kozmos-skills: template — a fragment of a render; `floors` is the app's
 *
 * is checked by name but not compiled, and
 *
 *     // kozmos-skills: counterexample — the mistake the section is about
 *
 * is neither, because it is wrong on purpose; it must still be wrong. There
 * is no other way to be excused, and no list of excused blocks in this file:
 * the reason sits beside the code, where a reader sees it.
 *
 * Prose and every other fence are read for the same imports and tags, whole
 * rather than line by line, so a tag written across lines in a sentence is
 * checked like one in code.
 */
import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { axisValues } from "./ai-facts.mjs";
import {
  compileModules,
  compilerOptions,
  exampleDirectory,
  hostWith,
  ts,
} from "./claude-design-typescript.mjs";

/** The fences whose code is TypeScript or JavaScript, as the file each is parsed as. */
export const LANGUAGES = {
  ts: ".ts",
  typescript: ".ts",
  mts: ".ts",
  cts: ".ts",
  tsx: ".tsx",
  js: ".js",
  javascript: ".js",
  mjs: ".js",
  cjs: ".js",
  jsx: ".jsx",
};

/** Fences of SwiftUI and Compose code, where `List<KozmosItem>` is a type, not a tag. */
const NATIVE = new Set([
  "swift",
  "kotlin",
  "kt",
  "java",
  "objc",
  "objective-c",
  "groovy",
  "gradle",
]);

/** What is compiled when it is whole; JavaScript is only parsed. */
const COMPILED = new Set([".ts", ".tsx"]);

/** Examples declare what they show without exporting it: an unused name is not an error here. */
const OPTIONS = { noUnusedLocals: false };

const MARKER =
  /^\s*(?:\/\/+|\/\*+)\s*kozmos-skills:\s*([\w-]+)\s*(?:[—–:-]+\s*)?(.*?)\s*(?:\*+\/)?\s*$/;

/** A reason is a sentence, not a word. */
const MIN_REASON = 12;

/**
 * The fenced blocks of a Markdown document, the CommonMark way: a fence
 * closes only on the same character, at least as long, with nothing after
 * it, so a ````markdown block holding a ```tsx example is one block, as
 * GitHub renders it. Lines are numbered from 1.
 */
export function fencedBlocks(text) {
  const blocks = [];
  let fence = null;
  text.split("\n").forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    const opens =
      marker && !fence && !(marker[1][0] === "`" && marker[2].includes("`"));
    const closes =
      marker &&
      fence &&
      marker[1][0] === fence.char &&
      marker[1].length >= fence.length &&
      !marker[2].trim();
    if (opens)
      fence = {
        char: marker[1][0],
        length: marker[1].length,
        info: marker[2].trim(),
        lang: marker[2].trim().split(/\s+/)[0].toLowerCase(),
        line: index + 1,
        body: [],
      };
    else if (closes) {
      blocks.push({ ...fence, end: index + 1, code: fence.body.join("\n") });
      fence = null;
    } else if (fence) fence.body.push(line);
  });
  if (fence) blocks.push({ ...fence, end: null, code: fence.body.join("\n") });
  return blocks;
}

/** The directive in a block's leading comment lines, if it has one. */
export function markerOf(code) {
  for (const line of code.split("\n")) {
    if (!line.trim()) continue;
    const marker = line.match(MARKER);
    if (marker) return { kind: marker[1], reason: marker[2].trim() };
    if (!/^\s*(?:\/\/|\/\*|\*)/.test(line)) return null;
  }
  return null;
}

// ------------------------------------------------------------ the checks

/** A JSX attribute's value when it is a literal the facts can judge. */
function literalOf(initializer) {
  if (!initializer) return null;
  if (ts.isStringLiteral(initializer))
    return { kind: "string", value: initializer.text };
  if (!ts.isJsxExpression(initializer) || !initializer.expression) return null;
  let e = initializer.expression;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e))
    return { kind: "string", value: e.text };
  if (ts.isNumericLiteral(e)) return { kind: "number", value: Number(e.text) };
  if (
    ts.isPrefixUnaryExpression(e) &&
    e.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(e.operand)
  )
    return { kind: "number", value: -Number(e.operand.text) };
  return null;
}

/** What a prop takes, for a message: its literals, and whatever else. */
function takes(accepted) {
  const values = axisValues(accepted).map(String);
  const also = [];
  if (accepted.openStrings) also.push("any string");
  if (accepted.openNumbers) also.push("any number");
  also.push(
    ...accepted.others.map((o) => (o.length > 80 ? `${o.slice(0, 77)}…` : o)),
  );
  if (!values.length) return also.join(" | ");
  return also.length
    ? `${values.join(" | ")}, or ${also.join(" | ")}`
    : values.join(" | ");
}

/** Checks one element's attributes against the component's facts. */
function checkAttributes(component, attributes, facts, report) {
  const known = facts.components.get(component);
  if (!known) return;
  if (known.unknown) {
    report(
      attributes,
      `<${component}>: ${known.unknown}, so its props cannot be checked`,
    );
    return;
  }
  for (const attribute of attributes.properties) {
    if (!ts.isJsxAttribute(attribute) || !ts.isIdentifier(attribute.name))
      continue;
    const name = attribute.name.text;
    // Hyphenated names (data-*, aria-*) are never checked by the compiler.
    if (name.includes("-") || name === "key" || name === "ref") continue;
    const prop = known.props.get(name);
    if (!prop) {
      if (!known.indexed)
        report(
          attribute,
          `<${component} ${name}>: ${component} has no prop ${name}`,
        );
      continue;
    }
    const value = literalOf(attribute.initializer);
    if (!value) continue;
    const accepted = prop.accepted;
    const written =
      value.kind === "string"
        ? `${name}="${value.value}"`
        : `${name}={${value.value}}`;
    if (accepted.unknown)
      report(
        attribute,
        `<${component} ${written}>: ${name}'s type does not resolve, so the value cannot be checked`,
      );
    else if (
      value.kind === "string"
        ? !accepted.openStrings && !accepted.strings.includes(value.value)
        : !accepted.openNumbers && !accepted.numbers.includes(value.value)
    )
      report(
        attribute,
        `<${component} ${written}>: ${component}'s ${name} takes ${takes(accepted)}`,
      );
  }
}

/**
 * A React tag named `Kozmos…` that the package does not export. The prefix is
 * the SwiftUI and Compose names (`KozmosButton`); React's are unprefixed
 * (`Button`), and its one prefixed export is `KozmosTheme`. A guide that
 * writes `<KozmosSkipLink>` in React has invented a component.
 */
function prefixProblem(ctx, name) {
  if (!/^Kozmos[A-Z]/.test(name)) return null;
  const react = ctx.facts.packages.get("@kozmos-ds/react")?.exports;
  if (!react || react.has(name)) return null;
  const bare = name.slice("Kozmos".length);
  return ctx.facts.components.has(bare)
    ? `<${name}>: React's components have no Kozmos prefix, which is SwiftUI's and Compose's naming; this is ${bare}`
    : `<${name}>: @kozmos-ds/react exports no ${name}, and no ${bare}`;
}

const isRelative = (specifier) => /^\.{1,2}(\/|$)|^\//.test(specifier);

/** Every workspace directory a package can be installed in. */
function installRoots(root) {
  const roots = [root];
  for (const dir of ["packages", "apps"]) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base).sort())
      if (fs.existsSync(path.join(base, name, "package.json")))
        roots.push(path.join(base, name));
  }
  return roots;
}

/**
 * A checker for one run: the facts, and what is and is not installed,
 * resolved the way TypeScript resolves a module.
 */
function context(root, facts) {
  const host = hostWith();
  const roots = [exampleDirectory(root), ...installRoots(root)];
  const resolved = new Map();
  const installed = (specifier) => {
    if (specifier.startsWith("node:") || builtinModules.includes(specifier))
      return true;
    if (!resolved.has(specifier))
      resolved.set(
        specifier,
        roots.some(
          (dir) =>
            ts.resolveModuleName(
              specifier,
              path.join(dir, "__check.ts"),
              compilerOptions,
              host,
            ).resolvedModule,
        ) ||
          // A package that ships no types still installs: look for it.
          roots.some((dir) =>
            fs.existsSync(
              path.join(
                dir,
                "node_modules",
                ...specifier
                  .split("/")
                  .slice(0, specifier.startsWith("@") ? 2 : 1),
              ),
            ),
          ),
      );
    return resolved.get(specifier);
  };
  const publicNames = [...facts.packages.keys()].join(", ");
  return { root, facts, installed, publicNames, variables: cssVariables(root) };
}

/**
 * The CSS custom properties Kozmos defines: the token stylesheets' and the
 * React stylesheet's, as built. A guide that writes
 * `var(--kozmos-color-text-primary)` names a variable nothing defines, and a
 * browser drops the declaration without a word.
 */
const STYLESHEETS = [
  "packages/tokens/dist/css/variables-light.css",
  "packages/tokens/dist/css/variables-dark.css",
  "packages/react/dist/style.css",
];
function cssVariables(root) {
  const defined = new Set();
  for (const file of STYLESHEETS) {
    const full = path.join(root, file);
    if (!fs.existsSync(full))
      throw new Error(
        `${file} is missing: build the packages first (pnpm --filter "@kozmos-ds/react..." build).`,
      );
    for (const m of fs.readFileSync(full, "utf8").matchAll(/(--[\w-]+)\s*:/g))
      defined.add(m[1]);
  }
  return defined;
}

/** Each `var(--name)` in a document that neither Kozmos nor the document defines. */
function variableProblems(ctx, text) {
  const own = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const problems = [];
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g))
    if (!ctx.variables.has(m[1]) && !own.has(m[1]))
      problems.push({
        line: lineAt(text, m.index),
        message: `uses the CSS variable ${m[1]}, which no Kozmos stylesheet defines (their names are --primitives-*, --semantics-* and --components-*)`,
      });
  return problems;
}

/** Whether a package's manifest exports `subpath` (`./style.css`, `./dist/*`). */
function exportsSubpath(manifest, subpath) {
  const map = manifest.exports;
  if (!map || typeof map !== "object") return true;
  if (Object.hasOwn(map, subpath)) return true;
  return Object.keys(map).some((key) => {
    if (!key.includes("*")) return false;
    const [before, after] = key.split("*");
    return subpath.startsWith(before) && subpath.endsWith(after);
  });
}

/**
 * What is wrong with importing `names` from `specifier`: a message, or null.
 * `names` are the exported names asked for (`default` for a default import);
 * `strict` asks that a third-party package be installed too.
 */
function importProblems(ctx, specifier, names, strict) {
  if (isRelative(specifier)) return [];
  const scoped = specifier.match(/^@(kozmos(?:-ds)?)\/([^/]+)(\/.*)?$/);
  if (scoped && scoped[1] === "kozmos")
    return [
      `imports ${specifier}: @kozmos is the scope before the rename; the packages are ${ctx.publicNames}`,
    ];
  if (scoped) {
    const name = `@kozmos-ds/${scoped[2]}`;
    const pkg = ctx.facts.packages.get(name);
    if (!pkg)
      return [
        `imports ${specifier}: ${name} is not a public package here; the public ones are ${ctx.publicNames}`,
      ];
    if (scoped[3])
      return exportsSubpath(pkg.manifest, `.${scoped[3]}`)
        ? []
        : [
            `imports ${specifier}: ${name} does not export the subpath .${scoped[3]}`,
          ];
    if (!pkg.exports) return [`imports from ${name}: ${pkg.unknown}`];
    return names
      .filter((n) => !pkg.exports.has(n))
      .map((n) =>
        n === "default"
          ? `imports ${name} as a default import; it has no default export`
          : `imports ${n} from ${name}, which does not export it`,
      );
  }
  if (strict && !ctx.installed(specifier))
    return [
      `imports ${specifier}, which is not installed anywhere in this workspace`,
    ];
  return [];
}

/**
 * The facts problems of one block, parsed as `extension`: `[{ line, message }]`,
 * lines counted within the block from 1.
 */
function checkCode(ctx, code, extension) {
  const kind = {
    ".ts": ts.ScriptKind.TS,
    ".tsx": ts.ScriptKind.TSX,
    ".js": ts.ScriptKind.JSX,
    ".jsx": ts.ScriptKind.JSX,
  }[extension];
  const source = ts.createSourceFile(
    `block${extension}`,
    code,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const problems = [];
  const report = (node, message) =>
    problems.push({
      line:
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      message,
    });

  // What each name in the block is bound to.
  const imports = new Map(); // local → { module, name }
  const declared = new Set();
  const collect = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const module = node.moduleSpecifier.text;
      const clause = node.importClause;
      const names = [];
      if (clause?.name) {
        imports.set(clause.name.text, { module, name: "default" });
        names.push("default");
      }
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings))
        imports.set(bindings.name.text, { module, name: "*" });
      else if (bindings)
        for (const element of bindings.elements) {
          const name = (element.propertyName ?? element.name).text;
          imports.set(element.name.text, { module, name });
          names.push(name);
        }
      for (const message of importProblems(ctx, module, names, true))
        report(node, message);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const names =
        node.exportClause && ts.isNamedExports(node.exportClause)
          ? node.exportClause.elements.map(
              (e) => (e.propertyName ?? e.name).text,
            )
          : [];
      for (const message of importProblems(
        ctx,
        node.moduleSpecifier.text,
        names,
        true,
      ))
        report(node, message);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) &&
        node.expression.text === "require") ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      for (const message of importProblems(
        ctx,
        node.arguments[0].text,
        [],
        true,
      ))
        report(node, message);
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isBindingElement(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)) &&
      node.name &&
      ts.isIdentifier(node.name)
    )
      declared.add(node.name.text);
    ts.forEachChild(node, collect);
  };
  collect(source);

  /** The Kozmos component a tag names, or null. */
  const componentOf = (tag) => {
    if (ts.isIdentifier(tag)) {
      const name = tag.text;
      if (!/^[A-Z]/.test(name)) return null;
      const bound = imports.get(name);
      if (bound) {
        if (bound.module === "@kozmos-ds/react" && bound.name !== "*")
          return bound.name;
        // Code inside the package imports its parts from their files.
        if (isRelative(bound.module) && ctx.facts.components.has(bound.name))
          return bound.name;
        return null;
      }
      if (declared.has(name)) return null;
      return ctx.facts.components.has(name) ? name : null;
    }
    if (
      ts.isPropertyAccessExpression(tag) &&
      ts.isIdentifier(tag.expression) &&
      imports.get(tag.expression.text)?.module === "@kozmos-ds/react" &&
      imports.get(tag.expression.text)?.name === "*"
    )
      return tag.name.text;
    return null;
  };
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const component = componentOf(node.tagName);
      if (component)
        checkAttributes(component, node.attributes, ctx.facts, report);
      const tag = node.tagName;
      if (
        ts.isIdentifier(tag) &&
        !imports.has(tag.text) &&
        !declared.has(tag.text)
      ) {
        const problem = prefixProblem(ctx, tag.text);
        if (problem) report(tag, problem);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { problems, source };
}

/** Text with the given ranges blanked out, keeping every newline. */
function blank(text, ranges) {
  // UTF-16 units, as the offsets are: an emoji is two of them.
  const chars = text.split("");
  for (const [from, to] of ranges)
    for (let i = from; i < to && i < chars.length; i++)
      if (chars[i] !== "\n") chars[i] = " ";
  return chars.join("");
}

const lineAt = (text, offset) => text.slice(0, offset).split("\n").length;

/**
 * The same checks over prose and the fences that are not TypeScript: every
 * import statement and every tag, wherever its lines break.
 */
function checkLoose(ctx, text, withoutNative = text) {
  const problems = [];
  // A Kozmos package run through npx, dlx or bunx: none provides a command,
  // so each would fetch and run whatever npm served under the name one day.
  for (const m of text.matchAll(
    /\b(npx|pnpm\s+dlx|yarn\s+dlx|bunx)\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*(@kozmos(?:-ds)?\/[\w.-]+|kozmos[\w.-]*)/g,
  ))
    problems.push({
      line: lineAt(text, m.index),
      message: `runs ${m[2]} with ${m[1].replace(/\s+/, " ")}: no Kozmos package provides a command, so it would fetch and run whatever npm served under that name`,
    });
  for (const m of withoutNative.matchAll(/<(Kozmos[A-Z]\w*)(?=[\s/>])/g)) {
    const problem = prefixProblem(ctx, m[1]);
    if (problem)
      problems.push({ line: lineAt(text, m.index), message: problem });
  }
  const IMPORT =
    /\b(import|export)\s+(?:type\s+)?(?:([\w$]+)\s*,?\s*)?(\{[^}]*\}|\*\s*as\s+[\w$]+)?\s*from\s*["']([^"'\n]+)["']/g;
  for (const m of text.matchAll(IMPORT)) {
    const names = [];
    if (m[1] === "import" && m[2] && m[2] !== "type") names.push("default");
    if (m[3]?.startsWith("{"))
      for (const part of m[3].slice(1, -1).split(",")) {
        const name = part
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)[0]
          .trim();
        if (/^[\w$]+$/.test(name)) names.push(name);
      }
    for (const message of importProblems(ctx, m[4], names, false))
      problems.push({ line: lineAt(text, m.index), message });
  }
  for (const m of text.matchAll(/\brequire\(\s*["'](@kozmos[^"']*)["']\s*\)/g))
    for (const message of importProblems(ctx, m[1], [], false))
      problems.push({ line: lineAt(text, m.index), message });

  // Tags: from each `<Name`, to the first `>` outside quotes and braces.
  for (const m of text.matchAll(/<([A-Z][\w]*)(?=[\s/>])/g)) {
    if (!ctx.facts.components.has(m[1])) continue;
    let depth = 0;
    let quote = null;
    let end = -1;
    for (
      let i = m.index + m[0].length;
      i < text.length && i < m.index + 4000;
      i++
    ) {
      const c = text[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'" || (c === "`" && depth > 0)) quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth <= 0) {
        end = i;
        break;
      } else if (c === "<" && depth <= 0) break;
    }
    if (end === -1) continue;
    const tag = text.slice(m.index, end + 1);
    const prefix = "const tag = ";
    const element = /\/\s*>$/.test(tag) ? tag : `${tag.slice(0, -1)} />`;
    const source = ts.createSourceFile(
      "tag.tsx",
      `${prefix}${element};`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    if (source.parseDiagnostics.length) continue;
    const found =
      source.statements[0]?.declarationList?.declarations[0]?.initializer;
    if (!found || !ts.isJsxSelfClosingElement(found)) continue;
    checkAttributes(m[1], found.attributes, ctx.facts, (node, message) =>
      problems.push({
        line: lineAt(text, m.index + node.getStart(source) - prefix.length),
        message,
      }),
    );
  }
  return problems;
}

/**
 * Every problem in `docs` (`[{ file, text }]`): `[{ file, line, message }]`,
 * sorted by file and line, with `stats` saying what was checked. The complete
 * blocks of all of them are compiled in one program.
 */
export function checkDocuments(root, docs, facts) {
  const ctx = context(root, facts);
  const problems = [];
  const toCompile = new Map(); // module name → { source, extension, doc, block, counterexample }
  const counterexamples = [];
  const stats = {
    blocks: 0,
    compiled: 0,
    parsed: 0,
    templates: 0,
    counterexamples: 0,
  };
  docs.forEach((doc, d) => {
    const blocks = fencedBlocks(doc.text);
    const own = [];
    const ranges = [];
    const lines = doc.text.split("\n");
    const offsetOfLine = (n) =>
      lines.slice(0, n - 1).reduce((sum, l) => sum + l.length + 1, 0);
    const fail = (line, message) => own.push({ file: doc.file, line, message });
    blocks.forEach((block, b) => {
      const extension = LANGUAGES[block.lang];
      if (!extension) return;
      stats.blocks++;
      ranges.push([
        offsetOfLine(block.line + 1),
        block.end ? offsetOfLine(block.end) : doc.text.length,
      ]);
      const first = block.line + 1; // the block's first line in the document
      const marker = markerOf(block.code);
      if (marker && !["template", "counterexample"].includes(marker.kind)) {
        fail(
          first,
          `unknown directive kozmos-skills: ${marker.kind}; a block can be a template or a counterexample`,
        );
        return;
      }
      if (marker && marker.reason.length < MIN_REASON) {
        fail(
          first,
          `a ${marker.kind} needs its reason: // kozmos-skills: ${marker.kind} — <why this block is not a whole module>`,
        );
        return;
      }
      const { problems: found, source } = checkCode(ctx, block.code, extension);
      const at = (p) => ({
        file: doc.file,
        line: first + p.line - 1,
        message: p.message,
      });
      if (marker?.kind === "counterexample") {
        stats.counterexamples++;
        counterexamples.push({ doc, first, wrong: found.length > 0 });
        if (COMPILED.has(extension))
          toCompile.set(`skills-${d}-${b}`, {
            source: block.code,
            extension,
            doc,
            first,
            counterexample: counterexamples.at(-1),
          });
        return;
      }
      own.push(...found.map(at));
      if (marker?.kind === "template") {
        stats.templates++;
        return;
      }
      if (COMPILED.has(extension)) {
        stats.compiled++;
        toCompile.set(`skills-${d}-${b}`, {
          source: block.code,
          extension,
          doc,
          first,
        });
      } else {
        stats.parsed++;
        for (const diagnostic of source.parseDiagnostics)
          fail(
            first + source.getLineAndCharacterOfPosition(diagnostic.start).line,
            `does not parse: TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
          );
      }
    });
    // HTML comments are notes and directives, not prose.
    for (const m of doc.text.matchAll(/<!--[\s\S]*?-->/g))
      ranges.push([m.index, m.index + m[0].length]);
    const native = blocks
      .filter((block) => NATIVE.has(block.lang))
      .map((block) => [
        offsetOfLine(block.line + 1),
        block.end ? offsetOfLine(block.end) : doc.text.length,
      ]);
    own.push(
      ...checkLoose(
        ctx,
        blank(doc.text, ranges),
        blank(doc.text, [...ranges, ...native]),
      ).map((p) => ({
        file: doc.file,
        ...p,
      })),
    );
    own.push(
      ...variableProblems(ctx, doc.text).map((p) => ({ file: doc.file, ...p })),
    );
    problems.push(...own);
  });

  if (toCompile.size) {
    const results = compileModules(
      root,
      new Map([...toCompile].map(([name, m]) => [name, m.source])),
      {
        extensionOf: (name) => toCompile.get(name).extension,
        options: OPTIONS,
      },
    );
    for (const [name, diagnostics] of results) {
      const module = toCompile.get(name);
      if (module.counterexample) {
        if (diagnostics.length) module.counterexample.wrong = true;
        continue;
      }
      const flagged = new Set(
        problems.filter((p) => p.file === module.doc.file).map((p) => p.line),
      );
      for (const diagnostic of diagnostics) {
        const m = diagnostic.match(/:(\d+):\d+ (TS\d+ [\s\S]*)$/);
        const line = m ? module.first + Number(m[1]) - 1 : module.first;
        if (flagged.has(line)) continue;
        problems.push({
          file: module.doc.file,
          line,
          message: `does not compile: ${m ? m[2] : diagnostic}`,
        });
      }
    }
  }
  for (const c of counterexamples)
    if (!c.wrong)
      problems.push({
        file: c.doc.file,
        line: c.first,
        message:
          "is marked a counterexample, but nothing in it is wrong: make it an example",
      });
  problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return Object.assign(problems, { stats });
}
