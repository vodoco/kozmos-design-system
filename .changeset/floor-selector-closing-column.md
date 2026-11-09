---
"@kozmos-ds/react": patch
---

FloorSelector's collapsible column chooses nothing once it starts to close
(GAP-233). Through its exit animation it takes no pointer and is inert, so
assistive technology neither reads nor acts on it, and a level that a tap or
Enter or Space still reaches does nothing. Focus goes back to the tile as
before. Opened again before it is gone, it takes the pointer again.

Every painted frame of an opening now draws the column's own scroll
affordance (`data-scrollable` and the scrollbar). The list is measured in the
layout effect of the commit that places the column, before it is painted, and
the value is held with that opening's list. Until now an opening whose levels
overflowed painted a frame or two with them spilling out of the column before
it turned scrollable, and a reopened column's first commit carried the last
opening's value.
