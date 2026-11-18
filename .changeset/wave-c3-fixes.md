---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": patch
---

Wave C3's fixes (0.17.0).

AccordionTrigger's heading takes a level (GAP-248): `headingLevel`, 2 to 6, on the Accordion for every trigger or on one trigger, an `h3` by default as before, with Radix's attributes kept. The new `AccordionHeadingLevel` type names the levels.

BottomNavigation takes `inset` (GAP-245): 8 between the bar's top line and its items, so a selected item's fill clears the line. Off by default.

POIDetailPanel takes `children`, the product's own content, drawn last in the body inside its padding and the card's scroll (GAP-131); it was dropped.

AdaptiveMapShell follows the on-screen keyboard on the web (GAP-084): it reads `window.visualViewport` and keeps its sheet and controls above what the keyboard covers of it, the larger of that and `safeAreaInsets.bottom`; `followsKeyboard={false}` turns it off. Before its first measure it lays its panel out at its own width, out of sight, not at width 0, where WebKit could keep a grid row's height from that layout (GAP-265).

Live regions are mounted before their words (GAP-226): RoutePreviewPanel's status, error and notice, AdaptiveMapShell's map status and POIDetailPanel's action messages go into `status` and `alert` regions that are there, empty, before them; Spinner mounts its status empty and puts its label into it a moment later.

Timeline's rail ends at the last item's marker (GAP-247): each item draws it down to the next, where the list's border ran on under the last marker.

A Tree that scrolls itself, not virtualized, gives its rows no bleed, so it no longer scrolls sideways by the bleed (GAP-201).

ListItemStatus's "not started" ring draws inside the provider (GAP-283): its rule now outweighs the scoped preflight's border reset.
