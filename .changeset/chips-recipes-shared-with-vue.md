---
"@kozmos-ds/react": patch
---

Chip's and ChipGroup's classes, MultiSelect's and ChipInput's field, input and popup classes, and ChipInput's reading of typed and pasted entries move into the package's shared `recipes` module (`recipes/chip.ts`, `recipes/multi-select.ts`), which `@kozmos-ds/vue` builds its own `KozmosChip`, `KozmosChipGroup`, `KozmosMultiSelect` and `KozmosChipInput` from, so the two draw the same element (wave V2, chips). Nothing changes for a product: every export is as before (`chipVariants` is still exported from Chip), `dist/index.d.ts`, `.d.mts`, `.d.cts` and `style.css` are byte-identical to the branch's before the move, and the parts' tests pass unchanged. The published files gain `dist/esm/recipes/chip.mjs` and `multi-select.mjs`.
