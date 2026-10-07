---
"@kozmos-ds/react": minor
---

EmptyState takes `progress`: a long wait it explains, such as a download, and how far it has got, drawn under the description and above the action with a label that names the bar and an optional value in words (`{ value: 40, label: "Downloading the assistant", valueText: "12 of 30 MB" }`, value from 0 to 100, clamped, and NaN as 0). The label is read once, as the bar's name. SwiftUI and Compose take the same, from 0 to 1 (GAP-115).
