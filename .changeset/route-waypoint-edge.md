---
"@kozmos-ds/react": patch
---

RouteProgressRail's route-mode waypoints draw their 1px edge on the web, as SwiftUI and Compose do. The rule that drew it had one class's weight and lost to the scoped preflight's border reset, so each waypoint was a white disc with no edge.
