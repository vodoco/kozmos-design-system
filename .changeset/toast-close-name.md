---
"@kozmos-ds/react": patch
---

`ToastClose` is named "Dismiss notification" when the caller passes no `aria-label`, as SwiftUI's and Compose's toast closes are (GAP-182). It shows only a cross, and had no accessible name of its own: a close left unnamed was a button a screen reader announced with no name. A caller's `aria-label` still replaces it, which is how a product that translates passes its own words.
