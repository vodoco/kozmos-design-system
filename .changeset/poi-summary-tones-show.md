---
"@kozmos-ds/react": patch
---

POIDetailPanel's summary tones show. A toned summary item (success, warning, danger, brand) set its colour on the item, but the value's own foreground won, and its mark inherited that, so every tone drew as plain foreground. The value and its mark now take the tone's text colour, as SwiftUI and Compose draw them; the detail line keeps its muted colour.
