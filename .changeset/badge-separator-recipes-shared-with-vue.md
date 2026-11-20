---
"@kozmos-ds/react": patch
---

Badge's, Counter's and Separator's classes move into the package's shared `recipes` module (`badgeVariants`, `counterVariants`, `separatorClasses` and Badge's icon and counter helpers), which `@kozmos-ds/vue` builds its own Badge and Separator from, so the two draw the same element (wave V0b). Nothing changes for a product: `Badge`, `Counter`, `counterVariants`, `formatCounterValue` and `Separator` are exported as before, `dist/index.d.ts` and `style.css` are byte-identical to main's, and Badge's, Counter's and Separator's tests pass unchanged. The published files gain `dist/esm/recipes/badge.mjs`, `counter.mjs` and `separator.mjs`.
