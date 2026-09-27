/**
 * Find classes that compile to nothing.
 *
 * A Tailwind class the build cannot generate is not an error. It is dropped
 * from the stylesheet without a word, the element renders as if it were never
 * written, and a test asserting `toHaveClass(...)` still passes because the
 * string is on the element. `bg-background/90` sat on MapControlButton like that
 * for three weeks: the control was transparent over the map, and its story centred
 * it on a white canvas, where transparent and white are the same picture.
 *
 * The cause is structural. Every colour role in packages/react/tailwind.config.js
 * is a plain `var(--…)`, and Tailwind can only apply an opacity modifier to a
 * colour it can take apart — so `bg-black/5` compiles and `bg-background/90`
 * does not, and neither says so.
 *
 * So this names nothing. It reads every string literal in packages/react/src —
 * through the TypeScript scanner, so a class mentioned in a comment is not a
 * class — takes each token carrying a slash modifier (`/50`, `/[0.35]`), and
 * asks whether the built stylesheet has a rule for it. A class assembled at
 * runtime (`bg-${tone}/50`) is skipped: no single string holds it.
 *
 * Stories, tests and Code Connect files are fixtures rather than the system
 * speaking, as in check-raw-values.mjs, and are not counted.
 *
 * The baseline is a ratchet, like check-raw-values.mjs: it fails when a number
 * goes up, and it fails when a number goes down, so a fix is locked in by
 * lowering the number here. Never raise one.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const postcss = createRequire(path.join(ROOT, "packages/react/package.json"))(
  "postcss",
);
const SRC = "packages/react/src";
const CSS = "packages/react/dist/style.css";
const problems = [];
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  problems.push(m);
  console.log(`  FAIL  ${m}`);
};

// Counts as they stood on 2026-09-17 on main at f89b734, after #47 fixed
// MapControlButton and MapControlsGroup (66/41/29 before it). Lower these as
// they are fixed.
// Three inert references were removed by the owned-CSS migration (not
// activated/fixed visually): Button secondary/ghost and Textarea placeholder.
// Token-alpha colour callbacks close the remaining 58/38/25 baseline. Keep zero.
const BASELINE = { occurrences: 0, classes: 0, files: 0 };

const FIXTURE = /\.(?:test|stories|figma)\.[jt]sx?$|[\\/]__tests__[\\/]/;

// A class carrying a slash modifier, behind any variants: `bg-muted/50`,
// `hover:ring-primary/20`, `data-[state=open]:bg-accent/10`, `w-1/2`. The
// utility must contain a hyphen — every opacity and fraction utility does — so
// an ordinary string such as "step/3" or "page/12" is never read as a class.
const SLASH_CLASS =
  /^!?(?:[^\s:]+:)*-?[a-z][a-z0-9]*-[a-z0-9-]*(?:\[[^\]\s]+\])?\/(?:\d+(?:\.\d+)?|\[[^\]\s]+\])$/;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(?:[jt]sx?|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

/** Every class name the stylesheet has a rule for, unescaped. */
function compiledClasses(css) {
  // Drop declaration blocks so only selectors remain; nothing in a selector is
  // ever inside one.
  const selectors = css.replace(/\{[^{}]*\}/g, "{}");
  const names = new Set();
  const pattern = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\[^\n]|[\w\u00a0-\uffff-])+)/g;
  for (const match of selectors.matchAll(pattern)) {
    names.add(
      match[1]
        .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) =>
          String.fromCodePoint(parseInt(hex, 16)),
        )
        .replace(/\\(.)/g, "$1"),
    );
  }
  return names;
}

/**
 * Whole tokens from one piece of a string. A template literal's pieces touch
 * `${…}` at their edges, and a token touching one is only part of a class.
 */
function tokens(text, openStart, openEnd) {
  const parts = text.split(/\s+/);
  if (openStart && !/^\s/.test(text)) parts.shift();
  if (openEnd && !/\s$/.test(text)) parts.pop();
  return parts.filter(Boolean);
}

function authoredSlashClasses(file) {
  const text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".css")) {
    const classes = [];
    postcss.parse(text, { from: file }).walkAtRules("apply", (rule) => {
      classes.push(
        ...tokens(rule.params, false, false).filter((token) =>
          SLASH_CLASS.test(token),
        ),
      );
    });
    return classes;
  }
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const found = [];
  const take = (piece, openStart, openEnd) => {
    for (const token of tokens(piece, openStart, openEnd)) {
      if (SLASH_CLASS.test(token)) found.push(token);
    }
  };
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      take(node.text, false, false);
    } else if (ts.isTemplateExpression(node)) {
      take(node.head.text, false, true);
      node.templateSpans.forEach((span, index) => {
        const last = index === node.templateSpans.length - 1;
        take(span.literal.text, true, !last);
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

console.log("Classes that compile to nothing\n");

const cssPath = path.join(ROOT, CSS);
if (!fs.existsSync(cssPath)) {
  fail(
    `${CSS} does not exist. Build it first — pnpm --filter "@kozmos-ds/react..." build — because this check reads what actually shipped, and without it every class would look absent.`,
  );
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}

const sources = walk(path.join(ROOT, SRC));
const cssTime = fs.statSync(cssPath).mtimeMs;
const newer = sources.filter((file) => fs.statSync(file).mtimeMs > cssTime);
if (newer.length > 0) {
  fail(
    `${CSS} is older than ${newer.length} source file(s), e.g. ${path.relative(ROOT, newer[0])}. Rebuild before trusting this check — a stale stylesheet answers for code that no longer exists.`,
  );
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}

const compiled = compiledClasses(fs.readFileSync(cssPath, "utf8"));
const byFile = new Map();
const inert = new Map();
let authored = 0;
let read = 0;

for (const file of sources) {
  const relative = path.relative(ROOT, file);
  if (FIXTURE.test(relative)) continue;
  read += 1;
  for (const cls of authoredSlashClasses(file)) {
    authored += 1;
    if (compiled.has(cls)) continue;
    byFile.set(relative, (byFile.get(relative) ?? 0) + 1);
    inert.set(cls, (inert.get(cls) ?? 0) + 1);
  }
}

const occurrences = [...byFile.values()].reduce((sum, n) => sum + n, 0);
const current = { occurrences, classes: inert.size, files: byFile.size };

console.log(
  `  read  ${authored} slash-modified class(es) in ${read} source file(s), fixtures aside; ${authored - occurrences} compile\n`,
);

const classDetail = [...inert.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([cls, n]) => `${cls}${n > 1 ? ` ×${n}` : ""}`)
  .join(", ");
const fileDetail = [...byFile.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([file, n]) => `${path.relative(SRC, file)} (${n})`)
  .join(", ");

const keys = ["occurrences", "classes", "files"];
const worse = keys.some((key) => current[key] > BASELINE[key]);
const better = keys.some((key) => current[key] < BASELINE[key]);
const summary = `${current.occurrences} use(s) of ${current.classes} class(es) across ${current.files} file(s)`;
const baseline = `${BASELINE.occurrences}/${BASELINE.classes}/${BASELINE.files}`;

if (worse) {
  fail(
    `${summary}, up from a baseline of ${baseline}. A class that compiles to nothing renders as if it were never written.\n          Classes: ${classDetail}\n          Files:   ${fileDetail}`,
  );
} else if (better) {
  fail(
    `${summary} — better than the baseline of ${baseline}. Lower BASELINE in this file to lock the gain in.`,
  );
} else if (current.occurrences === 0) {
  ok("every slash-modified class compiles");
} else {
  ok(`${summary}, unchanged from the baseline`);
  console.log(
    `          Classes: ${classDetail}\n          Files:   ${fileDetail}`,
  );
}

if (current.occurrences > 0) console.log(
  "  Check token-alpha.cjs and the authoring contract before adding per-component workarounds.",
);

console.log(
  `\n${problems.length === 0 ? "ok    no new class compiles to nothing" : `${problems.length} change(s) to the backlog`}`,
);
process.exit(problems.length === 0 ? 0 : 1);
