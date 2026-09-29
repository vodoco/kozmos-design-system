---
"@kozmos-ds/react": minor
---

LocationPin: a numbered pin is quiet at rest and filled when selected, so it pairs with the result card's number tab (decision 55). **The look of unselected numbered pins changes, by design; no prop changes.**

- **At rest**, a pin with a `number` is the outlined marker on the background, with its ring and number in the pin's colour, as the SDK's map draws its unselected results. Before, every numbered pin was filled with a white number, selected or not.
- **Selected**, it is filled as before, with the ink made for the fill on the number, and still grows.
- **Unchanged:** a featured pin, a pin showing `markerContent` (a logo or an icon) and a pin with no number keep their fill.
- **Off the floor**, the outlined marker's ring is now dashed, so it is never taken for a quiet pin at rest, in forced colours and for any colour vision. It still takes the number in the foreground and is never filled.
- **Variants** keep their colours in the ring and number. `secondary`, whose own colour is a surface grey (1.6:1 on the background), takes the muted foreground as a ring and a number, off the floor too, where its ring had not shown.
- **A tint** outlines a numbered pin at rest in the category's fill, with the number in the foreground: six of the eight fills fail 4.5:1 as text on the background.

Measured in Chromium, Firefox and WebKit: the primary number reads 6.24:1 on the light background and 6.17:1 on the dark, and its ring at least 4.68:1 against Pointr's light map. On the dark map it reads 3.27:1 or more, except over food-and-drink rooms (2.76:1), where the filled pin is the same colour. iOS and Compose make the same change.
