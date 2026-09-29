# Kozmos Design System - Migration Guide

> **Purpose:** upgrading an app from one Kozmos release to the next, and moving an app's own
> components to Kozmos. The guide written before the code, for major versions that were never
> released, is kept as a proposal in
> [docs/proposals/migration-plan.md](../docs/proposals/migration-plan.md).

---

## 1. Upgrading between releases

Every Kozmos package is on 0.x. There has been no 1.0 and no major version, so there are no
codemods and no command to run them. Under semantic versioning a 0.x minor release may still change
an API, so read each release's entry in [api-changelog.md](./api-changelog.md), which is generated
from the packages' own changelogs, before you upgrade.

`@kozmos-ds/react` depends on exact versions of `@kozmos-ds/tokens`, `@kozmos-ds/icons` and
`@kozmos-ds/product-contracts`, so they move with it. If your app imports one of them directly,
upgrade it to the version React now depends on.

```bash
npm install @kozmos-ds/react@latest
npm ls @kozmos-ds/react @kozmos-ds/tokens @kozmos-ds/icons @kozmos-ds/product-contracts
```

Then type-check against the new types (`tsc --noEmit`) and run your tests. A renamed export, a
removed prop and a value a variant no longer takes are all compile errors.

SwiftUI (`packages/ios`) and Compose (`packages/android`) are not published: an app uses them from
a checkout of this repository, so upgrading them is updating that checkout.

## 2. Moving an app's own components to Kozmos

1. **Map each component to Kozmos.** [component-inventory.md](./component-inventory.md) lists every
   Kozmos component and the values each variant prop takes; each one's
   [API card](../docs/claude-design/README.md) lists every prop. Where Kozmos has no counterpart,
   record the gap rather than rebuilding the part inside the app.
2. **Put an adapter in front of each one.** It keeps the old props working while its callers move:

   ```tsx
   import { Button, type ButtonProps } from "@kozmos-ds/react";
   import type { ReactNode } from "react";

   // The props the app's own button took.
   interface LegacyButtonProps {
     kind?: "primary" | "secondary" | "danger";
     onClick?: () => void;
     disabled?: boolean;
     children: ReactNode;
   }

   // Each old kind, as the Kozmos variant that draws it.
   const variantOf: Record<
     NonNullable<LegacyButtonProps["kind"]>,
     NonNullable<ButtonProps["variant"]>
   > = {
     primary: "default",
     secondary: "outline",
     danger: "destructive",
   };

   export function LegacyButton({
     kind = "primary",
     ...props
   }: LegacyButtonProps) {
     return <Button variant={variantOf[kind]} {...props} />;
   }
   ```

3. **Move the callers to Kozmos, then delete the adapter.** `<LegacyButton kind="danger">` becomes
   `<Button variant="destructive">`.
4. **Put the app inside a `ThemeProvider`,** and import `@kozmos-ds/react/style.css` once: outside
   the provider, nothing Kozmos draws is themed. Replace the app's own colour and spacing values
   with Kozmos tokens ([token-implementation.md](./token-implementation.md)).
