# Kozmos Design System - CI/CD Configuration Guide

> **Purpose:** This document provides ready-to-use CI/CD workflow configurations for the Kozmos Design System, including GitHub Actions, secrets management, and deployment pipelines.

---

## Table of Contents

1. [CI/CD Overview](#1-cicd-overview)
2. [GitHub Actions Workflows](#2-github-actions-workflows)
3. [Secrets Management](#3-secrets-management)
4. [Build Workflows](#4-build-workflows)
5. [Test Workflows](#5-test-workflows)
6. [Publishing Workflows](#6-publishing-workflows)
7. [Visual Regression](#7-visual-regression)
8. [Security Scanning](#8-security-scanning)
9. [Release Automation](#9-release-automation)
10. [Monitoring & Notifications](#10-monitoring--notifications)

---

## 1. CI/CD Overview

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PULL REQUEST                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  Build   │        │   Test   │        │   Lint   │
    └────┬─────┘        └────┬─────┘        └────┬─────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │  Visual  │       │ Bundle   │       │ Security │
    │  Review  │       │  Size    │       │   Scan   │
    └────┬─────┘       └────┬─────┘       └────┬─────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  PR Approved   │
                   └───────┬────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │  Merge to Main │
                   └───────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ npm Pub  │     │ iOS Pub  │     │ Android  │
    │          │     │   SPM    │     │  Maven   │
    └──────────┘     └──────────┘     └──────────┘
```

### Workflow Files Structure

```
.github/
├── workflows/
│   ├── ci.yml              # Main CI pipeline
│   ├── test.yml            # Comprehensive testing
│   ├── publish.yml         # Package publishing
│   ├── visual.yml          # Visual Review: every story × light/dark
│   ├── codeql.yml          # Security scanning
│   ├── release.yml         # Release automation
│   ├── tokens-sync.yml     # Figma token sync
│   └── docs.yml            # Documentation deployment
├── actions/
│   └── setup/
│       └── action.yml      # Reusable setup action
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── component_request.md
├── PULL_REQUEST_TEMPLATE.md
└── CODEOWNERS
```

---

## 2. GitHub Actions Workflows

### Reusable Setup Action

```yaml
# .github/actions/setup/action.yml
name: "Setup"
description: "Setup Node.js, pnpm, and dependencies"

inputs:
  node-version:
    description: "Node.js version"
    required: false
    default: "20"

runs:
  using: "composite"
  steps:
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: "pnpm"

    - name: Install dependencies
      shell: bash
      run: pnpm install --frozen-lockfile

    - name: Turbo Cache
      uses: actions/cache@v4
      with:
        path: .turbo
        key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          turbo-${{ runner.os }}-
```

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # =========================================================================
  # Build
  # =========================================================================
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build all packages
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            packages/*/dist
            packages/*/build
          retention-days: 7

  # =========================================================================
  # Lint & Typecheck
  # =========================================================================
  lint:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Format check
        run: pnpm format:check

  # =========================================================================
  # Test - React
  # =========================================================================
  test-react:
    name: Test React
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Run tests
        run: pnpm --filter @kozmos/react test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: packages/react/coverage/coverage-final.json
          flags: react
          token: ${{ secrets.CODECOV_TOKEN }}

  # =========================================================================
  # Test - iOS
  # =========================================================================
  test-ios:
    name: Test iOS
    runs-on: macos-14
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app

      - name: Build
        run: |
          cd packages/ios
          swift build

      - name: Test
        run: |
          cd packages/ios
          swift test

  # =========================================================================
  # Test - Android
  # =========================================================================
  test-android:
    name: Test Android
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Build and Test
        run: |
          cd packages/android
          ./gradlew test

  # =========================================================================
  # Bundle Size
  # =========================================================================
  bundle-size:
    name: Bundle Size
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Check bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pattern: "packages/*/dist/**/*.js"
          exclude: "{**/*.map,**/node_modules/**}"

  # =========================================================================
  # Accessibility
  # =========================================================================
  accessibility:
    name: Accessibility
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Run a11y tests
        run: pnpm --filter @kozmos/react test -- --grep "accessibility"

  # =========================================================================
  # Required Status Check
  # =========================================================================
  ci-ok:
    name: CI OK
    runs-on: ubuntu-latest
    needs:
      [
        build,
        lint,
        test-react,
        test-ios,
        test-android,
        bundle-size,
        accessibility,
      ]
    if: always()
    steps:
      - name: Check all jobs
        run: |
          if [[ "${{ needs.build.result }}" != "success" ]] ||
             [[ "${{ needs.lint.result }}" != "success" ]] ||
             [[ "${{ needs.test-react.result }}" != "success" ]] ||
             [[ "${{ needs.test-ios.result }}" != "success" ]] ||
             [[ "${{ needs.test-android.result }}" != "success" ]] ||
             [[ "${{ needs.bundle-size.result }}" != "success" ]] ||
             [[ "${{ needs.accessibility.result }}" != "success" ]]; then
            echo "One or more required jobs failed"
            exit 1
          fi
          echo "All required jobs passed!"
```

---

## 3. Secrets Management

### Required Secrets

| Secret               | Purpose          | How to Get                |
| -------------------- | ---------------- | ------------------------- |
| `NPM_TOKEN`          | npm publishing   | npm.com → Access Tokens   |
| `FIGMA_ACCESS_TOKEN` | Figma API access | Figma → Account Settings  |
| `CODECOV_TOKEN`      | Code coverage    | codecov.io → Settings     |
| `SLACK_WEBHOOK_URL`  | Notifications    | Slack → Incoming Webhooks |

### Setting Up Secrets

```bash
# Using GitHub CLI
gh secret set NPM_TOKEN --body "npm_xxxxxxxxxxxx"
gh secret set FIGMA_ACCESS_TOKEN --body "figd_xxxxxxxxxxxx"
gh secret set CODECOV_TOKEN --body "xxxxxxxxxxxx"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/xxx"
```

### Environment-Specific Secrets

```yaml
# Define environments in repo settings
# Settings → Environments → New environment

# Production environment
# - Required reviewers: 2
# - Wait timer: 10 minutes
# - Deployment branches: main only
```

---

## 4. Build Workflows

### Token Build Workflow

```yaml
# .github/workflows/tokens.yml
name: Tokens

on:
  push:
    paths:
      - "packages/tokens/**"
  pull_request:
    paths:
      - "packages/tokens/**"
  workflow_dispatch:
    inputs:
      sync-from-figma:
        description: "Sync tokens from Figma"
        type: boolean
        default: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Sync from Figma
        if: inputs.sync-from-figma
        run: pnpm tokens:sync
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
          FIGMA_FILE_KEY: ${{ secrets.FIGMA_FILE_KEY }}

      - name: Validate tokens
        run: pnpm --filter @kozmos/tokens validate

      - name: Build tokens
        run: pnpm --filter @kozmos/tokens build

      - name: Verify outputs
        run: |
          test -f packages/tokens/build/css/tokens.css
          test -f packages/tokens/build/js/tokens.js
          test -f packages/tokens/build/ios/KozmosTokens.swift
          test -f packages/tokens/build/android/KozmosTokens.kt

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: token-artifacts
          path: packages/tokens/build
```

### Storybook Build Workflow

```yaml
# .github/workflows/storybook.yml
name: Storybook

on:
  push:
    branches: [main]
    paths:
      - "packages/react/**"
  pull_request:
    paths:
      - "packages/react/**"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build Storybook
        run: pnpm --filter @kozmos/react build-storybook

      - name: Upload Storybook
        uses: actions/upload-artifact@v4
        with:
          name: storybook
          path: packages/react/storybook-static

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download Storybook
        uses: actions/download-artifact@v4
        with:
          name: storybook
          path: storybook-static

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: storybook-static
```

---

## 5. Test Workflows

### Comprehensive Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  # =========================================================================
  # Unit Tests - All Platforms
  # =========================================================================
  unit-tests:
    strategy:
      fail-fast: false
      matrix:
        include:
          - package: "@kozmos/react"
            runner: ubuntu-latest
          - package: "@kozmos/vue"
            runner: ubuntu-latest
          - package: "@kozmos/react-native"
            runner: ubuntu-latest
          - package: "ios"
            runner: macos-14
          - package: "android"
            runner: ubuntu-latest

    name: Test ${{ matrix.package }}
    runs-on: ${{ matrix.runner }}

    steps:
      - uses: actions/checkout@v4

      # Node.js packages
      - name: Setup Node
        if: matrix.package != 'ios' && matrix.package != 'android'
        uses: ./.github/actions/setup

      - name: Run Node tests
        if: matrix.package != 'ios' && matrix.package != 'android'
        run: pnpm --filter ${{ matrix.package }} test -- --coverage

      # iOS
      - name: Select Xcode
        if: matrix.package == 'ios'
        run: sudo xcode-select -s /Applications/Xcode_15.2.app

      - name: Run iOS tests
        if: matrix.package == 'ios'
        run: |
          cd packages/ios
          swift test

      # Android
      - name: Setup Java
        if: matrix.package == 'android'
        uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Run Android tests
        if: matrix.package == 'android'
        run: |
          cd packages/android
          ./gradlew test

  # =========================================================================
  # Integration Tests
  # =========================================================================
  integration:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build all
        run: pnpm build

      - name: Run integration tests
        run: pnpm test:integration

  # =========================================================================
  # E2E Tests
  # =========================================================================
  e2e:
    runs-on: ubuntu-latest
    needs: integration
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build Storybook
        run: pnpm --filter @kozmos/react build-storybook

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results
```

---

## 6. Publishing Workflows

### npm Publishing Workflow

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  push:
    branches: [main]
    paths-ignore:
      - "**.md"
      - ".github/**"

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build
        run: pnpm build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm release
          commit: "chore: release packages"
          title: "chore: release packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish Code Connect
        if: steps.changesets.outputs.published == 'true'
        run: |
          pnpm figma:publish
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}

      - name: Notify Slack
        if: steps.changesets.outputs.published == 'true'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Kozmos packages published!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "New versions published:\n${{ steps.changesets.outputs.publishedPackages }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### iOS (Swift Package) Publishing

```yaml
# .github/workflows/publish-ios.yml
name: Publish iOS

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: "Version to publish"
        required: true

jobs:
  publish:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4

      - name: Setup Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app

      - name: Build
        run: |
          cd packages/ios
          swift build -c release

      - name: Create XCFramework
        run: |
          cd packages/ios
          xcodebuild -create-xcframework \
            -library .build/release/libKozmosSwiftUI.a \
            -output KozmosSwiftUI.xcframework

      - name: Create Release Tag
        run: |
          cd packages/ios
          git tag ios-v${{ inputs.version || github.event.release.tag_name }}
          git push origin ios-v${{ inputs.version || github.event.release.tag_name }}
```

### Android (Maven) Publishing

```yaml
# .github/workflows/publish-android.yml
name: Publish Android

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: "Version to publish"
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Publish to Maven Central
        run: |
          cd packages/android
          ./gradlew publishToMavenCentral --no-configuration-cache
        env:
          MAVEN_USERNAME: ${{ secrets.MAVEN_USERNAME }}
          MAVEN_PASSWORD: ${{ secrets.MAVEN_PASSWORD }}
          SIGNING_KEY_ID: ${{ secrets.SIGNING_KEY_ID }}
          SIGNING_PASSWORD: ${{ secrets.SIGNING_PASSWORD }}
          SIGNING_KEY: ${{ secrets.SIGNING_KEY }}
```

---

## 7. Visual Regression

### Visual Review

`.github/workflows/visual.yml` runs the repository's own visual review. Every story in the built
Storybook is drawn in light and dark by Chromium in the Playwright image
(`mcr.microsoft.com/playwright:v1.58.2-noble`) and compared with its baseline in
`tests/visual/baselines`. The `compare` job is the required "Visual Review" check on pull requests.
The `record` job (Actions → Visual Regression → Run workflow on the branch, with `record`) commits
new baselines for the drawings that changed on purpose; push again afterwards, since a workflow's
commit starts no checks. Locally, `pnpm test:visual` compares and `pnpm test:visual:update` records,
both in Docker. `docs/visual-review.md` explains how to read a difference.

---

## 8. Security Scanning

### CodeQL Analysis

```yaml
# .github/workflows/codeql.yml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 0 * * 0" # Weekly on Sunday

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ["javascript-typescript", "swift", "java-kotlin"]

    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

### Dependency Scanning

```yaml
# .github/workflows/dependency-review.yml
name: Dependency Review

on:
  pull_request:
    branches: [main]

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          deny-licenses: GPL-3.0, AGPL-3.0

      - name: Audit npm packages
        run: pnpm audit --audit-level=high
```

---

## 9. Release Automation

### Changeset Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    outputs:
      published: ${{ steps.changesets.outputs.published }}
      publishedPackages: ${{ steps.changesets.outputs.publishedPackages }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build
        run: pnpm build

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm release
          commit: |
            chore: release

            [skip ci]
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  # Trigger platform-specific releases
  release-ios:
    needs: release
    if: needs.release.outputs.published == 'true'
    uses: ./.github/workflows/publish-ios.yml
    secrets: inherit

  release-android:
    needs: release
    if: needs.release.outputs.published == 'true'
    uses: ./.github/workflows/publish-android.yml
    secrets: inherit

  # Update documentation
  update-docs:
    needs: release
    if: needs.release.outputs.published == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        uses: ./.github/actions/setup

      - name: Build docs
        run: pnpm --filter docs build

      - name: Deploy docs
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: apps/docs/dist
```

---

## 10. Monitoring & Notifications

### Slack Notifications

```yaml
# Reusable notification job
notify:
  runs-on: ubuntu-latest
  needs: [build, test]
  if: failure()
  steps:
    - name: Notify Slack on failure
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "❌ CI Failed",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*CI Failed* on `${{ github.ref_name }}`\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                }
              }
            ]
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### GitHub Status Checks

```yaml
# Branch protection rules (configure in repo settings)
# Settings → Branches → Add rule

# Required status checks (GitHub Actions only): every check a pull request runs —
# Web Build & Test, Core Pipeline & POI Gallery, Android Build, iOS Build (skipped,
# and so passing, on a pull request that doesn't touch what it builds), the twelve
# browser shards, analyze-bundle, lighthouse and Visual Review. They are matched by
# name: renaming a job or shard means updating this list in the same change. A pull
# request must also be up to date with main to merge.

# Nothing else is required: no reviews, code-owner review, signed commits or linear
# history. Administrators are not held to the rule (enforce_admins is off), so an
# administrator can merge past a red check; nobody should. Force-pushing to main and
# deleting it are refused, and auto-merge is on.
```

### CODEOWNERS

```
# .github/CODEOWNERS
# Default owners
* @AcmeCorp/kozmos-core

# Package-specific owners
/packages/react/ @AcmeCorp/kozmos-react
/packages/ios/ @AcmeCorp/kozmos-ios
/packages/android/ @AcmeCorp/kozmos-android
/packages/tokens/ @AcmeCorp/kozmos-design

# CI/CD
/.github/ @AcmeCorp/kozmos-devops
```

---

## Quick Reference

### Workflow Commands

```bash
# Trigger workflow manually
gh workflow run ci.yml

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Secrets Commands

```bash
# List secrets
gh secret list

# Set secret
gh secret set SECRET_NAME

# Delete secret
gh secret delete SECRET_NAME
```

---

## Version History

| Version | Date       | Changes                           |
| ------- | ---------- | --------------------------------- |
| 1.0.0   | 2026-02-07 | Initial CI/CD configuration guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
