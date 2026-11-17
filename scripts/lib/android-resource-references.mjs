/**
 * Whether every `@type/name` reference in Android resource XML names a
 * resource of that type.
 *
 * A library's resources are linked only when an app is built against them,
 * so a library build passes with a reference to nothing. The token build's
 * colors.xml did that from 13 Sep to 8 Nov 2026: the semantic radii were
 * written as `<dimen>@dimen/primitives_layout_radius_200</dimen>`, and the
 * primitives they name were `<integer>`s, so every app built against the
 * Android library or @kozmos-ds/tokens' Android resources failed to link.
 *
 * Each values folder is a configuration. A reference in `values-night`
 * resolves against `values-night` and then `values`, as AAPT resolves it; a
 * reference in `values` resolves against `values` alone.
 */

/** A resource's type as AAPT keys it: `<item type="dimen">` is a dimen. */
const DECLARATION = /<(dimen|integer|color|string|bool|fraction|item)\b([^>]*)\bname="([^"]+)"([^>]*)>/g;
const REFERENCE = /@(?!android:)([a-z]+)\/([A-Za-z0-9_]+)/g;

/** Every resource the XML declares, as `type/name`. */
export function declaredIn(xml) {
  const names = new Set();
  for (const [, tag, before, name, after] of xml.matchAll(DECLARATION)) {
    let type = tag;
    if (tag === "item") {
      const typed = /\btype="([a-z]+)"/.exec(`${before} ${after}`);
      if (!typed) continue;
      type = typed[1];
    }
    names.add(`${type}/${name}`);
  }
  return names;
}

/** Every `@type/name` the XML refers to, with the line it is on. */
export function referencedIn(xml) {
  const found = [];
  xml.split("\n").forEach((text, index) => {
    for (const [, type, name] of text.matchAll(REFERENCE)) {
      found.push({ ref: `${type}/${name}`, line: index + 1 });
    }
  });
  return found;
}

/**
 * The references that name nothing. `files` maps a values folder's name
 * (`values`, `values-night`) to the XML texts in it.
 */
export function unresolvedReferences(files) {
  const declared = new Map();
  for (const [folder, texts] of Object.entries(files)) {
    const names = new Set();
    for (const { xml } of texts) for (const name of declaredIn(xml)) names.add(name);
    declared.set(folder, names);
  }
  const base = declared.get("values") ?? new Set();
  const missing = [];
  for (const [folder, texts] of Object.entries(files)) {
    const own = declared.get(folder);
    for (const { file, xml } of texts) {
      for (const { ref, line } of referencedIn(xml)) {
        if (!own.has(ref) && !base.has(ref)) missing.push({ file, line, ref });
      }
    }
  }
  return missing;
}

/**
 * Every `<dimen>` written in `px`. On Android `px` is a device pixel, so a
 * CSS length must arrive as `dp`: 44px, a touch target on the web, is 44dp
 * on a phone and about 15dp if it is written `44px` on a 3x screen. The token
 * build wrote the px-valued tokens (border widths, the grid, the touch sizes,
 * the full radius) as `px` until 9 Nov 2026, while Compose's KozmosDimensions
 * carried the same numbers in dp.
 */
export function pixelDimensions(xml) {
  const found = [];
  xml.split("\n").forEach((text, index) => {
    for (const [, name, value] of text.matchAll(
      /<(?:dimen\b[^>]*|item\b(?=[^>]*\btype="dimen")[^>]*)\bname="([^"]+)"[^>]*>\s*(-?[0-9.]+px)\s*</g,
    )) {
      found.push({ name, value, line: index + 1 });
    }
  });
  return found;
}

/**
 * The token names that are lengths: the layout spacing, sizing and radius
 * primitives, the motion slides, the glass blur, and the type scale (font
 * sizes, line heights, letter spacing and paragraph spacing, with the heading
 * tokens under `components_html_elements_headings_*`).
 */
export const LENGTH_NAME =
  /^(primitives_layout_(spacing|sizing|radius)_|semantics_motion_slide_|semantics_effect_glass_blur$|.*_(font_size|line_height|letter_spacing|paragraph_spacing)(_|$))/;

/**
 * Every length written as something other than a `<dimen>` with a unit: an
 * `<integer>`, a `<string>`, or a float item, none of which an XML layout can
 * use as `@dimen/`. The token build wrote the layout primitives, the motion
 * slides and the glass blur as `<integer>` and the type scale as unitless
 * `<string>`s until decision 206 (17 Nov 2026, GAP-237). A `<dimen>` must
 * carry a unit or be a reference to another dimen.
 */
export function unitlessLengths(xml) {
  const found = [];
  xml.split("\n").forEach((text, index) => {
    for (const [, tag, before, name, after, value] of text.matchAll(
      /<(dimen|integer|string|item)\b([^>]*)\bname="([^"]+)"([^>]*)>([^<]*)</g,
    )) {
      if (!LENGTH_NAME.test(name)) continue;
      const attrs = `${before} ${after}`;
      const isDimen = tag === "dimen" || (tag === "item" && /\btype="dimen"/.test(attrs));
      const trimmed = value.trim();
      const hasUnit = /^-?[0-9.]+(dp|sp)$/.test(trimmed) || /^@dimen\//.test(trimmed);
      if (isDimen && !/\bformat="float"/.test(attrs) && hasUnit) continue;
      found.push({ name, tag: tag === "item" ? `item${/format="float"/.test(attrs) ? " (float)" : ""}` : tag, value: trimmed, line: index + 1 });
    }
  });
  return found;
}
