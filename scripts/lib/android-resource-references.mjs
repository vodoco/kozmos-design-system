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
