---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/icons": minor
"@kozmos-ds/react": minor
---

Share the semantic DirectionKind vocabulary across platforms while retaining DirectionType as a source-compatible alias. Add walking, enter, exit and directional ramps. Replace generic elevator/stairs/escalator arrows with distinct transport-and-direction vectors generated from one original Kozmos source for React, SwiftUI and Compose. The artwork is newly authored for review, not imported from or approved in Figma. Existing lift-up/lift-down spellings remain unchanged; update exhaustive switches for the new cases. Native source consumers should rebuild: type aliases preserve source calls, not binary enum identity. Unknown engine directions must be handled by the adapter rather than guessed as a turn.
