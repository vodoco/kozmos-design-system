---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

The design configuration's pure parts move into the package's shared `recipes` module (`recipes/design-config.ts`: the config's shape and defaults, `normalizeDesignConfig`, the custom properties a config sets, reduced motion, and the spotlight's position), which `@kozmos-ds/vue` builds its own `KozmosDesignConfigProvider` from, so a config sets the same properties in both (GAP-291). Nothing changes for a product: `DesignConfigProvider`, `KozmosTheme` and `useDesignConfig` are exported as before, `dist/index.d.ts` and `style.css` are byte-identical to main's, and the design config's tests pass unchanged. The published files gain `dist/esm/recipes/design-config.mjs` in place of `dist/esm/context/design-config.mjs`. `@kozmos-ds/styles`, built from React's and Vue's sources, ships a byte-identical `style.css`: Vue's KozmosDesignConfigProvider draws no class.
