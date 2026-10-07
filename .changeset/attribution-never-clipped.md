---
"@kozmos-ds/react": patch
---

AdaptiveMapShell never clips the map credits into a scroll region (GAP-135, decision 58: the logo first, then the corners, and the credits never clip). When an opened top-bar card and the sheet leave the attribution less room than its full height, MapAttribution's Pointr logo gives way first and the credits keep their full height, so nothing is cut off and no scroll area that a keyboard can't reach is left behind. On a phone where the two bottom corners lift the attribution above them, that room counts the lift; credits that would still reach the card send the corners away, hidden and inert as when they don't fit, and return to the bottom row. The logo comes back once it fits again: MapAttribution keeps a brand that has given way laid out, unseen and out of reach, so the shell measures it whatever is drawn. The panel's sizing is unchanged: it still reserves the attribution's full height, so the logo giving way never moves the sheet.
