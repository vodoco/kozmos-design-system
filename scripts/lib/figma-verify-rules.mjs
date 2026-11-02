/**
 * Two of `scripts/verify-figma-library.mjs`'s rules, apart from its fetch, so
 * `scripts/check-figma-painters.mjs` can hold them to nodes shaped as REST
 * returns them without reading the live file.
 */

// Punctuation, and text that merely starts with it, stays out of this: a
// single symbol or a pair is what an icon typed as a character looks like.
const GLYPH = /^[^A-Za-z0-9%*\s]{1,2}$/;

/**
 * Whether a text node holds a symbol that belongs in an icon. Percentages and
 * asterisks are real characters. So is the dot between a tour's name and its
 * position: React writes it as `<span aria-hidden>·</span>`, an icon library
 * has no business with it, and it is exempt only as a layer named Separator, so
 * a dot typed anywhere else, and any other glyph typed in a Separator, counts.
 */
export function isTypedGlyph(node) {
  if (node.type !== "TEXT") return false;
  const characters = (node.characters || "").trim();
  if (!GLYPH.test(characters)) return false;
  return !(node.name === "Separator" && characters === "·");
}

// What rounding leaves; the overflow rule's tolerance, for the same reason.
const SHORT_TOLERANCE = 1.5;

/**
 * Layers stretched over the whole of an auto-layout frame that stop short of
 * it, one line each, in `name`'s set.
 *
 * The box the eye sees is often not the frame. A translucent fill or edge is an
 * absolute layer of its own (a strength on a bound paint does not hold), and
 * the overflow rule skips every absolute layer, rightly: 901 of the file's 913
 * are focus rings, larger than their frames on purpose. So when TourStep's
 * instruction hugged its two lines at 55 and its fill and edge stopped at 39,
 * nothing could say so: the words were inside their box and the box inside the
 * frame. A layer stretched both ways says it means to cover the frame, which a
 * focus ring past it, or a scrollbar stretched one way, does not.
 */
export function layersShortOfTheirFrame(name, set) {
  const found = [];
  const seen = new Set();
  (function walk(node) {
    const frame = node.absoluteBoundingBox;
    for (const child of node.children || []) {
      if (child.visible === false) continue;
      const constraints = child.constraints || {};
      const box = child.absoluteBoundingBox;
      if (
        frame &&
        box &&
        node.layoutMode &&
        child.layoutPositioning === "ABSOLUTE" &&
        constraints.horizontal === "LEFT_RIGHT" &&
        constraints.vertical === "TOP_BOTTOM"
      ) {
        const short = Math.max(
          frame.width - box.width,
          frame.height - box.height,
        );
        const key = `${node.name}|${child.name}`;
        if (short > SHORT_TOLERANCE && !seen.has(key)) {
          seen.add(key);
          found.push(
            `${name} / ${node.name} > ${child.name} — ${Math.round(box.width)}x${Math.round(box.height)} over a ${Math.round(frame.width)}x${Math.round(frame.height)} frame (short by ${Math.round(short)})`,
          );
        }
      }
      walk(child);
    }
  })(set);
  return found;
}
