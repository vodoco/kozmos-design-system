---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/icons": minor
"@kozmos-ds/react": minor
---

Share the semantic DirectionKind vocabulary across platforms while retaining DirectionType as a source-compatible alias. Add walking, enter, exit and directional ramps. Replace generic elevator/stairs/escalator arrows with Pointr's own wayfinding artwork from the Pointr Maps - Express design: distinct lift, escalator, stairs and ramp glyphs up and down, and entrance and exit, generated from one source for React, SwiftUI and Compose as solid shapes in the current colour. The rest of the Express set (no-direction variants, entrance/exit, turns, follow the line, arriving, security, shuttle) is exported by name. Existing lift-up/lift-down spellings remain unchanged; update exhaustive switches for the new cases. Native source consumers should rebuild: type aliases preserve source calls, not binary enum identity. Unknown engine directions must be handled by the adapter rather than guessed as a turn.
