# Kozmos Design System - Cross-Platform Component Mapping

> **Purpose:** how Kozmos's three platforms correspond: where each one lives, how a component and a
> token are named on each, and where to find which component exists on which platform. What each
> component takes on each platform is on its Storybook page, which shows its code on every
> platform.

---

## 1. The platforms

| Platform                   | Where              | Import                                             | Distribution                   |
| -------------------------- | ------------------ | -------------------------------------------------- | ------------------------------ |
| React                      | `packages/react`   | `import { Button } from "@kozmos-ds/react"`        | npm: `@kozmos-ds/react`        |
| SwiftUI (iOS 16 and later) | `packages/ios`     | `import Kozmos` (the Swift package's library)      | From a checkout; not published |
| Jetpack Compose (Android)  | `packages/android` | `import com.kozmos.components.button.KozmosButton` | From a checkout; not published |
| Tokens                     | `packages/tokens`  | `@kozmos-ds/tokens` (CSS and JavaScript)           | npm: `@kozmos-ds/tokens`       |

Vue waits: `packages/vue` is a private harness that mounts the React components in Vue, not a
package to install. There is no React Native package. The mapping planned before the code, across
more platforms, is kept as a proposal in
[docs/proposals/platform-mapping-plan.md](../docs/proposals/platform-mapping-plan.md).

## 2. Which component exists where

This document does not list it, because a hand-kept list drifts. Two generated sources do:

- [component-inventory.md](./component-inventory.md): every React component, with whether SwiftUI
  and Compose have it.
- [docs/status.md](../docs/status.md): the same, with whether each links to its Figma component.

## 3. Names across the platforms

A React component `Name` is `KozmosName` on SwiftUI and Compose, and its parts follow it:
`Accordion`, `AccordionItem` and `AccordionTrigger` are `KozmosAccordion`, `KozmosAccordionItem`
and `KozmosAccordionTrigger`. A Compose component lives in the package
`com.kozmos.components.<name>`, lower case: `com.kozmos.components.accordion`. An axis's values are
the same words on each platform, spelled the platform's way: React's `variant="default"` is
`.default` in Swift and `KozmosButtonVariant.Default` in Kotlin.

The same Button on each, as its documentation shows it:

```tsx
import { Button } from "@kozmos-ds/react";

export function Example() {
  return <Button variant="default">Button</Button>;
}
```

```swift
import SwiftUI
import Kozmos

// Inside a SwiftUI view body.
KozmosButton("Button", variant: .default) {
    // Handle the action.
}
```

```kotlin
import androidx.compose.material3.Text
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant

// Inside a @Composable function.
KozmosButton(onClick = {}, variant = KozmosButtonVariant.Default) {
    Text("Button")
}
```

## 4. Tokens across the platforms

| Platform        | How                                                                     | Example                                           |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| Web, CSS        | CSS variables, from `@kozmos-ds/react/style.css` or `@kozmos-ds/tokens` | `var(--primitives-colors-background-0)`           |
| Web, JavaScript | Named exports of `@kozmos-ds/tokens`, the light theme's values          | `PrimitivesColorsTheme500`                        |
| SwiftUI         | `KozmosThemeTokens`, which follows the theme                            | `KozmosThemeTokens.primitivesColorsForeground100` |
| Compose         | `KozmosThemeTokens`, which follows the theme                            | `KozmosThemeTokens.primitivesColorsForeground100` |

The native packages carry copies of the generated token sources: `pnpm tokens:native:copy` copies
them after a build, and `pnpm tokens:copies:check` fails while a copy differs.
