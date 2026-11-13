// eslint-disable-next-line @typescript-eslint/no-require-imports
const valueParser = require("postcss-value-parser");

// dashboard.css, the Dashboard modules' sheet (decision 183, owner, 13 Nov
// 2026): what `@kozmos-ds/react/dashboard` draws with, loaded beside
// style.css and never inside it, so an SDK or Core product pays nothing for
// Pointr Cloud's modules.
//
// It holds owned rules and nothing else. style.css already carries the
// tokens, the scoped preflight and every utility a Core part draws with; a
// second copy of any of them here would be paid twice, and a utility only a
// module used would be a promise the utility layer cannot keep (a host
// without @scope drops it). So every rule sits in `@kozmos-owned { … }`, as
// in style.css's owned sheets, and comes out unwrapped and unscoped, in
// source order. Keyframes take the `kozmos-` prefix style.css gives its own,
// and every animation that names one follows, so a module's loop can never
// meet a host's keyframes of the same name.
//
// Anything else at the top of the sheet (a bare rule, `@tailwind`, `@apply`,
// `@scope`) stops the build with where it is.
module.exports = () => ({
  postcssPlugin: "kozmos-dashboard-sheet",
  OnceExit(root) {
    const owned = [];
    for (const node of root.nodes) {
      if (node.type === "comment") continue;
      if (node.type !== "atrule" || node.name !== "kozmos-owned")
        throw node.error(
          "dashboard.css holds owned rules only: put this inside @kozmos-owned { … }",
        );
      node.walkAtRules((rule) => {
        if (/^(scope|tailwind|apply)$/.test(rule.name))
          throw rule.error(
            `dashboard.css cannot use @${rule.name}: a Dashboard module draws with owned rules alone`,
          );
      });
      owned.push(...node.nodes.map((child) => child.clone()));
    }
    root.removeAll();
    root.append(owned);

    const names = new Map();
    root.walkAtRules(/keyframes$/, (rule) => {
      if (!rule.params.startsWith("kozmos-"))
        names.set(rule.params, `kozmos-${rule.params}`);
      rule.params = names.get(rule.params) ?? rule.params;
    });
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
