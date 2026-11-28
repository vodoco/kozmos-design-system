---
"@kozmos-ds/react": patch
---

Menu, ContextMenu, SplitButton and Search draw from shared recipes (`src/recipes/menu.ts`, `src/recipes/search.ts`), which `@kozmos-ds/vue`'s native parts draw from too: Menu's classes, an external item's icon and words and where its link opens, ContextMenu's keyboard opening, SplitButton's halves and seam, and Search's icon, field and clear. React's output is byte-identical: the built declarations and `style.css` are unchanged; the build adds `dist/esm/recipes/menu.mjs` and `search.mjs`.
