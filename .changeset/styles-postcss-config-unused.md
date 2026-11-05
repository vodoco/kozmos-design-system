---
---

No release: `packages/styles/postcss.config.cjs` was never read (the build's PostCSS is inline in `vite.config.mts`), and a forced full build without it gives a byte-identical `style.css`, `reset.css` and react's copy.
