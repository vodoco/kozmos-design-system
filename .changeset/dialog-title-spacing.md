---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

DialogTitle sits closer to its description (GAP-275). The title is 8 over its words and none under them, and 36 tall at least (`min-h-9 pt-2`, was `min-h-11 py-2`), so a one-line title's description sits 8 under the title's line, where it sat 16.5, and starts exactly where the close's 44 target ends. The close keeps its 44 target and its place, and a wrapped title still keeps clear of it.
