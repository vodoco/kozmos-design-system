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
git clone https://github.com/AcmeCorp/kozmos-design-system.git
cd kozmos-design-system

# Or if using SSH
git clone git@github.com:AcmeCorp/kozmos-design-system.git
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

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
# Required variables:
# - FIGMA_ACCESS_TOKEN (for Code Connect)
# - CHROMATIC_PROJECT_TOKEN (for visual regression)
# - NPM_TOKEN (for publishing)
```

### `.env.local` Template

```bash
# Figma Integration
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxx

# Visual Regression (Chromatic)
CHROMATIC_PROJECT_TOKEN=chpt_xxxxxxxxxxxxxxxxxxxx

# npm Publishing
NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx

# Optional: Turbo Remote Caching
TURBO_TOKEN=
TURBO_TEAM=

# Development
NODE_ENV=development
DEBUG=kozmos:*
```

---

## 3. Project Structure

### Complete Directory Structure

```
kozmos-design-system/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Main CI pipeline
│   │   ├── publish.yml            # Package publishing
│   │   ├── chromatic.yml          # Visual regression
│   │   └── codeql.yml             # Security scanning
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── .ai-skills/                     # AI agent reference docs
│   ├── README.md
│   ├── design-philosophy.md
│   ├── code-patterns.md
│   └── ... (other skill files)
│
├── packages/
│   ├── tokens/                     # Design tokens
│   │   ├── src/
│   │   │   ├── tokens.json         # DTCG token source
│   │   │   ├── themes/
│   │   │   │   ├── light.json
│   │   │   │   └── dark.json
│   │   │   └── platforms/          # Platform-specific overrides
│   │   ├── build/                  # Generated output
│   │   ├── sd.config.js            # Style Dictionary config
│   │   └── package.json
│   │
│   ├── react/                      # React components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   ├── Button.figma.tsx
│   │   │   │   │   ├── Button.css
│   │   │   │   │   └── index.ts
│   │   │   │   └── ... (other components)
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── styles/
│   │   │   │   └── tokens.css      # Generated from @kozmos-ds/tokens
│   │   │   └── index.ts            # Barrel export
│   │   ├── .storybook/
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   ├── vue/                        # Vue/Web Components
│   │   ├── src/
│   │   │   ├── components/         # Lit Web Components
│   │   │   ├── vue-wrappers/       # Vue 3 wrappers
│   │   │   └── index.ts
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── ios/                        # SwiftUI components
│   │   ├── Sources/
│   │   │   └── KozmosSwiftUI/
│   │   │       ├── Components/
│   │   │       │   ├── Button/
│   │   │       │   │   ├── KozmosButton.swift
│   │   │       │   │   └── KozmosButton.figma.swift
│   │   │       │   └── ...
│   │   │       ├── Tokens/
│   │   │       │   └── KozmosTokens.swift  # Generated
│   │   │       └── Theme/
│   │   ├── Tests/
│   │   ├── Package.swift
│   │   └── figma.config.json
│   │
│   ├── android/                    # Jetpack Compose
│   │   ├── kozmos/
│   │   │   └── src/
│   │   │       └── main/
│   │   │           └── kotlin/
│   │   │               └── com/kozmos/compose/
│   │   │                   ├── components/
│   │   │                   ├── tokens/
│   │   │                   │   └── KozmosTokens.kt  # Generated
│   │   │                   └── theme/
│   │   ├── build.gradle.kts
│   │   ├── settings.gradle.kts
│   │   └── figma.config.json
│   │
│   ├── react-native/               # React Native
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── tokens/
│   │   │   │   └── index.ts        # Generated JS tokens
│   │   │   └── theme/
│   │   ├── example/                # Example app
│   │   └── package.json
│   │
│   └── icons/                      # Icon library
│       ├── svg/                    # Source SVGs
│       ├── src/
│       │   ├── react/              # Generated React icons
│       │   ├── vue/                # Generated Vue icons
│       │   └── native/             # Generated native icons
│       ├── scripts/
│       │   └── generate.ts         # Icon generation script
│       └── package.json
│
├── apps/
│   └── docs/                       # Documentation site
│       ├── src/
│       ├── astro.config.mjs
│       └── package.json
│
├── scripts/
│   ├── generate-tokens.ts          # Token generation
│   ├── generate-icons.ts           # Icon generation
│   ├── new-component.ts            # Component scaffolding
│   └── sync-figma.ts               # Figma sync
│
├── .changeset/                     # Changesets config
│   └── config.json
│
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # pnpm workspace
├── package.json                    # Root package.json
├── tsconfig.base.json              # Shared TypeScript config
├── .prettierrc                     # Prettier config
├── .eslintrc.js                    # ESLint config
├── PROJECT_SCOPE.md                # Full specification
└── README.md
```

### Creating the Structure

```bash
# Create the directory structure
mkdir -p packages/{tokens,react,vue,ios,android,react-native,icons}/{src,tests}
mkdir -p packages/react/src/components
mkdir -p packages/react/.storybook
mkdir -p packages/ios/Sources/KozmosSwiftUI/{Components,Tokens,Theme}
mkdir -p packages/android/kozmos/src/main/kotlin/com/kozmos/compose
mkdir -p packages/icons/{svg,scripts}
mkdir -p apps/docs/src
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p .changeset
```

---

## 4. Package Configuration

### Root `package.json`

```json
{
  "name": "kozmos-design-system",
  "private": true,
  "version": "0.0.0",
  "description": "Multi-platform design system for Pointr SDK",
  "repository": {
    "type": "git",
    "url": "https://github.com/AcmeCorp/kozmos-design-system.git"
  },
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "tokens:build": "pnpm --filter @kozmos-ds/tokens build",
    "tokens:sync": "tsx scripts/sync-figma.ts",
    "icons:generate": "tsx scripts/generate-icons.ts",
    "new-component": "tsx scripts/new-component.ts",
    "storybook": "pnpm --filter @kozmos-ds/react storybook",
    "build-storybook": "pnpm --filter @kozmos-ds/react build-storybook",
    "chromatic": "pnpm --filter @kozmos-ds/react chromatic",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish",
    "figma:connect": "turbo run figma:connect",
    "figma:publish": "turbo run figma:publish",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.0",
    "tsx": "^4.7.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**", "!.next/cache/**"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "clean": {
      "cache": false
    },
    "storybook": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"],
      "cache": true
    },
    "figma:connect": {
      "dependsOn": ["build"],
      "cache": false
    },
    "figma:publish": {
      "dependsOn": ["figma:connect"],
      "cache": false
    }
  }
}
```

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

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### `.eslintrc.js`

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "jsx-a11y/anchor-is-valid": "off",
  },
  ignorePatterns: [
    "dist",
    "build",
    "node_modules",
    "*.config.js",
    "*.config.ts",
  ],
};
```

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

## 5. Development Commands

### Common Commands

```bash
# Start all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint all packages
pnpm lint

# Format all files
pnpm format

# Type check all packages
pnpm typecheck

# Clean all build artifacts
pnpm clean
```

### Package-Specific Commands

```bash
# Tokens
pnpm tokens:build          # Build token outputs
pnpm tokens:sync           # Sync from Figma

# React
pnpm --filter @kozmos-ds/react dev           # Dev mode
pnpm --filter @kozmos-ds/react build         # Build
pnpm --filter @kozmos-ds/react test          # Run tests
pnpm --filter @kozmos-ds/react storybook     # Start Storybook

# iOS
cd packages/ios
swift build                # Build Swift package
swift test                 # Run tests
xcodebuild -scheme KozmosSwiftUI -destination 'platform=iOS Simulator,name=iPhone 15'

# Android
cd packages/android
./gradlew build           # Build
./gradlew test            # Run tests
./gradlew connectedCheck  # Run instrumented tests

# Icons
pnpm icons:generate       # Generate icons from SVGs

# Component scaffolding
pnpm new-component Button     # Create new component
pnpm new-component Modal --compound  # Create compound component
```

### Storybook Commands

```bash
# Start Storybook dev server
pnpm storybook

# Build static Storybook
pnpm build-storybook

# Run Chromatic visual tests
pnpm chromatic
```

### Figma Code Connect Commands

```bash
# Parse and validate Code Connect files
pnpm figma:connect

# Publish to Figma
pnpm figma:publish

# Or manually per package
npx figma connect parse packages/react
npx figma connect publish packages/react
```

### Release Commands

```bash
# Create a changeset
pnpm changeset

# Apply version bumps
pnpm version-packages

# Publish to npm
pnpm release
```

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

```bash
cd packages/react

# package.json essentials
{
  "name": "@kozmos-ds/react",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "sideEffects": ["*.css"],
  "files": ["dist"],
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@kozmos-ds/tokens": "workspace:*",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@storybook/react-vite": "^8.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^23.0.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  }
}
```

### iOS Package Setup

```swift
// packages/ios/Package.swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KozmosSwiftUI",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "KozmosSwiftUI",
            targets: ["KozmosSwiftUI"]
        ),
    ],
    dependencies: [
        // Add dependencies here if needed
    ],
    targets: [
        .target(
            name: "KozmosSwiftUI",
            dependencies: [],
            path: "Sources/KozmosSwiftUI"
        ),
        .testTarget(
            name: "KozmosSwiftUITests",
            dependencies: ["KozmosSwiftUI"],
            path: "Tests"
        ),
    ]
)
```

### Android Package Setup

```kotlin
// packages/android/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
}

android {
    namespace = "com.kozmos.compose"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
```

---

## Quick Start Checklist

```
□ Node.js 20.x installed
□ pnpm 9.x installed
□ Repository cloned
□ pnpm install completed
□ .env.local configured
□ pnpm build succeeds
□ pnpm test passes
□ IDE extensions installed
□ Storybook runs (pnpm storybook)
```

---

## Next Steps

After setup is complete:

1. **Read** `code-patterns.md` for component templates
2. **Run** `pnpm new-component Button` to scaffold your first component
3. **Start** Storybook with `pnpm storybook`
4. **Read** `token-implementation.md` for token setup

---

## Version History

| Version | Date       | Changes                       |
| ------- | ---------- | ----------------------------- |
| 1.0.0   | 2026-02-07 | Initial getting started guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
