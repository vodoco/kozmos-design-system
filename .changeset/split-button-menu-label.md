---
"@kozmos-ds/react": minor
---

SplitButton takes `menuLabel`, the accessible name of its menu half, which shows only a chevron: "More options" by default, the name it had (GAP-168, GAP-182). A product that translates passes its own. SwiftUI's and Compose's `KozmosSplitButton` take `menuLabel` too, with the same default: VoiceOver read SwiftUI's menu half as the chevron's own "Go Down", and Compose named it "More actions".
