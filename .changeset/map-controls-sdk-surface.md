---
"@kozmos-ds/react": minor
---

The map controls take the SDK's current look (decision 40): the Tracking Indicator of Pointr's Location Tracking Buttons. Every map control wears it — `MapControlButton`, so the zoom pair, the compass, the location and step-free control and the floor tile.

- **The surface.** A 48px square (above the 44px touch target), the Control corner (16), no border in any state, and the map controls' own elevation, three shadows, with the SDK's 32px backdrop blur. The zoom pair is one such surface, its buttons its segments. It is owned CSS now, so it holds in a host without `@scope`, and a caller's class still wins over it.
- **The words.** Two equal lines, "Focus" over "Off" or "On", bold 16 on a 16 line. A toggle's state is its tone: off, the words and the mark are grey (foreground/400); on, the words are navy (theme/1000) and the mark the theme's blue (theme/600). "On" no longer draws a primary border or a lower shadow. A control that is not a toggle (`pressed` unset) keeps the ink. Marks are the SDK's 24px.
- **`MapControlButton`** gains `stateDescription`, said after the state and never drawn, and `showLabel`, which draws a state alone while its name still starts the accessible name.
- **`MapControlsGroup`**: with no position (`unavailable`, `permission-denied`) the location control reads its state alone, on one line — the SDK's "No Location". Heading reads "On", as following does; its mark tells them apart, and a screen reader hears `locationHeadingDescription` after the words (default "map turns with you", for the product to translate).
- **`MapOverlay`**'s room is the reach of the map controls' shadow as well as the floating one's: 32px above and at the sides and 48px below, where it was 4, 8 and 12.
