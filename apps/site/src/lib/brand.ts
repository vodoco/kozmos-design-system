/**
 * Re-pointing the theme ramp at one of the two variant ramps the tokens
 * carry, as a `tokens` override for ThemeProvider — the way a product
 * changes its brand colour without a rebuild.
 *
 * Two layers have to move. The primitive ramp (`--primitives-colors-theme-n`)
 * is what the utilities read. The component layer (`--components-…-themed-…`)
 * is generated with the theme's values baked in rather than as aliases of the
 * ramp (GAPS.md, GAP-23), so each of those is matched to the ramp step whose
 * value it carries, in both themes, and re-pointed to the same step of the
 * variant. A component token whose value is not on the ramp is left alone
 * and reported. One that sits on different steps in light and dark (the
 * filled button's hover, focus and pressed, since decision 59: 600 and 400,
 * 700 and 300) is matched in the theme being shown when `theme` is given,
 * since an override applies to one provider in one theme; without it, it is
 * reported too.
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
  if (brand === "theme") return { tokens: {}, repointed: [], unmatched: [] };
  const ramp = rampOf(list, RAMP);
  const tokens: Record<`--${string}`, string> = {};
  for (const step of ramp) {
    tokens[step.name as `--${string}`] =
      `var(${RAMP}-${brand}${step.name.slice(RAMP.length)})`;
  }
  const repointed: string[] = [];
  const unmatched: string[] = [];
  const same = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();
  for (const entry of list) {
    if (
      !entry.name.startsWith("--components-") ||
      !entry.name.includes("-themed-")
    )
      continue;
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
  return { tokens, repointed, unmatched };
}
