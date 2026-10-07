---
"@kozmos-ds/react": patch
---

A navigation RouteSummary passed to AdaptiveMapShell's `panelHeader` is now hosted there, as it is in the panel's content: no card, padding, radius or shadow of its own, on the panel's one surface (decision 43). It drew its standalone card in the header. An explicit `presentation` still wins, and SwiftUI and Compose already hosted it in either slot.
