---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A `TabsList` wider than the space it is given scrolls sideways inside its own track instead of widening the page (GAP-254, decision 182). The track keeps the width of its space and becomes the scroll container; each tab keeps its natural width, never cut short or wrapped; no scroll bar is drawn; touch, a trackpad and a wheel scroll it. The selected tab is in view when the list is first shown, and is brought into view by the least distance whenever the selection moves or a tab out of view takes focus, animated unless motion is reduced (`data-kozmos-motion="reduced"` or `prefers-reduced-motion`), without scrolling the page. Right to left it starts at the right. A list that fits is drawn exactly as before: the list is marked `data-scrollable`, and the stylesheet's owned `.kozmos-tabs-list` rules make it a scroll container, only when it overflows. `.kozmos-tabs-list` also caps the list at its space (`max-inline-size: 100%`) and centres its tabs, where the `justify-center` class did. No API changes.

SwiftUI's `KozmosTabsList` and Compose's `KozmosTabsList` do the same: today's row while the tabs fit, and otherwise a horizontal scroll view with no indicator inside the track, at the tabs' natural widths, scrolled to the selected tab. They are used from a checkout and are not released by this changeset.
