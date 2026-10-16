---
"@kozmos-ds/tokens": patch
---

Three descriptions no longer describe LocationPin's old look. No value changes.

- `--semantics-accent-fill` no longer names a featured LocationPin: the SDK's featured tile has no accent (decision 81). The accent still draws the Featured tag and the edge of its card.
- The theme fill (decision 59) no longer names a filled LocationPin. A selected pin is theme 600, as the SDK's sprite is.
- The category colours are for a category's tile and chip. LocationPin takes no tint now (decision 79); the map's category markers come from the sprite.
