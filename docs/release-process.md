# Controlled npm releases

Status (2026-10-04): in use; React 0.8.1 is published (evidence below).
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
the npm token is supplied only to the final publishing step. Third-party actions
in the release workflow are pinned to commit SHAs. The GitHub token has read-only
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
   `package.json`'s `packageManager` both name a version. CI pins v3, which has
   no such check, so the release workflow's `uses:` steps had never executed
   anywhere. The input is gone and a control holds the manifest as the only
   declaration.
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
