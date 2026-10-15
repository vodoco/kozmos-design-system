---
"@kozmos-ds/react": minor
---

LocationPin draws the SDK's map result markers (decision 71, GAP-120), as the boards draw them. In a product these come from the map style's sprite sheet, and a featured place's tile from the featured sprite Pointr's back end makes with its logo; LocationPin draws the same markers for prototypes and boards (decision 81).

- **A result** is its number in a pill on a pointer, anchored at the pointer's tip: 32 tall, as wide as its number and 8 more each side (32 at least), theme 600 on background/0 at rest, filled theme 600 under foreground/1000 when selected. Without a number it shows a dot.
- **A featured place** (`featured`) is its logo (`markerContent`, normally an image, fitted inside the rim, never cropped) in a 44 tile with a 3 rim in foreground/0, 52 when selected, on a dot whose centre is the anchor. It shows no number, no star and no accent colour. Its name still adds `featuredLabel`.
- **A place on its own** (`place`, new) is the green pin, emotional success 800 round a disc, on a dot whose centre is the anchor. It is the marker for a place whose details are open, the only one shown, and it wins over `featured` and `number`.
- **`onOpen`** (new): a double tap on the marker opens the place's details rather than zooming the map, with the same gate as `POIResultList.onOpen`. The first tap is the ordinary press; a keyboard press is always the ordinary press. Its target is 44 square at least.

**Removed** (decisions 79 and 80):

- **`variant`, `size` and `tint`:** the SDK's markers have one look. Remove the props.
- **`offFloor`:** don't mark results on another level. The level switcher counts them (`showResultCounts`). Remove the prop.

**What you'll see:** every pin changes shape, from a teardrop to the pill, the tile or the green pin. A pin is still anchored by a physical point, but a featured tile and a place are anchored at their dot's centre, 3 above their foot, where the old pin's foot was its anchor. A selected result is filled in theme 600, as the SDK's sprite is, not the theme fill.
