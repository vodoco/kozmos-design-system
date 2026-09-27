// eslint-disable-next-line @typescript-eslint/no-require-imports
const valueParser = require("postcss-value-parser");

// `kozmos-shadow-reach(--token side)` becomes how far the box-shadow that the
// custom property `--token` holds paints beyond its box on that side, in px:
// for each layer, its blur and spread less its offset towards the side.
//
// The blur distance is where a shadow ends: the CSS spec draws the blur as a
// Gaussian of half that deviation and lets a browser round anything past it
// away, and it is where Chromium's, Firefox's and WebKit's drawings of the
// elevation roles end on both themes' maps (measured for GAP-082).
//
// Read from the token's own declarations in the stylesheet being built — the
// light theme's and the dark theme's — taking the largest, so a room made from
// it is the token's room and follows it when the token changes. `inline` is
// the larger of left and right: a shadow does not turn round right to left,
// so the same room on both inline sides is right in both directions.
const NAME = "kozmos-shadow-reach";
const SIDES = new Set(["top", "right", "bottom", "left", "inline"]);
const COLOUR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
]);

function layers(value) {
  const found = [[]];
  for (const node of valueParser(value).nodes) {
    if (node.type === "div" && node.value === ",") found.push([]);
    else if (node.type !== "space" && node.type !== "comment")
      found[found.length - 1].push(node);
  }
  return found;
}

/** Per physical side, how far one declared shadow paints beyond its box. */
function reachOf(value, fail) {
  const reach = { top: 0, right: 0, bottom: 0, left: 0 };
  if (value.trim() === "none") return reach;
  for (const nodes of layers(value)) {
    // An inset shadow is drawn inside the box.
    if (nodes.some((node) => node.type === "word" && node.value === "inset"))
      continue;
    const lengths = [];
    for (const node of nodes) {
      if (node.type === "function") {
        if (COLOUR_FUNCTIONS.has(node.value.toLowerCase())) continue;
        fail(`cannot measure ${node.value}() in "${value}"`);
      }
      const unit = valueParser.unit(node.value);
      if (!unit) continue; // a colour keyword or hex
      const number = Number(unit.number);
      if (unit.unit !== "px" && !(unit.unit === "" && number === 0))
        fail(
          `only px lengths can be measured, not "${node.value}" in "${value}"`,
        );
      lengths.push(number);
    }
    if (lengths.length < 2 || lengths.length > 4)
      fail(`"${value}" is not a box-shadow`);
    const [x, y, blur = 0, spread = 0] = lengths;
    if (blur < 0) fail(`"${value}" has a negative blur`);
    const out = blur + spread;
    reach.top = Math.max(reach.top, out - y);
    reach.bottom = Math.max(reach.bottom, out + y);
    reach.left = Math.max(reach.left, out - x);
    reach.right = Math.max(reach.right, out + x);
  }
  return reach;
}

module.exports = () => ({
  postcssPlugin: "kozmos-shadow-reach",
  OnceExit(root) {
    const reaches = new Map();
    const reachFor = (property, decl) => {
      if (reaches.has(property)) return reaches.get(property);
      const reach = { top: 0, right: 0, bottom: 0, left: 0 };
      let declared = 0;
      root.walkDecls(property, (token) => {
        declared++;
        const one = reachOf(token.value, (message) => {
          throw token.error(`${NAME}: ${message}`);
        });
        for (const side of Object.keys(reach))
          reach[side] = Math.max(reach[side], one[side]);
      });
      if (!declared)
        throw decl.error(
          `${NAME}: ${property} is not declared in this stylesheet`,
        );
      reaches.set(property, reach);
      return reach;
    };
    root.walkDecls((decl) => {
      if (!decl.value.includes(`${NAME}(`)) return;
      const parsed = valueParser(decl.value);
      parsed.walk((node) => {
        if (node.type !== "function" || node.value !== NAME) return;
        const args = node.nodes.filter(
          (arg) => arg.type === "word" || arg.type === "function",
        );
        const [property, side] = args.map((arg) => arg.value);
        if (args.length !== 2 || !property.startsWith("--") || !SIDES.has(side))
          throw decl.error(
            `${NAME}() takes a custom property and one of ${[...SIDES].join(", ")}: ${valueParser.stringify(node)}`,
          );
        const reach = reachFor(property, decl);
        const px =
          side === "inline" ? Math.max(reach.left, reach.right) : reach[side];
        node.type = "word";
        node.value = `${px}px`;
        delete node.nodes;
        return false;
      });
      decl.value = parsed.toString();
    });
  },
});
module.exports.postcss = true;
module.exports.reachOf = reachOf;
