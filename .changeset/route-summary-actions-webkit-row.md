---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

RouteSummary's actions row is as tall as its buttons in Safari once its panel widens. A map shell lays its panel out at width 0 before it measures, where a label breaks a letter to a line, and WebKit kept the row's auto height from that layout after the panel widened: a sheet fitted to its content could settle 134px too tall, with Previous and Next stretched to fill it. The row is now `grid-auto-rows: max-content`, which every engine sizes from the buttons at their real width; Chromium and Firefox draw it as before.
