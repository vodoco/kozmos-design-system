---
"@kozmos-ds/react": minor
---

Add a reusable decorative ProgressTrack and compact UserLocationMarker. RouteProgressRail can now show a host-selected active leg in theme colour or a theme-to-success gradient, fixed transition landmarks and a separate position dot. Invalid or unavailable route positions do not claim zero progress. Existing step-disc consumers retain their presentation until they supply activeLeg.

Explicit static mode colours only the selected section without a position dot; live mode grows its fill and gradient from journey start to the supplied position, including across transitions. Opt-in directional dash flow is independent of progress, stops at the next transition, honours reduced motion and background lifecycle, and can be disabled by the host without changing position.

Web respects both OS and application reduced-motion settings, and uses system colours for visible filled distance in forced-colour mode.
