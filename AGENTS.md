# AGENTS.md

Kozmos is the design system for Pointr's indoor mapping products: one set of tokens and parts,
built for React on the web, SwiftUI on iOS and Jetpack Compose on Android, and checked against the
Figma library they come from. This file is what a coding agent needs before changing anything here.

## What ships

- **npm**, under `@kozmos-ds`: `react` (the components and their stylesheet), `tokens` (CSS, TS,
  Swift and Kotlin), `icons`, and `product-contracts` (the shapes a product passes the Product /
  SDK components). These four are the only public packages; `@kozmos-ds/vue` is private.
- **SwiftUI** in `packages/ios` (library `Kozmos`) and **Compose** in `packages/android`
  (`com.kozmos`), used from a checkout: neither is published to a package registry yet.
- **The website**, built from `apps/site`, publishes from `main` to
  <https://vodoco.github.io/kozmos-design-system/>, and Storybook, built from `apps/docs`, with it
  at <https://vodoco.github.io/kozmos-design-system/storybook/>. Storybook is the component
  reference — each component's docs, stories, controls and code on every platform; the site is
  the front door and says where each component exists.

## Where things are

| Path                                              | What                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/{react,tokens,icons,product-contracts}` | the npm packages; tokens start in `packages/tokens/src`           |
| `packages/ios`, `packages/android`                | SwiftUI and Compose                                               |
| `packages/vue`                                    | a private harness that mounts the React components in Vue         |
| `apps/docs`                                       | Storybook: stories, docs pages, and `stories/examples/`           |
| `apps/site`                                       | the website; its `GAPS.md` lists what Kozmos cannot do yet        |
| `apps/` (the rest)                                | playgrounds, the Pointr QA app and a product prototype            |
| `figma/foundations-importer`                      | the Figma plugin that paints the Core Library                     |
| `scripts/`                                        | the checks (tokens, parity, Figma, releases), run by name         |
| `tests/visual`                                    | the visual review's suite and its committed baselines             |
| `docs/`                                           | the written documentation                                         |
| `docs/claude-design/`                             | what the Claude Design artifact carries, generated (below)        |
| `.ai-skills/`                                     | the knowledge base for AI assistants, kept true by `skills:check` |
| `.changeset/`, `release/`                         | changes waiting for a release, and the plan a release publishes   |

## Commands

Node 20 or later, and pnpm 9.

```bash
pnpm install --frozen-lockfile
pnpm build                                     # every package and app, through Turborepo
pnpm --filter "@kozmos-ds/react..." build      # React and what it needs; a fresh worktree has nothing built
pnpm test
pnpm lint --filter='!mapscale-review'          # as CI runs it
pnpm typecheck
pnpm --filter @kozmos-ds/docs storybook:react  # Storybook on port 6006
```

`pnpm ci:local` runs the steps of CI's web job here (`--list` shows what it skips, `--job ios`
runs another job). The checks under `scripts/` run by their `package.json` names —
`pnpm components:contract:check`, `pnpm tokens:theme:check`, `pnpm skills:check` and the rest —
and `pnpm native:check` compiles Swift and Kotlin.

Workspace packages resolve to each other's `dist`: rebuild a package after changing it, before
testing what uses it, and restart Storybook after a rebuild.

## Rules every change follows

- **Merging** needs all 19 required checks green, on a branch that is up to date with `main`.
  Changes reach `main` through a pull request.
- **A changeset** for a pull request that changes what a published package ships: its `src/`
  apart from tests, stories, docs pages and Code Connect files, its build files, and the
  consumer-facing fields of its `package.json`. Run `pnpm changeset`, or `pnpm changeset --empty`
  when nothing needs releasing. CI runs `node scripts/release/changeset-required.mjs`; run it too.
- **Visual Review baselines** are drawn only by the Playwright image's amd64 build, through
  Docker: build Storybook, then `pnpm test:visual:update --grep <story>`, or use the Visual
  Regression workflow's record run. Never record on a bare Mac: it draws text differently.
  [`docs/visual-review.md`](docs/visual-review.md) has the steps.
- **Native tests are proven by name.** A green run can have run nothing: `swift test` on macOS
  compiles the iOS-only tests out, and `-only-testing` with a wrong class passes. On iOS,
  `node scripts/check-ios-poi.mjs` runs the whole target on the pinned simulator; read the names
  back with `xcrun xcresulttool get test-results tests --path <results>/TestResults.xcresult`,
  where `<results>` is the folder it prints. On Android, read the JUnit XML under
  `packages/android/build/test-results/`.
- **Stage by file.** Other sessions share the checkout: `git add <path>`, never `git add -A`, `.`
  or a directory, and never a bare `git stash`.
- **A new check must be seen to fail** against the unfixed code, and a green result must name
  what you added.
- **The pre-commit hook** runs Prettier over staged `.md`, `.json` and `.yml` files, ESLint and
  Prettier over staged `.ts`, `.tsx`, `.js` and `.jsx`, and restamps the Figma plugin's build id
  when `figma/foundations-importer/code.js` changes. Commit what it writes.

## Where not to put things

- **No session notes in the repository.** Handoffs, dated reports and agent logs go in the
  git-ignored `.notes/` folder, not in `docs/` or anywhere tracked.
- **Generated files are regenerated, never edited:** `docs/status.md`, the data blocks of
  `docs/component-variant-gap-analysis.md`, `.ai-skills/component-inventory.md`,
  everything in `docs/claude-design/` (`pnpm skills:build`, after building React),
  `docs/figma-*.json`, and the native token copies in `packages/ios` and `packages/android`
  (`pnpm tokens:build`, then `pnpm tokens:native:copy`).
- **Examples use only Kozmos:** what `@kozmos-ds/react` exports, its tokens and its roles. A part
  Kozmos cannot express is recorded as a gap, never worked around. `apps/docs` has no Tailwind
  build of its own, so a story can use only the classes `packages/react` already emits.
- **Figma is painted by the plugin**, never by hand. Run Update, never Rebuild: Rebuild makes new
  node ids, and Code Connect pins the old ones.
- **No secrets in the tree.** The Figma scripts read `FIGMA_ACCESS_TOKEN` from `.env` (see
  `.env.example`); npm publishing happens only in `release.yml`.

## Read next

- [`docs/README.md`](docs/README.md): the documentation, one line on when to read each document.
- [`.ai-skills/README.md`](.ai-skills/README.md): the knowledge base for assistants that design
  or build with Kozmos.
- [`docs/claude-design/README.md`](docs/claude-design/README.md): consuming Kozmos, and one API
  card per component — every prop and an example that compiles — for the Kozmos artifact in
  Claude Design (decision 52). `pnpm skills:build` writes it from the built types and the
  stories; `pnpm skills:check` fails when it is stale or an example stops compiling.
- Releases: [`docs/release-process.md`](docs/release-process.md).
