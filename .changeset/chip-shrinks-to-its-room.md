---
"@kozmos-ds/react": patch
"@kozmos-ds/styles": patch
---

A Chip is never wider than what holds it. Its automatic minimum was its words, which never wrap, so a long label ran out of its room: in MultiSelect a chosen "Booking required" ran 156.7px wide in a 136px chip area, under the field's "Clear selected options", which covered the chip's remove down to 17.3 × 24 (WCAG 2.5.8). The chip now shrinks to its room (`min-w-0 max-w-full`) and its label ends in an ellipsis (`truncate`), while the remove keeps its 24 × 24 and every word stays the chip's text, so the chip and its remove ("Remove Booking required") are still named by the whole label. A chip that fits is drawn as before. On Compose, `KozmosChip`'s words now take what its icon and remove leave and end in an ellipsis there; they took the whole row before, which left a long chip's remove no width.
