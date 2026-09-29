---
"@kozmos-ds/react": patch
---

`AICompanionPanel` keeps what it covers out of reach while it is open (the site's GAP-93, WCAG 2.2 2.4.11). It covers the frame and moves focus in, but Shift+Tab from the panel landed on the search's tiles beneath it, where nobody could see them. While open, a panel laid over the box it fills, `absolute inset-0` in its positioned container as its docs place it, now makes the rest of that box inert, and nothing beyond it; fixed over the whole viewport, it covers the page. Live regions beneath still speak, and popups a part inside opens in the page's portal stay in reach. It gives everything back as it closes, before it hands focus back, so focus returns to the button it covered and `onCloseAutoFocus` can focus anything under it. A panel in flow, or over only part of its box, covers nothing and behaves as before, and focus still moves in only when the visitor opens it (decision 16). A product's own `inert` on the covered box is left to it.
