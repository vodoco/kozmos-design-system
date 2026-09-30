---
"@kozmos-ds/react": minor
"@kozmos-ds/product-contracts": minor
---

Add a measured attribution slot to AdaptiveMapShell, matching SwiftUI and Compose.
Credits stay centered across the full map, independent of side panels, or above bottom sheets.
Equal reservations for the larger corner keep unequal controls from shifting attribution.
Tall side panels leave the footer band clear.
Controls retain equal side/bottom insets; only attribution moves above oversized corners
when their middle gap is too narrow. Credits use one horizontally scrollable, scalable
line (10px default on web); large sheets preserve attribution room.
Transparent attribution aligns the credit line itself with the 16-unit bottom inset,
without adding inner padding beneath it.
Web layout snapshots identify attribution occlusions and include their bottom camera
inset independently of optional control padding. Omitting the slot preserves existing layout.
