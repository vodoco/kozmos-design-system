# Kozmos Design System

One set of parts for Pointr's indoor mapping products, drawn from one set of
tokens and built for four surfaces: React on the web, SwiftUI on iOS, Jetpack
Compose on Android, and a Vue proxy. The tokens come out of Figma, the
components are checked against the file they came from, and every platform
reads the same names.

- **Core** — buttons, fields, sheets, navigation, feedback: the parts any
  product needs.
- **Product / SDK** — the map shell, POI cards and lists, wayfinding steps,
  search and browse panels: the parts a Pointr product needs.

## Install

The web packages are on npm under the `@kozmos-ds` scope:

```bash
pnpm add @kozmos-ds/react @kozmos-ds/tokens @kozmos-ds/icons @kozmos-ds/product-contracts
```

`@kozmos-ds/react` needs its stylesheet and a provider. Components read their
colours from the theme, so nothing outside a `ThemeProvider` is themed:

```tsx
import "@kozmos-ds/react/style.css";
import { Button, ThemeProvider } from "@kozmos-ds/react";

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Button>Take me there</Button>
    </ThemeProvider>
  );
}
```

`@kozmos-ds/tokens` also ships `css/light.css` and `css/dark.css`, which put
the same variables on `:root` and switch them with `<html data-theme>` — import
those only if your app owns the whole document.

### iOS and Android

Neither native package is distributed yet: there is no `Package.swift` at the
repository root, so SwiftPM cannot resolve this repository by URL, and the
Android library declares no `maven-publish`, so there is nothing in a Maven
repository to depend on. Today both are consumed from a checkout —
`packages/ios` as a local SwiftPM package (library `Kozmos`, iOS 16+) and
`packages/android` as a Gradle module (`com.kozmos`, minSdk 26, compileSdk
34). `packages/android/README.md` covers the Android SDK setup a build needs.

## Documentation

The website — every component running, with its props, its code on three
platforms, and the measured gaps — publishes from `main` to
<https://vodoco.github.io/kozmos-design-system/>. Its source is
[`apps/site`](./apps/site/README.md). Storybook, the component reference —
each component's docs, stories, controls and code on every platform —
publishes with it, to <https://vodoco.github.io/kozmos-design-system/storybook/>,
from [`apps/docs`](./apps/docs).

[`docs/README.md`](./docs/README.md) maps the written documentation. Start with
[`docs/ds-handoff.md`](./docs/ds-handoff.md): the scope, the priorities in
order, the measured state and the open decisions. Superseded material,
including the May 2026 agent-tracking passes, is under
[`docs/archive/`](./docs/archive/README.md).

[`STATUS.md`](./STATUS.md) is generated: which components exist on which
platform, and which are linked to Figma.

## The repository

| Path                         | What                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `packages/tokens`            | The tokens, from Figma, as CSS, TS, Swift and Kotlin |
| `packages/react`             | The React components and their stylesheet            |
| `packages/icons`             | The icon set, named by stable keys                   |
| `packages/product-contracts` | The shapes a product passes the product components   |
| `packages/ios`               | The SwiftUI library                                  |
| `packages/android`           | The Jetpack Compose library                          |
| `packages/vue`               | The Vue proxy (private)                              |
| `apps/site`                  | The website, built from the published packages       |
| `apps/docs`                  | Storybook, the component reference                   |
| `apps/playground-*`          | A place to try web, Android and Vue                  |
| `apps/Playground.swiftpm`    | The same for iOS, as a Swift Playground              |
| `docs`                       | The written documentation                            |
| `scripts`                    | The checks — tokens, parity, Figma, releases         |

## Development

Node 20 and pnpm 9.

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

`pnpm dev` runs every app's dev server through Turborepo. The checks under
`scripts/` are run by name — `pnpm tokens:theme:check`, `pnpm figma:verify`,
`pnpm components:classes:check` and the rest; `pnpm ci:local` runs the set CI
runs.

[`CONTRIBUTING.md`](./CONTRIBUTING.md) has the working agreements: how a
component is added, how tokens are changed, and how a release is cut.

## Security

Report a vulnerability privately — see [`SECURITY.md`](./SECURITY.md). Please
do not open a public issue for one.

## Licence

MIT. See [`LICENSE`](./LICENSE).
