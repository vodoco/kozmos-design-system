# Controlled npm releases

Status (2026-11-06): in use; React 0.15.1 is published, with `@kozmos-ds/styles` 0.15.1 and icons 0.9.0 (evidence
below).
It has published every release since 0.1.0 (2026-09-23);
0.5.0, on 2026-09-28, was the first through the approval gate below. It replaced the old
`workflow_run` publisher, and adding `NPM_TOKEN` must never be enough to publish.

**Before every dispatch, `pnpm release:preflight <sha> <ci-run-id>`**: it makes the release
job's own checks against the live CI run and settings (the credential check included),
refuses a plan npm already has, and prints the dispatch command. **After a publish, `pnpm release:tag <sha>`**: the git tags and
GitHub Releases.

## What the workflow requires

1. A reviewed, committed `release/plan.json` listing exact public package names,
   versions and the explicit `next` or `latest` npm tag. Only listed packages ship.
   Versions must match workspace manifests; private/unknown/duplicate packages and
   unversioned changesets are rejected. Prerelease versions cannot use `latest`.
2. A successful **main-push** run of `.github/workflows/ci.yml` for that exact SHA
   in this repository. Every job must have succeeded, including web and both native
   jobs. PR runs, skipped jobs, forks and unrelated workflows are not evidence.
3. A manual dispatch **from main**, with the full lowercase 40-character SHA,
   the CI run ID and the exact confirmation `publish <SHA>`. The dispatch commit,
   checkout and candidate SHA must agree. The candidate must still be main HEAD
   at each verification, including at the start of the publish job.
4. Repository variable `NPM_RELEASE_ENABLED=true` and an `npm-release`
   environment carrying an exact `main` branch policy, holding `NPM_TOKEN` as an
   environment secret, and requiring Olcay's approval (its one required reviewer is
   his account, `vodoco`, User id 10688082) with administrator bypass off; the
   policy refuses a release if either is undone. See "The approval gate".

Global concurrency serializes releases without cancelling a running publish.
There is no automatic version PR, publication, git tag or GitHub release; tags and
releases come from `pnpm release:tag <sha>` after a publish (Olcay's decision 33). Changesets
still manage versions/changelogs through `pnpm changeset` and
`pnpm version-packages` on a reviewed branch. `pnpm release` deliberately exits
with instructions; do not replace it with direct `changeset publish`.

## Exact tested artifacts

The prepare job checks out the requested SHA, builds without npm credentials and
runs the existing package-install test. Only when the type, export, server-render
and React 18/19 README checks pass does it retain the **same tarballs** in an artifact.
The candidate manifest binds package identities, SHA-512 integrity and a digest of
the release plan to the source SHA. CI also exercises this export/readback path in
an isolated fixture; that fixture never edits the real release plan.

The publish job runs in the `npm-release` environment, which is the only place
the npm credential exists; it checks out the same SHA and revalidates live
CI/environment/main evidence. It downloads the exact artifact ID
from its own prepare job, checks hashes and packed manifests, and does not rebuild
or repack. Install scripts are disabled in both jobs' dependency installation;
the npm token is supplied only to the final publishing step. Every action in every
workflow, the release workflow's among them, is pinned to a release's commit SHA with a
`# vX.Y.Z` comment naming that release, and CI's `pnpm release:pins:check` asks GitHub
that each SHA is a commit and the one that release's tag points at: until 17 Oct 2026
`pnpm/action-setup`'s pin was the `v4` tag's own object, which resolved only while the tag
stayed put. The release workflow's actions are their Node 24 builds, and its setup-node
restores no cache (`package-manager-cache: false`). The GitHub token has read-only
contents/actions permissions and checkout does not persist it.

Before the first write, the publisher checks registry availability, version
collisions and internal dependency availability. Selected dependencies publish
before dependants; omitted internal dependencies must have a published version
satisfying the packed range. Cycles fail for explicit investigation. Publishing
uses the public npm registry, public access, the approved tag, disabled lifecycle
scripts and npm provenance: the publish job alone may mint an OIDC token, and each
package's `repository` must name this repository (a workflow test pins both). Provenance
was off while the repository was private, since npm attests public repositories only; it is
public now (decision 32), and the first release with provenance is the one after 0.5.0.

This proves source identity, tested package bytes and, with provenance, where npm's copy
was built — **not** reproducible builds, visual approval or product/device readiness. CI
does not build the exact artifact later produced by prepare; prepare independently tests
what it will ship.

## Owner setup — deliberately not performed by the agent

- `NPM_RELEASE_ENABLED` is `true`. Setting it to `false` stops every release at once.
- `npm-release` has a selected branch rule for `main` (not a wildcard or tag), Olcay
  as its only required reviewer (self-approval allowed) and administrator bypass off.
  The REST environment response exposes the reviewers and the bypass setting, and the
  policy asserts both, exactly as "The approval gate" says. Administrators and
  trusted workflow authors remain a trust boundary: automation that runs as Olcay's
  account could approve a publish, so it never does. That is a rule; a separate
  automation account without the right would make it a fence.
- Provision a suitably restricted npm token as the **environment** secret
  `NPM_TOKEN`, never a repository-wide secret, and confirm ownership and publish
  access for the `@kozmos-ds` scope. The token must be granted on the _scope_,
  not on selected packages: before the first release no package exists to
  select. `pnpm release:preflight` runs `pnpm release:credential:check` before every
  dispatch: it asks
  GitHub where `NPM_TOKEN` is configured — names and dates only, never a value —
  and fails if it is a repository secret, if the environment does not hold it,
  or if the environment admits any branch but `main`. The workflow cannot check
  this itself, because a job's `GITHUB_TOKEN` has no grantable `secrets`
  permission and a step reading `secrets.NPM_TOKEN` to test it would break the
  rule that exactly one step in the workflow may reference that secret.

### The approval gate

Until 2026-09-28 this section explained why there was none. GitHub offers required
reviewers on Free, Pro and Team only for public repositories, and the repository was
private, so Olcay chose a fence around the credential instead (git keeps that text). The
repository is public now, and on 2026-09-28 Olcay chose the approval (decision 27):
`npm-release` requires Olcay's review, with self-approval allowed, since Olcay both
dispatches and approves, and administrator bypass off. The dispatch is no longer the only
human act: the publish job waits under "Review deployments" until Olcay approves. The
credential fence stays too: `NPM_TOKEN` is an environment secret that only the publish job,
on `main`, can read.

What `scripts/release/policy.mjs` checks, in the pre-flight and again in both release jobs,
against GitHub's live `environments/npm-release` response:

- **Exactly one required reviewer, Olcay's account:** one entry across the environment's
  required-reviewer rules, of type `User`, whose account id is `10688082` (`vodoco`). Only
  his account may approve (Olcay's decision, 2026-09-28). The id is compared, not the login:
  a login can be renamed and later registered by someone else, and an account id cannot.
  Another account, a team, a second reviewer beside him, or an entry without that id is
  refused. So is a rule with no reviewers, or no rule at all.
- **Administrator bypass off:** `can_admins_bypass` must be `false`. A response without the
  field is refused, not read as off.
- **A branch rule restricted to `main`:** a `branch_policy` rule, custom branch policies, and
  exactly one policy, the branch `main`.

What no check here can do:

- Protect main and the release workflow/plan from unreviewed edits as part of
  repository governance. Local scripts cannot prevent an administrator or someone
  already holding an npm token from bypassing the workflow outside GitHub.

GitHub references: [environment protection and plan restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments),
[environment REST permissions](https://docs.github.com/en/rest/deployments/environments),
[deployment branch policies](https://docs.github.com/en/rest/deployments/branch-policies).

## Operating a future approved release

1. Close the browser/WebView policy, device/native/product integration,
   accessibility/motion, visual and package-type release blockers. Green CI alone
   does not approve them; Visual Review is a required check on every pull request,
   not an approval of the release as a whole.
2. Version through Changesets on a reviewed branch, the **version PR**: `pnpm version-packages`
   (private packages are not versioned), an exact `release/plan.json`, and
   `pnpm skills:build` (the AI-facing changelog and inventory carry the versions, and the
   Claude Design page names React's; it reads the built types, so build React first).
   Review the manifests, changelogs and plan together. A first release of something new
   begins on `next`; the checked-in plan is never an implied choice of versions.
   - **React and styles are planned and released together.** `.changeset/config.json` puts
     `@kozmos-ds/react` and `@kozmos-ds/styles` in one changesets `fixed` group, so they
     version together, and react pins styles exactly. The plan lists both at one version or
     neither; preflight and the release's guard refuse a plan that splits a fixed group, so
     it never reaches the approval.
   - **A package in React's fixed group takes React's tag,** first release or not: the "begins
     on `next`" rule does not apply to it. `@kozmos-ds/styles` was first published as 0.15.1, with
     React 0.15.1, on 6 Nov 2026 (decision 161: 0.16.0 stays the release the register promises
     Phase 1's parts to). Its first publish under a new name needed the npm token granted on the
     whole `@kozmos-ds` scope, as the setup above requires.
3. Merge it once its checks pass on a branch up to date with `main`, and wait for the
   successful main-push CI run of that merge. A documentation-only main commit has no push
   CI because of path exclusions: do not substitute an older SHA or a PR run, and merge
   nothing between the version PR and the dispatch.
4. `pnpm release:preflight <sha> <ci-run-id>` runs the credential check and the release
   job's own request, evidence and plan checks, refuses if npm already has any planned version
   (a partly published release is recovered as below, never re-dispatched), then prints the
   dispatch command. Dispatch
   `Release Kozmos System` with it, and approve the `npm-release` deployment when the
   publish job asks. If main advances mid-run, validation fails: repeat against the newly
   tested main, not a moving checkout.
5. Check each package version, integrity and dist-tag (the script verifies these after
   each publish), then from the registry: `npm view`, and a clean install into an empty
   project. Then `pnpm release:tag <sha>` for the tags and GitHub Releases (`--dry-run`
   first); it refuses a commit that no successful Release run published, or whose versions
   npm lacks, and it checks every tag and release already there before it makes any (below).
6. Complete the [post-publication documentation checklist](design-system-maintenance.md#post-publication-documentation-checklist).
   Publication does not rewrite maintained plans from "unreleased" to "released". Reconcile
   those claims with evidence, preserve open host/device/design acceptance, and verify the
   deployed site and Storybook separately. Use a documentation PR; do not bump packages again
   for status prose or edit generated API cards by hand.

## Tags and GitHub Releases

`pnpm release:tag <sha>` makes one git tag and one GitHub Release per package the plan at
`<sha>` shipped: `<package>@<version>`, with that version's changelog section as the notes,
dependencies first and React last.

- **The channel carries over.** A semver prerelease (`0.6.0-beta.1`) is made a GitHub
  prerelease (`--prerelease`). Only a stable React release on `latest` is marked Latest;
  every other release gets `--latest=false`, so a prerelease, or anything on `next`, is
  never Latest. A plan that names neither `next` nor `latest` is refused.
- **Existing tags and releases are checked first, all of them.** Before the first release
  is made, each planned tag is looked up and resolved to its commit, through any annotated
  tags, and must be `<sha>`. A release that already exists must be on such a tag. A tag or a
  release at another commit, a draft release, or a release without its tag refuses the whole
  run, naming each conflict, and nothing is created. It never moves or deletes a tag or a
  release: a conflict is settled by hand.
- **A failed lookup is not an absence.** Only GitHub's 404 means "there is none". Any other
  answer (401, 403, 5xx) or no answer at all (the network) refuses the run.
- **Running it again is safe.** A tag and release that already exist at `<sha>` are left as
  they are, and only the missing ones are made. `--dry-run` makes every check and creates
  nothing.

## Failure and recovery

npm publication is not transactional. A later package can fail after an earlier one
has published. Do not unpublish, overwrite, retag, bump versions or rerun blindly.
Inspect the workflow artifact and registry first. A retry skips an existing version
only if its integrity and requested dist-tag exactly match. Different bytes or a
changed tag fail before any write. A rebuilt artifact may differ; preserve the original
artifact for recovery (retention is seven days). Rerunning a failed publish job can
reuse its prepare artifact, subject to approval and current-main checks. If the artifact
expired, main moved or registry state differs, stop for a separately reviewed recovery
plan. Never delete a released version to make the tests pass.

## Validation evidence

Four workflow regression tests failed against the original configuration before
the replacement. A later retry-tag regression failed before its preflight correction.
The other safety tests are additional coverage, not claimed as old reproduced bugs.

Historical initial workflow validation (not current test totals): **35 release tests passed**, all package builds passed, ordinary
React 18/19 tarball checks passed (14 exports, three CommonJS entries and 11 README
samples), and the isolated export smoke test verified all four retained real-package
tarballs. The three declaration issues were unchanged in that initial batch, not a statement
that they remain in today's release. ESLint, frozen-lockfile
installation, diff checks and Actionlint 1.7.12 passed. Actionlint checked workflow
syntax/expressions with its optional shellcheck/pyflakes integrations disabled; those
external tools were not installed. The official Actionlint archive digest was verified
against its GitHub release metadata before running it from a temporary directory.

```sh
pnpm test:release
pnpm --filter './packages/*' build
pnpm packages:install:check
pnpm test:release:packages
pnpm exec eslint scripts/release scripts/check-package-install.mjs
pnpm install --frozen-lockfile --ignore-scripts
git diff --check
```

`@kozmos-ds/react`, `tokens`, `icons` and `product-contracts` 0.1.0 were
published on 2026-09-23 from `5ec87ec`, and a clean `npm install` of
`@kozmos-ds/react` into an empty directory resolves all four, loads the
CommonJS entry and server-renders a Button. It took four dispatches, and each
failure was a real defect rather than bad luck:

1. `pnpm/action-setup@v4` refuses to start when the action input and
   `package.json`'s `packageManager` both name a version. CI pinned v3 then,
   which has no such check, so the release workflow's `uses:` steps had never
   executed anywhere. The input is gone and a control holds the manifest as the
   only declaration.
2. The npm token was a granular token without **Bypass two-factor
   authentication**, so the registry answered `EOTP` and asked for a code no
   runner can supply. Nothing published.
3. npm's read path is eventually consistent. The readback ran 0.04s after npm
   printed `+ @kozmos-ds/react@0.1.0`, found nothing, and failed a release that
   had succeeded — once per package. See "Confirming a publish" below.
4. Re-running before the registry caught up made the preflight believe a
   published version was missing, so it published again and npm answered
   `403 You cannot publish over the previously published versions`.

Because the first publish of a package always sets `latest`, all four carry
both `next` and `latest`; no promotion step was needed.

### Confirming a publish

`publishPrepared` now retries the readback while the version is **absent**, and
never while the registry **disagrees**. A missing version may be in flight; a
version that is present with different bytes, under a tag pointing elsewhere,
is a fact no waiting will change. The budget is ten minutes per package,
measured from the 2026-09-23 release: about 3.5-3.7 minutes for each name, and
about nine for the first name published into the brand-new scope. The publish
job's `timeout-minutes` is set to cover that budget for every package at once,
so the assertion reports which package the registry never showed rather than
the runner killing the job first. Change one and change the other. Native/Figma/component behavior is unchanged by this batch.

A first publish under a new name can leave a placeholder version beside the planned one. `@kozmos-ds/styles`'s
(0.15.1, 6 Nov 2026) left `0.0.0-stage`, npm's placeholder for staged publishing, as the job began publishing it,
though the job ran a plain `npm publish` (the 0.15.1 record below). It is a prerelease, off `latest`, which no range
matches. Expect one for the next new name, `@kozmos-ds/vue`; deprecating or unpublishing it, within npm's 72 hours,
is Olcay's call.

### 0.5.0

On 2026-09-28, 0.5.0 was the first release through the approval gate:

- **Pre-flight:** it was pre-flighted against its main-push CI run (`36397074950`, 17 of 17 jobs).
- **Publish:** Olcay approved it, and it published icons 0.4.0, product-contracts 0.4.0 and
  react 0.5.0 in dependency order.
- **Registry check:** react pins its siblings exactly, and a clean install from the registry
  resolves all four packages and server-renders a Button.
- **Tags:** `pnpm release:tag` created the three tags and releases.
- **A missed step:** its dispatch skipped the credential check, which passed when run afterwards.
  That is why the pre-flight now runs it.

### 0.7.0

Published on 2026-10-01 from `a3dc6f935b7914dedd17067036ebadcde737bfd9` after integration
[#175](https://github.com/vodoco/kozmos-design-system/pull/175), Storybook development-server
security [#174](https://github.com/vodoco/kozmos-design-system/pull/174), and version
[#176](https://github.com/vodoco/kozmos-design-system/pull/176). This entry records that
release, not permission to dispatch another one.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.7.0, tokens 0.3.0, product-contracts 0.6.0 on npm `latest`; icons 0.5.0 unchanged and omitted from this publication.                                                                                                                                                                                      |
| Exact main-push CI      | [36792093361](https://github.com/vodoco/kozmos-design-system/actions/runs/36792093361): all 17 jobs succeeded, including web, iOS and Android.                                                                                                                                                                    |
| Preflight / publication | Credential placement, exact CI/main identity and unpublished versions passed preflight. [36828049714](https://github.com/vodoco/kozmos-design-system/actions/runs/36828049714) succeeded after Olcay's protected approval; it published the tested candidate tarballs.                                            |
| Registry readback       | All three versions and `latest` tags matched; SHA-512 integrities matched the retained candidate manifest; npm exposed provenance metadata.                                                                                                                                                                       |
| Installed consumer      | A fresh npm installation of React package 0.7.0 with React 19 resolved tokens 0.3.0, icons 0.5.0 and contracts 0.6.0, loaded the package and server-rendered a Button. The prepare job also ran its broader React 18/19 tarball checks.                                                                           |
| Tags / GitHub releases  | `release:tag` dry-run passed, created all three planned tags/releases, and a second dry-run verified their commit targets. Notes matched the committed changelog sections. React 0.7.0 is Latest; no icons release was created.                                                                                   |
| Website / Storybook     | [Pages 36792093275](https://github.com/vodoco/kozmos-design-system/actions/runs/36792093275) built and deployed this exact SHA. Live site, Storybook manager, iframe and story index returned HTTP 200; new SDK component docs and map-browse stories were present. This is not a fresh all-screen visual review. |

Change details and migration notes: [React](../packages/react/CHANGELOG.md#070),
[tokens](../packages/tokens/CHANGELOG.md#030),
[contracts](../packages/product-contracts/CHANGELOG.md#060), and
[generated AI changelog](../.ai-skills/api-changelog.md).
Consumers upgrading FloorSelector from 0.6.0 must opt into `showResultCounts` to retain
list badges; closed-tile counts remain absent. MapOverlay's position gained logical
`topStart`/`topEnd`/`bottomStart`/`bottomEnd` (`TOP_START` and so on in Compose): a Swift or Kotlin
`switch` over `KozmosOverlayPosition` or `OverlayPosition` must add the new cases. Native source changes are not native registry
publication. Figma, external Claude Design artifacts and product deployments are independent.
Private Vue playground dependency advisories remain separately scoped; #174 did not fix them.

### 0.8.0

Published on 2026-10-02 from `152a31349db8832d8b87a9d5ea52e229fca245b5`, the version merge
[#192](https://github.com/vodoco/kozmos-design-system/pull/192), after
[#177](https://github.com/vodoco/kozmos-design-system/pull/177)–[#191](https://github.com/vodoco/kozmos-design-system/pull/191):
the Firefox 146 minimum (#178), P01 accessibility and result-action targets (#185), P02 panel
spacing (#186), P03 staff language and ordered instruction parts (#187, #188) and P04's SDK
result presentation (#190, #191). This entry records that release, not permission to dispatch
another one.

| Evidence                | Verified result                                                                                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.8.0, tokens 0.4.0, product-contracts 0.7.0 on npm `latest`; icons 0.5.0 unchanged and omitted from this publication.                                                                                                                                                |
| Exact main-push CI      | [37056723298](https://github.com/vodoco/kozmos-design-system/actions/runs/37056723298): all 17 jobs succeeded, including web, iOS and Android.                                                                                                                              |
| Preflight / publication | `pnpm release:preflight` against that run passed before the dispatch. [37061899561](https://github.com/vodoco/kozmos-design-system/actions/runs/37061899561) succeeded (prepare, guard, publish) after Olcay's protected `npm-release` approval.                            |
| Registry readback       | All three versions are on `latest`, each with SLSA v1 provenance. Their SHA-512 integrities equal the tarballs in the run's `npm-candidate-37061899561-1` artifact (compared 2026-10-04).                                                                                   |
| Installed consumer      | On 2026-10-04 a fresh npm installation of React 0.8.0 with React 19 resolved tokens 0.4.0, icons 0.5.0 and contracts 0.7.0, exposed 264 exports and server-rendered ThemeProvider, Button, SearchBar and MapStatusPill.                                                     |
| Tags / GitHub releases  | `release:tag` was not run after the publish; it was run on 2026-10-04. Its dry-run passed, it created all three planned tags/releases at `152a3134`, and a second dry-run found all three in place. React 0.8.0 is Latest; no icons release was created.                    |
| Website / Storybook     | [Pages 37056723174](https://github.com/vodoco/kozmos-design-system/actions/runs/37056723174) built and deployed this exact SHA. The live site, Storybook, its `index.json` and `iframe.html` returned HTTP 200 on 2026-10-04. This is not a fresh all-screen visual review. |

Change details and migration notes: [React](../packages/react/CHANGELOG.md#080),
[tokens](../packages/tokens/CHANGELOG.md#040),
[contracts](../packages/product-contracts/CHANGELOG.md#070), and
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.7.0:

- Firefox 146 or newer is required: the scoped utility styles need native `@scope`.
- POIResultCard and its groups default to the SDK presentation; pass
  `presentationStyle="legacy"` to keep the earlier tab during a staged migration.
- AdaptiveMapShell now supplies 16 units below a fixed panel header and at the top of gripless
  sheets: remove product spacers that did the same.
- POIResultCard actions are disabled when no `onAction` is supplied, as on iOS and Android.

Native source changes are not native registry publication. Figma, external Claude Design
artifacts and product deployments are independent.

### 0.8.1

Published on 2026-10-04 from `42d442695581a2e0e5cda87fc1d56e4f406e7ca6`, the version merge
[#196](https://github.com/vodoco/kozmos-design-system/pull/196), after the accessibility fixes in
[#195](https://github.com/vodoco/kozmos-design-system/pull/195). A React patch alone: tokens 0.4.0,
icons 0.5.0 and product-contracts 0.7.0 are unchanged.

| Evidence                | Verified result                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.8.1 on npm `latest`, pinning tokens 0.4.0, icons 0.5.0 and product-contracts 0.7.0 exactly; nothing else published.                                                                                                                                   |
| Exact main-push CI      | [37229344575](https://github.com/vodoco/kozmos-design-system/actions/runs/37229344575): all 17 jobs succeeded, including web, iOS and Android.                                                                                                                |
| Preflight / publication | `pnpm release:preflight` against that run passed. [37231352856](https://github.com/vodoco/kozmos-design-system/actions/runs/37231352856) succeeded (prepare, guard, publish) after Olcay's protected `npm-release` approval.                                  |
| Registry readback       | 0.8.1 is `latest`, with SLSA v1 provenance; its SHA-512 integrity equals the tarball in the run's `npm-candidate-37231352856-1` artifact.                                                                                                                     |
| Installed consumer      | A fresh npm installation of React 0.8.1 with React 19 resolved tokens 0.4.0, icons 0.5.0 and contracts 0.7.0, exposed 264 exports and server-rendered ThemeProvider, Button and a pending LanguageSwitcher, whose trigger is `aria-disabled`, not `disabled`. |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/react@0.8.1` at `42d44269`, and a second dry-run found it in place. React 0.8.1 is Latest.                                                                                                               |
| Website / Storybook     | [Pages 37229344552](https://github.com/vodoco/kozmos-design-system/actions/runs/37229344552) built and deployed this exact SHA. The live site, Storybook and its `index.json` returned HTTP 200. This is not a fresh all-screen visual review.                |

Change details: [React](../packages/react/CHANGELOG.md#081) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.8.0: a pending
LanguageSwitcher trigger is `aria-disabled="true"` rather than `disabled`, so a consumer test that
expected `disabled` while pending must expect `aria-disabled`. No props change. The iOS fixes in
#195 (the map shell no longer crashing with one bottom corner, floor levels read once) ship from the
repository, not a native registry.

### 0.9.0

Published on 2026-10-06 from `c7644af8a773c0d3b1e946cb044e81f4f8ca2632`, the version merge
[#222](https://github.com/vodoco/kozmos-design-system/pull/222), after the navigation completion
([#193](https://github.com/vodoco/kozmos-design-system/pull/193)), the Pointr Maps - Express wayfinding
icons (#199, #201), the native user-location marker and `Map marker` tokens (#211) and the fixes since
0.8.1. All four packages move. Olcay accepted three open items before the dispatch: the iOS 26.5 Combobox
picker that doesn't open on tap, the iOS rail transition arrow that may mirror in right to left, and JS
bundle headroom of 0.14 KB.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.9.0, tokens 0.5.0, icons 0.6.0 and product-contracts 0.8.0 on npm `latest`; React pins the other three exactly.                                                                                                                                                                                                                                                                                                                                                                                             |
| Exact main-push CI      | [37491281142](https://github.com/vodoco/kozmos-design-system/actions/runs/37491281142): all 17 jobs succeeded on the first attempt, including web, iOS and Android. Bundle Size Analysis on the merge: JS 79.86 / 80.00 KB, CSS 28.35 / 30.50 KB.                                                                                                                                                                                                                                                                   |
| Preflight / publication | `pnpm release:preflight` against that run passed (credential placement, request, evidence and plan; none of the versions on npm). [37496171190](https://github.com/vodoco/kozmos-design-system/actions/runs/37496171190) succeeded (guard, prepare, publish) after Olcay's protected `npm-release` approval.                                                                                                                                                                                                        |
| Registry readback       | All four versions are on `latest`, each with SLSA v1 provenance. Their SHA-512 integrities equal the tarballs in the run's `npm-candidate-37496171190-1` artifact (compared 2026-10-06).                                                                                                                                                                                                                                                                                                                            |
| Installed consumer      | A fresh npm installation of React 0.9.0 with React 19 resolved tokens 0.5.0, icons 0.6.0 and contracts 0.8.0, exposed 269 exports (ArrivalPanel, RouteLocationField and RouteSetupPanel among them) and server-rendered ThemeProvider, Button, RouteSummary, RouteProgressRail with an active leg, UserLocationMarker and an Icon; the same with React 18.                                                                                                                                                          |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created all four tags and releases at `c7644af8`, and a second dry-run found them in place. React 0.9.0 is Latest.                                                                                                                                                                                                                                                                                                                                                                 |
| Website / Storybook     | [Pages 37491281104](https://github.com/vodoco/kozmos-design-system/actions/runs/37491281104) built and deployed this exact SHA at 17:02Z, once a deploy stuck since 10:46Z ([37451941818](https://github.com/vodoco/kozmos-design-system/actions/runs/37451941818), `038cedc4`, waiting on the reviewer-less `github-pages` environment and holding the `pages` group) was cancelled. The live site, Storybook, its `index.json` and `iframe.html` returned HTTP 200. This is not a fresh all-screen visual review. |

Change details: [React](../packages/react/CHANGELOG.md#090), [tokens](../packages/tokens/CHANGELOG.md#050),
[icons](../packages/icons/CHANGELOG.md#060), [contracts](../packages/product-contracts/CHANGELOG.md#080)
and the [generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.8.1:

- **RouteSummary is hosted inside AdaptiveMapShell's panel by default**: no surface, radius, shadow or
  outer padding of its own (decision 43). Pass `presentation="standalone"` to keep its card in the shell.
- **ManoeuvreCard is theme-filled by default.** A caller that already sets `surface` keeps it;
  `appearance="background"` asks for the neutral surfaces.
- **Analytics:** a press a component reports with its own event no longer also sends the generic
  `Button:button_clicked`; `wayfinding_route_swapped` no longer carries the raw origin and destination.
- **POIDetailPanel's labelled actions are text-only**, apart from Go/Directions.
- `DirectionType` stays a source-compatible alias of product-contracts' `DirectionKind`.
- UserLocationMarker uses the new fixed `Semantics.Map marker` tokens (tokens 0.5.0).

SwiftUI and Compose changes ship from the repository at this commit, not a native registry. Figma,
Code Connect, external Claude Design artifacts and product deployments are separate.

### 0.10.0

Published on 2026-10-09 from `1ddc4d10e67616eaaa9d984ca0c3ec830c78087e`, the version merge
[#267](https://github.com/vodoco/kozmos-design-system/pull/267). It carries decisions 59–69 (the theme fill,
one-override re-branding, emotion and secondary button states, the accent colour, the pins), ClientAppBanner,
the new props since 0.9.0 and the fixes up to #266. React, tokens and product-contracts move; icons stays at
0.6.0 and was not planned. At Olcay's request Claude dispatched the release and approved the protected
`npm-release` deployment, as `vodoco`, for this release only; earlier releases were dispatched and approved
by Olcay.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.10.0, tokens 0.6.0 and product-contracts 0.9.0 on npm `latest`; React pins tokens 0.6.0, product-contracts 0.9.0 and icons 0.6.0 exactly.                                                                                                                                                                                                                         |
| Exact main-push CI      | [37916254149](https://github.com/vodoco/kozmos-design-system/actions/runs/37916254149): all 17 jobs succeeded on the first attempt, including web, iOS and Android. Bundle Size Analysis on the merge ([37916254077](https://github.com/vodoco/kozmos-design-system/actions/runs/37916254077)): JS 81.34 / 88.00 KB, CSS 29.45 / 30.50 KB.                                |
| Preflight / publication | `pnpm release:preflight` against that run passed (credential placement, request, evidence and plan; none of the versions on npm). [37933834467](https://github.com/vodoco/kozmos-design-system/actions/runs/37933834467) succeeded (guard, prepare, publish); its prepare job's install check passed before the `npm-release` approval.                                   |
| Registry readback       | All three versions are on `latest`, each with SLSA v1 provenance. Their SHA-512 integrities equal the tarballs in the run's `npm-candidate-37933834467-1` artifact (compared 2026-10-09). React's tarball URL answered 404 for about five minutes after the publish while the registry's CDN caught up; the metadata and the job's own registry check were already right. |
| Installed consumer      | A fresh npm installation of React 0.10.0 resolved tokens 0.6.0, icons 0.6.0 and contracts 0.9.0. With React 19 it exposed 270 exports and server-rendered ThemeProvider, Button, a featured LocationPin (named "…, Featured") and ClientAppBanner. With React 18, NavigationItem `asChild` rendered onto its link, and the installed `reset.css` has no `theme()`.        |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created the three tags and releases at `1ddc4d10`, and a second dry-run found them in place. React 0.10.0 is Latest.                                                                                                                                                                                                                     |
| Website / Storybook     | [Pages 37916254384](https://github.com/vodoco/kozmos-design-system/actions/runs/37916254384) built and deployed this exact SHA at 10:17Z. The live site, Storybook, its `index.json` (with ClientAppBanner's stories) and `iframe.html` returned HTTP 200. This is not a fresh all-screen visual review.                                                                  |

Change details: [React](../packages/react/CHANGELOG.md#0100), [tokens](../packages/tokens/CHANGELOG.md#060),
[contracts](../packages/product-contracts/CHANGELOG.md#090) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.9.0:

- **Prominent fills are theme 500 with white on them, in both themes** (decision 59). In the dark theme
  the primary Button changes most: from light blue with black text to `#135BEC` with white. To keep your
  brand, override `--primitives-colors-theme-500` on `ThemeProvider`'s `tokens`, with the steps around it
  for hover, focus and pressed; `tokens` takes `{ light, dark }` sets.
- **Token CSS writes aliases as `var()` references** (GAP-23). A tool that reads `css/light.css` or
  `css/dark.css` as text meets `var(--…)` where it read a colour; resolve it in the same file.
- **Featured is the new accent colour** (decision 68): a featured LocationPin and POIResultCard's Featured
  tab and edge are `#FAB735` by default. A featured pin shows its logo (`markerContent`) or a star, never
  its number, and its accessible name gains `featuredLabel` ("Featured"): drop the word from `label` if it
  already says it. Set your accent on `ThemeProvider`: `--primitives-colors-accent-500`, and
  `--semantics-accent-on-fill` for a dark accent.
- **LocationPin's `accent` variant is brand variant 1** (`#4135F1`, white number), and a filled
  `secondary` pin is foreground/400.
- **The secondary Button and the emotion buttons** draw their own hover, focus and pressed tokens; the
  dark secondary fill is `#464A53`.
- **RouteSummary without `onEndRoute`** draws the route preview; existing navigation calls are unchanged.
- **`reset.css` now sets the page's font** to the system sans stack; before, browsers dropped its
  `theme()` declarations and the page kept the browser's serif.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry. Figma
(the Update for decisions 59–69 is next), Code Connect, external Claude Design artifacts and product
deployments are separate.

### 0.11.0

Published on 2026-10-15 from `a315aabe7800ff5c3a35cbd58bdf0aae954bdf4c`, the version merge
[#271](https://github.com/vodoco/kozmos-design-system/pull/271). It carries Track 1
([#270](https://github.com/vodoco/kozmos-design-system/pull/270)) and decisions 72–78: POIResultList's
`onOpen`, ManoeuvreCard's quieter grip, scrollbars by presentation and the scrollbar tokens, the field
popups in a portal, the panel's end inset, Notice's `iconAlign`, the assistant's close button and banner,
LanguageSwitcher's menu above its trigger, and CJK category names on three lines. React and tokens move;
icons stays at 0.6.0 and product-contracts at 0.9.0, neither planned. At Olcay's request Claude dispatched the
release and approved the protected `npm-release` deployment, as `vodoco`, for this release only.

| Evidence                | Verified result                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.11.0 and tokens 0.7.0 on npm `latest`; React pins tokens 0.7.0, icons 0.6.0 and product-contracts 0.9.0 exactly, and the new `@radix-ui/react-popper` 1.2.8 and `@radix-ui/react-portal` 1.1.9.                                                     |
| Exact main-push CI      | [38724371656](https://github.com/vodoco/kozmos-design-system/actions/runs/38724371656): all 17 jobs succeeded on the first attempt, including web, iOS and Android. Bundle Size Analysis, Visual Regression, Lighthouse CI and Site succeeded on the merge. |
| Preflight / publication | `pnpm release:preflight` against that run passed (credential placement, request, evidence and plan; neither version on npm). [38729768654](https://github.com/vodoco/kozmos-design-system/actions/runs/38729768654) succeeded (guard, prepare, publish).    |
| Registry readback       | Both versions are on `latest`, each with SLSA v1 provenance. Their SHA-512 integrities equal the tarballs in the run's `npm-candidate-38729768654-1` artifact (compared 2026-10-15).                                                                        |
| Installed consumer      | A fresh npm installation of React 0.11.0 with React 19 resolved tokens 0.7.0, icons 0.6.0 and contracts 0.9.0, exposed 270 exports, and server-rendered ThemeProvider, Button and a Notice with `iconAlign="center"` and no icon, from CJS and ESM.         |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created the two tags and releases at `a315aabe`, and a second dry-run found them in place. React 0.11.0 is Latest.                                                                                                         |
| Website / Storybook     | [Pages 38724371686](https://github.com/vodoco/kozmos-design-system/actions/runs/38724371686) built and deployed this exact SHA. The live Storybook's `index.json` lists the new Toast Open and Notice Search with AI stories.                               |

Note: the version PR's iOS job failed once on a UI-query timeout in an interaction test unrelated to the
change (the same test passed on #270 with identical iOS code) and passed on its re-run; main's run passed
on its first attempt.

Change details: [React](../packages/react/CHANGELOG.md#0110), [tokens](../packages/tokens/CHANGELOG.md#070)
and the [generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.10.0:

- **The map shell's panel leaves 16 below its content** (GAP-085). A fitted panel is 16px taller under a
  short list. If your panel content pads its own bottom to stand in for this space, remove that padding, or
  the space doubles. A part that ends with its own padding gives the shell's back with
  `margin-block-end: calc(-1 * var(--kozmos-panel-inset-bottom, 0px))`.
- **Scrollbars follow the presentation** (decision 75): none at rest in a sheet; Kozmos's thin one beside
  the map and alone, in the new `--semantics-scrollbar-thumb` and `-thumb-hover`.
- **Combobox's and MultiSelect's lists are drawn in a portal**, as tall as the window leaves (16rem at
  most). A test that looked for the list inside the field's DOM finds it at the end of the theme's portal.
- **`Notice icon={null}`** now draws no icon column; before, it drew the default icon.
- **ManoeuvreCard is shorter**: 39 closed and 16 open. A layout that reserved its old height can shrink.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry; on Compose a
scroller at the panel's end applies `kozmosPanelScrollEndPadding()` (see its CHANGELOG). Figma (the Update
for ManoeuvreCard's painter is next), Code Connect, external Claude Design artifacts and product deployments
are separate.

### 0.12.0

Published on 2026-10-16 from `5c3b7ecc7c14f129c03b3f75aebb093a10e7f5fc`, the version merge
[#278](https://github.com/vodoco/kozmos-design-system/pull/278). It carries Track 2
([#273](https://github.com/vodoco/kozmos-design-system/pull/273)): LocationPin draws the SDK's map markers
(decisions 71, 79–81); compact density and `DensityScope`
([#274](https://github.com/vodoco/kozmos-design-system/pull/274), decisions 82, 89, 90 and 97); and the Core
review's fixes with Tag's `removeLabel` ([#277](https://github.com/vodoco/kozmos-design-system/pull/277)).
React, tokens and product-contracts move; icons stays at 0.6.0, not planned. At Olcay's request Claude merged the
version PR, ran the pre-flight, dispatched the release and approved the protected `npm-release` deployment, as
`vodoco`, for this release only.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Versions                | React 0.12.0, tokens 0.8.0 and product-contracts 0.9.1 on npm `latest`; React pins tokens 0.8.0, icons 0.6.0 and product-contracts 0.9.1 exactly.                                                                                                                                                                                                                                                      |
| Exact main-push CI      | [38954550675](https://github.com/vodoco/kozmos-design-system/actions/runs/38954550675): all 17 jobs succeeded on the first attempt, including web, iOS and Android. Bundle Size Analysis, Visual Regression, Lighthouse CI and Site succeeded on the merge.                                                                                                                                            |
| Preflight / publication | `pnpm release:preflight` against that run passed (credential placement, request, evidence and plan; none of the versions on npm). [38961640954](https://github.com/vodoco/kozmos-design-system/actions/runs/38961640954) succeeded (guard, prepare, publish).                                                                                                                                          |
| Registry readback       | All three versions are on `latest`, each with SLSA v1 provenance. Their SHA-512 integrities equal the tarballs in the run's `npm-candidate-38961640954-1` artifact (compared 2026-10-16).                                                                                                                                                                                                              |
| Installed consumer      | A fresh npm installation of React 0.12.0 with React 19.3.1 resolved tokens 0.8.0, icons 0.6.0 and contracts 0.9.1, exposed 271 exports from CJS and from the ESM entry, and server-rendered ThemeProvider at `density="compact"` with a touch `DensityScope`, Button, a LocationPin with `onOpen`, and a Tag with `removeLabel`. `@kozmos-ds/tokens/css/density.css` resolves. The same with React 18. |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created the three tags and releases at `5c3b7ecc`, and a second dry-run found them in place. React 0.12.0 is Latest.                                                                                                                                                                                                                                                  |
| Website / Storybook     | [Pages 38954550633](https://github.com/vodoco/kozmos-design-system/actions/runs/38954550633) built and deployed this exact SHA. The live Storybook's `index.json` lists the ThemeProvider Density story and the new LocationPin stories (Place among them); the removed ones are gone.                                                                                                                 |

Note: CI on #273's merge to main (`08207f45`) failed once on the iOS interaction test
`testAPressDrawsEachFillsOwnPressedToken` ("Timed out while evaluating UI query"), as on 8 Oct, on code its PR run
passed; its re-run passed. A fix is tracked separately.

Change details: [React](../packages/react/CHANGELOG.md#0120), [tokens](../packages/tokens/CHANGELOG.md#080),
[product-contracts](../packages/product-contracts/CHANGELOG.md#091) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.11.0:

- **LocationPin's look and API change** (decisions 79–81). Remove `variant`, `size`, `tint` and `offFloor`; write the
  number into `label` yourself; pass `externalLabel` for visible words. A featured tile and a place are anchored at
  their dot's centre, 3 above their foot. `data-featured` and `data-off-floor` are gone; `data-kind`,
  `data-interactive` and `data-disabled` are new. A selected result is theme 600, not the theme fill.
- **On a map:** with `onOpen`, a second touch tap within 500 ms stays on the pin, and MapLibre fires the map's `click`
  for a marker too: a click handler that clears the selection should skip clicks inside `.kozmos-location-pin`.
- **Density is opt-in.** At the default, touch, nothing changes size, except that Pagination's Previous and Next are
  now the small Button (still 44 in touch, with the same padding).
- **Switch and Checkbox keep a caller's `aria-describedby`** and join their error's to it; a caller's
  `aria-invalid={false}` no longer hides a shown error. A caller's `onCheckedChange` on Checkbox no longer stops
  `checkbox_toggled`.
- **Toast reads its direction:** a test that looked for `space-x-4` or `pr-8` on a toast finds `gap-4` and `pe-8`.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry: `.kozmosLocationPinAt`
on SwiftUI (`.position` mirrors in right-to-left), physical side labels, and the pin's analytics on both (see their
CHANGELOGs). Figma (LocationPin updated and audited clean), Code Connect (published and read back), external Claude
Design artifacts and product deployments are separate.

### 0.12.1

Published on 2026-10-17 from `8207ff4b390335a9c0afbe28f6e4d4d6e28f1738`, the version merge
[#301](https://github.com/vodoco/kozmos-design-system/pull/301). It carries two React fixes: every Kozmos field
draws in Safari 26.0–26.3 as in the other engines (GAP-174,
[#279](https://github.com/vodoco/kozmos-design-system/pull/279)), and ColorPicker mirrors right to left, its swatch,
open button and hue and opacity gradients ([#282](https://github.com/vodoco/kozmos-design-system/pull/282)). React
alone moves; tokens 0.8.0, icons 0.6.0 and product-contracts 0.9.1 are unchanged and not planned. At Olcay's request
Claude merged the version PR, ran the pre-flight, dispatched the release and approved the protected `npm-release`
deployment, as `vodoco`, for this release only.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.12.1 on npm `latest`; it pins tokens 0.8.0, icons 0.6.0 and product-contracts 0.9.1 exactly.                                                                                                                                                                                                                                                                                                                                                                             |
| Exact main-push CI      | [39058268738](https://github.com/vodoco/kozmos-design-system/actions/runs/39058268738): all 17 jobs succeeded on the first attempt, including web, iOS and Android; its new step found the release workflow's 5 SHA-pinned actions to be commits (#295). Bundle Size Analysis, Visual Regression, Lighthouse CI, Pages and Site succeeded on the merge.                                                                                                                          |
| Preflight / publication | `pnpm release:preflight` against that run passed (credential placement, request, evidence and plan; 0.12.1 not on npm). [39061203007](https://github.com/vodoco/kozmos-design-system/actions/runs/39061203007) succeeded (guard, prepare, publish).                                                                                                                                                                                                                              |
| Registry readback       | 0.12.1 is on `latest` with SLSA v1 provenance (Sigstore log index 3299501080). Its SHA-512 integrity equals the one the publish job printed, and the job verified the approved tarball in the registry.                                                                                                                                                                                                                                                                          |
| Installed consumer      | A fresh npm installation of React 0.12.1 with React 19.3.1 resolved tokens 0.8.0, icons 0.6.0 and contracts 0.9.1, exposed 271 exports from CJS and from the ESM entry, and server-rendered ThemeProvider with a right-to-left Button, ColorPicker and Input. The same with React 18.3.1. The installed stylesheet carries the owned field rules (the swatch at `inset-inline-start`, the OTP cells, the AI input), and the ColorPicker module the right-to-left range gradient. |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/react@0.12.1` at `8207ff4b`, and a second dry-run found it in place. React 0.12.1 is Latest.                                                                                                                                                                                                                                                                                                                                |
| Website / Storybook     | [Pages 39058268690](https://github.com/vodoco/kozmos-design-system/actions/runs/39058268690) built and deployed this exact SHA. The live Storybook's `index.json` (608 entries) lists ColorPicker Open, Search Default and Textarea WithError, and their iframes answer.                                                                                                                                                                                                         |

Change details: [React](../packages/react/CHANGELOG.md#0121) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.12.0:

- **A field's `className` and Safari 26.0–26.3.** Those versions apply no `@scope` rule to an `<input>` or a
  `<textarea>`, so a utility class passed to a field's `className` never reaches the field there (it still does in
  Chrome, Edge, Firefox and Safari 26.4). Style a field through its props, the provider's `tokens`, an inline
  `style` or your own CSS, and the layout around it through `wrapperClassName` (the README's "Fields in Safari").
- **ColorPicker right to left:** the swatch sits at the inline start, the open button at the inline end, and the hue
  and opacity gradients run with their sliders. Left to right nothing changes.
- **Build output:** the UMD file gains two parentheses round the factory, and the stylesheet writes `@media`
  preludes without spaces (#283's toolchain); no rule changed.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry (see their CHANGELOGs):
the SwiftUI default analytics log (#286); Android's unused `com.kozmos.utils` analytics copies removed, with a
migration note (#288); ColorPicker's colour square right to left (#290), the iOS format row at phone widths (#296),
Compose's format row and palette field at large text (#298, #299); `KozmosIcon` drawing all 80 icons on SwiftUI
(#297); and POI detail tags drawing Kozmos icons, with the additive `iconName` (#300). The native Code Connect,
with the library icons (#293), was published and read back on 17 Oct (SwiftUI 214, Compose 209 mappings). External
Claude Design artifacts and product deployments are separate.

### 0.12.2

Published on 2026-10-22 from `afcc2fbdc3d6324e9cc0d3c24a9e7d87670b0bd7`, the version merge
[#374](https://github.com/vodoco/kozmos-design-system/pull/374). It carries four React patches:

- a framed `MapView` has the control radius, 16, as the natives do
  ([#338](https://github.com/vodoco/kozmos-design-system/pull/338));
- POIDetailPanel draws an item's `iconName` icon when its `iconUrl` is unsafe or fails to load (GAP-178,
  [#349](https://github.com/vodoco/kozmos-design-system/pull/349));
- POI detail tags draw every name `KozmosIcon` draws on iOS and Android
  ([#308](https://github.com/vodoco/kozmos-design-system/pull/308));
- Stepper marks its current step ([#335](https://github.com/vodoco/kozmos-design-system/pull/335)).

React alone moves; tokens 0.8.0, icons 0.6.0 and product-contracts 0.9.1 are unchanged and not planned. At Olcay's
request (21 Oct: a full release once #335 merged) Claude merged the version PR, ran the pre-flight, dispatched the
release and approved the protected `npm-release` deployment, as `vodoco`, for this release only.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Versions                | React 0.12.2 on npm `latest`; it pins tokens 0.8.0, icons 0.6.0 and product-contracts 0.9.1 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Exact main-push CI      | [39743530429](https://github.com/vodoco/kozmos-design-system/actions/runs/39743530429): all 17 jobs succeeded on the first attempt, including web, iOS and Android. It waited about 8 minutes while the workflow's concurrency cancelled the main run for #335's merge (#337, queued, makes a main run wait for the one before it instead). Bundle Size Analysis, Visual Regression, Lighthouse CI, Pages and Site succeeded on the merge.                                                                                                                   |
| Preflight / publication | `pnpm release:preflight` against that run passed on 22 Oct (credential placement, request, evidence and plan; 0.12.2 not on npm). [39821259752](https://github.com/vodoco/kozmos-design-system/actions/runs/39821259752) succeeded (guard, prepare, publish).                                                                                                                                                                                                                                                                                                |
| Registry readback       | 0.12.2 is on `latest` with SLSA v1 provenance (Sigstore log index 3394851033). Its SHA-512 integrity equals the one the publish job printed, and the job verified the approved tarball in the registry.                                                                                                                                                                                                                                                                                                                                                      |
| Installed consumer      | A fresh npm installation of React 0.12.2, lifecycle scripts off, with React 19.3.1 resolved tokens 0.8.0, icons 0.6.0 and contracts 0.9.1 and exposed 271 exports from CJS and from the ESM entry. Server-rendered: Stepper marks one step `aria-current="step"`, and a framed MapView is `rounded-control` (0.12.1, installed the same way, gave none and `rounded-container`). The same with React 18.3.1. The ESM bundle names the POI tags' wayfinding glyphs (`elevator-up`, `follow-the-line`, `security-control`, `log-in-01`), which 0.12.1's lacks. |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/react@0.12.2` at `afcc2fbd`, and a second dry-run found it in place. React 0.12.2 is Latest.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Website / Storybook     | [Pages 39743530550](https://github.com/vodoco/kozmos-design-system/actions/runs/39743530550) built and deployed this exact SHA. The live Storybook's `index.json` (609 entries) lists MapView, Stepper and POIDetailPanel. Read in Chromium, MapView Default draws a 16px corner and Stepper Default marks one step current.                                                                                                                                                                                                                                 |

Change details: [React](../packages/react/CHANGELOG.md#0122) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.12.1, with no API change:

- **A framed MapView's corners are 16, not 20.** A frame of yours that clips a framed MapView at its corners takes
  the control radius, or it cuts the map's border. A map that is the screen, inside `AdaptiveMapShell`, is
  `variant="fill"`, with no border and no corners.
- **POIDetailPanel's artwork falls back:** an item whose `iconUrl` is unsafe or fails to load draws its `iconName`'s
  icon, and a summary fact its kind's glyph, where it drew nothing.
- **POI detail tags draw 27 more names,** the wayfinding glyphs and four outlines, where they drew only the label.
- **Stepper's current step is `aria-current="step"`,** so a screen reader hears it.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry (see their CHANGELOGs):

- the SwiftUI batching analytics modifier delivers as React's provider does (#307);
- a service's POI tag draws its own artwork on iOS (#309);
- the breadcrumb's current page (#322) and the toast's announcement (#334), on both;
- Dynamic Type headings (#331), radios' and toggle buttons' state (#332) and NavigationItem's icon colour (#333) on
  iOS;
- on Compose:
  - the backdrop leaves the focus order (#314);
  - pagination says its words once (#321);
  - FileUpload shows the file's name (#323);
  - Avatar's initials (#324);
  - MapView's fill corners (#325);
  - Popover's side (#326);
  - SplitButton's (#327) and WayfindingCard's (#329) radii;
  - the table header's line (#328);
- POI artwork's fallback (#349) and Stepper's current step (#335) on both.

Every component page's SwiftUI and Compose tabs show the compiled, real API (#310, #312, #315, #317). Figma, Code
Connect, external Claude Design artifacts and product deployments are separate.

### 0.13.0

Published on 2026-10-26 from `ba2a28f427b596d63ee069270f871f4be13dfd41`, the version merge
[#407](https://github.com/vodoco/kozmos-design-system/pull/407). React 0.13.0, icons 0.7.0 and tokens 0.8.1;
product-contracts 0.9.1 is unchanged and not planned. It carries the web's own date and time panels
(decisions 104 and 105, GAP-186): `Calendar` (#352), and DatePicker (#361), DateRangePicker (#366) and TimePicker
(#369) opening it; the 29 icon names the natives draw beyond the library (GAP-179, #364); the product's words on
Pagination, SplitButton and the toast's close (GAP-182, GAP-168); list rows drawn as Figma draws them (#372, #386);
MultiSelect's 44px buttons (#397) and its forced-colours input (#401); a sheet fitted to the assistant (#404); and a
smaller stylesheet: 20 measured trims (#395), and Tailwind's compiler defaults registered rather than declared on
every element (#381). The published `style.css` is 30,539 bytes gzip, down from 0.12.2's 31,414 (`gzip -9`), with
Calendar's and the pickers' panels in it.

Claude dispatched the release after the pre-flight passed (Olcay, 25 Oct). Olcay then asked Claude in chat to
approve the protected `npm-release` deployment for him, and Claude approved it, as `vodoco`, for this release only,
as for 0.12.2.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.13.0, icons 0.7.0 and tokens 0.8.1 on npm `latest`. React pins tokens 0.8.1, icons 0.7.0 and product-contracts 0.9.1 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Exact main-push CI      | [40366715021](https://github.com/vodoco/kozmos-design-system/actions/runs/40366715021): all 17 jobs succeeded on the first attempt, including web, iOS and Android. Bundle Size Analysis, Visual Regression, Lighthouse CI, Pages and Site succeeded on the merge.                                                                                                                                                                                                                                                                                                                    |
| Preflight / publication | `pnpm release:preflight` against that run passed on 26 Oct (credential placement, request, evidence and plan; none of the three on npm). [40374438773](https://github.com/vodoco/kozmos-design-system/actions/runs/40374438773) succeeded (guard, prepare, publish).                                                                                                                                                                                                                                                                                                                  |
| Registry readback       | All three are on `latest` with SLSA v1 provenance (Sigstore log indexes 3493440859 for icons, 3493481771 for tokens and 3493534973 for React). Each SHA-512 integrity equals the one the publish job printed, and the job verified the approved tarballs in the registry.                                                                                                                                                                                                                                                                                                             |
| Installed consumer      | A fresh npm installation of React 0.13.0, lifecycle scripts off, with React 19.3.1 resolved tokens 0.8.1, icons 0.7.0 and contracts 0.9.1 and exposed 272 exports from CJS and from the ESM entry, `Calendar` the new one (0.12.2, installed the same way: 271, none of them `Calendar`). Server-rendered: a Button, and a `Calendar` for October 2026 as a `role="grid"`. `kozmosIconNamesBeyondTheLibrary` lists 29 names (icons 0.6.0 has none). The same with React 18.3.1, where Calendar's server render printed React 18's `useLayoutEffect` warning, fixed for 0.14.0 (#412). |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/icons@0.7.0`, `@kozmos-ds/tokens@0.8.1` and `@kozmos-ds/react@0.13.0` at `ba2a28f4`, and a second dry-run found all three in place. React 0.13.0 is Latest.                                                                                                                                                                                                                                                                                                                                                                      |
| Website / Storybook     | [Pages 40366714873](https://github.com/vodoco/kozmos-design-system/actions/runs/40366714873) built and deployed this exact SHA. The live Storybook's `index.json` (622 entries) lists Calendar's six stories.                                                                                                                                                                                                                                                                                                                                                                         |
| Code Connect            | Published from this commit on 26 Oct: 213 React, 214 SwiftUI and 209 Compose docs, every dry run valid first, Compose's `Select.figma.kt` (`KozmosSelectTrigger`, #341) among them (Olcay, 24 Oct).                                                                                                                                                                                                                                                                                                                                                                                   |

Change details: [React](../packages/react/CHANGELOG.md#0130), [icons](../packages/icons/CHANGELOG.md#070),
[tokens](../packages/tokens/CHANGELOG.md#081) and the [generated AI changelog](../.ai-skills/api-changelog.md).
Upgrading from 0.12.2:

- **The date and time pickers open Kozmos's panels** in Chromium, Edge and Safari: a button at each field's end
  opens a Calendar, or for TimePicker a list of times, in a Popover. The value APIs are unchanged, and the new props
  are optional. Firefox 146 keeps the browser's date fields, as no page can hide its picker button (Mozilla's
  webcompat bug 2048623, which waits on platform bug 2051201); it gets TimePicker's list. DateRangePicker's two fields are labelled beside their inputs, not around them.
- **List rows are 44 tall** (40 at compact density), with a light active row and the chosen row's check at the
  end, in Combobox, MultiSelect, Select and Listbox. A screen that fitted a list to 36px rows shows fewer rows.
- **MultiSelect's clear and open are 44px buttons,** so its chips wrap 16px sooner.
- **The stylesheet no longer has utilities nothing in Kozmos uses** (`container`, `hidden`, `pl-8`, `rounded-lg`
  and the rest the React changelog lists). A product class that relied on Kozmos's stylesheet for one needs its own.
- **Code that switches exhaustively over `KozmosIconKey`** now sees 29 more names; an app that looks an icon up by
  name brings in 19.9 KB gzip of icons where it brought in 11.8.
- **`ToastClose` is named "Dismiss notification"** when the caller passes no `aria-label`.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry: both native
CHANGELOGs cut `## 0.13.0 — repository snapshot` here. Since 0.12.2:

- **API, on SwiftUI:** right to left, a tooltip's `.left` and `.right` are now the view's own left and right, and
  the new `.leading` and `.trailing` follow the reading direction (#368), so a `switch` over `KozmosTooltipSide`
  with no `default` needs the two new cases. On Compose: `KozmosText(style =)` (#339), `KozmosSelectTrigger` (#341),
  `KozmosAnalyticsProvider` (#343) and a tooltip on its trigger's leading or trailing side (#367).
- **On both:** the product's words for Pagination (#342), SplitButton's menu half (#346), POICard's and
  WayfindingCard's close buttons (#345), the toast's close (#350) and FileUpload, which also tells the product when
  a file is removed (#357, GAP-185); `KozmosIcon` draws `layers-three-01` and `walking` (#360, GAP-181); an alert's
  variant reaches its icon, title and description (#330); accordion triggers say whether their panel is open
  (#318); muted text and icons are foreground/400 (#393).
- **The pickers:** SwiftUI's are Kozmos fields around the system pickers (#353), and Compose's open Material 3's
  pickers in Kozmos fields (#351), writing dates and times in the locale's style on the device's clock (#347,
  GAP-183); the date and time pickers' icons say nothing (#316, #319).
- **On iOS:** twelve parts take a tap across what they draw (#392); right to left, five parts (#356), the route
  track (#348), a tooltip (#371) and the AI search button's ring (#363) draw as React does; six parts draw a
  `KozmosIcon` in their own colour (#340); the empty state (#362), the save-location pencil's 44pt target (#388),
  a selected navigation item (#344) and bottom-navigation tile (#355) in the person's language; MultiSelect and
  Combobox stay closed when they start unusable (#402).
- **On Compose:** 44dp targets for Pagination, list rows and MultiSelect, and an inert MultiSelect or colour
  picker changes nothing (#396); an icon-only toggle button can be named (#320); the empty state's and route
  option's icon colours (#354, #358); a side tooltip's tip right to left (#365).

Figma (the importer's list rows, #385, which Olcay ran Update for on 23 Oct), external Claude Design artifacts and
product deployments are separate.

### 0.14.0

Published on 2026-11-01 from `5df3af1ff96e4670571564b067e33d68ac1696d5`, the version merge
[#452](https://github.com/vodoco/kozmos-design-system/pull/452). React 0.14.0 alone moves; icons 0.7.0, tokens 0.8.1
and product-contracts 0.9.1 are unchanged and not planned. It carries MAP-64's tour family (decision 116): `TourStep`
(GAP-188, #422, #444), Backdrop's cut-out (GAP-189, #408), `PopoverAnchor` (GAP-190, #410), Stepper's dots (GAP-191,
#409) and options under their groups (GAP-192, #411). A fixed Backdrop is drawn in the theme's portal, with
`placement` (#419), and the design config's reduced motion reaches that portal (#418). Live parts keep speaking under
an open Select or Menu (GAP-193, #420), a card with no header pays its top (GAP-194, #421, React's half), a composed
tree's rows are treeitems (GAP-204, #435), Accordion opens over its content's height (#423), Calendar renders on the
server under React 18 without a warning (#412), and seven defects the website found are fixed (#416). A trim pass
took 1.38 KB off the whole library (#428). The published `style.css` is 31,604 bytes gzip, up from 0.13.0's 30,539
(`gzip -9`). On this commit CI's analyzer reads Everything at 93.15 of 100 KB and the stylesheet at 31.27 of 32 KB.

Olcay approved this release in advance, for 0.14.0 only, and on 1 Nov said "publish 0.14.0 if everything's green".
Claude dispatched the release after the pre-flight passed and approved the protected `npm-release` deployment, as
`vodoco`, for this release only, as for 0.12.2 and 0.13.0.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Versions                | React 0.14.0 alone on npm `latest`. It pins tokens 0.8.1, icons 0.7.0 and product-contracts 0.9.1 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Exact main-push CI      | [41345138914](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138914), 17 jobs. **Attempt 1 failed in iOS Build,** on `KozmosPOIDetailIconFallbackTests.testAFailedAssetFallsBackToTheIconName` and `testAFailedAssetFallsBackToTheSystemImage`. The commit changes no iOS code, and iOS is not published to npm. One re-run of the failed job, attempt 2, passed: all 17 jobs, 710 iOS tests with 0 failures, those two passing by name. The test's own fix goes in a separate pull request. [Bundle Size Analysis](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138867), [Visual Regression](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138875), [Lighthouse CI](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138866) and [Site](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138918) succeeded on the merge. |
| Preflight / publication | `pnpm release:preflight` against attempt 2 of that run passed on 1 Nov (credential placement, request, evidence and plan; 0.14.0 not on npm). [41353096069](https://github.com/vodoco/kozmos-design-system/actions/runs/41353096069) succeeded (guard, prepare, publish).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Registry readback       | 0.14.0 is on `latest` with SLSA v1 provenance (Sigstore log index 3636247261, publish attestation 3636266989). Its SHA-512 integrity, `sha512-WbzQVP2EeOXicJd…kRX6fJHi8MWRQ==`, equals the one the publish job printed, and the job verified the approved tarball in the registry. Unpacked 1,847,032 bytes in 177 files (0.13.0: 1,759,813 in 170).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Installed consumer      | A fresh npm installation of React 0.14.0, lifecycle scripts off, with React 18.3.1 and with React 19.3.1. Each resolved tokens 0.8.1, icons 0.7.0 and contracts 0.9.1 and exposed 274 exports from CJS and from the ESM entry (0.13.0: 272), with `TourStep`, `PopoverAnchor`, `Backdrop`, `Stepper`, `Combobox`, `TreeParentItemRow` and `TreeChildItemRow` present in both. Server rendering passed for Stepper's dots, Card, TourStep, Backdrop and a tree row, which reads `role="treeitem"`.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/react@0.14.0` at `5df3af1f` with 111 lines of notes, `git ls-remote` and `gh release list` read it back, and a second dry-run found it in place. React 0.14.0 is Latest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Website / Storybook     | [Pages 41345138951](https://github.com/vodoco/kozmos-design-system/actions/runs/41345138951) built and deployed this exact SHA. The live Storybook's `index.json` has 647 entries, 12 of them Core/Overlays/TourStep; its iframe and the site's `components/tour-step/` page answer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Code Connect            | Not republished: no `.figma.tsx`, `.figma.swift`, `.figma.kt` or linked config changed since the last publish, from `422cfd91`. Parse gives the same 218 React documents with no errors, and a dry run is valid. TourStep has no Code Connect yet: Olcay ruled on 1 Nov that it waits for the native TourStep, since the parity check needs every node on all three platforms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Change details: [React](../packages/react/CHANGELOG.md#0140) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.13.0:

- **A fixed `Backdrop` moves to the theme's portal.** The element and its children (a step card) are in the provider's
  portal root, not in the markup they are rendered in: a product that queried them there finds them in the portal,
  and the element carries the provider's `data-kozmos-density`. Its class, id, attributes and ref are unchanged, it
  adds no wrapper, and React still carries its children's events up the tree it is rendered in.
  - **It is no longer in the server's HTML:** it is drawn a render or two after hydration, once the provider's portal
    exists. An inline one renders on the server as before.
  - **It stacks with the popovers:** whichever opened last is on top, so a Backdrop opened while a Popover, Menu or
    Tooltip is open dims it, and one opened after sits above it. It was under every popover.
  - **Inside a Dialog, Drawer or BottomSheet** it is drawn in the modal's content, as it was drawn in place before.
  - **A product that dimmed a region with `className="absolute"` passes `placement="inline"` now.** A fixed backdrop
    given a positioning class warns once in development and says so.
- **`MapView` is its own stacking context.** A fixed element rendered inside the map that does not portal, a fixed
  `FloatingActionButton`, a `DynamicIsland` or a product's own, now stacks inside the map, under a sticky header and
  the shell's chrome: render it outside the map, or portal it out.
- **`CardContent` or `CardFooter` as a card's first child pays the top:** 24, or 16 with `padding="compact"`. A spacer
  or top margin inside the part now gives that room twice, so remove it. A top padding passed to the part (`pt-6`,
  `p-6`) replaces the new one rather than adding to it, and can go too. A spacer element before the part keeps it from
  being first, so nothing changes until it is removed. A header-led card, and a part inside a wrapper such as a
  `form`, draw as before.
- **Accordion now moves.** It opens and closes over its content's height in 280ms, where it snapped, and its chevron
  turns on the same tokens, where it took 200ms. Both snap under reduced motion, the browser's or the design config's.
- **Live parts say their liveness:** every Kozmos part with a live role also carries `aria-live`. A caller's own
  still wins, and `live="off"` sets none. While a Select or a modal Menu is open, the page stays in reach only where
  Radix keeps it visible: boxes marked `aria-live` that were there as it opened. So a product's own region with a live
  role and no `aria-live` is hidden and out of reach then.
- **A modal `Menu` makes the page inert while it is open,** as Select does; `modal={false}` makes nothing inert.
  `Menu` and `Popover` are now Kozmos's own roots around Radix's, with the same props.
- **`PopoverContent` gives focus back** when it closes with focus lost (Escape, or a button in it): to what had focus
  as it opened, else to the anchor's element. A press outside leaves focus where it landed, as before, and
  `onCloseAutoFocus` with `event.preventDefault()` takes it over.
- **A press in Combobox's or MultiSelect's list that misses a row** (a group's label, the list's padding, the gap
  between rows) leaves the list open and focus in the field, where it closed the list and dropped focus to the page.
- **`TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` are treeitems,** with `aria-level`, `aria-expanded`,
  `aria-selected` and `aria-disabled` from the props they already take. A caller's own `role` or `aria-*` still wins,
  and with another role the row adds no tree state. Compose a tree in a `Tree` with children, an expanded parent's
  children in a `<div role="group">` right after its row. A tree from `data` gains `aria-level` alone.
- **What the website found,** with the props unchanged (the React changelog has each one):
  - a Button drawn on a link, and Pagination's links, lose the browser's underline;
  - Listbox's long options end in an ellipsis in a list that no longer scrolls sideways, with no `title`;
  - BottomNavigation's bar is 72 tall at the default density, where it was 64, and pads its bottom by
    `env(safe-area-inset-bottom)`;
  - SplitButton's outline keeps its edge, and the seam tints its inline-end side alone;
  - Tooltip's tip and PopoverArrow overlap the body by 1px, and the tooltip sits where it did;
  - a muted `Text` on glass reads the foreground on glass, as Kozmos's own muted text does.
- **Reduced motion:** the design config's reaches the theme's portal, so a Spinner or Skeleton in a Popover, Dialog or
  Menu stops too, and it carries down to a nested provider. `useDesignConfig()` still returns its own config.
- **Build output:** the JavaScript writes `?.` as the source does, where it wrote each chain out. The syntax is no
  newer than before, as the build already wrote `??`, and an app that targets a browser older than Chrome 91 rewrites
  the chains itself. `surfaceClass` and `SURFACE_CLASSES` have a module of their own, with the same exports.

Nothing else needs changing. No export or prop was removed, and tokens, icons and product-contracts did not move.
`TourStep`, `PopoverAnchor`, `target`, `placement`, `variant="dots"` and `group` are optional additions: a Stepper
with no `variant` is the numbered one, a list with no groups draws as before, and a Backdrop with no target dims the
whole page.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry. This version cut no
native snapshot, so both CHANGELOGs keep them under `Unreleased — repository source`. Since 0.13.0:

- **On iOS:** the floor switcher's tile (#415) and a part said in another language (#417) are one element to XCUITest,
  as they are to VoiceOver. A product's UI tests find a tagged part by its whole label or its identifier now; the
  CHANGELOG has the migration.
- **On both:** Stepper's Code Connect maps Numbered at Count 2 to 8 and shows no snippet for Dots (#409), and
  MapStatusPill's docs draw the walking figure with `KozmosIcon` (#413).
- **Not on either yet:** TourStep, Backdrop's cut-out, `PopoverAnchor`, Stepper's dots and option groups (decision
  116). SwiftUI's and Compose's half of GAP-194 is open in #437, and SwiftUI's muted text on glass (GAP-203) in #436.

Figma is not finished: TourStep's set is on the live file (node 2307:10045), and its painter fix (#450) is on `main`,
awaiting Olcay's Update. External Claude Design artifacts and product deployments are separate.

### 0.15.0

Published on 2026-11-04 from `08e9216c7f5440b45c1c3b9d0692b26113b05bb8`, the version merge
[#469](https://github.com/vodoco/kozmos-design-system/pull/469). React 0.15.0, icons 0.8.0 and product-contracts 0.10.0 move; tokens 0.8.1 is unchanged and not
planned. It carries the APIs of decision 119, less Stepper's objects (decision 149): Accordion's boxed form
(GAP-209, #457), CardTitle's `as` (GAP-205, #438), IconButton's `counter`, CardHeader's `actions` and Input's `action`
(GAP-197, GAP-169, GAP-154, #434), host actions on results and the details card (GAP-028, GAP-130, #430), Navbar's
`navigationAlign` and `logoInset`, Sidebar's `inset`, Drawer's inline `placement` and Tree's `divided` (GAP-196,
GAP-208, GAP-199, GAP-198, GAP-201, #433), Link's `external` (GAP-202, #441), Progress's ring (decision 131, #439),
`toast()` and `<Toaster>` (GAP-167, #426), the venue icon names (GAP-105, #460), AdaptiveMapShell's status and top
corners (GAP-123, #431), and `BuildingPresentation` and `SitePresentation` (GAP-175, #429). Production builds carry no
component names, so an app's bundler leaves out every part it does not use (#447); the stylesheet lost 0.66 KB before
what the release adds (#456); Notice draws each tone's own mark (#459); and TourStep's Close leaves the flow (#458).
The published `style.css` is 32,085 bytes gzip, up from 0.14.0's 31,604 (`gzip -9`). On this commit CI's analyzer
reads Everything at 95.74 of 100 KB and the stylesheet at 31.70 of 32 KB.

Olcay approved this release in advance, for 0.15.0 only, on 1 Nov. Claude dispatched the release after the pre-flight
passed and approved the protected `npm-release` deployment, as `vodoco`, for this release only, as for 0.12.2, 0.13.0
and 0.14.0.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.15.0, icons 0.8.0 and product-contracts 0.10.0 on npm `latest`. React pins tokens 0.8.1, icons 0.8.0 and product-contracts 0.10.0 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Exact main-push CI      | [41852084260](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084260), all 17 jobs passing on attempt 1. [Bundle Size Analysis](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084227), [Visual Regression](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084419), [Lighthouse CI](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084164) and [Site](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084187) succeeded on the merge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Preflight / publication | `pnpm release:preflight` against attempt 1 of that run passed on 4 Nov at 16:18 (credential placement, request, evidence and plan; none of the three on npm), once GitHub's job API, about two minutes behind the run, read every job complete: the first attempt refused a job it still read as running. [41865970503](https://github.com/vodoco/kozmos-design-system/actions/runs/41865970503) succeeded (guard, prepare, publish), and its publish job verified the approved tarballs in the registry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Registry readback       | All three are on `latest` with SLSA v1 provenance naming `08e9216c`, `.github/workflows/release.yml` and `refs/heads/main`, run 41865970503. Each SHA-512 integrity equals the one the publish job printed: React `sha512-5tPBhdKbYaq6C…+lwtexuN6q6lw==` (provenance on Sigstore log index 3691295224, publish attestation 3691297338), icons `sha512-SKJUi/wODhjF+…KURssdrFsUmIQ==` (3691285972, 3691288430) and product-contracts `sha512-IMsjdQ9otMJL7…PwP1uJvZ59Fpw==` (3691288737, 3691294618). React unpacks 1,971,839 bytes in 180 files (0.14.0: 1,847,032 in 177), icons 4,851,605 in 10 (0.7.0: 4,802,893 in 10) and product-contracts 82,949 in 8 (0.9.1: 68,749 in 8).                                                                                                                                                                                                                                                                                                                |
| Installed consumer      | A fresh npm installation of React 0.15.0 with React 19.3.1 and with React 18.3.1. Each resolved tokens 0.8.1, icons 0.8.0 and contracts 0.10.0 and exposed 276 exports from CJS and from the ESM entry (0.14.0: 274; `toast` and `Toaster` are new, and none went). Server rendering under ThemeProvider drew the boxed Accordion, CardTitle as an `h2` and as an `h3` without `as`, an external Link with `target="_blank"`, `noopener` and "opens in a new tab", a circular Progress, and an info Notice whose mark is not warning's; all 15 venue names resolve through `getIconComponent`. With `NODE_ENV=production`, Button has no `displayName`. The same probe against 0.14.0 fails every check (274 exports, `Button` named in production, none of the 15 venue names).                                                                                                                                                                                                                  |
| Tags / GitHub releases  | `release:tag` dry-run passed (it would create the three tags at `08e9216c`, with 138, 19 and 25 lines of notes), it created `@kozmos-ds/react@0.15.0`, `@kozmos-ds/icons@0.8.0` and `@kozmos-ds/product-contracts@0.10.0` at `08e9216c`, `git ls-remote` and `gh release list` read them back, and a second dry-run found all three in place. React 0.15.0 is Latest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Website / Storybook     | [Pages 41852084474](https://github.com/vodoco/kozmos-design-system/actions/runs/41852084474) built and deployed this exact SHA. The live site was read on 4 Nov from the next deploy, [41893532341](https://github.com/vodoco/kozmos-design-system/actions/runs/41893532341) at `1f477743`, which changes no story, docs page or component source, only the Figma importer, its manifest, Toast's Code Connect files and two checks. Storybook's `index.json` has 675 entries (0.14.0: 647), among them Accordion's Boxed, Boxed Loading and Boxed States, Progress's Circular, Circular Sizes and Circular Complete, Link's External, Navbar's Navigation Align and Logo Inset, Toast's From A Call and Tones, and AdaptiveMapShell's Status And Top Corners and Exit Building. The Boxed and Circular iframes and the site's `components/accordion/` and `components/progress/` pages answer.                                                                                                   |
| Code Connect            | Published on 5 Nov from main `d869d950`, after the release's own mappings (Link's External, #443) and those that merged after it: Toast's Tone (#445), Accordion's boxed form (#464), Progress's ring (#465), IconButton's counter, CardHeader's actions and Input's action (#466), and Navbar's alignment and logo inset, Sidebar's inset, Drawer's placement and Tree's rows (#467). The dry runs were valid: 229 React documents, and 433 SwiftUI and Compose documents together. `figma:publish:linked` and `figma:publish:native:linked` uploaded React, SwiftUI and Compose. Read back through Figma's MCP server: Toast's tone variants on React, Progress's circular variants with shape, size and tone and Accordion's boxed variants with label, disabled and loading on Compose, and Navbar's `logoInset` on Compose, with no `navigationAlign` there, which is web only until 0.16.0. The full Dev Mode readback (`figma:connect:readback`) needs Figma desktop open and was not run. |

Change details: [React](../packages/react/CHANGELOG.md#0150), [icons](../packages/icons/CHANGELOG.md#080),
[product-contracts](../packages/product-contracts/CHANGELOG.md#0100) and the
[generated AI changelog](../.ai-skills/api-changelog.md). Upgrading from 0.14.0:

- **Production builds carry no component names.** Each part's `displayName` is set only when `process.env.NODE_ENV`
  is not `"production"`, so React DevTools shows `ForwardRef` or `Anonymous` in a production build. Your bundler, or
  the ESM CDN that serves the package, must replace `process.env.NODE_ENV`, as React itself needs: a page that loads
  the files in `dist` unbundled, with nothing to replace it, now throws `process is not defined` when it imports them.
  In 0.14.0 it threw later, when a `Backdrop` first rendered or a part reported an event with no `AnalyticsProvider`.
- **55 utilities nothing in Kozmos uses left the stylesheet.** A class a product passes through `className` applies
  only if Kozmos's stylesheet has it: `h-control`, `animate-spin`, `border-none` and the others the CHANGELOG lists now
  need the product's own Tailwind or CSS. Values are written without inner spaces (`calc(a*b)`), which only a tool
  reading `style.css` as text sees.
- **Drawer mirrors right to left.** Its close, the room `DrawerHeader` leaves for it, and the header's words are on
  logical sides. Left to right nothing moves.
- **CardTitle's ref is typed `HTMLHeadingElement`;** it was `HTMLParagraphElement`. A ref of either type still fits. A
  screen reader now hears its level; the title looks as it did.
- **Notice draws each tone's own mark:** `info` an info circle and `critical` an alert circle, where every tone drew
  the warning triangle. A caller's `icon` still wins.
- **TourStep's Close leaves the flow.** With the same lines a step is 32 shorter at touch density and 20 at compact, a
  coachmark 56 and 44, and the welcome card 4; a title beside Close may take one more line.
  `.kozmos-tour-step-header` holds the title too and renders on every card.
- **Progress past its `max` is full,** and `aria-valuenow` says `max`. On the web a bar drew empty and Radix logged an
  error.
- **Toasts follow the reading direction.** `ToastViewport` is at `sm:end-0` (the same left to right), and
  `ToastProvider` takes its swipe direction from the ThemeProvider's `dir` when it isn't told.
- **Icons:** `KozmosIconDefinition` gains `KozmosOwnedIconDefinition`, `source: "owned"`, for `utensils` and
  `accessibility`, which have no `figmaNodeId`: narrow on `source` before reading it. A lookup by name costs 23.44 KB
  gzip, up from 19.84; a named import costs what it did.
- **`inputVariants` and `InputStatus`** move to a module of their own and are exported as before.

Nothing else needs changing. No export or prop was removed, and every new prop is optional: a product that sets none
of them draws as before, apart from the changes above.

SwiftUI and Compose changes ship from the repository at this commit, not a native registry. This version cut no
native snapshot, so both CHANGELOGs keep them under `Unreleased — repository source`. Since 0.14.0:

- **On both:** Accordion's boxed form (#457), Link's `external` (#441), the circular Progress (#439), Navbar's
  `logoInset` (#433), the venue names (#460), host actions on results and the details panel (#430), the building and
  site presentations (#429), card titles as headings (#438), and a card's first part paying the top (GAP-194, #437).
  On Compose the card's, list's and group's `onHostAction` sits before `onAction`, with an overload that keeps
  0.14.0's positional calls.
- **On iOS:** a product's muted text on glass reads at 4.5:1 (GAP-203, #436).
- **Not on either yet:** `toast()` and its tones, AdaptiveMapShell's status and top corners, and the props decision
  134 leaves to 0.16.0 (IconButton's `counter`, CardHeader's `actions`, Input's `action`, Navbar's `navigationAlign`,
  Sidebar's `inset`, Drawer's inline `placement` and Tree's `divided`).

Figma is not finished: the importer at this commit draws 0.15.0's sets, and #470, after it, draws the parity rulings of
4 Nov (decisions 156 to 158). The live library takes them at Olcay's next Import Foundations and Update. External
Claude Design artifacts and product deployments are separate.

### 0.15.1

Published on 2026-11-06 from `4cc3d04119e9f6fe5494417d0bec14cc6de8f7b6`, the version merge
[#483](https://github.com/vodoco/kozmos-design-system/pull/483). React 0.15.1 and icons 0.9.0 move, and
`@kozmos-ds/styles` is published for the first time, at 0.15.1, with React; tokens 0.8.1 and product-contracts 0.10.0
are unchanged and not planned. It is a patch release (decision 161): about 39 of the register's items are promised for
0.16.0, and this release carries none of them. It carries the web packages of Vue 3 Phase 0 (GAP-148): the shared
stylesheet as a package of its own, which React takes its `style.css` and `reset.css` from and pins exactly
(GAP-149, #474, a patch since #481); `@kozmos-ds/icons/vue`, every icon as a Vue 3 component (#475); and Button's
recipe in a module of its own inside React, `recipes`, which `@kozmos-ds/vue` builds its Button from (#478). React's
exports, its HTML and its stylesheet are 0.15.0's: the published `style.css` is 0.15.0's byte for byte, 232,421
bytes and 32,085 gzip (`gzip -9`).

Olcay gave Claude this release to run end to end on 5 Nov ("Yes, run it end to end"), for 0.15.1 only: merge the
version PR, wait for main CI, run the pre-flight, dispatch, approve the protected `npm-release` deployment, and verify
the registry, provenance, a clean install and the tags, stopping to ask at any step that was not clean. Claude merged
#483, dispatched the release and approved the deployment, as `vodoco`, under that authority. It was not standing, and
it is spent.

A flaky test changed the order of the merges. On 5 Nov main CI on `7930b86f` (#479) failed once, on one test alone:
Calendar's "moves by day, week, the week's ends, month and year from the keyboard" took 5,567 ms against its 5,000 ms
limit (2,573 ms on `a06cb073`'s run). #479 changes no React code, and a re-run of the failed job passed. At 23:10 the
same test timed out on #483's own CI (5,249 ms). So #485, which splits the test in four, merged first, at 00:06 on
6 Nov as `b8222809`: it changes a test only and ships nothing, so 0.15.1's contents stayed as reviewed, and it took
the flake out of the version merge's main CI, which the pre-flight needs green. Main CI on `b8222809` passed, #483 was
brought up to date with it (head `d7a16613`, its diff against main unchanged), and it merged at 07:46 as `4cc3d041`.
Times are UTC.

| Evidence                | Verified result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions                | React 0.15.1, `@kozmos-ds/styles` 0.15.1 and icons 0.9.0 on npm `latest`. React pins icons 0.9.0, styles 0.15.1, tokens 0.8.1 and product-contracts 0.10.0 exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Exact main-push CI      | [42183089882](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089882), all 17 jobs passing on attempt 1, done at 08:51. [Bundle Size Analysis](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089781), [Visual Regression](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089806), [Lighthouse CI](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089795) and [Site](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089801) succeeded on the merge.                                                                                                                                                                                                                                                                                                                                                 |
| Preflight / publication | `pnpm release:preflight` against attempt 1 of that run passed on 6 Nov (credential placement, request, evidence and plan; none of the three on npm). [42190882501](https://github.com/vodoco/kozmos-design-system/actions/runs/42190882501), dispatched at 08:53, succeeded: guard and prepare approved the candidate (React 0.15.1, styles 0.15.1 and icons 0.9.0 to `latest`), the `npm-release` deployment was approved at 08:56, and publish finished at 09:02. The publisher put dependencies first: icons 0.9.0 at 08:58:59, styles 0.15.1 at 09:01:02 and React 0.15.1 at 09:02:31, each with its provenance on Sigstore (log index 3713529173, 3713573873 and 3713601760), and it verified the approved tarballs in the registry.                                                                                                                                                    |
| Registry readback       | All three are on `latest`: 0.15.1, 0.15.1 and 0.9.0. Each package's attestations answer 200, with a publish attestation (v0.1) and SLSA v1 provenance that name this repository and the package's directory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Installed consumer      | A fresh npm installation of React 0.15.1 with React 19.3.1 and with React 18.3.1 exposed 276 exports from CJS and from the ESM entry, with the same names as 0.15.0. Against a clean installation of 0.15.0, 38 server renders (Button in every variant, size and emotion, `isLoading`, disabled, `buttonVariants`, and a composed Pagination) are identical, and React's `style.css` and `reset.css` are 0.15.0's and `@kozmos-ds/styles`' own, byte for byte. With `NODE_ENV=production`, Button has no `displayName`. `@kozmos-ds/styles` alone installs only itself. `@kozmos-ds/icons/vue`, with Vue 3.5.45 and no React, exposes 1,212 exports and renders on the server an `<svg>` that takes its size, colour, stroke, class and `aria-*`. The first probe passed `loading`, which is not a Button prop, and React warned; it was corrected to `isLoading`, and the rerun was clean. |
| Tags / GitHub releases  | `release:tag` dry-run passed, it created `@kozmos-ds/styles@0.15.1`, `@kozmos-ds/icons@0.9.0` and `@kozmos-ds/react@0.15.1` at `4cc3d041`, and a second dry-run found all three in place. `git ls-remote` and `gh release list` read them back on 6 Nov. React 0.15.1 is Latest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Website / Storybook     | [Pages 42183089814](https://github.com/vodoco/kozmos-design-system/actions/runs/42183089814) built and deployed this exact SHA, and is the latest deploy. Read on 6 Nov: the site, its `get-started/` page and Storybook's iframe answer, and Storybook's `index.json` has 675 entries, as for 0.15.0; the release changes no story.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Code Connect            | Not republished: no `.figma.tsx`, `.figma.swift`, `.figma.kt`, linked config or native source changed since the last publish, from `d869d950` on 5 Nov. The Dev Mode readback (`figma:connect:readback`) run on 5 Nov read nothing back: every one of the 299 nodes asked (each asked twice) failed to parse, as Figma now answers with a JSON value followed by more text. Its fix is #482, reviewed and on the merge train.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

npm holds two things the plan did not name. **`@kozmos-ds/styles` also carries `0.0.0-stage`,** published at
08:59:24 under the `vodoco` npm user, the moment the publish job began publishing styles, a new name: 2 files, 339
bytes, no provenance, and npm's own description, "Temporary package placeholder for staged publishing". 0.15.1 itself
is dated 09:01:02, after npm printed "Your package is being processed and may take a few minutes to become
available". The job ran a plain `npm publish` with the planned tarballs, and its log shows nothing else. npm's
documentation of staged publishing says that staging a package that does not exist yet publishes a `0.0.0-stage`
placeholder; it does not say why a direct publish of a new name made one, or what becomes of it. `latest` is 0.15.1,
and no range matches a prerelease. It is expected for the next new name, `@kozmos-ds/vue`. Olcay chose on 6 Nov to
deprecate it, with his npm login (`npm deprecate @kozmos-ds/styles@0.0.0-stage`), rather than unpublish it. **`next` is
stale on four packages:** on react, icons, tokens and product-contracts it still points at 0.1.0, from the first
release on 23 Sep, so `@kozmos-ds/react@next` installs 0.1.0. Olcay chose on 6 Nov to remove it from all four, with his
npm login (`npm dist-tag rm <package> next`). Decision 162 keeps `next` for separate prerelease dispatches, such as `@kozmos-ds/vue`'s.

Change details: [React](../packages/react/CHANGELOG.md#0151), [styles](../packages/styles/CHANGELOG.md#0151),
[icons](../packages/icons/CHANGELOG.md#090) and the [generated AI changelog](../.ai-skills/api-changelog.md).
Upgrading from 0.15.0:

- **Nothing needs changing.** React exports the same 276 names and renders the same HTML, and
  `@kozmos-ds/react/style.css`, `@kozmos-ds/react/reset.css` and `@kozmos-ds/react/dist/style.css` resolve as they
  did, to the same bytes.
- **React depends on `@kozmos-ds/styles`,** pinned exactly, so an installation of React adds it. It ships no
  JavaScript and depends on nothing. A web app without React can install it alone and import
  `@kozmos-ds/styles/style.css` and `@kozmos-ds/styles/reset.css`.
- **React's published files gain `dist/esm/recipes/`,** which Button's, SpinnerArc's and Pagination's modules import.
- **Icons 0.9.0 adds `@kozmos-ds/icons/vue`,** for Vue 3.5 or later, an optional peer. The main entry and its
  declarations are 0.8.0's byte for byte. React is an optional peer of icons now, so a Vue app installs no React.

SwiftUI and Compose: nothing changed since 0.15.0 but the Code Connect files published on 5 Nov (#445, #464 to #467).
Figma is unchanged by this release. Olcay keeps Pointr's Claude Design artifact as it is until 0.16.0 (5 Nov), so no
0.15.1 kit is built.
