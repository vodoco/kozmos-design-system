---
"@kozmos-ds/react": patch
---

ManoeuvreCard's drag indicator sits 4px above the card's bottom edge and 12px under its content, so the closed card ends 21px under its instruction where it ended 60px under it: about 50px of empty space sat around the grip (decision 74, GAP-140). Its 44px target reaches up from the card's edge, over that space and the instruction's foot, invisibly; a press there opens the card, as the instruction does. Open, the itinerary stops 44px above the card's edge, outside what scrolls, so the target covers no row at any scroll position and the open card is 16px shorter than before. On the theme fill the grip is the guidance foreground at 62%, quieter than the instruction and still 3.09:1 on `#135BEC`, and so is the itinerary's thin scrollbar thumb, where the neutral thumb read about 1.4:1; the background card's grey bar is unchanged.
