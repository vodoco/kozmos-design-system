---
"@kozmos-ds/react": minor
---

`Progress` takes `shape="circular"`: a ring with a label in its centre, for a count out of a total, as MAP-64's Level Manager shows "11 Levels Added in total" (decision 131, GAP-038). `shape` is `"linear"` by default, the bar as it was.

- **The ring.** `size` is its diameter and stroke: `sm` 48 and 4, `md` 96 and 8 (the default), `lg` 128 and 12, the layout spacing tokens 600, 900 and 1000 and 50, 100 and 150. It is one SVG, a circle's two strokes, so nothing is inset and nothing sits off centre: the band measures its stroke all the way round in Chromium, Firefox and WebKit, at 1x and 2x. The arc is the theme fill (theme 500, decision 59) on a background 100 track: 4.42:1 on the track and 5.62:1 on the page in light, 3.13:1 and 3.74:1 in dark (on background 200 the dark arc would read 2.32:1). The linear bar keeps its theme 600 on background 200.
- **Its direction.** The arc starts at 12 o'clock and runs clockwise for `value` of `max`, and a progress ring does not mirror: right to left draws the same ring, while the label follows the reading direction.
- **The label.** `label` is drawn in the centre, inside the square the hole holds, 12 on 16 unless its content says otherwise. It stays a `progressbar` with its value, and the label is said once: it names the bar, or describes it when `aria-label` or `aria-labelledby` already names it (after any `aria-describedby` of the caller's), and the drawn copy is `aria-hidden`. For a count, `getValueLabel` (Radix's) says "11 of 15" in place of "73%". A bar has no centre: `size` and `label` draw nothing on it, and neither reaches the DOM.
- **Motion and forced colours.** A new value sweeps round over the standard duration; under reduced motion, the media query's or `DesignConfigProvider`'s, it is drawn there at once. In forced colours the arc is the system's Highlight on a GrayText track.
- **No value** draws the track alone; an indeterminate ring is GAP-159's.
- **New type:** `ProgressProps`, `Progress`'s props with `shape`, `size` and `label`.

SwiftUI's `KozmosProgress` takes `shape` and `size` (`KozmosProgressShape`, `KozmosProgressSize`) and a `label`, and Compose's `KozmosProgress` takes `shape`, `size` and `label`, drawing the same ring from the same tokens. Figma's Progress set gains Shape (Linear, Circular) and Size (Small, Medium, Large) axes and a Label, drawn by the importer; its five variants keep their node ids.
