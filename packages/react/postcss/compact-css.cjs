// eslint-disable-next-line @typescript-eslint/no-require-imports
const valueParser = require("postcss-value-parser");

// The last step before the minifier: what esbuild leaves in React's
// stylesheet that changes nothing a browser draws. Each step below is one
// rule, tested on its own (compact-css.test.cjs). This runs on React's
// stylesheet only; @kozmos-ds/tokens ships its CSS as it is written.

// A custom property's value starts after its colon: the space esbuild keeps
// there is not part of it (CSS Syntax 3 trims it). A value of nothing but
// whitespace is left alone.
function customPropertyLeadingSpace(root) {
  root.walkDecls(/^--/, (decl) => {
    if (decl.value.trim()) decl.raws.between = ":";
  });
}

// The at-rules and rules a node sits in, as text: two rules in the same
// context apply under the same conditions.
function contextOf(node) {
  const path = [];
  for (let parent = node.parent; parent && parent.type !== "root"; ) {
    path.unshift(
      parent.type === "atrule"
        ? `@${parent.name} ${parent.params}`
        : parent.selector,
    );
    parent = parent.parent;
  }
  return path.join(" > ");
}

const inKeyframes = (rule) =>
  rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name);

// Whether a value calls var(): a function, not the letters in a string or
// a url() (`content: "var(--x)"` reads nothing).
function readsVar(value) {
  if (!/var\(/i.test(value)) return false;
  let found = false;
  valueParser(value).walk((node) => {
    if (node.type === "function" && node.value.toLowerCase() === "url")
      return false;
    if (node.type === "function" && node.value.toLowerCase() === "var")
      found = true;
  });
  return found;
}

// A declaration a later one of the same property always overrides. Only a
// later declaration that every engine accepts counts: a custom property, or
// a value holding var(), which is valid until it is computed. A later
// `overflow: clip` could be a fallback pair an older engine drops, and is
// never one of these. The later one must be in the same block, or, for a
// custom property, in a later rule with the same selector in the same
// context, and it must not be weaker by !important.
//
// Tailwind writes these where @apply joins utilities: `transition-[…]` sets
// the default duration that a `duration-300` after it overwrites, and
// `animate-in` resets `--tw-enter-opacity` that `fade-in-0` sets next.
function dropOverridden(root) {
  const alwaysValid = (decl) =>
    decl.prop.startsWith("--") || readsVar(decl.value);
  const beaten = (decl, later) =>
    later.prop === decl.prop && (!decl.important || later.important);
  const drop = new Set();
  root.walk((block) => {
    if (!block.nodes || block.type === "root") return;
    const declarations = block.nodes.filter((node) => node.type === "decl");
    declarations.forEach((decl, i) => {
      if (
        declarations
          .slice(i + 1)
          .some((later) => beaten(decl, later) && alwaysValid(later))
      )
        drop.add(decl);
    });
  });
  const bySelector = new Map();
  root.walkRules((rule) => {
    if (inKeyframes(rule)) return;
    const key = `${contextOf(rule)}\u0000${rule.selector}`;
    if (!bySelector.has(key)) bySelector.set(key, []);
    bySelector.get(key).push(rule);
  });
  for (const rules of bySelector.values()) {
    if (rules.length < 2) continue;
    const declarations = rules.flatMap((rule) =>
      rule.nodes.filter((node) => node.type === "decl"),
    );
    declarations.forEach((decl, i) => {
      if (
        decl.prop.startsWith("--") &&
        declarations.slice(i + 1).some((later) => beaten(decl, later))
      )
        drop.add(decl);
    });
  }
  for (const decl of drop) {
    const parent = decl.parent;
    decl.remove();
    if (!parent.nodes.length) parent.remove();
  }
}

// Whitespace no token needs inside a custom property's value: inside a
// function's parentheses, around a comma or a slash, around `*` in calc()
// (`rgba(23, 25, 28, .03)` is `rgba(23,25,28,.03)`, `var( --a )` is
// `var(--a)`). The space between two words, and around `+` and `-` in calc(),
// stays. Custom properties only: esbuild already does this for the rest. It
// draws the same; what getPropertyValue() returns is shorter.
const MATH = new Set(["calc", "min", "max", "clamp"]);
function compactCustomPropertySpaces(nodes, inMath) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "div" && (node.value === "," || node.value === "/")) {
      node.before = "";
      node.after = "";
    }
    if (inMath && node.type === "word" && node.value === "*") {
      if (nodes[i + 1]?.type === "space") nodes.splice(i + 1, 1);
      if (nodes[i - 1]?.type === "space") nodes.splice(--i, 1);
    }
    if (node.type === "function" && node.value !== "url") {
      node.before = "";
      node.after = "";
      compactCustomPropertySpaces(
        node.nodes,
        MATH.has(node.value.toLowerCase()) || (inMath && node.value === ""),
      );
    }
  }
}
function customPropertyInnerWhitespace(root) {
  root.walkDecls(/^--/, (decl) => {
    if (!/[(,/*]/.test(decl.value)) return;
    const parsed = valueParser(decl.value);
    compactCustomPropertySpaces(parsed.nodes, false);
    decl.value = parsed.toString();
  });
}

// A six- or eight-digit hex colour in a custom property, written short where
// each pair repeats (`#ffffff` is `#fff`). The same colour; what
// getPropertyValue() returns is shorter. React's stylesheet only:
// @kozmos-ds/tokens keeps six digits, which tokens:contrast:check reads.
function customPropertyHex(root) {
  root.walkDecls(/^--/, (decl) => {
    if (!decl.value.includes("#")) return;
    const parsed = valueParser(decl.value);
    parsed.walk((node) => {
      if (node.type === "function" && node.value === "url") return false;
      if (node.type !== "word") return;
      const hex = node.value.match(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
      if (!hex) return;
      const pairs = hex.match(/../g);
      if (
        pairs.every((pair) => pair[0].toLowerCase() === pair[1].toLowerCase())
      )
        node.value = `#${pairs.map((pair) => pair[0]).join("")}`;
    });
    decl.value = parsed.toString();
  });
}

// `var(--x, 1)` is `var(--x,1)` in an ordinary property, whose value the
// engine parses after substitution: esbuild prints var() as it is written.
// A var() inside a string or a url() is text, and stays as it is. Custom
// properties are left alone (their text is what getPropertyValue()
// returns).
function varFallbackSpace(root) {
  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--") || !readsVar(decl.value)) return;
    const parsed = valueParser(decl.value);
    let changed = false;
    parsed.walk((node) => {
      if (node.type !== "function") return;
      if (node.value.toLowerCase() === "url") return false;
      if (node.value.toLowerCase() !== "var" || node.before) return;
      const [name, comma] = node.nodes;
      if (
        name?.type === "word" &&
        comma?.type === "div" &&
        comma.value === "," &&
        !comma.before &&
        comma.after
      ) {
        comma.after = "";
        changed = true;
      }
    });
    if (changed) decl.value = parsed.toString();
  });
}

// `transparent` is `#0000`: CSS Color 4 defines it as rgb(0 0 0 / 0), and
// both compute to rgba(0, 0, 0, 0), in forced colours and in a transition
// too. Only in properties whose values are colours, where `transparent`
// cannot be a name (an animation or a grid line called `transparent` stays),
// and never in a custom property, whose text getPropertyValue() returns.
const COLOUR_PROPERTY =
  /^(?:-webkit-)?(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|(?:box|text)-shadow|text-decoration(?:-color)?|caret-color|accent-color|column-rule(?:-color)?|fill|stroke|stop-color|flood-color|lighting-color|scrollbar-color|mask(?:-image)?|tap-highlight-color|text-fill-color|text-stroke(?:-color)?|text-emphasis(?:-color)?)$/;
function transparentKeyword(root) {
  root.walkDecls(COLOUR_PROPERTY, (decl) => {
    if (!/transparent/i.test(decl.value)) return;
    const parsed = valueParser(decl.value);
    parsed.walk((node) => {
      if (node.type === "function" && node.value === "url") return false;
      if (node.type === "word" && node.value.toLowerCase() === "transparent")
        node.value = "#0000";
    });
    decl.value = parsed.toString();
  });
}

// Tailwind's banner, `/*! tailwindcss v… | MIT License | … */`: the package
// ships Tailwind CSS's licence, copyright notice and all, in
// THIRD-PARTY-NOTICES (compact-css.test.cjs holds it there), which the
// banner never carried. Any other `/*!` comment stays.
function dropTailwindBanner(root) {
  root.walkComments((comment) => {
    if (/^!\s*tailwindcss v[\d.]+ \| MIT License\b/.test(comment.text))
      comment.remove();
  });
}

// Properties that interact in the cascade: a shorthand and its longhands,
// logical and physical sides, prefixed and standard names. Custom properties
// by name.
const FAMILIES = [
  [/^(?:top|right|bottom|left|inset.*)$/, "inset"],
  [/^margin/, "margin"],
  [/^padding/, "padding"],
  [/^border/, "border"],
  [/^(?:width|height|inline-size|block-size)$/, "size"],
  [/^min-(?:width|height|inline-size|block-size)$/, "min-size"],
  [/^max-(?:width|height|inline-size|block-size)$/, "max-size"],
  [/^overflow/, "overflow"],
  [/^(?:font|line-height)/, "font"],
  [/^background/, "background"],
  [/^transition/, "transition"],
  [/^animation/, "animation"],
  [/^outline/, "outline"],
  [/^(?:grid|gap|row-gap|column-gap)/, "grid"],
  [/^flex/, "flex"],
  [/^(?:place-|align-|justify-)/, "align"],
  [/^text-decoration/, "text-decoration"],
  [/^mask/, "mask"],
  [/^scroll-margin/, "scroll-margin"],
  [/^scroll-padding/, "scroll-padding"],
  [/^list-style/, "list-style"],
  [/^column/, "columns"],
  [/^overscroll/, "overscroll"],
  [/^container/, "container"],
  [/^contain/, "contain"],
  [/^text-emphasis/, "text-emphasis"],
  [/^(?:white-space|text-wrap)/, "white-space"],
  [/^(?:transform|translate|rotate|scale)$/, "transform"],
  [/^offset/, "offset"],
];
function familyOf(prop) {
  const name = prop.toLowerCase().replace(/^-(?:webkit|moz|ms|o)-/, "");
  if (name.startsWith("--")) return name;
  return FAMILIES.find(([pattern]) => pattern.test(name))?.[1] ?? name;
}
// In a selector list, one selector an engine cannot parse drops the whole
// rule, so a merge joins only selectors every floor engine parses (Chrome
// and Edge 118, Safari 17.4, Firefox 146): classes, ids, types, attributes,
// combinators, and the pseudo-classes and pseudo-elements below, each
// older than all three. An allow-list, so a new one (`::checkmark`, `:open`)
// or a vendor's (`::-webkit-scrollbar`) is never merged until it is added
// here. Nesting (`&`) is not floor CSS either.
const FLOOR_PSEUDO_CLASSES = new Set([
  "active",
  "any-link",
  "checked",
  "default",
  "defined",
  "disabled",
  "empty",
  "enabled",
  "first-child",
  "first-of-type",
  "focus",
  "focus-visible",
  "focus-within",
  "has",
  "hover",
  "in-range",
  "indeterminate",
  "invalid",
  "is",
  "lang",
  "last-child",
  "last-of-type",
  "link",
  "not",
  "nth-child",
  "nth-last-child",
  "nth-last-of-type",
  "nth-of-type",
  "only-child",
  "only-of-type",
  "optional",
  "out-of-range",
  "placeholder-shown",
  "read-only",
  "read-write",
  "required",
  "root",
  "scope",
  "target",
  "valid",
  "visited",
  "where",
]);
const FLOOR_PSEUDO_ELEMENTS = new Set([
  "after",
  "before",
  "first-letter",
  "first-line",
  "marker",
  "placeholder",
  "selection",
]);
// CSS 2's single-colon pseudo-elements.
const LEGACY_PSEUDO_ELEMENTS = new Set([
  "after",
  "before",
  "first-letter",
  "first-line",
]);
function parsedEverywhere(selector) {
  const bare = selector
    .replace(/\\./g, "_")
    .replace(/"[^"]*"|'[^']*'/g, '""')
    .replace(/\[[^\]]*\]/g, "[]");
  if (bare.includes("&")) return false;
  for (const [, colons, name] of bare.matchAll(/(::?)(-?[a-zA-Z][\w-]*)/g)) {
    const pseudo = name.toLowerCase();
    if (
      colons === "::"
        ? !FLOOR_PSEUDO_ELEMENTS.has(pseudo)
        : !FLOOR_PSEUDO_CLASSES.has(pseudo) &&
          !LEGACY_PSEUDO_ELEMENTS.has(pseudo)
    )
      return false;
  }
  return true;
}

// Rules with the same declarations in the same parent become one rule with a
// selector list, where the last of them stands. Each selector keeps its own
// weight, so only the earlier rules move, and a rule moves only when no rule
// between it and the last one, in any context, sets a property of the same
// family: nothing it used to lose to or beat changes.
function mergeIdenticalRules(root) {
  const rules = [];
  root.walkRules((rule) => {
    if (!inKeyframes(rule)) rules.push(rule);
  });
  const index = new Map(rules.map((rule, i) => [rule, i]));
  const families = rules.map((rule) => {
    const set = new Set();
    rule.walkDecls((decl) => set.add(familyOf(decl.prop)));
    return set;
  });
  const overlaps = (a, b) =>
    a.has("all") || b.has("all") || [...a].some((family) => b.has(family));
  const block = (rule) =>
    rule.nodes
      .filter((node) => node.type !== "comment")
      .map((node) =>
        node.type === "decl"
          ? `${node.prop}:${node.value.trim()}${node.important ? "!important" : ""}`
          : node.toString(),
      )
      .join(";");
  const groups = new Map();
  for (const rule of rules) {
    if (!rule.nodes.some((node) => node.type === "decl")) continue;
    if (
      rule.nodes.some((node) => node.type !== "decl" && node.type !== "comment")
    )
      continue;
    const key = `${contextOf(rule)}\u0000${block(rule)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rule);
  }
  for (const group of groups.values()) {
    if (group.length < 2 || new Set(group.map((r) => r.selector)).size < 2)
      continue;
    if (!group.every((rule) => rule.selectors.every(parsedEverywhere)))
      continue;
    let chain = [group[0]];
    const flush = () => {
      if (chain.length < 2) return;
      const last = chain[chain.length - 1];
      last.selector = chain.map((rule) => rule.selector).join(",");
      for (const rule of chain.slice(0, -1)) rule.remove();
    };
    for (const next of group.slice(1)) {
      const from = index.get(chain[0]);
      const to = index.get(next);
      const inChain = new Set(chain);
      let clear = true;
      for (let i = from + 1; i < to && clear; i++)
        if (!inChain.has(rules[i]) && overlaps(families[to], families[i]))
          clear = false;
      if (clear) chain.push(next);
      else {
        flush();
        chain = [next];
      }
    }
    flush();
  }
}

// A conditional group left with nothing in it: a merge can empty an
// @media. Only these mean nothing empty. An empty `@layer a {}` still puts
// layer a before the layers after it, and an empty `@keyframes` still names
// an animation, so they stay.
const CONDITIONAL_GROUP = /^(?:media|supports|container|scope)$/i;
function dropEmptyAtRules(root) {
  let again = true;
  while (again) {
    again = false;
    root.walkAtRules(CONDITIONAL_GROUP, (rule) => {
      if (rule.nodes && rule.nodes.length === 0) {
        rule.remove();
        again = true;
      }
    });
  }
}

const STEPS = [
  dropOverridden,
  customPropertyLeadingSpace,
  customPropertyInnerWhitespace,
  customPropertyHex,
  varFallbackSpace,
  transparentKeyword,
  dropTailwindBanner,
  mergeIdenticalRules,
  dropEmptyAtRules,
];

module.exports = () => ({
  postcssPlugin: "kozmos-compact-css",
  OnceExit(root) {
    for (const step of STEPS) step(root);
  },
});
module.exports.postcss = true;
module.exports.steps = {
  dropOverridden,
  customPropertyLeadingSpace,
  customPropertyInnerWhitespace,
  customPropertyHex,
  varFallbackSpace,
  transparentKeyword,
  dropTailwindBanner,
  mergeIdenticalRules,
  dropEmptyAtRules,
};
