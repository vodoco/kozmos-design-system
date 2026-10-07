# Kozmos Design System - Getting Started Guide

> **Purpose:** This document provides complete setup instructions for developing the Kozmos Design System. Follow these steps to get a working development environment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Project Structure](#3-project-structure)
4. [Package Configuration](#4-package-configuration)
5. [Development Commands](#5-development-commands)
6. [IDE Setup](#6-ide-setup)
7. [First Run Verification](#7-first-run-verification)
8. [Platform-Specific Setup](#8-platform-specific-setup)

---

## 1. Prerequisites

### Required Software

| Tool               | Version   | Purpose             | Installation                                                  |
| ------------------ | --------- | ------------------- | ------------------------------------------------------------- |
| **Node.js**        | 20.x LTS  | JavaScript runtime  | `brew install node@20` or [nodejs.org](https://nodejs.org)    |
| **pnpm**           | 9.x       | Package manager     | `npm install -g pnpm`                                         |
| **Git**            | 2.40+     | Version control     | `brew install git`                                            |
| **Xcode**          | 15+       | iOS development     | App Store                                                     |
| **Android Studio** | Hedgehog+ | Android development | [developer.android.com](https://developer.android.com/studio) |

### Optional but Recommended

| Tool                     | Purpose                 | Installation                                           |
| ------------------------ | ----------------------- | ------------------------------------------------------ |
| **VS Code** / **Cursor** | Primary IDE             | [code.visualstudio.com](https://code.visualstudio.com) |
| **Figma Desktop**        | Design integration      | [figma.com/downloads](https://figma.com/downloads)     |
| **Docker**               | Consistent environments | `brew install docker`                                  |

### Verify Prerequisites

```bash
# Run these commands to verify installation
node --version    # Should output v20.x.x
pnpm --version    # Should output 9.x.x
git --version     # Should output 2.40+
xcodebuild -version  # Should output Xcode 15+
```

---

## 2. Repository Setup

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/vodoco/kozmos-design-system.git
cd kozmos-design-system

# Or if using SSH
git clone git@github.com:vodoco/kozmos-design-system.git
cd kozmos-design-system
```

### Install Dependencies

```bash
# Install all dependencies across all packages
pnpm install

# This will:
# - Install root dependencies
# - Install all package dependencies
# - Link local packages together
# - Run any postinstall scripts
```

### Environment Configuration

Building, testing and running Storybook need no environment file. A `.env` at the repository root
holding `FIGMA_ACCESS_TOKEN` is read by the Code Connect scripts, the icon and foundation builds,
`pnpm figma:verify` and the nested-radius check, and by `scripts/ci-local.mjs` for the CI steps
that need it; `pnpm tokens:sync` takes `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY` from the
environment instead. Turborepo treats `.env` as a global dependency.

`pnpm tokens:sync` is not a routine step: it overwrites the token sources with the live Figma
variables, which still hold the values from before decision 59 until the owner runs the importer
plugin's Update. Read [token-implementation.md](./token-implementation.md) section 1 before you
run it.

The npm credential never goes in a local file. Releases publish from `release.yml` alone, whose
publish job is the only place `NPM_TOKEN` exists ([publishing-guide.md](./publishing-guide.md)).
CI uses no Turborepo remote cache.

---

## 3. Project Structure

### Directory Structure

The folders that matter, as they are. [`AGENTS.md`](../AGENTS.md) says what each is for.

```
kozmos-design-system/
├── .github/
│   └── workflows/                  # The eight workflows (ci-cd-configuration.md)
│       ├── ci.yml                  # CI: web, browser shards, core pipeline, iOS, Android
│       ├── visual.yml              # Visual Review
│       ├── lighthouse.yml          # Lighthouse CI
│       ├── bundle-size.yml         # Bundle budgets
│       ├── figma-tokens.yml        # Figma token sync (manual)
│       ├── site.yml                # The website's own checks
│       ├── pages.yml               # The website and Storybook, published from main
│       └── release.yml             # The npm release (dispatched, approved)
│
├── .ai-skills/                     # AI agent reference docs
│
├── packages/
│   ├── tokens/                     # @kozmos-ds/tokens
│   │   ├── src/                    # The DTCG token source (tokens-light.json, tokens-dark.json, …)
│   │   ├── build.mjs               # The Style Dictionary build
│   │   └── dist/                   # CSS, JavaScript, Swift and Kotlin, generated
│   │
│   ├── react/                      # @kozmos-ds/react
│   │   ├── src/
│   │   │   ├── components/         # One directory per component:
│   │   │   │   └── Button/         #   Button.tsx, .test.tsx, .stories.tsx, .mdx, .figma.tsx, index.ts
│   │   │   ├── context/, theme/    # DesignConfigProvider and KozmosTheme
│   │   │   ├── hooks/, utils/
│   │   │   └── index.ts            # The package's exports
│   │   ├── vite.config.mts         # The build: Vite library mode
│   │   └── dist/                   # What npm ships, types included (index.d.ts)
│   │
│   ├── icons/                      # @kozmos-ds/icons
│   ├── product-contracts/          # @kozmos-ds/product-contracts
│   │
│   ├── ios/                        # SwiftUI: the Swift package Kozmos (library Kozmos)
│   │   ├── Sources/
│   │   │   ├── Components/         # KozmosButton, KozmosAccordion, …
│   │   │   ├── KozmosColors.swift, …  # The generated token sources
│   │   │   ├── ProductContracts/
│   │   │   └── Providers/
│   │   ├── Tests/
│   │   └── Package.swift
│   │
│   ├── android/                    # Jetpack Compose: com.kozmos
│   │   ├── src/main/java/com/kozmos/
│   │   │   ├── components/         # One package per component: com.kozmos.components.button, …
│   │   │   ├── tokens/             # KozmosThemeTokens and the generated token sources
│   │   │   └── contracts/, providers/
│   │   └── build.gradle.kts
│   │
│   └── vue/                        # Private: mounts the React components in Vue, never published
│
├── apps/
│   ├── docs/                       # Storybook (@kozmos-ds/docs), the component reference
│   ├── site/                       # The website
│   └── …                           # Playgrounds and the Pointr QA app
│
├── docs/                           # The written documentation, and docs/claude-design, generated
├── scripts/                        # The checks, run by their package.json names
├── tests/visual/                   # The visual review's suite and its baselines
├── .changeset/                     # Changes waiting for a release
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # pnpm workspace
├── package.json                    # Root package.json
├── tsconfig.base.json              # Shared TypeScript config
├── eslint.config.mjs               # ESLint config (Prettier runs with its defaults)
└── AGENTS.md                       # The guide for coding agents
```

A fresh checkout needs no structure made: `pnpm install --frozen-lockfile`, then
`pnpm --filter "@kozmos-ds/react..." build` to build React and what it needs.

---

## 4. Package Configuration

### Root `package.json`

The root [`package.json`](../package.json) holds the repository's commands: over a hundred
scripts, run from the root as `pnpm <name>` (`pnpm run` lists them), and `pnpm skills:check` fails
when a code block in these documents runs a `pnpm` command nothing declares. Three that are often
misremembered:

- `pnpm release` deliberately exits with instructions: nobody publishes from a laptop
  ([publishing-guide.md](./publishing-guide.md)).
- `pnpm version-packages` runs `changeset version`, in a version PR.
- Storybook's commands belong to `@kozmos-ds/docs`: `pnpm --filter @kozmos-ds/docs storybook`.

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

### `turbo.json`

[`turbo.json`](../turbo.json) defines the `build`, `dev`, `test`, `lint`, `typecheck`, `clean` and
`tokens:build` tasks, with `.env` and `tsconfig.base.json` as global dependencies. It has no
Storybook or Figma tasks: those are package and root scripts.

### `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "react-jsx"
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

### Prettier

There is no Prettier configuration file: Prettier runs with its defaults, through `pnpm format`
and through lint-staged on every commit.

### ESLint

ESLint takes the flat configuration in [`eslint.config.mjs`](../eslint.config.mjs)
(typescript-eslint and eslint-plugin-react); there is no `.eslintrc.js`.

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.2/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": {
    "version": false,
    "tag": false
  }
}
```

Private packages are neither versioned nor tagged. Changesets only version here; publishing is
`release.yml`'s alone.

---

## 5. Development Commands

### Common Commands

```bash
# Start every package's dev task
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run React's tests in watch mode
pnpm --filter @kozmos-ds/react test:watch

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Type check all packages
pnpm typecheck

# turbo run clean, then remove the root node_modules
pnpm clean
```

### Package-Specific Commands

```bash
# Tokens
pnpm tokens:build          # Build token outputs
pnpm tokens:sync           # Overwrites src/ from live Figma, which can be behind the code: not routine (see above)

# React
pnpm --filter @kozmos-ds/react dev           # Vite dev server
pnpm --filter @kozmos-ds/react build         # Build
pnpm --filter @kozmos-ds/react test          # Run tests

# iOS
cd packages/ios
swift build                # Build Swift package
swift test                 # Run tests
xcodebuild -scheme Kozmos -destination 'platform=iOS Simulator,name=iPhone 16'

# Android
cd packages/android
./gradlew build           # Build
./gradlew test            # Run tests
./gradlew connectedCheck  # Run instrumented tests

# Icons
pnpm icons:pointr:build   # Regenerate the owned icons from Pointr's Figma artwork (FIGMA_ACCESS_TOKEN)

# Component scaffolding
pnpm new-component <Name> # A React component in packages/react/src/components/<Name>
```

### Storybook Commands

Storybook is `@kozmos-ds/docs`, in `apps/docs`.

```bash
# Start the Storybook dev server on port 6006
pnpm --filter @kozmos-ds/docs storybook

# Build static Storybook into apps/docs/storybook-static
pnpm --filter @kozmos-ds/docs build-storybook

# Compare every story with its baseline (needs Docker)
pnpm test:visual
```

### Figma Code Connect Commands

```bash
# Parse the linked Code Connect files, as CI does
pnpm figma:parse:linked
pnpm figma:parse:native:linked

# Dry-run the publish (reads FIGMA_ACCESS_TOKEN)
pnpm figma:publish:linked:dry

# Publish to the live Figma file, on Olcay's word
pnpm figma:publish:linked
```

### Release Commands

```bash
# Create a changeset
pnpm changeset

# Apply the version bumps, in a version PR
pnpm version-packages
```

Nothing here publishes: `pnpm release` deliberately exits with instructions. A release is
`release.yml`, dispatched and approved by Olcay after `pnpm release:preflight`
([publishing-guide.md](./publishing-guide.md)).

---

## 6. IDE Setup

### VS Code / Cursor Extensions

Install these extensions for optimal development experience:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "styled-components.vscode-styled-components",
    "figma.figma-vscode-extension",
    "orta.vscode-jest",
    "vitest.explorer",
    "streetsidesoftware.code-spell-checker",
    "yoavbls.pretty-ts-errors",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "eslint.workingDirectories": [
    { "pattern": "packages/*" },
    { "pattern": "apps/*" }
  ],
  "files.associations": {
    "*.figma.tsx": "typescriptreact",
    "*.figma.ts": "typescript"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.turbo": true
  }
}
```

### Xcode Setup (iOS)

1. Open `packages/ios/Package.swift` in Xcode
2. Wait for package resolution
3. Select a simulator target
4. Build with ⌘B

### Android Studio Setup

1. Open `packages/android` as project
2. Wait for Gradle sync
3. Connect device or start emulator
4. Run with ▶️

---

## 7. First Run Verification

### Verification Script

Run this script to verify everything is set up correctly:

```bash
#!/bin/bash
# scripts/verify-setup.sh

echo "🔍 Verifying Kozmos Design System setup..."

# Check Node version
echo -n "Node.js: "
node --version

# Check pnpm version
echo -n "pnpm: "
pnpm --version

# Check if dependencies are installed
echo -n "Dependencies: "
if [ -d "node_modules" ]; then
  echo "✅ Installed"
else
  echo "❌ Not installed - run 'pnpm install'"
  exit 1
fi

# Check if tokens build
echo -n "Tokens build: "
if pnpm tokens:build > /dev/null 2>&1; then
  echo "✅ Success"
else
  echo "❌ Failed"
fi

# Check if React builds
echo -n "React build: "
if pnpm --filter @kozmos-ds/react build > /dev/null 2>&1; then
  echo "✅ Success"
else
  echo "❌ Failed"
fi

# Check if tests pass
echo -n "Tests: "
if pnpm test > /dev/null 2>&1; then
  echo "✅ Passing"
else
  echo "❌ Failing"
fi

# Check TypeScript
echo -n "TypeScript: "
if pnpm typecheck > /dev/null 2>&1; then
  echo "✅ No errors"
else
  echo "❌ Errors found"
fi

# Check lint
echo -n "Linting: "
if pnpm lint > /dev/null 2>&1; then
  echo "✅ Clean"
else
  echo "❌ Issues found"
fi

echo ""
echo "✅ Setup verification complete!"
```

### Expected Output

```
🔍 Verifying Kozmos Design System setup...
Node.js: v20.10.0
pnpm: 9.0.0
Dependencies: ✅ Installed
Tokens build: ✅ Success
React build: ✅ Success
Tests: ✅ Passing
TypeScript: ✅ No errors
Linting: ✅ Clean

✅ Setup verification complete!
```

---

## 8. Platform-Specific Setup

### React Package Setup

[`packages/react/package.json`](../packages/react/package.json) is the React package's manifest.
It builds with Vite in library mode (`packages/react/vite.config.mts`: ES modules and a UMD
CommonJS bundle, declarations by `vite-plugin-dts`), tests with Vitest
(`pnpm --filter @kozmos-ds/react test`), and takes `@kozmos-ds/tokens`, `@kozmos-ds/icons` and
`@kozmos-ds/product-contracts` through `workspace:*`. Storybook is not the React package's: it
lives in `apps/docs`.

### iOS Package Setup

[`packages/ios/Package.swift`](../packages/ios/Package.swift) declares the Swift package `Kozmos`
(one library, `Kozmos`, and the `KozmosTests` test target) for iOS 16, macOS 13 and Mac Catalyst
16, with Figma Code Connect and swift-snapshot-testing as its dependencies. It is not published.

### Android Package Setup

[`packages/android/build.gradle.kts`](../packages/android/build.gradle.kts) builds an Android
library with Compose and Paparazzi. It applies no publishing plugin, and the library is not
published.

---

## Quick Start Checklist

```
□ Node.js 20.x installed
□ pnpm 9.x installed
□ Repository cloned
□ pnpm install completed
□ .env with FIGMA_ACCESS_TOKEN, only for the Figma scripts
□ pnpm build succeeds
□ pnpm test passes
□ IDE extensions installed
□ Storybook runs (pnpm --filter @kozmos-ds/docs storybook)
```

---

## Next Steps

After setup is complete:

1. **Read** `code-patterns.md` for component templates
2. **Run** `pnpm new-component <Name>` to scaffold your first component, with a name no component
   has yet (it refuses one that exists)
3. **Start** Storybook with `pnpm --filter @kozmos-ds/docs storybook`
4. **Read** `token-implementation.md` for token setup

---

## Version History

| Version | Date       | Changes                                                 |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0.0   | 2026-02-07 | Initial getting started guide                           |
| 1.1.0   | 2026-09-28 | Commands, workflows, secrets and publishing as they are |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-28
