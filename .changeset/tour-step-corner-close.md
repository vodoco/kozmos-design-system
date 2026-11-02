---
"@kozmos-ds/react": patch
---

TourStep's Close no longer takes a row, so the card fits itself. Close keeps its size (32 at
compact density, 44 at touch) and sits out of the flow in the card's top corner, its icon on the
eyebrow's line, or on the title's first line with no eyebrow. The eyebrow's row hugs its line and
sits 8 above the title, where it was 12 below a 32 or 44 row, and with no eyebrow the title starts
at the top of the card. The eyebrow and the title wrap before Close, and only when there is one.
Close's focus ring is drawn inside its target. DOM order, focus order and the card's width do not
change.

A product that measured the card: a step is 32 shorter at touch density and 20 at compact; a card
with Close and no eyebrow (a coachmark) 56 and 44; a card with an eyebrow and no Close (the welcome
card) 4. `.kozmos-tour-step-header` now holds the title too, and renders on every card.
