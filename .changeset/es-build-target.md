---
"@kozmos-ds/react": patch
---

The JavaScript is built for the browsers package.json declares, as the stylesheet already was, and is smaller for it. Built for Vite's default target (Chrome 87, Edge 88, Safari 14, Firefox 78), esbuild wrote every optional chain, `a?.b`, out as `a == null ? void 0 : a.b`, because it trusts `?.` only from Chrome and Edge 91. It now writes `?.` as the source does. Everything at once, minified and gzipped as an app's build does, goes from 91.81 to 90.46 KB, and the CommonJS bundle from 95.32 to 93.45 KB gzipped. What each part does is unchanged.

The syntax is no newer than before: the build already wrote `??`, which is ES2020 like `?.`, and it still writes out `x ??= y`, which is ES2021. An app whose own build targets a browser older than Chrome 91 rewrites the chains itself and gets the same size as before.
