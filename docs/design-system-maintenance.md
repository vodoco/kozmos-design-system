# Maintaining Kozmos

This is a working policy for changes to the design system, not permission to bypass CI.
[`AGENTS.md`](../AGENTS.md) and [the release process](release-process.md) govern merges and publication.

## How much testing is enough?

Do not rerun every test merely because someone reviews the same released version again.
Reuse evidence only when its commit, build inputs, toolchain and artifacts are still relevant.
A component edit creates a **new candidate**: an unchanged sibling does not prove that its
imports, styles, tokens, layout, accessibility or consumer integration still work.

| Stage                    | Checks                                                                                                   | Reason                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Each edit                | Regression test for the changed behavior, affected component tests and types                             | Fast feedback; demonstrate the bug before the fix.                                                |
| Shared dependency change | Tests of affected dependents, themes, layouts and native equivalents                                     | Tokens, shared CSS, contracts and utilities can change many components indirectly.                |
| PR ready to merge        | All required repository checks on an up-to-date branch; review the diff and visual changes               | Local focused tests do not replace the merge gate. Kozmos currently requires 19 checks.           |
| Release candidate        | Successful full main-push CI for the exact release SHA, followed by the existing package/artifact checks | A green PR is not proof of the merged release tree. Skipped native jobs are not release evidence. |
| After publication        | Install and smoke-test the actual published version, exports/styles and representative consumers         | Verify delivery, not another rebuild of different bytes.                                          |
| Periodically             | Dependency/security review, supported browser/OS checks and real consumer/accessibility checks           | External environments change even when the source does not. Schedule intentionally.               |

The release workflow prepares and checks tarballs before protected approval, then publishes
those same bytes. Do not rebuild after approval or replace an existing published version.
Documentation-only reviews and unchanged released artifacts do not require speculative full-suite reruns.
Changes to build tooling, dependencies, lockfiles, tests or CI invalidate relevant evidence even
if component source is unchanged.

### Optimize duration, not the meaning of green

Use deterministic caching keyed by source, dependency lockfiles, toolchain and test configuration;
parallelize independent jobs; cancel superseded PR runs. Rebuild workspace `dist` before consumer
tests. Run affected tests locally, and keep release verification comprehensive.

Any future affected-only CI needs a verified dependency graph including tokens, global CSS,
code generation, shared native helpers, public exports and contracts. Unknown impact must
fall back to the broader suite. Do not remove required checks, add arbitrary path skips, weaken
assertions or re-record screenshots just to obtain green. Changes to gates require their own
review, including tests that the selector schedules every affected job.

These layered feedback loops follow the distinction between a fast commit build and broader
pipeline checks in [Martin Fowler's continuous integration guidance](https://martinfowler.com/articles/continuousIntegration.html).

## Definition of done for a component

- One documented public contract: ownership of state, defaults, callbacks, units, identifiers,
  empty/unknown values and compatibility behavior. Avoid interpreting absence as a fabricated value.
- React, SwiftUI and Compose ship equivalent intended behavior together. Keep an explicit
  platform exception when an API genuinely cannot be equivalent; compilation alone is not parity.
- Check idle, selected, disabled, loading, error and empty states where applicable, plus long
  labels/lists, narrow containers, RTL, large text, dark theme and reduced motion.
- Verify keyboard navigation, dismissal, focus return, accessible names/states and actual
  VoiceOver/TalkBack behavior for changed interactions. Automated accessibility checks are necessary
  but not a substitute for these manual checks.
- Test a realistic composition as well as the isolated part: embedded maps, panels, portals,
  safe areas and keyboards can behave differently from a full-screen story.
- Add a regression that fails on the unfixed behavior. Read back native test names/counts;
  a green command that ran zero relevant tests is not evidence.
- Review visual diffs. Record web baselines only with the repository's pinned Docker renderer.
- Keep tokens, stories, consumer documentation, generated API cards and the gap register honest.
  Use the generator for generated artifacts, never manual edits.
- Add a changeset for published output; explain changes to defaults, semantics and migrations,
  not just new props. Test old positional/native calls where overload compatibility matters.

## Keep the system usable for developers and AI agents

Prefer small cohesive changes and short-lived branches. Each component needs a clear owner,
status (experimental, supported, deprecated), platform coverage and known limitations. A maturity
label is useful only when its support/compatibility promises are stated; do not mark unfinished
components complete merely because a story exists.

Maintain compilable import examples, stable exports, discoverable tokens, typed data contracts,
composition recipes and migration guidance. AI-facing documentation should be generated from the
same built types and tested examples as developer documentation. Keep private credentials, tenant
configuration and live SDK state outside the reusable component API and committed examples.

Treat Figma, code and documentation as coordinated artifacts, with recorded mismatches and
ownership. Include built-package consumer tests: source tests miss broken exports, declaration
files, stylesheet delivery and framework-version compatibility.

Published versions are immutable under [Semantic Versioning](https://semver.org/). Kozmos is
currently pre-1.0: SemVer does not promise API stability for `0.x`, so explicitly document any
breaking change and the project's chosen compatibility expectations. Do not use the pre-1.0
exception as a reason to surprise consumers. Prefer deprecation and a migration path where practical.

## Evidence and remaining risk

Attach test commands, exact commit/artifact identifiers, counts, visual review and known gaps
to a PR. Keep transient local logs/handoffs in ignored `.notes/`, not the maintained docs.
Distinguish implemented, locally verified, CI verified, released and adopted in consumers.
One does not imply the next. Measure regressions, flaky tests, CI duration and consumer migration
pain so improvements address real problems rather than adding more gates without purpose.
