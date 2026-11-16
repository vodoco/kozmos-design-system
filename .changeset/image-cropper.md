---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

`ImageCropper` is new (GAP-273, MAP-32's logo crop step): an image framed to an aspect ratio, the frame the box and the image moving and scaling under it.

- `aspectRatio` is the frame's shape, 1 by default (a square logo) or any ratio (`16 / 9`). A pointer drags the image and two pointers pinch it; the zoom row under it has Zoom out, a zoom `Slider` in percent and Zoom in, from 100% to `maxZoom` (4), and `showZoomControls={false}` leaves it out.
- The frame is one tab stop, named by `label` and described by `instructions`: the arrow keys move it by a tenth of itself (physically, in right to left too: an image does not mirror) and plus and minus zoom about its middle. Each move or zoom is said in a polite live region, as `statusLabel` words it; a drag is said when it lets go. A zoom button at its limit is `aria-disabled`, not disabled, so it keeps focus.
- `onCrop` hands back `{ x, y, width, height }`, each a fraction of the image (never pixels), after every move or zoom; `onImageLoad` hands back the frame the image is first drawn in. `value` (null for the middle) and `defaultValue` are held to the ratio and inside the image. `ImageCropperCrop` and `ImageCropperStatus` are exported.

SwiftUI's `KozmosImageCropper(image:imageSize:crop:)` and Compose's `KozmosImageCropper(painter, contentDescription, crop, onCropChange)` frame the same way, with the same arithmetic: a drag and a pinch, the zoom row, a hardware keyboard's arrows and plus and minus, and the frame as one VoiceOver element (adjustable to zoom, with Move actions) or one TalkBack node (Move and Zoom actions, its zoom the adjustable value), each change said. The Figma importer paints an ImageCropper set (Ratio: Square, Landscape; Zoom Controls). Vue's bridge exports `KozmosImageCropper`, its `v-model` the frame.
