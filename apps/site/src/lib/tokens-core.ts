/**
 * Reading the generated token stylesheets: the parsing and the queries,
 * with no stylesheet imported, so the unit tests can run them in Node.
 * `tokens.ts` binds them to the real files.
 */

export interface TokenEntry {
  /** The variable, with its leading dashes: `--semantics-radius-control`. */
  name: string;
  light: string;
  /** The dark theme's value; the light value where the theme does not change it. */
  dark: string;
  description?: string;
}

const DECLARATION =
  /^\s*(--[\w-]+):\s*(.*?);\s*(?:\/\*\*\s*([\s\S]*?)\s*\*\/)?\s*$/;

/** Parses one generated token stylesheet into its declarations. */
export function parseTokenCss(
  css: string,
): Map<string, { value: string; description?: string }> {
  const entries = new Map<string, { value: string; description?: string }>();
  for (const line of css.split("\n")) {
    const match = line.match(DECLARATION);
    if (!match) continue;
    const [, name, value, description] = match;
    entries.set(name, {
      value: value.trim(),
      description: description?.trim() || undefined,
    });
  }
  return entries;
}

export function mergeThemes(lightCss: string, darkCss: string): TokenEntry[] {
  const lightEntries = parseTokenCss(lightCss);
  const darkEntries = parseTokenCss(darkCss);
  return [...lightEntries].map(([name, entry]) => ({
    name,
    light: entry.value,
    dark: darkEntries.get(name)?.value ?? entry.value,
    description: entry.description ?? darkEntries.get(name)?.description,
  }));
}

/** The numeric step at the end of a ramp token's name: `…-theme-600` → 600. */
export function stepOf(name: string): number {
  const match = name.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number.NaN;
}

/** The tokens of one ramp — `<prefix>-<n>` — in step order. */
export function rampOf(
  list: readonly TokenEntry[],
  prefix: string,
): TokenEntry[] {
  const pattern = new RegExp(`^${prefix}-\\d+$`);
  return list
    .filter((entry) => pattern.test(entry.name))
    .sort((a, b) => stepOf(a.name) - stepOf(b.name));
}

/** `--semantics-radius-control` → `radius control`, for a label. */
export function shortName(name: string, prefix: string): string {
  return name.slice(prefix.length).replace(/^-/, "").replace(/-/g, " ");
}
