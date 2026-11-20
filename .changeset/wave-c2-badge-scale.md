---
"@kozmos-ds/react": minor
"@kozmos-ds/tokens": minor
"@kozmos-ds/styles": minor
---

**Badge on Chip's scale** (GAP-147, decision 93): a status badge, not a control. `size="sm"` is 28, the default 32 and `lg` 36 tall at touch, and 20, 24 and 28 under `ThemeProvider density="compact"`; an icon Badge is the default height, square. Every size was 44. No variant has a hover state any more. The tokens add `Density.Badge.Height` (`sm`, `md`, `lg`; `--density-badge-height-*`), and the stylesheet the `h-badge-sm`, `h-badge`, `h-badge-lg` and `w-badge` sizes that read them. A layout that counted on a 44 Badge changes.
