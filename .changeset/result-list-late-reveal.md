---
"@kozmos-ds/react": patch
---

`POIResultList` brings the selected result into view when its results arrive after the selection. A pin's tap that came before the search answered, or a batch of results without the selected place, used to mark the selection as shown with nothing to show, and the result then stayed out of sight when it arrived. Each selection is now brought in once, when its result is in `items`; a new array of the same results still moves nothing, and a result that leaves the list and comes back is brought in again. A selection made while `scrollSelectedIntoView` is off is brought in when it is turned back on.
