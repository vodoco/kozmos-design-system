---
"@kozmos-ds/react": minor
---

`ClientAppBanner`, Express's Client App Banner (GAP-127), for `AdaptiveMapShell`'s `topBar`. It draws the five fields a customer sets in Pointr Cloud and one action, and it can be dismissed. SwiftUI's `KozmosClientAppBanner` and Compose's `KozmosClientAppBanner` draw the same.

- **Fields.** `promotionText` is the line above the name, `appName` the app's name, and `description` what the app is for, drawn on two lines at most but read in full. `appIconSrc` is the app's icon. `actionLabel` and `onAction` are the button. Every word is the customer's; nothing is invented when a field is left out.
- **The icon** is 48 square at every text size, as on SwiftUI and Compose, with the Control corner and the subtle edge; an image of any size is cropped to the square, never stretched. Without one, or until it loads, the app's initial stands in for it, as an Avatar's fallback does, and it is gone once the icon loads, so it never shows through a transparent icon. It is decoration beside the name; `appIconAlt` names it only when it says more.
- **Dismissing.** `onDismiss` adds a dismiss button named by `dismissLabel` ("Dismiss"), the 44 target at every text size. The banner never removes itself: the product does, decides for how long, and moves focus on, as the docs' example does. Left out, there is no dismiss button.
- **The surface** is its own, since the top bar draws none: the solid surface, the Container corner and map chrome's floating elevation. It is 16 inside and fills the top bar's width.
- **Narrow widths.** The words and the action share a line while the words keep 10rem beside the icon; past that, the action goes under the icon and the words and spans them both, so the words keep the width beside the icon. The layout, the icon and the targets are owned CSS in logical sides only, so they hold in a host without `@scope`, and right to left mirrors them.
- **Accessibility.** It is a region named by the app (`aria-label` names it otherwise). It reads the promotion, the name and the description, then the action, then dismiss. The action's name is its words. Every target keeps 44, and nothing moves focus or is announced.
