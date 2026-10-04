---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/icons": minor
"@kozmos-ds/react": minor
---

Share the semantic DirectionKind vocabulary across platforms while retaining DirectionType as a source-compatible alias. Add walking, enter, exit and directional ramps. Draw directions with Pointr's own wayfinding artwork from the Pointr Maps - Express design, generated from one source for React, SwiftUI and Compose as solid shapes in the current colour: distinct lift, escalator, stairs and ramp glyphs up and down replace the generic arrows, and turns, turning back, the destination, entrance and exit take Express's HardLeft, HardRight, TurnBack, Arriving, Entrance and Exit. Straight on, level changes and transitions keep their arrows. The rest of the Express set (no-direction variants, entrance/exit, follow the line, custom transition, security, shuttle) is exported by name. Existing lift-up/lift-down spellings remain unchanged; update exhaustive switches for the new cases. Native source consumers should rebuild: type aliases preserve source calls, not binary enum identity. Unknown engine directions must be handled by the adapter rather than guessed as a turn.
