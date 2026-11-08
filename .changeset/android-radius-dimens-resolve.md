---
"@kozmos-ds/tokens": patch
---

The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) link in an app. The six semantic radii, `semantics_radius_none`, `_marker`, `_control`, `_container`, `_panel` and `_pill`, were written as references to `@dimen/primitives_layout_radius_*`, but those primitives are unitless numbers, written as `<integer>`s, so no such dimen existed and every app that built against these resources failed to link (`resource dimen/primitives_layout_radius_200 … not found`). Each radius is now its value in dp: 0dp, 4dp, 16dp, 20dp, 24dp and 9999dp, the same lengths as Compose's `KozmosDimensions`. No other resource changes.
