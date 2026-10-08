/**
 * Re-pointing the theme ramp at one of the two variant ramps the tokens
 * carry, as a `tokens` override for ThemeProvider — the way a product
 * changes its brand colour without a rebuild.
 *
 * The primitive ramp (`--primitives-colors-theme-n`) is re-pointed, step for
 * step; the utilities read it. In the component layer
 * (`--components-…-themed-…`), a token the stylesheet writes as a reference
 * to the ramp follows it on its own and is reported as followed, with no
 * override: since GAP-23 was fixed, all 32 themed colours on the ramp are
 * references. Any that a token source still held as a value copied from the
 * ramp would be matched to the ramp step whose value it carries, in both
 * themes, and re-pointed to the same step of the variant; the shipped tokens
 * have none left, so that path is a guard.
 * A component token whose value is not on the ramp is left alone and
 * reported. One that sits on different steps in light and dark is matched in
 * the theme being shown when `theme` is given, since an override applies to
 * one provider in one theme; without it, it is reported too.
 */
import { rampOf, type TokenEntry } from "./tokens-core";

export type Brand = "theme" | "variant-1" | "variant-2";

export const brands: readonly { value: Brand; label: string }[] = [
  { value: "theme", label: "Kozmos" },
  { value: "variant-1", label: "Variant 1" },
  { value: "variant-2", label: "Variant 2" },
];

export interface BrandOverrides {
  tokens: Record<`--${string}`, string>;
  /** Component-layer themed tokens that reference the ramp: they need no override. */
  followed: string[];
  /** Component-layer tokens re-pointed to the variant ramp. */
  repointed: string[];
  /** Component-layer themed tokens that could not be matched to one ramp step. */
  unmatched: string[];
}

const RAMP = "--primitives-colors-theme";

export function brandOverrides(
  list: readonly TokenEntry[],
  brand: Brand,
  theme?: "light" | "dark",
): BrandOverrides {
  if (brand === "theme")
    return { tokens: {}, followed: [], repointed: [], unmatched: [] };
  const ramp = rampOf(list, RAMP);
  const tokens: Record<`--${string}`, string> = {};
  for (const step of ramp) {
    tokens[step.name as `--${string}`] =
      `var(${RAMP}-${brand}${step.name.slice(RAMP.length)})`;
  }
  const followed: string[] = [];
  const repointed: string[] = [];
  const unmatched: string[] = [];
  const same = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();
  const onRamp = (name?: string) => ramp.some((step) => step.name === name);
  for (const entry of list) {
    if (
      !entry.name.startsWith("--components-") ||
      !entry.name.includes("-themed-")
    )
      continue;
    const themes = theme ? [theme] : (["light", "dark"] as const);
    if (themes.every((shown) => onRamp(entry.references?.[shown]))) {
      followed.push(entry.name);
      continue;
    }
    const step =
      ramp.find(
        (s) => same(s.light, entry.light) && same(s.dark, entry.dark),
      ) ?? (theme ? ramp.find((s) => same(s[theme], entry[theme])) : undefined);
    if (step) {
      tokens[entry.name as `--${string}`] =
        `var(${RAMP}-${brand}${step.name.slice(RAMP.length)})`;
      repointed.push(entry.name);
    } else {
      unmatched.push(entry.name);
    }
  }
  return { tokens, followed, repointed, unmatched };
}
