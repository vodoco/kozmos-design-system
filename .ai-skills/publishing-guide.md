# Kozmos Design System - Publishing Guide

> **Purpose:** How Kozmos packages reach a registry. Only the four npm packages are published, only by the `release.yml` workflow, and only when Olcay dispatches and approves it. [docs/release-process.md](../docs/release-process.md) is the full procedure; this is what an assistant needs to know about it.

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

### What Is Published

| Package                                 | Registry | How                                      |
| --------------------------------------- | -------- | ---------------------------------------- |
| `@kozmos-ds/react`                      | npm      | `release.yml`                            |
| `@kozmos-ds/icons`                      | npm      | `release.yml`                            |
| `@kozmos-ds/product-contracts`          | npm      | `release.yml`                            |
| `@kozmos-ds/tokens`                     | npm      | `release.yml`                            |
| Swift package `Kozmos` (`packages/ios`) | none     | Not published; source in this repository |
| Compose library (`packages/android`)    | none     | Not published; source in this repository |

Every other workspace package is private and never published: `@kozmos-ds/vue`, `@kozmos-ds/docs`
and the apps.

### Publishing Flow

1. Pull requests merge to `main`, each with a changeset when it changes what a package ships.
2. A version PR consumes the changesets and names the release in `release/plan.json`.
3. `pnpm release:preflight <sha> <ci-run-id>` makes the release job's checks in advance.
4. Olcay dispatches Release Kozmos System and approves the `npm-release` deployment.
5. `pnpm release:tag <sha>` creates the git tags and GitHub Releases.

Nothing publishes on a merge, there is no Changesets bot, and nobody publishes from a laptop:
`pnpm release` deliberately exits with instructions.

---

## 2. npm Publishing

### Credentials

The npm credential, `NPM_TOKEN`, is an environment secret of `npm-release`, so only the publish job
in `release.yml` can read it. It is never a repository secret, never in a `.env` file and never in
an `.npmrc`. `pnpm release:credential:check` asks GitHub where it is configured, names and dates
only, and fails if it is anywhere else; the pre-flight runs it.

### Package Configuration

Each public package's own `package.json` is the source of truth for its name, version, entry points
and `files`; each has `publishConfig.access` set to `public`, and its `repository` names this
repository, which npm provenance checks.

### What the Workflow Does

`release.yml` runs `guard`, `prepare` and `publish`:

- `prepare` builds the packages without npm credentials, tests the tarballs it will ship and keeps
  exactly those bytes.
- `publish` waits for Olcay's approval on `npm-release`, verifies the request again, then runs
  `npm publish` on each kept tarball, dependencies first, with npm provenance (from the release
  after 0.5.0, #132), and reads each version back from the registry.

There are no manual publishing steps.

---

## 3. iOS (Swift Package Manager)

Not published. The Swift package `Kozmos` (`packages/ios/Package.swift`) ships as source in this
repository: no workflow, script or tag releases it, and nothing builds an XCFramework of it. CI
builds and tests it in `iOS Build`.

---

## 4. Android (Maven Central)

Not published. `packages/android/build.gradle.kts` applies no publishing or signing plugin, and no
Maven or signing credentials exist. The Compose library ships as source in this repository; CI
builds and tests it in `Android Build`.

---

## 5. Figma Code Connect

Code Connect reaches Figma by hand, never through a workflow: CI only parses it and, when
`FIGMA_ACCESS_TOKEN` is set, dry-runs the publish. The linked configurations name what is published:
`figma.linked.config.json` (React), `packages/ios/figma.linked.config.json` and
`packages/android/figma.linked.config.json`.

```bash
# Parse, as CI does
pnpm figma:parse:linked
pnpm figma:parse:native:linked

# Dry-run the publish (FIGMA_ACCESS_TOKEN from the environment or the root .env)
pnpm figma:publish:linked:dry
pnpm figma:publish:native:linked:dry

# Publish to the live Figma file, on Olcay's word
pnpm figma:publish:linked
pnpm figma:publish:native:linked
```

`pnpm figma:connect:readback` then reads what Dev Mode shows for every linked node, through Figma
desktop's Dev Mode MCP server.

---

## 6. Changesets Workflow

Changesets version the packages here; they never publish them.

### Creating Changesets

```bash
# Pick the packages, the bump and a summary
pnpm changeset
```

A pull request that changes what `@kozmos-ds/react`, `icons`, `product-contracts` or `tokens` ships
needs a changeset naming the package, and CI's `scripts/release/changeset-required.mjs` fails
without one. An empty changeset (`pnpm changeset --empty`) records that a change needs no release.

### Changeset File Format

```markdown
---
"@kozmos-ds/react": minor
---

What changed, in the words the changelog will carry
```

### Changeset Configuration

```json
// .changeset/config.json
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

Private packages are neither versioned nor tagged.

---

## 7. Version Management

Every package is on 0.x ([api-changelog.md](./api-changelog.md)). `pnpm version-packages` runs
`changeset version` in the version PR. Nothing syncs versions across platforms: only the npm
packages have versions. React pins its sibling packages exactly when it is published
(`workspace:*` becomes an exact version), so a React release that needs a new icon or contract
field releases those packages with it.

---

## 8. Rollback Procedures

A bad version is fixed forward: a fix merged to `main`, a version PR and a new release through
`release.yml`. npm publication is not transactional, and a release that failed part-way is
recovered by [docs/release-process.md](../docs/release-process.md), "Failure and recovery": never
unpublish, overwrite, retag or re-run blindly. Registry writes outside the workflow, such as
deprecating or re-tagging a version, are Olcay's decision, never an assistant's.

---

## 9. Pre-release Versions

`release/plan.json` carries the npm tag, `next` or `latest`. A prerelease version cannot use
`latest`, and a first release of something new begins on `next`. Changesets' pre mode has never
been used here (there has never been a `.changeset/pre.json`), and there are no canary releases:
nothing publishes from a branch or on a push.

---

## 10. Troubleshooting

A failed release is read, not re-run. [docs/release-process.md](../docs/release-process.md) has
"Failure and recovery", "Confirming a publish" and the four failures of the first release, each a
real defect: `pnpm/action-setup@v4` refusing to start while it and `package.json` both named a pnpm
version, a token without two-factor bypass answered with `EOTP`, a readback faster than the
registry, and `403 You cannot publish over the previously published versions`. To see what npm
holds:

```bash
npm view @kozmos-ds/react versions
npm view @kozmos-ds/react dist-tags
```

---

## Quick Reference

### Release Checklist

```
□ Every change to what a public package ships carries a changeset
□ Version PR: pnpm version-packages, release/plan.json, pnpm skills:build; merged, main CI green
□ pnpm release:preflight <sha> <ci-run-id>
□ Olcay dispatches Release Kozmos System and approves npm-release
□ npm view: versions and dist-tags; a clean install from the registry
□ pnpm release:tag <sha>
```

### Registry

| Registry | URL                        |
| -------- | -------------------------- |
| npm      | https://registry.npmjs.org |

---

## Version History

| Version | Date       | Changes                                                   |
| ------- | ---------- | --------------------------------------------------------- |
| 1.0.0   | 2026-02-07 | Initial publishing guide                                  |
| 2.0.0   | 2026-09-28 | Rewritten to the release that exists: npm, by release.yml |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-09-28
