---
"@kozmos-ds/react": minor
---

`Progress` takes `shape="circular"`: a ring for a count out of a total, as MAP-64's Level Manager shows its levels added (decision 131, GAP-038). `shape` is `"linear"` by default, the bar as it was.

- **The ring.** `size` is its diameter and stroke: `sm` 48 and 4, `md` 96 and 8 (the default), `lg` 128 and 12, the layout spacing tokens 600, 900 and 1000 and 50, 100 and 150. It is one SVG, a circle's two strokes, so nothing is inset and nothing sits off centre: the band measures its stroke all the way round in Chromium, Firefox and WebKit, at 1x and 2x. The track is background 100.
- **Its tone.** `tone` says what its completion means, in Tag's and Button's emotions (`Emotion`): `themed` (the default), `neutral`, `success`, `informative`, `alert` or `danger`. The arc is the emotion's text colour, so `themed` is theme 600, the bar's own fill. Every tone reads 4.80:1 or more on the track in light and 5.18:1 or more in dark.
- **Its direction.** The arc starts at 12 o'clock and runs clockwise for `value` of `max`, and a progress ring does not mirror: right to left draws the same ring, while the label follows the reading direction.
- **The label.** `label` is drawn in the hole, inside the square it holds, or with `labelPlacement="end"` beside the ring, 12 from it at the inline end (on its left right to left) and centred on it; 12 on 16 unless its content says otherwise. It stays a `progressbar` with its value, and the label is said once wherever it is drawn: it names the bar, or describes it when `aria-label` or `aria-labelledby` already names it (after any `aria-describedby` of the caller's), and the drawn copy is `aria-hidden`. For a count, `getValueLabel` (Radix's) says "11 of 15" in place of "73%". A bar draws no ring: `size`, `tone`, `label` and `labelPlacement` draw nothing on it, and none reaches the DOM.
- **Motion and forced colours.** A new value sweeps round over the standard duration; under reduced motion, the media query's or `DesignConfigProvider`'s, it is drawn there at once. In forced colours the arc is the system's Highlight on a GrayText track, whatever its tone.
- **No value** draws the track alone; an indeterminate ring is GAP-159's.
- **New type:** `ProgressProps`, `Progress`'s props with `shape`, `size`, `tone`, `label` and `labelPlacement`.

SwiftUI's and Compose's `KozmosProgress` take `shape`, `size`, `tone` (a `KozmosEmotion`), `labelPlacement` and a `label`, drawing the same ring from the same tokens. Figma's Progress set gains Shape (Linear, Circular), Size (Small, Medium, Large) and Tone (the six emotions) axes, a Label with Show Label and Label Beside, drawn by the importer; its five variants keep their node ids.
