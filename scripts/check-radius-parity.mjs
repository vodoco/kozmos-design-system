/**
 * Keep every surface reading corner radius from the same place.
 *
 * Before the semantic layer existed there were four sources of truth and they
 * disagreed: a button was 16px on web (Tailwind `rounded-md` -> a 1rem token),
 * 8px on iOS and Android (`primitivesLayoutRadius100`), and 8px in Figma (a
 * hardcoded number, one of 162). Nothing compared them, because the contract
 * check compares variant axes and props, not styling values. The drift sat
 * there unnoticed.
 *
 * Semantics.Radius in packages/tokens/src/tokens-light.json is now the source.
 * This asserts the three consumers still agree with it:
 *   plugin   - figma/foundations-importer/code.js copies the values into
 *              KOZMOS_RADIUS, because a Figma plugin cannot read the token JSON
 *              at runtime. A copy is fine; a copy nobody checks is not.
 *   tailwind - every role is exposed as a borderRadius utility.
 *   native   - no component still reaches past the roles to a raw scale step.
 *
 * Off-scale literals are reported but do not fail: some are deliberate and
 * removing them would be a design change, not a cleanup.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TOKENS = path.join(ROOT, "packages/tokens/src/tokens-light.json");
const PLUGIN = path.join(ROOT, "figma/foundations-importer/code.js");
const TAILWIND = path.join(ROOT, "packages/styles/tailwind.config.js");
const NATIVE_ROOTS = [
  "packages/ios/Sources/Components",
  "packages/android/src/main/java/com/kozmos/components",
];

/** Resolve a token value, following {A.B.C} aliases. */
function resolve(tokens, value, depth = 0) {
  if (typeof value !== "string" || !value.startsWith("{") || depth > 10) {
    return value;
  }
  const node = value
    .slice(1, -1)
    .split(".")
    .reduce((acc, key) => (acc == null ? acc : acc[key]), tokens);
  return node ? resolve(tokens, node.$value, depth + 1) : undefined;
}

function semanticRadii() {
  const tokens = JSON.parse(fs.readFileSync(TOKENS, "utf8"));
  const block = tokens.Semantics && tokens.Semantics.Radius;
  if (!block) throw new Error("Semantics.Radius is missing from the tokens.");
  const out = {};
  for (const [role, token] of Object.entries(block)) {
    const raw = resolve(tokens, token.$value);
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) {
      throw new Error(`Semantics.Radius.${role} does not resolve to a number.`);
    }
    out[role.toLowerCase()] = value;
  }
  return out;
}

/**
 * The names the semantic radius variables actually carry in Figma.
 *
 * `figma.variables.createVariable` is called with the payload's `figmaName`,
 * and the collection is a separate argument — so `Semantics/Radius/Control` in
 * the payload becomes a variable simply called `Radius/Control`. The plugin
 * looks aliases up in a flat map keyed by `variable.name`, so an alias written
 * in the canonical form matches nothing, warns, and falls back to its literal.
 * That is benign enough to hide: the literal is the right number, so the file
 * renders correctly while the aliasing never happens.
 */
function semanticRadiusAliases() {
  const tokens = JSON.parse(fs.readFileSync(TOKENS, "utf8"));
  const block = tokens.Semantics && tokens.Semantics.Radius;
  const out = new Map();
  for (const [role, token] of Object.entries(block)) {
    out.set(`Radius/${role}`, Number.parseFloat(resolve(tokens, token.$value)));
  }
  return out;
}

function pluginRadii() {
  const source = fs.readFileSync(PLUGIN, "utf8");
  const block = source.match(/const KOZMOS_RADIUS = \{([\s\S]*?)\};/);
  if (!block) throw new Error("KOZMOS_RADIUS is missing from the plugin.");
  const out = {};
  for (const m of block[1].matchAll(/([a-z]+):\s*(-?[0-9.]+)/g)) {
    out[m[1]] = Number.parseFloat(m[2]);
  }
  return out;
}

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

const tokenRadii = semanticRadii();
const plugin = pluginRadii();

for (const [role, value] of Object.entries(tokenRadii)) {
  if (!(role in plugin)) {
    problems.push(`plugin: KOZMOS_RADIUS has no "${role}"`);
  } else if (plugin[role] !== value) {
    problems.push(
      `plugin: KOZMOS_RADIUS.${role} is ${plugin[role]}, tokens say ${value}`,
    );
  }
}
for (const role of Object.keys(plugin)) {
  if (!(role in tokenRadii)) {
    problems.push(`plugin: KOZMOS_RADIUS.${role} has no matching token`);
  }
}

const tailwind = fs.readFileSync(TAILWIND, "utf8");
for (const role of Object.keys(tokenRadii)) {
  if (!tailwind.includes(`--semantics-radius-${role}`)) {
    problems.push(`tailwind: no borderRadius utility bound to "${role}"`);
  }
}

for (const root of NATIVE_ROOTS) {
  const extension = root.includes("/ios/") ? ".swift" : ".kt";
  for (const file of walk(path.join(ROOT, root), extension)) {
    const source = fs.readFileSync(file, "utf8");
    const hits = [...source.matchAll(/primitivesLayoutRadius[0-9A-Za-z]+/g)];
    if (hits.length) {
      problems.push(
        `${path.relative(ROOT, file)}: ${hits.length} use(s) of the raw scale ` +
          `(${[...new Set(hits.map((h) => h[0]))].join(", ")}) — use a Semantics.Radius role`,
      );
    }
  }
}

// The plugin also defines per-component Figma variables scoped to
// CORNER_RADIUS, and a bound variable beats the raw cornerRadius assignment on
// the node. Miss these and the plugin sets 16 while the file renders 8, which
// is exactly the trap this whole exercise came out of.
const pluginSource = fs.readFileSync(PLUGIN, "utf8");
const variablePattern =
  /\{\s*name: "([^"]+\/radius[^"]*)",\s*value: ([0-9]+),(?:\s*alias: "([^"]+)",)?\s*scopes: \["CORNER_RADIUS"\]/g;
const roleValues = new Set(Object.values(tokenRadii));
const semanticAliases = semanticRadiusAliases();
const strayVariables = [];
for (const m of pluginSource.matchAll(variablePattern)) {
  const [, name, rawValue, alias] = m;
  const value = Number.parseInt(rawValue, 10);
  if (alias && alias.startsWith("Semantics/")) {
    problems.push(
      `plugin: variable ${name} aliases "${alias}", but Figma holds that ` +
        `variable as "${alias.replace(/^Semantics\//, "")}" — the collection ` +
        `is not part of the name, so this resolves to nothing and silently ` +
        `falls back to ${value}`,
    );
    continue;
  }
  if (semanticAliases.has(alias)) {
    const expected = semanticAliases.get(alias);
    if (expected !== value) {
      problems.push(
        `plugin: variable ${name} falls back to ${value} but aliases ` +
          `${alias} (${expected})`,
      );
    }
    continue;
  }
  if (!roleValues.has(value)) strayVariables.push(`${name}=${value}`);
}

// An alias can only bind to a variable the import actually creates, and the
// import creates exactly what the payload lists. Checking the two against each
// other is what would have caught the canonical-name mistake above on the day
// it was written rather than three weeks later.
const payloadPath = path.join(ROOT, "docs/figma-foundations-payload.json");
if (fs.existsSync(payloadPath)) {
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
  const figmaNames = new Set(payload.variables.map((v) => v.figmaName));
  // Every Radius/* alias, not just the semantic roles — a typo names nothing
  // and behaves exactly like the canonical-form mistake: a silent fallback to
  // the literal. Component-token aliases (Button/radius and friends) are
  // deliberately not checked here: the plugin creates those itself rather than
  // importing them, so they are absent from the payload by design.
  const radiusAliases = new Set(
    Array.from(pluginSource.matchAll(/alias: "(Radius\/[^"]+)"/g), (m) => m[1]),
  );
  for (const aliasName of radiusAliases) {
    if (figmaNames.has(aliasName)) continue;
    problems.push(
      `plugin: alias "${aliasName}" names no variable in ` +
        `docs/figma-foundations-payload.json, so the import cannot create it`,
    );
  }
} else {
  notes.push(
    "docs/figma-foundations-payload.json is absent, so alias targets were not " +
      "checked against what the import would create",
  );
}
if (strayVariables.length) {
  notes.push(
    `${strayVariables.length} corner-radius variable(s) sit off every role: ` +
      strayVariables.join(", "),
  );
}

const offScale = new Map();
for (const m of fs
  .readFileSync(PLUGIN, "utf8")
  .matchAll(/cornerRadius = ([0-9]+)(?![0-9.])/g)) {
  offScale.set(m[1], (offScale.get(m[1]) || 0) + 1);
}
if (offScale.size) {
  notes.push(
    "plugin literals off the radius scale (left alone on purpose — changing " +
      "them is a design decision, not a cleanup): " +
      [...offScale.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => `${value}px x${count}`)
        .join(", "),
  );
}

const roles = Object.entries(tokenRadii)
  .map(([role, value]) => `${role}=${value}`)
  .join("  ");
console.log(
  `Radius parity — ${Object.keys(tokenRadii).length} semantic role(s)`,
);
console.log(`  ${roles}\n`);

if (problems.length) {
  console.log(`  FAIL  ${problems.length} disagreement(s)`);
  for (const problem of problems) console.log(`          ${problem}`);
} else {
  console.log(
    "  ok    plugin, tailwind and native all read the semantic roles",
  );
}
for (const note of notes) console.log(`\nNote: ${note}`);

process.exit(problems.length === 0 ? 0 : 1);
