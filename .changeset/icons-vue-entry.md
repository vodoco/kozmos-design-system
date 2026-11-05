---
"@kozmos-ds/icons": minor
---

**`@kozmos-ds/icons/vue`: every icon as a Vue 3 functional component** (Vue 3 Phase 0). It exports what the package's main entry exports, under the same names: the 1,206 icons, `kozmosIconNames`, the aliases, the definitions, the registry, `getIconComponent`, `resolveIconName`, `getIconDefinition`, `isKozmosIconKey` and `KozmosIconProps`. Each icon draws the same `<svg>` the React icon does, for every icon and for each of `size`, `color`, `strokeWidth` and `absoluteStrokeWidth`. `class`, `style`, `aria-*`, `role` and the rest fall through to the `<svg>` and win over the icon's own, as React's spread does, and `KozmosIconProps` types them with Vue's `SVGAttributes`, so a strict template accepts them. A named import brings in that icon alone.

It is built from the same generated outlines, so the two entries cannot drift. Vue (3.5 or later, as `@kozmos-ds/vue` asks, and the 3.5.44 it is tested with) is an optional peer dependency: a React app installs nothing new, and the main entry and its declarations are byte for byte what 0.8.0 shipped. A `vue/package.json` points resolvers that ignore `exports` (TypeScript's `node10`) at the Vue entry. React is now an optional peer dependency too, so a Vue-only app installs no React.
