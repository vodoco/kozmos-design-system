# Kozmos Component Lifecycle

> **Purpose:** This document defines the complete lifecycle of a component from initial proposal to eventual removal. Use this as a reference when proposing new components, understanding component stability guarantees, or planning deprecations.

---

## Lifecycle State Machine

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                                                          │
                    ▼                                                          │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│ PROPOSAL │ → │  DRAFT   │ → │   BETA   │ → │  STABLE  │ → │DEPRECATED│  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
     │               │               │               │               │        │
     │               │               │               │               ▼        │
     │               │               │               │         ┌──────────┐   │
     │               │               │               │         │ REMOVED  │   │
     │               │               │               │         └──────────┘   │
     │               │               │               │                        │
     └───────────────┴───────────────┴───────────────┴────────────────────────┘
                              (Can be rejected/abandoned at any stage)
```

---

## Lifecycle Stages

### 1. PROPOSAL

**Duration:** 1-2 weeks
**Owner:** Proposer (any team member)
**npm Tag:** N/A (not published)

#### What Happens

- RFC issue created using template
- Design requirements gathered
- Use cases documented
- Platform scope defined

#### Entry Criteria

- Identified need from SDK team or consumer
- No existing component serves the purpose
- Clear use case documented

#### Exit Criteria (→ Draft)

- [ ] RFC approved by design system core team
- [ ] Design lead assigned
- [ ] Platform leads identified
- [ ] Priority assigned (P1/P2/P3)
- [ ] Added to roadmap

#### Rejection Criteria

- Duplicate of existing component
- Too narrow use case (< 2 consuming teams)
- Out of scope for design system

---

### 2. DRAFT

**Duration:** 2-4 weeks
**Owner:** Feature owner + Design lead
**npm Tag:** `@alpha` (e.g., `@kozmos-ds/react@1.0.0-alpha.1`)

#### What Happens

- Figma component designed
- Initial implementation on primary platform (React)
- API surface defined
- Basic tests written

#### Entry Criteria

- RFC approved
- Design resources allocated

#### Exit Criteria (→ Beta)

- [ ] Figma component complete with all variants
- [ ] React implementation complete
- [ ] TypeScript types finalized
- [ ] Storybook story created
- [ ] Basic unit tests passing
- [ ] Accessibility audit passed (axe-core)
- [ ] Code Connect file created
- [ ] API reviewed by core team

#### Artifacts Required

```
packages/react/src/components/ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
├── ComponentName.stories.tsx
├── ComponentName.figma.tsx
└── index.ts
```

#### Usage Restrictions

- Internal use only
- No stability guarantees
- API may change without notice
- Not recommended for production

---

### 3. BETA

**Duration:** 4-8 weeks
**Owner:** Platform leads
**npm Tag:** `@beta` (e.g., `@kozmos-ds/react@1.0.0-beta.1`)

#### What Happens

- Cross-platform implementation
- Real-world testing with early adopters
- API refinement based on feedback
- Documentation written

#### Entry Criteria

- Draft phase complete
- React implementation approved

#### Exit Criteria (→ Stable)

- [ ] All three platforms implemented (React, SwiftUI, Compose)
- [ ] Used in 2+ consuming projects (SDK modules or apps)
- [ ] No breaking API changes in 4+ weeks
- [ ] Full test coverage (unit + visual regression)
- [ ] Documentation complete
- [ ] All Code Connect files published
- [ ] Accessibility audit passed (all platforms)
- [ ] Performance budget met
- [ ] RTL layout verified
- [ ] Reduced motion compliance verified

#### Platform Implementation Checklist

| Platform | Implementation | Tests | Code Connect | Preview         |
| -------- | -------------- | ----- | ------------ | --------------- |
| React    | [ ]            | [ ]   | [ ]          | Storybook       |
| iOS      | [ ]            | [ ]   | [ ]          | Xcode Preview   |
| Android  | [ ]            | [ ]   | [ ]          | Compose Preview |

#### Usage Restrictions

- Can be used in production with caution
- API changes require migration path
- Breaking changes trigger minor version bump
- Feedback actively solicited

---

### 4. STABLE

**Duration:** Indefinite (until deprecated)
**Owner:** Core team
**npm Tag:** `@latest` (e.g., `@kozmos-ds/react@1.0.0`)

#### What Happens

- Full SemVer guarantees
- Production support
- Bug fixes prioritized
- On-call escalation available

#### Entry Criteria

- Beta phase complete
- Core team approval

#### Exit Criteria (→ Deprecated)

- Replacement component available
- Migration guide published
- Deprecation notice in changelog
- Minimum 1 minor version with deprecation warning

#### Stability Guarantees

| Change Type       | Allowed? | Version Bump |
| ----------------- | -------- | ------------ |
| Bug fix           | ✅ Yes   | Patch        |
| New optional prop | ✅ Yes   | Minor        |
| New variant       | ✅ Yes   | Minor        |
| Prop rename       | ❌ No\*  | Major        |
| Prop removal      | ❌ No\*  | Major        |
| Behavior change   | ❌ No\*  | Major        |

\*Requires deprecation cycle first

#### Support Level

- Bug reports: 48-hour initial response
- Critical bugs: Hotfix within 24 hours
- Feature requests: Evaluated in RFC process
- Breaking changes: Require major version + codemod

---

### 5. DEPRECATED

**Duration:** 2 minor versions (~3-4 months)
**Owner:** Core team
**npm Tag:** `@deprecated` (in package.json)

#### What Happens

- Console warnings in development
- Documentation shows deprecation banner
- Migration guide available
- Codemod provided (if applicable)

#### Entry Criteria

- Replacement available OR component no longer needed
- Migration path documented
- Core team approval

#### Exit Criteria (→ Removed)

- [ ] 2 minor versions elapsed since deprecation
- [ ] Usage analytics show < 10% of peak usage
- [ ] All known consumers migrated or notified
- [ ] Final warning email/announcement sent

#### Deprecation Signals

**Code (React):**

```tsx
// kozmos-skills: template — a sketch inside packages/react; OldButton and NewButton stand for any retired part and its replacement
/**
 * @deprecated Use `NewButton` instead. Will be removed in the next major version.
 * Migration: the release's entry in .ai-skills/api-changelog.md.
 */
export const OldButton = ({ ...props }) => {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[@kozmos-ds/react] OldButton is deprecated. Use NewButton instead.",
    );
  }
  return <NewButton {...props} />;
};
```

**Storybook:**

```tsx
// kozmos-skills: template — the meta of OldButton's story, beside the sketch above
export default {
  title: "Components/OldButton",
  component: OldButton,
  parameters: {
    status: { type: "deprecated" },
    docs: {
      description: {
        component: "⚠️ **DEPRECATED:** Use `NewButton` instead.",
      },
    },
  },
};
```

**Figma:**

- Component description: "⚠️ DEPRECATED - Use NewButton"
- Component moved to "Deprecated" section

---

### 6. REMOVED

**Duration:** Permanent
**Owner:** Archive
**npm Tag:** N/A (unpublished or major version bump)

#### What Happens

- Code removed from repository
- npm package major version released without component
- Documentation archived (not deleted)
- Figma component moved to archive file

#### Entry Criteria

- Deprecation period complete
- No blocking consumer dependencies

#### Post-Removal

- Archived documentation remains accessible at `/archive/component-name`
- Old npm versions remain available (never unpublish)
- Git history preserved

---

## Rollback Criteria

A component can move **backward** in the lifecycle:

### Stable → Beta

Triggers:

- Critical bug affecting > 20% of users
- Security vulnerability discovered
- Fundamental API flaw requiring breaking change

Process:

1. Publish patch marking component as `@beta`
2. Notify consumers immediately
3. Provide workaround or revert instructions
4. Fix and re-stabilize within 2 weeks

### Beta → Draft

Triggers:

- Fundamental design flaw discovered
- Cross-platform parity not achievable
- Use case invalidated

Process:

1. Announce in changelog
2. Remove from beta consumers if possible
3. Redesign and re-enter beta when ready

---

## Timeline Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPONENT LIFECYCLE TIMELINE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PROPOSAL    DRAFT       BETA         STABLE            DEPRECATED       │
│  ────────    ─────       ────         ──────            ──────────       │
│  1-2 wks     2-4 wks     4-8 wks      Indefinite        2 minor vers     │
│                                                                          │
│  ├──────────┼───────────┼────────────┼─────────────────┼───────────┤    │
│  0          2           6            14                 ∞           +4mo │
│             weeks       weeks        weeks                               │
│                                                                          │
│  Minimum time to Stable: ~14 weeks (3.5 months)                         │
│  Minimum deprecation period: ~3-4 months                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: What Can I Use?

| Stage      | Production Safe? | API Stable?     | Support Level    |
| ---------- | ---------------- | --------------- | ---------------- |
| Proposal   | ❌ No            | ❌ No           | None             |
| Draft      | ❌ No            | ❌ No           | Best effort      |
| Beta       | ⚠️ Caution       | ⚠️ Mostly       | Standard         |
| Stable     | ✅ Yes           | ✅ Yes          | Full             |
| Deprecated | ⚠️ Migrate       | ✅ Yes (frozen) | Maintenance only |
| Removed    | ❌ N/A           | ❌ N/A          | None             |

---

## Responsibilities by Role

| Role               | Proposal        | Draft            | Beta                  | Stable            | Deprecated                |
| ------------------ | --------------- | ---------------- | --------------------- | ----------------- | ------------------------- |
| **Proposer**       | Write RFC       | -                | -                     | -                 | -                         |
| **Design Lead**    | Review RFC      | Design component | Review cross-platform | Approve changes   | Approve deprecation       |
| **Feature Owner**  | -               | Implement React  | Coordinate platforms  | -                 | -                         |
| **Platform Leads** | -               | Review API       | Implement platform    | Fix bugs          | Provide migration support |
| **Core Team**      | Approve RFC     | Review API       | Approve for stable    | On-call, releases | Manage sunset             |
| **Consumers**      | Request via RFC | -                | Test & feedback       | Use in production | Migrate                   |

---

_Last updated: 2025-02-07_
_Maintainer: Kozmos Design System Team_
