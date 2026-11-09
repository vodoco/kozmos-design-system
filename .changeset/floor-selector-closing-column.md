---
"@kozmos-ds/react": patch
---

FloorSelector's collapsible column chooses nothing once it starts to close
(GAP-233). Through its exit animation it takes no pointer, and a level that a
tap or Enter or Space still reaches does nothing; focus goes back to the tile
as before. A reopened column also draws its own scroll affordance: its
`data-scrollable` and scrollbar belong to the opening they were measured on,
so its first commit no longer shows the last opening's, as when the list of
levels changed between the two.
