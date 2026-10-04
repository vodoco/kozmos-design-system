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
    root.walkRules((rule) => {
      if (
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
      } else if (rule.selector.replace(/\s/g, "") === "*,::before,::after") {
        // Tailwind's ring/transform/animation initial values are local too.
        // Copy only the compiler's --tw-* defaults, never its universal reset.
        const defaults = rule.nodes.filter(
          (node) => node.type === "decl" && node.prop.startsWith("--tw-"),
        );
        if (defaults.length)
          foundations.push(
            postcss.rule({
              selector:
                ".kozmos-reset, .kozmos-reset::before, .kozmos-reset::after",
              nodes: defaults.map((node) => node.clone()),
            }),
          );
      }
    });
    root.walkRules((rule) => {
      if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))
        return;
      // Tailwind's compiler-variable initializer is not tagged as base-layer
      // preflight. Its scoped specificity/proximity would otherwise overwrite
      // owned --tw-* values (transforms, ring widths, etc.) with defaults.
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
