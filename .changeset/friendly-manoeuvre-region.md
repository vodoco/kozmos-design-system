---
"@kozmos-ds/react": patch
---

Keep ManoeuvreCard's accessible container name when expanded, including with custom itinerary content. The existing manoeuvreLabel now names both states, while itinerary content and the close control remain separately accessible. Matching SwiftUI and Compose source changes preserve the same behavior.
