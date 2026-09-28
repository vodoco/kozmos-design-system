---
"@kozmos-ds/tokens": minor
---

A fourth elevation role, `Semantics.Elevation.Map Control` (`--semantics-elevation-map-control`, `semanticsElevationMapControl` on iOS and Android), for a control over a map: the SDK's own three shadows, Pointr's "Shadows/Floating Components BG" — 0 8px 8px at 16%, 0 24px 24px at 8% and 0 0 32px at 12% — aliasing a new `shadow.xl`. Dark mode gives the key layer the Floating role's dark alpha and keeps the SDK's proportions (0.4, 0.2, 0.3).

The native builds carry layered roles: iOS as the layers, each radius half its CSS blur, which is how SwiftUI's radius draws, with `kozmosElevation(_:in:fill:)` to cast them from a surface; Android as the key light's blur, 8.dp, since Compose here draws one elevation.
