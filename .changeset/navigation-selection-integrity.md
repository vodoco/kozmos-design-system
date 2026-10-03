---
"@kozmos-ds/react": patch
---

Prevent ambiguous navigation snapshots from choosing a route or current step silently. RoutePreviewPanel requires unique non-empty IDs and exactly one selected available option before continuation; Itinerary omits current emphasis when several steps are marked current. The host remains responsible for validating and correcting its snapshot. Matching SwiftUI and Compose protections are included.
