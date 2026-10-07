---
"@kozmos-ds/react": patch
---

AICompanionPanel's header joins the map shell panel's top inset. In a sheet with a grab handle its title and close button sat 8 lower than a panel header's search field; the header now tops its own 12 up to what the shell leaves rather than adding to it, so it sits where the search field does, and at 16 in a gripless sheet or side panel (GAP-121). Outside a shell it keeps its 12.
