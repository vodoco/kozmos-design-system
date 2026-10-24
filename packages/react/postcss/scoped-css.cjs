// eslint-disable-next-line @typescript-eslint/no-require-imports
const postcss = require("postcss");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const valueParser = require("postcss-value-parser");

// Factor only the canonical pair of token-only theme rules. Keep BOTH selectors:
// deleting the dark declaration alone would lower its cascade specificity.
// Custom properties are resolved at use time, so shared aliases still resolve
// against each root's own theme. Never reorder fallback/duplicate declarations,
// mixed component recipes or multiple root definitions.
function shareThemeTokens(foundations) {
  const lightSelector = "[data-kozmos-root]";
  const darkSelector = '[data-kozmos-root][data-theme="dark"]';
  const themes = foundations.filter(
    (rule) => rule.selector === lightSelector || rule.selector === darkSelector,
  );
  if (themes.length !== 2) return foundations;
  const [light, dark] = themes;
  if (light.selector !== lightSelector || dark.selector !== darkSelector)
    return foundations;
  const tokens = (rule) => {
    const result = new Map();
    for (const node of rule.nodes) {
      if (node.type === "comment") continue;
      if (
        node.type !== "decl" ||
        !node.prop.startsWith("--") ||
        result.has(node.prop)
      )
        return null;
      result.set(node.prop, node);
    }
    return result;
  };
  const left = tokens(light),
    right = tokens(dark);
  if (!left || !right) return foundations;
  const shared = postcss.rule({
    selector: `${lightSelector}, ${darkSelector}`,
  });
  for (const [name, declaration] of left) {
    const other = right.get(name);
    if (
      !other ||
      declaration.value !== other.value ||
      Boolean(declaration.important) !== Boolean(other.important)
    )
      continue;
    shared.append(declaration.clone());
    declaration.remove();
    other.remove();
  }
  if (!shared.nodes?.length) return foundations;
  return foundations.flatMap((rule) =>
    rule === light ? [shared, light] : [rule],
  );
}

// Tailwind 3 declares its compiler variables' defaults on every element
// (`*, ::before, ::after` and `::backdrop`, 51 of them), so that none
// inherits a value an ancestor's utility set. Declared there, they gave every
// element inside a root its own copy of them, which WebKit rebuilds whenever
// a root's theme changes: on a Mac, re-theming the site's home page
// restyled it in 124ms in WebKit with them, 100ms without (Chromium 19 and
// 22, Firefox 13 and 11). Registered with `inherits: false` instead, an
// element that sets none starts at the initial value without declaring
// anything, and still inherits nothing (Chrome 85, Safari 16.4, Firefox 128;
// Kozmos's floor is above all three).
//
// A registration applies to the whole document, and Tailwind 4 registers
// many of the same names, so each is registered as Tailwind 4.3.3 registers
// it, with its syntax and its initial value or none: on a page with both, it
// does not matter which stylesheet comes last. `null`: Tailwind 4 has no such
// variable, so it takes Tailwind 3's default. Where a name is registered
// without an initial value, as Tailwind 4 registers the filters, the ring's
// colour and inset, the skews and the rest, Kozmos's reads of it carry
// Tailwind 3's default as their fallback.
const TAILWIND_4_REGISTRATION = {
  "--tw-border-spacing-x": { initial: "0", syntax: "<length>" },
  "--tw-border-spacing-y": { initial: "0", syntax: "<length>" },
  "--tw-translate-x": { initial: "0" },
  "--tw-translate-y": { initial: "0" },
  "--tw-rotate": null,
  "--tw-skew-x": {},
  "--tw-skew-y": {},
  "--tw-scale-x": { initial: "1" },
  "--tw-scale-y": { initial: "1" },
  "--tw-pan-x": {},
  "--tw-pan-y": {},
  "--tw-pinch-zoom": {},
  "--tw-scroll-snap-strictness": { initial: "proximity" },
  "--tw-gradient-from-position": {
    initial: "0%",
    syntax: "<length-percentage>",
  },
  "--tw-gradient-via-position": {
    initial: "50%",
    syntax: "<length-percentage>",
  },
  "--tw-gradient-to-position": {
    initial: "100%",
    syntax: "<length-percentage>",
  },
  "--tw-ordinal": {},
  "--tw-slashed-zero": {},
  "--tw-numeric-figure": {},
  "--tw-numeric-spacing": {},
  "--tw-numeric-fraction": {},
  "--tw-ring-inset": {},
  "--tw-ring-offset-width": { initial: "0px", syntax: "<length>" },
  "--tw-ring-offset-color": { initial: "#fff" },
  "--tw-ring-color": {},
  "--tw-ring-offset-shadow": { initial: "0 0 #0000" },
  "--tw-ring-shadow": { initial: "0 0 #0000" },
  "--tw-shadow": { initial: "0 0 #0000" },
  "--tw-shadow-colored": null,
  "--tw-blur": {},
  "--tw-brightness": {},
  "--tw-contrast": {},
  "--tw-grayscale": {},
  "--tw-hue-rotate": {},
  "--tw-invert": {},
  "--tw-saturate": {},
  "--tw-sepia": {},
  "--tw-drop-shadow": {},
  "--tw-backdrop-blur": {},
  "--tw-backdrop-brightness": {},
  "--tw-backdrop-contrast": {},
  "--tw-backdrop-grayscale": {},
  "--tw-backdrop-hue-rotate": {},
  "--tw-backdrop-invert": {},
  "--tw-backdrop-opacity": {},
  "--tw-backdrop-saturate": {},
  "--tw-backdrop-sepia": {},
  "--tw-contain-size": {},
  "--tw-contain-layout": {},
  "--tw-contain-paint": {},
  "--tw-contain-style": {},
};

// The compiler-variable initialiser: a `*, ::before, ::after` or
// `::backdrop` rule that declares nothing but --tw-* custom properties.
// Tailwind's own reset shares the first selector and declares more.
function isCompilerDefaults(rule) {
  const selector = rule.selector.replace(/\s/g, "");
  if (selector !== "*,::before,::after" && selector !== "::backdrop")
    return false;
  const declarations = rule.nodes.filter((node) => node.type !== "comment");
  return (
    declarations.length > 0 &&
    declarations.every(
      (node) => node.type === "decl" && node.prop.startsWith("--tw-"),
    )
  );
}

// Registers every compiler variable the stylesheet reads, and gives each read
// of one registered without an initial value Tailwind 3's default as its
// fallback. Unread defaults are dropped.
function registerCompilerDefaults(root, defaults) {
  if (!defaults.size) return;
  const initialOf = (name) => {
    const registration = TAILWIND_4_REGISTRATION[name];
    return registration === null
      ? defaults.get(name) || undefined
      : registration.initial;
  };
  const read = new Set();
  root.walkDecls((decl) => {
    if (!decl.value.includes("var(--tw-")) return;
    decl.value = decl.value.replace(
      /var\(\s*(--tw-[\w-]+)\s*(,|\))/g,
      (whole, name, next) => {
        if (!defaults.has(name)) return whole;
        read.add(name);
        if (next === "," || initialOf(name) !== undefined) return whole;
        const fallback = defaults.get(name);
        return `var(${name},${fallback ? ` ${fallback}` : ""})`;
      },
    );
  });
  const properties = [];
  for (const name of defaults.keys()) {
    if (!read.has(name)) continue;
    const syntax = TAILWIND_4_REGISTRATION[name]?.syntax ?? "*";
    const nodes = [
      postcss.decl({ prop: "syntax", value: `"${syntax}"` }),
      postcss.decl({ prop: "inherits", value: "false" }),
    ];
    const initial = initialOf(name);
    if (initial !== undefined)
      nodes.push(postcss.decl({ prop: "initial-value", value: initial }));
    properties.push(postcss.atRule({ name: "property", params: name, nodes }));
  }
  root.prepend(...properties);
}

// Run after token imports and Tailwind expansion. Do not rewrite generated
// selectors indiscriminately: roots, variants and keyframes have different semantics.
module.exports = () => ({
  postcssPlugin: "kozmos-scoped-css",
  OnceExit(root) {
    // Migration boundary, not a browser fallback: these rules have their own
    // namespaced targets and are emitted once, identically for every engine.
    const owned = [];
    root.walkAtRules("kozmos-owned", (rule) => {
      rule.walkAtRules("scope", (scope) => {
        throw scope.error("Component-owned CSS must not depend on @scope");
      });
      owned.push(...rule.nodes.map((node) => node.clone()));
      rule.remove();
    });
    const foundations = [];
    const tailwindDefaults = new Map();
    // Density (decision 82): @kozmos-ds/tokens/css/density.css sets the
    // control sizes on `:root, [data-kozmos-density='touch']` and on
    // `[data-kozmos-density='compact']`. A provider marks its own root, so
    // these belong on the roots like the theme tokens, never inside @scope,
    // where `:scope [data-kozmos-density]` would match only below a root.
    // Touch is every root that is not compact, a root without the attribute
    // included; either density is any element marked with it, which resets
    // the sizes for everything inside: a nested root, a DensityScope (every
    // SDK part's root is a touch one), or an element a portal marks with the
    // density where it opened.
    const densityRoot = (rule) => {
      const selectors = rule.selectors.map((s) => s.replace(/"/g, "'"));
      if (
        selectors.length === 2 &&
        selectors[0] === ":root" &&
        selectors[1] === "[data-kozmos-density='touch']"
      )
        return '[data-kozmos-root]:not([data-kozmos-density="compact"]), [data-kozmos-density="touch"]';
      if (
        selectors.length === 1 &&
        selectors[0] === "[data-kozmos-density='compact']"
      )
        return '[data-kozmos-density="compact"]';
      return null;
    };
    root.walkRules((rule) => {
      const density = densityRoot(rule);
      if (density) {
        const copy = rule.clone();
        copy.selector = density;
        foundations.push(copy);
        rule.remove();
      } else if (
        rule.selector === ":root" ||
        /^\[data-theme=['"]dark['"]\]$/.test(rule.selector)
      ) {
        const copy = rule.clone();
        copy.selector =
          rule.selector === ":root"
            ? "[data-kozmos-root]"
            : '[data-kozmos-root][data-theme="dark"]';
        foundations.push(copy);
        rule.remove();
      } else if (isCompilerDefaults(rule)) {
        // Registered at the end (registerCompilerDefaults), never declared on
        // every element, inside a root or on an owned part.
        for (const node of rule.nodes) {
          if (node.type !== "decl") continue;
          if (!(node.prop in TAILWIND_4_REGISTRATION))
            throw node.error(
              `${node.prop} is a Tailwind default the registration table does not know: add how Tailwind 4 registers it`,
            );
          tailwindDefaults.set(node.prop, node.value.trim());
        }
        rule.remove();
      }
    });
    root.walkRules((rule) => {
      if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))
        return;
      // Tailwind's reset is matched here by its selector, which it shares
      // with the compiler-variable initialiser removed above, and so keeps
      // :scope's weight where the rest of the preflight weighs nothing:
      // GAP-52, the border a caller's class cannot set (apps/site/GAPS.md).
      const compilerDefaults =
        rule.selector.replace(/\s/g, "") === "*,::before,::after";
      rule.selectors = rule.selectors.map((selector) => {
        if (selector === ":root" || selector === "html" || selector === ":host")
          return ":scope";
        if (/^\[data-theme=['"]dark['"]\]$/.test(selector))
          return ':scope[data-theme="dark"]';
        // @scope supplies the boundary; :scope supplies predictable precedence
        // over generic host reset/utility rules without using !important.
        if (rule.raws.tailwind?.layer === "base" || compilerDefaults) {
          // The legacy preflight must not reset a migrated component. Keep
          // utilities active so existing consumer overrides still work.
          const pseudo = selector.indexOf("::");
          const at = pseudo < 0 ? selector.length : pseudo;
          selector = `${selector.slice(0, at)}:not(:where(.kozmos-reset))${selector.slice(at)}`;
          // A reset is a fallback, not a component style. Giving preflight
          // :scope specificity made it override product heading/spacing classes.
          // Keep its boundary and exclusions, but contribute zero specificity.
          if (!compilerDefaults) return `:where(:scope ${selector})`;
        }
        return `:scope ${selector}`;
      });
    });
    const scope = postcss.atRule({
      name: "scope",
      params: "([data-kozmos-root]) to ([data-kozmos-root])",
    });
    scope.append(root.nodes.slice());
    root.append(...shareThemeTokens(foundations), scope, ...owned);
    root.append(
      postcss.parse(`
      [data-kozmos-root] {
        color: var(--primitives-colors-foreground-0);
        font-family: var(--semantics-typography-family-system);
        line-height: 1.5;
        color-scheme: light;
        --kozmos-glass-rgb: 255, 255, 255;
      }
      [data-kozmos-root][data-theme="dark"] {
        color-scheme: dark;
        --kozmos-glass-rgb: 0, 0, 0;
      }
    `).nodes,
    );
    const names = new Map();
    const keyframes = [];
    root.walkAtRules(/keyframes$/, (rule) => keyframes.push(rule));
    for (const rule of keyframes) {
      const name = rule.params;
      names.set(name, `kozmos-${name}`);
      rule.params = names.get(name);
      // Keyframes are already uniquely named and need to serve both the
      // migrated components and the remaining scoped utilities.
      if (rule.parent === scope) {
        rule.remove();
        root.append(rule);
      }
    }
    registerCompilerDefaults(root, tailwindDefaults);
    root.walkDecls(/^(?:-webkit-)?animation(?:-name)?$/, (decl) => {
      const value = valueParser(decl.value);
      value.walk((node) => {
        if (node.type === "word" && names.has(node.value))
          node.value = names.get(node.value);
      });
      decl.value = value.toString();
    });
  },
});
module.exports.postcss = true;
// Read by scripts/check-compiler-defaults.mjs.
module.exports.TAILWIND_4_REGISTRATION = TAILWIND_4_REGISTRATION;
