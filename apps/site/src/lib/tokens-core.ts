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
  /**
   * The token each theme's value names, where the stylesheet writes it as a
   * reference: the build writes an alias that way (GAP-23). `light` and
   * `dark` above are then the values the reference ends at, in that theme.
   */
  references?: { light?: string; dark?: string };
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

/** The token a value is nothing but a reference to: `var(--name)` → `--name`. */
export function referenceOf(value: string): string | undefined {
  return value.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
}

/**
 * A value with each reference followed to the value it ends at, in the same
 * stylesheet, the theme it describes. The build writes an alias as a
 * reference (GAP-23): the themed Button's fill is
 * `var(--primitives-colors-theme-500)`, and its hover names 600 in the light
 * theme and 400 in the dark.
 */
function resolverFor(
  entries: Map<string, { value: string; description?: string }>,
) {
  const valueOf = (value: string, depth = 0): string => {
    const named = referenceOf(value);
    const target = named ? entries.get(named) : undefined;
    return target && depth < 10 ? valueOf(target.value, depth + 1) : value;
  };
  return valueOf;
}

export function mergeThemes(lightCss: string, darkCss: string): TokenEntry[] {
  const lightEntries = parseTokenCss(lightCss);
  const darkEntries = parseTokenCss(darkCss);
  const lightValue = resolverFor(lightEntries);
  const darkValue = resolverFor(darkEntries);
  return [...lightEntries].map(([name, entry]) => {
    const darkEntry = darkEntries.get(name);
    const merged: TokenEntry = {
      name,
      light: lightValue(entry.value),
      dark: darkEntry ? darkValue(darkEntry.value) : lightValue(entry.value),
      description: entry.description ?? darkEntry?.description,
    };
    const lightReference = referenceOf(entry.value);
    const darkReference = referenceOf(darkEntry?.value ?? entry.value);
    const references: NonNullable<TokenEntry["references"]> = {};
    if (lightReference) references.light = lightReference;
    if (darkReference) references.dark = darkReference;
    if (lightReference || darkReference) merged.references = references;
    return merged;
  });
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
