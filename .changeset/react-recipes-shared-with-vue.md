---
"@kozmos-ds/react": patch
---

Button's recipe (`buttonVariants`, its emotions' tiers and custom properties) and the loading arc's drawing move into a module of their own inside the package, `recipes`, which `@kozmos-ds/vue` builds its Button from, so the two draw the same element (Vue 3 Phase 0). Nothing changes for a product: `Button`, `buttonVariants`, `BUTTON_EMOTIONS` and `ButtonEmotion` are exported as before, the package exports the same 276 names, and Button, its stories, every variant and emotion, and Pagination render the same HTML. The published files gain `dist/esm/recipes/`, and Button's, SpinnerArc's and Pagination's modules import from it.
