/**
 * Reading a token stylesheet — `packages/tokens/dist/css/variables-*.css` —
 * as values.
 *
 * Since GAP-23 was fixed (2026-10-07) the build writes a token whose source
 * value is an alias as a reference to the token it names:
 * `--semantics-border-subtle: var(--primitives-colors-background-200)`. A
 * check that reads the file for a colour or a number must follow that
 * reference within the same file, the theme it describes, or it reads
 * `var(…)` where it expected a value: a contrast check throws, and a set of
 * bare numbers quietly loses the semantic radii.
 */

/** Every custom property the stylesheet declares, as written, in order. */
export function tokenDeclarations(css) {
  const declarations = new Map();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)[;}]/g))
    declarations.set(match[1], match[2].trim());
  return declarations;
}

/**
 * The token a value is nothing but a reference to, or null. A reference with
 * a fallback, or among other values, is not one: the build writes neither.
 */
export function referenceOf(value) {
  const match = String(value).match(/^\s*var\(\s*(--[\w-]+)\s*\)\s*$/);
  return match ? match[1] : null;
}

/**
 * Every custom property the stylesheet declares, with each reference
 * followed to the value it ends at. A reference to a token the stylesheet
 * does not declare, or one that comes back to itself, throws: a token file
 * holds every token of its theme.
 */
export function resolvedTokens(css) {
  const declarations = tokenDeclarations(css);
  const resolved = new Map();
  const resolve = (name, seen = []) => {
    if (resolved.has(name)) return resolved.get(name);
    if (seen.includes(name))
      throw new Error(`${[...seen, name].join(" → ")} refers back to itself`);
    if (!declarations.has(name))
      throw new Error(
        `${seen.at(-1) ?? name} refers to ${name}, which the stylesheet does not declare`,
      );
    const value = declarations.get(name);
    const named = referenceOf(value);
    const result = named ? resolve(named, [...seen, name]) : value;
    resolved.set(name, result);
    return result;
  };
  for (const name of declarations.keys()) resolve(name);
  return resolved;
}
