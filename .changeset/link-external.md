---
"@kozmos-ds/react": minor
---

`Link` takes `external`: a link that opens in a new tab, and says so (GAP-202, decision 122), for the links that leave a product, such as Pointr Cloud's Privacy Policy, Terms of Service and Documentation.

- **A new tab.** `target="_blank"` with `rel="noopener noreferrer"`, so the new page cannot reach the one that opened it. A caller's own `target` or `rel` still wins, whole.
- **An icon.** The new-tab icon, `LinkExternal01` from `@kozmos-ds/icons`, at the link's inline end, after a no-break space: the text's size (1em) and colour, hovered too, and hidden from assistive technology. The no-break space and the icon are one unbreakable run with the link's last word, so the icon never starts a line alone. Right to left, it is mirrored to point to the link's end, as Compose's AutoMirrored new-tab icon and SwiftUI's forward arrow are.
- **An announcement.** "opens in a new tab", read after the link's name ("Privacy Policy opens in a new tab"), and never drawn. `externalLabel` gives it the product's words; an empty one says nothing more. An `aria-label` on the link replaces its content, this announcement with it.
- **New props:** `LinkProps` gains `external` and `externalLabel`. A link without `external` is unchanged.

SwiftUI's and Compose's `KozmosLink` take `external` too, with the same icon: SwiftUI says "Opens in your browser" as an accessibility hint, and Compose "open in your browser" as the click's label. Figma's Link has an External property that shows the icon.
