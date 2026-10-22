---
"@kozmos-ds/react": patch
---

A framed `MapView` has the control radius, 16, as SwiftUI's and Compose's `KozmosMapView` have; it was the container radius, 20, on the web only. A `fill` MapView, the map that is the screen inside `AdaptiveMapShell`, still has no corners, and the map controls keep the control radius they had.
