/**
 * The AI-facing documentation, checked against the code it describes.
 *
 * `.ai-skills/` is twenty-nine documents written for an assistant rather than
 * for a person: it is what gets handed to Claude when someone asks it to
 * design or build with Kozmos. Nothing verified it. `check-package-scope.mjs`
 * explicitly EXCLUDES the directory, so even the rename sweeps left it alone,
 * and it had drifted to the point of teaching things that were never true:
 *
 *   - `api-changelog.md` and `migration-guide.md` document a migration from
 *     `variant="primary"` to `variant="solid"`. Button has neither value, and
 *     never has in this repository.
 *   - both cite codemods, `button-variant-rename` and `token-migration`, that
 *     do not exist.
 *   - `getting-started.md` lists `@kozmos-ds/vue` and `@kozmos-ds/react-native`
 *     as packages to install. There are four public packages and neither is
 *     one; vue is a private internal harness.
 *   - `storybook-guide.md` teaches `<Button variant="primary">` as the
 *     canonical example.
 *
 * Wrong documentation is worse here than missing documentation, because an
 * assistant reads it as fact and writes code from it that cannot compile.
 *
 * What is checked, and only what can be checked without guessing:
 *
 *   1. `@kozmos-ds/<name>` must be a PUBLIC package in this workspace.
 *   2. `<Component variant="x">` and `size="x"` must be values that
 *      component's `cva` block actually declares — and only for components
 *      that declare one, so a prose example of a component without variants
 *      is never flagged.
 *   3. `import { X } from "@kozmos-ds/react"` must name a real export.
 *
 * Vue's `:prop="expr"` bindings are skipped: the quotes hold an expression,
 * not a value, and matching them reported `variant="variant"` as a defect.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(root, ".ai-skills");
const REACT = path.join(root, "packages/react/src/components");

const problems = [];
const fail = (file, line, message) =>
  problems.push(`${path.basename(file)}:${line}  ${message}`);

/** Public packages in the workspace. A private one is not installable. */
const publicPackages = new Set();
for (const dir of ["packages", "apps"]) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  for (const name of fs.readdirSync(base)) {
    const manifest = path.join(base, name, "package.json");
    if (!fs.existsSync(manifest)) continue;
    const json = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (json.name && !json.private) publicPackages.add(json.name);
  }
}

/**
 * Each component's axes — the same extraction the inventory generator uses,
 * so the gate and the generated document cannot disagree about what a
 * component accepts. Reading only cva blocks saw three components; reading a
 * union given a name as well sees most of the library.
 */
const axes = new Map();
const ALIAS_RE = /^(?:export )?type (\w+)\s*=\s*((?:\s*\|?\s*["'][^"']+["'])+)\s*;/gm;
for (const name of fs.readdirSync(REACT)) {
  const file = path.join(REACT, name, `${name}.tsx`);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  const found = {};

  const cva = /variants:\s*\{([\s\S]*?)\n\s{2}\},?\n/.exec(source);
  if (cva)
    for (const axis of ["variant", "size", "status", "tone", "density"]) {
      const block = new RegExp(
        `^\\s{4}${axis}:\\s*\\{([\\s\\S]*?)^\\s{4}\\},?$`,
        "m",
      ).exec(cva[1]);
      if (!block) continue;
      const values = [...block[1].matchAll(/^\s{6}["']?([\w-]+)["']?:/gm)].map(
        (m) => m[1],
      );
      if (values.length) found[axis] = values;
    }

  const aliases = {};
  for (const a of source.matchAll(ALIAS_RE)) {
    const values = [...a[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
    if (values.length > 1) aliases[a[1]] = values;
  }
  const props =
    source.match(new RegExp(`export interface ${name}Props[\\s\\S]*?\\n\\}`)) ??
    source.match(new RegExp(`interface ${name}Props[\\s\\S]*?\\n\\}`));
  if (props)
    for (const m of props[0].matchAll(/^\s+([a-zA-Z][a-zA-Z0-9]*)\??:\s*(.+?);$/gm)) {
      const inline = [...m[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
      if (inline.length > 1) found[m[1]] = inline;
      else if (aliases[m[2].trim()]) found[m[1]] = aliases[m[2].trim()];
    }

  if (Object.keys(found).length) axes.set(name, found);
}

// `IconButtonProps = ButtonProps`: it takes every one of Button's values.
const dts = fs.existsSync(path.join(root, "packages/react/dist/index.d.ts"))
  ? fs.readFileSync(path.join(root, "packages/react/dist/index.d.ts"), "utf8")
  : "";
for (const m of dts.matchAll(/export declare type (\w+)Props = (\w+)Props;/g))
  if (!axes.has(m[1]) && axes.has(m[2])) axes.set(m[1], axes.get(m[2]));

/** What `@kozmos-ds/react` actually exports. */
const exportsOfReact = new Set();
const indexPath = path.join(root, "packages/react/src/index.ts");
if (fs.existsSync(indexPath)) {
  for (const m of fs
    .readFileSync(indexPath, "utf8")
    .matchAll(/export \* from "\.\/components\/(\w+)"/g))
    exportsOfReact.add(m[1]);
  for (const name of fs.readdirSync(REACT)) exportsOfReact.add(name);
}

const files = fs.existsSync(SKILLS)
  ? fs.readdirSync(SKILLS).filter((f) => f.endsWith(".md"))
  : [];

for (const file of files) {
  const full = path.join(SKILLS, file);
  const text = fs.readFileSync(full, "utf8");
  // A document may declare itself a specification for something not yet
  // built, and then its package names are allowed to be aspirational. The
  // marker lives in the document, not in a list here, so a reader sees the
  // exception at the same time as the claim — a silent allowlist in this file
  // is how the drift got in.
  const isSpec = /<!--\s*kozmos-skills:\s*specification\s*-->/.test(text);
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    const at = index + 1;

    // Only where the name is presented as something to INSTALL or IMPORT.
    // Prose that mentions a package in order to say it is private — which the
    // generated inventory does — is not a defect, and flagging it made the
    // gate fail on its own generated output.
    const installing =
      /\b(npm|pnpm|yarn|bun)\s+(i|add|install)\b/.test(line) ||
      /\bfrom\s*["']@kozmos-ds\//.test(line) ||
      /\brequire\(\s*["']@kozmos-ds\//.test(line) ||
      /^\s*["']@kozmos-ds\/[a-z0-9-]+["']\s*:/.test(line) ||
      /^\s*@kozmos-ds\/[a-z0-9-]+\s+-/.test(line);
    if (installing && !isSpec) {
      for (const m of line.matchAll(/@kozmos-ds\/([a-z0-9-]+)/g)) {
        const name = `@kozmos-ds/${m[1]}`;
        if (!publicPackages.has(name))
          fail(
            full,
            at,
            `offers ${name} to install or import; it is not a public package here`,
          );
      }
    }

    // `<Component ... prop="value">`, skipping Vue's `:prop="expr"`.
    const tag = /<([A-Z]\w+)([^>]*)>/.exec(line);
    if (tag && axes.has(tag[1])) {
      const declared = axes.get(tag[1]);
      for (const axis of Object.keys(declared)) {
        const attr = new RegExp(`(?<!:)\\b${axis}=["']([\\w-]+)["']`).exec(
          tag[2],
        );
        if (attr && !declared[axis].includes(attr[1]))
          fail(
            full,
            at,
            `<${tag[1]} ${axis}="${attr[1]}"> — ${tag[1]} declares ${axis}: ${declared[axis].join(" | ")}`,
          );
      }
    }

    const imports = /import\s*\{([^}]+)\}\s*from\s*["']@kozmos-ds\/react["']/.exec(
      line,
    );
    if (imports) {
      for (const raw of imports[1].split(",")) {
        const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
        if (!name || !/^[A-Z]/.test(name)) continue;
        if (!exportsOfReact.has(name))
          fail(full, at, `imports ${name} from @kozmos-ds/react, which does not export it`);
      }
    }
  });
}

if (problems.length) {
  console.error(
    `The AI-facing docs describe code that does not exist: ${problems.length} problem(s)\n`,
  );
  for (const p of problems) console.error("  " + p);
  console.error(
    "\nThese files are what an assistant is given as fact about Kozmos." +
      "\nFix the document, or the code if the document is right.",
  );
  process.exit(1);
}

console.log(
  `AI-facing docs ok: ${files.length} file(s) checked against ` +
    `${publicPackages.size} public packages, ${axes.size} components' variants ` +
    `and ${exportsOfReact.size} exports.`,
);
