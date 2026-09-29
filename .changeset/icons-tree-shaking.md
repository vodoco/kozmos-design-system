---
"@kozmos-ds/icons": patch
---

Importing one icon no longer bundles all 56 of the registry's. `kozmosIconRegistry` was built at module scope by `Object.fromEntries(kozmosIconDefinitions.map(...))`, and only the outer call was marked `/* @__PURE__ */`. A mark covers its own call, not the calls in its arguments, so Rollup and esbuild both kept the `.map`, and with it every definition and every icon they name. `import { Check } from "@kozmos-ds/icons"` cost an app 11.49 KB gzip (32.84 KB minified). It now costs 0.38 KB (0.54 KB minified), the icon and its factory. The `.map` is marked too.

Nothing else changes: the same exports, names and registry. Anything that looks an icon up by name, `getIconComponent`, `getIconDefinition`, `isKozmosIconKey` or the registry itself, still brings in every icon the registry names, as it must.
