# Kozmos Design System - CI/CD Configuration Guide

> **Purpose:** What GitHub Actions runs for Kozmos, what a pull request must pass, where the secrets live and how a release reaches npm. Every workflow named here is a file in `.github/workflows/`, and `pnpm skills:check` fails when one of these documents names a workflow, a secret or a `pnpm` command that does not exist.

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

### Pipeline

- A pull request runs CI (`ci.yml`) and Visual Regression (`visual.yml`); one into `main` also runs
  Lighthouse CI (`lighthouse.yml`) and Bundle Size Analysis (`bundle-size.yml`). The 19 checks
  listed under "GitHub Status Checks" (§10) are required on `main`, matched by name, and a pull
  request must be up to date with `main` to merge. One that changes the website, Storybook or a
  package also runs Site (`site.yml`), the website's own checks, which are not required.
- A push to `main` runs the four again, except that CI, Lighthouse CI and the bundle check skip a
  push that changes only documentation (`**.md`, `docs/**`, `.vscode/**`, `LICENSE`). When it
  changes the website, Storybook or a package, Pages (`pages.yml`) publishes the website and
  Storybook to GitHub Pages (§4).
- No package publishes on a merge. A release is a manual dispatch of `release.yml` that Olcay
  approves (§9), and only the npm packages are published (§6).

### Workflow Files

```
.github/
└── workflows/
    ├── ci.yml             # CI: web, twelve browser shards, core pipeline, iOS, Android
    ├── visual.yml         # Visual Regression: the "Visual Review" check, and recording baselines
    ├── lighthouse.yml     # Lighthouse CI over the built Storybook
    ├── bundle-size.yml    # Bundle Size Analysis: the "analyze-bundle" check
    ├── site.yml           # Site: the website's checks, on changes to it (not required)
    ├── pages.yml          # Pages: publishes the website and Storybook from main
    ├── figma-tokens.yml   # Figma Token Synchronization: manual, and off unless enabled
    └── release.yml        # Release Kozmos System: the guarded, approved npm publish
```

`.github/` holds nothing else: no shared actions, issue or pull request templates, Dependabot
configuration or CODEOWNERS file.

---

## 2. GitHub Actions Workflows

### Job Setup

There is no shared setup action. Each job checks out the repository, sets up pnpm 9 and Node 20
itself and installs with `pnpm install --frozen-lockfile` (Lighthouse CI and the bundle check run a
plain `pnpm install`; the release jobs add `--ignore-scripts`).

### CI (`ci.yml`)

Runs on every pull request and on pushes to `main`. A newer push to the same branch cancels the run
in progress, which a job reports as "The operation was canceled".

| Job (check name)              | Runner        | What it runs                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Web Build & Test`            | ubuntu-latest | `pnpm test:release`; the changeset rule (pull requests); lint; `pnpm build`; `pnpm test`; the contract, token and parity checks; `pnpm skills:check`; the package-install check; the Figma plugin and Code Connect checks; the built-library checks in Chromium, Firefox and WebKit |
| Twelve browser shards         | ubuntu-latest | Each serves the built Storybook and runs one suite in one browser: stories and interactions, documentation, POI reference, and map, search and navigation, in Chromium, Firefox and WebKit                                                                                          |
| `Core Pipeline & POI Gallery` | ubuntu-latest | React's Playwright tests, `scripts/skills/check-a11y.ts` and `pnpm test:storybook-regressions` (three browsers) against a running Storybook, then `pnpm test:poi-gallery`                                                                                                           |
| `Changes`                     | ubuntu-latest | Decides whether `iOS Build` builds: on a pull request that touches `packages/ios`, `packages/tokens`, their scripts, `ci.yml`, `package.json` or the lockfile, and on every push to `main`                                                                                          |
| `iOS Build`                   | macos-latest  | `swift build` and `swift test` in `packages/ios`, the POI render tests on a simulator (`scripts/check-ios-poi.mjs`), SwiftUI Code Connect                                                                                                                                           |
| `Android Build`               | ubuntu-latest | `./gradlew assembleDebug` and `./gradlew verifyPaparazziDebug` in `packages/android`, Compose Code Connect                                                                                                                                                                          |

`node scripts/ci-local.mjs --job <job>` runs one of `ci.yml`'s jobs on your machine: `web` (the
default), `browsers`, `pipeline`, `ios` or `android`. `--job browsers` runs the twelve shards one
after another, and `--shard` picks one by its name (`--shard "Documentation (webkit)"`). It uses
fixed ports, so only one session at a time may run it, and it reads only `ci.yml`: the bundle check
(`pnpm tsx scripts/performance/bundle-analyzer.ts`), Lighthouse CI and Visual Review are run by
their own commands.

---

## 3. Secrets Management

### What the Workflows Read

| Secret               | Read by                                                  | Notes                                                                                                                                     |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `FIGMA_ACCESS_TOKEN` | `ci.yml` (Web, iOS and Android jobs), `figma-tokens.yml` | CI's steps that need it, the nested-radius check against the live Figma file and the Code Connect dry runs, skip with a notice without it |
| `FIGMA_FILE_KEY`     | `figma-tokens.yml`                                       | The Figma file the token sync reads                                                                                                       |
| `NPM_TOKEN`          | `release.yml`, publish job only                          | An **environment** secret of `npm-release`, never a repository secret (§9)                                                                |
| `GITHUB_TOKEN`       | every workflow                                           | Given to every run; `figma-tokens.yml` opens its pull request with it                                                                     |

No workflow reads anything else: there are no Codecov, Slack, Maven or signing credentials.

### Setting Secrets

Secrets are Olcay's to set. An assistant never reads, prints, sets or deletes one. GitHub's API
returns secret names and dates, never values, and `pnpm release:credential:check` uses exactly that
to report where `NPM_TOKEN` is configured: it fails if `NPM_TOKEN` is a repository secret, if
`npm-release` does not hold it, or if that environment admits any branch but `main`.

### The `npm-release` Environment

Only the publish job in `release.yml` names an environment, `npm-release`:

- Olcay (account `vodoco`) is the required reviewer, and may approve a release they dispatched;
- administrator bypass is off;
- it deploys from `main` only;
- it holds `NPM_TOKEN`.

`scripts/release/policy.mjs` asserts the reviewer and the bypass setting, so a release refuses to
run if either is undone.

---

## 4. Build Workflows

No workflow only builds. `pnpm build` (Turborepo over every package) runs inside CI's web, browser
and core-pipeline jobs, and the iOS and Android jobs build the design tokens first
(`pnpm --filter @kozmos-ds/tokens build`) and check that the native token files came out.

### Token Synchronization (`figma-tokens.yml`)

"Figma Token Synchronization" runs on a manual dispatch or a `repository_dispatch` of type
`update-tokens`, and only when the repository variable `FIGMA_VARIABLES_API_ENABLED` is `true`. It
reads the Figma variables (`scripts/sync-figma.ts`, with `FIGMA_ACCESS_TOKEN` and
`FIGMA_FILE_KEY`), applies the iOS dark overrides, builds `@kozmos-ds/tokens`, copies the native
token files into the iOS and Android packages (`pnpm tokens:native:copy`, checked by
`pnpm tokens:copies:check`) and opens a pull request with the result.

### Storybook

Storybook lives in `apps/docs` (package `@kozmos-ds/docs`). `pages.yml` publishes it with the
website on GitHub Pages, at <https://vodoco.github.io/kozmos-design-system/storybook/>, as the
component reference (decision 44). CI, Visual Regression and Lighthouse CI build it too, to test it.

---

## 5. Test Workflows

The components' tests run in `ci.yml`; `site.yml` tests the website alone.

- **Unit tests:** `pnpm test` in `Web Build & Test` (Vitest; React's suite includes `vitest-axe`
  checks).
- **Storybook suites:** the twelve browser shards run `pnpm test:storybook-audit` (axe on every
  story, light and dark, at 320 and 1280 px), `pnpm test:storybook-interactions`,
  `pnpm test:storybook-docs`, `pnpm test:storybook-audit-fixes`, `pnpm test:poi-details`,
  `pnpm test:map-sheet`, `pnpm test:search-sheet` and `pnpm test:navigation` against the built
  Storybook.
- **Core pipeline:** React's Playwright tests, `scripts/skills/check-a11y.ts` and
  `pnpm test:storybook-regressions`, then `pnpm test:poi-gallery`.
- **iOS:** `swift test`, then the whole test target on the pinned simulator
  (`node scripts/check-ios-poi.mjs`), since `swift test` on macOS compiles the iOS-only tests out.
- **Android:** the Paparazzi snapshots (`./gradlew verifyPaparazziDebug`).

Nothing collects coverage: `@vitest/coverage-v8` is not installed, so `--coverage` fails.

---

## 6. Publishing Workflows

`release.yml` is the only workflow that publishes a package, and it publishes only to npm (§9).
`pages.yml` publishes the website and Storybook (§4).

- **npm:** `@kozmos-ds/react`, `@kozmos-ds/icons`, `@kozmos-ds/product-contracts` and
  `@kozmos-ds/tokens`.
- **iOS and Android:** not published. No workflow, script or tag releases the Swift package
  (`packages/ios`) or the Compose library (`packages/android`); they ship as source in this
  repository.
- **Figma Code Connect:** no workflow publishes it. CI parses it on all three platforms and, when
  `FIGMA_ACCESS_TOKEN` is set, runs each publish as a dry run (`pnpm figma:publish:linked:dry`,
  `pnpm figma:publish:ios:linked:dry`, `pnpm figma:publish:android:linked:dry`). A real publish
  writes to the live Figma file and is run by hand.

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

No workflow scans for security: there is no CodeQL analysis and no dependency-review workflow.
GitHub's Dependabot alerts are the dependency scanning, and `pnpm audit` can be run by hand.

---

## 9. Release Automation

Releases are deliberate, never automatic: nothing publishes on a merge, there is no Changesets
bot, and `pnpm release` deliberately exits with instructions. Nobody publishes from a laptop.
[docs/release-process.md](../docs/release-process.md) is the full procedure.

### `release.yml`

"Release Kozmos System" runs only on `workflow_dispatch`, from `main`, with three inputs: `sha` (the
full SHA of `main` HEAD), `ci_run_id` (the successful main-push CI run for that SHA) and
`confirmation` (`publish <sha>`). The repository variable `NPM_RELEASE_ENABLED` must be `true`;
setting it to `false` stops every release.

- **`guard`** fails unless the dispatch names `main` HEAD, so a release that published nothing
  cannot look like one that worked.
- **`prepare`** verifies the request, the CI run, `release/plan.json` and the environment's
  protection, runs `pnpm test:release`, builds the packages without npm credentials, and tests and
  keeps the exact tarballs it will ship.
- **`publish`** runs in `npm-release` and waits for Olcay's approval, verifies again, then publishes
  those tarballs, dependencies first. It is the only job that can read `NPM_TOKEN`. npm provenance
  is on from the next release (#132).

### The Operator's Steps

1. **A version PR:** `pnpm version-packages` consumes the changesets (private packages are not
   versioned), `release/plan.json` names the exact packages, versions and npm tag, and
   `pnpm skills:build` refreshes the AI-facing changelog and inventory and the Claude Design docs
   (which read the built React types, so build first). It is reviewed and merged like any pull
   request.
2. **Pre-flight:** once `main`'s CI on that merge is green, `pnpm release:preflight <sha> <ci-run-id>`
   makes the release job's own checks in advance, the credential check among them, and prints the
   dispatch command.
3. **Dispatch and approval:** Olcay dispatches Release Kozmos System and approves the `npm-release`
   deployment.
4. **Tags:** after the publish, `pnpm release:tag <sha>` creates the git tags and GitHub Releases,
   with each version's changelog as the notes.

Changesets only version here. A pull request that changes what a published package ships adds a
changeset with `pnpm changeset` (CI's `scripts/release/changeset-required.mjs` asks for one), and
`pnpm version-packages` runs `changeset version`.

---

## 10. Monitoring & Notifications

No workflow sends a notification: there is no Slack or other webhook. A run's result shows on the
pull request and in the repository's Actions tab.

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

There is no CODEOWNERS file, and nothing assigns reviewers automatically.

---

## Quick Reference

### Workflow Commands

```bash
# The checks on a pull request, and the runs on a branch
gh pr checks <pr-number>
gh run list --branch <branch>

# View a run, and re-run its failed jobs
gh run view <run-id>
gh run rerun <run-id> --failed

# Record Visual Review baselines on a branch, then push again (a workflow's commit starts no checks)
gh workflow run visual.yml --ref <branch> -f record=true
```

Only `visual.yml`, `figma-tokens.yml`, `pages.yml` and `release.yml` can be dispatched.
`release.yml` is Olcay's, with the command `pnpm release:preflight` prints (§9). The `github-pages`
environment deploys from `main` only, so a dispatch of `pages.yml` on another branch builds the site
but does not publish it.

### Secrets

Secrets are Olcay's to manage (§3); an assistant never reads, prints, sets or deletes one.

---

## Version History

| Version | Date       | Changes                                                                |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 1.0.0   | 2026-02-07 | Initial CI/CD configuration guide                                      |
| 2.0.0   | 2026-09-28 | Rewritten to the workflows, secrets and release that exist             |
| 2.1.0   | 2026-09-29 | Eight workflows with Site and Pages; local shards; Storybook is hosted |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-29
