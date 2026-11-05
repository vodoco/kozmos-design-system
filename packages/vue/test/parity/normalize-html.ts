import { JSDOM } from "jsdom";

/**
 * One canonical text for an HTML fragment, so React's and Vue's server renders
 * of the same part compare as equal exactly when they draw the same element:
 * the same tags, in the same order, with the same attributes and text.
 *
 * What it settles, and nothing else:
 * - attribute order (each framework writes its own);
 * - a boolean attribute's value (`disabled` and `disabled=""` are one);
 * - a style's spelling: declarations split, trimmed and kept in order, with
 *   no trailing `;` (React writes `a:b;c:d`, Vue `a:b;c:d;`);
 * - a class list's whitespace (its order is kept: both build it with `cn`);
 * - comments, which both frameworks use as anchors (`<!--[-->`, `<!-- -->`);
 * - whitespace between elements, and text split into adjacent nodes.
 *
 * `ignore` names attributes a framework adds for itself, never drawn by the
 * part (none today; `data-v-*` would be Vue's scoped styles).
 */
export function normalizeHtml(
  html: string,
  { ignore = [] as (string | RegExp)[] } = {},
): string {
  const { document, Node } = new JSDOM(`<body>${html}</body>`).window;
  const ignored = (name: string) =>
    ignore.some((rule) =>
      typeof rule === "string" ? rule === name : rule.test(name),
    );
  const BOOLEAN = new Set([
    "disabled",
    "checked",
    "hidden",
    "readonly",
    "required",
    "multiple",
    "selected",
    "open",
    "inert",
    "autofocus",
  ]);
  const value = (name: string, raw: string) => {
    if (BOOLEAN.has(name)) return "";
    if (name === "style")
      return raw
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const colon = part.indexOf(":");
          return `${part.slice(0, colon).trim()}:${part.slice(colon + 1).trim()}`;
        })
        .join(";");
    if (name === "class") return raw.trim().split(/\s+/).join(" ");
    return raw;
  };
  const out: string[] = [];
  const walk = (node: ChildNode, depth: number) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text) return;
      const last = out[out.length - 1];
      // Adjacent text nodes (React splits around `<!-- -->`) are one text.
      if (last?.startsWith(`${pad}"`) && last.endsWith('"'))
        out[out.length - 1] = `${last.slice(0, -1)}${text}"`;
      else out.push(`${pad}"${text}"`);
      return;
    }
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
