---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

A read-only star `Rating` shows a score to the nearest half (decision 181).

- **`Rating` `readOnly`** with `variant="stars"` rounds `value` to the nearest half, the doubled value rounded half up, `Math.round(value * 2) / 2`: 4.3 draws as 4.5, 4.2 as 4 and 4.25 as 4.5. The half is the filled star clipped to its inline start half over the empty star, the same 24px glyph and the same `data-yellow` and `muted-foreground` colours: the left half in a left-to-right page, the right half in a right-to-left one. The image is named for the rounded value, "Rated 4.5 out of 5 stars", and a `valueLabel` you give is called with it (4.5, not 4.3). A whole value draws and reads as before, so no read-only rating that showed whole stars changes.
- Editing stays whole stars: an editable `Rating` and a `thumbs` rating, read-only or not, are unchanged. No prop is added, removed or renamed.

The stylesheet gains `w-1/2`, the half star's clip. SwiftUI's `KozmosRating(rating:max:label:valueLabel:)` and Compose's `KozmosRating(rating = …)` take the score as a `Double` and a `Float`. In Figma, Rating's `Value` axis gains `0.5`, `1.5`, `2.5`, `3.5` and `4.5`, drawn at `Scale=Stars, State=Readonly` only.
