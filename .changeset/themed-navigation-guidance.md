---
"@kozmos-ds/react": minor
---

Make ManoeuvreCard theme-filled by default with contrast-paired text and itinerary content. A caller that already sets `surface` keeps that surface (the background appearance), so existing `surface="glass"` cards stay glass; `appearance="background"` asks for the neutral solid/glass surfaces explicitly, and `appearance="theme"` stays opaque whatever the surface; enlarge the disclosure target while retaining focus and language behavior. SwiftUI and Compose expose equivalent appearance choices in their source distributions.
