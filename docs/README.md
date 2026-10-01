# Documentation

What each document is for, and when to read it. The website,
<https://vodoco.github.io/kozmos-design-system/>, describes platform coverage and links to
Storybook, the component reference. [`AGENTS.md`](../AGENTS.md) is the short guide to working in this repository, and
[`.ai-skills/`](../.ai-skills/README.md) is the reference written for AI assistants.

## How Kozmos works

- [`style-playbook.md`](style-playbook.md) — before you change how Kozmos looks: the roles, the
  cookbook, the traps and the checks that keep Figma, the web and native in agreement.
- [`figma-change-workflow.md`](figma-change-workflow.md) — when a change crosses code, the token
  JSON and Figma: who owns what, and how a change travels between them.
- [`nested-radius.md`](nested-radius.md) — when a rounded shape holds another: concentric radii,
  and what `pnpm tokens:radius:nesting` reports.
- [`adaptive-map-layout.md`](adaptive-map-layout.md) — before you work on `AdaptiveMapShell`'s
  layout: what the host owns and the geometry contract.
- [`embedding-isolation.md`](embedding-isolation.md) — when Kozmos runs inside someone else's page:
  the scoped theme, portals and stylesheet.
- [`visual-review.md`](visual-review.md) — when a change moves pixels: how every story is compared,
  and how to record a new baseline.
- [`release-process.md`](release-process.md) — before you prepare or cut a release.
- [`design-system-maintenance.md`](design-system-maintenance.md) — testing cadence, component
  definition of done, compatibility and developer/AI documentation practices.

## Product and SDK

- [`product-design-gap-register.md`](product-design-gap-register.md) — the 108 supplied product
  gaps reconciled against released source, plus new SDK-screen requirements; separates library
  implementation, host integration, platform validation and external artifact adoption.
- [`sdk-module-primitives.md`](sdk-module-primitives.md) — current SDK coverage and the proposed
  implementation plan for floor controls, map layout, language, branding/attribution, info and exit.
- [`product-sdk-react-handoff.md`](product-sdk-react-handoff.md) — when you use a Product / SDK
  component: what it owns, what the app owns, and the `@kozmos-ds/product-contracts` models.
- [`user-stories-to-design-prompt.md`](user-stories-to-design-prompt.md) — when an AI-written
  user-stories document arrives: the brief to paste.
- [`japanese-break-hints-2026-09-28.md`](japanese-break-hints-2026-09-28.md) — when you follow up
  the request for break hints in the taxonomy's Japanese category names; the strings are in
  [`japanese-break-hints-2026-09-28.json`](japanese-break-hints-2026-09-28.json).

## Generated or checked

- [`claude-design/`](claude-design/README.md) — what the Kozmos artifact in Claude Design carries:
  consuming the system, and one API card per component with every prop and an example that
  compiles. `pnpm skills:build` writes it from the built React types and the stories;
  `pnpm skills:check` fails when it is stale or an example stops compiling.
- [`status.md`](status.md) — which components exist on which platform, and which link to Figma.
  `pnpm exec tsx scripts/skills/check-completion.ts` writes it; CI fails when it is stale.
- [`component-variant-gap-analysis.md`](component-variant-gap-analysis.md) — which variant axes
  each platform can express. `pnpm components:variant:write` writes its data blocks and
  `pnpm components:variant:check` fails when they are stale; the prose around them is edited by
  hand.
- [`generated-color-scales.md`](generated-color-scales.md) — the scope for colour ramps derived
  from a base. Not started.
- [`project-scope.md`](project-scope.md) — the original specification, written before the code.
  Where the two disagree, the code is right.

## Proposals: not built

- [`proposals/`](proposals/README.md) — designs written before, or instead of, the thing they
  describe: an MCP server, customer themes, the platforms never built, and the plans the AI
  knowledge base once presented as fact. Read one to learn what was intended; nothing in it exists.

## Data the scripts read

Written by a script: regenerate rather than edit.

| File                                                                     | Written by                              | Read by                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `figma-foundations-payload.json`                                         | `pnpm figma:foundations`                | the Figma importer (chosen in its file picker), the parity, contract and painter checks |
| `figma-library-manifest.json`                                            | `pnpm figma:manifest`                   | `pnpm components:contract:check`                                                        |
| `figma-pointr-icon-catalog.json`                                         | `pnpm figma:icons`                      | `pnpm icons:pointr:build`, `pnpm components:contract:check`                             |
| `figma-icons-2026-09-22-0810Z.json`, `figma-icons-2026-09-22-0947Z.json` | `scripts/figma-rest/icons-baseline.mjs` | the icon-source comparison in [`scripts/figma-rest`](../scripts/figma-rest/README.md)   |

Session notes, handoffs and dated reports are not kept here: they stay in the git-ignored `.notes/`
folder of the checkout that wrote them.
