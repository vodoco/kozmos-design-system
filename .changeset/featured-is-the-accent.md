---
"@kozmos-ds/react": patch
---

Decision 68: the Featured tag draws the accent everywhere.

- **POIResultCard:** the Featured tab and the featured card's edge are `--semantics-accent-fill` under `--semantics-accent-on-fill`. They were the alert fill pair.
- **LocationPin's featured pin:** the accent fill. It shows the place's logo (`markerContent`), and without one a star where the number would be; it never shows its number.

Decision 66: a filled `secondary` LocationPin is foreground/400 under foreground/1000, as SwiftUI and Compose draw it. It was background/200, 1.6:1 against the page.

**What you'll see:**

- Featured tabs and edges are `#FAB735` in both themes. They were `#F9A707` in light and `#FBC459` in dark.
- A featured pin with no `markerContent` shows a black star instead of its number.
- A selected secondary pin is dark grey with a white number in light, and warm grey with a black number in dark.
- To brand Featured, set your accent on `ThemeProvider`: `--primitives-colors-accent-500` and, for a dark accent, `--semantics-accent-on-fill`.
