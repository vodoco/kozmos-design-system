# @kozmos-ds/vue

## 0.17.0-next.0

The first `@kozmos-ds/vue` on npm, a prerelease on the `next` tag (decisions 162 and 209):
`npm install @kozmos-ds/vue@next vue`. It is built on `@kozmos-ds/styles` and `@kozmos-ds/react`
0.17.0 and pins both exactly; React is needed only for `@kozmos-ds/vue/react-bridge`.

- **`@kozmos-ds/vue`**, native Vue 3 on Reka UI, with no React, rendering on the server:
  `KozmosThemeProvider` (with `useTheme`), `KozmosDensityScope`, `KozmosAnalyticsProvider` (with
  `useKozmosAnalytics`), `KozmosButton`, `KozmosBadge` and `KozmosSeparator`, each drawing the element its
  React counterpart draws from the same recipes, held to React's by the API contract and DOM parity checks
  (GAP-148).
- **`@kozmos-ds/vue/react-bridge`**, a Vue wrapper for every React part not ported yet. A compound's
  parts share one React tree, so a part in another's slot finds its context (GAP-230), and the Vue
  providers reach the React parts (decision 172). `v-model` goes through the models each wrapper names, and
  a listener reaches the React part when the part takes it (decision 168).

## 0.0.5

### Patch Changes

- Updated dependencies [3e3a6d3]
- Updated dependencies [c7d802f]
- Updated dependencies [4773abd]
- Updated dependencies [f4dc59a]
- Updated dependencies [942d7cd]
- Updated dependencies [b9467b1]
  - @kozmos-ds/react@0.4.0

## 0.0.4

### Patch Changes

- Updated dependencies [cc3dc32]
- Updated dependencies [558344b]
  - @kozmos-ds/react@0.3.0

## 0.0.3

### Patch Changes

- Updated dependencies
  - @kozmos-ds/react@0.2.0

## 0.0.2

### Patch Changes

- Updated dependencies [0cf155f]
- Updated dependencies [7775c73]
- Updated dependencies [71e31bd]
- Updated dependencies [1edef7b]
- Updated dependencies [42fbe70]
- Updated dependencies [de7a409]
- Updated dependencies [3bedd72]
- Updated dependencies [1d4e323]
- Updated dependencies [c7c35d6]
- Updated dependencies [ddb2656]
- Updated dependencies [a06ca47]
- Updated dependencies [ad1a23b]
- Updated dependencies [a9e9cb3]
- Updated dependencies [eb68e53]
- Updated dependencies [95ccf34]
- Updated dependencies [a03d3fd]
- Updated dependencies [550b561]
- Updated dependencies [b9dd0d6]
- Updated dependencies [81812c4]
- Updated dependencies [4ef471f]
  - @kozmos-ds/react@0.1.0
