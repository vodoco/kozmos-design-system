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

### Candidate validation checklist

- Run checks against the **formatted candidate**, then check generated assets again after
  committing. The brand generator formats its TS/JSON outputs with the repository's Prettier
  configuration; `pnpm test:ci` checks both canonical content and formatter stability, and the
  commit hook checks branding after `lint-staged`. Never manually repair generated output.
- `pnpm ci:local` defaults to the **web job in ci.yml**, not every release check. Inspect other
  jobs with `--list --job ios` or `--list --job browsers`. Separate workflows can be inspected
  and run using `--workflow`, for example:

  ```sh
  pnpm ci:local --workflow bundle-size.yml --job analyze-bundle
  ```

  The local runner prints a temporary log directory and retains each executed
  step's complete stdout/stderr there. It streams output to disk, so verbose
  checks such as Code Connect parsing cannot be terminated by an in-memory pipe
  limit. Failed steps print the last meaningful lines and their full-log path;
  inspect that file before deciding whether a retry or repair is warranted.
  `--verbose` streams directly to the terminal instead.

- Check the actual consuming story at 320 px and desktop widths in both themes, as well as its
  isolated component. `STORY_SCOPE=all STORY_FILTER='<affected-story-id-regex>' pnpm test:storybook-audit`
  audits a freshly built, served Storybook. The full story audit remains a required CI check.
- Audit open/focused tooltips and popups, not only their closed state. Portaled content must
  retain its owning accessible region; a scrolling list must not clip its tooltips. Verify the
  screen-reader description, visible hint, keyboard dismissal and returned focus together.
- Run **both** macOS `swift test` and the named iOS simulator target when changing SwiftUI
  layout or its tests. Window-dependent geometry/scrolling tests require a hosted view, not a
  detached renderer. Keep pixel scale explicit rather than dependent on the runner's display.
- Accessibility absence checks need a positive control: prove that the intended field or
  surface is actually observable before asserting that its actions are hidden. A custom
  UIKit tree walk can return no children for lazy or disabled SwiftUI content. Use the
  real interaction host when that happens; an empty traversal is not evidence of correct hiding.
- Measure the whole bundle as well as individual exports and CSS. Optimize first; a budget
  increase requires an explicit, measured decision. A new component passing its own budget
  does not imply the total library passes.
- Report the exact candidate SHA and distinguish local passes, pending CI, failures and skips.
  No earlier build or green visual comparison substitutes for the required checks on that SHA.

### Keep feedback fast without weakening gates

Use deterministic caching keyed by source, dependency lockfiles, toolchain and test configuration;
parallelize independent jobs; cancel superseded PR runs. Rebuild workspace `dist` before consumer
tests. Run affected tests locally, and keep release verification comprehensive.
Finish all builds before starting built-package browser checks. Do not run `pnpm typecheck`
alongside those checks either: Turborepo may rebuild dependencies and temporarily remove
their `dist` entries. Parallelize read-only suites only after their shared artifacts are stable.

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

The tarball recipe checks compile React examples; they do not compile the SwiftUI or
Compose strings in platform tabs. Type-check changed native snippets against the actual
native library/compiler, including imports, supplied data and callback arity. Until a
repository-wide native-snippet gate exists, report native documentation coverage separately.

Treat Figma, code and documentation as coordinated artifacts, with recorded mismatches and
ownership. Include built-package consumer tests: source tests miss broken exports, declaration
files, stylesheet delivery and framework-version compatibility.

Published versions are immutable under [Semantic Versioning](https://semver.org/). Kozmos is
currently pre-1.0: SemVer does not promise API stability for `0.x`, so explicitly document any
breaking change and the project's chosen compatibility expectations. Do not use the pre-1.0
exception as a reason to surprise consumers. Prefer deprecation and a migration path where practical.

## Post-publication documentation checklist

Treat delivery and documentation reconciliation as separate completion gates. A successful
release workflow cannot determine whether a hand-maintained plan still calls shipped work
"unreleased", and a generated-card freshness check cannot judge whether its prose is useful.

1. Record the exact source SHA, package versions/channel, main-push CI, publication run,
   registry integrity/readback and created tags/releases in the release process's history.
2. Update the baseline and implementation status in `docs/product-design-gap-register.md`
   and `docs/sdk-module-primitives.md`. Preserve historical IDs, original requirements and
   dated evidence. Do not turn library publication into host/Figma/device closure.
3. Reconcile architecture guides and changed component MDX, including defaults, removed
   limitations and migrations. Fix a placeholder summary in the source MDX/JSDoc; regenerate
   API cards instead of editing output. Scan at least the changed feature's docs:

   ```sh
   rg -n 'unreleased|not published|implemented locally|next implementation|pre-publication' docs packages/react/src/components --glob '*.md' --glob '*.mdx'
   ```

   Review matches individually. Historical release notes and genuine future work must not be
   globally replaced. Check counts/versions against their dated evidence instead of treating
   every old number as a current claim.

4. Build React and its dependencies, then regenerate and validate AI docs:

   ```sh
   pnpm --filter "@kozmos-ds/react..." build
   pnpm skills:build
   pnpm skills:check
   node --test apps/site/scripts/generate-reference.test.mjs apps/site/scripts/check-storybook-links.test.mjs
   git diff --check
   ```

   Inspect the generated diff, local links, the changed Storybook docs and the migration text.
   Source tests/freshness are not live-site verification. Check package scripts and prerequisites
   before running additional browser/native tests; use the exact candidate checks above.

5. Verify the Pages workflow's source SHA and deploy result, then the public website,
   Storybook index/iframe and affected docs/stories. A successful Site test is not a deployment.
   Pages only auto-builds for its configured paths: a docs-only Markdown PR may correctly not
   redeploy the site; component MDX does trigger it. Never call an unmerged local fix live.
6. External artifact upload, product-board adoption and native registry delivery each need
   independent evidence. Keep them pending until an owner verifies the actual destination.

Submit documentation corrections through a PR and retain the normal merge gates. No package
bump or npm republication is needed for documentation that does not change shipped output.
Do not rerun a publication or move existing tags to include post-release documentation edits.

## Evidence and remaining risk

Attach test commands, exact commit/artifact identifiers, counts, visual review and known gaps
to a PR. Keep transient local logs/handoffs in ignored `.notes/`, not the maintained docs.
Distinguish implemented, locally verified, CI verified, released and adopted in consumers.
One does not imply the next. Measure regressions, flaky tests, CI duration and consumer migration
pain so improvements address real problems rather than adding more gates without purpose.
