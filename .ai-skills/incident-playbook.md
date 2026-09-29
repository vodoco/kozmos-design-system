# Kozmos Production Incident Playbook

> **Purpose:** This document defines how to respond when a released design system component breaks production. Use this as a reference during incidents, for hotfix processes, and for post-mortem reviews.

---

## Incident Severity Levels

| Level             | Definition                                          | Response SLA       | Resolution SLA | Examples                                                                     |
| ----------------- | --------------------------------------------------- | ------------------ | -------------- | ---------------------------------------------------------------------------- |
| **P0 - Critical** | Production down for major consumer, no workaround   | 15 min acknowledge | 2 hours        | Button component crashes on render; ThemeProvider breaks all styling         |
| **P1 - High**     | Significant functionality broken, workaround exists | 1 hour             | 24 hours       | Form submission fails in Safari; Dark mode colors inverted                   |
| **P2 - Medium**   | Feature broken in edge case, simple workaround      | 4 hours            | Next sprint    | Icon fails to load for specific POI type; RTL layout broken on one component |
| **P3 - Low**      | Cosmetic or minor issue                             | Next business day  | Backlog        | Hover state slightly off-color; Typo in aria-label                           |

---

## Incident Response Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INCIDENT RESPONSE FLOW                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DETECTION          TRIAGE           RESPONSE          RESOLUTION      │
│   ─────────          ──────           ────────          ──────────      │
│                                                                          │
│   Consumer           Core team        Fix or            Publish          │
│   reports     →      assesses   →     rollback    →     patch      →    │
│   issue              severity         decision          version          │
│                                                                          │
│       │                  │                │                 │            │
│       ▼                  ▼                ▼                 ▼            │
│   ┌────────┐        ┌────────┐       ┌────────┐        ┌────────┐       │
│   │ GitHub │        │ Slack  │       │ Hotfix │        │ npm    │       │
│   │ Issue  │        │ Alert  │       │ Branch │        │ publish│       │
│   └────────┘        └────────┘       └────────┘        └────────┘       │
│                                                                          │
│                          POST-INCIDENT                                   │
│                          ─────────────                                   │
│                                                                          │
│                     Post-mortem → Prevention → Documentation             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Response

### Phase 1: Detection & Acknowledgment (0-15 min)

#### 1.1 Issue Reported

Consumer reports via:

- GitHub Issue (preferred)
- Slack #kozmos-support channel
- Direct message to team member

#### 1.2 Acknowledge Receipt

```markdown
<!-- GitHub Issue Response Template -->

Thanks for reporting this issue. We're investigating now.

**Initial Assessment:**

- Severity: [P0/P1/P2/P3]
- Affected versions: @kozmos-ds/react@x.y.z
- Platforms impacted: [React/SwiftUI/Compose]

**Next Steps:**

- [ ] Reproducing locally
- [ ] Identifying root cause
- [ ] ETA for fix: [time estimate]

We'll update this issue as we progress.
```

#### 1.3 Alert Team (P0/P1 only)

```
# Slack message to #kozmos-incidents
🚨 **P0/P1 Incident Declared**

**Issue:** [Brief description]
**Affected:** @kozmos-ds/react@1.2.3
**Reporter:** [Consumer name]
**Responder:** @[your-name]
**GitHub:** [link to issue]

Investigating now. Updates every 30 min.
```

---

### Phase 2: Triage & Decision (15-60 min)

#### 2.1 Reproduce the Issue

```bash
# Clone consumer's reproduction if provided
git clone [repro-repo]
cd [repro-repo]
pnpm install
pnpm dev

# Or create minimal reproduction
mkdir kozmos-repro && cd kozmos-repro
pnpm init
pnpm add @kozmos-ds/react@[affected-version]
# ... create minimal test case
```

#### 2.2 Identify Root Cause

- Check recent commits to affected package
- Review changelog for related changes
- Check if issue exists in previous versions

#### 2.3 Decision: Fix Forward vs. Rollback

```
┌─────────────────────────────────────────────────────────┐
│              FIX FORWARD vs. ROLLBACK DECISION          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Can fix in < 2 hours?                                 │
│         │                                               │
│    Yes ─┴─ No                                           │
│     │      │                                            │
│     ▼      ▼                                            │
│   ┌────┐  Is previous version safe to use?              │
│   │FIX │        │                                       │
│   │FWD │   Yes ─┴─ No                                   │
│   └────┘    │      │                                    │
│             ▼      ▼                                    │
│          ┌──────┐ ┌────────────────────┐                │
│          │ROLL- │ │ FIX FORWARD        │                │
│          │BACK  │ │ (no safe fallback) │                │
│          └──────┘ └────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 3: Hotfix Process

#### 3.1 Create Hotfix Branch

```bash
# From main: a release publishes only main's HEAD, so every fix goes through main
git checkout main && git pull --ff-only
git checkout -b fix/button-crash

# Make the fix
# ... edit files ...

# Run tests (React's unit tests carry its vitest-axe accessibility checks)
pnpm test
pnpm typecheck
```

#### 3.2 Review (P0/P1)

A hotfix is an ordinary pull request to `main`; nothing is abbreviated for P0/P1:

- Every required check must pass, on a branch up to date with `main`
  ([ci-cd-configuration.md](./ci-cd-configuration.md)).
- Visual Review stays required: a hotfix that changes how a story looks records its baselines
  (docs/visual-review.md) rather than skipping the check

```bash
# Create the pull request (the repository has no hotfix or priority labels)
gh pr create --title "fix(react): prevent Button crash on undefined children" \
  --body "## Root Cause
Button component did not handle undefined children prop.

## Fix
Added null check before rendering children.

## Testing
- [x] Reproduction case now works
- [x] Unit tests added
- [x] Existing tests pass

## Rollback
If this fix causes issues, revert to v1.2.2

Fixes #123"
```

#### 3.3 Publish Hotfix Release

A hotfix is released like any version; nothing is published from a laptop
([publishing-guide.md](./publishing-guide.md), [docs/release-process.md](../docs/release-process.md)):

```bash
# 1. In the fix's pull request: a patch changeset
pnpm changeset
# Select affected packages, choose "patch"
# Write: "fix(react): prevent Button crash on undefined children"

# 2. After it merges: a version PR (with release/plan.json and pnpm skills:build)
pnpm version-packages

# 3. After the version PR merges and main's CI is green
pnpm release:preflight <sha> <ci-run-id>

# 4. Olcay dispatches Release Kozmos System and approves npm-release; then the tags
pnpm release:tag <sha>
```

#### 3.4 Notify Consumers

````markdown
<!-- GitHub Issue Update -->

## ✅ Fix Released

**Version:** @kozmos-ds/react@1.2.4
**Changelog:** [link]

**To update:**

```bash
pnpm update @kozmos-ds/react@1.2.4
```
````

Please confirm the fix resolves your issue. We'll close this in 48 hours if no response.

---

**Post-mortem scheduled for [date]. Summary will be posted here.**

````

---

### Phase 4: Rollback Process (If Needed)

#### 4.1 Determine Safe Version
```bash
# Check what version was before the breaking change
npm view @kozmos-ds/react versions --json | tail -10

# Verify the safe version
npm info @kozmos-ds/react@1.2.2
````

#### 4.2 Deprecate Broken Version

Deprecating or re-tagging a published version is a registry write outside `release.yml`: Olcay's
decision, never an assistant's. A release that failed part-way is recovered by
[docs/release-process.md](../docs/release-process.md), "Failure and recovery", which never
unpublishes, overwrites or retags.

#### 4.3 Communicate Rollback

````markdown
<!-- Slack #kozmos-announcements -->

⚠️ **Version Rollback Notice**

**Package:** @kozmos-ds/react
**Broken version:** 1.2.3 (deprecated)
**Safe versions:** 1.2.2 (previous) or 1.2.4 (fix)

**Action required:**
If you're on 1.2.3, update immediately:

```bash
pnpm update @kozmos-ds/react@1.2.4
```
````

**Root cause:** [brief description]
**Status:** Fix released in 1.2.4

Questions? Thread below or #kozmos-support

````

---

### Phase 5: Post-Incident

#### 5.1 Post-Mortem (Required for P0/P1)

Schedule within 48 hours of resolution. Use this template:

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** [time from detection to resolution]
**Severity:** P0/P1
**Responders:** @name1, @name2

## Summary
[2-3 sentence summary of what happened]

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:00 | Issue reported via GitHub |
| 14:05 | Acknowledged, began investigation |
| 14:30 | Root cause identified |
| 15:00 | Fix merged |
| 15:15 | Patch version published |
| 15:30 | Consumer confirmed fix |

## Root Cause
[Technical explanation of what broke and why]

## Impact
- **Users affected:** [number/percentage]
- **Duration:** [how long were users impacted]
- **Business impact:** [if any]

## What Went Well
- [Thing that helped]
- [Thing that helped]

## What Could Be Improved
- [Gap identified]
- [Gap identified]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add regression test | @name | YYYY-MM-DD | [ ] |
| Update ESLint rule | @name | YYYY-MM-DD | [ ] |
| Document edge case | @name | YYYY-MM-DD | [ ] |

## Prevention
[How we'll prevent this class of issue in the future]
````

#### 5.2 Create Prevention Items

Convert action items to GitHub issues:

```bash
gh issue create --title "Add regression test for Button undefined children" \
  --label "testing,post-mortem" \
  --body "From post-mortem: [link]

Add test case to prevent regression of the Button crash when children is undefined.

Acceptance criteria:
- [ ] Test case added to Button.test.tsx
- [ ] Test fails on v1.2.3 code
- [ ] Test passes on v1.2.4 code"
```

---

## Communication Templates

### Consumer Notification (P0/P1)

````markdown
Subject: [ACTION REQUIRED] Critical issue in @kozmos-ds/react@1.2.3

Hi [Team],

We've identified a critical issue in @kozmos-ds/react@1.2.3 that causes [brief description].

**Immediate action:**

- If you're on version 1.2.3, update to 1.2.4 immediately
- If you haven't updated past 1.2.2, you're not affected

**Update command:**

```bash
pnpm update @kozmos-ds/react@1.2.4
```
````

**Details:**

- Issue: [link to GitHub issue]
- Root cause: [brief]
- Fix: [brief]

We apologize for any disruption. A post-mortem will be shared within 48 hours.

Questions? Reply to this email or reach us at #kozmos-support.

— Kozmos Design System Team

````

### All-Clear Notification
```markdown
Subject: [RESOLVED] @kozmos-ds/react@1.2.3 issue fixed in 1.2.4

Hi [Team],

The critical issue in @kozmos-ds/react@1.2.3 has been resolved.

**Fix version:** 1.2.4
**Changelog:** [link]

**If you already updated:** No further action needed.
**If you're still on 1.2.3:** Please update when convenient.

Post-mortem summary: [link]

Thank you for your patience.

— Kozmos Design System Team
````

---

## On-Call Rotation

### Primary Responders

| Week | Primary          | Backup           |
| ---- | ---------------- | ---------------- |
| 1    | React Lead       | Core Team Member |
| 2    | iOS Lead         | React Lead       |
| 3    | Android Lead     | iOS Lead         |
| 4    | Core Team Member | Android Lead     |

### Escalation Path

```
Level 1: Primary on-call (15 min response)
    ↓ (no response in 15 min)
Level 2: Backup on-call (15 min response)
    ↓ (no response in 15 min)
Level 3: Core team lead (immediate)
    ↓ (P0 lasting > 2 hours)
Level 4: Engineering manager
```

### Contact Methods

- **Slack:** #kozmos-incidents (monitored during business hours)
- **PagerDuty:** [For P0 after-hours, if configured]
- **Email:** the Kozmos on-call address (ask an owner; deliberately not written here)

---

## Runbook Quick Reference

### I just got paged for a P0

1. Acknowledge in Slack within 15 min
2. Open the GitHub issue
3. Start reproducing locally
4. Post status update every 30 min
5. If can't fix in 2 hours → rollback

### I need to publish a hotfix NOW

Nothing publishes from a laptop, however urgent: the fix merges to `main` with a patch changeset,
then a version PR, `pnpm release:preflight <sha> <ci-run-id>`, Olcay's dispatch and approval of
`release.yml`, and `pnpm release:tag <sha>` (§3.3).

### I need to rollback a release

There is no rollback by publishing: the fix goes forward as a new version through `release.yml`
(never re-using a published version), and deprecating the broken one is Olcay's call (§4.2).

### I need to find who's using a broken version

```bash
# Check npm download stats (approximate)
npm info @kozmos-ds/react

# For internal consumers, check lockfiles in SDK repos
grep "@kozmos-ds/react" /path/to/sdk/pnpm-lock.yaml
```

---

## Metrics to Track

| Metric                 | Target         | Measurement                            |
| ---------------------- | -------------- | -------------------------------------- |
| P0 acknowledgment time | < 15 min       | Time from report to first response     |
| P0 resolution time     | < 2 hours      | Time from report to fix published      |
| P1 resolution time     | < 24 hours     | Time from report to fix published      |
| Incidents per quarter  | < 2 P0/P1      | Count of P0+P1 incidents               |
| Post-mortem completion | 100% for P0/P1 | Post-mortem published within 48h       |
| Action item completion | > 90%          | Prevention items closed within 2 weeks |

---

_Last updated: 2025-02-07_
_Maintainer: Kozmos Design System Team_
