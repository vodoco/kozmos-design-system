---
"@kozmos-ds/react": minor
---

- **`MapControlsGroup` remembers heading** (decision 45). With `locationState="heading-paused"` the location control shows the SDK's rotational Off — the upright pointer in outline and "Focus / Off" in the off grey — and a screen reader hears `locationHeadingPausedDescription` after the words (default "press to turn the map with you again", for the product to translate). The next press should bring `heading` back, which is the product's to do. `"heading-paused"` is new in `@kozmos-ds/product-contracts`, released with this: react pins its siblings exactly, so the two go out together.
- **`MapOverlay` passes presses in its room to the map** (decision 46). The room around what an overlay holds stays for the shadows, but while what it holds fits, only what it holds takes a press: a press or a drag in the room, or between the overlay's items, reaches the map beneath. While what it holds overflows, and only then, the room takes presses again, so that a wheel or a touch over what it holds scrolls the overlay in every engine (Linux WebKit scrolls a box from a wheel only if the box takes presses), and a scrollbar a platform draws there takes its drag; focus scrolls it either way. The overlay marks its stack `data-scrolls` while it overflows.

Migration: consumers that switch exhaustively over `UserLocationState` must handle `heading-paused`. Existing values and callbacks remain available.
