---
"@kozmos-ds/react": minor
---

`POIResultList`, `POIResultGroup` and `POIResultCard` gain `numbered`, off unless the product turns it on. A numbered result shows its `result.resultIndex`, the number its pin shows on the map, in the card's tab (before its name in a group's row), for a list whose pins are numbered: quick access, where a category chosen in the browse grid lists that category's places. Kozmos draws the number it is given and never renumbers. One tab per card: Featured wins over the number, so a featured result keeps its Featured tab and no number, as its pin shows its logo; the number wins over a badge. At rest the number's tab is quiet, outlined on the card's grey edge; selected, it fills with the primary colour. The number leads the result's accessible name ("2, Burger King") and its tab is decorative; a `selectionLabel` replaces the whole name, as before.

The badge tab is quiet, as the contract always said (GAP-054): a neutral tab with no star, on the card's grey edge. It drew the Featured star, colour and edge, so an "Alternative" read as featured. The tabs now hang from the card's start edge, so they sit on the right in a right-to-left language, and their colours are owned rules that hold without `@scope`.

**A deliberate visual change to Featured:** the Featured tab is the SDK's bright amber under dark words, the alert fill pair (`--semantics-emotion-alert-fill` and `--semantics-emotion-alert-on-fill`), for its words and its star, and a featured card's edge takes the same amber, selected or not. It was the darker warning fill under white words, with a darker edge. The words read at 10.56:1 in the light theme and 13.14:1 in the dark.
