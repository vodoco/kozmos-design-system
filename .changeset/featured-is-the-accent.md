---
"@kozmos-ds/react": patch
---

Decision 68: POIResultCard's Featured tab and a featured card's edge draw the accent, `--semantics-accent-fill` under `--semantics-accent-on-fill`, as a featured `LocationPin` does. They were the alert fill pair.

**What you'll see:** Featured tabs and edges are `#FAB735` in both themes. They were `#F9A707` in light and `#FBC459` in dark. To brand Featured, set your accent on `ThemeProvider`: `--primitives-colors-accent-500` and, for a dark accent, `--semantics-accent-on-fill`.
