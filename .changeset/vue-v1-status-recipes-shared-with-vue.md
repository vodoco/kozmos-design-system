---
"@kozmos-ds/react": patch
---

Tag's, Avatar's, Spinner's, Skeleton's, Progress's and PersonaMark's classes, drawings and rules move into the package's shared `recipes` module (`tagVariants`, the emotion axis, Avatar's and Skeleton's classes, Spinner's sizes, Progress's value, ring, bar, wait and track rules, and PersonaMark's diamond), which `@kozmos-ds/vue` builds its own `KozmosTag`, `KozmosAvatar`, `KozmosSpinner`, `KozmosSkeleton`, `KozmosProgress` and `KozmosPersonaMark` from, so the two draw the same element (wave V1). Nothing changes for a product: every export is as before, `dist/index.d.ts`, `.d.mts`, `.d.cts` and `style.css` are byte-identical to main's, and the six parts' tests pass unchanged. The published files gain `dist/esm/recipes/avatar.mjs`, `emotion.mjs`, `persona-mark.mjs`, `progress.mjs`, `skeleton.mjs`, `spinner.mjs` and `tag.mjs`.
