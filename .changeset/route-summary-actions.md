---
"@kozmos-ds/react": minor
---

RouteSummary's navigation layout takes `actions` after its progress, for Previous and Next in static wayfinding, and draws them in equal columns in reading order, where a Kozmos Button wraps its label, keeps its 44px and reads `aria-disabled="true"` as unavailable. It can also draw the route preview: `onEndRoute` is optional in the navigation layout, End is drawn only when it is passed, and `locationText` adds the place's line under the destination. No existing call changes.
