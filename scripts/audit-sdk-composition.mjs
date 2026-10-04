import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const components = "packages/react/src/components";
const excluded = /\.(test|stories|figma)\./;
const nativeControls = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "a",
  "summary",
]);

// Explicit architecture audit scope: moving a story must never remove checks.
// The catalogue preserves the union audited before the sidebar reorganisation.
export function sdkComponentNames() {
  const catalogue = JSON.parse(
    fs.readFileSync(
      path.join(root, "scripts/storybook/catalogue.json"),
      "utf8",
    ),
  );
  const names = new Set(catalogue.auditSdkComponents);
  // New SDK pages automatically join the audit, but moving an old page to Core
  // does not certify that its implementation was migrated.
  catalogue.entries
    .filter((entry) => entry.title.startsWith("SDK/") && entry.component)
    .forEach((entry) => names.add(entry.component));
  return [...names].sort();
}

export function webFindings(source, filename = "component.tsx") {
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings = [];
  const aliases = new Map();
  const factories = new Set();
  const reactNamespaces = new Set();
  function bindings(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      aliases.set(node.name.text, node.initializer.text);
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "react"
    ) {
      if (node.importClause?.name)
        reactNamespaces.add(node.importClause.name.text);
      const named = node.importClause?.namedBindings;
      if (named && ts.isNamespaceImport(named))
        reactNamespaces.add(named.name.text);
      if (named && ts.isNamedImports(named))
        for (const item of named.elements)
          if ((item.propertyName ?? item.name).text === "createElement")
            factories.add(item.name.text);
    }
    ts.forEachChild(node, bindings);
  }
  bindings(ast);
  const add = (node, kind, detail) =>
    findings.push({
      line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      kind,
      detail,
    });
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const writtenTag = node.tagName.getText(ast);
      const tag = aliases.get(writtenTag) ?? writtenTag;
      if (nativeControls.has(tag)) add(node, "native-control", tag);
      if (/^[a-z]/.test(tag)) {
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) continue;
          const name = attr.name.getText(ast);
          if (
            /^on(Click|KeyDown|KeyUp|PointerDown|PointerUp|MouseDown|TouchStart)$/.test(
              name,
            ) &&
            !nativeControls.has(tag)
          ) {
            add(attr, "custom-interaction", `${tag}.${name}`);
          }
          if (
            name === "role" &&
            attr.initializer &&
            ts.isStringLiteral(attr.initializer) &&
            [
              "button",
              "checkbox",
              "radio",
              "switch",
              "slider",
              "combobox",
              "option",
              "tab",
            ].includes(attr.initializer.text) &&
            !nativeControls.has(tag)
          )
            add(
              attr,
              "custom-interaction",
              `${tag}.role=${attr.initializer.text}`,
            );
        }
      }
    }
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const isFactory =
        (ts.isIdentifier(expression) && factories.has(expression.text)) ||
        (ts.isPropertyAccessExpression(expression) &&
          expression.name.text === "createElement" &&
          reactNamespaces.has(expression.expression.getText(ast)));
      const tag = node.arguments[0];
      if (
        isFactory &&
        tag &&
        ts.isStringLiteral(tag) &&
        nativeControls.has(tag.text)
      )
        add(node, "native-control", tag.text);
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      if (node.moduleSpecifier.text.startsWith("@radix-ui/"))
        add(node, "direct-primitive", node.moduleSpecifier.text);
      if (
        node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        for (const item of node.importClause.namedBindings.elements) {
          const name = (item.propertyName ?? item.name).text;
          if (["buttonVariants", "inputVariants"].includes(name))
            add(item, "style-only-reuse", name);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return findings;
}

function sourceFiles(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(name, extension)
      : (Array.isArray(extension) ? extension : [extension]).some((suffix) =>
            entry.name.endsWith(suffix),
          ) &&
          !excluded.test(entry.name) &&
          !entry.name.endsWith(".d.ts")
        ? [name]
        : [];
  });
}

/** Follow implementation helpers, stopping at another component's ownership boundary.
 * This is a discovery graph, not a TypeScript type-checker or a universal layer gate.
 */
export function implementationGraph(
  directory,
  componentRoot = path.join(root, components),
  entryFiles,
) {
  const extensions = [".tsx", ".ts", ".jsx", ".js"];
  const files = new Set(),
    boundaries = [],
    unresolved = [];
  const queue = entryFiles
    ? [...entryFiles]
    : sourceFiles(directory, extensions);
  const owner = path.relative(componentRoot, directory).split(path.sep)[0];
  function resolveRelative(file, specifier) {
    const base = path.resolve(path.dirname(file), specifier);
    const stem = base.replace(/\.[cm]?jsx?$/, "");
    const candidates = [
      base,
      ...extensions.map((extension) => stem + extension),
      ...extensions.map((extension) => path.join(base, "index" + extension)),
    ];
    return candidates.find(
      (candidate) =>
        fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
  }
  while (queue.length) {
    const file = queue.shift();
    if (files.has(file)) continue;
    files.add(file);
    const ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isCallExpression(node) &&
              (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                (ts.isIdentifier(node.expression) &&
                  node.expression.text === "require"))
            ? node.arguments[0]
            : undefined;
      if (
        specifier &&
        ts.isStringLiteral(specifier) &&
        specifier.text.startsWith(".")
      ) {
        const target = resolveRelative(file, specifier.text);
        const dependency = { from: file, specifier: specifier.text, target };
        if (!target) unresolved.push(dependency);
        else if (
          extensions.some((extension) => target.endsWith(extension)) &&
          !target.endsWith(".d.ts")
        ) {
          const relative = path.relative(componentRoot, target);
          const otherComponent =
            !relative.startsWith(".." + path.sep) &&
            !path.isAbsolute(relative) &&
            relative.split(path.sep)[0] !== owner;
          if (otherComponent) boundaries.push(dependency);
          else if (!files.has(target)) queue.push(target);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  return { files: [...files].sort(), boundaries, unresolved };
}

export function audit() {
  return sdkComponentNames().map((name) => {
    const platforms = {};
    for (const [platform, directory, extension] of [
      ["react", `${components}/${name}`, ".tsx"],
      ["ios", `packages/ios/Sources/Components/${name}`, ".swift"],
      [
        "android",
        `packages/android/src/main/java/com/kozmos/components/${name}`,
        ".kt",
      ],
    ]) {
      const graph =
        platform === "react"
          ? implementationGraph(path.join(root, directory))
          : null;
      const files =
        graph?.files ?? sourceFiles(path.join(root, directory), extension);
      platforms[platform] = {
        present: files.length > 0,
        ...(graph
          ? {
              dependencies: graph.boundaries.map((edge) => ({
                ...edge,
                from: path.relative(root, edge.from),
                target: path.relative(root, edge.target),
              })),
              unresolved: graph.unresolved.map((edge) => ({
                ...edge,
                from: path.relative(root, edge.from),
              })),
            }
          : {}),
        files: files.map((file) => {
          const source = fs.readFileSync(file, "utf8");
          // Native results are review candidates, not parser-proven violations.
          // In particular, noninteractive Surface and decorative geometry are legal.
          const pattern =
            platform === "ios"
              ? /\b(?:Button|TextField|SecureField|Toggle|Picker|Slider|ProgressView)\s*[(<{]|\.onTapGesture/g
              : /\b(?:Button|IconButton|TextButton|OutlinedButton|TextField|BasicTextField|Surface|Checkbox|RadioButton|Switch|CircularProgressIndicator|LinearProgressIndicator)\s*\(|\.(?:clickable|combinedClickable|pointerInput)\s*\(/g;
          const findings =
            platform === "react"
              ? webFindings(source, file)
              : [...source.matchAll(pattern)].map((match) => ({
                  line: source.slice(0, match.index).split("\n").length,
                  kind: "native-review-candidate",
                  detail: match[0],
                }));
          return { file: path.relative(root, file), findings };
        }),
      };
    }
    return { name, platforms };
  });
}

/** Contextual examples are consumers, not an exemption from Core composition.
 * Follow relative helpers; dependency boundaries are covered by the SDK audit.
 */
export function auditExamples() {
  const catalogue = JSON.parse(
    fs.readFileSync(
      path.join(root, "scripts/storybook/catalogue.json"),
      "utf8",
    ),
  );
  const sdk = new Set(sdkComponentNames());
  return catalogue.entries
    .filter(
      (entry) =>
        entry.title.startsWith("Examples/") ||
        entry.title.startsWith("Guides/Design gap references/") ||
        entry.title.startsWith("SDK/") ||
        sdk.has(entry.component),
    )
    .map((entry) => {
      const file = path.join(root, entry.file);
      const graph = implementationGraph(
        path.dirname(file),
        path.join(root, components),
        [file],
      );
      return {
        title: entry.title,
        entry: entry.file,
        files: graph.files.map((file) => ({
          file: path.relative(root, file),
          findings: webFindings(fs.readFileSync(file, "utf8"), file),
        })),
        dependencies: graph.boundaries.map((edge) => ({
          from: path.relative(root, edge.from),
          target: path.relative(root, edge.target),
        })),
        unresolved: graph.unresolved.map((edge) => ({
          from: path.relative(root, edge.from),
          specifier: edge.specifier,
        })),
      };
    });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--examples")) {
    const result = auditExamples();
    console.log(JSON.stringify(result, null, 2));
  } else {
    const result = audit();
    if (process.argv.includes("--json"))
      console.log(JSON.stringify(result, null, 2));
    else {
      for (const component of result) {
        console.log(component.name);
        for (const [platform, value] of Object.entries(component.platforms)) {
          if (!value.present) console.log(`  ${platform}: no implementation`);
          for (const file of value.files)
            for (const hit of file.findings) {
              console.log(
                `  ${file.file}:${hit.line} ${hit.kind}: ${hit.detail}`,
              );
            }
          for (const dependency of value.unresolved ?? [])
            console.log(
              `  UNRESOLVED ${dependency.from}: ${dependency.specifier}`,
            );
        }
      }
      console.log(
        `${result.length} SDK/shared component families inspected. Candidates require review; this is not a compliance verdict.`,
      );
    }
  }
}
