---
---

SwiftUI only: POI detail tags draw a service's Kozmos icon name through `KozmosIcon`, so the 19 names SF Symbols lacks, bluetooth-off and the wayfinding glyphs draw their artwork rather than the `questionmark.circle` stand-in, and a name Kozmos does not know draws no icon, as on the web and in Compose. `KozmosPOIDetailTag` gains `iconName`. Only `packages/ios` changes, and it is not published: no package ships anything new.
