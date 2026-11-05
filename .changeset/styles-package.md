---
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
"@kozmos-ds/tokens": none
---

**`@kozmos-ds/styles` is new: the Kozmos stylesheet, built once for every Kozmos web package** (Vue 3 Phase 0; Olcay's answer of 16 Oct). It holds `style.css` (the tokens for both themes and both densities, the owned `.kozmos-*` rules, the scoped preflight and the utilities the parts draw with) and `reset.css` (the opt-in host reset), exported as `@kozmos-ds/styles/style.css` and `@kozmos-ds/styles/reset.css`. Its Tailwind build reads React's and Vue's sources, so a class either draws is in it. It ships no JavaScript, and installs nothing else: the tokens are built into `style.css`, so `@kozmos-ds/tokens` is only what its build reads.

`@kozmos-ds/react` now takes its stylesheets from it and still ships both, byte for byte as before: `@kozmos-ds/react/style.css`, `@kozmos-ds/react/reset.css` and `@kozmos-ds/react/dist/style.css` resolve as they did, so nothing changes for a product. React pins `@kozmos-ds/styles` exactly, and the two are released together, at one version.

`@kozmos-ds/tokens` is named with no release: its check data (`src/contrast-contract.json`, which its tarball does not carry) points at the stylesheet sources' new folder.
