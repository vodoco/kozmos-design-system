---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

AISearchButton's rainbow ring is round by its mask alone. The mask now cuts the ring's outer edge as well as its inner one, half a pixel soft, and the ring has no corner radius. Rounded as well as masked, the ring lost the top of its band in Firefox wherever the button sat on a half pixel: 1.99 to 2.50 round the ring, where Chromium and WebKit read 2.26 to 2.50. It now reads the same in all three, at any position. The ring's edge pixels change slightly; its size, colours and turn do not.
