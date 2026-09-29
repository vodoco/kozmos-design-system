# Kozmos Code Patterns & Templates

> **Purpose:** the patterns a new Kozmos component follows, on each of its three platforms, React,
> SwiftUI and Jetpack Compose, and where the real component to copy each one from lives. The
> templates written before the code, which did not match it, are kept as a proposal in
> [docs/proposals/code-patterns-plan.md](../docs/proposals/code-patterns-plan.md).

---

## 1. React

Start with `pnpm new-component <Name>` ([component-creation-guide.md](./component-creation-guide.md)),
then follow a real component of the same shape:

| Shape                                | Follow                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Variants, with a `cva` recipe        | `packages/react/src/components/Badge/Badge.tsx`, `Tag/Tag.tsx`                   |
| Variants and emotion, with owned CSS | `packages/react/src/components/Button/Button.tsx`                                |
| Compound, built on Radix             | `packages/react/src/components/Dialog/Dialog.tsx`, `Tabs/Tabs.tsx`               |
| A form field: label, helper, error   | `packages/react/src/components/Input/Input.tsx`, `FieldWrapper/FieldWrapper.tsx` |
| The provider                         | `packages/react/src/components/ThemeProvider/ThemeProvider.tsx`                  |

A component with variants, in the shape Badge and Tag have:

```tsx
// kozmos-skills: template — a component inside packages/react/src/components/Banner, importing the package's own source
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils";

const bannerVariants = cva(
  "inline-flex items-center gap-2 rounded-control px-3",
  {
    variants: {
      tone: {
        info: "bg-secondary text-secondary-foreground",
        critical: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export interface BannerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ className, tone, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(bannerVariants({ tone }), className)}
      {...props}
    />
  ),
);
Banner.displayName = "Banner";
```

- **Its axes are its types.** `.ai-skills/component-inventory.md` and every card in
  `docs/claude-design` read a component's values from the built types, so a variant exists once
  it is in the recipe or the props: nothing else lists it.
- **Colours are roles, never literals:** Tailwind's role classes (`bg-primary`, `text-foreground`,
  `border-input`), defined in `packages/react/tailwind.config.js` over the tokens, or the token
  variables themselves. A class must compile to something: `pnpm components:classes:check` reads
  the built CSS.
- **Everything is exported from the package root:** `pnpm new-component` adds
  `export * from "./components/<Name>/<Name>"` to `packages/react/src/index.ts`.

## 2. SwiftUI

Follow `packages/ios/Sources/Components/Button/Button.swift`:

- A component is `public struct Kozmos<Name>: View` in `packages/ios/Sources/Components/<Name>/`,
  in the Swift package `Kozmos`.
- Its axes are enums named `Kozmos<Name><Axis>` (`KozmosButtonVariant`, `KozmosButtonSize`), with
  the same values as React's, spelled Swift's way (`.default`).
- Its colours come from `KozmosThemeTokens`, which follows the theme `KozmosThemeProvider` sets.
- Its Code Connect file sits beside it, `<Name>.figma.swift`.

## 3. Jetpack Compose

Follow `packages/android/src/main/java/com/kozmos/components/Button/Button.kt`:

- A component is `@Composable fun Kozmos<Name>(…)` in the package
  `com.kozmos.components.<name>`, lower case.
- Its axes are enum classes named `Kozmos<Name><Axis>` (`KozmosButtonVariant.Default`).
- Its colours come from `KozmosThemeTokens`, which follows the theme `KozmosThemeProvider` sets.
- Its Code Connect file sits beside it, `<Name>.figma.kt`.

## 4. Tokens

The token source, build, outputs and checks are in
[token-implementation.md](./token-implementation.md). A component never holds a colour, radius or
spacing value of its own: `pnpm tokens:raw:check` finds one that bypasses a role.

## 5. Stories

A story file sits beside its component, `<Name>.stories.tsx`, and Storybook (`apps/docs`) reads it
from there. Its `meta.title` files it under its category (`Components/Badge`), which the inventory
and the cards use too. Every story is drawn in light and dark by the visual review; one that cannot
draw the same way twice opts out with the tag `no-visual`. [storybook-guide.md](./storybook-guide.md)
has the rest.

## 6. Tests

- **React:** Vitest with Testing Library and `vitest-axe`, beside the component
  (`<Name>.test.tsx`); `packages/react/src/test/setup.ts` adds the axe matchers.
- **SwiftUI:** XCTest in `packages/ios/Tests/KozmosTests` (`Kozmos<Name>Tests.swift`), with
  `swift-snapshot-testing` for images.
- **Compose:** Paparazzi snapshots and unit tests in
  `packages/android/src/test/java/com/kozmos/components/<name>/`.

[testing-patterns.md](./testing-patterns.md) has the rest.

## 7. Code Connect

Each component links to its Figma component on all three platforms: `<Name>.figma.tsx`,
`<Name>.figma.swift` and `<Name>.figma.kt`, beside the component. `pnpm figma:parse:linked` and
`pnpm figma:parse:native:linked` parse them, as CI does.

---

## Quick Reference

### File Naming Conventions

| Platform | Component      | Story                | Test                      | Code Connect         |
| -------- | -------------- | -------------------- | ------------------------- | -------------------- |
| React    | `<Name>.tsx`   | `<Name>.stories.tsx` | `<Name>.test.tsx`         | `<Name>.figma.tsx`   |
| SwiftUI  | `<Name>.swift` | —                    | `Kozmos<Name>Tests.swift` | `<Name>.figma.swift` |
| Compose  | `<Name>.kt`    | —                    | `Kozmos<Name>…Test.kt`    | `<Name>.figma.kt`    |

### Import Patterns

```tsx
import "@kozmos-ds/react/style.css";
import { Button, ThemeProvider } from "@kozmos-ds/react";
import { AlertCircle } from "@kozmos-ds/icons";

export function Retry() {
  return (
    <ThemeProvider defaultTheme="light">
      <Button variant="outline">
        <AlertCircle size={16} aria-hidden /> Try again
      </Button>
    </ThemeProvider>
  );
}
```
