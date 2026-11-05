---
---

The Vue parts' sources change (typed slots, `themeChange` in camelCase, `useKozmosDensity` no longer exported) and are inputs to `@kozmos-ds/styles`' Tailwind build, but `style.css` and `reset.css` built from this branch are byte-identical to main's, so styles and React have nothing to release. `@kozmos-ds/vue` is private.
