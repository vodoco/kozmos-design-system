/**
 * A token that is a bare number is not a length.
 *
 * `height: var(--primitives-layout-spacing-200)` is invalid CSS — the token is
 * `16`, and a bare number is not a `<length>` — so the browser drops the
 * declaration without a word. GAP-38 lived in three such declarations for as
 * long as `AdaptiveMapShell` has existed: the map sheet's drag handle asked for
 * a 16px row holding a 40px grip and drew a 4px row holding nothing, in every
 * engine. No test caught it, because the package's browser fixtures had no
 * doctype and quirks mode accepts a unitless length.
 *
 * This reads the token values the build emits and reports any that reach a
 * length without `calc(… * 1px)`, in three places, because the bug has three
 * ways in: a property that takes a length; a length-taking function inside a
 * property whose name says nothing (`backdrop-filter: blur(…)`); and a
 * Tailwind arbitrary value, which never reaches a stylesheet as CSS.
 *
 * Every `.css` and `.ts`/`.tsx` under the React package's `src` is read, not a
 * named list, so a stylesheet added tomorrow is covered without anyone
 * remembering. The deciding is in `scripts/lib/unitless-tokens.mjs`, and
 * `scripts/lib/unitless-tokens.test.mjs` holds its controls.
 *
 *   pnpm tokens:unitless:check
 */
import fs from "node:fs";
import path from "node:path";
import {
  findUnitlessLengths,
  unitlessTokensFrom,
} from "./lib/unitless-tokens.mjs";

const ROOT = process.cwd();
const TOKEN_CSS = [
  "packages/tokens/dist/css/variables-light.css",
  "packages/tokens/dist/css/variables-dark.css",
];
const SRC = "packages/react/src";

for (const rel of TOKEN_CSS) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.error(`Cannot read ${rel}. Build the tokens first: pnpm tokens:build`);
    process.exit(1);
  }
}

const unitless = unitlessTokensFrom(
  TOKEN_CSS.map((rel) => fs.readFileSync(path.join(ROOT, rel), "utf8")),
);

const walk = (dir, extensions) => {
  const found = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(rel, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) found.push(rel);
  }
  return found.sort();
};

const read = (rel) => ({ path: rel, text: fs.readFileSync(path.join(ROOT, rel), "utf8") });
const stylesheets = walk(SRC, [".css"]).map(read);
const sources = walk(SRC, [".ts", ".tsx"]).map(read);
const problems = findUnitlessLengths({ unitless, stylesheets, sources });

console.log("Unitless tokens used as lengths\n");
console.log(
  `  ${unitless.size} custom properties are bare numbers; ` +
    `${stylesheets.length} stylesheet(s) and ${sources.length} source file(s) read under ${SRC}.\n`,
);
for (const problem of problems) {
  console.log(`  FAIL  ${problem.file}:${problem.line}  ${problem.message}`);
}
if (!problems.length) console.log("  ok    every length converts its token");
process.exitCode = problems.length ? 1 : 0;
