---
"@kozmos-ds/react": minor
---

Decision 62: `LocationPin` draws its featured and accent pins as SwiftUI, Compose and Figma do.

- **Featured:** a featured pin is the SDK's Featured amber, alert 500 (`#FAB735` in both themes), with its number in the alert's on-fill colour, black (11.89:1), whatever its variant or tint. It no longer draws a star badge. Its accessible name is `label` followed by the new `featuredLabel` prop ("Featured" by default; pass it translated), so the amber is never the only way to tell it.
- **Accent:** the accent pin is brand variant 1's 500 (`#4135F1`) with a white number (6.99:1). At rest, its ring and number are the variant's 700.

**What you'll see:**

- A featured pin turns amber with a black number, where it was blue with a star.
- A filled accent pin turns violet with a white number, where it was the theme blue with black in the dark.
- A quiet accent pin's ring is violet.
- Screen readers hear "…, Featured" on a featured pin. If your `label` already says it, drop it from the label.
