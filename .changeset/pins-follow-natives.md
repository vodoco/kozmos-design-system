---
"@kozmos-ds/react": minor
---

`LocationPin` draws its featured, accent and secondary pins as SwiftUI, Compose and Figma do (decisions 62, 66 and 68).

- **Featured:** a featured pin is the accent, `--semantics-accent-fill` (`#FAB735` in both themes unless you set your own), whatever its variant or tint. It shows the place's logo, passed as `markerContent`, and without one a star in the accent's ink, `--semantics-accent-on-fill` (black), where the number would be. It never shows its number, and the star badge at its corner is gone. Its accessible name is `label` followed by the new `featuredLabel` prop ("Featured" by default; pass it translated), so the colour is never the only way to tell it.
- **Accent:** the `accent` variant is brand variant 1's 500 (`#4135F1`) with a white number (6.99:1). At rest, its ring and number are the variant's 700. The variant keeps its name: it is brand variant 1, not the new accent colour.
- **Secondary:** a filled `secondary` pin is foreground/400 under foreground/1000. It was background/200, 1.6:1 against the page.

**What you'll see:**

- A featured pin is amber with its logo, or a black star, where it was its variant's colour (blue for `primary`) with its number and a star badge.
- A filled accent pin is violet with a white number, where it was the theme blue with black in the dark. A quiet accent pin's ring is violet.
- A selected secondary pin is dark grey with a white number in light, and warm grey with a black number in dark.
- Screen readers hear "…, Featured" on a featured pin. If your `label` already says it, drop it from the label.
- To brand Featured, set your accent on `ThemeProvider`: `--primitives-colors-accent-500` and, for a dark accent, `--semantics-accent-on-fill`.
