---
"@kozmos-ds/tokens": minor
---

Decision 68: Kozmos has an accent colour, the one a client sets in the Pointr Cloud Dashboard beside the theme, background, foreground and emotional colours.

- `Primitives.Colors.accent` is a 0–1000 ramp like theme's, with 500 as the base: `#FAB735` in both themes by default, and the other steps the alert ramp's.
- `Semantics.Accent.fill` references accent 500, and `Semantics.Accent.onFill` is its ink, black in both themes by default.
- The CSS (`--primitives-colors-accent-*`, `--semantics-accent-fill`, `--semantics-accent-on-fill`), the JS module, Swift, Kotlin and the Figma variables all carry them.
- To use your own accent, override accent 500 and, if your colour is dark, the on-fill ink. On the web, set both on `ThemeProvider`'s `tokens`.
