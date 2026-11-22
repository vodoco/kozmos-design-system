// node scripts/check-code-connect-snippets.mjs [--from <parse.json>]
//
// Every React snippet Dev Mode shows compiles. `figma connect parse` and
// `publish --dry-run` only say a file is well formed; Figma then runs each
// document's template and shows what it returns. On 22 Nov 2026 the read-back
// after 0.17.0's publish showed snippets a developer could not paste: Table's
// used a `density` it never declared, DescriptionList's copy action drew an
// IconButton it did not import, and POIMediaGallery's threw in the template
// itself. Every check had passed.
//
// This renders each document as Dev Mode does (scripts/lib/code-connect-render.mjs),
// at its first variant and at each other enum value and boolean, writes each
// distinct snippet with the document's own imports, and type-checks them
// against the built packages (build React and what it needs first). A nested
// instance renders as an empty fragment: its own document brings its code and
// imports. Without --from it parses the linked configuration itself, which
// needs no Figma token.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDocument } from "./lib/code-connect-render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");

const args = process.argv.slice(2);
const fromIndex = args.indexOf("--from");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-cc-snippets-"));
let parsePath = fromIndex >= 0 ? path.resolve(args[fromIndex + 1]) : null;
if (!parsePath) {
  parsePath = path.join(work, "react.json");
  execFileSync(
    "pnpm",
    [
      "--filter",
      "@kozmos-ds/react",
      "exec",
      "figma",
      "connect",
      "parse",
      "--config",
      path.join(root, "figma.linked.config.json"),
      "--skip-update-check",
      "--outFile",
      parsePath,
    ],
    { cwd: root, stdio: ["ignore", "ignore", "pipe"] },
  );
}
const docs = JSON.parse(fs.readFileSync(parsePath, "utf8"));
if (!Array.isArray(docs) || docs.length === 0) {
  console.error(`${parsePath} holds no Code Connect documents`);
  process.exit(1);
}

const dist = (pkg, file) => path.join(root, "packages", pkg, "dist", file);
for (const file of [
  dist("react", "index.d.mts"),
  dist("react", "dashboard/index.d.mts"),
  dist("icons", "index.d.mts"),
]) {
  if (!fs.existsSync(file)) {
    console.error(
      `${path.relative(root, file)} is missing: run pnpm --filter "@kozmos-ds/react..." build first`,
    );
    process.exit(1);
  }
}

const problems = [];
const LEAKS = [
  [/\bfigma\.[a-zA-Z]+\(/, "Code Connect's own code as text"],
  [
    /\[\s*undefined\s*[,\]]|,\s*undefined\s*[,\]]/,
    "an array of undefined values",
  ],
];
const files = new Map();
const node = (doc) => doc.figmaNode.match(/node-id=([0-9-]+)/)?.[1] ?? "?";
docs.forEach((doc, index) => {
  const label = `${doc.component} (${node(doc)}${doc.variant ? ` ${JSON.stringify(doc.variant)}` : ""})`;
  const imports = (doc.templateData?.imports ?? []).join("\n");
  renderDocument(doc).forEach((rendered, n) => {
    const at = JSON.stringify(rendered.assignment);
    if (rendered.error) {
      problems.push(
        `${label} at ${at}: the template throws: ${rendered.error}`,
      );
      return;
    }
    const code = rendered.code.trim();
    // What compiles can still be wrong: Code Connect writes a property it
    // cannot read (`figma.slot(…) ?? figma.children(…)`) into the snippet as
    // text, and an array of `figma.string`s inside another mapping as
    // `undefined`s.
    for (const [pattern, words] of LEAKS)
      if (pattern.test(code))
        problems.push(`${label} at ${at}: the snippet shows ${words}`);
    const declared = /^function\s+([A-Za-z_$][\w$]*)/.exec(code);
    const body = declared
      ? `${code}\nexport { ${declared[1]} };\n`
      : `export function Snippet() {\n  return (\n    <>\n${code}\n    </>\n  );\n}\n`;
    const file = path.join(work, `doc-${index}-${n}.tsx`);
    fs.writeFileSync(file, `${imports}\n\n${body}`);
    files.set(file, {
      label,
      at,
      code,
      props: new Set(Object.keys(doc.templateData?.props ?? {})),
    });
  });
});

const reactTypes = path.join(root, "packages/react/node_modules/@types");
const program = ts.createProgram([...files.keys()], {
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  typeRoots: [reactTypes],
  types: ["react"],
  baseUrl: root,
  paths: {
    "@kozmos-ds/react": [dist("react", "index.d.mts")],
    "@kozmos-ds/react/dashboard": [dist("react", "dashboard/index.d.mts")],
    "@kozmos-ds/icons": [dist("icons", "index.d.mts")],
    react: [path.join(reactTypes, "react/index.d.ts")],
    "react/jsx-runtime": [path.join(reactTypes, "react/jsx-runtime.d.ts")],
  },
});
// An unknown name is one of three things. A component or an icon (it starts
// with a capital) the snippet does not import is a defect. A property the
// document maps (a key of its `props`) left in the snippet is a defect: Code
// Connect substitutes a property only where the example's JSX uses it, so one
// used in a statement or a computed value reaches Dev Mode as a bare name.
// Any other lower-case name is the host's own data or handler, as an SDK
// part's `poi` or `selectPoi`, which a product supplies: a placeholder, by
// design, and counted, not failed. Every other compiler error is a defect.
const UNKNOWN_NAME = new Set([2304, 2552, 18004]);
const byDoc = new Map();
const placeholders = new Set();
const add = (label, message) => {
  if (!byDoc.has(label)) byDoc.set(label, new Set());
  byDoc.get(label).add(message);
};
for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
  const source = diagnostic.file && files.get(diagnostic.file.fileName);
  const message = ts
    .flattenDiagnosticMessageText(diagnostic.messageText, "\n")
    .split("\n")[0];
  if (!source) {
    problems.push(`outside the snippets: ${message}`);
    continue;
  }
  if (UNKNOWN_NAME.has(diagnostic.code)) {
    const name = /'([^']+)'/.exec(message)?.[1] ?? "";
    if (/^[A-Z]/.test(name)) add(source.label, `${name} is not imported`);
    else if (source.props.has(name))
      add(source.label, `the mapped property ${name} is not substituted`);
    else placeholders.add(name);
    continue;
  }
  add(source.label, message);
}
for (const [label, messages] of byDoc)
  problems.push(`${label}: ${[...messages].join("; ")}`);

if (problems.length) {
  console.error(
    `${problems.length} Code Connect document(s) show a snippet that does not compile:\n${problems.map((p) => `- ${p}`).join("\n")}`,
  );
  process.exit(1);
}
console.log(
  `Every React Code Connect snippet compiles: ${files.size} snippets from ${docs.length} documents, with ${placeholders.size} host placeholders (${[...placeholders].sort().join(", ")}).`,
);
