---
"@kozmos-ds/react": minor
---

RouteSummary's navigation layout takes `actions` after its progress, for Previous and Next in static wayfinding, and draws them in equal columns in reading order, where a Kozmos Button wraps its label, keeps its 44px and reads `aria-disabled="true"` as unavailable. It can also draw the route preview: `onEndRoute` is optional in the navigation layout, End is drawn only when it is passed, and `locationText` adds the place's line under the destination. Every existing `<RouteSummary>` still compiles and draws as before; only code that reads the End handler from the props types needs one change:

**Types:** `onEndRoute` is now optional on `RouteSummaryNavigationProps`, and so on the `RouteSummaryProps` union; it stays required on `RouteSummaryEstimateProps`. Code that calls it through those types, such as a wrapper's `props.onEndRoute()` or a `RouteSummaryNavigationProps["onEndRoute"]` handler, no longer type-checks (TS2722, "possibly 'undefined'"). Call it as `props.onEndRoute?.()`, or narrow to `RouteSummaryEstimateProps` where End is always there.
