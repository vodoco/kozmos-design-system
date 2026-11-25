---
"@kozmos-ds/react": patch
---

Timeline's marker gives its ring's offset shadow the canvas's colour token (`ring-offset-background`), where Tailwind started it at a written-in white (GAP-287). The shadow is 0 wide, so nothing drawn changes; every colour of the marker now comes from a token, in light and dark.
