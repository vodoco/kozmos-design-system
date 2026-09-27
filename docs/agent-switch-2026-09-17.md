# Agent switch — the coding agent to ChatGPT Astra, and back

Written 2026-09-17, when Olcay moved Kozmos development from the coding agent to ChatGPT Astra for a
while. It does two jobs. §1 to §5 hand the work **to** Astra. §6 is what Astra leaves before Olcay
switches **back**, and §7 is what the agent does on return.

It is an entry point, not a second copy of the handoff. `docs/ds-handoff.md` holds the depth — the
decisions, the traps, the reasoning — and is the authority on all of it. Every state claim in §2 was
measured on 2026-09-17 by the command beside it, and every check in §5 was run, and passed, in a
fresh worktree of `a02a008` with these documents on top. Measuring for this file found four claims
in `ds-handoff.md` wrong; they were corrected there in the same change (its §10).

## 1 · Paste this to start Astra

The repository has no `AGENTS.md`, so nothing points Astra here unless it is told. Paste this at the
start of every new Astra chat:

> You are continuing development of the Kozmos design system in this repository. Read
> `docs/agent-switch-2026-09-17.md` first, then `docs/ds-handoff.md` in full — §0 to §11. The
> subject is the design system only: the packages under `packages/`, the Figma Core Library and its
> plugin, the checks, and the docs. MAP-595 and `apps/mapscale-review` are parked. The work is the
> loop in `ds-handoff.md` §11: Olcay shares one of the SDK's components, you measure it, rebuild it
> as an example from Kozmos components only, and report anything that cannot be built that way —
> never work around it. Follow the working agreement in §4 of the switch document exactly. Before
> Olcay switches back, leave the reverse handoff that its §6 describes.

## 2 · Where it stands — handed over at `a02a008`

| What                 | State                                                                                                                                                                                                                                                                       | Re-check with                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `main`               | `a02a008`, followed only by this handoff's merge. CI and Release last ran on `e9f5069`: everything after it is documentation, which CI skips on a push. Every run on those commits is green                                                                                 | `git log --oneline a02a008..origin/main`, `gh run list --branch main --limit 12`           |
| Open PRs             | **none**, besides this handoff's own until it merges                                                                                                                                                                                                                        | `gh pr list --state open`                                                                  |
| Branches on `origin` | `main`, and `codex/wayfinding-map-panel` — MAP-595's prototype, parked                                                                                                                                                                                                      | `git branch -r`                                                                            |
| The shared checkout  | on `main` at `a02a008`, clean. The six other worktrees registered to it live under `/private/tmp/claude-501/` and are the agent's. Locally, `codex/wayfinding-map-panel` holds one commit `origin` does not (`0b3acfd`, MAP-595, 2026-09-13). Leave all of them as they are | `git status`, `git worktree list`, `git branch -vv`                                        |
| Packages             | five, all `0.0.1`, never published, no tags; `@kozmos/vue` is private                                                                                                                                                                                                       | `npm view @kozmos/react` (E404), `git tag`                                                 |
| Components           | 98 in `packages/react/src/components`, beside one file, `PlatformSnippets.tsx`. `STATUS.md`: Core 69, Code-only 5, Product / SDK 22, Platform 2 — every lane complete on web, iOS and Android                                                                               | `find packages/react/src/components -mindepth 1 -maxdepth 1 -type d \| wc -l`, `STATUS.md` |
| Tests                | React 353 in 103 files · iOS 57 · Android 25 JVM tests, one of them the Paparazzi snapshot                                                                                                                                                                                  | §5                                                                                         |
| Figma                | Core Library `Yj4O8p6Y9h2Sa9zJVoAiVY`: 95 of 95 sets, variant drift clean; 71 painted by the current plugin build `dd9f78a05cc0`, the 24 Product / SDK sets by `3e597100b157`                                                                                               | `pnpm figma:verify`                                                                        |
| CI                   | green, but `UI Tests` is **always pending** — Chromatic's plan is on its limit, so that is the normal state of a green PR                                                                                                                                                   | `gh pr checks <n>`                                                                         |

**In flight: nothing.** Two SDK components have been rebuilt so far — the POI detail card
(`ds-handoff.md` §11.1) and the map mode toggle (§11.3).

**Next, as Olcay chose:** the next SDK component, which needs Olcay to share one — a Figma file key
and node ids, or a running prototype and which of its controls. If none is ready, `ds-handoff.md`
§6.3 is the queue, in order. It starts with `Link.variant` and `Spinner.size`, the two axes React
has that iOS and Android cannot express.

**Waiting on Olcay, not on the agent.** `ds-handoff.md` §6 has eleven items. Four need Olcay's own
hands or judgement: raising Chromatic's plan (1), the accessibility glyph's Figma library key (5),
running `Update All Product SDK` in the plugin (6), and how Figma should draw `MapControlButton`'s
tinted state (8). Three are decisions best taken before a first publish: `@kozmos/icons` no longer
re-exporting lucide (3), the stylesheet's global reset (9), and the `vite-ui-theme` storage key
(10). The other four are recorded with no deadline: the remaining 38 icons (2), the payment brand
marks (4), what three components' Figma sets leave to the renderers (7), and React's `#000000` ink against native's
`#17191C` (11).

**`NPM_TOKEN` is the publish switch.** `release.yml` runs after every CI run that passes on `main`,
and when no changeset is pending, `changesets/action` publishes every package whose version is not
on npm yet — in its own words, "No changesets found. Attempting to publish any unpublished packages
to npm". So the first such run after a valid token is added publishes `@kozmos/react`, `tokens`,
`icons` and `product-contracts` at `0.0.1`, with no changeset and no version PR. The order that
avoids it is in `ds-handoff.md` §4.5. Adding the token is Olcay's decision; an agent never adds it,
and never runs `npm publish` or `changeset publish`.

## 3 · Read in this order

1. `docs/ds-handoff.md`, all of it. §2 is how Olcay works, §5 the decisions that must not be
   reopened (23 of them), §8 the traps that have cost real time. Its §0 and §8 name the agent's memory
   files, which are not in the repository — §4 below says where they are, and what in them matters
   to anyone else.
2. `docs/style-playbook.md` — how to change how Kozmos looks without the platforms drifting.
3. `docs/README.md` — what every other document is, and which are current, generated or archived.
4. For a component in §11's loop, its gap report: `poi-detail-card-gaps-2026-09-14.md` and
   `map-mode-toggle-gaps-2026-09-15.md` are the shape to follow.

## 4 · The working agreement

These are what made the work reliable. None is an agent preference; each has a failure behind it,
and most are recorded in `ds-handoff.md` §8 and §10.

**Olcay's standing instruction**, repeated most turns:

> "Once more, please analyse extensively to see if anything is overlooked, missed, mis-implemented
> or could have done better. No hacks - no cheats - do it propertly and perfectly. Otherwise please
> proceed with your recommendation. Provide me everything I'd need if I need to make changes myself.
> But remember you have CLI access. I don't want to miss anything"

**Scope and method**

- The design system only. MAP-595 and `apps/mapscale-review` stay parked unless Olcay asks in so
  many words.
- An example uses **only** what `@kozmos/react` exports, its tokens and its roles. What it cannot
  express is reported with the four things `ds-handoff.md` §11 lists, and the work on it stops there
  until Olcay rules. A missing part is never approximated.
- **Measure, never assert.** Put the command beside the number. When a claim turns out wrong,
  correct it plainly wherever it was written.
- **A passing test proves nothing until it has failed.** Run a new test against the unfixed code
  first. For anything visual, render the **built** component and read computed styles:
  `toHaveClass` passes for a class that compiles to nothing, and for one a caller's class has
  overridden — both happened here.
- **Decisions** go to Olcay as short multiple-choice questions with the recommended option first.
  Record each ruling in `ds-handoff.md` §5, numbered on from **24**, so nobody asks it again.
- **Never delete a project directory, a checkout, or a worktree with anything in it, and never offer
  deleting one as tidying.** "Get rid of X" has meant "stop using X" every time, and a checkout holds
  what git does not — `.env`, `local.properties`, unpushed commits. On 2026-08-28 the agent proposed
  deleting a checkout as a next step, Olcay agreed to that wording, and a 4.4 GB clone went to the
  Trash. If deleting something is ever the right answer, say exactly what disappears.
- **Never erase a simulator or an emulator** without asking.

**Git and GitHub**

- The checkout at `/Volumes/4TB Depo/development/K/kozmos-design-system-dev` is **shared** with
  other sessions. Never commit on `main` there, never `git add -A` or a directory, never reset or
  switch a branch another session is using. Build each change in its own `git worktree`.
- **Name branches `astra/<topic>`** from now on. The existing `codex/` names are history; the prefix
  is what lets the reverse handoff tell whose work is whose. The agent will use `claude/<topic>`.
- **Push, edit a PR or merge only on Olcay's go-ahead** ("push the branch"). Commit when asked, or
  as the natural end of a "proceed".
- One PR per change. **Wait for CI before merging**, however complete local verification is (ruling
  23). Delete a merged branch on `origin`.
- **Every push to a PR runs CI's whole matrix, documentation included** — `pull_request` has no
  `paths-ignore`, on purpose, and one job runs on `macos-latest`, which GitHub bills at 10×. Actions
  refused every job on 2026-09-16 and 17 over billing. Push when a change is ready, not per edit.
- **Stacked PRs:** only `ci.yml` runs on a PR whose base is not `main`, and GitHub retargets a
  stacked PR only when its base branch is deleted as that merges. Otherwise retarget it by hand —
  `gh api -X PATCH repos/vodoco/kozmos-design-system-/pulls/<n> -f base=main` — or it merges into
  the old base.
- `gh pr edit --body-file` silently changes nothing on this repository — update a description with
  `gh api -X PATCH repos/vodoco/kozmos-design-system-/pulls/<n> --input <json>` and read it back.
- `gh pr checks` exits 8 while `UI Tests` is pending, which is always. That is not a failure.
- `lint-staged` runs Prettier on what you stage and reflows Markdown tables; match committed docs by
  line content, not by padded table rows.

**Figma**

- The Core Library is **painted by the plugin** in `figma/foundations-importer`, never drawn by hand.
  Only Olcay can run the plugin, inside Figma, and Figma has to be quit (⌘Q) after a plugin change or
  it keeps running the old code. It runs from whichever checkout
  `Plugins › Development › Manage plugins in development` points at, so a change made in a worktree
  reaches Figma only once it is in that checkout.
- In the plugin, **Update, never Rebuild**: Rebuild mints new node ids, and Code Connect pins the
  old ones.
- **Prove which build ran** before believing a run: `pnpm figma:verify` ends with how many sets the
  current build painted, and that count has to move after an Update.
- Plugin code cannot be run outside Figma. Read it as carefully as you would run it — three bugs in
  one painter were caught that way.
- Reach for `pnpm figma:verify` before asking for the plugin's own audit: it reads the file over the
  REST API from the terminal. It does not read component descriptions, and it checks contrast only
  in the colours the file is drawn in, not in dark theme, so for those the plugin's audit stays the
  authority.

**Secrets**

- `.env` holds `FIGMA_ACCESS_TOKEN` (it reads files but is refused where `library_content:read` is
  needed; recorded as expiring **2026-11-24**), used by `pnpm figma:verify` and the REST scripts.
  Never commit it, and never paste it into a chat — this one included.

**What only the agent's memory held**

The agent keeps notes outside the repository, in
`~/.claude/projects/-Volumes-4TB-Depo-development-K-kozmos-design-system-dev/memory/` — no secret is
in them (searched for token patterns on 2026-09-17). `ds-handoff.md` §8 carries what most of them
say, and many of the rest are about the agent's own tools. These matter to anyone and are not in the
handoff — the never-delete rule above was one:

- **A library component's name is not its shape.** In the product's `Kozmos | Core (PDS Core)`
  library, `Dropdowns` is the **open** menu; a closed select is a `Text-Inputs` instance
  (`Icons=fields-icon`) with its nested clear hidden. Core's `Toggle` has no small switch without a
  label either. Render a candidate before mapping an SDK control to it.
- **Painted is not bound, and bound is not themed.** A paint in the right colour may carry no
  variable, and one bound to a single-mode collection never changes with the theme. An "all bound"
  claim needs a script that resolves each binding's collection.
- **Figma keeps an icon's 2px stroke when an instance is resized**; the code draws `2 × size / 24`.
- **A disabled Button in Figma** is the idle variant at 50% layer opacity, unbound: `State=Disabled`
  paints charcoal, and the `Opacity/50` variable binds as 0.5%. This and the stroke are recorded, for
  MAP-595, in `docs/map-595-figma-2026-09-07.md`.
- **Plugin API behaviour**, measured through the agent's Figma connector, which runs Plugin API code in
  the file: `setBoundVariableForPaint` drops the paint's `opacity`; `clone()` of a section's child
  lands on the page; `itemReverseZIndex` throws on a frame without auto-layout. Check them before
  relying on the opposite in `code.js`.

## 5 · The checks

Every line below passed on 2026-09-17 in a fresh worktree of `a02a008` with these documents on top.
Build first: several of them read `dist`. A fresh worktree also needs two gitignored things from the
shared checkout: `packages/android/local.properties` (it holds only `sdk.dir`) for the native
checks, and the Figma token for `tokens:radius:nesting` and `figma:verify` — export
`FIGMA_ACCESS_TOKEN` from the shared checkout's `.env` without printing it; both scripts read the
environment first.

```bash
pnpm install --frozen-lockfile
pnpm turbo run build --filter="./packages/*"
pnpm tokens:elevation:check && pnpm tokens:border:check && pnpm tokens:radius:check \
  && pnpm tokens:typography:check && pnpm tokens:contrast:check && pnpm tokens:raw:check \
  && pnpm figma:plugin:check && pnpm components:contract:check && pnpm figma:stamp:check \
  && pnpm docs:snippets:check && pnpm components:variant:check
pnpm components:classes:check     # ratchet: 62 uses of 40 classes that compile to nothing
pnpm packages:install:check       # packs, installs against React 18 and 19; needs the network
pnpm exec tsx scripts/skills/check-completion.ts --check
pnpm --filter @kozmos/react test  # 353
pnpm native:check                 # needs Xcode, and packages/android/local.properties
(cd packages/ios && swift test)   # 57
(cd packages/android && ./gradlew verifyPaparazziDebug)   # 25
pnpm tokens:radius:nesting --strict   # reads the live Figma file
pnpm figma:verify                     # the file against the plugin
pnpm figma:publish:linked:dry && pnpm figma:publish:native:linked:dry   # Code Connect; publishes nothing
```

`pnpm figma:verify` prints two **FAIL** lines and still exits 0: 5 children that overflow their box,
and 29 icons typed as characters. Both are standing findings (`ds-handoff.md` §7), and news only if
a count changes. `pnpm figma:icons` is refused by the token's scopes.

Storybook: `pnpm --filter @kozmos/docs storybook:react`, run from the worktree whose branch you want
to see.

Three are ratchets that fail in **both** directions — a lower number means lower the baseline in
the script to lock the gain in: `tokens:raw:check`, `components:classes:check`, and the
`KNOWN_TYPE_PROBLEMS` list inside `packages:install:check`.

## 6 · The reverse handoff — what Astra leaves before Olcay switches back

Olcay should be able to say "I'm back" and have the agent start from facts. So before the switch, Astra
does all of this:

1. **Nothing uncommitted anywhere.** The shared checkout is as it was handed over — on `main`,
   clean — and every piece of work is on an `astra/` branch with a PR, merged or open with its state
   stated. The agent's worktrees and the local `codex/wayfinding-map-panel` are untouched.
2. **`docs/ds-handoff.md` brought up to date**, as each earlier session left it: the header date; §0's
   paste-in message; §3's state table, **re-measured** with the command beside each number; §5's new
   rulings from 24; §6 and §6.3; a §10 log section headed with its dates and "(Astra)"; §11 for any
   component in the loop.
3. **A handback file, `docs/agent-handback-<YYYY-MM-DD>.md`**, containing:
   - **the range**: the output of `git log --oneline a02a008..origin/main` — its first entries are
     this handoff's own merge — and every PR opened, merged, open or closed, with why for the last
     two;
   - **decisions Olcay made**, each with its §5 number;
   - **work started and not finished**: the branch, the last commit, and what is left, precisely
     enough to resume without guessing;
   - **checks**: which of §5 were run on the final `main` and their results; **which could not be
     run, and why** — no Xcode, no token, no network; and **every baseline that moved** —
     `tokens:raw:check`, `components:classes:check`, `KNOWN_TYPE_PROBLEMS` — with why;
   - **Figma**: any plugin run Olcay did, and the build coverage `pnpm figma:verify` reports
     afterwards;
   - **corrections**: every claim in this file or in `ds-handoff.md` found wrong, and where it was
     corrected;
   - **deviations from §4**, stated plainly: a merge before CI, a check skipped, a claim not measured.
     This section exists so an omission cannot pass for a clean record — write "none" if there were
     none;
   - **traps** found on the way, so they can join `ds-handoff.md` §8;
   - **what is next**, in Astra's judgement.
4. **Index** the handback in `docs/README.md`.

## 7 · When Olcay switches back to the coding agent

Paste this to the coding agent:

> I'm back from ChatGPT Astra. Read `docs/agent-switch-2026-09-17.md` §7, the newest
> `docs/agent-handback-*.md` and `docs/ds-handoff.md`, then verify the state before starting
> anything.

The coding agent then, before any new work:

1. Fetches, and reads `git log --oneline a02a008..origin/main`, the open PRs, the branches and
   `main`'s CI — against the handback's own account of them.
2. Builds a fresh worktree of `main` and runs every check in §5, native and Figma included.
3. Reports any difference between what the handback says and what it measures — a count, a
   baseline, a PR's state, a missing section — **before** trusting the rest.
4. Treats its own memory as stale for everything after `a02a008`, and updates it from what it
   measured, not from what it remembers.

If no handback file exists, steps 1 to 3 still apply, starting from `git log` alone.
