/**
 * The design tokens, read from the stylesheets the tokens package ships —
 * every variable, its light and dark values, and the description the
 * generator wrote beside it. The foundations pages are drawn from this, so
 * they cannot drift from what the components use.
 */
// The package's documented exports, the same files root.tsx loads as CSS.
import light from "@kozmos-ds/tokens/css/light.css?raw";
import dark from "@kozmos-ds/tokens/css/dark.css?raw";
import { mergeThemes, rampOf, type TokenEntry } from "./tokens-core";

export type { TokenEntry } from "./tokens-core";
export { shortName } from "./tokens-core";

export const tokens: readonly TokenEntry[] = mergeThemes(light, dark);

const byName = new Map(tokens.map((entry) => [entry.name, entry]));

export function token(name: string): TokenEntry | undefined {
  return byName.get(name);
}

/** Every token whose name starts with the prefix, in stylesheet order. */
export function tokensWithPrefix(prefix: string): TokenEntry[] {
  return tokens.filter((entry) => entry.name.startsWith(prefix));
}

/** The tokens of one ramp — `--primitives-colors-theme-<n>` — by step. */
export function ramp(prefix: string): TokenEntry[] {
  return rampOf(tokens, prefix);
}
