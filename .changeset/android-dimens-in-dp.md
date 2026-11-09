---
"@kozmos-ds/tokens": patch
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
---

The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) write every length in dp. The nine px-valued tokens, `primitives_radius_full`, `primitives_border_width_none`, `_sm`, `_md` and `_lg`, `primitives_grid_gutter` and `_margin`, and `primitives_touch_min` and `_comfortable`, were written in `px`, which Android reads as device pixels, so on a 3x phone the 44px touch target was about 15dp and a 1px border a third of a dp. A Kozmos px is a CSS pixel, which is a dp, as Compose's `KozmosDimensions` already writes them: each is now its number in dp (`44dp`, `1dp`). No value or name changes, only the unit. The fix is in the token build, which `@kozmos-ds/styles` and React take their stylesheet's tokens from, so they are named here, but their CSS is byte for byte what it was.
