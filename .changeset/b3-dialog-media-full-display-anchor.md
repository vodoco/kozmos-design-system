---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
"@kozmos-ds/tokens": minor
---

DialogHeader takes `media`, an illustration or a photo above the title, 16 over it (decision 195, GAP-214). With `mediaBleed` it reaches the dialog's edges and top corners, past the dialog's 24 of padding, and the dialog's corner rounds it; the close keeps its corner, over the media. The media is decorative, hidden from assistive technology, unless `mediaLabel` names it, when it is read as one image.

DialogContent takes `size="full"`: the window less 16 on each side, its first child keeping its height and the second taking the rest (decision 202, GAP-259). `size="default"`, at most 512 wide, is unchanged, and DialogContent now writes `data-size`. ImageField's full-screen preview opens in it and no longer carries `.kozmos-image-field-preview` or its own sizing rule; it draws and behaves as before.

Text and Heading take one display size, `size="display"`: 48 on 54 lines, bold unless Text is given a weight, for a marketing-style headline (decision 203, GAP-272). Heading keeps its `level` as its rank. The tokens package adds the display type tokens, `Semantics.Typography.Display` (`--semantics-typography-display-size` 3rem, `-line-height` 3.375rem, `-weight` 700 and `-letter-spacing` 0rem), with their Swift and Kotlin members and Android resources.

TourStep takes `anchor`, where the card is placed apart from what it lights (decision 198, GAP-220): an element, a ref, a virtual element or a rect. Backdrop still lights `target`, and where the card overlaps the lit area it stays above the cut-out. Without an anchor, or with one not on the page, the card is placed by the target, as before.
