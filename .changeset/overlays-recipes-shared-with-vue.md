---
"@kozmos-ds/react": patch
---

Dialog, Drawer, BottomSheet, Popover and Tooltip draw from shared recipes (`src/recipes`), which `@kozmos-ds/vue`'s native overlays draw from too. React's output is byte-identical: the built declarations and `style.css` are unchanged.
