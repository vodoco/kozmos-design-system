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
Error: Cannot resolve reference: {color.blue.500}
```

**Causes & Solutions:**

| Cause                    | Solution                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| Missing token definition | Check that `color.blue.500` exists in `foundations/colors.tokens.json` |
| Circular reference       | Token A references B which references A — break the cycle              |
| Typo in reference        | Verify exact path: `{color.blue.500}` not `{colors.blue.500}`          |
| Wrong file extension     | Use `.tokens.json` not `.json` for DTCG files                          |

**Debug Command:**

```bash
# Build the tokens: Style Dictionary already logs verbosely and names the unresolved reference.
# There is no token validation script.
pnpm --filter @kozmos-ds/tokens build
```

---

### 1.2 Token Values Not Updating in Components

**Symptoms:**

- Changed token value in source file
- Component still shows old value

**Solutions:**

1. **Rebuild tokens:**

   ```bash
   pnpm --filter @kozmos-ds/tokens build
   ```

2. **Rebuild without Turborepo's cache** (Turborepo has no `clean` command):

   ```bash
   pnpm build --force
   ```

3. **Check CSS import order:**

   ```tsx
   // Correct - tokens first
   import "@kozmos-ds/tokens/tokens.css";
   import { Button } from "@kozmos-ds/react";

   // Wrong - tokens after component
   import { Button } from "@kozmos-ds/react";
   import "@kozmos-ds/tokens/tokens.css";
   ```

4. **Verify CSS variable name:**
   ```css
   /* Check browser DevTools for actual variable name */
   --kozmos-color-blue-500  /* correct */
   --color-blue-500         /* wrong - missing prefix */
   ```

---

### 1.3 Figma Variables Out of Sync

**Symptoms:**

- Token values in code don't match Figma
- Drift detected in CI

**Solutions:**

1. **Re-sync from Figma:**

   ```bash
   # Reads FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY from the environment
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

**Symptoms:**

- P3/oklch colors falling back to sRGB unexpectedly
- Colors look different across devices

**Solutions:**

1. **Check browser support:**

   ```css
   /* Ensure fallback is present */
   .element {
     color: #22c55e; /* sRGB fallback */
     color: oklch(70% 0.25 145); /* Wide gamut */
   }
   ```

2. **Check display capability:**

   ```javascript
   // Check if display supports P3
   if (window.matchMedia("(color-gamut: p3)").matches) {
     console.log("Display supports P3");
   }
   ```

3. **Verify Style Dictionary transform:**
   ```typescript
   // style-dictionary.config.ts
   transforms: ['color/oklch'], // Ensure this transform exists
   ```

---

## 2. Build & Bundle Issues

### 2.1 "use client" Directive Missing

**Symptoms:**

```
Error: useState only works in Client Components. Add the "use client" directive.
```

**Solutions:**

1. **Add directive to component:**

   ```tsx
   // First line of file
   "use client";

   import * as React from "react";
   ```

2. **Check the Vite build:** React builds with Vite, not tsup. `packages/react/vite.config.mts`
   sets `banner: '"use client";'` on both Rollup outputs.

3. **Verify build output:**
   ```bash
   head -1 packages/react/dist/kozmos-react.mjs
   # Should output: "use client";
   ```

---

### 2.2 Bundle Size Exceeds Budget

**Symptoms:**

```
❌ ERROR: everything costs 64.20 KB, over 64 KB
```

**Solutions:**

1. **Analyze bundle** (what the required `analyze-bundle` check runs):

   ```bash
   pnpm tsx scripts/performance/bundle-analyzer.ts
   # Prints the median export and the five heaviest, Button, everything and the stylesheet
   ```

2. **Check for unnecessary dependencies:**

   ```bash
   npx depcheck packages/react
   ```

3. **Verify tree-shaking:**

   ```typescript
   // package.json
   {
     "sideEffects": ["*.css"], // Only CSS has side effects
   }
   ```

4. **Split large components:**

   ```tsx
   // Instead of one large component
   import { DataTable } from "@kozmos-ds/react";

   // Use code splitting
   const DataTable = lazy(() => import("@kozmos-ds/react/DataTable"));
   ```

5. **Remove duplicate dependencies:**
   ```bash
   pnpm dedupe
   ```

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

3. **Check consumer's bundler config:**
   ```javascript
   // webpack.config.js
   resolve: {
     conditionNames: ['import', 'require'],
   }
   ```

---

### 2.4 TypeScript Declaration Errors

**Symptoms:**

```
error TS2307: Cannot find module '@kozmos-ds/tokens' or its corresponding type declarations.
```

**Solutions:**

1. **Check types field in package.json:**

   ```json
   {
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts"
       }
     }
   }
   ```

2. **Rebuild declarations:**

   ```bash
   pnpm --filter @kozmos-ds/tokens build
   ```

3. **Check tsconfig paths:**

   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@kozmos/*": ["./packages/*/src"]
       }
     }
   }
   ```

4. **Verify declaration files exist:**
   ```bash
   ls packages/tokens/dist/*.d.ts
   ```

---

## 3. React Component Issues

### 3.1 CSS Variables Not Applied

**Symptoms:**

- Styles show as `var(--kozmos-color-*)` in DevTools
- Components have no styling

**Solutions:**

1. **Import tokens CSS:**

   ```tsx
   // App.tsx or layout.tsx
   import "@kozmos-ds/tokens/tokens.css";
   ```

2. **Check for CSS isolation:**

   ```tsx
   // Wrap in kozmos-root if needed
   <div className="kozmos-root">
     <Button>Styled</Button>
   </div>
   ```

3. **Check for conflicting CSS resets:**

   ```css
   /* Some resets override custom properties */
   :root {
     all: initial; /* This breaks CSS variables! */
   }
   ```

4. **Verify ThemeProvider:**
   ```tsx
   <ThemeProvider>
     <App /> {/* Components must be inside provider */}
   </ThemeProvider>
   ```

---

### 3.2 Hydration Mismatch

**Symptoms:**

```
Warning: Text content did not match. Server: "light" Client: "dark"
```

**Solutions:**

1. **Defer theme detection:**

   ```tsx
   // Use useEffect for client-only theme detection
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   if (!mounted) return <div>Loading...</div>;
   ```

2. **Use CSS media query for initial theme:**

   ```css
   :root {
     color-scheme: light dark;
   }
   @media (prefers-color-scheme: dark) {
     :root {
       /* dark tokens */
     }
   }
   ```

3. **Suppress hydration warning for known cases:**
   ```tsx
   <html suppressHydrationWarning>
   ```

---

### 3.3 Ref Forwarding Not Working

**Symptoms:**

- `ref` prop doesn't give access to DOM element
- Third-party library can't attach to component

**Solutions:**

1. **Use forwardRef:**

   ```tsx
   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     (props, ref) => <button ref={ref} {...props} />,
   );
   ```

2. **Check component wrapping:**

   ```tsx
   // Wrong - ref is lost
   const WrappedButton = (props) => <Button {...props} />;

   // Correct - forward the ref
   const WrappedButton = React.forwardRef((props, ref) => (
     <Button ref={ref} {...props} />
   ));
   ```

---

### 3.4 Context Not Found

**Symptoms:**

```
Error: useTabsContext must be used within <Tabs>
```

**Solutions:**

1. **Wrap with provider:**

   ```tsx
   <Tabs>
     <Tabs.Trigger /> {/* Must be inside Tabs */}
   </Tabs>
   ```

2. **Check provider hierarchy:**

   ```tsx
   // Providers must be properly nested
   <ThemeProvider>
     <Tabs>
       <Tabs.Content /> {/* Correct */}
     </Tabs>
   </ThemeProvider>
   ```

3. **Provide default context for testing:**
   ```tsx
   // In tests
   render(
     <Tabs defaultValue="tab1">
       <ComponentUnderTest />
     </Tabs>,
   );
   ```

---

## 4. iOS/SwiftUI Issues

### 4.1 Colors Not Loading from Asset Catalog

**Symptoms:**

- Colors appear as clear/transparent
- Console: `Unable to load color named 'color-name'`

**Solutions:**

1. **Check bundle reference:**

   ```swift
   // Use Bundle.module for SPM packages
   Color("interactive-primary", bundle: .module)
   ```

2. **Verify asset catalog exists:**

   ```
   Sources/KozmosUI/Resources/Colors.xcassets/
   └── interactive-primary.colorset/
       └── Contents.json
   ```

3. **Check Package.swift resources:**
   ```swift
   .target(
     name: "KozmosUI",
     resources: [.process("Resources")]
   )
   ```

---

### 4.2 Preview Not Rendering

**Symptoms:**

- Xcode Preview shows "Failed to build"
- Preview canvas is blank

**Solutions:**

1. **Check preview provider:**

   ```swift
   #if DEBUG
   struct Button_Previews: PreviewProvider {
     static var previews: some View {
       KozmosButton("Preview") {}
     }
   }
   #endif
   ```

2. **Clean build folder:**
   - Xcode → Product → Clean Build Folder (Cmd+Shift+K)

3. **Check iOS version:**

   ```swift
   @available(iOS 16.0, *)
   struct KozmosButton: View { ... }
   ```

4. **Add preview-specific environment:**
   ```swift
   static var previews: some View {
     KozmosButton("Test") {}
       .environment(\.colorScheme, .light)
       .previewLayout(.sizeThatFits)
   }
   ```

---

### 4.3 Dynamic Type Not Scaling

**Symptoms:**

- Text doesn't resize with accessibility settings
- Font sizes are fixed

**Solutions:**

1. **Use dynamic type styles:**

   ```swift
   Text("Hello")
     .font(.body) // Scales with Dynamic Type

   // Not:
   Text("Hello")
     .font(.system(size: 16)) // Fixed size
   ```

2. **Use scaled metric:**

   ```swift
   @ScaledMetric var iconSize: CGFloat = 24

   Image(systemName: "star")
     .frame(width: iconSize, height: iconSize)
   ```

---

## 5. Android/Compose Issues

### 5.1 Theme Not Applied

**Symptoms:**

- Components have default Material colors
- Custom tokens not visible

**Solutions:**

1. **Wrap with KozmosTheme:**

   ```kotlin
   KozmosTheme {
     // Components must be inside theme
     KozmosButton("Test") {}
   }
   ```

2. **Check CompositionLocalProvider:**
   ```kotlin
   CompositionLocalProvider(
     LocalKozmosBrandConfig provides brandConfig
   ) {
     Content()
   }
   ```

---

### 5.2 Compose Preview Fails

**Symptoms:**

```
java.lang.IllegalStateException: CompositionLocal not present
```

**Solutions:**

1. **Provide required CompositionLocals:**

   ```kotlin
   @Preview
   @Composable
   fun ButtonPreview() {
     KozmosTheme {
       KozmosButton("Preview") {}
     }
   }
   ```

2. **Use preview-safe defaults:**
   ```kotlin
   @Composable
   fun MyComponent(
     brandConfig: KozmosBrandConfig = KozmosBrandConfig.Default
   ) { ... }
   ```

---

### 5.3 ProGuard/R8 Stripping Classes

**Symptoms:**

- Crash in release build: `ClassNotFoundException`
- Compose components not rendering

**Solutions:**

1. **Add ProGuard rules:**

   ```proguard
   # kozmos-ui/proguard-rules.pro
   -keep class com.pointr.kozmos.** { *; }
   -keepclassmembers class * {
       @androidx.compose.runtime.Composable <methods>;
   }
   ```

2. **Check consumer ProGuard rules:**
   ```proguard
   # consumer-rules.pro (automatically included)
   -keep class com.pointr.kozmos.tokens.** { *; }
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

```
Error: Could not find Figma file with key XXXXX
```

**Solutions:**

1. **Check URL format:**

   ```typescript
   // Correct - full URL with node-id
   const FIGMA_URL = "https://www.figma.com/design/XXXXX/Name?node-id=123:456";

   // Wrong - file key only
   const FIGMA_URL = "XXXXX";
   ```

2. **Verify API token permissions:**
   - Token needs "Read-only" access to the file

3. **Check file access:**
   - You must have viewer access to the Figma file

---

### 8.2 Props Not Mapping Correctly

**Symptoms:**

- Code snippet shows wrong prop values
- Enum values not matching

**Solutions:**

1. **Check Figma property names:**

   ```typescript
   // Figma property must match exactly (case-sensitive)
   variant: figma.enum('Variant', { ... }) // "Variant" in Figma
   ```

2. **Verify enum mappings:**

   ```typescript
   variant: figma.enum('Variant', {
     'Primary': 'primary',    // Figma value : Code value
     'Secondary': 'secondary',
   }),
   ```

3. **Check boolean property values:**
   ```typescript
   // Figma uses various truthy values
   disabled: figma.boolean('Disabled'), // Handles "Yes", "True", "On"
   ```

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

**Solutions:**

1. **Check story file pattern:**

   ```typescript
   // .storybook/main.ts
   stories: ['../src/**/*.stories.@(ts|tsx)'],
   ```

2. **Verify story export:**

   ```tsx
   // Correct
   export default {
     title: "Components/Button",
     component: Button,
   } satisfies Meta<typeof Button>;

   export const Default: Story = {};

   // Wrong - no default export
   export const Default: Story = {};
   ```

3. **Check for syntax errors:**
   ```bash
   pnpm tsc --noEmit
   ```

---

### 9.2 Controls Not Working

**Symptoms:**

- Args panel shows no controls
- Controls don't update component

**Solutions:**

1. **Define argTypes:**

   ```tsx
   const meta: Meta<typeof Button> = {
     argTypes: {
       variant: {
         control: "select",
         options: ["primary", "secondary"],
       },
     },
   };
   ```

2. **Check component props export:**
   ```tsx
   // Props interface must be exported
   export interface ButtonProps { ... }
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

1. **Color contrast:**

   ```tsx
   // Check token values meet 4.5:1 ratio
   // Use https://webaim.org/resources/contrastchecker/
   ```

2. **Button name:**

   ```tsx
   // Add accessible name
   <Button aria-label="Close dialog">
     <Icon name="close" />
   </Button>
   ```

3. **Disable specific rules in tests (if intentional):**
   ```tsx
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

1. **Use correct role:**

   ```tsx
   // For <button>
   screen.getByRole("button");

   // For <a>
   screen.getByRole("link");

   // For custom components
   screen.getByTestId("custom-component");
   ```

2. **Wait for async rendering:**

   ```tsx
   await waitFor(() => {
     expect(screen.getByRole("button")).toBeInTheDocument();
   });
   ```

3. **Check ARIA roles:**
   ```tsx
   <div role="button" tabIndex={0}>
     Clickable div
   </div>
   ```

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
   `packages/ios` with SwiftPM (`swift build`, `swift test`) and renders the POI tests on a
   simulator. There is no CocoaPods to cache.
3. **A deliberate skip passes:** on a pull request that touches no iOS input, the `Changes` job
   skips `iOS Build`, and the skipped check counts as passing.

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

1. **Use shared tokens:**

   ```swift
   // iOS
   .padding(.horizontal, KozmosTokens.space400)
   ```

   ```kotlin
   // Android
   Modifier.padding(horizontal = KozmosTokens.space400.dp)
   ```

   ```tsx
   // React
   padding: "var(--kozmos-space-400)";
   ```

2. **Document intentional differences:**
   ```markdown
   | Platform | Touch target | Reason       |
   | -------- | ------------ | ------------ |
   | Web      | 44x44px      | WCAG minimum |
   | iOS      | 44x44pt      | Apple HIG    |
   | Android  | 48x48dp      | Material 3   |
   ```

---

### 12.2 Animation Timing Differs

**Symptoms:**

- Animations feel different per platform
- Duration seems wrong

**Solutions:**

1. **Use same easing values:**

   ```typescript
   // Ensure all platforms use same curve
   // cubic-bezier(0.4, 0, 0.2, 1)
   ```

2. **Check platform animation systems:**
   ```swift
   // iOS - animation() takes seconds
   .animation(.easeOut(duration: 0.25))
   ```
   ```kotlin
   // Android - tween takes milliseconds
   tween(durationMillis = 250)
   ```

---

## 13. Performance Issues

### 13.1 Slow Initial Render

**Symptoms:**

- First paint takes > 100ms
- Component flashes unstyled

**Solutions:**

1. **Preload critical CSS:**

   ```html
   <link rel="preload" href="/tokens.css" as="style" />
   ```

2. **Inline critical tokens in server-rendered HTML:**
   - Inject critical CSS tokens in the document head during SSR
   - Use a style tag with the critical token values

3. **Lazy load non-critical components:**
   ```tsx
   const DataTable = lazy(() => import("@kozmos-ds/react/DataTable"));
   ```

---

### 13.2 Re-renders on Every Frame

**Symptoms:**

- React DevTools shows constant updates
- Animations are janky

**Solutions:**

1. **Memoize expensive components:**

   ```tsx
   const MemoizedTable = React.memo(DataTable);
   ```

2. **Use useCallback for handlers:**

   ```tsx
   const handleClick = useCallback(() => {
     // Handler logic
   }, [dependencies]);
   ```

3. **Move animations to CSS:**
   ```css
   /* Prefer CSS animations over JS */
   .kozmos-btn:hover {
     transform: scale(1.02);
     transition: transform var(--kozmos-motion-duration-fast);
   }
   ```

---

## 14. Accessibility Issues

### 14.1 Focus Not Visible

**Symptoms:**

- No focus ring on keyboard navigation
- Users can't see where focus is

**Solutions:**

1. **Add focus-visible styles:**

   ```css
   .kozmos-btn:focus-visible {
     outline: 2px solid var(--kozmos-color-interactive-primary);
     outline-offset: 2px;
   }
   ```

2. **Don't remove outlines globally:**

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

1. **Add ARIA labels:**

   ```tsx
   <button aria-label="Close dialog">X</button>
   ```

2. **Use semantic elements:**

   ```tsx
   // Semantic
   <button>Submit</button>

   // Non-semantic (avoid)
   <div onClick={handleClick}>Submit</div>
   ```

3. **Add live regions for updates:**
   ```tsx
   <div role="status" aria-live="polite">
     {message}
   </div>
   ```

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

| Error Message               | Likely Cause               | Solution Reference |
| --------------------------- | -------------------------- | ------------------ |
| `Cannot resolve reference`  | Token not found            | Section 1.1        |
| `use client directive`      | Missing "use client"       | Section 2.1        |
| `bundle size exceeds`       | Large bundle               | Section 2.2        |
| `require() of ES Module`    | CJS/ESM conflict           | Section 2.3        |
| `Hydration mismatch`        | Server/client diff         | Section 3.2        |
| `Unable to load color`      | Missing asset              | Section 4.1        |
| `ClassNotFoundException`    | ProGuard stripping         | Section 5.3        |
| `Unable to resolve module`  | Metro issue                | Section 6.1        |
| `Illegal constructor`       | Custom element not defined | Section 7.1        |
| `Could not find Figma file` | Wrong URL/permissions      | Section 8.1        |
| `No stories found`          | Story pattern issue        | Section 9.1        |
| `color-contrast violation`  | Accessibility              | Section 10.1       |
| `403 Forbidden npm`         | Token/access issue         | Section 11.2       |

---

_Last updated: 2025-02-07_
_Maintainer: Kozmos Design System Team_
