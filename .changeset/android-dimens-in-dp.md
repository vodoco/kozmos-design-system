---
"@kozmos-ds/tokens": patch
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
---

The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) write every `<dimen>` in dp. The nine px-valued tokens, `primitives_radius_full`, `primitives_border_width_none`, `_sm`, `_md` and `_lg`, `primitives_grid_gutter` and `_margin`, and `primitives_touch_min` and `_comfortable`, were written in `px`, which Android reads as device pixels, so on a 3x phone the 44px touch target was about 15dp and a 1px border a third of a dp. A Kozmos px is a CSS pixel, which is a dp, as `KozmosDimensions` writes its lengths and as Compose's parts draw these ones (`border(1.dp)`, `44.dp`): each is now its number in dp (`44dp`, `1dp`). No name or number changes, only the unit, so an app that reads these through `R.dimen` gets three times the size it got on a 3x screen, the size it was meant to have. The lengths written as `<integer>` (layout spacing, sizing and radius) and the type scale written as unitless `<string>`s are unchanged. The fix is in the token build, which `@kozmos-ds/styles` and React take their stylesheet's tokens from, so they are named here, but their CSS is byte for byte what it was.
