---
"@kozmos-ds/react": patch
---

Checkbox's, Rating's and ControlText's classes, and Rating's rounding and default words, move into the package's shared `recipes` module (`recipes/checkbox.ts`, `recipes/rating.ts`, `recipes/control-text.ts`), with IconButton's count class (`ICON_BUTTON_COUNTER_CLASS`) and Counter's tone and size types beside the recipes they already had, which `@kozmos-ds/vue` builds its own `KozmosCounter`, `KozmosIconButton`, `KozmosCheckbox` and `KozmosRating` from, so the two draw the same element (wave V2). Nothing changes for a product: every export is as before, `dist/index.d.ts`, `.d.mts`, `.d.cts` and `style.css` are byte-identical to main's, and the four parts' tests pass unchanged. The published files gain `dist/esm/recipes/checkbox.mjs`, `control-text.mjs` and `rating.mjs`.
