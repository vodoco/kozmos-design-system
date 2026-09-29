---
"@kozmos-ds/react": patch
---

`POIDetailPanel`'s `sheet` presentation, hosted in `AdaptiveMapShell`'s sheet under a grip, now sits its close button as far from the panel's top as from its side: 17px and 17px, where it sat 21px and 17px (decision 51, row 82 / GAP-083).

- The header tops its 16px up to the grip's row and no longer adds the grip's 4px clearance, wherever its buttons stay clear of the grip's target anyway. The grip is a 16px row, an undersized target, and WCAG 2.5.8 keeps a 24px circle on its centre clear of every other target.
- Where they would not, on a narrow panel, the header keeps the clearance, 21px and 17px, as every other part at the panel's top does (decision 14). With favourite, save and close that is a panel under 340px wide, such as a 320px phone; with one toggle and close, under 240px; with close alone, under 140px.
- The header reads the card's width from a container query. Hosted in `AdaptiveMapShell`'s panel, the details card is a size container of its own, inline size only, and fills the panel's content box; on its own, in a box that shrinks to fit, it is no container and keeps its width. The panel itself is not a container, so a product's own container queries in content it hosts, unnamed ones and `cqi` or `cqw` units among them, read the product's own containers. Fixed and absolutely positioned parts inside the card place as they did.

In the `sheet` presentation the header's buttons now draw their keyboard focus ring inside their edge, as the actions strip draws its own. Flush against the card's top, in a side panel since the header first topped up and now under a grip, a ring drawn outside lost its top edge to the card's and the panel's scrolling boxes.

A side panel, a single-detent sheet, a sheet with a `panelHeader`, and the `panel` and `inline` presentations keep their insets.
