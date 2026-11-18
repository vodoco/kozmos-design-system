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
 * A colour white in both themes refers to `Primitives.Colors.white` (decision
 * 223), copy or reference alike. A component colour that is no primitive's
 * value, or that refers outside its role's ramps, fails unless KNOWN below
 * names it with its register row; those are printed as known, and an entry
 * that no longer occurs fails, so the list cannot go stale.
 *
 * `--write` changes only values; the built tokens resolve to what they did,
 * which `pnpm tokens:build` and a diff of `packages/tokens/dist` show.
 */
import fs from "node:fs";
import path from "node:path";
import {
  findCopiedColours,
  findExceptions,
  setValueAt,
} from "./lib/component-colour-references.mjs";

// GAP-285 (owner, 18 Nov): the dark neutral Secondary and Tertiary Buttons
// keep #5C6069, which is no dark primitive, and the dark Tertiary neutral
// pressed words keep background/300, the only dark primitive of #464A53, as
// they are. Known exceptions, named here so the check says so every run.
const KNOWN = [
  ...[
    "Secondary Buttons.neutral.button.background.idle",
    "Secondary Buttons.neutral.foreground.dimmed.content.pressed",
    "Tertiary Buttons.neutral.button.background.hover",
    "Tertiary Buttons.neutral.button.background.focus",
    "Tertiary Buttons.neutral.button.foreground.content.idle",
    "Tertiary Buttons.neutral.foreground.dimmed.content.pressed",
  ].map((path) => ({
    theme: "dark",
    path: `Components.${path}`,
    kind: "no-primitive",
    row: "GAP-285",
  })),
  {
    theme: "dark",
    path: "Components.Tertiary Buttons.neutral.button.foreground.content.pressed",
    kind: "outside-role",
    row: "GAP-285",
  },
];
const key = (entry) => `${entry.theme} ${entry.path} ${entry.kind}`;

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

const exceptions = findExceptions(trees);
const known = new Map(KNOWN.map((entry) => [key(entry), entry]));
const unknown = exceptions.filter((found) => !known.has(key(found)));
const stale = KNOWN.filter(
  (entry) => !exceptions.some((found) => key(found) === key(entry)),
);
const WHY = {
  "no-primitive": "is no primitive's value",
  "outside-role": "refers outside its role's ramps",
};
let failed = false;
if (unknown.length) {
  failed = true;
  console.error(
    `${unknown.length} component colour(s) the rule cannot hold to a primitive of their role; give each a primitive, or a register row in KNOWN:`,
  );
  for (const found of unknown)
    console.error(
      `  ${found.theme}  ${found.path} = ${found.value} ${WHY[found.kind]}`,
    );
}
if (stale.length) {
  failed = true;
  console.error(
    `${stale.length} KNOWN exception(s) no longer occur; remove them and close their register row:`,
  );
  for (const entry of stale)
    console.error(`  ${entry.theme}  ${entry.path} (${entry.row})`);
}

if (copies.length) {
  failed = true;
  console.error(
    `${copies.length} component colour(s) copy a primitive's value, or refer to another than the one the rule picks (GAP-281, decision 223). Run \`pnpm tokens:component-refs:check --write\`, or write each as its reference:`,
  );
  for (const copy of copies)
    console.error(
      `  ${copy.theme}  ${copy.path} = ${copy.value} → ${ref(copy.choice)}${copy.whiteInBothThemes ? " (white in both themes, decision 223)" : ""}`,
    );
}
if (failed) process.exit(1);

console.log(
  `Every component colour that is a primitive's value refers to it, in both themes (GAP-281), white in both themes as ${"Primitives.Colors.white"} (decision 223). Known exceptions (${KNOWN.length}):`,
);
for (const entry of KNOWN)
  console.log(
    `  ${entry.theme}  ${entry.path} ${WHY[entry.kind]} (${entry.row})`,
  );
