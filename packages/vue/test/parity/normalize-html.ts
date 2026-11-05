import { JSDOM } from "jsdom";

/** Attributes whose value is an id, or a list of them. */
const ID_REFERENCE = new Set([
  "for",
  "form",
  "list",
  "headers",
  "popovertarget",
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
]);

/**
 * One canonical text for an HTML fragment, so React's and Vue's server renders
 * of the same part compare as equal exactly when they draw the same element:
 * the same tags, in the same order, with the same attributes and text.
 *
 * What it settles, and nothing else:
 * - attribute order (each framework writes its own);
 * - a style's spelling: declarations split, trimmed and kept in order, with
 *   no trailing `;` (React writes `a:b;c:d`, Vue `a:b;c:d;`);
 * - comments, which both frameworks use as anchors (`<!--[-->`, `<!-- -->`),
 *   and the split text around them, joined exactly as it reads.
 * Every other attribute value and every character of text is compared as it
 * is: `disabled` and `disabled=""` parse to the same value already, and
 * `hidden="until-found"` is not `hidden`.
 *
 * - ids, which each framework generates its own way (React's
 *   `radix-_R_0_-trigger-a`, Reka's `reka-…`): every id, and every reference
 *   to one (`for`, `aria-labelledby`, `aria-controls` and the rest, a
 *   `url(#…)` in any attribute, an `href="#…"`), is renamed `id-1`, `id-2`…
 *   in the order the ids first appear, so what refers to what is compared,
 *   and not how each framework spells it. The ids in `keepIds`, which a test
 *   supplies as an app would, are kept as they are: that they land is what
 *   such a test compares.
 *
 * `ignore` names attributes a framework adds for itself, never drawn by the
 * part (none today; `data-v-*` would be Vue's scoped styles).
 */
export function normalizeHtml(
  html: string,
  { ignore = [] as (string | RegExp)[], keepIds = [] as string[] } = {},
): string {
  const { document, Node } = new JSDOM(`<body>${html}</body>`).window;
  // Ids in order of first appearance, as an id or as a reference to one.
  const ids = new Map<string, string>();
  const canonical = (id: string) => {
    if (keepIds.includes(id)) return id;
    if (!ids.has(id)) ids.set(id, `id-${ids.size + 1}`);
    return ids.get(id)!;
  };
  // `url(#gradient)` in fill, clip-path, mask, filter, marker-* and style.
  const urls = (raw: string) =>
    raw.replace(
      /url\(\s*#([^)\s]+)\s*\)/g,
      (_, id) => `url(#${canonical(id)})`,
    );
  const ignored = (name: string) =>
    ignore.some((rule) =>
      typeof rule === "string" ? rule === name : rule.test(name),
    );
  const value = (name: string, raw: string) =>
    name === "id" || ID_REFERENCE.has(name)
      ? raw.split(/\s+/).filter(Boolean).map(canonical).join(" ")
      : (name === "href" || name === "xlink:href") && raw.startsWith("#")
        ? `#${canonical(raw.slice(1))}`
        : name === "style"
          ? urls(raw)
              .split(";")
              .map((part) => part.trim())
              .filter(Boolean)
              .map((part) => {
                const colon = part.indexOf(":");
                return `${part.slice(0, colon).trim()}:${part.slice(colon + 1).trim()}`;
              })
              .join(";")
          : urls(raw);
  const out: string[] = [];
  let lastWasText = false;
  const walk = (node: ChildNode, depth: number) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = JSON.stringify(node.textContent ?? "");
      if (text === '""') return;
      const last = out[out.length - 1];
      // Adjacent text nodes (React splits around `<!-- -->`) are one text,
      // joined exactly.
      if (last?.startsWith(`${pad}"`) && lastWasText)
        out[out.length - 1] = `${last.slice(0, -1)}${text.slice(1)}`;
      else out.push(`${pad}${text}`);
      lastWasText = true;
      return;
    }
    // A comment is an anchor: the text either side of it is one text.
    if (node.nodeType === Node.COMMENT_NODE) return;
    lastWasText = false;
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    const attributes = [...element.attributes]
      .filter((attribute) => !ignored(attribute.name))
      .map((attribute) => [
        attribute.name,
        value(attribute.name, attribute.value),
      ])
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, raw]) => (raw === "" ? name : `${name}="${raw}"`));
    out.push(
      `${pad}<${element.localName}${attributes.length ? " " + attributes.join(" ") : ""}>`,
    );
    for (const child of element.childNodes) walk(child, depth + 1);
  };
  for (const child of document.body.childNodes) walk(child, 0);
  return out.join("\n");
}
