# Kozmos Design System - Publishing Guide

> **Purpose:** This document provides complete instructions for publishing Kozmos packages to npm, Swift Package Manager, Maven Central, and other registries.

---

## Table of Contents

1. [Publishing Overview](#1-publishing-overview)
2. [npm Publishing](#2-npm-publishing)
3. [iOS (Swift Package Manager)](#3-ios-swift-package-manager)
4. [Android (Maven Central)](#4-android-maven-central)
5. [Figma Code Connect](#5-figma-code-connect)
6. [Changesets Workflow](#6-changesets-workflow)
7. [Version Management](#7-version-management)
8. [Rollback Procedures](#8-rollback-procedures)
9. [Pre-release Versions](#9-pre-release-versions)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Publishing Overview

### Package Registry Matrix

| Package                | Registry      | Command        | Automation |
| ---------------------- | ------------- | -------------- | ---------- |
| `@kozmos/tokens`       | npm           | `pnpm publish` | Changesets |
| `@kozmos/react`        | npm           | `pnpm publish` | Changesets |
| `@kozmos/vue`          | npm           | `pnpm publish` | Changesets |
| `@kozmos/react-native` | npm           | `pnpm publish` | Changesets |
| `@kozmos/icons`        | npm           | `pnpm publish` | Changesets |
| `KozmosSwiftUI`        | SPM (GitHub)  | Git tag        | Manual/CI  |
| `com.kozmos:compose`   | Maven Central | Gradle         | CI         |

### Publishing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHANGESET CREATED                          │
│              pnpm changeset → describe changes                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MERGE TO MAIN                              │
│              Triggers CI → Creates Release PR                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RELEASE PR MERGED                            │
│              Triggers publish workflow                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │   npm    │        │   SPM    │        │  Maven   │
    │ publish  │        │   tag    │        │ publish  │
    └──────────┘        └──────────┘        └──────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │  Code Connect    │
                   │    Publish       │
                   └──────────────────┘
```

---

## 2. npm Publishing

### Prerequisites

```bash
# Verify npm login
npm whoami

# Login if needed
npm login --registry=https://registry.npmjs.org

# Or use automation token
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
```

### Package Configuration

```json
// packages/react/package.json
{
  "name": "@kozmos/react",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true
  },
  "files": ["dist", "README.md", "CHANGELOG.md"],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "sideEffects": ["*.css"]
}
```

### Manual Publishing Steps

```bash
# 1. Ensure clean working directory
git status

# 2. Pull latest
git pull origin main

# 3. Install dependencies
pnpm install

# 4. Build all packages
pnpm build

# 5. Run tests
pnpm test

# 6. Dry run publish
pnpm publish --dry-run

# 7. Publish (if dry run looks good)
pnpm publish

# 8. Verify on npm
npm view @kozmos/react
```

### Automated Publishing (Changesets)

```bash
# Create changeset for your changes
pnpm changeset

# Answer prompts:
# - Select packages that changed
# - Choose version bump (major/minor/patch)
# - Write summary of changes

# Commit the changeset
git add .changeset
git commit -m "chore: add changeset for Button fix"

# Push to create PR
git push

# After merge, release PR is auto-created
# Merging release PR triggers publish
```

### npm Provenance

```yaml
# Enable provenance in CI
- name: Publish with Provenance
  run: pnpm publish --provenance
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 3. iOS (Swift Package Manager)

### Package.swift Configuration

```swift
// packages/ios/Package.swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KozmosSwiftUI",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
        .watchOS(.v9),
        .tvOS(.v16)
    ],
    products: [
        .library(
            name: "KozmosSwiftUI",
            targets: ["KozmosSwiftUI"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "KozmosSwiftUI",
            dependencies: [],
            path: "Sources/KozmosSwiftUI",
            swiftSettings: [
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        .testTarget(
            name: "KozmosSwiftUITests",
            dependencies: ["KozmosSwiftUI"],
            path: "Tests"
        ),
    ]
)
```

### Publishing via Git Tags

```bash
# 1. Ensure package builds
cd packages/ios
swift build -c release

# 2. Run tests
swift test

# 3. Update version in Package.swift (if needed)
# No version in Package.swift - uses git tags

# 4. Create git tag
git tag ios-v1.0.0

# 5. Push tag
git push origin ios-v1.0.0

# Consumers can now reference:
# .package(url: "https://github.com/AcmeCorp/kozmos-ios.git", from: "1.0.0")
```

### Versioning Strategy

```
# Tag format: ios-v{major}.{minor}.{patch}
ios-v1.0.0      # Stable release
ios-v1.1.0-beta.1  # Pre-release

# In Package.swift dependencies:
.package(url: "...", from: "1.0.0")        # >= 1.0.0 < 2.0.0
.package(url: "...", exact: "1.2.3")       # Exactly 1.2.3
.package(url: "...", branch: "main")       # Latest main
```

### Creating XCFramework (Optional)

```bash
# Build for multiple platforms
xcodebuild archive \
  -scheme KozmosSwiftUI \
  -destination "generic/platform=iOS" \
  -archivePath build/KozmosSwiftUI-iOS \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

xcodebuild archive \
  -scheme KozmosSwiftUI \
  -destination "generic/platform=iOS Simulator" \
  -archivePath build/KozmosSwiftUI-iOS-Simulator \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

# Create XCFramework
xcodebuild -create-xcframework \
  -framework build/KozmosSwiftUI-iOS.xcarchive/Products/Library/Frameworks/KozmosSwiftUI.framework \
  -framework build/KozmosSwiftUI-iOS-Simulator.xcarchive/Products/Library/Frameworks/KozmosSwiftUI.framework \
  -output build/KozmosSwiftUI.xcframework
```

---

## 4. Android (Maven Central)

### Gradle Configuration

```kotlin
// packages/android/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("maven-publish")
    id("signing")
}

android {
    namespace = "com.kozmos.compose"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        aarMetadata {
            minCompileSdk = 24
        }
    }

    buildFeatures {
        compose = true
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
            withJavadocJar()
        }
    }
}

publishing {
    publications {
        create<MavenPublication>("release") {
            groupId = "com.kozmos"
            artifactId = "compose"
            version = findProperty("VERSION_NAME") as String? ?: "1.0.0"

            afterEvaluate {
                from(components["release"])
            }

            pom {
                name.set("Kozmos Compose")
                description.set("Jetpack Compose components for Kozmos Design System")
                url.set("https://github.com/AcmeCorp/kozmos-android")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }

                developers {
                    developer {
                        id.set("kozmos")
                        name.set("Kozmos Team")
                        email.set("kozmos@acmecorp.com")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/AcmeCorp/kozmos-android.git")
                    developerConnection.set("scm:git:ssh://github.com:AcmeCorp/kozmos-android.git")
                    url.set("https://github.com/AcmeCorp/kozmos-android")
                }
            }
        }
    }

    repositories {
        maven {
            name = "MavenCentral"
            url = uri("https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/")
            credentials {
                username = findProperty("MAVEN_USERNAME") as String? ?: System.getenv("MAVEN_USERNAME")
                password = findProperty("MAVEN_PASSWORD") as String? ?: System.getenv("MAVEN_PASSWORD")
            }
        }
    }
}

signing {
    val signingKeyId = findProperty("SIGNING_KEY_ID") as String?
    val signingKey = findProperty("SIGNING_KEY") as String?
    val signingPassword = findProperty("SIGNING_PASSWORD") as String?

    if (signingKeyId != null && signingKey != null && signingPassword != null) {
        useInMemoryPgpKeys(signingKeyId, signingKey, signingPassword)
        sign(publishing.publications["release"])
    }
}
```

### Publishing Steps

```bash
# 1. Set version
export VERSION_NAME=1.0.0

# 2. Build
cd packages/android
./gradlew build

# 3. Run tests
./gradlew test

# 4. Publish to staging
./gradlew publishReleasePublicationToMavenCentralRepository

# 5. Close and release staging repository (via Sonatype UI)
# Or use Gradle plugin:
./gradlew closeAndReleaseRepository
```

### Gradle Properties

```properties
# ~/.gradle/gradle.properties (local) or CI secrets

# Maven Central credentials
MAVEN_USERNAME=your-username
MAVEN_PASSWORD=your-password

# GPG signing
SIGNING_KEY_ID=12345678
SIGNING_PASSWORD=your-gpg-password
SIGNING_KEY=-----BEGIN PGP PRIVATE KEY BLOCK-----\n...\n-----END PGP PRIVATE KEY BLOCK-----
```

---

## 5. Figma Code Connect

### Publishing Code Connect

```bash
# Parse and validate
npx figma connect parse packages/react

# Publish to Figma
npx figma connect publish packages/react

# Publish all packages
pnpm figma:publish
```

### Code Connect Configuration

```json
// packages/react/figma.config.json
{
  "codeConnect": {
    "parser": "react",
    "include": ["src/**/*.figma.tsx"],
    "label": "React"
  }
}
```

```json
// packages/ios/figma.config.json
{
  "codeConnect": {
    "parser": "swift",
    "include": ["Sources/**/*.figma.swift"],
    "label": "SwiftUI"
  }
}
```

```json
// packages/android/figma.config.json
{
  "codeConnect": {
    "parser": "kotlin",
    "include": ["**/figma/**/*.kt"],
    "label": "Compose"
  }
}
```

### CI Integration

```yaml
# Publish Code Connect after npm publish
- name: Publish Code Connect
  if: steps.changesets.outputs.published == 'true'
  run: |
    npx figma connect publish packages/react
    npx figma connect publish packages/ios
    npx figma connect publish packages/android
  env:
    FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
```

---

## 6. Changesets Workflow

### Creating Changesets

```bash
# Interactive changeset creation
pnpm changeset

# Questions:
# 1. Which packages have changes?
#    ◯ @kozmos/tokens
#    ◉ @kozmos/react
#    ◯ @kozmos/vue
#
# 2. Are there major changes? (y/N)
# 3. Are there minor changes? (y/N) - y
#
# 4. Summary of changes:
#    Added new Tooltip component with support for all positions

# Creates: .changeset/funny-pens-dance.md
```

### Changeset File Format

```markdown
---
"@kozmos/react": minor
---

Added new Tooltip component

- Supports top, bottom, left, right positions
- Dark and light variants
- Accessible with ARIA attributes
- Keyboard navigation support
```

### Multiple Package Changes

```markdown
---
"@kozmos/tokens": patch
"@kozmos/react": minor
"@kozmos/vue": minor
---

Updated tooltip tokens and added Tooltip component

**Tokens:**

- Added tooltip-specific color tokens

**React & Vue:**

- New Tooltip component
- Supports all positions and variants
```

### Changeset Configuration

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "AcmeCorp/kozmos-design-system" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [
    ["@kozmos/tokens", "@kozmos/react", "@kozmos/vue", "@kozmos/react-native"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["docs"]
}
```

---

## 7. Version Management

### Semantic Versioning

| Change Type     | Version Bump | Example              |
| --------------- | ------------ | -------------------- |
| Breaking change | Major        | 1.0.0 → 2.0.0        |
| New feature     | Minor        | 1.0.0 → 1.1.0        |
| Bug fix         | Patch        | 1.0.0 → 1.0.1        |
| Pre-release     | Pre-release  | 1.0.0 → 1.1.0-beta.1 |

### Version Sync Across Platforms

```javascript
// scripts/sync-versions.js
const fs = require("fs");
const path = require("path");

const packageJson = require("../packages/react/package.json");
const version = packageJson.version;

// Update iOS
const packageSwift = fs.readFileSync("packages/ios/Package.swift", "utf8");
// SPM uses git tags, no version in Package.swift

// Update Android
const gradleProps = `VERSION_NAME=${version}`;
fs.writeFileSync("packages/android/gradle.properties", gradleProps);

console.log(`Synced version ${version} across platforms`);
```

### Keeping Versions in Sync

```yaml
# .github/workflows/version-sync.yml
name: Version Sync

on:
  push:
    branches: [main]
    paths:
      - "packages/react/package.json"

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: version
        run: |
          VERSION=$(node -p "require('./packages/react/package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Create iOS tag
        run: |
          git tag ios-v${{ steps.version.outputs.version }}
          git push origin ios-v${{ steps.version.outputs.version }}

      - name: Update Android version
        run: |
          echo "VERSION_NAME=${{ steps.version.outputs.version }}" > packages/android/gradle.properties
```

---

## 8. Rollback Procedures

### npm Rollback

```bash
# Option 1: Deprecate (recommended)
npm deprecate @kozmos/react@1.2.3 "Critical bug, use 1.2.4 instead"

# Option 2: Unpublish (within 72 hours only)
npm unpublish @kozmos/react@1.2.3

# Option 3: Publish patched version
# 1. Revert changes
git revert HEAD
# 2. Create patch changeset
pnpm changeset
# 3. Publish
pnpm release
```

### iOS Rollback

```bash
# Delete the problematic tag
git tag -d ios-v1.2.3
git push origin :refs/tags/ios-v1.2.3

# Create fixed tag
git tag ios-v1.2.4
git push origin ios-v1.2.4

# Notify users to update Package.resolved
```

### Android Rollback

```bash
# Maven Central doesn't allow deletion
# Publish a new patch version with fix
./gradlew -PVERSION_NAME=1.2.4 publishReleasePublicationToMavenCentralRepository

# Close problematic staging repository (if not released yet)
./gradlew closeRepository
```

### Hotfix Process

```bash
# 1. Create hotfix branch from tag
git checkout -b hotfix/1.2.4 v1.2.3

# 2. Apply fix
# ... make changes ...

# 3. Create changeset
pnpm changeset
# Select patch bump

# 4. Merge to main
git checkout main
git merge hotfix/1.2.4

# 5. Publish
pnpm release
```

---

## 9. Pre-release Versions

### Alpha/Beta Releases

```bash
# Enter pre-release mode
pnpm changeset pre enter beta

# Create changeset as normal
pnpm changeset

# Exit pre-release mode (for stable release)
pnpm changeset pre exit
```

### Pre-release Tags

```bash
# npm
@kozmos/react@2.0.0-beta.1
@kozmos/react@2.0.0-beta.2
@kozmos/react@2.0.0-rc.1
@kozmos/react@2.0.0

# iOS (git tags)
ios-v2.0.0-beta.1
ios-v2.0.0-rc.1
ios-v2.0.0

# Android
com.kozmos:compose:2.0.0-beta01
com.kozmos:compose:2.0.0-rc01
com.kozmos:compose:2.0.0
```

### Publishing Pre-releases

```bash
# Publish to npm with beta tag
pnpm publish --tag beta

# Consumers install with:
npm install @kozmos/react@beta
```

### Canary Releases

```yaml
# .github/workflows/canary.yml
name: Canary

on:
  push:
    branches: [develop]

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build
        run: pnpm build

      - name: Publish canary
        run: |
          # Set canary version
          COMMIT_SHA=${GITHUB_SHA::7}
          VERSION=$(node -p "require('./packages/react/package.json').version")
          CANARY_VERSION="${VERSION}-canary.${COMMIT_SHA}"

          # Update version
          pnpm version ${CANARY_VERSION} --no-git-tag-version

          # Publish with canary tag
          pnpm publish --tag canary --no-git-checks
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 10. Troubleshooting

### Common npm Issues

#### "You do not have permission to publish"

```bash
# Check npm access
npm access ls-packages

# Add yourself to organization
npm org set @kozmos developer username

# Or login with correct account
npm logout
npm login
```

#### "Package name too similar to existing package"

```bash
# Use scoped package name
# Change from: kozmos-react
# To: @kozmos/react
```

#### "Integrity checksum failed"

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Common iOS Issues

#### "No such module 'KozmosSwiftUI'"

```swift
// Ensure Package.swift targets are correct
// Consumer's Package.swift:
dependencies: [
    .package(url: "https://github.com/AcmeCorp/kozmos-ios.git", from: "1.0.0")
],
targets: [
    .target(
        name: "MyApp",
        dependencies: [
            .product(name: "KozmosSwiftUI", package: "kozmos-ios")
        ]
    )
]
```

#### SPM not finding latest version

```bash
# Consumer should reset package cache
# In Xcode: File → Packages → Reset Package Caches
# Or delete Package.resolved and re-resolve
```

### Common Android Issues

#### Signing failed

```bash
# Verify GPG key
gpg --list-secret-keys

# Export key for CI
gpg --export-secret-keys YOUR_KEY_ID | base64

# Add to CI secrets as SIGNING_KEY
```

#### Repository timeout

```kotlin
// Increase timeout in build.gradle.kts
repositories {
    maven {
        url = uri("https://s01.oss.sonatype.org/...")
        // Add timeout
        isAllowInsecureProtocol = false
    }
}
```

### Verification Commands

```bash
# Verify npm package
npm view @kozmos/react

# Test install
npm pack @kozmos/react
# Creates: kozmos-react-1.0.0.tgz

# Verify iOS package
swift package resolve
swift package show-dependencies

# Verify Android package
./gradlew dependencies
```

---

## Quick Reference

### Publishing Checklist

```
□ All tests passing
□ Build succeeds
□ Changeset created
□ CHANGELOG updated
□ Version bumped
□ Code Connect validated
□ No console errors/warnings
□ Documentation updated
```

### Registry URLs

| Registry            | URL                           |
| ------------------- | ----------------------------- |
| npm                 | https://registry.npmjs.org    |
| GitHub Packages     | https://npm.pkg.github.com    |
| Maven Central       | https://s01.oss.sonatype.org  |
| Swift Package Index | https://swiftpackageindex.com |

---

## Version History

| Version | Date       | Changes                  |
| ------- | ---------- | ------------------------ |
| 1.0.0   | 2026-02-07 | Initial publishing guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
