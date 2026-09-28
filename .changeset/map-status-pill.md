---
"@kozmos-ds/react": minor
---

`MapStatusPill`, one status on the map in five tones (decision 39). The SDK's PositionStatus, Downloading Content and Turn Back indicator are all this part, and so is the step-free route being calculated (GAP-102). The words, the tone and when it shows are the product's; place it in a `MapOverlay`, for example at the bottom centre.

- **Tones.** `neutral` draws the words alone; `progress` turns the system's arc in the theme's blue; `success` draws a check and its words in the success colour; `danger` draws a warning triangle in the danger colour and keeps the words ink; `warning` fills the surface with the new `Emotion/alert/fill` under its `onFill`, the SDK's bright amber under black words in both themes (Turn Back), 10.56:1 light and 13.14:1 dark. The words read at 4.5:1 or more, and the marks at 3:1 or more, in both themes.
- **The surface** is the map controls' own (decision 40), from the same owned rule: the page's surface, the Control corner, no border in either theme, the map controls' three shadows and the 32px blur, at least 48px tall, 8px above and below and 12px at the sides. The words are 13px on a 16px line in `foreground/300`; it wraps at 16rem rather than cutting them.
- **`icon`** replaces the tone's own mark, drawn at 24px in the tone's colour; `icon={null}` draws none. The mark is never announced.
- **Announced politely.** It is `role="status"` by default; `live` takes Alert's and Notice's `"off" | "polite" | "assertive"`. With no words it draws nothing and keeps its live region, so a product that keeps it rendered where it shows has its first words read too.
- **`MapControlButton`'s surface rule** now dresses both parts; nothing about a map control changes.
