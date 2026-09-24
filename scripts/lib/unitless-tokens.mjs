/**
 * A token that is a bare number is not a length — the reading half.
 *
 * The layout tokens are emitted as unitless numbers (`--primitives-layout-
 * spacing-200: 16`) because the natives want a number and Tailwind's theme
 * multiplies them itself. In CSS a bare number is not a `<length>`, so
 * `height: var(--primitives-layout-spacing-200)` is invalid: the browser drops
 * the declaration without a word and the property keeps its initial value. The
 * rule reads as if it works. GAP-38 lived in three such declarations for as
 * long as `AdaptiveMapShell` has existed.
 *
 * `scripts/check-unitless-tokens.mjs` reads the repository and prints; this
 * file decides, so `scripts/lib/unitless-tokens.test.mjs` can put known-bad
 * input in front of it without a stylesheet on disk.
 */

/** Properties whose value is, or contains, a `<length>`. */
export const LENGTH_PROPERTIES = new Set([
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "block-size", "inline-size", "min-block-size", "min-inline-size",
  "max-block-size", "max-inline-size",
  "top", "right", "bottom", "left",
  "inset", "inset-block", "inset-inline",
  "inset-block-start", "inset-block-end", "inset-inline-start", "inset-inline-end",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
  "margin-block", "margin-inline", "margin-block-start", "margin-block-end",
  "margin-inline-start", "margin-inline-end",
  "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "padding-block", "padding-inline", "padding-block-start", "padding-block-end",
  "padding-inline-start", "padding-inline-end",
  "gap", "row-gap", "column-gap",
  "border-radius", "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius",
  "border-width", "border-top-width", "border-right-width",
  "border-bottom-width", "border-left-width",
  "border", "border-top", "border-right", "border-bottom", "border-left",
  "border-block", "border-inline", "outline", "outline-width", "outline-offset",
  "box-shadow", "text-shadow", "flex-basis", "font-size", "font",
  "letter-spacing", "word-spacing", "text-indent", "text-underline-offset",
  "text-decoration-thickness", "stroke-width", "stroke-dasharray",
  "stroke-dashoffset", "scroll-padding", "scroll-margin", "border-spacing",
  "background-size", "background-position", "mask-size", "mask-position",
  "object-position", "perspective", "perspective-origin", "transform-origin",
  "translate", "grid-template-columns", "grid-template-rows",
  "grid-auto-columns", "grid-auto-rows", "columns", "column-width",
  "column-rule-width", "shape-margin", "clip-path",
]);

/**
 * Functions whose arguments are lengths. They carry the bug into properties
 * whose own name promises nothing — `filter`, `transform`, `backdrop-filter`.
 */
export const LENGTH_FUNCTIONS = new Set([
  "blur", "drop-shadow", "perspective", "translate", "translatex", "translatey",
  "translatez", "translate3d", "inset", "circle", "ellipse", "polygon", "round",
  "rect", "xywh",
]);

/**
 * Functions whose arguments are not lengths, however length-shaped the property
 * around them is. `border: 1px solid rgba(255, 255, 255, var(--opacity))` reads
 * an alpha, and the property's name must not convict it.
 */
export const NOT_LENGTH_FUNCTIONS = new Set([
  "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch",
  "color", "color-mix", "light-dark", "cubic-bezier", "steps", "linear",
  "scale", "scalex", "scaley", "scalez", "scale3d", "rotate", "rotatex",
  "rotatey", "rotatez", "rotate3d", "skew", "skewx", "skewy", "opacity",
  "saturate", "brightness", "contrast", "grayscale", "sepia", "invert",
  "hue-rotate", "counter", "counters", "attr", "url", "format", "local",
]);

/**
 * A token reaches a length only by being multiplied by a unit. `* 1rem / 16` is
 * the typography rules' form of the same thing.
 */
const CONVERTED =
  /^var\((?:[^()]|\([^()]*\))*\)\s*\*\s*1(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/;

/** The same, for a Tailwind arbitrary value, which carries no spaces. */
const CONVERTED_ARBITRARY = /\*\s*1(px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/;

/** Every custom property in the token stylesheets whose value is a bare number. */
export function unitlessTokensFrom(cssTexts) {
  const unitless = new Set();
  for (const css of cssTexts) {
    for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
      if (/^-?\d+(\.\d+)?$/.test(match[2].trim())) unitless.add(match[1]);
    }
  }
  return unitless;
}

/**
 * The name of the innermost function an offset sits inside, or null. `var()`
 * and `calc()` are transparent: a token inside `var(--a, blur(…))` is read from
 * its own enclosing function, not from the `var` around it.
 */
export function enclosingFunction(value, offset) {
  const stack = [];
  for (let i = 0; i < offset; i += 1) {
    const character = value[i];
    if (character === "(") {
      const name = value.slice(0, i).match(/([a-zA-Z-]+)$/);
      stack.push(name ? name[1].toLowerCase() : "");
    } else if (character === ")") {
      stack.pop();
    }
  }
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i] !== "var" && stack[i] !== "calc" && stack[i] !== "") return stack[i];
  }
  return null;
}

/** Unitless tokens reaching a length in one stylesheet. */
export function findInStylesheet({ path: file, text }, unitless) {
  const found = [];
  // Blank comments out rather than removing them, so line numbers survive.
  const src = text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  for (const decl of src.matchAll(/(?:^|[;{])\s*([a-z-]+)\s*:\s*([^;{}]*?)\s*(?=[;}])/g)) {
    const property = decl[1];
    const value = decl[2];
    if (!value.includes("var(--")) continue;
    for (const use of value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const token = use[1];
      if (!unitless.has(token)) continue;
      if (CONVERTED.test(value.slice(use.index))) continue;
      const fn = enclosingFunction(value, use.index);
      if (fn && NOT_LENGTH_FUNCTIONS.has(fn)) continue;
      const wantsLength = fn ? LENGTH_FUNCTIONS.has(fn) : LENGTH_PROPERTIES.has(property);
      if (!wantsLength) continue;
      found.push({
        file,
        line: src.slice(0, decl.index + decl[0].indexOf(property)).split("\n").length,
        token,
        message: `${property}: var(${token}) — ${token} is a bare number, so this declaration is dropped. Write calc(var(${token}) * 1px).`,
      });
    }
  }
  return found;
}

/**
 * The same bug in a Tailwind arbitrary value — `h-[var(--…)]` — which never
 * reaches a stylesheet this check could read as CSS.
 */
export function findInSource({ path: file, text }, unitless) {
  const found = [];
  for (const use of text.matchAll(/([a-z-]+)-\[\s*(var\(\s*(--[a-z0-9-]+)[^\]]*)\]/g)) {
    const [, utility, expression, token] = use;
    if (!unitless.has(token)) continue;
    if (CONVERTED_ARBITRARY.test(expression)) continue;
    found.push({
      file,
      line: text.slice(0, use.index).split("\n").length,
      token,
      message: `${utility}-[${expression}] — ${token} is a bare number; an arbitrary value takes it verbatim, so the class compiles to a dropped declaration. Write ${utility}-[calc(var(${token})*1px)].`,
    });
  }
  return found;
}

/** Every finding, over stylesheets and source files alike. */
export function findUnitlessLengths({ unitless, stylesheets = [], sources = [] }) {
  return [
    ...stylesheets.flatMap((file) => findInStylesheet(file, unitless)),
    ...sources.flatMap((file) => findInSource(file, unitless)),
  ];
}
