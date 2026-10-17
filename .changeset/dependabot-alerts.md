---
---

Development tooling only: Vite 6, vitest 4.1, Style Dictionary 5.4.4 and patched transitive dependencies, to clear the open Dependabot alerts. No published package's dependencies change. The tokens, icons and product-contracts builds are byte for byte the same; react's ES modules, declarations and reset.css are too. Its UMD file gains the two parentheses Rollup puts around the factory function, which esbuild 0.25.9 and later keep, and its stylesheet writes media queries without spaces (`@media(min-width:640px)`), as esbuild 0.25.11 and later minify them. react's Vite config names the stylesheet `style.css`, as before.
