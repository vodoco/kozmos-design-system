# Kozmos Design System - Component Creation Guide

> **Purpose:** the steps that add a component to Kozmos on its three platforms, React, SwiftUI and
> Jetpack Compose. The walk-through written before the code is kept as a proposal in
> [docs/proposals/component-creation-plan.md](../docs/proposals/component-creation-plan.md).

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Component Scaffolding CLI](#2-component-scaffolding-cli)
3. [React Component Creation](#3-react-component-creation)
4. [iOS Component Creation](#4-ios-component-creation)
5. [Android Component Creation](#5-android-component-creation)
6. [React Native Component Creation](#6-react-native-component-creation)
7. [Vue Component Creation](#7-vue-component-creation)
8. [Code Connect Setup](#8-code-connect-setup)
9. [Testing Requirements](#9-testing-requirements)
10. [Documentation Requirements](#10-documentation-requirements)
11. [Complete Checklist](#11-complete-checklist)

---

## 1. Quick Start

### Using the CLI

```bash
# Scaffold a React component in packages/react/src/components/<Name>
pnpm new-component <Name>
```

`pnpm new-component` (`scripts/skills/generate-component.ts`) takes one argument, the component's
name, and refuses a name that already has a directory. It scaffolds the React component only: there
are no `--compound` or `--platforms` options, and the SwiftUI and Compose versions are written by
hand (§4 and §5).

### Manual Creation

If you prefer manual creation, follow the detailed sections below for each platform.

---

## 2. Component Scaffolding CLI

### What It Writes

Run from the repository root, `pnpm new-component <Name>` writes four files and adds one line to
`packages/react/src/index.ts` (`export * from './components/<Name>/<Name>';`):

```
packages/react/src/components/<Name>/
├── <Name>.tsx              # A cva-based component
├── <Name>.stories.tsx      # Storybook
├── <Name>.test.tsx         # Tests
└── index.ts                # Barrel export
```

Everything else is yours to add: the Code Connect file, the SwiftUI and Compose versions, and a
changeset (`pnpm changeset`), since a new component changes what `@kozmos-ds/react` ships.

---

## 3. React Component Creation

After `pnpm new-component <Name>` (§1), follow a real component of the same shape
([code-patterns.md](./code-patterns.md)): Badge or Tag for variants, Button for emotion, Dialog or
Tabs for a compound part built on Radix, Input for a form field. Then:

1. **Its props are its API.** The component inventory and its Claude Design card are generated from
   the built types, so declare every axis in the `cva` recipe or the props interface.
2. **Style with roles**, the Tailwind role classes over the tokens, or owned CSS; never a literal
   colour, radius or spacing (`pnpm tokens:raw:check`).
3. **Add its story and docs page**, `<Name>.stories.tsx` and `<Name>.mdx`, beside it (§10).
4. **Add its test**, `<Name>.test.tsx` (§9).

The walk-through written before the code, which built a Tooltip unlike the real one, is kept in
[docs/proposals/component-creation-plan.md](../docs/proposals/component-creation-plan.md).

---

## 4. iOS Component Creation

Add `packages/ios/Sources/Components/<Name>/<Name>.swift`, following
`packages/ios/Sources/Components/Button/Button.swift`:

- `public struct Kozmos<Name>: View`, with its axes as enums named `Kozmos<Name><Axis>` holding the
  same values as React's;
- colours from `KozmosColors`, each a light and a dark colour that the view's colour scheme picks
  between, and sizes from `KozmosDimensions`;
- its Code Connect file beside it (§8).

`pnpm native:check` compiles the package the way CI's iOS job does.

---

## 5. Android Component Creation

Add `packages/android/src/main/java/com/kozmos/components/<Name>/<Name>.kt`, in the package
`com.kozmos.components.<name>`, following `…/components/Button/Button.kt`:

- `@Composable fun Kozmos<Name>(…)`, with its axes as enum classes named `Kozmos<Name><Axis>`;
- colours from `KozmosThemeTokens`, which follows the theme `KozmosThemeProvider` sets;
- its Code Connect file beside it (§8).

`pnpm native:check` compiles it the way CI's Android job does.

---

## 6. React Native Component Creation

There is no React Native package: Kozmos is built for React, SwiftUI and Jetpack Compose. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 7. Vue Component Creation

Vue waits: `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, so a component made for React reaches it with nothing more to write, and there are no Lit Web Components. What this section held, from the original scope, is kept as a proposal in [docs/proposals/other-platforms.md](../docs/proposals/other-platforms.md).

---

## 8. Code Connect Setup

A component links to its Figma component on each platform through a file beside it:
`<Name>.figma.tsx`, `<Name>.figma.swift` and `<Name>.figma.kt`, following Button's. Parse them the
way CI does:

```bash
pnpm figma:parse:linked
pnpm figma:parse:native:linked
```

Publishing to the live Figma file (`pnpm figma:publish:linked`) happens on Olcay's word.

---

## 9. Testing Requirements

- **React:** `<Name>.test.tsx`, with Vitest, Testing Library and `vitest-axe`; run with
  `pnpm --filter @kozmos-ds/react test`.
- **SwiftUI:** `packages/ios/Tests/KozmosTests/Kozmos<Name>Tests.swift`, with XCTest.
- **Compose:** `packages/android/src/test/java/com/kozmos/components/<name>/`, with Paparazzi.
- **Every story** is drawn in light and dark by the visual review; its baselines are recorded in
  Docker ([docs/visual-review.md](../docs/visual-review.md)).

A native test proves nothing until it is seen by name in the run's results (`AGENTS.md`).

---

## 10. Documentation Requirements

- **A story file,** `<Name>.stories.tsx`, whose `meta.title` files the component under its category.
- **A docs page,** `<Name>.mdx`, whose snippets show the component on each platform.
- **Its Claude Design card:** `pnpm skills:build`, after building React, writes
  `docs/claude-design/components/<Name>.md` and the inventory's row, and `pnpm skills:check` fails
  until they are committed.

---

## 11. Complete Checklist

### Before Starting

- [ ] Review design in Figma
- [ ] Check if similar component exists
- [ ] Identify props and variants needed
- [ ] Plan compound component structure (if needed)

### Implementation

- [ ] **React**
  - [ ] Scaffold with `pnpm new-component <Name>` (it adds the barrel and the root export)
  - [ ] Declare every axis in the `cva` recipe or the props
  - [ ] Style with role classes or owned CSS, no literal values

- [ ] **iOS**
  - [ ] Create `Kozmos<Name>` in `packages/ios/Sources/Components/<Name>/`

- [ ] **Android**
  - [ ] Create `Kozmos<Name>` in `com.kozmos.components.<name>`
  - [ ] `pnpm native:check` compiles both native packages

### Quality Assurance

- [ ] **Testing**
  - [ ] Unit tests for all platforms, native ones seen by name in the results
  - [ ] Accessibility tests (`vitest-axe`)
  - [ ] Visual review baselines, recorded in Docker

- [ ] **Documentation**
  - [ ] Storybook story with all variants
  - [ ] Props documentation
  - [ ] Usage examples

- [ ] **Code Connect**
  - [ ] React .figma.tsx
  - [ ] iOS .figma.swift
  - [ ] Android .figma.kt
  - [ ] Parse with `pnpm figma:parse:linked` and `pnpm figma:parse:native:linked`
  - [ ] Publish with `pnpm figma:publish:linked`, on Olcay's word

### Final Steps

- [ ] Create changeset (`pnpm changeset`)
- [ ] Regenerate the inventory and the component's Claude Design card: `pnpm skills:build`, after building React
- [ ] Get PR review
- [ ] Merge and release

---

## Version History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.0.0   | 2026-02-07 | Initial component creation guide                             |
| 1.1.0   | 2026-09-29 | The real steps; the planned walk-through moves to a proposal |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-29
