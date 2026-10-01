# Proposal: not built — the planned migration guide

> **Proposal: not built.** This is the migration guide written before the code, for major versions
> that were never released. Every Kozmos package is on 0.x: there is no v1, v2 or v3, no support
> policy across majors, and no `@kozmos-ds/cli` or `@kozmos-ds/codemod` package, in this
> repository or on npm (an `npx` of either would run whatever someone else had published under the
> name). Its examples name APIs that do not exist: Button has no `solid` variant, `ThemeProvider`
> has no `brand` prop, there is no `POIDetailsCard`, SwiftUI's library is `Kozmos` (not
> `KozmosSwiftUI`), and the tokens are not named `--kozmos-*`. It is kept as planning history;
> until 2026-09-29 it was `.ai-skills/migration-guide.md`, which now describes upgrading the
> packages that exist.

## Proposal: Table of Contents

1. [1. Version Migration Overview](#proposal-1-version-migration-overview)
2. [2. Major Version Upgrade Process](#proposal-2-major-version-upgrade-process)
3. [3. Migration from Existing Implementations](#proposal-3-migration-from-existing-implementations)
4. [4. Platform-Specific Migration Guides](#proposal-4-platform-specific-migration-guides)
5. [5. Token Migration](#proposal-5-token-migration)
6. [6. Component API Changes](#proposal-6-component-api-changes)
7. [7. Codemod Reference](#proposal-7-codemod-reference)
8. [8. Rollback Procedures](#proposal-8-rollback-procedures)
9. [9. Migration Checklist Template](#proposal-9-migration-checklist-template)
10. [10. FAQ & Troubleshooting](#proposal-10-faq--troubleshooting)
11. [Version History](#proposal-version-history)

---

## Proposal: 1. Version Migration Overview

### Proposal: Semantic Versioning

Kozmos follows strict semantic versioning:

| Version Change    | What It Means                     | Migration Effort                     |
| ----------------- | --------------------------------- | ------------------------------------ |
| **Patch** (1.0.x) | Bug fixes only, no API changes    | None — drop-in upgrade               |
| **Minor** (1.x.0) | New features, backward compatible | Minimal — review new features        |
| **Major** (x.0.0) | Breaking changes                  | Significant — follow migration guide |

### Proposal: Version Support Policy

| Version        | Status      | Support End         |
| -------------- | ----------- | ------------------- |
| v3.x (current) | Active      | —                   |
| v2.x           | Maintenance | 6 months after v3.0 |
| v1.x           | Deprecated  | 3 months after v3.0 |
| v0.x           | End of Life | Unsupported         |

### Proposal: Recommended Upgrade Path

```
v0.x → v1.x → v2.x → v3.x (no skipping majors)
```

**Why?** Codemods are designed for sequential upgrades. Skipping versions may miss intermediate transformations.

---

## Proposal: 2. Major Version Upgrade Process

### Proposal: Pre-Migration Preparation

#### Step 1: Assess Current Usage

```bash
# Proposal: not built. This does not exist; do not run it.
# Generate usage report for your codebase
npx @kozmos-ds/cli analyze --output usage-report.json

# Key metrics to review:
# - Which components are used
# - Which props are used per component
# - Custom overrides or extensions
# - Token usage vs hardcoded values
```

#### Step 2: Review Breaking Changes

```bash
# Proposal: not built. This does not exist; do not run it.
# View breaking changes between versions
npx @kozmos-ds/cli breaking-changes --from 2.0.0 --to 3.0.0
```

Output format:

```
BREAKING CHANGES: v2.0.0 → v3.0.0

Components:
  - Button: `variant="primary"` → `variant="solid"` (codemod available)
  - Input: `onChange` now receives event, not value (manual update)
  - Modal: Removed `isOpen` in favor of controlled `open` prop

Tokens:
  - color.brand.primary → color.interactive.primary (codemod available)
  - Removed: space.xs (use space.100 instead)

Removed Components:
  - LegacyCard: Use Card instead
  - Dropdown: Use Select instead
```

#### Step 3: Create Upgrade Branch

```bash
# Proposal: not built. This does not exist; do not run it.
git checkout -b upgrade/kozmos-v3
```

### Proposal: Migration Execution

#### Step 4: Update Dependencies

```bash
# Proposal: not built. This does not exist; do not run it.
# Update all Kozmos packages together
pnpm update @kozmos-ds/react@^3.0.0 @kozmos-ds/tokens@^3.0.0 @kozmos-ds/icons@^3.0.0
```

#### Step 5: Run Codemods

```bash
# Proposal: not built. This does not exist; do not run it.
# Run all codemods for the version jump
npx @kozmos-ds/codemod v2-to-v3 --path ./src

# Or run specific codemods
npx @kozmos-ds/codemod button-variant-rename --path ./src
npx @kozmos-ds/codemod token-migration --path ./src
```

#### Step 6: Manual Updates

After codemods, address remaining issues:

```bash
# Proposal: not built. This does not exist; do not run it.
# TypeScript will catch most API changes
pnpm tsc --noEmit

# Run tests to catch behavioral changes
pnpm test
```

#### Step 7: Visual Regression Check

```bash
# Proposal: not built. This does not exist; do not run it.
# Compare every story with its baseline, in light and dark (needs Docker)
pnpm test:visual

# Read each difference in the report; record the intended ones
pnpm test:visual:report
pnpm test:visual:update
```

### Proposal: Post-Migration Verification

#### Step 8: Full Test Suite

```bash
# Proposal: not built. This does not exist; do not run it.
# The application's own tests
pnpm test
```

Run the application's end-to-end and accessibility suites too, under whatever names its own
`package.json` gives them: Kozmos has no `test:e2e` or `test:a11y` script to lend it.

#### Step 9: Bundle Size Check

```bash
# Proposal: not built. This does not exist; do not run it.
# Ensure bundle size hasn't regressed
npx source-map-explorer dist/index.js

# Compare with pre-upgrade baseline
```

#### Step 10: Staged Rollout

1. Deploy to staging environment
2. QA validation (1-2 days)
3. Canary deployment (10% traffic)
4. Full production deployment

---

## Proposal: 3. Migration from Existing Implementations

### Proposal: From Custom Component Library

If your team has custom components that will be replaced by Kozmos:

#### Assessment Phase

1. **Inventory existing components**

   ```bash
   # Proposal: not built. This does not exist; do not run it.
   # List all custom components
   find ./src/components -name "*.tsx" -exec basename {} \; | sort | uniq
   ```

2. **Map to Kozmos equivalents**

   | Your Component | Kozmos Equivalent | Notes                 |
   | -------------- | ----------------- | --------------------- |
   | `CustomButton` | `Button`          | Match variants        |
   | `FormInput`    | `Input`           | Check validation API  |
   | `ModalDialog`  | `Modal`           | Check trigger pattern |

3. **Identify gaps**
   - Components Kozmos doesn't have
   - Props Kozmos doesn't support
   - Custom behaviors to preserve

#### Migration Strategy Options

**Option A: Big Bang (Small projects)**

- Replace all components at once
- Faster but higher risk
- Best for: <50 component instances

**Option B: Incremental (Recommended)**

- Migrate page-by-page or feature-by-feature
- Lower risk, easier to validate
- Best for: >50 component instances

**Option C: Strangler Fig (Large projects)**

- Run both systems in parallel
- Gradually shift new code to Kozmos
- Deprecate old components over time
- Best for: >500 component instances

#### Incremental Migration Pattern

```tsx
// Step 1: Create adapter component
// src/components/Button/index.tsx

import { Button as KozmosButton } from "@kozmos-ds/react";
import type { ButtonProps as KozmosButtonProps } from "@kozmos-ds/react";

// Your existing prop interface
interface LegacyButtonProps {
  type?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// Map old props to Kozmos props
const variantMap: Record<string, KozmosButtonProps["variant"]> = {
  primary: "solid",
  secondary: "outline",
  danger: "destructive",
};

// Adapter maintains old API
export function Button({ type = "primary", ...props }: LegacyButtonProps) {
  console.warn(
    "Button: Legacy props detected. Migrate to Kozmos Button API. " +
      "See: https://kozmos.pointr.design/migration/button",
  );

  return <KozmosButton variant={variantMap[type]} {...props} />;
}

// Step 2: Export both for gradual migration
export { KozmosButton };
```

```tsx
// Step 3: Migrate consumers over time
// Old usage (still works via adapter):
<Button type="primary">Click</Button>

// New usage (direct Kozmos):
<KozmosButton variant="solid">Click</KozmosButton>
```

### Proposal: From Existing SDK Implementations

For Pointr SDK teams migrating to Kozmos:

#### Web SDK Migration

```tsx
// Before (custom implementation)
import { PoiCard } from "@pointr/sdk-web/components";

<PoiCard
  poi={poiData}
  onSelect={handleSelect}
  style={{ background: "#fff" }}
/>;

// After (Kozmos)
import { POIDetailsCard } from "@kozmos-ds/react";
import { useTheme } from "@kozmos-ds/react";

// Theme provides consistent styling
<POIDetailsCard
  poi={poiData}
  onSelect={handleSelect}
  // Theming handled via CSS variables, not inline styles
/>;
```

#### iOS SDK Migration

```swift
// Before (custom implementation)
struct PoiCardView: View {
    let poi: POI
    var body: some View {
        VStack {
            Text(poi.name)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(Color(hex: "#1A1A1A"))
            // ...custom styling
        }
    }
}

// After (Kozmos)
import KozmosSwiftUI

struct PoiCardView: View {
    let poi: POI
    var body: some View {
        KozmosPOIDetailsCard(poi: poi)
            // Theming via KozmosTheme environment
    }
}
```

#### Android SDK Migration

```kotlin
// Before (custom implementation)
@Composable
fun PoiCard(poi: POI) {
    Card(
        modifier = Modifier.padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Text(
            text = poi.name,
            style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold)
        )
    }
}

// After (Kozmos)
import com.kozmos.compose.POIDetailsCard
import com.kozmos.compose.theme.KozmosTheme

@Composable
fun PoiCard(poi: POI) {
    KozmosTheme {
        POIDetailsCard(poi = poi)
        // Theming via CompositionLocal
    }
}
```

---

## Proposal: 4. Platform-Specific Migration Guides

### Proposal: React Migration

#### Package Changes

```diff
  dependencies:
-   "@pointr/sdk-components": "^1.0.0"
+   "@kozmos-ds/react": "^3.0.0"
+   "@kozmos-ds/tokens": "^3.0.0"
```

#### Import Changes

```tsx
// Before
import { Button, Input, Card } from "@pointr/sdk-components";

// After
import { Button, Input, Card } from "@kozmos-ds/react";
```

#### ThemeProvider Setup

```tsx
// Before (if using custom theming)
<CustomThemeProvider theme={myTheme}>
  <App />
</CustomThemeProvider>;

// After
import { ThemeProvider } from "@kozmos-ds/react";

<ThemeProvider
  theme="light"
  brand="pointr" // or customer brand ID
>
  <App />
</ThemeProvider>;
```

#### CSS Variable Migration

```css
/* Before: Custom CSS variables */
:root {
  --primary-color: #2563eb;
  --text-color: #1a1a1a;
  --spacing-md: 16px;
}

/* After: Kozmos tokens (auto-injected by ThemeProvider) */
/* Use Kozmos variable names in your CSS */
.my-custom-element {
  color: var(--kozmos-color-text-primary);
  padding: var(--kozmos-space-400);
}
```

### Proposal: iOS (SwiftUI) Migration

#### Package Changes

```swift
// Package.swift
dependencies: [
-   .package(url: "https://github.com/AcmeCorp/custom-ui", from: "1.0.0"),
+   .package(url: "https://github.com/AcmeCorp/kozmos-ios", from: "3.0.0"),
]
```

#### Import Changes

```swift
// Before
import CustomUI

// After
import KozmosSwiftUI
```

#### Environment Setup

```swift
// Before
struct ContentView: View {
    var body: some View {
        MyApp()
            .environment(\.colorScheme, .light)
    }
}

// After
struct ContentView: View {
    var body: some View {
        MyApp()
            .environment(\.kozmosTheme, .light)
            .environment(\.kozmosBrand, .default)
    }
}
```

### Proposal: Android (Compose) Migration

#### Gradle Changes

```kotlin
// build.gradle.kts
dependencies {
-   implementation("com.acme:custom-ui:1.0.0")
+   implementation("com.kozmos:compose:3.0.0")
}
```

#### Import Changes

```kotlin
// Before
import com.acme.customui.*

// After
import com.kozmos.compose.*
import com.kozmos.compose.theme.KozmosTheme
```

#### Theme Setup

```kotlin
// Before
@Composable
fun App() {
    CustomTheme {
        MainContent()
    }
}

// After
@Composable
fun App() {
    KozmosTheme(
        colorScheme = KozmosColorScheme.Light,
        brand = KozmosBrand.Default
    ) {
        MainContent()
    }
}
```

### Proposal: React Native Migration

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](other-platforms.md).

### Proposal: Vue Migration

Vue waits: `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, not a package to install. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](other-platforms.md).

---

## Proposal: 5. Token Migration

### Proposal: Token Naming Changes

When Kozmos tokens are renamed between versions:

| v2.x Token              | v3.x Token                    | Codemod |
| ----------------------- | ----------------------------- | ------- |
| `color.brand.primary`   | `color.interactive.primary`   | ✅      |
| `color.brand.secondary` | `color.interactive.secondary` | ✅      |
| `space.xs`              | `space.100`                   | ✅      |
| `space.sm`              | `space.200`                   | ✅      |
| `space.md`              | `space.400`                   | ✅      |
| `space.lg`              | `space.600`                   | ✅      |
| `space.xl`              | `space.800`                   | ✅      |
| `radius.sm`             | `radius.100`                  | ✅      |
| `radius.md`             | `radius.200`                  | ✅      |
| `radius.lg`             | `radius.300`                  | ✅      |
| `shadow.sm`             | `shadow.100`                  | ✅      |
| `shadow.md`             | `shadow.200`                  | ✅      |

### Proposal: CSS Variable Migration

```bash
# Proposal: not built. This does not exist; do not run it.
# Run token migration codemod
npx @kozmos-ds/codemod token-v2-to-v3 --path ./src

# What it transforms:
# var(--kozmos-color-brand-primary) → var(--kozmos-color-interactive-primary)
# var(--kozmos-space-xs) → var(--kozmos-space-100)
```

### Proposal: JavaScript/TypeScript Token Migration

```bash
# Proposal: not built. This does not exist; do not run it.
# For JS token imports
npx @kozmos-ds/codemod token-imports-v2-to-v3 --path ./src

# What it transforms:
# tokens.color.brand.primary → tokens.color.interactive.primary
# tokens.space.xs → tokens.space[100]
```

### Proposal: Native Platform Token Migration

#### iOS

```bash
# Proposal: not built. This does not exist; do not run it.
# Swift token migration (updates KozmosTokens.* references)
npx @kozmos-ds/codemod ios-tokens-v2-to-v3 --path ./ios
```

#### Android

```bash
# Proposal: not built. This does not exist; do not run it.
# Kotlin token migration (updates KozmosTokens.* references)
npx @kozmos-ds/codemod android-tokens-v2-to-v3 --path ./android
```

---

## Proposal: 6. Component API Changes

### Proposal: Documenting API Changes

Template for documenting component API changes:

```markdown
## Component: Button

### v2.x → v3.x Changes

#### Props Renamed

| v2.x                | v3.x              | Notes                         |
| ------------------- | ----------------- | ----------------------------- |
| `variant="primary"` | `variant="solid"` | Aligns with industry standard |
| `size="small"`      | `size="sm"`       | Consistent abbreviations      |
| `isLoading`         | `loading`         | Remove `is` prefix            |
| `isDisabled`        | `disabled`        | Use native HTML naming        |

#### Props Removed

| Prop        | Replacement                      | Migration              |
| ----------- | -------------------------------- | ---------------------- |
| `leftIcon`  | `<Button.Icon position="start">` | Use compound component |
| `rightIcon` | `<Button.Icon position="end">`   | Use compound component |

#### Props Added

| Prop      | Type    | Default | Description             |
| --------- | ------- | ------- | ----------------------- |
| `asChild` | boolean | false   | Render as child element |

#### Behavioral Changes

- Loading state now shows spinner inline instead of replacing text
- Disabled state now uses `aria-disabled` instead of `disabled` attribute

#### Codemod Coverage

- ✅ Prop renames (automatic)
- ⚠️ Icon migration (semi-automatic, review needed)
- ❌ Behavioral changes (manual testing required)
```

### Proposal: Common Migration Patterns

#### Pattern: Prop Rename

```tsx
// v2.x
<Button isLoading={true} isDisabled={false}>Submit</Button>

// v3.x (after codemod)
<Button loading={true} disabled={false}>Submit</Button>
```

#### Pattern: Compound Component Migration

```tsx
// v2.x
<Button leftIcon={<SearchIcon />} rightIcon={<ChevronIcon />}>
  Search
</Button>

// v3.x
<Button>
  <Button.Icon position="start"><SearchIcon /></Button.Icon>
  Search
  <Button.Icon position="end"><ChevronIcon /></Button.Icon>
</Button>
```

#### Pattern: Controlled vs Uncontrolled

```tsx
// v2.x (mixed pattern)
<Modal isOpen={open} onClose={handleClose} defaultOpen={true}>

// v3.x (clear controlled/uncontrolled)
// Controlled:
<Modal open={open} onOpenChange={setOpen}>

// Uncontrolled:
<Modal defaultOpen={true}>
```

---

## Proposal: 7. Codemod Reference

### Proposal: Available Codemods

| Codemod                    | Description                   | Risk   |
| -------------------------- | ----------------------------- | ------ |
| `v2-to-v3`                 | All v2→v3 transformations     | Medium |
| `button-variant-rename`    | Button variant prop updates   | Low    |
| `boolean-prop-rename`      | `is*` → `*` prop renames      | Low    |
| `token-migration`          | CSS variable renames          | Low    |
| `compound-component-icons` | Icon prop to compound pattern | Medium |
| `modal-controlled`         | Modal API migration           | Medium |
| `import-paths`             | Package import updates        | Low    |

### Proposal: Running Codemods

```bash
# Proposal: not built. This does not exist; do not run it.
# Dry run (preview changes)
npx @kozmos-ds/codemod v2-to-v3 --path ./src --dry

# Apply changes
npx @kozmos-ds/codemod v2-to-v3 --path ./src

# Apply with git commit per transform
npx @kozmos-ds/codemod v2-to-v3 --path ./src --git-commit

# Apply specific codemod only
npx @kozmos-ds/codemod button-variant-rename --path ./src
```

### Proposal: Codemod Options

```bash
# Proposal: not built. This does not exist; do not run it.
Options:
  --path <path>      Target directory (required)
  --dry              Preview changes without applying
  --git-commit       Create git commit per transformation
  --ignore <glob>    Ignore patterns (default: node_modules)
  --extensions <ext> File extensions (default: ts,tsx,js,jsx)
  --verbose          Show detailed transformation logs
```

### Proposal: Writing Custom Codemods

For project-specific migrations:

```typescript
// custom-codemod.ts
import { Transform } from "@kozmos-ds/codemod";

const transform: Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find and replace JSX prop
  root
    .findJSXElements("MyComponent")
    .find(j.JSXAttribute, { name: { name: "oldProp" } })
    .forEach((path) => {
      path.node.name.name = "newProp";
    });

  return root.toSource();
};

export default transform;
```

```bash
# Proposal: not built. This does not exist; do not run it.
# Run custom codemod
npx jscodeshift -t ./custom-codemod.ts ./src
```

---

## Proposal: 8. Rollback Procedures

### Proposal: When to Rollback

Rollback if migration causes:

- P0/P1 production issues
- > 5% error rate increase
- Critical user flows broken
- Performance regression >20%

### Proposal: Quick Rollback

```bash
# Proposal: not built. This does not exist; do not run it.
# Revert to previous version
git checkout main -- package.json pnpm-lock.yaml
pnpm install

# Or revert entire migration branch
git revert --no-commit HEAD~5..HEAD
git commit -m "Revert: Kozmos v3 migration due to [reason]"
```

### Proposal: Staged Rollback

If partial migration was deployed:

```bash
# Proposal: not built. This does not exist; do not run it.
# 1. Identify affected packages
pnpm list "@kozmos-ds/*"

# 2. Downgrade specific packages
pnpm add @kozmos-ds/react@2.x.x

# 3. Revert codemods (if committed separately)
git revert <codemod-commit-hash>
```

### Proposal: Post-Rollback Actions

1. Document the issue that caused rollback
2. Create a ticket for resolution
3. Notify stakeholders
4. Plan re-migration after fix

---

## Proposal: 9. Migration Checklist Template

### Proposal: Pre-Migration

- [ ] Read release notes for target version
- [ ] Review breaking changes document
- [ ] Generate usage report for current codebase
- [ ] Create migration branch
- [ ] Set up comparison environment (before/after screenshots)
- [ ] Notify team of migration timeline
- [ ] Schedule QA resources

### Proposal: During Migration

- [ ] Update package versions
- [ ] Run codemods with dry-run first
- [ ] Apply codemods
- [ ] Fix TypeScript errors
- [ ] Run test suite
- [ ] Fix failing tests
- [ ] Visual regression review
- [ ] Accessibility audit
- [ ] Performance benchmark

### Proposal: Post-Migration

- [ ] Code review by senior engineer
- [ ] QA sign-off
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Staging validation (1-2 days)
- [ ] Canary deployment (10% traffic)
- [ ] Monitor error rates
- [ ] Full production deployment
- [ ] Remove deprecated code after stabilization

### Proposal: Rollback Criteria

Define before migration:

- [ ] Error rate threshold: \_\_\_% increase triggers rollback
- [ ] Performance threshold: \_\_\_ms latency increase triggers rollback
- [ ] Critical flows: \_\_\_ must work or rollback
- [ ] Rollback decision owner: \_\_\_

---

## Proposal: 10. FAQ & Troubleshooting

### Proposal: Common Migration Issues

#### Issue: TypeScript errors after upgrade

```
error TS2339: Property 'isLoading' does not exist on type 'ButtonProps'.
```

**Solution:** Run codemod for prop renames:

```bash
# Proposal: not built. This does not exist; do not run it.
npx @kozmos-ds/codemod boolean-prop-rename --path ./src
```

#### Issue: Styles look different after upgrade

**Causes:**

1. Token values changed
2. Default theme changed
3. CSS specificity issues

**Solution:**

1. Compare token values between versions
2. Check ThemeProvider configuration
3. Review CSS custom properties in dev tools

#### Issue: Bundle size increased significantly

**Causes:**

1. Tree-shaking not working
2. Importing entire package instead of specific components

**Solution:**

```tsx
// Bad (imports everything)
import { Button } from "@kozmos-ds/react";

// Good (tree-shakeable)
import { Button } from "@kozmos-ds/react/Button";
```

#### Issue: Codemod missed some transformations

**Solution:**

1. Check codemod logs for skipped files
2. Run with `--verbose` flag
3. Some patterns may need manual migration

### Proposal: Getting Help

1. **Documentation:** https://kozmos.pointr.design/migration
2. **GitHub Issues:** https://github.com/AcmeCorp/kozmos/issues
3. **Slack Channel:** #kozmos-support
4. **Office Hours:** Fridays 2-3pm (migration questions)

---

## Proposal: Version History

| Version | Date       | Changes                 |
| ------- | ---------- | ----------------------- |
| 1.0.0   | 2026-02-07 | Initial migration guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
