---
"@kozmos-ds/tokens": patch
---

Decision 63: brand variant 1's 500 (`Primitives.Colors.theme.variant.1.500`) is `#4135F1` in both themes, lightened from `#4134F1` just enough to read 3:1 as a shape on the dark page (3.00:1; it read 2.99:1). Its hue is unchanged. White on it reads 6.99:1, and it reads 2.52:1 on the dark sheet. The CSS, Swift, Kotlin and Figma outputs carry the same value. `tokens:contrast:check` now holds it to 3:1 on the page and white on it to 4.5:1.
