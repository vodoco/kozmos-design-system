/**
 * A component colour that is a primitive's value refers to that primitive —
 * the deciding half (GAP-281).
 *
 * Until 0.17.0 most Button colours outside the subtle tier were hex copies of
 * ramp colours: primary's words `#FFFFFF`, its disabled words `#464A53`. A
 * copy draws the same as a reference, so nothing showed it, but a change to a
 * ramp, or a product's override of one on ThemeProvider's root, reached the
 * Button states that referred to the ramp and not the ones that copied it.
 *
 * `scripts/check-component-colour-references.mjs` reads the token sources and
 * prints; this file decides, so `component-colour-references.test.mjs` can put
 * known-bad input in front of it.
 *
 * Which primitive, when one value is several primitives' (`#FFFFFF` is
 * background/0 and foreground/1000 in light; the alert ramp is the accent
 * ramp), is the one the token's role implies. In order:
 *
 *   1. The ramp of the token's tone and role. A tone with a ramp of its own
 *      (themed, success, danger, alert, informative) prefers that ramp; then a
 *      fill (a path through `background`) prefers the background ramp and
 *      content (a path through `content` or `foreground`) the foreground ramp.
 *      That is how the references already in the sources were written: every
 *      referenced fill is a background or tone ramp, every referenced content
 *      colour a foreground or tone ramp, and alert never the accent ramp.
 *   2. Of those, the primitive that is also the token's value in the other
 *      theme, so one primitive serves both themes where one can.
 *
 * Where step 1 finds no primitive in the role's ramps, any primitive of the
 * value is taken and the choice is reported as outside its role's ramp; where
 * the two themes take different primitives, that is reported too. Both are
 * lists for a person to read, not failures. More than one primitive left after
 * both steps is a failure: the rule cannot choose, so a person must.
 */

/** Every token of a token tree, by its dotted path. */
export function flattenTokens(tree, segments = [], out = new Map()) {
  if (!tree || typeof tree !== "object") return out;
  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith("$") || !child || typeof child !== "object") continue;
    const next = [...segments, key];
    if ("$value" in child || "value" in child) out.set(next.join("."), child);
    else flattenTokens(child, next, out);
  }
  return out;
}

export const valueOf = (token) => token?.$value ?? token?.value;
export const typeOf = (token) => token?.$type ?? token?.type;

const ALIAS = /^\{(.+)\}$/;

/** The dotted path a value refers to, or null for a literal. */
export function aliasOf(value) {
  const match = ALIAS.exec(String(value ?? "").trim());
  return match ? match[1].trim() : null;
}

/** A value with its aliases followed, in one theme's tokens. */
export function resolve(tokens, value, depth = 0) {
  const alias = aliasOf(value);
  if (!alias || depth > 10) return value;
  const target = tokens.get(alias);
  return target ? resolve(tokens, valueOf(target), depth + 1) : value;
}

/**
 * A colour as `#RRGGBBAA` in upper case, or null for anything that is not a
 * hex colour: `#fff`, `#FFFFFF` and `#ffffffff` are one colour.
 */
export function normalizeColour(value) {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  const hex = /^#([0-9A-F]{3,8})$/.exec(raw)?.[1];
  if (!hex) return null;
  if (hex.length === 3 || hex.length === 4) {
    const full = [...hex].map((digit) => digit + digit).join("");
    return `#${full.length === 6 ? `${full}FF` : full}`;
  }
  if (hex.length === 6) return `#${hex}FF`;
  if (hex.length === 8) return `#${hex}`;
  return null;
}

/** The colour primitives of one theme, by normalised value. */
export function primitivesByColour(tokens) {
  const byColour = new Map();
  for (const [path, token] of tokens) {
    if (!path.startsWith("Primitives.") || typeOf(token) !== "color") continue;
    const colour = normalizeColour(resolve(tokens, valueOf(token)));
    if (!colour) continue;
    if (!byColour.has(colour)) byColour.set(colour, []);
    byColour.get(colour).push(path);
  }
  return byColour;
}

const TONE_RAMPS = {
  themed: "Primitives.Colors.theme.",
  success: "Primitives.Colors.emotional.success.",
  danger: "Primitives.Colors.emotional.danger.",
  alert: "Primitives.Colors.emotional.alert.",
  informative: "Primitives.Colors.emotional.info.",
  info: "Primitives.Colors.emotional.info.",
};

/**
 * The ramps a component colour's role implies, most preferred first. The
 * tone is the segment after the tier (`Components.Primary Buttons.success`);
 * the role is fill when the path runs through `background`, content when it
 * runs through `content` or `foreground`.
 */
export function preferredRamps(path) {
  const segments = path.split(".");
  const ramps = [];
  const tone = TONE_RAMPS[segments[2]];
  if (tone) ramps.push(tone);
  const below = segments.slice(3);
  if (below.includes("content") || below.includes("foreground")) {
    ramps.push("Primitives.Colors.foreground.");
  } else if (below.includes("background")) {
    ramps.push("Primitives.Colors.background.");
  }
  return ramps;
}

function inRamp(primitive, ramp) {
  if (!primitive.startsWith(ramp)) return false;
  // The theme ramp's own steps, not its variants' (theme.variant.1.500).
  return !primitive.slice(ramp.length).includes(".");
}

/**
 * The primitive a copied colour should refer to, by the rule at the top of
 * this file.
 *
 *   candidates  primitives whose value, in this theme, is the token's
 *   other       primitives whose value, in the other theme, is the token's
 *               value there (empty when that theme does not copy one)
 */
export function choosePrimitive(path, candidates, other = []) {
  const ramps = preferredRamps(path);
  let pool = [];
  for (const ramp of ramps) {
    pool = candidates.filter((primitive) => inRamp(primitive, ramp));
    if (pool.length) break;
  }
  const outsideRole = pool.length === 0;
  if (outsideRole) pool = [...candidates];

  const shared = pool.filter((primitive) => other.includes(primitive));
  if (shared.length) pool = shared;

  return {
    choice: pool.length === 1 ? pool[0] : null,
    remaining: pool,
    outsideRole,
  };
}

/**
 * Every component colour, in both themes, that is a literal equal to a
 * primitive's value.
 *
 * Returns one record per copy: `{ theme, path, value, candidates, choice,
 * remaining, outsideRole }`. `choice` is null when the rule cannot choose.
 */
export function findCopiedColours({ light, dark }) {
  const themes = {
    light: flattenTokens(light),
    dark: flattenTokens(dark),
  };
  const primitives = {
    light: primitivesByColour(themes.light),
    dark: primitivesByColour(themes.dark),
  };
  const copies = [];

  for (const theme of ["light", "dark"]) {
    const tokens = themes[theme];
    const otherTheme = theme === "light" ? "dark" : "light";
    const otherTokens = themes[otherTheme];

    for (const [path, token] of tokens) {
      if (!path.startsWith("Components.") || typeOf(token) !== "color")
        continue;
      const value = valueOf(token);
      if (aliasOf(value)) continue;
      const colour = normalizeColour(value);
      if (!colour) continue;
      const candidates = primitives[theme].get(colour) ?? [];
      if (!candidates.length) continue;

      const otherToken = otherTokens.get(path);
      const otherColour = otherToken
        ? normalizeColour(resolve(otherTokens, valueOf(otherToken)))
        : null;
      const other = otherColour
        ? (primitives[otherTheme].get(otherColour) ?? [])
        : [];

      copies.push({
        theme,
        path,
        value,
        candidates,
        ...choosePrimitive(path, candidates, other),
      });
    }
  }

  return copies;
}

/** Set a token's value at a dotted path in a token tree, in place. */
export function setValueAt(tree, path, value) {
  let node = tree;
  for (const key of path.split(".")) node = node?.[key];
  if (!node || typeof node !== "object") throw new Error(`No token at ${path}`);
  if ("$value" in node) node.$value = value;
  else node.value = value;
}
