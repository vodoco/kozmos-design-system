import { normalizeStyle, type StyleValue } from "vue";

/**
 * A `style` as React writes one: the declarations given, later ones winning,
 * and no attribute at all when none has a value. Vue writes `style=""` for
 * an empty style, where React writes nothing, so a part that builds its
 * style from its props spreads this rather than a `style` of its own.
 */
export function styleAttribute(...values: unknown[]): { style?: StyleValue } {
  const merged = normalizeStyle(values as StyleValue[]);
  if (typeof merged === "string") return merged.trim() ? { style: merged } : {};
  const style = Object.fromEntries(
    Object.entries(merged ?? {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
  return Object.keys(style).length ? { style } : {};
}
