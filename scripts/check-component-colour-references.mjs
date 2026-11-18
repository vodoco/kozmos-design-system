/**
 * A component colour that is a primitive's value refers to that primitive
 * (GAP-281).
 *
 * Fails on any colour under `Components` in `tokens-light.json` or
 * `tokens-dark.json` that is a literal equal to a primitive's value in the
 * same theme. A copy draws the same as a reference, so nothing else sees it,
 * but a change to a ramp, or a product's override of one, then reaches the
 * states that refer to the ramp and not those that copy it: until 0.17.0, 198
 * light and 214 dark Button colours were copies.
 *
 * Which primitive a copy should name is decided in
 * `scripts/lib/component-colour-references.mjs` (the token's tone and role
 * first, then the primitive both themes share), and its controls are in
 * `scripts/lib/component-colour-references.test.mjs`.
 *
 *   pnpm tokens:component-refs:check          fail on a copy, naming its primitive
 *   pnpm tokens:component-refs:check --write  write each copy as its reference
 *
 * `--write` changes only values; the built tokens resolve to what they did,
 * which `pnpm tokens:build` and a diff of `packages/tokens/dist` show.
 */
import fs from "node:fs";
import path from "node:path";
import {
  findCopiedColours,
  setValueAt,
} from "./lib/component-colour-references.mjs";

const ROOT = process.cwd();
const SOURCES = {
  light: "packages/tokens/src/tokens-light.json",
  dark: "packages/tokens/src/tokens-dark.json",
};
const write = process.argv.includes("--write");

const trees = Object.fromEntries(
  Object.entries(SOURCES).map(([theme, rel]) => [
    theme,
    JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")),
  ]),
);

const copies = findCopiedColours(trees);
const undecided = copies.filter((copy) => !copy.choice);
const ref = (primitive) => `{${primitive}}`;

if (undecided.length) {
  console.error(
    `${undecided.length} component colour(s) copy a primitive the rule cannot choose between; refer to one by hand:`,
  );
  for (const copy of undecided)
    console.error(
      `  ${copy.theme}  ${copy.path} = ${copy.value}: ${copy.remaining.join(" or ")}`,
    );
  process.exit(1);
}

if (write) {
  for (const copy of copies)
    setValueAt(trees[copy.theme], copy.path, ref(copy.choice));
  const prettier = await import("prettier");
  for (const [theme, rel] of Object.entries(SOURCES)) {
    const file = path.join(ROOT, rel);
    const config = (await prettier.resolveConfig(file)) ?? {};
    const text = await prettier.format(JSON.stringify(trees[theme], null, 2), {
      ...config,
      filepath: file,
    });
    fs.writeFileSync(file, text);
  }
  console.log(
    `Wrote ${copies.length} component colour(s) as references (${copies.filter((c) => c.theme === "light").length} light, ${copies.filter((c) => c.theme === "dark").length} dark).`,
  );
  process.exit(0);
}

if (copies.length) {
  console.error(
    `${copies.length} component colour(s) copy a primitive's value instead of referring to it (GAP-281). Run \`pnpm tokens:component-refs:check --write\`, or write each as its reference:`,
  );
  for (const copy of copies)
    console.error(
      `  ${copy.theme}  ${copy.path} = ${copy.value} → ${ref(copy.choice)}`,
    );
  process.exit(1);
}

console.log(
  "Every component colour that is a primitive's value refers to it, in both themes (GAP-281).",
);
