# From a user-stories document to a Kozmos design — the brief to paste

Written 2026-09-21, against `main` at `a02a008`. Every number here was measured that day, and
re-measured on 2026-09-29 where §8 says so; §8 says how to re-measure before trusting one. This
file is the long form. §0 is the short form Olcay pastes into a new chat; the chat then reads this
file and does the work.

## 0 · What to paste

> Read `docs/user-stories-to-design-prompt.md` completely and follow it. Then read `AGENTS.md`.
>
> The user stories: <attached | pasted below | path | Drive link>.
> Target: <platform(s) and form factor — e.g. iOS phone; web desktop; both>.
> Figma destination: <team / project — or "the Core Library's project">.
> Base branch: <main | claude/pointr-browse-repairs, if its parts are needed and it is unmerged>.
>
> Run the brief's preconditions first and tell me which hold. Then deliver, in order: the
> normalised stories with their defects and questions; the screen inventory mapped to Kozmos with
> a verdict per part; the flows; the Figma file; the functional prototype and its README; the
> session's handoff, in `.notes/` and never committed.
> Where the design system cannot express something, report it and place a labelled gap — never
> work around it. Ask decisions as short multiple-choice questions, recommended option first, and
> proceed on your recommendation for anything that does not change the screen inventory. No push,
> deploy, merge or publish without my go-ahead. Finish with the closing report the brief describes.

If the chat does not run inside this checkout, prepend §2 case B or C.

## 1 · What this is for

Pointr is putting AI into more of its process. A product meeting produces a user-stories document
written by an AI. That document comes here, and the task is to turn it into what a design and
engineering team can act on, **using the Kozmos design system as it is**:

1. the stories read, normalised and checked (AI-written stories drift, repeat and skip criteria);
2. every screen and state the stories imply, mapped part by part to Kozmos components;
3. the user flows, as diagrams and as a walkable Figma prototype;
4. a Figma design file composed from the Core Library's components;
5. a functional prototype built from `@kozmos-ds/react` with mock data, that the flows drive, with
   a README beside it that says what it is, how to run it and the gaps it found;
6. a handoff for the next session, which stays out of the repository (§5.6).

The gaps are a deliverable, not a failure. The rule that makes this exercise worth anything is the
one every Kozmos example follows: **only what the design system exports, its tokens and its
roles**. A workaround hides exactly the evidence being collected. A part that Kozmos cannot
express is recorded, shown as a labelled placeholder, and asked about.

## 2 · Where the design system is

The source of truth is **the repository**, not a package registry. Publishing to npm changes only
how something _outside_ the repository consumes it. Pick the case that applies.

### Case A — inside this checkout (the default)

`/Volumes/4TB Depo/development/K/kozmos-design-system-dev`, branch `main`, remote
`https://github.com/vodoco/kozmos-design-system.git` (public). The packages resolve as
`workspace:*`; nothing changes here when they are published.

| What                    | Where                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The components          | `packages/react/src/components/` — use the generated lane counts in `docs/status.md`; the barrel is `packages/react/src/index.ts`                                                                           |
| Props and variants      | `docs/figma-library-manifest.json` → `components.items[]` (props, variant values, Code Connect node); regenerate with `pnpm figma:manifest`                                                                 |
| Tokens and roles        | `packages/tokens/src/tokens-light.json`, `tokens-dark.json`; the roles and the one rule in `docs/style-playbook.md`                                                                                         |
| Icons                   | `@kozmos-ds/icons`: the 57 names `Icon` takes (`kozmosIconNames`), and every Pointr Icon Library outline as a component `Icon` cannot name; check both before promising an icon                             |
| Presentation models     | `@kozmos-ds/product-contracts` (`POIPresentation`, `RouteOptionPresentation`, `FloorPresentation`…); the ownership boundary in `docs/product-sdk-react-handoff.md`                                          |
| Native                  | `packages/ios` (SwiftUI, package `Kozmos`), `packages/android` (Compose) — the same component names                                                                                                         |
| Storybook               | `apps/docs` (`storybook-react` in `.claude/launch.json`, port 6006); examples in `apps/docs/stories/examples/`                                                                                              |
| Figma Core Library      | `Kozmos DS - Core Library`, file `Yj4O8p6Y9h2Sa9zJVoAiVY`; Components page `4:4`, Examples page `286:1601`; 95 sets; painted by `figma/foundations-importer`                                                |
| Code Connect            | 95 linked to that file (`figma.linked.config.json`), of the 108 that can be: the 5 code-only parts have no set; the native configs under `packages/{ios,android}/`                                          |
| What Kozmos still lacks | `apps/site/GAPS.md` (numbered gaps, shown on the website's `/roadmap`), `docs/component-variant-gap-analysis.md` (variant axes per platform), `docs/sdk-module-primitives.md` (what the SDK's modules need) |
| Unmerged work           | Check current pull requests; the historical `claude/pointr-browse-repairs` branch has merged, but that does not mean later work has merged                                                                  |

Build before reading anything at runtime: `pnpm install --frozen-lockfile` then
`pnpm --filter "@kozmos-ds/react..." build` (a fresh worktree has no built packages).

### Case B — another machine, or another repository

```bash
gh repo clone vodoco/kozmos-design-system && cd kozmos-design-system
pnpm install --frozen-lockfile && pnpm --filter "@kozmos-ds/react..." build
```

The repository is private: `gh auth status` must show an account with access. The Figma library is
not in git — the account running Figma needs access to `Yj4O8p6Y9h2Sa9zJVoAiVY`. Then case A.

### Case C — after the npm publish, from a consumer that is not this repository

As of 2026-09-21 the registry has nothing: `npm view @kozmos-ds/react` is a 404, and `release.yml`
skips publish while `NPM_TOKEN` is unset. When that changes, a consumer installs
`@kozmos-ds/react @kozmos-ds/tokens @kozmos-ds/icons @kozmos-ds/product-contracts` (`@kozmos-ds/vue` is private
and not published), imports `@kozmos-ds/react/dist/style.css`, wraps the app in `ThemeProvider`, and
reads the READMEs that ship in the packages. In a prototype under `apps/`, the only line that
changes is `"@kozmos-ds/react": "workspace:*"` → the published version. Everything else in this
brief is unchanged, because the docs, the manifest and the Figma library live in the repository
either way.

## 3 · What Olcay provides with the paste

- **The stories** — pasted text, a file (`.md`, `.docx`, `.pdf`: use the matching skill to read it
  whole), or a Google Drive link (the Drive connector). Read all of it before writing anything.
- **Target platform(s) and form factor.** Default if absent: the phone, 402 × 874 CSS px, which
  is the frame the reference prototype uses; ask if the stories name a desktop or a kiosk.
- **The Figma destination** — the team and project for the new file. Default: the Core Library's
  own project.
- **The base branch.** Default `main`. If the stories need parts that exist only on
  `claude/pointr-browse-repairs` and it is unmerged, base the work on it and say so in the report.
- Optionally **reference designs** (Figma file keys, the live prototype
  `https://agentic-search-zeta.vercel.app`). Measure them over the REST API or the DOM; never
  eyeball a screenshot for a number.

## 4 · Preconditions — check first, report in the first message

Run all of these before building anything, and say which held. Items 1 and 2 are stop conditions
for the Figma part only; the rest of the work continues regardless.

1. **Figma write access.** The Figma MCP must list `use_figma`, `create_new_file` and
   `generate_diagram`, and `get_metadata` must answer — this needs the Figma desktop app open with
   its MCP server on. In the session that wrote this brief only the read tools were listed and
   `get_metadata` timed out. If write access is missing, deliver §5.4 as a specification (frames,
   instances, props, reactions, per screen) inside the handoff and say plainly that the Figma file
   was not built.
2. **The Core Library is published** as a team library, so another file can instantiate its
   components: in the new file, `figma.importComponentByKeyAsync` on the Button's key must succeed.
   If it fails, publishing the library is Olcay's one action (Assets → publish) — ask, do not draw
   a Button.
3. **The base branch state.** `git -C <checkout> status --short` and
   `git branch -r --merged origin/main | grep browse-repairs` — is the unmerged branch merged yet?
   Work in a `git worktree` under the scratchpad on a new branch `claude/<slug>-design`; the shared
   checkout stays on `main`.
4. **The build is green.** `pnpm install --frozen-lockfile && pnpm --filter "@kozmos-ds/react..." build
&& pnpm --filter @kozmos-ds/react typecheck`. A broad, uniform type error in files nobody touched
   is the install, not the code: reinstall, or build the same commit elsewhere, before believing it.
5. **The stories are read** — count them and echo the count and their titles back, so a missing
   page is caught in the first message.
6. **The Figma REST token** is in `.env` (`FIGMA_ACCESS_TOKEN`, expires 2026-11-24; never print
   it). It reads files for measuring; it cannot list published components (`library_content:read`).
7. **The Pointr taxonomy** is reachable (the Pointr Maps MCP): POI types, sectors and personas the
   stories mention are looked up there, not guessed.

## 5 · The work, in phases

Each phase ends with a short message: what it produced, what it found, what it needs. Findings are
written down as they are made, not reconstructed at the end: the gaps in the prototype's README,
everything else in the handoff (§5.6).

### 5.1 · Read and normalise the stories

Produce one table, one row per story, that the rest of the work keys on:

| Column     | What                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | `US-01`… in document order, unless the document numbers them                                                                                            |
| Persona    | who; if undefined in the document, name the gap and use the Pointr persona set (`customer`, `visitor`, `staff`, `vip`, `facilityManager`, `contractor`) |
| Goal       | the "I want … so that …" in one line                                                                                                                    |
| Acceptance | each criterion on its own line, rewritten measurable where the source is vague; mark rewritten ones                                                     |
| Platform   | from the story or Olcay's target                                                                                                                        |
| Priority   | as the document says; `unranked` otherwise                                                                                                              |
| Source     | the heading or line in the document                                                                                                                     |

Then the defects, because AI-written stories carry them: duplicates and near-duplicates,
contradictions between stories, criteria that cannot be tested, features a criterion assumes but
no story asks for, undefined personas and terms, anything that names a POI type or persona the
taxonomy does not have. Each defect is a finding with the story IDs it touches.

Questions come out of this phase as **short multiple-choice questions, the recommended option
first**. Proceed on the recommendation for anything that does not change the screen inventory; put
the rest in the report and continue with everything that does not depend on it.

### 5.2 · Map every screen to Kozmos

From the stories, list the **screens and their states**: at least empty, loading, populated and
error for anything that loads; permission-denied and offline where the story implies them;
selected and unselected where there is a list. Name them `US-07 / Search results / Empty` — the
same name is the Figma frame, the prototype route and the flow node.

Then, per screen, **every part mapped to a Kozmos component** with its props and variant, and a
verdict:

| Verdict     | Meaning                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| **covered** | the component expresses it as designed                                                                                  |
| **partial** | the component is used and a named axis or value differs — record which (a partial is built, and the deviation recorded) |
| **missing** | no Kozmos equivalent — a gap, shown as a labelled placeholder, never approximated                                       |

Look things up, in this order: `docs/figma-library-manifest.json` (props, variants),
`docs/product-sdk-react-handoff.md` (what a Product / SDK component owns and what the app owns),
`apps/site/GAPS.md` and `docs/component-variant-gap-analysis.md` (what is already known missing —
do not rediscover it, cite it). Prefer the Product / SDK set (`POIDetailPanel`, `POIResultList`,
`FloorSelector`, `RoutePreviewPanel`, `AdaptiveMapShell`, `BrowseCategoriesPanel`…) over composing
Core parts into a lookalike.

Every **missing** and every **partial** goes on the gap list with four things: the part and the
story that needs it; what was tried; the lane it belongs to (Core, Product / SDK, or an example);
the evidence (how often the product draws it, or the count from these stories). Gaps are
numbered `GAP-01`… and cited by number everywhere they appear.

### 5.3 · The flows

One flow per story, merged into one per epic where stories share screens. Nodes are the screen
states of §5.2, by their exact names; edges are user actions or system events, named as the
acceptance criteria name them; diamonds are the branches (no results, permission denied, error,
another floor). Each flow starts at an entry the story names and ends at its goal.

Three forms, which must agree because they share the node names:

1. **Mermaid** in the prototype's README (§5.6) — always.
2. **A FigJam board** through `generate_diagram` — when write access holds (load
   `figma:figma-generate-diagram` first). Linked from the README.
3. **The Figma prototype's reactions** (§5.4), which make the main path of each flow walkable.

The functional prototype's state machine (§5.5) uses the same edge names, so a flow diagram, the
Figma prototype and the code cannot drift on what a screen does.

### 5.4 · The Figma file

**A new design file, never the Core Library.** The library file is painted by the plugin
(`figma/foundations-importer`) and is not written by hand or by MCP. Its components are instantiated
_from_ it; nothing in it is touched, and **Rebuild** is never run: it mints new node ids, and Code
Connect pins the old ones. Load `figma:figma-create-new-file` before `create_new_file`, and
`figma:figma-use` (with `figma:figma-generate-design`) before any `use_figma` call.

- **Name** `<Project> — user stories <date> (Kozmos)`, in the destination from §3.
- **Pages** `Cover` (the stories table and the legend), `Flows`, one `Screens / <epic>` page per
  epic, `Gaps`, `Handoff`.
- **Frames** named as §5.2 names the screen states, in the target device size, laid out one row
  per story with states left to right. Light and dark only when a story asks: switch the
  collection mode on the frame, never repaint.
- **Every part is an instance** of a Core Library component, imported by key, with its variant
  properties set and its text overridden. Never detach an instance, never draw a lookalike of a
  library component, never override a colour by hand — the instance carries the token bindings.
  Free text uses the library's text styles.
- **A gap is visible**: a dashed frame named `GAP-04 / <part>` with the gap's one-line text, in
  the position the part would take. On the `Gaps` page, the whole list once.
- **The prototype**: a flow starting point on each epic's first screen; `ON_CLICK` reactions —
  `NAVIGATE` between screens, `OVERLAY` for sheets, dialogs and menus, `BACK` where the story
  says so; the transitions the library's motion tokens name, otherwise instant. Read the reactions
  back through `use_figma` after wiring and list them in the handoff; a reaction nobody read back
  does not count as built.
- **Traps that have cost real time**: a page reads empty until `setCurrentPageAsync`; a hidden
  instance reads layerless; imported variables vanish between calls; opacity is lost on bind;
  `clone()` of a section child lands on the page; text boxes set to auto-height wrap; relaunching
  Figma (⌘Q) to load a changed plugin applies to the plugin, not to this. When a look cannot be
  explained by anything the API can read, ask before changing it.

If a story needs a component the library does not have, the Figma answer is the gap placeholder —
not a new component drawn in the product file. A component change is a design-system PR, proposed
with its gap in the prototype's README, never made in passing.

### 5.5 · The functional prototype

A Vite + React app at `apps/<slug>-prototype`, wired exactly as `apps/mapscale-review/src/main.tsx`
is: `ThemeProvider`, `import "@kozmos-ds/react/dist/style.css"`, `@kozmos-ds/react`, `@kozmos-ds/icons` and
`@kozmos-ds/product-contracts` as `workspace:*`. Functional means: real components, real states,
real transitions, mock data — not a click-through of pictures. The Figma prototype is the
click-through; this is where behaviour lives.

- **Only Kozmos.** Components from `@kozmos-ds/react`; layout from `Stack`, `Grid`, `Container`,
  `Box`; tokens through the components. No Tailwind config of its own that adds one-off classes,
  no raw hex, no hand-rolled markup standing in for a component. A gap renders an `Alert` naming
  its `GAP-nn`, the same way `apps/docs/stories/examples/POIDetailCard.stories.tsx` does.
- **Data** typed with `@kozmos-ds/product-contracts` and, for POIs, types and names from the Pointr
  taxonomy. Fixtures in `src/mock/`, deterministic.
- **Routes** are the screens; one small state machine per flow with the edge names of §5.3, so the
  flow diagram is the code's specification. A route list on the cover route to jump anywhere.
- **Verify in the browser, not by reading the code.** Add the app to `.claude/launch.json`,
  `preview_start` it (it serves the original checkout — if the work is in a worktree, build the
  app and serve `dist`, or the wrong tree is being reviewed), then: `read_console_messages`
  clean; axe on every screen (`@axe-core/playwright` is in the repo); widths 320, 390, 1024 and
  1440 where the target is the web; dark mode; a keyboard walk of each flow. Screenshots to
  `.notes/<slug>-screenshots/`, beside the handoff: they are the session's proof, not part of the
  app.
- **A flow test** under the app (`scripts/` or `tests/`, Playwright): each flow's edges as steps.
  Break one route on purpose and run it once so it is seen to fail; then fix and run it green. A
  green that never failed proves nothing.
- **Deploy only on "deploy".** The pattern is `apps/mapscale-review/vercel.json`: built locally,
  `dist` uploaded prebuilt, `X-Robots-Tag: noindex`. Until then the URL is the local preview.
- **Storybook examples** are optional and asked for: a composition the stories introduce and the
  system may want to keep becomes `apps/docs/stories/examples/<Name>.stories.tsx` under the same
  rule — only if Olcay says so, since it adds to the system's own gallery.

Gates before calling the prototype done: `pnpm --filter <app> typecheck`, `pnpm --filter <app>
lint`, `pnpm --filter <app> build`, the flow test, and the repo's own — at least
`pnpm components:contract:check`, `pnpm docs:snippets:check` and `pnpm components:classes:check`
after a build if any package changed. None should change, because this brief changes no package;
if one does, that is a finding.

### 5.6 · The README and the handoff

Two documents, in two places. Session notes and handoffs are never committed: they go in the
git-ignored `.notes/`, and nothing dated or session-shaped goes in `docs/` or anywhere else tracked.

**`apps/<slug>-prototype/README.md` is committed with the prototype.** It is durable: it stays
true for as long as the app does, and it is what someone who finds the app reads. It says three
things, and only these:

1. **What it is**: one paragraph on what the stories asked for, what the design system covers, the
   count of covered / partial / missing parts and the one or two gaps that matter most; the
   screens, each with its route, its states and its Figma frame link; the flows, as Mermaid, with
   the FigJam link.
2. **How to run it**: the commands, the launch entry, the gates and the flow test; where each
   screen, fixture and flow lives, and the one-line recipe for the common edits.
3. **The gaps it found**: each `GAP-nn` with the four things of §5.2 and a **proposed DS change** —
   the lane, the size, whether it is a new axis on an existing set or a new component — as PR
   candidates, not as work done here.

**The session's handoff is `.notes/<slug>-handoff.md` in the main checkout**, that is
`/Volumes/4TB Depo/development/K/kozmos-design-system-dev/.notes/` (§2 case A). It is never
committed, and never written in the worktree, which does not outlive the session. It is for the
next session and for whoever builds this for real, and it carries what the README does not:

1. **Where it stands**: the branch and its commits, what was built, what was not and why.
2. **The stories** (§5.1's table) and their **defects and questions**.
3. **Component usage**: per screen, per part — component, props, variant, verdict, gap number.
4. **The Figma prototype's reactions**, read back (§5.4), or the Figma specification when write
   access was missing (§4 item 1).
5. **Decisions taken** and the alternative not taken, one line each; **open questions** for Olcay
   as multiple choice, recommended first.
6. **For engineering**: per screen the props and contracts, the copy as a table (every string,
   its screen, its state), the states and transitions, the accessibility notes (names, roles,
   focus order, what is announced).
7. **The traps met.**
8. **The proof**: the gate outputs, the counts, and the screenshots in `.notes/<slug>-screenshots/`.

Both are written for someone who will change things themselves: every number carries the command
that measured it, and every change carries how to redo it by hand.

## 6 · Rules in force — do not relax them

- **Only the design system**: what `@kozmos-ds/react` exports, its tokens, its roles. A missing
  part is a labelled gap, reported and asked about; never approximated, never deferred silently.
  A partial is built and its deviation recorded.
- **The Core Library is read-only in this work.** No edits, no Rebuild, no page added to it. The
  design lives in a new file; the system's changes are PR candidates in the README's gap list.
- **The system's settled decisions are not reopened**: the roles (radius, border, elevation), the
  `emotion` axis, the brand colour at `theme/500`, the lanes (Core is domain-neutral; Product / SDK
  compositions are examples), the slot rule (only a `SLOT` node carries a slot binding), and the
  plugin painting the Core Library.
- **The scope is the design and its prototype**, not the product: no SDK integration, no map
  renderer, no API. `MAP-595` and `apps/mapscale-review` stay parked.
- **Measure, never eyeball**: REST, DOM, computed styles, counts — and the command beside every
  number. Verify a finding by hand before reporting it.
- **An adversarial self-audit before "done"**: what was overlooked, mis-implemented, or could
  have been done better; mistakes stated plainly, including your own.
- **A green must name what you added**, and a new check must be seen to fail once.
- **Git**: a worktree under the scratchpad, a new branch, stage by file (never `git add -A` or a
  directory), commits as the natural end of a "proceed"; **no push, PR, merge, deploy or publish
  without a go-ahead in so many words**.
- **Secrets**: never print, copy or commit `.env`, tokens or licence keys; never put personal data
  in a URL.
- **The shell is zsh** and the Bash tool does not gate on `set -e` — gate before pipes.
- **Ask before changing what the API cannot explain.**

## 7 · Definition of done, and the closing report

Done when every item below is true or is named as not done, with the reason:

- [ ] the stories table, the defects and the questions are in the handoff;
- [ ] every screen state is named once and the same name is used in Figma, the flows and the code;
- [ ] every part has a verdict; every partial and missing part is a numbered gap with four things;
- [ ] the flows exist as Mermaid, and as FigJam and reactions where write access held;
- [ ] the Figma file exists with instances only, or §5.4 is a specification and the report says so;
- [ ] the prototype runs, its flow test failed once and passes now, axe and the console are clean,
      the screenshots are beside the handoff;
- [ ] the gates in §5.5 pass and their output is in the handoff;
- [ ] `apps/<slug>-prototype/README.md` says what the prototype is, how to run it and the gaps it
      found;
- [ ] the handoff is `.notes/<slug>-handoff.md` in the main checkout, and nothing session-shaped
      is committed;
- [ ] the self-audit is written and its findings are fixed or listed.

The closing report, in the chat, in this order and nothing else: what was built, with links (the
Figma file, the FigJam board, the local preview, the README, the handoff's path, the branch); what
was not built and why; the gaps that matter most, by number; the questions, multiple choice,
recommended first; the exact commands to run it and to check it; the commit(s) on the branch and
the one line to push them when told. A handoff a new chat can start from is part of done.

## 8 · When this brief is stale

The dated facts, as re-measured on 2026-09-29: 113 components, 95 Code Connect links, 674 + 674
tokens, 57 icon names, and the four npm packages published since 2026-09-23 (react 0.5.0,
icons 0.4.0, product-contracts 0.4.0, tokens 0.1.0). Not re-measured: 95 Figma sets
(2026-09-21; counting them needs `pnpm figma:verify` and the Figma token). On 2026-09-21 the
others were 98 components, 92 links, 641 + 641 tokens and packages at `0.0.1`, unpublished, and
the Figma MCP was read-only in the writing session. Re-measure rather than trust:
`docs/status.md` (`pnpm exec tsx scripts/skills/check-completion.ts --check`),
`pnpm figma:manifest`, `pnpm figma:verify`, `npm view @kozmos-ds/react version`,
`git branch -r --merged origin/main`. If a number here disagrees with a measurement, the
measurement wins and this file gets the correction in the same commit.
