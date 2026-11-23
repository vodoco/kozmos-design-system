---
"@kozmos-ds/react": patch
---

List's, DescriptionList's, MetaStrip's, Timeline's, Alert's and Notice's classes move into the package's shared `recipes` module (`listDensityClasses`, `alertVariants`, the list row's and status mark's classes, the description list's, meta strip's, timeline's and notice's), with the live-region roles and the horizontal-scroll keys those parts use, which `@kozmos-ds/vue` builds its own List, DescriptionList, MetaStrip, Timeline, Alert and Notice from, so the two draw the same element (wave V1). Nothing changes for a product: every export is as before, `dist/index.d.ts` and `style.css` are byte-identical to main's, and the parts' tests pass unchanged. The published files gain `dist/esm/recipes/alert.mjs`, `description-list.mjs`, `keyboard-scroll.mjs`, `list.mjs`, `live-region.mjs`, `meta-strip.mjs`, `notice.mjs` and `timeline.mjs`.
