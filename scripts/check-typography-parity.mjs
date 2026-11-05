/**
 * Keep every surface reading its font family from the same decision.
 *
 * Typography drifted further than radius ever did, and more quietly. Web asked
 * for `"Readex Pro", sans-serif` while nothing in the repo has ever loaded
 * Readex Pro — no @font-face, no webfont link, no font file — so browsers fell
 * through to generic sans-serif. iOS reached for `.font(.subheadline)` and got
 * SF Pro. Android set no family at all and got Roboto. The Figma plugin really
 * does render Readex Pro, so the mockups described a font no platform shipped.
 * Three renderings of one design, and nothing compared them.
 *
 * Semantics.Typography.Family in packages/tokens/src/tokens-light.json is the
 * decision now. This asserts the consumers still read it:
 *   tailwind - `sans` resolves to the System role, not a primitive or the brand
 *   ios      - components go through KozmosTypography, not bare text styles
 *   android  - the theme passes a Typography carrying KozmosTypography.family
 *
 * The Figma plugin is reported, not enforced. Switching its font restyles all
 * 94 component sets at once, which is a design call and a plugin field, not
 * something a checker should demand.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TOKENS = path.join(ROOT, "packages/tokens/src/tokens-light.json");
const TAILWIND = path.join(ROOT, "packages/styles/tailwind.config.js");
const PLUGIN = path.join(ROOT, "figma/foundations-importer/code.js");
const IOS_COMPONENTS = path.join(ROOT, "packages/ios/Sources/Components");
const ANDROID_THEME = path.join(
  ROOT,
  "packages/android/src/main/java/com/kozmos/components/ThemeProvider/ThemeProvider.kt",
);

// The Dynamic Type styles the components use. A bare `.font(.body)` is not
// wrong, it just makes the decision in the wrong place. KozmosTypography's own
// `font(_:)` is the right place, so a style handed to it is not bare: POI
// DetailPanel's `KozmosTypography.font(.callout)`, a style with no shorthand,
// read as one from 2026-09-18.
const BARE_TEXT_STYLE =
  /(?<!KozmosTypography)\.font\(\.(body|headline|subheadline|footnote|caption|callout|title|title2|title3|largeTitle|caption2)\)/g;

function walk(dir, extension, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extension, files);
    else if (entry.name.endsWith(extension)) files.push(full);
  }
  return files;
}

const problems = [];
const notes = [];

const tokens = JSON.parse(fs.readFileSync(TOKENS, "utf8"));
const family =
  tokens.Semantics &&
  tokens.Semantics.Typography &&
  tokens.Semantics.Typography.Family;
if (!family) {
  console.error("Semantics.Typography.Family is missing from the tokens.");
  process.exit(2);
}
const roles = Object.keys(family).map((role) => role.toLowerCase());

const tailwind = fs.readFileSync(TAILWIND, "utf8");
const sansMatch = tailwind.match(/\n\s*sans:\s*([^\n]+)/);
if (!sansMatch) {
  problems.push("tailwind: no fontFamily.sans entry found");
} else if (!sansMatch[1].includes("--semantics-typography-family-system")) {
  problems.push(
    `tailwind: fontFamily.sans reads ${sansMatch[1].trim()} — it should resolve to the System role`,
  );
}
for (const role of roles) {
  if (!tailwind.includes(`--semantics-typography-family-${role}`)) {
    notes.push(`tailwind exposes no utility for the "${role}" role`);
  }
}

for (const file of walk(IOS_COMPONENTS, ".swift")) {
  const hits = [...fs.readFileSync(file, "utf8").matchAll(BARE_TEXT_STYLE)];
  if (hits.length) {
    problems.push(
      `${path.relative(ROOT, file)}: ${hits.length} bare text style(s) ` +
        `(${[...new Set(hits.map((h) => h[0]))].join(", ")}) — use KozmosTypography`,
    );
  }
}

const androidTheme = fs.readFileSync(ANDROID_THEME, "utf8");
if (!/typography\s*=\s*KozmosTypography\.typography\(/.test(androidTheme)) {
  problems.push(
    "android: KozmosThemeProvider does not pass KozmosTypography.typography() to MaterialTheme",
  );
}

const pluginFamily = fs
  .readFileSync(PLUGIN, "utf8")
  .match(/DEFAULT_FONT_CONFIG = Object\.freeze\(\{\s*family: "([^"]+)"/);
if (pluginFamily) {
  // Brand is an alias into Primitives, so resolve it before comparing or the
  // check compares a font name against the literal string "{Primitives...}".
  const resolve = (value, depth = 0) =>
    typeof value === "string" && value.startsWith("{") && depth < 10
      ? resolve(
          (
            value
              .slice(1, -1)
              .split(".")
              .reduce((acc, key) => (acc == null ? acc : acc[key]), tokens) ||
            {}
          ).$value,
          depth + 1,
        )
      : value;
  const brand = resolve(family.Brand && family.Brand.$value);
  const isBrand = typeof brand === "string" && brand === pluginFamily[1];
  notes.push(
    `the Figma plugin renders "${pluginFamily[1]}"` +
      (isBrand
        ? " — the brand font, which no platform ships. Mockups therefore describe " +
          "type that nothing renders. Change it in the plugin's Typography field " +
          "when you are ready to restyle all 94 sets."
        : " — matching the system-first decision."),
  );
}

console.log(
  `Typography parity — ${roles.length} family role(s): ${roles.join(", ")}\n`,
);
if (problems.length) {
  console.log(`  FAIL  ${problems.length} disagreement(s)`);
  for (const problem of problems) console.log(`          ${problem}`);
} else {
  console.log("  ok    tailwind, ios and android all read the family roles");
}
for (const note of notes) console.log(`\nNote: ${note}`);

process.exit(problems.length === 0 ? 0 : 1);
