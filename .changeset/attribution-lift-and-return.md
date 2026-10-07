---
"@kozmos-ds/react": patch
---

AdaptiveMapShell's attribution no longer reaches into an opened top bar. On a phone where two bottom corners lift the attribution above them, the room the Pointr logo needs now counts that lift, so the logo gives way before it is drawn into the card; and when the credits alone would still reach the card, the corners give way next and the credits return to the bottom row (GAP-135, decision 58: the logo first, then the corners, and the credits never clip). The logo also comes back once it fits again: MapAttribution keeps a brand that has given way laid out, unseen and out of reach, so the shell measures it whatever is drawn. Before, a logo hidden after the text or the shell grew stayed hidden after it shrank back, and the sheet stayed short by the logo's height.
