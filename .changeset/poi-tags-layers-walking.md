---
"@kozmos-ds/react": patch
---

POIDetailPanel's tags, services and group items draw `layers-three-01` and `walking`, the map controls' layers glyph and walking figure, which SwiftUI's and Compose's `KozmosIcon` now draw by name (GAP-181), so a tag draws the same icon on all three. Each draws `@kozmos-ds/icons`' own artwork, `LayersThree01` and `Walking`, the source the natives' copies are generated from, at 16px in the label's colour; on the web they drew only the label. `Icon`, its `name` prop and the `KozmosIconKey` type are unchanged.
