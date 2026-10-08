# Kozmos Troubleshooting Guide

> **Purpose:** This document provides solutions to common issues encountered when developing, building, testing, and deploying the Kozmos Design System. Use this as a first reference when encountering errors.

---

## Table of Contents

1. [Token System Issues](#1-token-system-issues)
2. [Build & Bundle Issues](#2-build--bundle-issues)
3. [React Component Issues](#3-react-component-issues)
4. [iOS/SwiftUI Issues](#4-iosswiftui-issues)
5. [Android/Compose Issues](#5-androidcompose-issues)
6. [React Native Issues](#6-react-native-issues)
7. [Vue/Web Components Issues](#7-vueweb-components-issues)
8. [Figma Code Connect Issues](#8-figma-code-connect-issues)
9. [Storybook Issues](#9-storybook-issues)
10. [Testing Issues](#10-testing-issues)
11. [CI/CD Issues](#11-cicd-issues)
12. [Cross-Platform Parity Issues](#12-cross-platform-parity-issues)
13. [Performance Issues](#13-performance-issues)
14. [Accessibility Issues](#14-accessibility-issues)

---

## 1. Token System Issues

### 1.1 Style Dictionary Build Fails

**Symptoms:**

```
Reference Errors:
Some token references (1) could not be found.
```

followed, since the build logs verbosely, by the token at fault:
`<token> tries to reference {<path>}, which is not defined.`

**Causes & Solutions:**

| Cause                                      | Solution                                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A reference to a token that does not exist | A reference names a token by its collection and path, `{Primitives.Colors.background.200}`: check the path in `packages/tokens/src/tokens-light.json` and `tokens-dark.json` |
| A collection spelled in the wrong case     | The collections are `Primitives`, `Semantics` and `Components`, capitalised                                                                                                  |
| A circular reference                       | Token A refers to B, which refers to A: break the cycle                                                                                                                      |

**Debug Command:**

```bash
# Build the tokens: the build names the unresolved reference. There is no separate validation script.
pnpm --filter @kozmos-ds/tokens build
```

---

### 1.2 Token Values Not Updating in Components

**Symptoms:**

- Changed a token's value in `packages/tokens/src`
- A component still shows the old value

**Solutions:**

1. **Rebuild the tokens, then what reads them:**

   ```bash
   pnpm tokens:build                           # packages/tokens/dist
   pnpm --filter "@kozmos-ds/react..." build   # React's stylesheet carries the token variables
   pnpm tokens:native:copy                     # the copies in packages/ios and packages/android
   ```

   Workspace packages resolve to each other's `dist`, so nothing sees a change until it is
   rebuilt; restart Storybook after a rebuild.

2. **Rebuild without Turborepo's cache:**

   ```bash
   pnpm build --force
   ```

   Not `pnpm clean`: no package defines a `clean` script, so it cleans nothing and deletes the
   root `node_modules`.

3. **Read the variable's real name in DevTools:** Kozmos's variables are named for their
   collection and path, `--primitives-colors-background-0`, `--semantics-radius-container`,
   `--components-…`; there is no `--kozmos-` prefix. From `@kozmos-ds/react/style.css` they are
   defined on the `ThemeProvider`'s element, not on `:root` (§3.1).

---

### 1.3 Figma Variables Out of Sync

**Symptoms:**

- Token values in code don't match the Figma variables

**Solutions:**

1. **Find which side is stale before you sync.** The code can be ahead of Figma: until the owner
   runs the importer plugin's Update, the Figma variables still hold the values from before
   decision 59 (the theme fill is theme 500 and its foreground white, in both themes), and a sync
   would write them back over `packages/tokens/src`. When Figma is the stale side, the fix is the
   plugin's Update, not a sync. Only when Figma is ahead, re-sync from it and read the diff:

   ```bash
   # Reads FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY from the environment.
   # Overwrites tokens-light.json and tokens-dark.json from the live Figma variables.
   pnpm tokens:sync
   ```

   In CI the sync is `.github/workflows/figma-tokens.yml`, a manual workflow that runs only when
   the repository variable `FIGMA_VARIABLES_API_ENABLED` is `true`.

2. **Check the Figma token without printing it:** never echo it. Figma reads go through
   `scripts/figma-rest/with-figma-token.sh <command>`, which passes `FIGMA_ACCESS_TOKEN` from the
   main checkout's `.env` to that one command and never prints the value.

3. **Check Figma file version:**
   - Ensure you're syncing from the published library, not a branch

---

### 1.4 Wide Gamut Colors Not Working

Kozmos has no wide-gamut colours: every colour token is an sRGB hex or `rgba()` value, on every
platform, and the token build has no P3 or oklch transform. A colour that looks different on two
devices is two displays showing the same sRGB value, or two different tokens: compare the value
DevTools shows with the token in `packages/tokens/src`.

---

## 2. Build & Bundle Issues

### 2.1 "use client" Directive Missing

**Symptoms:**

```
Error: useState only works in Client Components. Add the "use client" directive.
```

**Solutions:**

1. **Add the directive to your own file.** Kozmos's build writes `"use client";` as the first line
   of `dist/kozmos-react.mjs` and of every module under `dist/esm/` (`banner` in
   `packages/react/vite.config.mts`), so its parts can be imported from a Server Component. The
   error names a file of yours that calls a hook:

   ```tsx
   "use client";

   import { useState } from "react";
   import { Button } from "@kozmos-ds/react";

   export function Counter() {
     const [count, setCount] = useState(0);
     return (
       <Button onClick={() => setCount(count + 1)}>
         Clicked {count} times
       </Button>
     );
   }
   ```

2. **Verify the build output:**

   ```bash
   head -1 packages/react/dist/kozmos-react.mjs
   # Should output: "use client";
   ```

3. **Import, don't require:** the CommonJS bundle (`dist/kozmos-react.umd.cjs`, what `require`
   resolves to) carries the directive inside its wrapper function, not on its first line, where a
   bundler looks for it.

---

### 2.2 Bundle Size Exceeds Budget

**Symptoms:**

```
❌ ERROR: everything costs 88.20 KB, over 88 KB
```

**Solutions:**

1. **Analyze bundle** (what the required `analyze-bundle` check runs):

   ```bash
   pnpm tsx scripts/performance/bundle-analyzer.ts
   # Prints the median export and the five heaviest, Button, everything and the stylesheet
   ```

2. **Find what grew:** each export is bundled alone and held to 8 KB, so one over it imports more
   than it needs; `Button` alone over 2 KB means the ES build no longer tree-shakes.

3. **Keep the JavaScript free of side effects:** `packages/react/package.json` declares
   `"sideEffects": ["**/*.css"]`, and the ES build is one file per module, so an app keeps only the
   modules behind what it imports. A module that does something when imported breaks that.

4. **There are no per-component entry points:** `@kozmos-ds/react` exports `.`, `./style.css` and
   `./reset.css`. The per-module build is what keeps an app's cost to what it uses.

5. **Remove duplicate dependencies:**

   ```bash
   pnpm dedupe
   ```

A budget moves only with the measurement that justifies it, on Olcay's decision (decision 53 set
everything at once to 68 KB; it has been 88 KB since 2026-10-06, decision 56).

---

### 2.3 Dual CJS/ESM Issues

**Symptoms:**

```
Error: require() of ES Module not supported
```

or

```
SyntaxError: Cannot use import statement outside a module
```

**Solutions:**

1. **Check package.json exports:** `packages/react/package.json` sends `import` to
   `dist/kozmos-react.mjs` (types `dist/index.d.mts`) and `require` to `dist/kozmos-react.umd.cjs`
   (types `dist/index.d.cts`).

2. **Verify the Vite output:** `packages/react/vite.config.mts` builds an ES output (one file per
   module under `dist/esm/`) and a UMD CommonJS bundle; `vite-plugin-dts` writes the declarations.

3. **Prefer `import`:** the CommonJS bundle is one file, which a bundler cannot tree-shake.

---

### 2.4 TypeScript Declaration Errors

**Symptoms:**

```
error TS2307: Cannot find module '@kozmos-ds/tokens' or its corresponding type declarations.
```

**Solutions:**

1. **Build the package:** in this repository, workspace packages resolve to each other's `dist`,
   and a fresh worktree has nothing built. This builds React and the packages it needs:

   ```bash
   pnpm --filter "@kozmos-ds/react..." build
   ```

2. **Know where the declarations are:** each manifest names them. `@kozmos-ds/tokens` has
   `dist/js/tokens.d.mts` (`import`) and `dist/js/tokens.d.ts` (`require`); `@kozmos-ds/react` has
   `dist/index.d.mts`, `dist/index.d.cts` and `dist/index.d.ts`.

3. **No `paths` alias is needed:** pnpm links each workspace package into `node_modules`, and no
   `tsconfig` in the repository maps the package names.

4. **Verify declaration files exist:**

   ```bash
   ls packages/tokens/dist/js/*.d.ts packages/react/dist/*.d.ts
   ```

---

## 3. React Component Issues

### 3.1 CSS Variables Not Applied

**Symptoms:**

- A component draws without its colours: in DevTools, its `--primitives-…` variables have no value
- Components have no styling

**Solutions:**

1. **Import the stylesheet once, and render inside a `ThemeProvider`:**

   ```tsx
   import "@kozmos-ds/react/style.css";
   import { Button, ThemeProvider } from "@kozmos-ds/react";

   export function App() {
     return (
       <ThemeProvider defaultTheme="system">
         <Button>Styled</Button>
       </ThemeProvider>
     );
   }
   ```

2. **The variables live on the provider:** `@kozmos-ds/react/style.css` holds the components'
   styles and the token variables for both themes, defined on the `ThemeProvider`'s element
   (`[data-kozmos-root]`) and on its portal container, not on `:root`. A part rendered outside
   every provider has no values. There is no `kozmos-root` class to add.

3. **A part in a portal of your own** (rendered with `createPortal` into `document.body`) is
   outside the provider's element too: render it inside a `ThemeProvider` of its own, given
   `theme={useTheme().resolvedTheme}`. A nested provider inherits the outer one's `tokens` and
   `dir`, but not its theme. Kozmos's own overlays (Dialog, Drawer, Popover, Menu, Select,
   Tooltip) already portal into the provider's container.

---

### 3.2 Hydration Mismatch

**Symptoms:**

- A user whose system is dark sees the light theme for a moment after the page loads

**What happens:** `ThemeProvider` renders its `defaultSystemTheme` (`"light"` unless you set it)
on the server and in the first render in the browser, so hydration matches. After it mounts, it
reads the stored preference (`storageKey`) and the system's theme, and switches.

**Solutions:**

1. **Pass the theme you know on the server** as `theme`, from a cookie of your own, and keep it
   there when it changes:

   ```tsx
   import type { ReactNode } from "react";
   import { ThemeProvider, type Theme } from "@kozmos-ds/react";

   export function AppTheme({
     saved,
     children,
   }: {
     saved: Theme;
     children: ReactNode;
   }) {
     return (
       <ThemeProvider
         theme={saved}
         onThemeChange={(next) => {
           document.cookie = `theme=${next}; path=/; max-age=31536000`;
         }}
       >
         {children}
       </ThemeProvider>
     );
   }
   ```

   With `theme` set, the caller owns the preference: `setTheme` calls `onThemeChange` and stores
   nothing itself.

2. **Or render a different first frame:** `defaultSystemTheme="dark"` where most of your users'
   systems are dark.

---

### 3.3 Ref Forwarding Not Working

**Symptoms:**

- `ref` prop doesn't give access to DOM element
- Third-party library can't attach to component

**Solutions:**

Kozmos's parts forward their ref to the element they render: `Button`'s reaches the native
`<button>`. A wrapper of your own drops it unless it forwards it too:

```tsx
import * as React from "react";
import { Button, type ButtonProps } from "@kozmos-ds/react";

export const SaveButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} variant="default" {...props} />,
);
SaveButton.displayName = "SaveButton";
```

---

### 3.4 Context Not Found

**Symptoms:**

```
Error: `TabsTrigger` must be used within `Tabs`
```

or `useTheme must be used within a ThemeProvider`.

**Solutions:**

1. **Put the part inside its root.** Kozmos's compound parts are separate exports (`TabsTrigger`),
   not properties of the root (`Tabs.Trigger`), and each needs its root above it:

   ```tsx
   import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kozmos-ds/react";

   export function Settings() {
     return (
       <Tabs defaultValue="general">
         <TabsList>
           <TabsTrigger value="general">General</TabsTrigger>
           <TabsTrigger value="privacy">Privacy</TabsTrigger>
         </TabsList>
         <TabsContent value="general">General settings</TabsContent>
         <TabsContent value="privacy">Privacy settings</TabsContent>
       </Tabs>
     );
   }
   ```

2. **`useTheme` needs a `ThemeProvider` above it,** in a test as in the app.

---

## 4. iOS/SwiftUI Issues

### 4.1 Colors Wrong in Light or Dark Mode

**Symptoms:**

- A colour shows the other theme's value
- A view stays light while the device is dark, or the reverse

**Solutions:**

Kozmos has no asset catalog. `KozmosColors` (`packages/ios/Sources/KozmosColors.swift`, generated
from the tokens) builds each colour in code from its light and dark values, and SwiftUI picks one
for the colour scheme the view draws in.

1. **Use the token, not a literal:** `KozmosColors.primitivesColorsForeground0`, and sizes from
   `KozmosDimensions`.

2. **Know what `KozmosThemeProvider` sets:** it applies `.preferredColorScheme` from the
   `selectedTheme` it keeps in `@AppStorage` (`"light"`, `"dark"` or `"system"`). That preference
   applies to the whole presentation it is in, such as the window or a sheet, not only to the
   provider's content. For one view in another scheme, set the environment instead:

   ```swift
   import SwiftUI
   import Kozmos

   struct NightBadge: View {
       var body: some View {
           Text("Night")
               .foregroundStyle(KozmosColors.primitivesColorsForeground0)
               .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
               .environment(\.colorScheme, .dark)
       }
   }
   ```

3. **After a token change,** run `pnpm tokens:build` and `pnpm tokens:native:copy`;
   `pnpm tokens:copies:check` fails while the package's copy differs from the build.

---

### 4.2 Preview Not Rendering

**Symptoms:**

- Xcode Preview shows "Failed to build"
- Preview canvas is blank

**Solutions:**

1. **Preview from your app:** the package has no previews of its own, and it needs iOS 16,
   macOS 13 or Mac Catalyst 16:

   ```swift
   import SwiftUI
   import Kozmos

   struct SaveButton_Previews: PreviewProvider {
       static var previews: some View {
           KozmosThemeProvider {
               KozmosButton("Save") {}
           }
           .previewLayout(.sizeThatFits)
       }
   }
   ```

2. **Clean build folder:**
   - Xcode → Product → Clean Build Folder (Cmd+Shift+K)

---

### 4.3 Dynamic Type Not Scaling

**Symptoms:**

- Text doesn't resize with accessibility settings
- Font sizes are fixed

**Solutions:**

Kozmos's text uses `KozmosTypography`, the platform's UI font at a Dynamic Type style
(`.system(style)`), so it scales with the reader's text size. Text and sizes of your own should
scale too:

```swift
import SwiftUI
import Kozmos

struct SavedLabel: View {
    @ScaledMetric private var iconSize: CGFloat = 24

    var body: some View {
        HStack {
            Image(systemName: "star")
                .frame(width: iconSize, height: iconSize)
            Text("Saved")
                .font(KozmosTypography.body) // scales; .system(size: 16) would not
        }
    }
}
```

---

## 5. Android/Compose Issues

### 5.1 Theme Not Applied

**Symptoms:**

- Components show the light palette while the device is dark, or the reverse
- A theme switch changes nothing

**Solutions:**

1. **Wrap the content in `KozmosThemeProvider`** (`com.kozmos.components.themeprovider`); there is
   no `KozmosTheme` composable. It provides `LocalKozmosUseDarkTokens` from its
   `KozmosThemeManager`'s mode (`SYSTEM` until set) and a Material 3 theme:

   ```kotlin
   import androidx.compose.material3.Text
   import androidx.compose.runtime.Composable
   import com.kozmos.components.button.KozmosButton
   import com.kozmos.components.themeprovider.KozmosThemeProvider

   @Composable
   fun SaveScreen() {
       KozmosThemeProvider {
           KozmosButton(onClick = {}) { Text("Save") }
       }
   }
   ```

   Inside it, `LocalThemeManager.current.setThemeMode(KozmosThemeMode.DARK)` switches the theme.

2. **Read `KozmosThemeTokens`:** it follows `LocalKozmosUseDarkTokens`, or the system's theme
   without a provider. `KozmosColors` and `KozmosColorsDark` hold one theme each, so a composable
   that reads either stays in that theme; `pnpm tokens:theme:check` holds the components to
   `KozmosThemeTokens`.

---

### 5.2 Compose Preview Fails

**Symptoms:**

```
java.lang.IllegalStateException: No KozmosThemeManager provided
```

**Solutions:**

Something read `LocalThemeManager.current` outside a `KozmosThemeProvider`. Kozmos's own
composables never read it, and render without a provider in the system's theme; the package has no
previews of its own, and its composables are drawn by the Paparazzi tests. Wrap your preview in the
provider:

```kotlin
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.themeprovider.KozmosThemeProvider

@Preview
@Composable
fun SaveButtonPreview() {
    KozmosThemeProvider {
        KozmosButton(onClick = {}) { Text("Save") }
    }
}
```

---

### 5.3 ProGuard/R8 Stripping Classes

**Symptoms:**

- Crash in release build: `ClassNotFoundException`
- Compose components not rendering

**Solutions:**

The library (namespace `com.kozmos`) is not minified, and the rules it passes an app,
`packages/android/consumer-rules.pro`, hold only a comment: an app's R8 treats Kozmos's classes as
it treats its own. If R8 strips one Kozmos needs, keep that class in the app's rules, and report
it, since the rule belongs in `consumer-rules.pro`:

```proguard
# The app's proguard-rules.pro: the package R8 reported
-keep class com.kozmos.components.button.** { *; }
```

---

## 6. React Native Issues

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 7. Vue/Web Components Issues

Vue waits: `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, not a package to install, and there are no Lit Web Components. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 8. Figma Code Connect Issues

### 8.1 "Cannot find Figma file"

**Symptoms:**

- A Code Connect publish cannot find the Figma file or the component

**Solutions:**

1. **Name the component by its full URL:** each `figma.connect` call takes the Figma component's
   URL, with the file key and the node id. Button's, in
   `packages/react/src/components/Button/Button.figma.tsx`, is
   `https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1055`; a file key alone names no
   component.

2. **Parse first:** `pnpm figma:parse:linked` checks the files locally and needs no token.

3. **Publishing needs the token:** a publish, dry or real, reads `FIGMA_ACCESS_TOKEN` from `.env`,
   and the token must be allowed to write Code Connect to the Kozmos file.

---

### 8.2 Props Not Mapping Correctly

**Symptoms:**

- Code snippet shows wrong prop values
- Enum values not matching

**Solutions:**

1. **Match Figma's property names and values exactly** (case-sensitive), mapping each Figma value
   to the prop's value, as `Button.figma.tsx` does:

   ```tsx
   // kozmos-skills: template — the props object inside figma.connect in Button.figma.tsx
   props: {
     variant: figma.enum("Variant", {
       Default: "default",
       Secondary: "secondary",
       Destructive: "destructive",
       Outline: "outline",
       Ghost: "ghost",
       Link: "link",
       Glass: "glass",
     }),
     disabled: figma.enum("State", { Default: false, Disabled: true, Loading: false }),
     isLoading: figma.enum("State", { Default: false, Disabled: false, Loading: true }),
   },
   ```

2. **One Figma property can drive two props:** Button's `State` sets both `disabled` and
   `isLoading`, as above.

---

### 8.3 Code Connect Publish Fails

**Symptoms:**

```
Error: Failed to publish Code Connect
```

**Solutions:**

1. **Validate before publishing:**

   ```bash
   pnpm figma:parse:linked
   pnpm figma:publish:linked:dry
   ```

2. **Check the linked config:** what is published is named by `figma.linked.config.json` (React),
   `packages/ios/figma.linked.config.json` and `packages/android/figma.linked.config.json`.

3. **CI never publishes:** it parses on all three platforms and, when `FIGMA_ACCESS_TOKEN` is set,
   runs the dry runs only. A publish is run by hand
   ([publishing-guide.md](./publishing-guide.md)).

---

## 9. Storybook Issues

### 9.1 Stories Not Loading

**Symptoms:**

- Storybook sidebar is empty
- "No stories found" message
- A story shows an error after a package was rebuilt

**Solutions:**

1. **Check the story's location:** `apps/docs/.storybook/main.ts` reads
   `packages/react/src/**/*.stories.@(js|jsx|mjs|ts|tsx)` and `packages/react/src/**/*.mdx`, and
   `apps/docs`'s own `src/` and `stories/`.

2. **Verify the story's exports:** a default export, the meta, and one named export per story:

   ```tsx
   import type { Meta, StoryObj } from "@storybook/react";
   import { Button } from "@kozmos-ds/react";

   const meta = {
     title: "Components/Button",
     component: Button,
   } satisfies Meta<typeof Button>;
   export default meta;

   type Story = StoryObj<typeof meta>;

   export const Default: Story = { args: { children: "Button" } };
   ```

3. **Read the error where Storybook runs:** Vite strips a story's types without checking them, and
   `packages/react`'s `typecheck` leaves the stories out (its `tsconfig.json`), so a story's
   mistakes surface in the browser console and in the terminal running Storybook.

4. **`does not provide an export named …` after a rebuild:** Storybook pre-bundles workspace
   packages into `apps/docs/node_modules/.cache/storybook/`, and a rebuilt `dist` does not refresh
   that copy. Stop Storybook, move the folder aside, and start it again.

---

### 9.2 Controls Not Working

**Symptoms:**

- Args panel shows no controls
- Controls don't update component

**Solutions:**

1. **Set `component` in the meta:** Storybook reads a component's props from its TypeScript types
   (`react-docgen-typescript`, set in `apps/docs/.storybook/main.ts`), so a union prop gets a
   select control with its values, and needs no `argTypes`.

2. **Name only real values in `argTypes`:**

   ```tsx
   import type { Meta } from "@storybook/react";
   import { Button } from "@kozmos-ds/react";

   const meta: Meta<typeof Button> = {
     title: "Components/Button",
     component: Button,
     argTypes: {
       variant: {
         control: "select",
         options: ["default", "secondary", "outline", "ghost"],
       },
     },
   };
   export default meta;
   ```

---

### 9.3 Addon Not Appearing

**Symptoms:**

- a11y panel missing
- Design tab not visible

**Solutions:**

1. **Check addon installation:** Storybook's addons belong to `@kozmos-ds/docs`, which already
   has `@storybook/addon-a11y`. Another is added there:

   ```bash
   pnpm --filter @kozmos-ds/docs add -D <addon>
   ```

2. **Register in main.ts:** `apps/docs/.storybook/main.ts` registers links, essentials,
   interactions, a11y and `storybook-addon-performance`; there is no designs addon.

3. **Restart Storybook** (Storybook 8's `dev` has no `--no-cache` option):
   ```bash
   pnpm --filter @kozmos-ds/docs storybook
   ```

---

## 10. Testing Issues

### 10.1 axe-core Violations

**Symptoms:**

```
Expected 0 violations but found 2:
- color-contrast: Elements must meet minimum color contrast ratio
- button-name: Buttons must have discernible text
```

**Solutions:**

1. **Color contrast:** `pnpm tokens:contrast:check` holds Kozmos's colour pairs to their contrast
   in light and dark (`packages/tokens/src/contrast-contract.json`, and every button emotion and
   state). A violation on a Kozmos part in its own colours is a Kozmos finding; on colours of your
   own, use a pair of roles the contract holds.

2. **Button name:** an icon-only button is an `IconButton` with a label:

   ```tsx
   import { IconButton } from "@kozmos-ds/react";
   import { XClose } from "@kozmos-ds/icons";

   export function CloseButton({ onClose }: { onClose: () => void }) {
     return (
       <IconButton aria-label="Close dialog" onClick={onClose}>
         <XClose aria-hidden="true" />
       </IconButton>
     );
   }
   ```

3. **Disable specific rules in tests (if intentional):**

   ```tsx
   // kozmos-skills: template — inside an async test, where `container` is what render returned
   const results = await axe(container, {
     rules: {
       "color-contrast": { enabled: false },
     },
   });
   ```

---

### 10.2 Testing Library Queries Fail

**Symptoms:**

```
Unable to find an element with the role "button"
```

**Solutions:**

1. **Query by role and name,** as a user finds it:

   ```tsx
   import "@testing-library/jest-dom/vitest";
   import { render, screen, waitFor } from "@testing-library/react";
   import { expect, it } from "vitest";
   import { Button } from "@kozmos-ds/react";

   it("finds the button by its role and name", async () => {
     render(<Button>Save</Button>);
     await waitFor(() => {
       expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
     });
   });
   ```

2. **Portalled parts are in `document.body`:** a Dialog's, Popover's, Menu's or Tooltip's content
   renders into the `ThemeProvider`'s portal container, outside the render's `container`;
   `screen` queries find it, since they search the whole body.

3. **Open it first:** content that appears on a pointer or key event is absent until the event;
   fire it, or render the part open (`<Tooltip open>`), as `Tooltip.test.tsx` does.

---

### 10.3 Visual Regression Flaky

**Symptoms:**

- Same code produces different screenshots
- Tests pass locally but fail in CI

**Solutions:**

A difference is an answer, not bad luck: the suite runs with no retries on purpose.

1. **Don't raise the threshold.** `threshold: 0.02` in `playwright.visual.config.ts` is calibrated:
   the default 0.2 passed a whole token step (a delta of 351) as unchanged, while anti-aliasing
   noise is a delta under 1. Loosen it only after re-running a control that proves a token step
   still fails.
2. **Draw where CI draws.** Run `pnpm test:visual` (the Playwright image in Docker), never on a bare
   Mac: its fonts and rendering differ. The browser version is pinned by the image tag.
3. **Make the story deterministic.** The suite already fixes the clock, seeds `Math.random`,
   prefers reduced motion and refuses outside requests; a story that still moves between runs has
   its own timer, random or network dependency to remove. A story that genuinely cannot hold still
   takes `tags: ["no-visual"]`.
4. **Masked areas** (map canvases, Pointr taxonomy symbols) are deliberate; see
   `docs/visual-review.md`, "When it fails for no reason".

---

## 11. CI/CD Issues

### 11.1 GitHub Actions Fails on macOS

**Symptoms:**

```
Error: The operation was canceled.
```

**Solutions:**

1. **Check for a newer push:** CI cancels its run in progress when the same branch is pushed again
   (`cancel-in-progress`), and each cancelled job says exactly this. The newer run is the one that
   counts.
2. **Know what `iOS Build` runs:** the only macOS job (`macos-latest`) builds and tests
   `packages/ios` with SwiftPM (`swift build`, `swift test`), then runs the whole test target on
   the pinned simulator (`node scripts/check-ios-poi.mjs`). There is no CocoaPods to cache.
3. **A deliberate skip passes:** on a pull request that touches no iOS input, the `Changes` job
   skips `iOS Build`, and the skipped check counts as passing. When it cannot work out which paths
   changed (a base git cannot diff against), `iOS Build` runs instead, with a warning saying why;
   `scripts/ci/ios-changes.sh` holds the list and the three outcomes.

---

### 11.2 npm Publish Fails

**Symptoms:**

```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@kozmos-ds/react
```

**Solutions:**

Only `release.yml`'s publish job publishes, with the `NPM_TOKEN` of the `npm-release`
environment; there is no other token to check. Do not re-run it blindly: in the first release, a
re-run asked npm to publish over a version it already had, and npm answered 403. A release that
failed part-way is recovered by [docs/release-process.md](../docs/release-process.md), "Failure and
recovery". See what npm holds:

```bash
npm view @kozmos-ds/react versions
```

---

### 11.3 Turbo Cache Not Working

**Symptoms:**

- Builds not faster with caching
- "FULL TURBO" not appearing

**Solutions:**

1. **Check turbo.json:** the root `turbo.json` lists each task's `inputs`, `outputs` and
   `dependsOn` under `tasks`, and `.env` and `tsconfig.base.json` are global dependencies: a
   change to either invalidates every task.
2. **Remote caching is not set up:** no workflow sets `TURBO_TOKEN` or `TURBO_TEAM`, and each CI
   run starts with an empty cache.
3. **Ignore the local cache for one run:**
   ```bash
   pnpm build --force
   ```

---

## 12. Cross-Platform Parity Issues

### 12.1 Component Looks Different Across Platforms

**Symptoms:**

- Button has different padding on iOS vs Android
- Colors don't match web

**Solutions:**

1. **Use the same token on each platform:**

   ```swift
   // iOS: points
   .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing400)
   ```

   ```kotlin
   // Android: already dp
   Modifier.padding(horizontal = KozmosDimensions.primitivesLayoutSpacing400)
   ```

   ```css
   /* Web: the spacing tokens are unitless numbers, shared with the native platforms */
   .app-panel {
     padding-inline: calc(var(--primitives-layout-spacing-400) * 1px);
   }
   ```

2. **Run the parity checks:** `pnpm tokens:theme:check`, `tokens:radius:check`,
   `tokens:border:check`, `tokens:typography:check`, `tokens:elevation:check`,
   `tokens:glass:check` and `tokens:motion:check` compare the platforms' tokens, and
   `pnpm components:variant:check` the variants each platform declares.

---

### 12.2 Animation Timing Differs

**Symptoms:**

- Animations feel different per platform
- Duration seems wrong

**Solutions:**

The motion tokens are three durations (quick 150 ms, standard 280 ms, deliberate 460 ms) and two
curves (standard `cubic-bezier(0.4, 0, 0.2, 1)` and emphasised), and each platform counts time its
own way:

```css
/* Web */
.app-drawer {
  transition: transform var(--semantics-motion-duration-standard)
    var(--semantics-motion-easing-standard);
}
```

```swift
// iOS: seconds; KozmosMotion.standard is the standard curve over 0.28 s
.animation(KozmosMotion.standard, value: isOpen)
```

```kotlin
// Android: milliseconds
tween(
    durationMillis = KozmosMotion.semanticsMotionDurationStandard,
    easing = KozmosMotion.semanticsMotionEasingStandard,
)
```

`pnpm tokens:motion:check` holds every platform's numbers to the token files.

---

## 13. Performance Issues

### 13.1 Slow Initial Render

**Symptoms:**

- First paint is slow
- Component flashes unstyled

**Solutions:**

1. **Load the stylesheet with the page:** Kozmos's CSS is one file, `@kozmos-ds/react/style.css`,
   held to 30.5 KB gzipped. Import it from your entry, so your bundler links it in the document's
   head rather than after the first render.

2. **Lazy-load a screen of your own, not a Kozmos part:** `@kozmos-ds/react` has no per-component
   entry points, and its per-module build already keeps only what you import. Make the `lazy` once,
   at module scope: one made during a render is remade on every retry and never settles.

   ```tsx
   // kozmos-skills: template — `./MapScreen` is a module of the app's own
   import { lazy, Suspense } from "react";

   const MapScreen = lazy(() => import("./MapScreen"));

   export function App() {
     return (
       <Suspense fallback={null}>
         <MapScreen />
       </Suspense>
     );
   }
   ```

---

### 13.2 Re-renders on Every Frame

**Symptoms:**

- React DevTools shows constant updates
- Animations are janky

**Solutions:**

1. **Memoize an expensive part of your own, and the handlers it takes:**

   ```tsx
   import { memo, useCallback, useState } from "react";
   import { Button } from "@kozmos-ds/react";

   const Results = memo(function Results({
     onSelect,
   }: {
     onSelect: (id: string) => void;
   }) {
     return <Button onClick={() => onSelect("first")}>First result</Button>;
   });

   export function Search() {
     const [selected, setSelected] = useState<string | null>(null);
     const onSelect = useCallback((id: string) => setSelected(id), []);
     return (
       <>
         <p>{selected ?? "Nothing selected"}</p>
         <Results onSelect={onSelect} />
       </>
     );
   }
   ```

2. **Animate with CSS and the motion tokens,** on your own elements; Kozmos's class names are not
   its API:

   ```css
   .app-card:hover {
     transform: scale(1.02);
     transition: transform var(--semantics-motion-duration-quick)
       var(--semantics-motion-easing-standard);
   }
   ```

---

## 14. Accessibility Issues

### 14.1 Focus Not Visible

**Symptoms:**

- No focus ring on keyboard navigation
- Users can't see where focus is

**Solutions:**

1. **Kozmos's controls draw their own ring** on `:focus-visible`. Button's is 2 px of the `ring`
   role, `--primitives-colors-theme-600`, offset by 2 px and drawn as a box shadow, so a rule of
   yours that sets `box-shadow` on it replaces the ring.

2. **Give your own controls the same ring:**

   ```css
   .app-link:focus-visible {
     outline: 2px solid var(--primitives-colors-theme-600);
     outline-offset: 2px;
   }
   ```

3. **Don't remove outlines globally:**

   ```css
   /* Never do this */
   *:focus {
     outline: none;
   }

   /* Use focus-visible instead */
   *:focus:not(:focus-visible) {
     outline: none;
   }
   ```

---

### 14.2 Screen Reader Not Announcing

**Symptoms:**

- VoiceOver/TalkBack skips component
- Announcements are incorrect

**Solutions:**

1. **Label an icon-only control:** `IconButton` takes `aria-label` (§10.1).

2. **Use semantic elements, and live regions for updates:**

   ```tsx
   // kozmos-skills: template — fragments of a render; `save` and `message` are the app's
   <button onClick={save}>Submit</button>         // not <div onClick={save}>
   <div role="status" aria-live="polite">
     {message}
   </div>
   ```

   `MapStatusPill` is such a region already: a polite `status` that says the product's words.

---

### 14.3 Motion Causes Discomfort

**Symptoms:**

- Users report dizziness
- Motion is too aggressive

**Solutions:**

1. **Respect prefers-reduced-motion:**

   ```css
   @media (prefers-reduced-motion: reduce) {
     *,
     *::before,
     *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. **Check platform settings:**
   ```swift
   // iOS
   @Environment(\.accessibilityReduceMotion) var reduceMotion
   ```
   ```kotlin
   // Android
   val scale = Settings.Global.getFloat(
     context.contentResolver,
     Settings.Global.ANIMATOR_DURATION_SCALE,
     1f
   )
   ```

---

## Quick Reference: Error Messages

| Error Message                                   | Likely Cause                                      | Solution Reference |
| ----------------------------------------------- | ------------------------------------------------- | ------------------ |
| `Some token references (1) could not be found`  | A reference to a token that does not exist        | Section 1.1        |
| `Add the "use client" directive`                | A hook in a file of your own without it           | Section 2.1        |
| `everything costs … KB, over 88 KB`             | A bundle budget exceeded                          | Section 2.2        |
| `require() of ES Module`                        | CJS/ESM conflict                                  | Section 2.3        |
| `Cannot find module '@kozmos-ds/…'`             | The package is not built                          | Section 2.4        |
| `Hydration mismatch`, or a flash of light theme | The first render uses `defaultSystemTheme`        | Section 3.2        |
| `` `TabsTrigger` must be used within `Tabs` ``  | A part outside its root                           | Section 3.4        |
| `useTheme must be used within a ThemeProvider`  | No provider above the hook                        | Section 3.4        |
| `No KozmosThemeManager provided`                | `LocalThemeManager` read outside the provider     | Section 5.2        |
| `ClassNotFoundException`                        | R8 stripped a class                               | Section 5.3        |
| Code Connect cannot find the file               | A file key without a node id, or the token        | Section 8.1        |
| `No stories found`                              | The story is outside Storybook's globs            | Section 9.1        |
| `does not provide an export named …`            | Storybook's pre-bundled copy of a rebuilt package | Section 9.1        |
| `color-contrast` violation                      | A colour pair the contrast contract does not hold | Section 10.1       |
| `403 Forbidden` from npm                        | Publishing a version npm already has              | Section 11.2       |

---

_Last updated: 2026-09-29_
_Maintainer: Kozmos Design System Team_
