---
"@kozmos-ds/tokens": patch
"@kozmos-ds/styles": patch
"@kozmos-ds/react": patch
---

The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) link in an app. The six semantic radii, `semantics_radius_none`, `_marker`, `_control`, `_container`, `_panel` and `_pill`, were written as references to `@dimen/primitives_layout_radius_*`, but those primitives are unitless numbers, written as `<integer>`s, so no such dimen existed and every app that built against these resources failed to link (`resource dimen/primitives_layout_radius_200 … not found`). Each radius is now its value in dp: 0dp, 4dp, 16dp, 20dp, 24dp and 9999dp, the same lengths as Compose's `KozmosDimensions` (which emits no pill; a pill is a shape there). No other resource changes. The fix is in the token build, which `@kozmos-ds/styles` and React take their stylesheet's tokens from, so they are named here, but their CSS is byte for byte what it was: only the Android resources change.
