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

const isStroked = (node) =>
  (node.strokes || []).some((paint) => paint.visible !== false) &&
  ((node.strokeWeight || 0) > 0 ||
    Object.values(node.individualStrokeWeights || {}).some((w) => w > 0));

/**
 * Edges laid out in some of a set's variants and not in others, one line per
 * layer, in `name`'s set.
 *
 * Whether an auto-layout frame's stroke takes room (strokesIncludedInLayout)
 * is set when Figma makes the frame, and the default moved: frames an Update
 * keeps from before leave their edge out, and frames it makes now lay it in.
 * So a variant added to an old set came out a pixel smaller inside on each
 * side than its siblings: Sidebar's Flush slots were 246 beside Default's 248,
 * and Navbar's new Action 74 by 22 beside 72 by 20. A layer at the
 * same place in every variant is one design, so its edge takes room in all of
 * them or in none.
 */
export function strokeLayoutsThatDisagree(name, set) {
  const byPath = new Map();
  for (const variant of set.children || []) {
    (function walk(node, at) {
      if (node.layoutMode && node.layoutMode !== "NONE" && isStroked(node)) {
        const split = byPath.get(at) || { in: [], out: [] };
        split[node.strokesIncludedInLayout ? "in" : "out"].push(variant.name);
        byPath.set(at, split);
      }
      for (const child of node.children || []) {
        if (child.visible !== false) walk(child, `${at} > ${child.name}`);
      }
    })(variant, "");
  }
  const found = [];
  for (const [at, split] of byPath) {
    if (split.in.length === 0 || split.out.length === 0) continue;
    found.push(
      `${name} / ${at ? at.slice(3) : "variant root"} — laid out in ${split.in.length} variant(s) (${split.in[0]}), not in ${split.out.length} (${split.out[0]})`,
    );
  }
  return found;
}

/**
 * Variants that cover one another in `name`'s set, one line per pair.
 *
 * A set lays its variants out on a grid of fixed steps, and a variant that
 * grows past its step covers the row under it: Card's Full grew to 234 on a
 * 220 step and covered the Compact row by 14, EmptyState's by 8. Nothing
 * else read where variants sit, so it showed only in a render.
 */
export function variantsThatOverlap(name, set) {
  const boxes = (set.children || [])
    .filter((child) => child.type === "COMPONENT" && child.visible !== false)
    .map((child) => ({ name: child.name, box: child.absoluteBoundingBox }))
    .filter((entry) => entry.box);
  const found = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i].box;
      const b = boxes[j].box;
      const across =
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const down =
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (across > SHORT_TOLERANCE && down > SHORT_TOLERANCE) {
        found.push(
          `${name} / ${boxes[i].name} and ${boxes[j].name} — ${Math.round(across)}x${Math.round(down)} of one covers the other`,
        );
      }
    }
  }
  return found;
}
