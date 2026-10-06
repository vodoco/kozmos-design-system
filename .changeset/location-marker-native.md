---
"@kozmos-ds/react": patch
---

UserLocationMarker draws as SwiftUI and Compose do: the heading cone is native's 64-unit wedge, fading out 32 from the dot; the dot casts no shadow; the full marker's ring is white in both themes (the compact dot's stays the surface's colour); and the dot, halo, pulse and cone use the marker's own fixed blue, `Semantics.Map marker.dot`, so the dot reads against its ring in dark mode too.
