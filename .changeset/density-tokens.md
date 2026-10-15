---
"@kozmos-ds/tokens": minor
---

Density tokens (decision 82): `@kozmos-ds/tokens/css/density.css` sets the control sizes for both densities. Touch, the default, is on `:root` and on `[data-kozmos-density='touch']`, at today's sizes: buttons 44, icon buttons 44 and 48, text fields 44. Compact is on `[data-kozmos-density='compact']`: buttons 32, 40 and 48; icon buttons 28, 32 and 40; text fields 40. `ThemeProvider density` sets the attribute. The tokens are web only; the iOS and Android outputs are unchanged.
