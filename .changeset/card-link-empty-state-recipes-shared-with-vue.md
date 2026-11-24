---
"@kozmos-ds/react": patch
---

Card's, Breadcrumb's, PageHeader's, Link's and EmptyState's classes move into the package's shared `recipes` module (`recipes/card`, `breadcrumb`, `page-header`, `link` and `empty-state`), which `@kozmos-ds/vue` builds its own Card, Breadcrumb, PageHeader, Link and EmptyState from, so the two draw the same element (wave V1). Nothing changes for a product: every export is as before, `dist/index.d.ts` and `style.css` are byte-identical, and the tests of each part pass unchanged. The published files gain `dist/esm/recipes/breadcrumb.mjs`, `card.mjs`, `empty-state.mjs`, `link.mjs` and `page-header.mjs`.
