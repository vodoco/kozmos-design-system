# Kozmos Design System - Comprehensive Project Scope

## For Pointr Web & Mobile SDK Products (iOS, Android, Web)

**Version:** 1.7.0 | **Last Updated:** 2026-02-08

---

> **AI Agents:** For detailed operational documents, see the `.ai-skills/` directory (25 skill files):
>
> **Core References:**
>
> - [Design Philosophy](./.ai-skills/design-philosophy.md) — Visual language, interaction patterns
> - [Component Lifecycle](./.ai-skills/component-lifecycle.md) — From proposal to deprecation
> - [Code Patterns](./.ai-skills/code-patterns.md) — Templates for all 6 platforms
>
> **Operations:**
>
> - [Incident Playbook](./.ai-skills/incident-playbook.md) — Production issues, hotfixes
> - [Troubleshooting Guide](./.ai-skills/troubleshooting.md) — Common issues and solutions
>
> **Maintenance & Evolution:**
>
> - [Migration Guide](./.ai-skills/migration-guide.md) — Version upgrades and migrations
> - [API Changelog](./.ai-skills/api-changelog.md) — Breaking changes and deprecations
> - [Decision Log](./.ai-skills/decision-log.md) — Architecture Decision Records
>
> **Quality & Performance:**
>
> - [Performance Benchmarks](./.ai-skills/performance-benchmarks.md) — Budgets and baselines
> - [Platform Mapping](./.ai-skills/platform-mapping.md) — Cross-platform component reference
> - [Figma Audit](./.ai-skills/figma-audit.md) — Designer checklists
>
> **Technical Implementation (Executable):**
>
> - [Getting Started](./.ai-skills/getting-started.md) — Environment setup, project structure
> - [Component Creation Guide](./.ai-skills/component-creation-guide.md) — Step-by-step for all platforms
> - [Token Implementation](./.ai-skills/token-implementation.md) — Style Dictionary, DTCG format
> - [Testing Patterns](./.ai-skills/testing-patterns.md) — Platform-specific test examples
> - [CI/CD Configuration](./.ai-skills/ci-cd-configuration.md) — GitHub Actions workflows
> - [Publishing Guide](./.ai-skills/publishing-guide.md) — npm, SPM, Maven publishing
> - [Storybook Guide](./.ai-skills/storybook-guide.md) — Storybook setup, addons, documentation
>
> **Quality & Compliance:**
>
> - [Accessibility Guide](./.ai-skills/accessibility-guide.md) — WCAG 2.1 AA compliance, component checklists
> - [i18n Guide](./.ai-skills/i18n-guide.md) — Internationalization, RTL support, translations
> - [Theming Guide](./.ai-skills/theming-guide.md) — White-labeling, customer themes, dark mode
> - [Security Guide](./.ai-skills/security-guide.md) — Security hardening, vulnerability prevention
>
> **AI Integration (For Consuming Projects):**
>
> - [MCP Server Specification](./.ai-skills/mcp-server-specification.md) — `@kozmos/mcp-server` design for Cursor and similar assistants
> - [AI Integration Guide](./.ai-skills/ai-integration-guide.md) — Context files for Cursor, Anti Gravity, Copilot, Codeium and more

---

## 1. Executive Summary

Kozmos is a multi-platform design system for Pointr's SDK products. It provides a unified design language across **six platforms**:

- **Web (React)** — Primary web framework
- **Web (Vue)** — Via Lit-based Web Components wrapper
- **iOS (SwiftUI)** — Native iOS SDK
- **Android (Jetpack Compose)** — Native Android SDK
- **React Native** — Cross-platform mobile
- **Dashboard** — Internal tools (React, optionally with Framer Motion)

Figma serves as the single source of truth. The system uses **Figma Code Connect** to bridge design and development, **Style Dictionary v4** for multi-platform token generation, and supports **customer white-labeling** (theme colors, background/foreground, emotional colors).

### What Already Exists

Two prior implementations exist in `/Volumes/4TB Depo/development/K/`:

| Repository              | Stack                                                                                           | Status                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kozmos-design-system`  | Turborepo + pnpm, Stitches CSS-in-JS, Storybook 7, custom Figma sync scripts, tsup builds       | Partially built: tokens package with Figma parser/writer, core package with Stitches config, react package with CVA/Tailwind Merge, empty mobile/utils/tools packages |
| `_kozmos-design-system` | npm workspaces, styled-components, Style Dictionary with iOS/Android/Web outputs, Rollup builds | Partially built: tokens with Style Dictionary multi-platform config, web package with Button/TextInput/Layout/Typography/Icons components, empty iOS/Android packages |

### Key Decision Points

The new `kozmos-design-system-dev` project should consolidate the best approaches from both implementations:

- **Token Pipeline**: Style Dictionary (from `_kozmos-design-system`) - proven multi-platform output
- **Monorepo Tooling**: Turborepo + pnpm (from `kozmos-design-system`) - faster builds, better DX
- **Figma Integration**: Figma Code Connect CLI (new) + existing Figma API sync scripts
- **Styling**: Consolidate to a single approach (decision required - see Section 7)
- **Component Patterns**: Leverage existing component implementations as reference

---

## 2. Architecture Overview

### 2.1 Monorepo Structure

```
kozmos-design-system-dev/
├── packages/
│   ├── tokens/                    # Design tokens (single source of truth)
│   │   ├── src/
│   │   │   ├── foundations/        # Raw token definitions
│   │   │   ├── semantic/           # Semantic aliases (light/dark)
│   │   │   └── platform/           # Platform-specific overrides
│   │   ├── figma/
│   │   │   ├── sync.ts             # Figma Variables API sync
│   │   │   └── exports/            # Figma token exports (JSON)
│   │   ├── style-dictionary.config.ts
│   │   └── dist/
│   │       ├── web/                # CSS variables, JS/TS modules
│   │       ├── ios/                # Swift enums/structs
│   │       └── android/            # XML resources, Kotlin objects
│   │
│   ├── react/                     # React component library
│   │   ├── src/
│   │   │   ├── components/         # All React components
│   │   │   ├── hooks/              # Shared hooks
│   │   │   ├── utils/              # Utilities (cn, polymorphic, etc.)
│   │   │   └── index.ts
│   │   ├── *.figma.tsx             # Code Connect mappings (React)
│   │   └── figma.config.json       # Code Connect config (React)
│   │
│   ├── ios/                       # SwiftUI component library
│   │   ├── Sources/KozmosUI/
│   │   │   ├── Components/         # SwiftUI views
│   │   │   ├── Tokens/             # Generated Swift tokens
│   │   │   ├── Theme/              # Theme provider
│   │   │   └── Modifiers/          # Custom view modifiers
│   │   ├── *.figma.swift           # Code Connect mappings (SwiftUI)
│   │   ├── figma.config.json       # Code Connect config (SwiftUI)
│   │   └── Package.swift
│   │
│   ├── android/                   # Jetpack Compose component library
│   │   ├── kozmos-ui/
│   │   │   └── src/main/kotlin/
│   │   │       ├── components/     # Composable functions
│   │   │       ├── tokens/         # Generated Kotlin tokens
│   │   │       └── theme/          # MaterialTheme wrapper
│   │   ├── *.figma.kt             # Code Connect mappings (Compose)
│   │   ├── figma.config.json       # Code Connect config (Compose)
│   │   └── build.gradle.kts
│   │
│   ├── react-native/              # React Native component library
│   │   ├── src/
│   │   │   ├── components/         # RN components
│   │   │   ├── tokens/             # Token values (JS)
│   │   │   └── theme/              # ThemeProvider
│   │   ├── *.figma.tsx            # Code Connect mappings (React Native)
│   │   ├── figma.config.json       # Code Connect config (--label "React Native")
│   │   └── package.json
│   │
│   ├── vue/                       # Vue Web Components wrapper
│   │   ├── src/
│   │   │   ├── components/         # Lit-based Web Components
│   │   │   └── vue-wrappers/       # Vue 3 component wrappers
│   │   ├── figma.config.json       # Code Connect config (--label "Vue")
│   │   └── package.json
│   │
│   ├── icons/                     # Cross-platform icon library
│   │   ├── svg/                    # Source SVGs
│   │   ├── scripts/                # Icon generation scripts
│   │   └── dist/
│   │       ├── react/              # React icon components
│   │       ├── ios/                # SF Symbol mappings / SVG assets
│   │       └── android/            # Vector drawables
│   │
│   ├── code-connect/              # Shared Code Connect utilities
│   │   ├── helpers.ts              # Shared mapping helpers
│   │   └── scripts/
│   │       ├── publish.ts          # Multi-platform publish script
│   │       └── validate.ts         # Validate all .figma.* files
│   │
│   ├── codemods/                  # Migration automation
│   │   ├── src/                    # jscodeshift transforms per version
│   │   └── __testfixtures__/       # Input/output test fixtures
│   │
│   └── config/                    # Shared configs
│       ├── eslint/
│       ├── prettier/
│       ├── typescript/
│       └── testing/
│
├── apps/
│   ├── docs/                      # Documentation site
│   │   ├── storybook/              # Storybook for React components
│   │   └── site/                   # Docusaurus/Astro documentation
│   │
│   ├── playground-web/            # React playground/sandbox
│   ├── playground-ios/            # Xcode preview project
│   └── playground-android/        # Android Studio preview project
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Build, test, lint
│       ├── release.yml             # Package publishing
│       ├── code-connect.yml        # Figma Code Connect publish
│       └── tokens-sync.yml         # Figma token sync
│
├── figma.config.json              # Root Code Connect config
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### 2.2 Token Flow Architecture

```
Figma Variables (Source of Truth)
        │
        ▼
  Figma Variables API / Tokens Studio Export
        │
        ▼
  tokens/figma/exports/*.json (W3C Design Token Format)
        │
        ▼
  Style Dictionary (Transform + Build)
        │
        ├──▶ Web:     CSS custom properties + TS/JS modules
        ├──▶ iOS:     Swift structs/enums (Color, Font, CGFloat)
        └──▶ Android: XML resources + Kotlin data objects
        │
        ▼
  Platform Libraries Import Generated Tokens
        │
        ├──▶ @kozmos/react   imports web tokens
        ├──▶ KozmosUI.swift  imports iOS tokens
        └──▶ kozmos-ui.kt    imports Android tokens
```

### 2.3 Figma Code Connect Flow

```
Figma Component (e.g. "Button")
        │
        ▼
  .figma.tsx / .figma.swift / .figma.kt files
  (Map Figma props → code props)
        │
        ▼
  `figma publish` CLI command
        │
        ▼
  Figma Dev Mode displays real code snippets
  for React, SwiftUI, and Compose simultaneously
```

---

## 3. Design Token System

### 3.0 W3C DTCG Compliance

All tokens conform to the **W3C Design Tokens Community Group (DTCG) specification v1.0 (October 2025)** — the vendor-neutral standard adopted by Figma, Sketch, Penpot, Style Dictionary v4, and Tokens Studio. Token files use the `.tokens.json` extension and follow the DTCG JSON schema:

```json
{
  "color": {
    "blue": {
      "500": {
        "$type": "color",
        "$value": "#2563eb",
        "$description": "Primary brand blue"
      }
    }
  },
  "shadow": {
    "md": {
      "$type": "shadow",
      "$value": {
        "color": "{color.neutral.900}",
        "offsetX": "0px",
        "offsetY": "4px",
        "blur": "6px",
        "spread": "-1px"
      }
    }
  }
}
```

**Composite token types** supported: `shadow`, `border`, `typography`, `gradient`, `transition`. Style Dictionary v4 transforms these into platform-appropriate values (e.g., a `shadow` composite becomes CSS `box-shadow`, Swift `NSShadow`, and Android `@style` elevation).

### 3.1 Token Taxonomy

#### Foundation Tokens (Global/Primitive)

Raw values not tied to any semantic meaning.

| Category             | Tokens                                      | Examples                                                     |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| **Color Palette**    | Brand, Neutrals, Status                     | `color.blue.500: #2563eb`, `color.neutral.100: #f5f5f5`      |
| **Typography Scale** | Font families, sizes, weights, line heights | `font.size.300: 14px`, `font.weight.bold: 700`               |
| **Spacing Scale**    | 4px base unit, geometric scale              | `space.100: 4px`, `space.200: 8px`, `space.400: 16px`        |
| **Border Radius**    | Corner rounding                             | `radius.100: 4px`, `radius.200: 8px`, `radius.full: 9999px`  |
| **Elevation/Shadow** | Box shadows, z-index (composite type)       | `shadow.sm`, `shadow.md`, `shadow.lg`                        |
| **Motion**           | Duration, easing curves                     | `duration.fast: 150ms`, `easing.standard: cubic-bezier(...)` |
| **Opacity**          | Alpha values                                | `opacity.disabled: 0.38`, `opacity.hover: 0.08`              |
| **Breakpoints**      | Responsive thresholds                       | `breakpoint.sm: 640px`, `breakpoint.md: 768px`               |
| **Z-Index**          | Stacking context layers                     | `z-index.dropdown: 1000`, `z-index.modal: 1300`              |

#### Semantic Tokens (Alias/Theme-Aware)

Map foundation tokens to purpose. These change per theme.

| Category                          | Light Mode          | Dark Mode           |
| --------------------------------- | ------------------- | ------------------- |
| `color.background.primary`        | `color.white`       | `color.neutral.900` |
| `color.background.secondary`      | `color.neutral.50`  | `color.neutral.800` |
| `color.text.primary`              | `color.neutral.900` | `color.white`       |
| `color.text.secondary`            | `color.neutral.600` | `color.neutral.400` |
| `color.interactive.primary`       | `color.blue.600`    | `color.blue.400`    |
| `color.interactive.primary.hover` | `color.blue.700`    | `color.blue.300`    |
| `color.border.default`            | `color.neutral.200` | `color.neutral.700` |
| `color.status.error`              | `color.red.600`     | `color.red.400`     |
| `color.status.success`            | `color.green.600`   | `color.green.400`   |

#### Component Tokens

Scoped to individual components. Reference semantic tokens.

```
button.background.primary         → color.interactive.primary
button.background.primary.hover   → color.interactive.primary.hover
button.text.primary               → color.text.inverse
button.border.radius              → radius.200
button.padding.horizontal         → space.400
button.padding.vertical           → space.200
button.font.size.md               → font.size.300
```

### 3.2 Style Dictionary Configuration

Multi-platform output using Style Dictionary v4:

**Web outputs:**

- `tokens.css` - CSS custom properties (`:root { --color-blue-500: #2563eb; }`)
- `tokens.ts` - TypeScript module with full type safety
- `tokens.module.css` - CSS Modules compatible

**iOS outputs:**

- `KozmosTokens.swift` - Swift struct with static properties
- `KozmosColors.swift` - UIColor/Color extensions
- `KozmosTypography.swift` - Font descriptors

**Android outputs:**

- `tokens.xml` - Android resource XML
- `KozmosTokens.kt` - Kotlin object with Compose Color/TextStyle values
- `themes.xml` - Android theme attributes

### 3.3 Responsive & Conditional Tokens

Tokens that change value based on context (breakpoint, device, density):

**Web — CSS media query re-mapping:**

```css
:root {
  --font-size-body: 14px;
  --space-page-gutter: 16px;
}
@media (min-width: 768px) {
  :root {
    --font-size-body: 16px;
    --space-page-gutter: 24px;
  }
}
```

**iOS — adaptive via `@Environment(\.sizeClass)`:**

```swift
KozmosTokens.fontSize(for: sizeClass == .compact ? .sm : .md)
```

**Android — adaptive via `WindowSizeClass`:**

```kotlin
val bodySize = when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> KozmosTokens.fontSize300
    else -> KozmosTokens.fontSize400
}
```

Style Dictionary generates the base values; platform-specific responsive logic is handled in the ThemeProvider of each platform.

### 3.4 Figma Variables Sync

Two-directional sync strategy:

1. **Figma to Code** (primary flow): Design team updates Figma Variables, CI exports to JSON, Style Dictionary generates platform code
2. **Code to Figma** (validation): CI validates that code tokens match Figma source, flags drift

**Sync mechanism:**

- Figma Variables REST API (`GET /v1/files/:key/variables/local`)
- Output: W3C DTCG format (`.tokens.json`)
- Trigger: Webhook on Figma file version change, or manual via `pnpm sync-tokens`

**Tokens Studio integration** (optional, evaluated in Open Questions):

- Bidirectional sync between Figma and Git repository
- Supports composite token types Figma Variables cannot natively represent (multi-value borders, complex shadows)
- Remote storage to GitHub/GitLab with branch-based workflows

### 3.5 Wide Gamut Color Support (Display P3 / oklch)

Modern displays support colors beyond sRGB. The token system supports wide gamut colors:

**Token definition (DTCG format):**

```json
{
  "color": {
    "brand": {
      "vibrant": {
        "$type": "color",
        "$value": "oklch(70% 0.25 145)",
        "$description": "Vibrant brand green (P3 gamut)"
      }
    }
  }
}
```

**Platform outputs:**

| Platform    | Format                                     | Fallback Strategy                                                                 |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| **Web**     | `oklch()` with `@supports` fallback to hex | `color: #22c55e; @supports (color: oklch(0 0 0)) { color: oklch(70% 0.25 145); }` |
| **iOS**     | `Color(.displayP3, red:, green:, blue:)`   | Automatic fallback to sRGB on older displays                                      |
| **Android** | `Color.colorSpace(ColorSpaces.DisplayP3)`  | API 26+ with sRGB fallback                                                        |

**Style Dictionary transform:** Custom `color/oklch` transform converts oklch to platform-appropriate formats.

**Figma consideration:** Figma Variables support hex only (as of 2025). Wide gamut colors are authored in code tokens and synced one-way to Figma as nearest sRGB equivalent.

### 3.6 Automated Contrast Validation

Color token pairs are validated for WCAG contrast compliance during the Style Dictionary build:

**Configuration (`style-dictionary.config.ts`):**

```typescript
{
  hooks: {
    preprocessors: {
      'contrast-check': ({ dictionary }) => {
        const pairs = [
          ['color.text.primary', 'color.background.primary'],
          ['color.text.secondary', 'color.background.primary'],
          ['color.text.inverse', 'color.interactive.primary'],
          // ... all semantic text/background pairs
        ];
        pairs.forEach(([fg, bg]) => {
          const ratio = calculateContrastRatio(dictionary.tokens[fg], dictionary.tokens[bg]);
          if (ratio < 4.5) throw new Error(`Contrast fail: ${fg} on ${bg} = ${ratio}:1`);
        });
      }
    }
  }
}
```

**CI enforcement:** Token build fails if any defined contrast pair falls below WCAG AA (4.5:1 for normal text, 3:1 for large text/UI).

**Per-mode validation:** Runs separately for light and dark modes.

### 3.7 Motion & Animation System

Beyond duration/easing tokens, a complete motion system defines semantic animation patterns:

#### Motion Tokens

| Token                        | Value                                     | Usage                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------- |
| `motion.duration.instant`    | `100ms`                                   | Micro-interactions (checkbox, toggle) |
| `motion.duration.fast`       | `150ms`                                   | Button hover, focus states            |
| `motion.duration.normal`     | `250ms`                                   | Dropdowns, tooltips, small reveals    |
| `motion.duration.slow`       | `400ms`                                   | Modal entrance, page transitions      |
| `motion.duration.deliberate` | `700ms`                                   | Complex choreographed sequences       |
| `motion.easing.standard`     | `cubic-bezier(0.4, 0, 0.2, 1)`            | General purpose                       |
| `motion.easing.decelerate`   | `cubic-bezier(0, 0, 0.2, 1)`              | Elements entering                     |
| `motion.easing.accelerate`   | `cubic-bezier(0.4, 0, 1, 1)`              | Elements exiting                      |
| `motion.easing.spring`       | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Playful bounce                        |

#### Semantic Motion Patterns

| Pattern         | Tokens Used                             | Description           |
| --------------- | --------------------------------------- | --------------------- |
| `motion.enter`  | `duration.normal` + `easing.decelerate` | Elements appearing    |
| `motion.exit`   | `duration.fast` + `easing.accelerate`   | Elements disappearing |
| `motion.hover`  | `duration.fast` + `easing.standard`     | Hover state changes   |
| `motion.expand` | `duration.normal` + `easing.standard`   | Accordions, dropdowns |
| `motion.page`   | `duration.slow` + `easing.decelerate`   | Page/view transitions |

#### Platform Implementation

**Web:**

```css
.kozmos-dialog[data-state="open"] {
  animation: kozmos-fade-in var(--motion-duration-normal)
    var(--motion-easing-decelerate);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**iOS:**

```swift
.animation(.easeOut(duration: KozmosTokens.motionDurationNormal))
// Respects system "Reduce Motion" automatically via .animation()
```

**Android:**

```kotlin
AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn(animationSpec = tween(
        durationMillis = KozmosTokens.motionDurationNormal,
        easing = KozmosTokens.motionEasingDecelerate
    ))
)
// Check Settings.Global.ANIMATOR_DURATION_SCALE for reduced motion
```

#### Reduced Motion Compliance

All components must:

1. Check `prefers-reduced-motion` (web) / Reduce Motion setting (iOS) / animator duration scale (Android)
2. Replace motion with instant state changes or subtle opacity fades
3. Never disable functionality — only reduce motion

---

## 4. Design Philosophy & Principles

> **Full document:** [.ai-skills/design-philosophy.md](./.ai-skills/design-philosophy.md)

### 4.0.1 Core Pillars

| Pillar            | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| **Clarity**       | Information hierarchy that guides the eye; whitespace over decoration |
| **Consistency**   | Same patterns across all 6 platforms; predictable interactions        |
| **Accessibility** | Everyone can navigate, regardless of ability; WCAG AA minimum         |

### 4.0.2 Visual Language Principles

1. **Clarity Over Decoration** — Use whitespace generously; avoid decorative elements that don't serve navigation
2. **Data Density Balanced with Legibility** — Show enough to be useful without overwhelming
3. **Motion with Purpose** — Animation should inform, not entertain; always respect reduced motion
4. **Progressive Disclosure** — Show only what's needed at each step; reveal complexity on demand

### 4.0.3 Interaction Patterns

- **Gesture Consistency** — Same gestures do the same things across all platforms
- **Immediate Feedback** — Every interaction gets feedback within 100ms
- **Predictable Navigation** — Users always know where they are, where they can go, and how to go back
- **Error Recovery** — Errors are specific, actionable, and non-blocking

### 4.0.4 Design Decision Framework

When making design decisions, ask in order:

1. Is it accessible? (WCAG AA minimum)
2. Is it consistent? (Matches existing patterns)
3. Is it clear? (User understands immediately)
4. Is it efficient? (Minimal steps to goal)
5. Is it delightful? (Only after 1-4 are satisfied)

---

## 5. Component Library Architecture

### 5.1 Component Inventory

> **Tracking:** A comprehensive inventory and status tracker is available in `check-completion.ts`.
> Run `npx tsx scripts/skills/check-completion.ts` to see the current implementation status across all platforms.
> See also: [Extensive Component Inventory](./.ai-skills/component-inventory.md)

#### Phase 1 - Foundation Components

| Component         | Web (React)                    | iOS (SwiftUI)                 | Android (Compose)                 | Code Connect |
| ----------------- | ------------------------------ | ----------------------------- | --------------------------------- | ------------ |
| **ThemeProvider** | Context + CSS vars             | `@Environment`                | `MaterialTheme` wrapper           | N/A (system) |
| **Box**           | `<div>` + spacing/layout props | `VStack`/`HStack`             | `Box`/`Column`/`Row`              | Yes          |
| **Stack**         | Flex container                 | `VStack`/`HStack`/`ZStack`    | `Column`/`Row`                    | Yes          |
| **Text**          | `<span>`/`<p>`                 | `Text` view                   | `Text` composable                 | Yes          |
| **Heading**       | `<h1>`-`<h6>`                  | `Text` + font style           | `Text` + MaterialTheme.typography | Yes          |
| **Button**        | `<button>` with variants       | `Button` view                 | `Button`/`OutlinedButton`         | Yes          |
| **IconButton**    | `<button>` with icon           | `Button` + `Image`            | `IconButton`                      | Yes          |
| **Icon**          | SVG React component            | `Image(systemName:)` / custom | `Icon` composable                 | Yes          |
| **Input**         | `<input>`                      | `TextField`                   | `TextField`/`OutlinedTextField`   | Yes          |
| **Checkbox**      | `<input type="checkbox">`      | `Toggle` with checkbox style  | `Checkbox`                        | Yes          |
| **Radio**         | `<input type="radio">`         | `Picker` with radio style     | `RadioButton`                     | Yes          |
| **Select**        | Custom dropdown                | `Picker`                      | `ExposedDropdownMenu`             | Yes          |
| **Switch**        | Toggle component               | `Toggle`                      | `Switch`                          | Yes          |
| **Divider**       | `<hr>`                         | `Divider`                     | `Divider`                         | Yes          |
| **Spacer**        | Flex spacer                    | `Spacer`                      | `Spacer`                          | Yes          |

#### Phase 2 - Interactive Components

| Component          | Description                |
| ------------------ | -------------------------- |
| **Toast/Snackbar** | Notification messages      |
| **Dialog/Modal**   | Overlay dialogs            |
| **Tooltip**        | Contextual information     |
| **Popover**        | Rich content overlay       |
| **Tabs**           | Tab navigation             |
| **Accordion**      | Expandable sections        |
| **Badge**          | Status indicators          |
| **Avatar**         | User/entity representation |
| **Card**           | Content container          |
| **Chip/Tag**       | Categorization labels      |
| **Progress**       | Linear/circular progress   |
| **Skeleton**       | Loading placeholder        |

#### Phase 3 - Complex Components

| Component               | Description                   |
| ----------------------- | ----------------------------- |
| **DataTable**           | Sortable/filterable data grid |
| **Navigation**          | App navigation patterns       |
| **Sidebar**             | Side panel layout             |
| **Breadcrumb**          | Navigation path               |
| **Pagination**          | Page navigation               |
| **Calendar/DatePicker** | Date selection                |
| **Autocomplete**        | Search with suggestions       |
| **FileUpload**          | File selection                |
| **Stepper**             | Multi-step wizard             |

#### Pointr SDK-Specific Components (Phase 2-3)

| Component          | Description              | Platforms         |
| ------------------ | ------------------------ | ----------------- |
| **MapView**        | Indoor map container     | Web, iOS, Android |
| **WayfindingCard** | Navigation instruction   | Web, iOS, Android |
| **FloorSelector**  | Floor/level picker       | Web, iOS, Android |
| **POICard**        | Point of interest detail | Web, iOS, Android |
| **SearchBar**      | Location search          | Web, iOS, Android |
| **DirectionStep**  | Turn-by-turn step        | Web, iOS, Android |
| **LocationPin**    | Map marker               | Web, iOS, Android |
| **BottomSheet**    | Pull-up panel            | iOS, Android      |

### 5.2 Component API Design Principles

Each component across all platforms should follow these conventions:

1. **Variant-driven**: Use a `variant` prop (primary, secondary, outlined, ghost, destructive)
2. **Size-driven**: Use a `size` prop (sm, md, lg) mapping to component tokens
3. **Composition over configuration**: Prefer slot-based composition over prop overloading
4. **Accessible by default**: All components include proper ARIA roles, labels, and keyboard handling
5. **Controlled & uncontrolled**: Form components support both patterns
6. **Polymorphic rendering**: Web components support `as` prop for element type override
7. **Graceful degradation**: Components handle errors, missing data, and edge cases without breaking
8. **Slot-based customization**: Complex components expose named slots for content injection

### 5.3 Compound Component Pattern

For complex components with multiple related parts (Tabs, Accordion, Dialog), use the compound component pattern:

**React example (Tabs):**

```tsx
// Usage
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>;

// Implementation uses React Context for state sharing
const TabsContext = React.createContext<TabsContextValue | null>(null);

export const Tabs = ({ children, defaultValue, ...props }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
};
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
```

**SwiftUI equivalent:**

```swift
TabView(selection: $selectedTab) {
    Text("Content 1").tag("tab1")
    Text("Content 2").tag("tab2")
}
.tabViewStyle(.page) // or custom KozmosTabStyle
```

**Compose equivalent:**

```kotlin
KozmosTabs(selectedTabIndex = selectedTab) {
    Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) { Text("Tab 1") }
    Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) { Text("Tab 2") }
}
```

### 5.4 Slot API for Content Customization

Components with customizable regions expose named slots:

**React (using render props or children inspection):**

```tsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Action>
      <IconButton icon="more" />
    </Card.Action>
  </Card.Header>
  <Card.Body>Content here</Card.Body>
  <Card.Footer>Footer actions</Card.Footer>
</Card>
```

**Alternative: Slot props for simpler cases:**

```tsx
<Input
  label="Email"
  leftSlot={<Icon name="mail" />}
  rightSlot={
    <Button variant="ghost" size="sm">
      Clear
    </Button>
  }
/>
```

### 5.5 Error Handling & Graceful Degradation

#### Error Boundary (React)

Wrap component trees with error boundaries to prevent cascade failures:

```tsx
// packages/react/src/components/ErrorBoundary/ErrorBoundary.tsx
export class KozmosErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service (optional callback prop)
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? <KozmosErrorFallback error={this.state.error} />
      );
    }
    return this.props.children;
  }
}

// Default fallback component
const KozmosErrorFallback = ({ error, onRetry }) => (
  <div className="kozmos-error-fallback">
    <Icon name="alert-circle" />
    <Text>Something went wrong</Text>
    {onRetry && <Button onClick={onRetry}>Try again</Button>}
  </div>
);
```

#### Component-Level Resilience

Each component handles edge cases gracefully:

| Scenario              | Handling                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Missing required prop | TypeScript error at build time; runtime fallback to safe default |
| Empty children        | Render nothing or placeholder (never crash)                      |
| Invalid variant value | Fall back to default variant with console warning (dev only)     |
| Network image failure | Show placeholder/skeleton, fire `onError` callback               |
| Async data loading    | Built-in loading states via `loading` prop                       |
| Overflow text         | Truncate with ellipsis, expose `title` for full text             |

#### Platform Equivalents

**iOS:**

```swift
// Use @ViewBuilder with conditional rendering
var body: some View {
    if let error = viewModel.error {
        KozmosErrorView(error: error, onRetry: viewModel.retry)
    } else {
        content
    }
}
```

**Android:**

```kotlin
// Compose error handling
@Composable
fun KozmosErrorBoundary(
    fallback: @Composable (Throwable) -> Unit = { KozmosErrorFallback(it) },
    content: @Composable () -> Unit
) {
    var error by remember { mutableStateOf<Throwable?>(null) }
    if (error != null) {
        fallback(error!!)
    } else {
        // Wrap in try-catch for synchronous errors
        content()
    }
}
```

### 5.6 React Component Pattern

```tsx
// Example: packages/react/src/components/Button/Button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "kozmos-btn inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]",
        secondary:
          "bg-[var(--color-background-secondary)] text-[var(--color-text-primary)]",
        outlined: "border border-[var(--color-border-default)] bg-transparent",
        ghost: "bg-transparent hover:bg-[var(--color-background-secondary)]",
        destructive:
          "bg-[var(--color-status-error)] text-[var(--color-text-inverse)]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  ),
);
```

### 5.7 SwiftUI Component Pattern

```swift
// Example: packages/ios/Sources/KozmosUI/Components/KozmosButton.swift
import SwiftUI

public enum KozmosButtonVariant {
    case primary, secondary, outlined, ghost, destructive
}

public enum KozmosButtonSize {
    case sm, md, lg
}

public struct KozmosButton<Label: View>: View {
    let variant: KozmosButtonVariant
    let size: KozmosButtonSize
    let isLoading: Bool
    let action: () -> Void
    let label: () -> Label

    public var body: some View {
        Button(action: action) {
            if isLoading {
                ProgressView()
            } else {
                label()
            }
        }
        .buttonStyle(KozmosButtonStyle(variant: variant, size: size))
        .disabled(isLoading)
    }
}
```

### 5.8 Jetpack Compose Component Pattern

```kotlin
// Example: packages/android/kozmos-ui/src/main/kotlin/components/KozmosButton.kt
@Composable
fun KozmosButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosButtonVariant = KozmosButtonVariant.Primary,
    size: KozmosButtonSize = KozmosButtonSize.Md,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = modifier.then(size.toModifier()),
        enabled = enabled && !isLoading,
        colors = variant.toButtonColors(),
        shape = RoundedCornerShape(KozmosTokens.radius200),
    ) {
        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp))
        } else {
            content()
        }
    }
}
```

---

## 6. Figma Code Connect Integration

### 6.1 Strategy

Use **Figma Code Connect CLI** to publish production code snippets from all three platforms simultaneously. Each platform gets its own `figma.config.json` and `.figma.*` files, published with custom labels so developers see React, SwiftUI, and Compose code in Figma Dev Mode side by side.

### 6.2 Configuration

**Root `figma.config.json`:**

```json
{
  "codeConnect": {
    "include": ["packages/react/**/*.figma.tsx"],
    "exclude": ["node_modules"],
    "parser": "react",
    "label": "React",
    "importPaths": {
      "@kozmos/react/*": "@kozmos/react"
    }
  }
}
```

**iOS `packages/ios/figma.config.json`:**

```json
{
  "codeConnect": {
    "include": ["**/*.figma.swift"],
    "parser": "swiftui",
    "label": "SwiftUI",
    "xcodeprojPath": "KozmosUI.xcodeproj"
  }
}
```

**Android `packages/android/figma.config.json`:**

```json
{
  "codeConnect": {
    "include": ["**/*.figma.kt"],
    "parser": "compose",
    "label": "Compose"
  }
}
```

### 6.3 Advanced Code Connect Patterns

Beyond basic prop mapping, Code Connect supports advanced patterns critical for complex components:

**`figma.nestedProps`** — Map properties from nested Figma component instances:

```tsx
props: {
  inputField: figma.nestedProps("Input Field", {
    placeholder: figma.string("Placeholder"),
    value: figma.string("Value"),
    error: figma.boolean("Has Error"),
  }),
}
```

**`figma.children`** — Map child layers to React children / SwiftUI `@ViewBuilder`:

```tsx
props: {
  items: figma.children("List Item *"),  // wildcard matches List Item 1, List Item 2, etc.
}
```

**`figma.className`** — Map boolean props to CSS class toggles:

```tsx
props: {
  className: figma.className("Compact", { true: "kozmos-compact", false: "" }),
}
```

**`figma.textContent`** — Map Figma text layer content directly:

```tsx
props: {
  label: figma.textContent("Label Text"),
}
```

**Variant-specific connections** — Map different code components to different Figma variants:

```tsx
// Connect a specific variant to a different component
figma.connect(AlertDialog, FIGMA_URL, {
  variant: { Type: "Alert" },
  // ...props for AlertDialog only
});

figma.connect(ConfirmDialog, FIGMA_URL, {
  variant: { Type: "Confirm" },
  // ...props for ConfirmDialog only
});
```

### 6.4 Code Connect File Examples

**React (`Button.figma.tsx`):**

```tsx
import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(
  Button,
  "https://figma.com/design/FILE_KEY/..?node-id=BUTTON_NODE_ID",
  {
    props: {
      label: figma.string("Label"),
      variant: figma.enum("Variant", {
        Primary: "primary",
        Secondary: "secondary",
        Outlined: "outlined",
        Ghost: "ghost",
        Destructive: "destructive",
      }),
      size: figma.enum("Size", {
        Small: "sm",
        Medium: "md",
        Large: "lg",
      }),
      disabled: figma.boolean("Disabled"),
      loading: figma.boolean("Loading"),
      icon: figma.instance("Icon"),
    },
    example: ({ label, variant, size, disabled, loading, icon }) => (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
      >
        {icon}
        {label}
      </Button>
    ),
  },
);
```

**SwiftUI (`Button.figma.swift`):**

```swift
import Figma
import KozmosUI

struct Button_Doc: FigmaConnect {
    let component = KozmosButton.self
    let figmaNodeUrl = "https://figma.com/design/FILE_KEY/..?node-id=BUTTON_NODE_ID"

    @FigmaString("Label")
    var label: String

    @FigmaEnum("Variant", mapping: [
        "Primary": .primary,
        "Secondary": .secondary,
        "Outlined": .outlined,
    ])
    var variant: KozmosButtonVariant

    @FigmaBoolean("Disabled")
    var disabled: Bool

    var body: some View {
        KozmosButton(variant: variant, size: .md, action: {}) {
            Text(label)
        }
        .disabled(disabled)
    }
}
```

**Compose (`Button.figma.kt`):**

```kotlin
@FigmaConnect(
    url = "https://figma.com/design/FILE_KEY/..?node-id=BUTTON_NODE_ID"
)
@Composable
fun ButtonDoc(
    @FigmaProperty("Label")
    label: String,
    @FigmaVariant("Variant")
    variant: String = Figma.mapping(
        "Primary" to "Primary",
        "Secondary" to "Secondary",
        "Outlined" to "Outlined",
    ),
) {
    KozmosButton(
        variant = KozmosButtonVariant.valueOf(variant),
        onClick = {},
    ) {
        Text(label)
    }
}
```

### 6.5 Publishing Pipeline

Multi-platform publish via CI:

```yaml
# .github/workflows/code-connect.yml
name: Publish Code Connect
on:
  push:
    branches: [main]
    paths:
      - "packages/react/**/*.figma.tsx"
      - "packages/ios/**/*.figma.swift"
      - "packages/android/**/*.figma.kt"

jobs:
  publish-react:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx figma connect publish --token ${{ secrets.FIGMA_ACCESS_TOKEN }} --label "React"
        working-directory: packages/react

  publish-swiftui:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx figma connect publish --token ${{ secrets.FIGMA_ACCESS_TOKEN }} --label "SwiftUI"
        working-directory: packages/ios

  publish-compose:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx figma connect publish --token ${{ secrets.FIGMA_ACCESS_TOKEN }} --label "Compose"
        working-directory: packages/android
```

---

## 7. Styling Strategy Decision

### Option A: CSS Variables + CVA + Tailwind Merge (Recommended)

**Approach:** Token-driven CSS custom properties consumed via `class-variance-authority` for variants, `clsx` + `tailwind-merge` for class composition. No CSS-in-JS runtime.

**Pros:**

- Zero runtime overhead (CSS variables are native)
- Works with SSR/SSG without hydration issues
- Tailwind-compatible ecosystem (familiar to developers)
- Easy to override via CSS cascade
- Already partially implemented in `@kozmos/react` package

**Cons:**

- Requires build step for token-to-CSS-variable generation
- Less dynamic than JS-based solutions

### Option B: vanilla-extract (Mentioned in manifesto)

**Approach:** Zero-runtime CSS-in-JS with TypeScript type safety. Generates static CSS at build time.

**Pros:**

- Type-safe style authoring
- Zero runtime CSS-in-JS
- Sprinkles API for utility-first patterns
- Strong theming via `createThemeContract`

**Cons:**

- Requires Vite/webpack plugin
- Smaller ecosystem than Tailwind
- More complex setup

### Option C: Stitches (Current implementation in core package)

**Note:** Stitches is unmaintained as of 2023. Not recommended for new projects.

### Recommendation

**Option A (CSS Variables + CVA)** is recommended because:

1. Already partially implemented in the `@kozmos/react` package
2. Zero runtime = best performance for SDK products
3. CSS custom properties work natively for theming (light/dark)
4. Decouples tokens from styling framework - tokens generate CSS vars, components consume them
5. Industry standard approach used by Radix, Shadcn/ui, and similar systems

---

## 8. Platform-Specific Considerations

### 8.1 Web (React)

- **Target**: Pointr Web SDK, dashboard applications
- **Build**: tsup (ESM + CJS + types), configured to **preserve `"use client"` directives**
- **React version**: 18.x + 19.x peer dependency range (`^18.0.0 || ^19.0.0`)
- **SSR**: Full support via CSS custom properties (no JS runtime for styles)
- **Bundle target**: <50KB core, <10KB per component (tree-shakeable)
- **Browser support**: Chrome/Edge/Firefox/Safari last 2 versions

#### React Server Components (RSC) Strategy

All interactive components include `"use client"` directives. The package provides two entry points:

| Entry Point            | Contents                                       | RSC-Safe             |
| ---------------------- | ---------------------------------------------- | -------------------- |
| `@kozmos/react`        | All components (re-exports client components)  | No (client boundary) |
| `@kozmos/react/tokens` | Token constants, `cn()` utility, static config | Yes                  |

**Key requirements:**

- Every component using hooks, refs, event handlers, or Context must have `"use client"` at the top
- tsup must be configured with `banner: { js: '"use client";' }` or per-file preservation
- ThemeProvider is inherently client-only (uses Context); document that consumers wrap it at a layout boundary
- Provide a `KozmosScript` component for injecting theme CSS vars server-side without a Context provider

#### CSS Namespace Strategy (SDK Embedding)

Since Pointr SDK components embed into customer applications, CSS isolation is critical:

- All CSS custom properties prefixed: `--kozmos-color-*`, `--kozmos-space-*`, etc.
- All component CSS classes prefixed: `.kozmos-btn`, `.kozmos-input`, etc.
- Optional CSS `@layer kozmos { ... }` wrapping for cascade layer isolation
- Shadow DOM encapsulation available as opt-in for maximum isolation in Web Components
- No global CSS resets — provide an opt-in `KozmosReset` component

#### Next.js App Router Integration Guide (Phase 2 deliverable)

Document the recommended setup:

1. Import `@kozmos/react/tokens/tokens.css` in root `layout.tsx`
2. Wrap app in `<KozmosThemeProvider>` at the layout level (client boundary)
3. Theme detection: default to CSS `@media (prefers-color-scheme)`, with optional JS override via `useEffect` to avoid hydration mismatch
4. FOUC prevention: inline critical token CSS via `<link rel="preload">`

#### Tree-Shaking & Side Effects

Ensure maximum dead code elimination for consuming bundlers:

**`package.json` configuration:**

```json
{
  "sideEffects": ["*.css", "./dist/tokens.css"],
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./tokens": {
      "import": "./dist/tokens.mjs",
      "require": "./dist/tokens.js",
      "types": "./dist/tokens.d.ts"
    },
    "./tokens.css": "./dist/tokens.css",
    "./Button": {
      "import": "./dist/components/Button/index.mjs",
      "types": "./dist/components/Button/index.d.ts"
    }
  }
}
```

**Component-level exports:** Each component is individually importable:

```tsx
// Tree-shakes everything except Button
import { Button } from "@kozmos/react/Button";
```

**Barrel file strategy:** Main `index.ts` re-exports all components but bundlers can tree-shake unused ones when `sideEffects: false` is set (except CSS).

#### SDK Version Conflict Resolution

When Pointr SDK embeds into customer apps that may have their own design systems:

| Conflict Type                | Mitigation                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **CSS variable collision**   | All vars prefixed `--kozmos-*`; scoped to `.kozmos-root` selector if needed   |
| **CSS class collision**      | All classes prefixed `kozmos-*`; optional BEM naming                          |
| **React Context collision**  | Kozmos contexts use unique Symbol keys                                        |
| **Global state collision**   | No global singletons; all state scoped to provider tree                       |
| **Duplicate React versions** | Peer dependency + `peerDependenciesMeta.react.optional: true` for flexibility |
| **CSS specificity wars**     | Use `@layer kozmos` for controlled cascade priority                           |
| **Bundle duplication**       | Document in README: consumers should dedupe via bundler config                |

**Scoped root pattern:**

```tsx
// Wrap SDK UI in a scoped container
<div className="kozmos-root" data-kozmos-theme="light">
  <PointrMapView />
</div>
```

All Kozmos CSS is scoped to `.kozmos-root` descendants, preventing leakage into host app.

### 8.2 iOS (SwiftUI)

- **Target**: Pointr iOS SDK
- **Distribution**: Swift Package Manager
- **iOS version**: iOS 16+ (SwiftUI maturity threshold)
- **Architecture**: Observable pattern with `@Environment` for theming
- **Token delivery**: Generated Swift structs with static properties
- **Accessibility**: VoiceOver support, Dynamic Type, high contrast
- **Preview**: Xcode Previews with all variants

#### Offline & Bundle Considerations (iOS)

Pointr SDK operates in venues with unreliable connectivity. All UI assets must be bundled:

- **Fonts**: Include font files in SPM resources (`Bundle.module`)
- **Icons**: SVG icons compiled to Swift code or bundled as PDF assets
- **Images**: Use Asset Catalogs with on-demand resource tags if large
- **Tokens**: Compiled into Swift code — no network fetch required
- **Localization**: Bundle `.lproj` directories for all supported locales

**Framework size budget**: < 2MB to minimize SDK integration impact on host app size.

**Resource loading pattern:**

```swift
// Load bundled font
UIFont.register(from: Bundle.module.url(forResource: "KozmosFont", withExtension: "ttf")!)

// Access bundled icon
Image("icon-name", bundle: .module)
```

### 8.3 Android (Jetpack Compose)

- **Target**: Pointr Android SDK
- **Distribution**: Maven/Gradle dependency
- **Min SDK**: API 26 (Android 8.0)
- **Architecture**: `MaterialTheme` wrapper with custom `KozmosTheme`
- **Token delivery**: Generated Kotlin objects with Compose `Color`, `TextStyle`
- **Accessibility**: TalkBack, content descriptions, touch target sizing
- **Preview**: `@Preview` composables with all variants

#### Offline & Bundle Considerations (Android)

Same offline requirements as iOS. All resources must be bundled:

- **Fonts**: Include in `res/font/` or bundle as raw assets
- **Icons**: Vector drawables in `res/drawable/` (XML or AVD)
- **Images**: WebP format in `res/drawable-*` density buckets
- **Tokens**: Compiled into Kotlin code + XML resources
- **Localization**: Standard `res/values-*/strings.xml` per locale

**AAR size budget**: < 1MB for the UI library (excluding SDK-specific assets like map tiles).

**ProGuard/R8 configuration:**

```proguard
# Keep Compose-related classes
-keep class com.pointr.kozmos.** { *; }
-keepclassmembers class * {
    @androidx.compose.runtime.Composable <methods>;
}
```

**Resource loading pattern:**

```kotlin
// Access bundled font
val kozmosFont = FontFamily(Font(R.font.kozmos_regular))

// Access bundled drawable
Icon(painter = painterResource(R.drawable.ic_kozmos_icon), contentDescription = null)
```

---

## 9. Testing Strategy

### 9.1 Test Matrix

| Level                 | Web                            | iOS                     | Android                  |
| --------------------- | ------------------------------ | ----------------------- | ------------------------ |
| **Unit**              | Vitest + React Testing Library | XCTest                  | JUnit + Compose Testing  |
| **Visual Regression** | Chromatic (Storybook)          | Xcode snapshot tests    | Paparazzi/Roborazzi      |
| **Accessibility**     | axe-core + jest-axe            | Accessibility Inspector | Accessibility Scanner    |
| **Integration**       | Playwright                     | XCUITest                | Espresso/Compose UI Test |
| **Performance**       | Lighthouse + bundlesize        | Instruments             | Benchmark library        |

### 9.2 Accessibility Test Automation (CI-Integrated)

| Platform    | Tool                           | CI Integration                                                         | What It Catches                                       |
| ----------- | ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| **Web**     | `@storybook/addon-a11y`        | Storybook test runner with `a11y.test: 'error'` fails PR on violations | ~57% of WCAG issues (missing labels, contrast, roles) |
| **Web**     | `axe-storybook-testing` (CZI)  | CLI runs axe-core against all stories, non-zero exit on failure        | Same as above, alternative CI approach                |
| **Web**     | `jest-axe` in Vitest           | Unit test assertions: `expect(container).toHaveNoViolations()`         | Per-component fine-grained checks                     |
| **iOS**     | `performAccessibilityAudit()`  | XCUITest suite, auto-fails on violations (Xcode 15+)                   | Missing labels, clipped text, contrast, Dynamic Type  |
| **Android** | `AccessibilityChecks.enable()` | Espresso/Compose test setup, auto-fails                                | Content descriptions, touch targets, contrast         |
| **Web**     | Chromatic Accessibility        | Visual regression with a11y annotations                                | Color contrast in real rendered screenshots           |

**CI gate rule:** Any PR that introduces an axe-core / `performAccessibilityAudit` / `AccessibilityChecks` failure is blocked from merge.

### 9.3 Component Test Requirements

Every component must have:

- Rendering tests (all variants, sizes, states)
- Accessibility audit (automated axe-core / platform equivalents)
- Keyboard navigation test (web)
- Screen reader compatibility (all platforms)
- Visual regression snapshot
- Props validation / type tests
- **RTL rendering test** (layout does not break in RTL mode)
- **Reduced motion test** (animations respect `prefers-reduced-motion`)

---

## 10. Documentation Strategy

### 10.1 Documentation Layers

1. **Storybook** (Web components): Interactive playground with controls, docs, accessibility panel
2. **Xcode Previews** (iOS): SwiftUI preview provider with all variants
3. **Compose Previews** (Android): `@Preview` annotated composables
4. **Documentation Site**: Astro/Docusaurus site with:
   - Getting started guides per platform
   - Token reference (auto-generated from Style Dictionary)
   - Component API reference (auto-generated from TypeScript/Swift/Kotlin types)
   - Design guidelines and usage patterns
   - Migration guides
5. **Figma Dev Mode**: Code Connect provides inline code snippets directly in Figma

### 10.2 Auto-Generated Documentation

- Token reference pages generated from Style Dictionary output
- Component API docs generated from TSDoc/Swift DocC/KDoc comments
- Storybook stories serve as living documentation
- Changelog via Changesets

---

## 11. CI/CD Pipeline

### 11.1 Workflow Overview

```
PR Created
  ├── Build all packages (turbo)
  ├── Run all tests (unit + a11y)
  ├── Lint + typecheck
  ├── Visual regression (Chromatic)
  ├── Bundle size check
  └── Code Connect validate (figma connect parse --dry-run)

Merge to main
  ├── Build + test (gate)
  ├── Changesets version check
  ├── Publish Code Connect to Figma (all platforms)
  └── Deploy Storybook + docs

Release (changeset publish)
  ├── npm publish (@kozmos/react, @kozmos/tokens)
  ├── Swift Package release tag
  ├── Maven/Gradle artifact publish
  └── CDN asset deployment
```

### 11.2 Monorepo Publishing Details

**Workspace protocol:**

- All internal references use `workspace:*` (e.g., `"@kozmos/tokens": "workspace:*"`)
- pnpm automatically replaces with actual version numbers during `pnpm publish`
- Changesets `linked` groups ensure `@kozmos/tokens` and `@kozmos/react` version in lockstep

**npm provenance & supply chain security:**

- Enable npm provenance via OIDC trusted publishing (GitHub Actions `id-token: write`)
- Published packages include signed provenance attestation linking to the exact commit
- `npm audit signatures` verifiable by consumers

**Cross-platform publish coordination:**

```
Changesets "Version Packages" PR merged
  ├── npm publish (parallel):
  │     ├── @kozmos/tokens
  │     ├── @kozmos/react
  │     └── @kozmos/icons
  ├── Swift Package release:
  │     └── git tag vX.Y.Z on ios branch → SPM resolves
  └── Maven/Gradle publish:
        └── ./gradlew publish to Maven Central / GitHub Packages
```

**Peer dependency strategy:**

- `react` and `react-dom` are peer dependencies: `"^18.0.0 || ^19.0.0"`
- `@kozmos/tokens` is a direct dependency of `@kozmos/react` (not peer)
- Shared dev dependencies hoisted to workspace root (TypeScript, ESLint, Prettier, Vitest)

**`publishConfig` in each package:**

```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true,
    "registry": "https://registry.npmjs.org"
  }
}
```

### 11.3 Token Sync Workflow

```
Figma Variables Updated (webhook/manual)
  ├── Fetch variables via Figma REST API
  ├── Generate W3C Design Token JSON
  ├── Run Style Dictionary build (web/ios/android)
  ├── Create PR with token changes
  ├── Visual regression on PR
  └── Auto-merge if no visual changes
```

---

## 12. Accessibility Requirements

### 12.1 Standards

- **WCAG 2.1 AA** compliance minimum (AAA where practical)
- **Section 508** compliance
- **EN 301 549** for European markets

### 12.2 Per-Platform Requirements

| Requirement         | Web                         | iOS                               | Android                           |
| ------------------- | --------------------------- | --------------------------------- | --------------------------------- |
| Keyboard navigation | Tab/Enter/Space/Arrow       | VoiceOver gestures                | TalkBack gestures                 |
| Focus indicators    | 2px ring, 3:1 contrast      | System focus ring                 | System focus ring                 |
| Color contrast      | 4.5:1 text, 3:1 UI          | 4.5:1 text, 3:1 UI                | 4.5:1 text, 3:1 UI                |
| Touch targets       | 44x44px minimum             | 44x44pt minimum                   | 48x48dp minimum                   |
| Motion              | `prefers-reduced-motion`    | Reduce Motion setting             | Animator duration scale           |
| Screen reader       | ARIA labels + roles         | `.accessibilityLabel`             | `contentDescription`              |
| Dynamic sizing      | `rem`-based, responsive     | Dynamic Type                      | `sp` units                        |
| RTL support         | `dir="rtl"` + logical props | `.environment(\.layoutDirection)` | `CompositionLocalLayoutDirection` |

---

## 13. Versioning & Release Strategy

### 13.1 Semantic Versioning

All packages follow SemVer independently:

- `@kozmos/tokens` - Token changes are MINOR if additive, MAJOR if removing/renaming
- `@kozmos/react` - Component API changes follow standard SemVer
- `KozmosUI` (Swift) - Tagged releases matching SemVer
- `kozmos-ui` (Kotlin) - Maven artifact versioning

### 13.2 Release Process

1. Developer creates PR with changes
2. Add changeset (`pnpm changeset`) describing the change
3. PR merged, Changesets bot creates "Version Packages" PR
4. Version PR merged triggers publish to npm/Swift/Maven
5. Code Connect auto-publishes to Figma

### 13.3 Breaking Changes Policy

- Minimum 1 minor version deprecation warning before removal
- Migration guide for every major version
- Codemods for every breaking change (see below)

### 13.4 Codemod Infrastructure

A `packages/codemods/` package provides automated migration transforms:

```
packages/codemods/
├── src/
│   ├── v1-to-v2/
│   │   ├── rename-variant-props.ts      # jscodeshift transform
│   │   ├── update-import-paths.ts
│   │   └── update-token-names.ts
│   └── v2-to-v3/
│       └── ...
├── __testfixtures__/                    # Input/output fixture pairs
│   ├── rename-variant-props.input.tsx
│   └── rename-variant-props.output.tsx
└── package.json
```

**Tooling:**

- **React/Web**: jscodeshift AST transforms for component prop renames, import path changes, token reference updates
- **CSS/Tokens**: Custom scripts for CSS variable renames (`--kozmos-old-name` → `--kozmos-new-name`)
- **iOS**: SwiftSyntax-based transforms (where applicable)
- **Android**: IntelliJ structural search/replace templates

**Invocation:**

```bash
npx @kozmos/codemods v1-to-v2 --path ./src
```

**CI requirement:** Every breaking change PR must include an accompanying codemod with fixture-based tests.

### 13.5 Changelog Communication Strategy

Changes must be communicated clearly to all consumers:

#### Automated Changelog Generation

Changesets generates `CHANGELOG.md` per package with:

- Version number and release date
- Grouped changes by type (Features, Fixes, Breaking Changes)
- Links to PRs and issues
- Migration notes for breaking changes

#### Communication Channels

| Audience             | Channel                                     | Frequency                 |
| -------------------- | ------------------------------------------- | ------------------------- |
| **All developers**   | GitHub Releases + CHANGELOG.md              | Every release             |
| **Breaking changes** | Email to SDK consumers + Slack announcement | Major versions            |
| **Design team**      | Figma comment on affected components        | When Code Connect updated |
| **SDK consumers**    | Dedicated migration guide + office hours    | Major versions            |

#### Release Notes Structure

```markdown
## @kozmos/react v2.0.0 (2025-03-15)

### Breaking Changes

- **Button**: `type` prop renamed to `variant` (#123)
  - Migration: Run `npx @kozmos/codemods v1-to-v2`

### Features

- **Dialog**: New compound component pattern (#145)
- **Tokens**: Added wide gamut color support (#156)

### Fixes

- **Input**: Fixed focus ring in Safari (#134)
```

#### Deprecation Notices

Components/props scheduled for removal include:

1. Console warning in development mode
2. TypeScript `@deprecated` JSDoc tag
3. Storybook deprecation banner
4. Removal timeline in changelog

### 13.6 Production Incident Response

> **Full document:** [.ai-skills/incident-playbook.md](./.ai-skills/incident-playbook.md)

When a released component breaks production, follow the incident playbook:

#### Severity Levels

| Level  | Definition                           | Response SLA      | Resolution SLA |
| ------ | ------------------------------------ | ----------------- | -------------- |
| **P0** | Production down, no workaround       | 15 min            | 2 hours        |
| **P1** | Significant break, workaround exists | 1 hour            | 24 hours       |
| **P2** | Edge case break, simple workaround   | 4 hours           | Next sprint    |
| **P3** | Cosmetic/minor issue                 | Next business day | Backlog        |

#### Hotfix Process

1. **Acknowledge** within SLA (Slack + GitHub issue)
2. **Triage** — reproduce, identify root cause
3. **Decision** — fix forward (< 2 hours) or rollback
4. **Hotfix branch** — from release tag, expedited review
5. **Publish patch** — immediate npm/SPM/Maven release
6. **Notify consumers** — GitHub issue update + Slack
7. **Post-mortem** — within 48 hours for P0/P1

#### Rollback Process

```bash
# Deprecate broken version
npm deprecate @kozmos/react@1.2.3 "Critical bug - use 1.2.2 or 1.2.4"

# Never re-use version numbers — publish fix as next patch
```

---

## 14. Performance Budgets

| Metric                         | Target         |
| ------------------------------ | -------------- |
| `@kozmos/react` full bundle    | < 50KB gzipped |
| Individual component           | < 10KB gzipped |
| Token CSS file                 | < 5KB gzipped  |
| First paint (component render) | < 16ms         |
| Style Dictionary build         | < 5s           |
| Code Connect publish           | < 30s          |
| iOS framework size             | < 2MB          |
| Android AAR size               | < 1MB          |

---

## 15. Security & Supply Chain

### 15.1 Component Security

- All components sanitize rendered content (XSS prevention)
- No unsafe HTML rendering without explicit opt-in
- Input components validate/sanitize by default
- CSP-compatible (no inline styles via `style` attribute in production)
- No sensitive data in tokens or generated code

### 15.2 Supply Chain Security

| Measure             | Tool                                      | Stage           |
| ------------------- | ----------------------------------------- | --------------- |
| Dependency scanning | `npm audit` / Dependabot / Socket.dev     | CI + weekly     |
| npm provenance      | OIDC trusted publishing                   | Release         |
| Package integrity   | npm `--provenance` flag, SLSA attestation | Release         |
| Lock file integrity | `pnpm install --frozen-lockfile` in CI    | CI              |
| License compliance  | `license-checker` / FOSSA                 | CI              |
| Secret detection    | `gitleaks` / GitHub secret scanning       | CI + pre-commit |
| SBOM generation     | `cyclonedx-npm` or `spdx-sbom-generator`  | Release         |

### 15.3 Figma Token Security

- `FIGMA_ACCESS_TOKEN` stored as GitHub Actions secret (never in code)
- Token sync scripts run in CI only — no local `.env` files committed
- Figma API calls scoped to read-only where possible
- Code Connect publish tokens scoped to specific Figma files

---

## 16. Internationalization

### 16.1 RTL Support

- CSS logical properties (`margin-inline-start` instead of `margin-left`)
- SwiftUI `.environment(\.layoutDirection, .rightToLeft)`
- Compose `CompositionLocalLayoutDirection`
- Mirrored icons where semantically appropriate

### 16.2 Localization-Ready

- All user-facing strings externalized (not hardcoded)
- Number/date/currency formatting via `Intl` (web) / `Foundation` (iOS) / `java.text` (Android)
- Pluralization support
- Content overflow handling for translated text (length expansion in languages like German/Finnish)

---

## 17. Migration Path from Existing Implementations

### From `kozmos-design-system` (Stitches-based):

1. Extract token definitions from `packages/tokens/src/foundations/` (reuse as-is)
2. Extract Figma sync logic from `packages/tokens/src/figma/` (adapt for new pipeline)
3. Migrate Stitches theme config to CSS custom properties (token values already defined)
4. Convert Stitches styled components to CVA-based components
5. Port Storybook stories (minimal changes needed)

### From `_kozmos-design-system` (styled-components):

1. Adopt Style Dictionary config from `packages/tokens/style-dictionary.config.js` (proven multi-platform)
2. Reference component implementations (Button, TextInput, Layout, Typography) for API design
3. Port touch event delegation pattern for mobile web
4. Adapt polymorphic component pattern
5. Reference Storybook story patterns

### Consolidation Priority:

1. Token system (merge both approaches into Style Dictionary + Figma Variables API)
2. Component APIs (best of both, standardize on CVA pattern)
3. Build tooling (Turborepo + pnpm + tsup from primary)
4. Testing (expand from primary's Jest setup)
5. Documentation (Storybook from both, new docs site)

---

## 18. Project Phases & Deliverables

> **Platform scope:** React, Vue (Web Components), iOS (SwiftUI), Android (Compose), React Native — 5 platforms + Code Connect for each

### Phase 1: Foundation (Tokens + Infrastructure)

**Deliverables:**

- [ ] Monorepo setup (Turborepo + pnpm)
- [ ] Token package with Style Dictionary (web/ios/android/react-native outputs)
- [ ] **Wide gamut color support (P3/oklch)** — Phase 1 priority
- [ ] Figma Variables API sync script
- [ ] W3C DTCG format JSON schema
- [ ] CI pipeline (build, test, lint) with GitHub-hosted macOS runners
- [ ] Base React package structure (`@kozmos/react`)
- [ ] Base Vue/Web Components package structure (`@kozmos/vue`)
- [ ] Base iOS Swift Package structure (`KozmosUI`)
- [ ] Base Android Gradle module structure (`kozmos-ui`)
- [ ] Base React Native package structure (`@kozmos/react-native`)
- [ ] Figma Code Connect configuration (all 5 platforms)
- [ ] Shared ESLint/Prettier/TypeScript configs
- [ ] **Customer theming API** (brand color, bg/fg, emotional colors)

### Phase 2: Core Components (React-first, then parallel platform implementation)

**Deliverables:**

- [ ] ThemeProvider with white-label support (all 5 platforms)
- [ ] Layout primitives: Box, Stack, Grid (all platforms)
- [ ] Typography: Text, Heading (all platforms)
- [ ] Button with all variants (all platforms)
- [ ] Icon system with cross-platform generation
- [ ] Code Connect files for all Phase 2 components (React, Vue, SwiftUI, Compose, RN)
- [ ] Storybook with all components
- [ ] Unit + accessibility tests for all components
- [ ] Xcode Previews for all iOS components
- [ ] Compose Previews for all Android components
- [ ] React Native component previews (Storybook Native or Expo)

### Phase 3: Form & Interactive Components + SDK Integration

**Deliverables:**

- [ ] Input, Checkbox, Radio, Select, Switch (all platforms)
- [ ] Toast/Snackbar, Dialog/Modal (all platforms)
- [ ] Tooltip, Popover (web + native equivalents)
- [ ] Tabs, Accordion (all platforms)
- [ ] Badge, Avatar, Card, Chip/Tag (all platforms)
- [ ] Progress, Skeleton (all platforms)
- [ ] Visual regression testing (Chromatic + native snapshots)
- [ ] Documentation site v1
- [ ] Code Connect for all Phase 3 components
- [ ] npm/SPM/Maven first stable release (v1.0.0)
- [ ] **SDK layout module integration** (search, search results consume `@kozmos/*`)
- [ ] Contract testing setup (Pact)

### Phase 4: Advanced & SDK-Specific

**Deliverables:**

- [ ] DataTable, Navigation, Sidebar, Breadcrumb, Pagination
- [ ] Calendar/DatePicker, Autocomplete, FileUpload, Stepper
- [ ] Pointr SDK-specific components (MapView, WayfindingCard, FloorSelector, etc.)
- [ ] Animation system with cross-platform parity
- [ ] Advanced theming (multi-brand support)
- [ ] Performance optimization pass
- [ ] Full documentation site with search
- [ ] Adoption metrics and analytics

---

## 19. Technical Dependencies

### Root / Build

| Dependency        | Version | Purpose                      |
| ----------------- | ------- | ---------------------------- |
| `turbo`           | ^2.x    | Monorepo build orchestration |
| `pnpm`            | ^9.x    | Package manager              |
| `typescript`      | ^5.x    | Type system                  |
| `@changesets/cli` | ^2.x    | Version management           |
| `husky`           | ^9.x    | Git hooks                    |
| `lint-staged`     | ^15.x   | Pre-commit linting           |

### Tokens Package

| Dependency             | Version | Purpose                         |
| ---------------------- | ------- | ------------------------------- |
| `style-dictionary`     | ^4.x    | Multi-platform token generation |
| `@figma/rest-api-spec` | latest  | Figma API types                 |
| `dotenv`               | ^16.x   | Environment variables           |

### React Package

| Dependency                 | Version | Purpose                |
| -------------------------- | ------- | ---------------------- |
| `react`                    | ^18.x   | UI framework           |
| `class-variance-authority` | ^0.7.x  | Variant management     |
| `clsx`                     | ^2.x    | Class name composition |
| `tailwind-merge`           | ^2.x    | Tailwind class dedup   |
| `tsup`                     | ^8.x    | Build/bundle           |
| `@figma/code-connect`      | latest  | Figma Code Connect     |

### React Dev/Test

| Dependency               | Version | Purpose               |
| ------------------------ | ------- | --------------------- |
| `vitest`                 | ^2.x    | Unit testing          |
| `@testing-library/react` | ^16.x   | Component testing     |
| `@storybook/react-vite`  | ^8.x    | Documentation         |
| `chromatic`              | latest  | Visual regression     |
| `axe-core`               | ^4.x    | Accessibility testing |

### iOS Package

| Dependency                  | Version | Purpose          |
| --------------------------- | ------- | ---------------- |
| Swift 5.9+                  | -       | Language         |
| SwiftUI                     | iOS 16+ | UI framework     |
| `@figma/code-connect` (npm) | latest  | Code Connect CLI |

### Android Package

| Dependency                  | Version | Purpose          |
| --------------------------- | ------- | ---------------- |
| Kotlin 1.9+                 | -       | Language         |
| Jetpack Compose BOM         | 2024.x  | UI framework     |
| `@figma/code-connect` (npm) | latest  | Code Connect CLI |

---

## 20. Figma Organization Requirements

### 19.1 Figma File Structure

```
Pointr Design System (Figma)
├── Foundations
│   ├── Colors (Figma Variables: collection "Colors")
│   ├── Typography (Figma Variables: collection "Typography")
│   ├── Spacing (Figma Variables: collection "Spacing")
│   ├── Elevation (Figma Variables: collection "Elevation")
│   └── Icons (component set)
├── Components
│   ├── Button (component set with variants)
│   ├── Input (component set with variants)
│   ├── Checkbox / Radio / Switch
│   ├── Card
│   ├── Dialog
│   ├── Toast
│   └── ... (all components)
├── Patterns
│   ├── Form layouts
│   ├── Navigation patterns
│   └── Page templates
└── SDK Components
    ├── Map components
    ├── Wayfinding components
    └── Search components
```

### 19.2 Figma Variable Collections

| Collection   | Modes       | Purpose                                   |
| ------------ | ----------- | ----------------------------------------- |
| `Colors`     | Light, Dark | Semantic color tokens with mode switching |
| `Typography` | Default     | Font sizes, weights, line heights         |
| `Spacing`    | Default     | Spacing scale                             |
| `Radius`     | Default     | Border radius scale                       |
| `Elevation`  | Light, Dark | Shadows (mode-aware)                      |

### 19.3 Naming Convention (Figma to Code)

Figma Variables use `/` separators. Code uses `.` or camelCase:

| Figma Variable              | CSS Variable                  | Swift                                  | Kotlin                                 |
| --------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------- |
| `color/background/primary`  | `--color-background-primary`  | `KozmosTokens.colorBackgroundPrimary`  | `KozmosTokens.colorBackgroundPrimary`  |
| `color/interactive/primary` | `--color-interactive-primary` | `KozmosTokens.colorInteractivePrimary` | `KozmosTokens.colorInteractivePrimary` |
| `space/400`                 | `--space-400`                 | `KozmosTokens.space400`                | `KozmosTokens.space400`                |
| `font/size/300`             | `--font-size-300`             | `KozmosTokens.fontSize300`             | `KozmosTokens.fontSize300`             |

### 19.4 Figma Component Naming for Code Connect

Figma component and property names must map cleanly to code. Follow these conventions:

#### Component Naming

| Figma Name                  | Code Connect Target | Notes                                           |
| --------------------------- | ------------------- | ----------------------------------------------- |
| `Button`                    | `Button`            | Match exactly                                   |
| `Icon Button`               | `IconButton`        | Space → PascalCase                              |
| `Text Input`                | `Input`             | Simplify for code; map via Code Connect         |
| `.Button/Primary` (variant) | Use `variant` prop  | Dot prefix = internal, slash = variant grouping |

#### Property Naming

| Figma Property                                 | Code Connect Mapping                                    | Type                     |
| ---------------------------------------------- | ------------------------------------------------------- | ------------------------ |
| `Variant` (enum: Primary, Secondary, Outlined) | `figma.enum("Variant", {...})`                          | String literal union     |
| `Size` (enum: Small, Medium, Large)            | `figma.enum("Size", { Small: "sm", ... })`              | Abbreviated in code      |
| `Disabled` (boolean)                           | `figma.boolean("Disabled")`                             | Direct map               |
| `Show Icon` (boolean)                          | `figma.boolean("Show Icon")`                            | Controls slot visibility |
| `Label` (text)                                 | `figma.string("Label")` or `figma.textContent("Label")` | Content                  |
| `Icon` (instance swap)                         | `figma.instance("Icon")`                                | Nested component         |

#### Boolean Property Values

Figma booleans normalize various truthy/falsy strings:

| Figma Value          | Normalized Code Value |
| -------------------- | --------------------- |
| `Yes`, `True`, `On`  | `true`                |
| `No`, `False`, `Off` | `false`               |

Use `figma.boolean()` — it handles all these automatically.

#### Nested Instances

For components containing other components (e.g., Button with Icon):

```tsx
// Figma: Button with "Leading Icon" instance swap slot
props: {
  leadingIcon: figma.instance("Leading Icon"),
  trailingIcon: figma.instance("Trailing Icon"),
}
```

#### Variant Grouping Best Practices

1. **Use consistent property names** across all components (Variant, Size, State, Disabled)
2. **Avoid deeply nested variants** — prefer flat enum properties over slash-separated names
3. **Boolean properties** for binary states (Disabled, Loading, Selected)
4. **Enum properties** for multi-option states (Variant, Size, State)
5. **Instance swaps** for slotted content (Icon, Avatar, Badge)

---

## 21. Success Criteria

| Metric                | Target                                    | Measurement                      |
| --------------------- | ----------------------------------------- | -------------------------------- |
| Token parity          | 100% Figma to Code match                  | Automated drift detection CI     |
| Component coverage    | All Phase 1-2 components on all platforms | Component inventory audit        |
| Code Connect coverage | Every Figma component has code snippets   | `figma connect parse` validation |
| Accessibility         | WCAG 2.1 AA pass                          | axe-core + manual audit          |
| Bundle size           | < 50KB React core                         | `bundlesize` CI check            |
| Test coverage         | > 80% line coverage                       | Vitest/XCTest/JUnit reports      |
| Documentation         | Every component documented                | Storybook + docs site audit      |
| Dev adoption          | SDK teams using the system                | Usage analytics                  |
| Design-dev handoff    | Reduction in implementation questions     | Survey / ticket tracking         |

---

## 22. Developer Experience & CLI Tooling

### 21.1 Component Scaffolding Generator

Creating a new component requires 7+ files across 3 platforms. A Plop.js (or custom Node.js) generator scaffolds the full boilerplate:

```bash
pnpm create-component Button
```

**Generated files:**

```
packages/react/src/components/Button/
  ├── Button.tsx               # Component implementation
  ├── Button.stories.tsx       # Storybook story
  ├── Button.test.tsx          # Vitest test with axe-core
  ├── Button.figma.tsx         # Code Connect mapping (placeholder URL)
  └── index.ts                 # Barrel export

packages/ios/Sources/KozmosUI/Components/
  ├── KozmosButton.swift       # SwiftUI component
  └── KozmosButton.figma.swift # Code Connect mapping

packages/android/kozmos-ui/src/main/kotlin/components/
  ├── KozmosButton.kt          # Compose component
  └── KozmosButton.figma.kt    # Code Connect mapping
```

**Templates include:**

- Pre-filled variant/size pattern matching the design system conventions
- Storybook story with Controls args for all props
- Vitest test with `toHaveNoViolations()` axe assertion
- Code Connect file with `figma.enum`, `figma.boolean`, `figma.string` boilerplate
- SwiftUI `@FigmaEnum` / `@FigmaBoolean` macro boilerplate
- Compose `@FigmaConnect` / `@FigmaProperty` annotation boilerplate

### 21.2 Development Scripts

| Command                        | Description                            |
| ------------------------------ | -------------------------------------- |
| `pnpm dev`                     | Start all packages in watch mode       |
| `pnpm storybook`               | Launch Storybook dev server            |
| `pnpm create-component <Name>` | Scaffold new component (all platforms) |
| `pnpm sync-tokens`             | Pull latest tokens from Figma          |
| `pnpm build-tokens`            | Run Style Dictionary build             |
| `pnpm figma:validate`          | Validate all Code Connect files        |
| `pnpm figma:publish`           | Publish Code Connect to Figma          |
| `pnpm test`                    | Run all tests                          |
| `pnpm test:a11y`               | Run accessibility tests only           |
| `pnpm lint`                    | Lint all packages                      |
| `pnpm typecheck`               | TypeScript type checking               |
| `pnpm bundle-size`             | Check bundle size budgets              |
| `pnpm migrate <from> <to>`     | Run codemods for version migration     |

### 21.3 VS Code / Cursor Integration

- Workspace recommended extensions (`.vscode/extensions.json`)
- Debug configurations for Storybook and Vitest
- Code snippets for component patterns (`kozmos-component`, `kozmos-story`, `kozmos-figma`)
- Task definitions for common scripts

---

## 23. Figma MCP Server & AI-Assisted Development

### 22.1 How Code Connect Powers AI Code Generation

Figma's **MCP (Model Context Protocol) Server** enables AI agents (Cursor, GitHub Copilot and others) to read Figma designs and generate code. When Code Connect is published, the MCP server provides AI agents with:

1. The actual component API and import paths (not hallucinated ones)
2. Correct prop names, variant values, and composition patterns
3. Production-tested code examples directly from the design system

**Flow:**

```
Designer selects component in Figma
        │
        ▼
AI agent queries Figma MCP server
        │
        ▼
MCP returns Code Connect snippets + component metadata
        │
        ▼
AI generates code using real design system API
        │
        ▼
Developer gets accurate, production-ready code
```

### 22.2 Integration with Development Workflow

- **Cursor and similar assistants**: Configure Figma MCP server in `.cursor/mcp.json` or assistant config
- **Code generation accuracy**: Code Connect reduces hallucinated prop names and incorrect imports
- **Design-to-code**: Developers can paste Figma URLs and get accurate component code
- **Prototype generation**: AI can compose multiple components following real API patterns

### 22.3 Requirements for MCP Compatibility

- Every component must have a published Code Connect mapping
- Import paths in `figma.config.json` must match the actual published npm package paths
- Props in Code Connect must exactly mirror the component's TypeScript interface
- Keep Code Connect files updated whenever component APIs change (enforce via CI)

---

## 24. Governance & Contribution Model

### 24.1 Contribution Workflow

```
Proposal → RFC → Design Review → Implementation → Code Review → Release
```

**RFC process:**

1. Contributor opens an RFC issue using the template
2. RFC describes: use case, API proposal, Figma component requirements, platform parity
3. Design system team reviews within 1 sprint
4. Approved RFCs enter the backlog with priority assignment

### 24.2 Component Lifecycle

> **Full document:** [.ai-skills/component-lifecycle.md](./.ai-skills/component-lifecycle.md)

Components move through a defined lifecycle with clear ownership and exit criteria:

```
PROPOSAL → DRAFT → BETA → STABLE → DEPRECATED → REMOVED
(1-2 wk)   (2-4 wk) (4-8 wk) (indefinite) (2 minor vers)
```

| Stage      | npm Tag       | Production Safe? | API Stable? |
| ---------- | ------------- | ---------------- | ----------- |
| Proposal   | N/A           | No               | No          |
| Draft      | `@alpha`      | No               | No          |
| Beta       | `@beta`       | Caution          | Mostly      |
| Stable     | `@latest`     | Yes              | Yes         |
| Deprecated | `@deprecated` | Migrate          | Frozen      |

**Minimum time to Stable:** ~14 weeks (3.5 months)
**Deprecation period:** 2 minor versions (~3-4 months)

### 24.3 Component Maturity Model

| Status         | Meaning                                          | Dev Mode Label     |
| -------------- | ------------------------------------------------ | ------------------ |
| **Draft**      | Under active development, API unstable           | `@alpha` / `@beta` |
| **Beta**       | Feature complete, gathering feedback             | `@beta`            |
| **Stable**     | Production ready, SemVer guarantees              | `@latest`          |
| **Deprecated** | Scheduled for removal, migration guide available | `@deprecated`      |

### 24.4 Ownership Model

- **Core team**: Owns tokens, ThemeProvider, build infrastructure, CI/CD, Code Connect publishing
- **Platform leads**: Own platform-specific implementations (React lead, iOS lead, Android lead)
- **Contributors**: Submit RFCs, implement approved components, fix bugs
- **Design team**: Owns Figma source files, variables, component designs

### 24.5 Review Requirements

| Change Type          | Required Reviews                          |
| -------------------- | ----------------------------------------- |
| Token changes        | Design lead + Core team                   |
| New component        | Platform lead + Core team + Design review |
| Component API change | Platform lead + 1 other                   |
| Code Connect update  | Platform lead                             |
| Infrastructure / CI  | Core team                                 |
| Documentation        | 1 reviewer                                |

---

## 25. Adoption Analytics & Telemetry

### 25.1 What to Measure

| Category                  | Metric                                                  | Tool                                   |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| **Package adoption**      | npm downloads, install counts                           | npm stats API                          |
| **Component usage**       | Which components are imported in consuming codebases    | Static import analysis (custom script) |
| **Code Connect coverage** | % of Figma components with code snippets                | `figma connect parse` report           |
| **Token coverage**        | % of hardcoded values vs. token usage in consuming code | Custom ESLint rule / stylelint         |
| **Figma adoption**        | Component insertion analytics in Figma                  | Figma Analytics API                    |
| **Bundle impact**         | Bundle size contribution in consuming apps              | `source-map-explorer`                  |
| **Design-dev velocity**   | Time from Figma design to code PR                       | Jira/Linear ticket tracking            |
| **Visual consistency**    | Pixel-level design system coverage in production UI     | Percy / Chromatic visual analysis      |

### 25.2 Design System Health Dashboard

A lightweight dashboard (deployed alongside the docs site) aggregating:

- Token drift status (last Figma sync, any mismatches)
- Component inventory (implemented vs. designed, per platform)
- Code Connect publication status (which components are published)
- Test coverage per package
- Bundle size trends
- npm download trends
- Open issues / RFCs in progress

### 25.3 Deprecation Analytics

Before deprecating a component, measure actual usage:

- Static import analysis across consuming repositories
- Figma insertion analytics (how often is the component used in designs)
- Set deprecation threshold: components used in <2 consuming projects can be deprecated faster

---

## 26. Multi-Brand / White-Label Theming

> **Status:** ✅ CONFIRMED REQUIREMENT — Pointr currently supports customer white-labeling with configurable theme color, background/foreground colors, and emotional colors.

### 26.1 Theming Architecture

Pointr supports customer-specific branding with the following customizable tokens:

```
Base Tokens (Kozmos defaults)
    │
    ▼
Brand Override Layer (customer-specific)
    │
    ▼
Theme Mode Layer (light/dark)
    │
    ▼
Final Resolved Tokens
```

**Web implementation:**

```css
/* Base theme (Kozmos defaults) */
:root {
  --kozmos-color-brand-primary: #2563eb;
}

/* Customer override (loaded via separate stylesheet or JS) */
[data-brand="customer-a"] {
  --kozmos-color-brand-primary: #e11d48;
}

/* Mode layer */
[data-brand="customer-a"][data-theme="dark"] {
  --kozmos-color-background-primary: #1a1a2e;
}
```

**iOS implementation:**

```swift
struct KozmosBrand {
    let primaryColor: Color
    let secondaryColor: Color
    // ... all overridable tokens
}

KozmosTheme(brand: .customerA) {
    ContentView()
}
```

**Android implementation:**

```kotlin
KozmosTheme(brand = KozmosBrand.CustomerA) {
    Content()
}
```

### 26.2 Brand Configuration File

```json
{
  "$type": "brand",
  "name": "Customer A",
  "extends": "kozmos-default",
  "overrides": {
    "color.brand.primary": "#e11d48",
    "color.brand.secondary": "#9333ea",
    "font.family.heading": "Customer Sans"
  }
}
```

Style Dictionary processes brand files as overlay layers, generating platform-specific brand themes.

### 26.3 Customer-Configurable Tokens (Current Support)

Based on existing Pointr SDK theming capabilities:

| Token Category       | Description             | Example                                                     |
| -------------------- | ----------------------- | ----------------------------------------------------------- |
| **Theme Color**      | Primary brand color     | `color.brand.primary`                                       |
| **Background Color** | Surface/background      | `color.background.primary`                                  |
| **Foreground Color** | Text/icon on background | `color.text.primary`                                        |
| **Emotional Colors** | Status/feedback colors  | `color.status.success`, `.error`, `.warning`, `.info` (TBC) |

**API Design (TBD based on Question #18):**

```typescript
// Web
<KozmosThemeProvider
  theme={{
    brandColor: '#e11d48',
    backgroundColor: '#ffffff',
    foregroundColor: '#1a1a1a',
    emotionalColors: {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
  }}
>
  <App />
</KozmosThemeProvider>
```

```swift
// iOS
KozmosTheme(
    brandColor: Color(hex: "#e11d48"),
    backgroundColor: .white,
    foregroundColor: Color(hex: "#1a1a1a")
) {
    ContentView()
}
```

```kotlin
// Android
KozmosTheme(
    brandColor = Color(0xFFE11D48),
    backgroundColor = Color.White,
    foregroundColor = Color(0xFF1A1A1A)
) {
    Content()
}
```

---

## 27. Confirmed Additional Platforms

### 27.1 Vue.js Support (via Web Components)

> **Status:** ✅ CONFIRMED — Vue support required

**Architecture:** Lit-based Web Components with Vue 3 wrappers

```
packages/vue/
├── src/
│   ├── components/           # Lit Web Components (framework-agnostic)
│   │   ├── kozmos-button.ts
│   │   ├── kozmos-input.ts
│   │   └── ...
│   └── vue-wrappers/         # Vue 3 component wrappers
│       ├── KozmosButton.vue
│       ├── KozmosInput.vue
│       └── ...
├── figma.config.json         # --label "Vue"
└── package.json              # @kozmos/vue
```

**Key decisions:**

- Lit (5KB base) for standards-based custom elements
- Web Components work in any framework (Vue, Angular, Svelte, plain HTML)
- Vue wrappers provide idiomatic Vue 3 DX (props, events, v-model)
- Shares tokens with React package (CSS variables)
- Code Connect shows Vue code in Figma Dev Mode

**Vue component usage:**

```vue
<template>
  <KozmosButton variant="primary" @click="handleClick"> Click me </KozmosButton>
</template>

<script setup>
import { KozmosButton } from "@kozmos/vue";
</script>
```

### 27.2 React Native

> **Status:** ✅ CONFIRMED — React Native support required

**Architecture:** Dedicated React Native package sharing token values

```
packages/react-native/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx      # Uses StyleSheet, not CSS
│   │   │   └── Button.test.tsx
│   │   └── ...
│   ├── tokens/
│   │   └── index.ts            # Token values as JS (no CSS vars)
│   └── theme/
│       └── ThemeProvider.tsx   # React Context-based theming
├── *.figma.tsx                 # Code Connect (--label "React Native")
└── package.json                # @kozmos/react-native
```

**Key decisions:**

- Uses React Native's `StyleSheet` API (no CSS)
- Tokens exported as JS objects (same values as other platforms)
- Animation via `Animated` API or Reanimated (consistent with token durations/easings)
- Code Connect with `--label "React Native"` shows RN code in Figma Dev Mode
- Shares component API signatures with React where possible

**React Native component example:**

```tsx
import { Button } from "@kozmos/react-native";

<Button variant="primary" onPress={handlePress}>
  Press me
</Button>;
```

### 27.3 Future Considerations

#### Module Federation / Micro-Frontend

For live-updating design system components across independently deployed dashboards:

- Module Federation 2.0 (standalone runtime, not Webpack-coupled)
- Zero-runtime CSS approach makes federation simpler than CSS-in-JS
- Consider only if Pointr's dashboard architecture requires runtime-shared modules

### 27.4 Design System as a Service

Advanced capabilities for scale:

- Token API: REST endpoint serving current token values for non-JS consumers
- Component CDN: Pre-built UMD bundles for legacy integration
- Figma widget: Custom Figma widget for token/component browsing (alternative to Code Connect UI)

---

## 28. Decisions Made

The following questions have been resolved:

| #   | Question                         | Decision                                            | Notes                                                    |
| --- | -------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| 1   | **Figma plan tier**              | ✅ **Organisation**                                 | Code Connect enabled, proceed with Phase 1               |
| 2   | **Styling approach**             | ✅ **CSS Variables + CVA**                          | Zero runtime, best for SDK                               |
| 3   | **Icon source**                  | ✅ **Custom SVG with platform mappings**            | Consistent cross-platform                                |
| 4   | **Token authoring tool**         | ✅ **Figma Variables + Tokens Studio**              | Tokens Studio for composites                             |
| 5   | **SDK component boundary**       | ✅ **SDK uses Kozmos as dependency**                | Layout modules (search, results) consume `@kozmos/react` |
| 6   | **Multi-brand / white-labeling** | ✅ **Yes, required**                                | Currently supports theme color, bg/fg, emotional colors  |
| 7   | **Vue.js support**               | ✅ **Yes, via Web Components**                      | Lit-based layer per Section 28.1                         |
| 8   | **React Native**                 | ✅ **Yes, add `packages/react-native/`**            | 4th platform alongside native iOS/Android                |
| 9   | **CI runner infrastructure**     | ✅ **GitHub-hosted macos-latest**                   | Re-evaluate if costs exceed budget                       |
| 10  | **Team resourcing**              | ✅ **Minimum viable team**                          | 1 React, 1 iOS, 1 Android, 1 Design                      |
| 11  | **Figma MCP adoption**           | ✅ **Yes, invest in completeness**                  | Primary AI-assisted workflow                             |
| 12  | **npm scope**                    | ✅ **`@kozmos` by Pointr Design**                   | Branding decision finalized                              |
| 13  | **Wide gamut colors**            | ✅ **Phase 1 priority**                             | Include P3/oklch from start                              |
| 14  | **Animation library**            | ✅ **CSS-only for SDK, cross-platform consistency** | See Section 28.1 below                                   |
| 15  | **Contract testing**             | ✅ **Phase 3**                                      | Implement Pact as consumer base grows                    |
| 16  | **Figma branching**              | ✅ **Use branching**                                | For breaking changes                                     |
| 17  | **Error tracking**               | ✅ **Callback prop pattern**                        | Let SDK consumers choose service                         |

### 28.1 Animation Strategy Decision

To ensure **consistency across all products** (Web SDK, Mobile Native SDKs, Dashboard, React Native):

**Decision:** Use **CSS custom properties for animation tokens** consumed by each platform's native animation system:

| Platform              | Animation System           | Token Consumption                  |
| --------------------- | -------------------------- | ---------------------------------- |
| **Web (React)**       | CSS transitions/animations | `var(--kozmos-motion-*)`           |
| **Web (Vue)**         | CSS transitions/animations | Same CSS variables                 |
| **iOS (SwiftUI)**     | SwiftUI `.animation()`     | `KozmosTokens.motion*`             |
| **Android (Compose)** | Compose `animate*()`       | `KozmosTokens.motion*`             |
| **React Native**      | `Animated` / Reanimated    | Shared JS token values             |
| **Dashboard**         | Optional Framer Motion     | Falls back to CSS if not installed |

This ensures:

1. Token values are consistent across all platforms
2. Each platform uses its native, performant animation system
3. Dashboard apps can optionally enhance with Framer Motion
4. SDK stays lightweight (no JS animation library bundled)

---

## 29. Additional Questions — RESOLVED

| #   | Question                           | Decision                                                                                                                       |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 18  | **Current theming implementation** | ✅ Custom implementation per SDK using design team color tokens. **Breaking change acceptable** — clean slate with new naming. |
| 19  | **Emotional colors definition**    | ✅ Status colors: **Danger, Success, Alert, Info** (maps to `color.status.*`)                                                  |
| 20  | **Vue.js timeline**                | ✅ **Phase 2** — unless it impacts fundamentals (it won't; Web Components are additive)                                        |
| 21  | **React Native scope**             | ✅ **Comprehensive subset** — not 100% parity, but covers most components                                                      |
| 22  | **SDK layout modules**             | ✅ See Section 29.1 below for full module inventory                                                                            |
| 23  | **Existing SDK package names**     | ✅ **Not on public registries** — enterprise software. Goal: Pointr-first, potentially open source later.                      |
| 24  | **Dashboard tech stack**           | ✅ **Vue 2 → Vue 3 migration needed**. Dashboard must use Kozmos Vue components.                                               |
| 25  | **P3 color usage**                 | ✅ **All colors** — wide gamut for entire palette                                                                              |
| 26  | **Existing design tokens**         | ✅ **Fresh start preferred**, use existing as reference. Design files TBD (provide existing or create new).                    |
| 27  | **Backward compatibility**         | ✅ **Breaking change acceptable** — clean API design                                                                           |

### 29.1 Pointr SDK Module Inventory

Based on the SDK architecture, Kozmos must support these modules:

#### Map Widget Modules

| Module                 | Description                   | Priority |
| ---------------------- | ----------------------------- | -------- |
| **Search Panel**       | Search input + quick access   | P1       |
| **Quick Access Panel** | Frequently accessed items     | P1       |
| **Search Results**     | List of search results        | P1       |
| **Filtering**          | Category/attribute filters    | P1       |
| **POI Details Card**   | Point of interest information | P1       |
| **Map Component**      | Core map + sub-components     | P1       |
| **Info Component**     | Informational overlays        | P2       |
| **Settings Component** | User preferences              | P2       |
| **Overlays**           | Map overlay UI elements       | P1       |
| **AI Companion**       | AI-powered assistant UI       | P2       |

#### Wayfinding Modules

| Module                     | Description                   | Priority |
| -------------------------- | ----------------------------- | -------- |
| **Progress Module**        | Navigation progress indicator | P1       |
| **Directions (Expanded)**  | Full turn-by-turn list        | P1       |
| **Directions (Collapsed)** | Compact next-step view        | P1       |

#### Dashboard / CMS Modules

| Module              | Description            | Priority   |
| ------------------- | ---------------------- | ---------- |
| **Dashboard**       | Admin dashboard layout | P2 (Vue 3) |
| **Map Content CMS** | Content management     | P2 (Vue 3) |
| **Drawing Tools**   | Map editing tools      | P2 (Vue 3) |

### 29.2 Token Naming — Emotional/Status Colors

Based on your definition, the status color tokens will be:

```
color.status.danger    → Red tones (errors, destructive actions)
color.status.success   → Green tones (confirmations, completed)
color.status.alert     → Yellow/amber tones (warnings, caution)
color.status.info      → Blue tones (informational, neutral)
```

Each with hover/active/muted variants as needed.

### 29.3 Open Source Considerations

Since Kozmos may be open-sourced:

| Consideration       | Recommendation                                                        |
| ------------------- | --------------------------------------------------------------------- |
| **License**         | MIT (most permissive) or Apache 2.0 (patent protection)               |
| **Naming**          | `@kozmos/*` is generic enough for open source                         |
| **Branding**        | Remove Pointr-specific references from public package                 |
| **Documentation**   | Public docs site (Storybook + Docusaurus)                             |
| **Contribution**    | CONTRIBUTING.md, Code of Conduct, PR templates                        |
| **Pointr-specific** | Keep SDK modules (`packages/sdk/`) as private/separate repo initially |

### 29.4 Dashboard Vue 2 → Vue 3 Migration Path

The dashboard migration strategy:

1. **Phase 1**: Build `@kozmos/vue` with Vue 3 + Web Components
2. **Phase 2**: Dashboard team adopts Kozmos components incrementally
3. **Migration**: Replace custom Vue 2 components with Kozmos Vue 3 components
4. **Tooling**: Provide Vue 2 → Vue 3 migration guide for dashboard-specific patterns

---

## 30. Final Clarifying Questions — RESOLVED

| #   | Question                         | Decision                                                                                                          |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 28  | **Design files decision**        | ✅ **Start from scratch** — new Figma library                                                                     |
| 29  | **AI Companion UI**              | ✅ **Agentic AI chat** — voice + text, integrated with search, triggers map actions (show POIs, start wayfinding) |
| 30  | **Map Component sub-components** | ✅ Zoom controls, Attribution, Scale, Level/Floor Switcher, Compass, etc.                                         |
| 31  | **Drawing Tools complexity**     | ✅ **Full GeoJSON drawing tools** + annotation — complex component set                                            |
| 32  | **Offline-first requirement**    | ✅ See Section 30.1 below for recommendation                                                                      |
| 33  | **Localization languages**       | ✅ **Comprehensive i18n** — US, China, Taiwan, India, UAE, Turkey, Portugal, Spain, Germany, Japan, France, etc.  |
| 34  | **License preference**           | ✅ **MIT License**                                                                                                |

### 30.1 Offline Strategy Recommendation

Given that Pointr SDK operates in venues (airports, malls, hospitals) with potentially unreliable connectivity:

**Recommendation: Progressive Offline Support**

| Layer             | Offline Strategy                                                                     |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Design Tokens** | ✅ Fully offline — compiled into code                                                |
| **UI Components** | ✅ Fully offline — bundled assets                                                    |
| **Icons/Fonts**   | ✅ Fully offline — bundled in SDK                                                    |
| **Map Tiles**     | ⚡ Cached on first load, works offline after                                         |
| **POI Data**      | ⚡ Cached on first load, works offline after                                         |
| **Search**        | ⚡ Local search index cached, works offline                                          |
| **Wayfinding**    | ⚡ Route calculation can work offline if graph is cached                             |
| **AI Companion**  | 🌐 Requires connectivity (LLM API calls) — graceful degradation with offline message |

**Implementation:**

- All UI renders without network
- Data-dependent features show cached data or "offline" state
- AI Companion shows "Connect to internet for AI assistance" when offline
- Sync when connectivity returns

### 30.2 AI Companion Component Architecture

The AI Companion is a complex composite component:

```
AICompanion/
├── AICompanionProvider        # Context for AI state
├── AICompanionTrigger         # FAB or integrated button
├── AICompanionPanel           # Main chat panel
│   ├── AIMessageList          # Scrollable message history
│   │   ├── AIMessage          # AI response bubble
│   │   ├── UserMessage        # User message bubble
│   │   └── ActionCard         # Rich cards (POI list, route preview)
│   ├── AIInputBar             # Text input + voice button
│   │   ├── TextInput          # Text composition
│   │   ├── VoiceButton        # Push-to-talk / tap-to-speak
│   │   └── SendButton         # Submit action
│   └── AISuggestions          # Quick action chips
├── AIVoiceOverlay             # Full-screen voice interaction mode
└── AIMapIntegration           # Hooks for map actions (show POIs, start nav)
```

**Key interactions:**

- "Show me vegan restaurants in South Terminal" → Triggers map POI filter
- "Take me to my car" → Starts wayfinding to saved location
- Voice input with real-time transcription
- Rich response cards with actionable buttons

### 30.3 Map Component Sub-components

| Component          | Description                                    | Platform                |
| ------------------ | ---------------------------------------------- | ----------------------- |
| **ZoomControls**   | +/- buttons for zoom                           | Web, optionally mobile  |
| **CompassControl** | North indicator, tap to reset                  | All                     |
| **ScaleBar**       | Distance scale indicator                       | All                     |
| **LevelSwitcher**  | Floor/level picker (vertical list or dropdown) | All                     |
| **Attribution**    | Map data attribution                           | All (legal requirement) |
| **LocationButton** | Center on user location                        | All                     |
| **RotateControl**  | Rotation gesture hint/reset                    | Mobile                  |
| **3DToggle**       | Switch 2D/3D view (if supported)               | All                     |
| **LayerToggle**    | Show/hide map layers                           | Dashboard/CMS           |

### 30.4 GeoJSON Drawing Tools Components

For the Dashboard/CMS full drawing suite:

| Component           | Description                                        |
| ------------------- | -------------------------------------------------- |
| **DrawingToolbar**  | Tool selection (point, line, polygon, etc.)        |
| **PointTool**       | Place single point markers                         |
| **LineTool**        | Draw polylines (paths, routes)                     |
| **PolygonTool**     | Draw closed shapes (zones, areas)                  |
| **RectangleTool**   | Draw rectangular regions                           |
| **CircleTool**      | Draw circular regions                              |
| **EditTool**        | Select and modify existing features                |
| **DeleteTool**      | Remove selected features                           |
| **PropertiesPanel** | Edit GeoJSON properties (name, category, metadata) |
| **LayerPanel**      | Manage multiple drawing layers                     |
| **UndoRedo**        | History management                                 |
| **ExportPanel**     | Export as GeoJSON, KML, etc.                       |
| **AnnotationTool**  | Add text labels, callouts                          |
| **MeasureTool**     | Distance and area measurement                      |
| **SnapControls**    | Snap to grid/vertices/edges                        |

### 30.5 Internationalization Scope

**Languages to support (based on customer locations):**

| Language              | Code    | Direction | Script     | Notes               |
| --------------------- | ------- | --------- | ---------- | ------------------- |
| English (US)          | `en-US` | LTR       | Latin      | Default             |
| English (UK)          | `en-GB` | LTR       | Latin      | Spelling variants   |
| Chinese (Simplified)  | `zh-CN` | LTR       | Han        | China mainland      |
| Chinese (Traditional) | `zh-TW` | LTR       | Han        | Taiwan              |
| Japanese              | `ja`    | LTR       | Han/Kana   |                     |
| Korean                | `ko`    | LTR       | Hangul     | Consider for future |
| Hindi                 | `hi`    | LTR       | Devanagari | India               |
| Arabic                | `ar`    | **RTL**   | Arabic     | UAE, Emirates       |
| Turkish               | `tr`    | LTR       | Latin      |                     |
| Portuguese            | `pt`    | LTR       | Latin      | Portugal            |
| Spanish               | `es`    | LTR       | Latin      | Spain               |
| German                | `de`    | LTR       | Latin      |                     |
| French                | `fr`    | LTR       | Latin      |                     |

**Key requirements:**

- **RTL support** mandatory (Arabic)
- **CJK fonts** bundled (Chinese, Japanese, Korean)
- **Devanagari font** for Hindi
- **Dynamic text expansion** handling (German can be 30% longer)
- **Number/date/currency** formatting per locale
- **Pluralization rules** per language

---

## 31. Scope Complete — Summary

All questions have been resolved. The Kozmos Design System scope is now finalized:

### Platform Coverage (6 platforms)

- ✅ React (Web SDK, primary)
- ✅ Vue 3 (Dashboard, via Web Components) — Phase 2
- ✅ iOS SwiftUI (Native SDK)
- ✅ Android Jetpack Compose (Native SDK)
- ✅ React Native (Cross-platform mobile)
- ✅ Dashboard (Vue 3 migration from Vue 2)

### Key Architectural Decisions

- **Styling**: CSS Variables + CVA (zero runtime)
- **Tokens**: Style Dictionary v4 + Figma Variables + wide gamut (P3/oklch)
- **Figma**: New library from scratch, Code Connect for all platforms
- **Theming**: Customer white-labeling with brand/bg/fg/status colors
- **i18n**: 13+ languages including RTL (Arabic) and CJK
- **Offline**: Progressive offline support
- **License**: MIT (open source ready)

### Component Scope

- **Foundation**: Tokens, ThemeProvider, Layout, Typography, Button, Icon, Form controls
- **SDK Modules**: Search, POI, Map controls, Wayfinding, AI Companion
- **Dashboard**: Full GeoJSON drawing tools, CMS components
- **60+ components** across all platforms

### Ready for Phase 1 Implementation

---

## Appendix A: Component Checklist Template

Use this checklist when implementing each new component:

### Design Readiness

- [ ] Figma component exists with all variants
- [ ] Figma Variables applied (no hardcoded values)
- [ ] All states designed (default, hover, focus, active, disabled, loading, error)
- [ ] Responsive behavior defined
- [ ] Dark mode variant exists
- [ ] Accessibility annotations present (focus order, labels)

### Implementation (per platform)

- [ ] Component code complete
- [ ] All variants implemented
- [ ] Props match Figma properties
- [ ] Tokens used (no hardcoded values)
- [ ] TypeScript/Swift/Kotlin types complete
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state handled

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus visible and meets contrast
- [ ] Touch targets meet minimum size
- [ ] Reduced motion respected
- [ ] Color contrast passes WCAG AA

### Testing

- [ ] Unit tests written
- [ ] Accessibility tests pass
- [ ] Visual regression snapshot added
- [ ] RTL layout tested
- [ ] All variants covered in tests

### Documentation

- [ ] Storybook story created (React)
- [ ] Xcode Preview added (iOS)
- [ ] Compose Preview added (Android)
- [ ] Props documented
- [ ] Usage examples written
- [ ] Do's and Don'ts documented

### Code Connect

- [ ] `.figma.tsx` file created
- [ ] `.figma.swift` file created
- [ ] `.figma.kt` file created
- [ ] All props mapped
- [ ] Validated with `figma connect parse`
- [ ] Published to Figma

### Release

- [ ] Changeset added
- [ ] CHANGELOG entry written
- [ ] Breaking changes documented (if any)
- [ ] Migration guide written (if breaking)

---

## Appendix B: Quick Reference - Token Naming

```
┌─────────────────────────────────────────────────────────────────┐
│ FOUNDATION TOKENS (raw values)                                  │
├─────────────────────────────────────────────────────────────────┤
│ color.{palette}.{shade}     │ color.blue.500, color.neutral.100 │
│ font.size.{scale}           │ font.size.100, font.size.400      │
│ font.weight.{name}          │ font.weight.regular, .bold        │
│ space.{scale}               │ space.100, space.200, space.400   │
│ radius.{scale}              │ radius.100, radius.full           │
│ shadow.{size}               │ shadow.sm, shadow.md, shadow.lg   │
│ motion.duration.{speed}     │ motion.duration.fast, .normal     │
│ motion.easing.{type}        │ motion.easing.standard, .spring   │
│ z-index.{layer}             │ z-index.dropdown, z-index.modal   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SEMANTIC TOKENS (contextual, theme-aware)                       │
├─────────────────────────────────────────────────────────────────┤
│ color.background.{context}  │ .primary, .secondary, .overlay    │
│ color.text.{context}        │ .primary, .secondary, .inverse    │
│ color.border.{context}      │ .default, .strong, .subtle        │
│ color.interactive.{state}   │ .primary, .primary.hover          │
│ color.status.{type}         │ .error, .success, .warning, .info │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT TOKENS (component-scoped)                             │
├─────────────────────────────────────────────────────────────────┤
│ button.background.{variant} │ button.background.primary         │
│ button.text.{variant}       │ button.text.primary                │
│ button.border.radius        │ → references radius.{scale}        │
│ button.padding.{axis}       │ button.padding.horizontal          │
│ input.border.{state}        │ input.border.default, .focus       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix C: Platform Parity Matrix

Track implementation status across platforms:

| Component     | React | SwiftUI | Compose | Code Connect | Notes |
| ------------- | :---: | :-----: | :-----: | :----------: | ----- |
| ThemeProvider |       |         |         |     N/A      |       |
| Box           |       |         |         |              |       |
| Stack         |       |         |         |              |       |
| Text          |       |         |         |              |       |
| Heading       |       |         |         |              |       |
| Button        |       |         |         |              |       |
| IconButton    |       |         |         |              |       |
| Icon          |       |         |         |              |       |
| Input         |       |         |         |              |       |
| Checkbox      |       |         |         |              |       |
| Radio         |       |         |         |              |       |
| Select        |       |         |         |              |       |
| Switch        |       |         |         |              |       |
| Divider       |       |         |         |              |       |
| Spacer        |       |         |         |              |       |

Legend: ✅ Complete | 🟡 In Progress | ❌ Not Started | ➖ N/A

---

## Appendix D: Glossary

| Term                      | Definition                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **AAR**                   | Android Archive — Android library packaging format                                     |
| **a11y**                  | Accessibility (a + 11 letters + y)                                                     |
| **Atomic design**         | Methodology organizing components as atoms → molecules → organisms → templates → pages |
| **Barrel file**           | `index.ts` that re-exports multiple modules for cleaner imports                        |
| **Code Connect**          | Figma feature bridging design components to production code via `.figma.*` files       |
| **Compound component**    | React pattern where a parent component shares state with specialized children          |
| **CSP**                   | Content Security Policy — browser security mechanism restricting inline scripts/styles |
| **CVA**                   | class-variance-authority — TypeScript library for managing component variant styles    |
| **DTCG**                  | Design Tokens Community Group — W3C working group defining the token specification     |
| **FOUC**                  | Flash of Unstyled Content — brief display of unstyled page before CSS loads            |
| **Foundation token**      | Raw value token (color, size) without semantic meaning                                 |
| **Hydration**             | Process of attaching JavaScript behavior to server-rendered HTML                       |
| **MCP**                   | Model Context Protocol — Figma's API for AI agents to read design context              |
| **Peer dependency**       | Package required by the host app, not bundled with the library                         |
| **Polymorphic component** | Component that can render as different HTML elements via `as` prop                     |
| **Provenance**            | Cryptographic attestation linking npm package to source commit                         |
| **RSC**                   | React Server Components — Server-rendered React components without client JS           |
| **SBOM**                  | Software Bill of Materials — inventory of all dependencies                             |
| **Semantic token**        | Token that references another token and carries contextual meaning                     |
| **Side effect**           | Code that runs on import (e.g., CSS injection) affecting tree-shaking                  |
| **Slot**                  | Named insertion point in a component for custom content                                |
| **SPM**                   | Swift Package Manager — Apple's dependency management for Swift projects               |
| **Tree-shaking**          | Dead code elimination removing unused exports from bundles                             |
| **Wide gamut**            | Color spaces (Display P3, oklch) that exceed sRGB range                                |
| **Workspace protocol**    | pnpm's `workspace:*` syntax for linking local packages                                 |

---

## Appendix E: Implementation Notes

### E.1 Font Strategy

**Decision:** System font stack across all platforms to minimize bundle size and ensure native feel.

| Platform         | Font Stack                                                                                              | Notes                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Web**          | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | No custom fonts in SDK bundle                                   |
| **iOS**          | SF Pro (system)                                                                                         | Automatically uses SF Pro via system fonts                      |
| **Android**      | Roboto (system)                                                                                         | Default Material system font                                    |
| **React Native** | Platform default                                                                                        | Uses iOS/Android system fonts respectively                      |
| **Dashboard**    | System font or Inter (optional)                                                                         | If Inter is used, ensure OFL license compliance for MIT release |

**Custom font injection** (for white-labeling): ThemeProvider accepts optional `fontFamily` override that customers can configure.

### E.2 Icon Naming Convention

**Format:** `{category}-{name}[-{modifier}]`

**Categories:**
| Category | Purpose | Examples |
|----------|---------|----------|
| `nav` | Navigation/wayfinding | `nav-arrow-left`, `nav-arrow-right`, `nav-chevron-up` |
| `action` | User actions | `action-check`, `action-close`, `action-edit`, `action-delete` |
| `status` | Status indicators | `status-success`, `status-warning`, `status-error`, `status-info` |
| `content` | Content types | `content-image`, `content-document`, `content-video` |
| `map` | Map-specific | `map-pin`, `map-route`, `map-floor`, `map-compass` |
| `poi` | Points of interest | `poi-restaurant`, `poi-restroom`, `poi-elevator`, `poi-stairs` |
| `transport` | Transportation | `transport-walk`, `transport-escalator`, `transport-car` |
| `ui` | UI elements | `ui-menu`, `ui-search`, `ui-filter`, `ui-settings` |
| `social` | Social/sharing | `social-share`, `social-favorite`, `social-comment` |
| `ai` | AI Companion | `ai-assistant`, `ai-microphone`, `ai-send` |

**Modifiers:**

- `-filled` — Solid fill variant
- `-outlined` — Stroke-only variant
- `-circle` — Circular background variant
- `-small` — Optimized for small sizes (12-16px)

**Examples:**

```
nav-arrow-left
nav-arrow-left-circle
status-success-filled
poi-restaurant-outlined
action-check-circle-filled
```

### E.3 Gesture Handling

| Platform              | Library/Approach                                    | Notes                                                                        |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Web (React)**       | Native DOM events + `@use-gesture/react` (optional) | Use native events for simple gestures; use-gesture for complex (pinch, drag) |
| **iOS (SwiftUI)**     | Built-in gesture system                             | `.gesture()`, `.onTapGesture()`, `DragGesture()`, etc.                       |
| **Android (Compose)** | Built-in gesture system                             | `Modifier.pointerInput()`, `detectTapGestures()`, `detectDragGestures()`     |
| **React Native**      | `react-native-gesture-handler`                      | Required for performant, native-driven gestures                              |

**React Native gesture configuration:**

```tsx
// Required in app entry point
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

<GestureHandlerRootView style={{ flex: 1 }}>
  <App />
</GestureHandlerRootView>;
```

### E.4 Voice Input UI Components

> **Note:** Voice recognition implementation is handled by the SDK layer. Kozmos provides only the UI/UX components.

**Voice UI Components:**

| Component                | Description                                   | States                             |
| ------------------------ | --------------------------------------------- | ---------------------------------- |
| `VoiceButton`            | Microphone button to trigger voice input      | idle, listening, processing, error |
| `VoiceWaveform`          | Audio waveform visualization during recording | amplitude-reactive animation       |
| `VoiceTranscript`        | Real-time transcription display               | streaming text with cursor         |
| `VoicePermissionPrompt`  | Permission request UI                         | prompt, denied, settings-redirect  |
| `VoiceUnavailableNotice` | Fallback when voice not supported             | informational message              |

**Props interface (React example):**

```tsx
interface VoiceButtonProps {
  state: "idle" | "listening" | "processing" | "error";
  onPress: () => void;
  onLongPressStart?: () => void; // Push-to-talk start
  onLongPressEnd?: () => void; // Push-to-talk end
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

interface VoiceTranscriptProps {
  text: string;
  isStreaming: boolean;
  confidence?: number; // Optional confidence indicator
}
```

### E.5 Export UI Components (Drawing Tools)

> **Note:** Actual file export/generation is handled by the application layer. Kozmos provides only the UI components.

**Export UI Components:**

| Component                 | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `ExportPanel`             | Panel with format selection and options                          |
| `ExportFormatSelector`    | Radio/dropdown for format choice (GeoJSON, KML, PDF, PNG, SVG)   |
| `ExportOptionsForm`       | Format-specific options (resolution, layers, metadata inclusion) |
| `ExportProgressIndicator` | Progress bar/spinner during export generation                    |
| `ExportCompleteDialog`    | Success state with download/share actions                        |
| `ExportErrorState`        | Error handling with retry option                                 |

**Supported format options (UI only):**

```typescript
type ExportFormat = "geojson" | "kml" | "pdf" | "png" | "svg";

interface ExportOptions {
  format: ExportFormat;
  includeLayers?: string[]; // Which layers to include
  includeMetadata?: boolean; // Include GeoJSON properties
  resolution?: "low" | "medium" | "high"; // For raster exports
  paperSize?: "a4" | "letter" | "custom"; // For PDF
  orientation?: "portrait" | "landscape"; // For PDF
}
```

### E.6 Storybook Configuration

**Addons (React/Vue):**

| Addon                           | Purpose                                                          | Priority    |
| ------------------------------- | ---------------------------------------------------------------- | ----------- |
| `@storybook/addon-essentials`   | Controls, Docs, Actions, Viewport, Backgrounds, Measure, Outline | Required    |
| `@storybook/addon-a11y`         | Accessibility violation panel                                    | Required    |
| `@storybook/addon-designs`      | Figma embed for design reference                                 | Required    |
| `@storybook/addon-interactions` | Play function testing                                            | Required    |
| `@storybook/addon-storysource`  | View story source code                                           | Recommended |
| `@storybook/addon-viewport`     | Responsive testing (part of essentials)                          | Required    |
| `storybook-dark-mode`           | Dark mode toggle                                                 | Required    |
| `chromatic`                     | Visual regression (external service)                             | Required    |

**Storybook configuration (`main.ts`):**

```typescript
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-designs",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (config) => {
    // Custom Vite config for tokens CSS
    return config;
  },
};
```

### E.7 React Native Component Preview

**Decision:** Use **Storybook for React Native** with Expo for component development and previews.

**Setup:**

```
packages/react-native/
├── .storybook/
│   ├── main.ts
│   ├── preview.tsx
│   └── storybook.requires.ts  # Auto-generated
├── src/
│   └── components/
│       └── Button/
│           ├── Button.tsx
│           └── Button.stories.tsx
└── App.tsx  # Storybook entry in dev mode
```

**Configuration:**

```typescript
// .storybook/main.ts
module.exports = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-ondevice-controls",
    "@storybook/addon-ondevice-actions",
  ],
};
```

**Running:**

```bash
# Development with Storybook
pnpm --filter @kozmos/react-native storybook

# Or via Expo
cd packages/react-native && expo start
```

**Alternative for CI:** Use `react-native-storybook-loader` for automated story discovery + Detox for screenshot testing.

---

## Appendix F: Development Configuration

### F.1 TypeScript Configuration

**Strict mode:** Enabled with full strictness for maximum type safety.

**Base configuration (`tsconfig.base.json`):**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

**Key decisions:**

- `declarationMap: true` — Enables "Go to Definition" to source `.tsx` files in consuming projects
- `verbatimModuleSyntax: true` — Enforces explicit `type` imports for type-only imports
- `noUncheckedIndexedAccess: true` — Requires null checks on array/object index access

### F.2 ESLint Configuration

**Shared ESLint config (`packages/config/eslint/index.js`):**

```javascript
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/strict",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "react", "jsx-a11y", "import"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    // Enforce design system token usage
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message: "Use design tokens instead of hardcoded color values.",
      },
      {
        selector: "Literal[value=/^\\d+px$/]",
        message: "Use design tokens for spacing/sizing values.",
      },
    ],

    // Import organization
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc" },
      },
    ],
    "import/no-duplicates": "error",

    // React specifics
    "react/prop-types": "off", // TypeScript handles this
    "react/display-name": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never" },
    ],
    "react/self-closing-comp": "error",

    // Accessibility
    "jsx-a11y/no-autofocus": "warn", // Allow with warning for modals/dialogs

    // TypeScript
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "typeLike", format: ["PascalCase"] },
      { selector: "enumMember", format: ["UPPER_CASE"] },
    ],
  },
  overrides: [
    {
      files: ["*.stories.tsx"],
      rules: {
        "no-restricted-syntax": "off", // Allow hardcoded values in stories for demos
      },
    },
    {
      files: ["*.test.tsx", "*.test.ts"],
      extends: ["plugin:testing-library/react"],
    },
  ],
};
```

### F.3 Prettier Configuration

**Shared Prettier config (`packages/config/prettier/index.js`):**

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: "es5",
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "lf",
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  embeddedLanguageFormatting: "auto",
  singleAttributePerLine: false,
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.json",
      options: { tabWidth: 2 },
    },
    {
      files: "*.md",
      options: { proseWrap: "always", printWidth: 80 },
    },
  ],
};
```

### F.4 Component Prop Naming Conventions

**Standard prop patterns:**

| Pattern               | Usage                | Examples                                          |
| --------------------- | -------------------- | ------------------------------------------------- |
| **Boolean `is*`**     | Current state        | `isOpen`, `isLoading`, `isDisabled`, `isSelected` |
| **Boolean `has*`**    | Feature presence     | `hasError`, `hasIcon`, `hasBorder`                |
| **Boolean `should*`** | Behavior hints       | `shouldAnimate`, `shouldTruncate`                 |
| **Boolean `allow*`**  | Permission flags     | `allowMultiple`, `allowEmpty`                     |
| **Event `on*`**       | Callback props       | `onClick`, `onChange`, `onClose`, `onSubmit`      |
| **Render `render*`**  | Render prop patterns | `renderIcon`, `renderEmpty`, `renderItem`         |
| **Slot `*Slot`**      | Slot content         | `leftSlot`, `rightSlot`, `headerSlot`             |
| **Ref `*Ref`**        | Forwarded refs       | `inputRef`, `containerRef`                        |

**Variant/size props:**

```typescript
// Use literal unions, not enums
type Variant = "primary" | "secondary" | "outlined" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

// Props interface pattern
interface ButtonProps {
  variant?: Variant; // Optional with default
  size?: Size; // Optional with default
  isLoading?: boolean; // Boolean state
  isDisabled?: boolean; // Boolean state (prefer over `disabled` for consistency)
  onClick?: () => void; // Event handler
  leftSlot?: ReactNode; // Slot content
  children: ReactNode; // Required content
}
```

**Deprecated props:**

```typescript
interface ButtonProps {
  /**
   * @deprecated Use `variant` instead. Will be removed in v2.0.0.
   */
  type?: "primary" | "secondary";
  variant?: Variant;
}
```

### F.5 Git Hooks Configuration

**Husky setup (`.husky/`):**

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm commitlint --edit $1
```

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm typecheck
pnpm test --passWithNoTests
```

**lint-staged configuration (`lint-staged.config.js`):**

```javascript
module.exports = {
  // TypeScript/JavaScript
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],

  // Styles
  "*.css": ["prettier --write"],

  // JSON/YAML/Markdown
  "*.{json,yaml,yml,md}": ["prettier --write"],

  // Swift
  "*.swift": ["swiftformat --lint"],

  // Kotlin
  "*.kt": ["ktlint --format"],

  // Tokens - rebuild on change
  "packages/tokens/src/**/*.json": () => "pnpm --filter @kozmos/tokens build",

  // Prevent secrets
  "*": ["secretlint"],
};
```

**Commitlint configuration (`commitlint.config.js`):**

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting (not CSS)
        "refactor", // Code refactoring
        "perf", // Performance
        "test", // Tests
        "build", // Build system
        "ci", // CI config
        "chore", // Maintenance
        "revert", // Revert commit
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "tokens",
        "react",
        "ios",
        "android",
        "react-native",
        "vue",
        "icons",
        "docs",
        "storybook",
        "ci",
        "deps",
      ],
    ],
  },
};
```

### F.6 Environment Configuration

**Required environment variables:**

| Variable                  | Required | Description                          | Used In                               |
| ------------------------- | -------- | ------------------------------------ | ------------------------------------- |
| `FIGMA_ACCESS_TOKEN`      | CI only  | Figma API token for Code Connect     | `tokens-sync.yml`, `code-connect.yml` |
| `NPM_TOKEN`               | CI only  | npm publish token                    | `release.yml`                         |
| `CHROMATIC_PROJECT_TOKEN` | CI only  | Chromatic visual testing             | `ci.yml`                              |
| `GITHUB_TOKEN`            | Auto     | GitHub Actions token (auto-injected) | All workflows                         |

**Local development (`.env.example`):**

```bash
# Optional: For local Figma sync (not required for component development)
FIGMA_ACCESS_TOKEN=

# Optional: For local Chromatic runs
CHROMATIC_PROJECT_TOKEN=

# Development flags
DEBUG=kozmos:*
```

**Environment loading:**

- Never commit `.env` files
- Use `dotenv` only in scripts (not in library code)
- Libraries must not read environment variables at runtime

---

## Appendix G: CI/CD Configuration Details

### G.1 GitHub Actions Secrets

| Secret                    | Required For         | Rotation | Notes                                    |
| ------------------------- | -------------------- | -------- | ---------------------------------------- |
| `FIGMA_ACCESS_TOKEN`      | Figma API operations | 90 days  | Personal access token from Figma account |
| `NPM_TOKEN`               | npm publishing       | 1 year   | Automation token with publish scope      |
| `CHROMATIC_PROJECT_TOKEN` | Visual regression    | Never    | Project-specific token from Chromatic    |
| `CODECOV_TOKEN`           | Coverage reports     | Never    | Optional, for private repos              |

**Secret access by workflow:**

| Workflow           | Secrets Used              |
| ------------------ | ------------------------- |
| `ci.yml`           | `CHROMATIC_PROJECT_TOKEN` |
| `release.yml`      | `NPM_TOKEN`               |
| `code-connect.yml` | `FIGMA_ACCESS_TOKEN`      |
| `tokens-sync.yml`  | `FIGMA_ACCESS_TOKEN`      |

### G.2 Package Entry Point Validation

**CI check (`scripts/validate-exports.ts`):**

```typescript
import { readFileSync } from "fs";
import { resolve } from "path";

const packages = ["react", "vue", "react-native", "tokens", "icons"];

for (const pkg of packages) {
  const pkgJsonPath = resolve(`packages/${pkg}/package.json`);
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));

  if (pkgJson.exports) {
    for (const [key, value] of Object.entries(pkgJson.exports)) {
      const paths = typeof value === "string" ? [value] : Object.values(value);
      for (const p of paths) {
        const fullPath = resolve(`packages/${pkg}`, p);
        if (!existsSync(fullPath)) {
          throw new Error(`Missing export: ${pkg} -> ${key} -> ${p}`);
        }
      }
    }
  }
}
```

**Add to CI:**

```yaml
- name: Validate package exports
  run: pnpm validate-exports
```

### G.3 Visual Regression Configuration

**Chromatic configuration (`.chromatic.json`):**

```json
{
  "projectId": "PROJECT_ID",
  "autoAcceptChanges": "main",
  "exitZeroOnChanges": false,
  "exitOnceUploaded": false,
  "onlyChanged": true,
  "externals": ["**/*.css"],
  "skip": "dependabot/**",
  "diffThreshold": 0.2,
  "pauseAnimationAtEnd": true
}
```

**Thresholds:**

- `diffThreshold: 0.2` — Allow 0.2% pixel difference before flagging
- Anti-aliasing differences are auto-ignored
- Font rendering differences across OS are expected — baseline per OS

**Approval workflow:**

1. Chromatic runs on every PR
2. Any visual changes require manual review
3. Approved changes update baseline automatically
4. Intentional changes: Approve in Chromatic UI before merge

### G.4 Accessibility Testing Configuration

**axe-core configuration (`.axe.config.js`):**

```javascript
module.exports = {
  rules: {
    // Disable rules that don't apply to component libraries
    "document-title": { enabled: false },
    "html-has-lang": { enabled: false },
    "landmark-one-main": { enabled: false },
    "page-has-heading-one": { enabled: false },
    region: { enabled: false },

    // Enable all other WCAG 2.1 AA rules
    "color-contrast": { enabled: true },
    "focus-visible": { enabled: true },
    label: { enabled: true },
    "aria-required-attr": { enabled: true },
    // ... (all WCAG 2.1 AA rules enabled by default)
  },
  // Fail CI on any violation
  resultTypes: ["violations"],
};
```

**Storybook a11y addon configuration:**

```typescript
// .storybook/preview.ts
export const parameters = {
  a11y: {
    config: require("../.axe.config.js"),
    options: {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    },
  },
};
```

**CI gate:** Any axe-core violation fails the PR build.

### G.5 PR and Issue Templates

**Pull Request template (`.github/pull_request_template.md`):**

```markdown
## Summary

<!-- Brief description of changes -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/formatting (no functional changes)
- [ ] ♻️ Refactor (no functional changes)
- [ ] 🧪 Test update

## Affected Packages

- [ ] `@kozmos/tokens`
- [ ] `@kozmos/react`
- [ ] `@kozmos/vue`
- [ ] `@kozmos/react-native`
- [ ] `KozmosUI` (iOS)
- [ ] `kozmos-ui` (Android)
- [ ] `@kozmos/icons`

## Checklist

### General

- [ ] I have read the contributing guidelines
- [ ] My code follows the project's coding standards
- [ ] I have added/updated tests for my changes
- [ ] All tests pass locally

### Components (if applicable)

- [ ] Component works in all variants/sizes
- [ ] Accessibility requirements met (keyboard nav, screen reader, contrast)
- [ ] RTL layout tested
- [ ] Reduced motion respected
- [ ] Code Connect file updated
- [ ] Storybook story added/updated

### Breaking Changes (if applicable)

- [ ] Changeset added with `major` bump
- [ ] Migration guide written
- [ ] Codemod provided (or documented why not applicable)
- [ ] Deprecated API still works with console warning

## Screenshots/Recordings

<!-- Add screenshots or Loom recordings if UI changes -->

## Test Plan

<!-- How should reviewers test these changes? -->

---

<!-- Reviewers: Check the "Files changed" tab and run `pnpm test` locally -->
```

**Issue templates (`.github/ISSUE_TEMPLATE/`):**

Create separate templates for:

- `bug_report.md` — Bug reports with reproduction steps
- `feature_request.md` — New component/feature requests
- `rfc.md` — Architecture/API proposals

### G.6 CODEOWNERS

**`.github/CODEOWNERS`:**

```
# Default owners for everything
* @pointr/design-system-core

# Token system
/packages/tokens/ @pointr/design-system-core @pointr/design-team

# Platform-specific ownership
/packages/react/ @pointr/frontend-web
/packages/vue/ @pointr/frontend-web
/packages/ios/ @pointr/mobile-ios
/packages/android/ @pointr/mobile-android
/packages/react-native/ @pointr/mobile-rn

# Icons require design approval
/packages/icons/ @pointr/design-team

# CI/CD changes require core team
/.github/ @pointr/design-system-core

# Documentation
/apps/docs/ @pointr/design-system-core

# Code Connect files require both platform and core approval
*.figma.tsx @pointr/design-system-core @pointr/frontend-web
*.figma.swift @pointr/design-system-core @pointr/mobile-ios
*.figma.kt @pointr/design-system-core @pointr/mobile-android
```

### G.7 Dependency Update Strategy

**Renovate configuration (`renovate.json`):**

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":preserveSemverRanges",
    "group:allNonMajor"
  ],
  "schedule": ["before 9am on Monday"],
  "timezone": "Europe/London",
  "labels": ["dependencies"],
  "rangeStrategy": "bump",
  "packageRules": [
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript types",
      "automerge": true
    },
    {
      "matchPackagePatterns": ["eslint", "prettier"],
      "groupName": "Linting tools",
      "automerge": true
    },
    {
      "matchPackagePatterns": ["^@storybook/"],
      "groupName": "Storybook",
      "automerge": false
    },
    {
      "matchUpdateTypes": ["major"],
      "labels": ["dependencies", "breaking"],
      "automerge": false
    },
    {
      "matchPackagePatterns": ["react", "react-dom"],
      "groupName": "React",
      "automerge": false
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "automergeType": "pr",
      "automergeStrategy": "squash"
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

### G.8 Platform Minimum Version Justification

**iOS 16+ Justification:**

| Factor                   | Rationale                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **SwiftUI maturity**     | iOS 16 introduces NavigationStack, Charts, and stable Transferable — essential for modern UI |
| **Market coverage**      | ~95% of active iOS devices (as of 2025)                                                      |
| **Feature dependencies** | `@Environment(\.dismiss)`, `@FocusState`, `Layout` protocol                                  |
| **Pointr SDK alignment** | Matches Pointr iOS SDK minimum target                                                        |

**Android API 26 (8.0) Justification:**

| Factor                   | Rationale                                                 |
| ------------------------ | --------------------------------------------------------- |
| **Compose stability**    | API 26 is Compose's recommended minimum                   |
| **Market coverage**      | ~97% of active Android devices (as of 2025)               |
| **Feature dependencies** | Adaptive icons, notification channels, autofill framework |
| **Pointr SDK alignment** | Matches Pointr Android SDK minimum target                 |

**Future deprecation timeline:**

- Review minimum versions annually
- iOS 17+ consideration: 2026
- Android API 28+ consideration: 2026

---

## Appendix H: Future Considerations

Items deferred to later phases:

| Item                           | Phase    | Notes                                                             |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| Analytics SDK integration      | Phase 3+ | Define integration points with Pointr analytics                   |
| Performance regression testing | Phase 3+ | Lighthouse CI, bundle-analyzer thresholds                         |
| Memory leak detection          | Phase 3+ | React DevTools profiler, Instruments (iOS), LeakCanary (Android)  |
| Browser/device lab testing     | Phase 3+ | Consider BrowserStack or Sauce Labs for cross-browser matrix      |
| Documentation site tech stack  | Phase 2  | Evaluate Storybook alone vs. Storybook + Docusaurus/Astro         |
| Contract testing (Pact)        | Phase 3  | Define consumer/provider contracts as SDK adoption grows          |
| Module Federation              | Phase 4+ | Evaluate only if dashboard micro-frontend architecture is adopted |

---

_This document serves as the comprehensive project scope for the Kozmos Design System. It should be treated as a living document and updated as architectural decisions are made and requirements evolve._

**Document version:** 1.2.0
**Last updated:** 2025-02-07
**Authors:** Kozmos Design System Team
