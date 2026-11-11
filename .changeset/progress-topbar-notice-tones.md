---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Progress's indeterminate top bar, and Notice's success tone, progress and done states, on every platform (GAP-159, GAP-160, GAP-033; decision 132).

- **Progress with no value moves** (GAP-159). The bar's indeterminate form was an empty, still track; it is now a segment a quarter of the track wide, theme 600, sweeping from the inline start to the inline end every 2 s, linear, for as long as the wait lasts (right to left it runs from the right). Under reduced motion, the system's or `DesignConfigProvider`'s, it stands still in the middle of the track. It is said once: its words, the new `label` on a bar or "Loading", name it and are put into a polite status beside it after the status is in the page, and nothing more is said while it sweeps; a value ends the wait and the status goes. An `aria-label` of the product's still names the bar.
- **Progress takes `placement`**: `"inline"`, the default, is the bar as it was; `"top"` is the page's loading bar, fixed to the top of the window, edge to edge, 4 tall (spacing 50), square, on layer 50. A ring ignores it.
- **Notice takes `tone="success"`** (GAP-160), in the success colours with Toast's check as its mark, and **`status`**: `"progress"` turns the system's loading arc where the mark is (still under reduced motion) and sets `aria-busy`; `"done"` ends the summary in a check at its inline end, as "Geometry is set" does, with no mark at its start unless `icon` gives one. Its `action` (GAP-033, MAP-587's "Alert action") is unchanged and sits under the text in every state.

SwiftUI and Compose have the same: `KozmosProgress(placement:label:)` and `KozmosProgressPlacement` (`.inline`, `.top`; the value initialisers take `placement` too), and a new `KozmosNotice` with `KozmosNoticeTone` (warning, info, critical, success), `KozmosNoticeStatus` (progress, done), its icon, icon alignment, collapsible detail behind "More", liveness and `action`. The Figma importer paints Progress's Value Indeterminate and a Placement axis (Inline, Top), and a new Notice set (Tone × Status, with Summary, Show Icon, Show Detail, Detail and Show Action); Code Connect maps both on React, SwiftUI and Compose. Vue's bridge exports `KozmosNotice`, with `v-model:expanded`.
