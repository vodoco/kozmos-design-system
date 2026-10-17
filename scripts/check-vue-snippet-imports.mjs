/**
 * Verify that every Vue tab on the docs pages imports only what
 * `@kozmos-ds/vue` exports.
 *
 * The docs pages draw their code tabs with `<PlatformSnippets>`, and each
 * `vue={`…`}` tab is a template literal in an `.mdx`. `@kozmos-ds/vue` is a
 * private harness that wraps the React components as `KozmosButton`,
 * `KozmosToast` and so on. On 16 Oct 2026, 14 of its 80 tabs imported names it
 * has never exported — `Accordion`, `AlertTitle`, `RadioGroupItem`, a
 * `useToast` that exists nowhere — copied from another library. The doc
 * snippet check passed them all: it looks only at `Kozmos*` identifiers, and
 * none of those names begins with Kozmos.
 *
 * So this check reads the harness's exports from its source, with the
 * TypeScript parser (`export const`, `export function`, `export { … }`,
 * `export … from` and `export * from`, followed into the module it names), and
 * holds every named import from `@kozmos-ds/vue` in every Vue tab to them,
 * taking an `as` rename by the exported name. A `Kozmos*` tag the tab's
 * template draws must also be imported: Drawer's tab drew a `KozmosButton` it
 * never imported. A default or namespace import fails too, since the harness
 * has no default export and a namespace hides which parts the tab uses.
 *
 * A tab imports from nothing else. Every module its script names (an `import`
 * or `export … from`, an `import x = require(…)`, a dynamic `import(…)` or a
 * `require(…)`) must be `@kozmos-ds/vue` or `vue`: examples use only Kozmos
 * (AGENTS.md). On 17 Oct 2026 IconButton's tab took its icon from
 * `lucide-vue-next`, a library Kozmos does not use and the workspace does not
 * install, so the tab could not even mount, and this check passed it: it read
 * only the imports from `@kozmos-ds/vue`. There is no allow-list, since no tab
 * needs another module; add one to MODULES, with the reason beside it, only
 * when one does. Each module the tab's text names in an import is counted
 * against the imports the parser read, so an import the parse missed fails
 * instead of passing unread.
 *
 * It fails when it finds no tab or no import, so a page that moved or a parse
 * that matched nothing cannot pass by checking nothing.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { extractSnippets } from "./lib/doc-snippets.mjs";

const ROOT = process.cwd();
const PACKAGE = "@kozmos-ds/vue";
// The only modules a Vue tab may import from: the Kozmos harness, and Vue for
// `ref` and the like. Nothing else is allowed today; see the header.
const MODULES = [PACKAGE, "vue"];
// A module the tab's text names in an import, export … from, import(…) or
// require(…), counted against what the parser read.
const WRITTEN =
  /\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']|\b(?:import|require)\s*\(\s*["']([^"']+)["']/g;
const ENTRY = path.join(ROOT, "packages/vue/src/index.ts");
const DOC_ROOTS = ["packages/react/src/components", "apps/docs/stories"];

function fail(message) {
  console.error(`Vue snippet import check failed: ${message}`);
  process.exit(1);
}

function hasModifier(node, kind) {
  return (ts.getModifiers?.(node) ?? node.modifiers ?? []).some(
    (modifier) => modifier.kind === kind,
  );
}

function resolveModule(fromFile, specifier) {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
      return candidate;
  }
  return undefined;
}

/** The value names a module exports, following `export * from` into its own files. */
function valueExports(file, seen = new Set()) {
  if (seen.has(file)) return new Set();
  seen.add(file);
  const names = new Set();
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  for (const statement of source.statements) {
    const exported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
    if (exported && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    } else if (
      exported &&
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword))
        names.add("default");
      else names.add(statement.name.text);
    } else if (ts.isExportAssignment(statement)) {
      names.add("default");
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const clause = statement.exportClause;
      if (!clause) {
        // export * from "./module"
        const target = resolveModule(file, statement.moduleSpecifier.text);
        if (!target)
          fail(
            `${path.relative(ROOT, file)} re-exports everything from "${statement.moduleSpecifier.text}", which this check cannot read`,
          );
        for (const name of valueExports(target, seen)) {
          if (name !== "default") names.add(name);
        }
      } else if (ts.isNamespaceExport(clause)) {
        names.add(clause.name.text);
      } else {
        for (const element of clause.elements) {
          if (!element.isTypeOnly) names.add(element.name.text);
        }
      }
    }
  }
  return names;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/** `kozmos-button` and `KozmosButton` are the same component in a Vue template. */
function pascal(tag) {
  return tag.includes("-")
    ? tag
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    : tag;
}

if (!fs.existsSync(ENTRY)) fail(`${path.relative(ROOT, ENTRY)} does not exist`);
const exported = valueExports(ENTRY);
if (!exported.size)
  fail(`${path.relative(ROOT, ENTRY)} exports nothing this check can read`);

const problems = [];
const tabsPerRoot = {};
let tabCount = 0;
let importCount = 0;
let tagCount = 0;
let referenceCount = 0;
const moduleCounts = new Map();

for (const docRoot of DOC_ROOTS) {
  tabsPerRoot[docRoot] = 0;
  for (const file of walk(path.join(ROOT, docRoot))) {
    const relative = path.relative(ROOT, file);
    const snippets = extractSnippets(fs.readFileSync(file, "utf8"), relative);
    for (const { platform, code, codeLine } of snippets) {
      if (platform !== "vue") continue;
      tabCount += 1;
      tabsPerRoot[docRoot] += 1;

      const imported = new Set();
      const read = new Map();
      for (const script of code.matchAll(
        /<script\b[^>]*>([\s\S]*?)<\/script>/g,
      )) {
        const scriptLine =
          codeLine + code.slice(0, script.index).split("\n").length - 1;
        const body = ts.createSourceFile(
          "tab.ts",
          script[1],
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );
        const lineOf = (node) =>
          scriptLine +
          body.getLineAndCharacterOfPosition(node.getStart(body)).line;

        // Every module the script names, wherever it names it.
        const reference = (module, node, how) => {
          read.set(module, (read.get(module) ?? 0) + 1);
          moduleCounts.set(module, (moduleCounts.get(module) ?? 0) + 1);
          referenceCount += 1;
          if (!MODULES.includes(module))
            problems.push(
              `${relative}:${lineOf(node)}: ${how} "${module}", which is not Kozmos: a Vue tab imports only from ${MODULES.join(" and ")}`,
            );
        };
        const visit = (node) => {
          if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (
              node.moduleSpecifier &&
              ts.isStringLiteral(node.moduleSpecifier)
            )
              reference(
                node.moduleSpecifier.text,
                node,
                ts.isImportDeclaration(node)
                  ? "imports from"
                  : "re-exports from",
              );
          } else if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference) &&
            ts.isStringLiteral(node.moduleReference.expression)
          ) {
            reference(
              node.moduleReference.expression.text,
              node,
              "imports from",
            );
          } else if (
            ts.isCallExpression(node) &&
            (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
              (ts.isIdentifier(node.expression) &&
                node.expression.text === "require"))
          ) {
            const target = node.arguments[0];
            if (target && ts.isStringLiteralLike(target))
              reference(target.text, node, "loads");
            else
              problems.push(
                `${relative}:${lineOf(node)}: loads a module it does not name; a Vue tab imports only from ${MODULES.join(" and ")}`,
              );
          }
          ts.forEachChild(node, visit);
        };
        visit(body);

        for (const statement of body.statements) {
          if (
            !ts.isImportDeclaration(statement) ||
            statement.moduleSpecifier.text !== PACKAGE
          )
            continue;
          const line = lineOf(statement);
          const clause = statement.importClause;
          if (!clause) continue;
          if (clause.name) {
            importCount += 1;
            problems.push(
              `${relative}:${line}: imports ${clause.name.text} as the default export of ${PACKAGE}, which has none`,
            );
          }
          const bindings = clause.namedBindings;
          if (bindings && ts.isNamespaceImport(bindings)) {
            importCount += 1;
            problems.push(
              `${relative}:${line}: imports ${PACKAGE} as a namespace (${bindings.name.text}); name each part the tab uses`,
            );
          } else if (bindings) {
            for (const element of bindings.elements) {
              importCount += 1;
              const name = (element.propertyName ?? element.name).text;
              imported.add(element.name.text);
              if (!exported.has(name)) {
                const shown = element.propertyName
                  ? `${name} as ${element.name.text}`
                  : name;
                problems.push(
                  `${relative}:${line}: imports { ${shown} } from ${PACKAGE}, which does not export ${name}`,
                );
              }
            }
          }
        }
      }

      // A parse that missed an import must not pass as a tab that has none.
      const written = new Map();
      for (const match of code.matchAll(WRITTEN)) {
        const module = match[1] ?? match[2] ?? match[3];
        written.set(module, (written.get(module) ?? 0) + 1);
      }
      for (const module of new Set([...written.keys(), ...read.keys()])) {
        const named = written.get(module) ?? 0;
        const parsed = read.get(module) ?? 0;
        if (named !== parsed)
          problems.push(
            `${relative}:${codeLine}: the tab names "${module}" in ${named} import(s), but ${parsed} could be read`,
          );
      }

      const template = code.match(/<template\b[^>]*>([\s\S]*)<\/template>/);
      if (!template) continue;
      const templateLine =
        codeLine + code.slice(0, template.index).split("\n").length - 1;
      const drawn = new Set();
      for (const tag of template[1].matchAll(
        /<(Kozmos[A-Za-z0-9]*|kozmos-[a-z0-9-]+)\b/g,
      )) {
        const name = pascal(tag[1]);
        if (drawn.has(name)) continue;
        drawn.add(name);
        tagCount += 1;
        if (!imported.has(name)) {
          const line =
            templateLine +
            template[1].slice(0, tag.index).split("\n").length -
            1;
          problems.push(
            `${relative}:${line}: draws <${tag[1]}> but does not import it from ${PACKAGE}`,
          );
        }
      }
    }
  }
}

if (!tabCount) fail(`no Vue tab was found under ${DOC_ROOTS.join(" or ")}`);
if (!importCount)
  fail(`${tabCount} Vue tab(s) were found, but none imports from ${PACKAGE}`);

const where = DOC_ROOTS.map((root) => `${tabsPerRoot[root]} in ${root}`).join(
  ", ",
);
const modules = [...moduleCounts]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([module, count]) => `${module} ${count}`)
  .join(", ");
const compared = `${tabCount} Vue tab(s) (${where}): ${referenceCount} module reference(s) (${modules}) against the ${MODULES.length} a tab may import from (${MODULES.join(", ")}), ${importCount} import(s) from ${PACKAGE} against its ${exported.size} exports, and ${tagCount} Kozmos tag(s) against the tab's own imports`;

if (problems.length) {
  console.error(
    `Vue snippet import check failed: ${problems.length} problem(s) in ${compared}.`,
  );
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`Vue snippet imports match ${PACKAGE}: ${compared}.`);
