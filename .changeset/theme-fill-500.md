---
"@kozmos-ds/tokens": minor
---

Decision 59: the theme fill is theme 500, the client's base colour set in the Pointr Cloud Dashboard, in both themes, and the theme foreground on it is white in both. `Components.Primary Buttons.themed.button.background.idle` now aliases `Primitives.Colors.theme.500` (`#135BEC`) in light and dark; hover and focus are `#1051E8` in both (theme 600 in light, 400 in dark), pressed `#0D44C2` in both (700 and 300); `foreground.content.{idle,hover,pressed,focus}` is `#FFFFFF` in both, where the dark theme had black. The CSS, Swift, Kotlin and Figma outputs carry the same values. `tokens:contrast:check` now pins the fill to theme 500 and the foreground to white in each theme, as well as their contrast (5.62:1 at rest, 6.24:1 hovered, 8.01:1 pressed).

**What you'll see:** every primary button is brighter in the light theme, `#135BEC` where it was theme 700, `#0D44C2`. In the dark theme it changes most: from light blue (`#7EA2F6`) with black text to the same `#135BEC` with white text. Anything you paint with these two tokens moves with them. Text, icons, borders and focus rings in the theme's colour keep theme 600, which still turns over with the theme.
