---
"@kozmos-ds/react": patch
---

Smaller, with nothing changed in what any part does or what the package exports. Everything at once, minified and gzipped as an app's build does, goes from 91.81 to 90.43 KB, and AdaptiveMapShell alone from 8.26 to 8.00 KB.

- **The JavaScript is built for the browsers package.json declares,** as the stylesheet already was. Built for Vite's default target (Chrome 87, Edge 88, Safari 14, Firefox 78), esbuild wrote every optional chain, `a?.b`, out as `a == null ? void 0 : a.b`, because it trusts `?.` only from Chrome and Edge 91. It now writes `?.` as the source does. The syntax is no newer than before: the build already wrote `??`, which is ES2020 like `?.`, and it still writes out `x ??= y`, which is ES2021. An app whose own build targets a browser older than Chrome 91 rewrites the chains itself and gets the same size as before. The CommonJS bundle goes from 95.32 to 93.45 KB gzipped.
- **`surfaceClass` and `SURFACE_CLASSES` live in a module of their own,** which `Surface` re-exports, so the parts that only take a surface's class no longer bring the Surface component into an app's bundle: AdaptiveMapShell, RouteSummary, RouteSetupPanel, ArrivalPanel, FeedbackCard, ClientAppBanner, SaveLocationCard, ManoeuvreCard and RoutingInputGroup. The exports are the same.
- **AdaptiveMapShell drops what it never used:** a first set of attribution bounds that every field of was overwritten before anything read it, and two null checks the optional chains before them already made.
