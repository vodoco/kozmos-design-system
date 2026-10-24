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

// Whitespace a value-parser list keeps after nodes have gone from it: no
// space at either end, none twice, none beside a comma.
function tidySpaces(nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.nodes) tidySpaces(node.nodes);
    if (node.type !== "space") continue;
    const previous = nodes[i - 1];
    const next = nodes[i + 1];
    if (
      !previous ||
      !next ||
      next.type === "space" ||
      previous.type === "div" ||
      next.type === "div"
    )
      nodes.splice(i, 1);
  }
}

// A transform term that does nothing: rotate or skew by zero.
const IDENTITY_TERM = /^(?:rotate|skew|skewX|skewY)$/;
function dropIdentityTerms(nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (
      node.type === "function" &&
      IDENTITY_TERM.test(node.value) &&
      /^0(?:deg)?$/.test(valueParser.stringify(node.nodes).trim())
    )
      nodes.splice(i, 1);
  }
}

// Replaces each read of a variable `isUnset` names by what it always gives,
// its fallback, or `fallbackOf(name)` when it has none. Returns the names it
// replaced.
function inlineUnsetReads(nodes, isUnset, fallbackOf, replaced = new Set()) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type !== "function") continue;
    const name = node.value === "var" ? node.nodes[0]?.value : undefined;
    if (name && isUnset(name)) {
      const comma = node.nodes.findIndex(
        (child) => child.type === "div" && child.value === ",",
      );
      const fallback =
        comma < 0
          ? fallbackOf(name)
          : valueParser.stringify(node.nodes.slice(comma + 1)).trim();
      nodes.splice(i, 1, ...valueParser(fallback || "").nodes);
      replaced.add(name);
      i--;
    } else inlineUnsetReads(node.nodes, isUnset, fallbackOf, replaced);
  }
  return replaced;
}

// Registers the compiler variables the stylesheet reads, and gives each read
// of one registered without an initial value Tailwind 3's default as its
// fallback. Unread defaults are dropped.
//
// A variable with no initial value that no declaration sets has no value
// anywhere, so every read of it gives its fallback: the skews, the filter
// and backdrop terms Kozmos never sets, three numeric terms. Those reads are
// written as their fallbacks, a transform term left rotating or skewing by
// zero goes, and the variable is not registered. One that is set later, by a
// utility a component starts using, is read and registered again.
//
// A read whose fallback is the registered initial value never falls back (a
// registered variable always has a value), so its fallback goes:
// `var(--tw-shadow, 0 0 #0000)` is `var(--tw-shadow)`.
function registerCompilerDefaults(root, defaults) {
  if (!defaults.size) return;
  const initialOf = (name) => {
    const registration = TAILWIND_4_REGISTRATION[name];
    return registration === null
      ? defaults.get(name) || undefined
      : registration.initial;
  };
  const set = new Set();
  root.walkDecls(/^--tw-/, (decl) => set.add(decl.prop));
  const isUnset = (name) =>
    defaults.has(name) && initialOf(name) === undefined && !set.has(name);
  const read = new Set();
  const spaces = (text) => text.trim().replace(/\s+/g, " ");
  root.walkDecls((decl) => {
    if (!decl.value.includes("var(--tw-")) return;
    let parsed = valueParser(decl.value);
    let changed = false;
    const replaced = inlineUnsetReads(parsed.nodes, isUnset, (name) =>
      defaults.get(name),
    );
    if (replaced.size) {
      if (/(?:^|-)transform$/.test(decl.prop)) dropIdentityTerms(parsed.nodes);
      tidySpaces(parsed.nodes);
      // Nothing left would be no declaration at all: keep the reads, which
      // keep their registrations.
      if (parsed.toString().trim()) changed = true;
      else parsed = valueParser(decl.value);
    }
    parsed.walk((node) => {
      if (node.type !== "function" || node.value !== "var") return;
      const name = node.nodes[0]?.value;
      if (!defaults.has(name)) return;
      read.add(name);
      const comma = node.nodes.findIndex(
        (child) => child.type === "div" && child.value === ",",
      );
      const initial = initialOf(name);
      if (initial !== undefined) {
        const fallback = valueParser.stringify(node.nodes.slice(comma + 1));
        if (comma >= 0 && spaces(fallback) === spaces(initial)) {
          node.nodes = node.nodes.slice(0, 1);
          node.after = "";
          changed = true;
        }
      } else if (comma < 0) {
        const standard = defaults.get(name);
        node.nodes = [
          node.nodes[0],
          { type: "div", value: ",", before: "", after: standard ? " " : "" },
          ...(standard ? [{ type: "word", value: standard }] : []),
        ];
        node.after = "";
        changed = true;
      }
      return false;
    });
    if (changed) decl.value = parsed.toString().trim();
  });
  // Printed as a minifier would: esbuild leaves an @property's descriptors
  // as they are written.
  const descriptor = (prop, value) =>
    postcss.decl({ prop, value, raws: { before: "", between: ":" } });
  const properties = [];
  for (const name of defaults.keys()) {
    if (!read.has(name)) continue;
    const syntax = TAILWIND_4_REGISTRATION[name]?.syntax ?? "*";
    const nodes = [
      descriptor("syntax", `"${syntax}"`),
      descriptor("inherits", "false"),
    ];
    const initial = initialOf(name);
    if (initial !== undefined) nodes.push(descriptor("initial-value", initial));
    properties.push(
      postcss.atRule({
        name: "property",
        params: name,
        nodes,
        raws: { between: "", semicolon: false, after: "" },
      }),
    );
  }
  root.prepend(...properties);
}

// tailwindcss-animate's variables are not registered, and `animate-in`
// resets each to `initial` for the utility that sets it to read. One that
// only ever is reset (no `spin-in-*` utility is generated, so the rotation)
// never has a value: every read of it gives its fallback. Those reads are
// written as their fallbacks, a rotation by zero goes from the transform,
// and the resets go with them. A variable read anywhere without a fallback
// is left as it is.
function inlineResetOnlyVariables(root) {
  const registered = new Set();
  root.walkAtRules("property", (rule) => registered.add(rule.params.trim()));
  const values = new Map();
  root.walkDecls(/^--tw-/, (decl) => {
    if (registered.has(decl.prop)) return;
    if (!values.has(decl.prop)) values.set(decl.prop, new Set());
    values.get(decl.prop).add(decl.value.trim());
  });
  const resetOnly = new Set(
    [...values]
      .filter(([, set]) => set.size === 1 && set.has("initial"))
      .map(([name]) => name),
  );
  root.walkDecls((decl) => {
    valueParser(decl.value).walk((node) => {
      if (
        node.type === "function" &&
        node.value === "var" &&
        !node.nodes.some((child) => child.type === "div" && child.value === ",")
      )
        resetOnly.delete(node.nodes[0]?.value);
    });
  });
  if (!resetOnly.size) return;
  const resets = [];
  root.walkDecls((decl) => {
    if (resetOnly.has(decl.prop)) {
      resets.push(decl);
      return;
    }
    if (!decl.value.includes("var(--tw-")) return;
    const parsed = valueParser(decl.value);
    const isReset = (name) => resetOnly.has(name);
    if (!inlineUnsetReads(parsed.nodes, isReset, () => "").size) return;
    if (/(?:^|-)transform$/.test(decl.prop)) dropIdentityTerms(parsed.nodes);
    tidySpaces(parsed.nodes);
    const value = parsed.toString().trim();
    if (value) decl.value = value;
  });
  for (const decl of resets) {
    const parent = decl.parent;
    decl.remove();
    if (!parent.nodes.length) parent.remove();
  }
}

// Tailwind 3 writes `--tw-bg-opacity: 1` (and text, border, ring, divide,
// placeholder) beside every colour a utility sets, for a colour of the form
// `rgb(r g b / var(--tw-bg-opacity))` to read. Kozmos's colours are roles,
// `var(--…)`, which read nothing, so in all but a handful of utilities with a
// literal colour the variable is set and never read. Each is dropped where
// the rule sets the colour it belongs to and none of its declarations reads
// it. A rule that sets the variable alone (Tailwind's legacy `bg-opacity-50`,
// read by another rule on the same element) is left alone, and so is any
// value but 1.
const COLOUR_OF_OPACITY = {
  "--tw-text-opacity": /^color$/,
  "--tw-placeholder-opacity": /^color$/,
  "--tw-bg-opacity": /^background-color$/,
  "--tw-border-opacity": /^border(?:-[a-z]+)*-color$/,
  "--tw-divide-opacity": /^border(?:-[a-z]+)*-color$/,
  "--tw-ring-opacity": /^--tw-ring-color$/,
};
function dropUnreadColourOpacity(root) {
  root.walkDecls(/^--tw-[a-z]+-opacity$/, (decl) => {
    const colour = COLOUR_OF_OPACITY[decl.prop];
    if (!colour || decl.value.trim() !== "1") return;
    const siblings = decl.parent.nodes.filter(
      (node) => node.type === "decl" && node !== decl,
    );
    if (!siblings.some((node) => colour.test(node.prop))) return;
    if (siblings.some((node) => node.value.includes(`var(${decl.prop}`)))
      return;
    decl.remove();
  });
}

// A compound selector: one element's conditions, no combinator outside
// brackets or parentheses.
function isCompound(selector) {
  let depth = 0;
  for (const char of selector) {
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(char)) return false;
  }
  return true;
}

// Tailwind's preflight, inside a root, as a fallback that weighs nothing:
// each rule keeps @scope's boundary and skips migrated components
// (.kozmos-reset), but contributes zero specificity, because with :scope's
// weight it overrode product heading and spacing classes. Its compound
// selectors are written as one `:where(:scope :is(…):not(.kozmos-reset))`,
// which matches what one :where() per selector matched: :where() and :is()
// are both forgiving, so a selector one engine does not know
// (`:-moz-focusring`) still drops only itself.
//
// A selector with a pseudo-element goes: a pseudo-element is not allowed
// inside :where(), so `:where(:scope input::placeholder)` never matched, in
// any engine, and turning those rules on now would give every root
// Tailwind's placeholder colour and file-button font. Tailwind's reset,
// `*, ::before, ::after`, is not preflight here: it keeps :scope's weight
// and its pseudo-elements (GAP-52).
function scopePreflight(rule) {
  const kept = [];
  const compounds = [];
  let at = -1;
  for (const selector of rule.selectors) {
    if (selector === ":root" || selector === "html" || selector === ":host")
      kept.push(":scope");
    else if (/^\[data-theme=['"]dark['"]\]$/.test(selector))
      kept.push(':scope[data-theme="dark"]');
    else if (selector.includes("::")) continue;
    else if (isCompound(selector)) {
      if (at < 0) at = kept.length;
      compounds.push(selector);
    } else kept.push(`:where(:scope ${selector}:not(.kozmos-reset))`);
  }
  if (compounds.length) {
    const inner =
      compounds.length === 1 ? compounds[0] : `:is(${compounds.join(",")})`;
    kept.splice(at, 0, `:where(:scope ${inner}:not(.kozmos-reset))`);
  }
  if (kept.length) rule.selectors = kept;
  else rule.remove();
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
      if (rule.raws.tailwind?.layer === "base" && !compilerDefaults) {
        scopePreflight(rule);
        return;
      }
      rule.selectors = rule.selectors.map((selector) => {
        if (selector === ":root" || selector === "html" || selector === ":host")
          return ":scope";
        if (/^\[data-theme=['"]dark['"]\]$/.test(selector))
          return ':scope[data-theme="dark"]';
        // @scope supplies the boundary; :scope supplies predictable precedence
        // over generic host reset/utility rules without using !important.
        if (compilerDefaults) {
          // The legacy reset must not reset a migrated component. Keep
          // utilities active so existing consumer overrides still work.
          const pseudo = selector.indexOf("::");
          const at = pseudo < 0 ? selector.length : pseudo;
          selector = `${selector.slice(0, at)}:not(:where(.kozmos-reset))${selector.slice(at)}`;
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
    inlineResetOnlyVariables(root);
    dropUnreadColourOpacity(root);
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
