# Documentation

Written 2026-09-13. Current documents first, then the generated data, the parked MAP-595
workstream, and the archive. `ds-handoff.md` is the door in; the checks that keep every number in
these files honest are listed in its §7.

## Start here

Latest handoff: [Claude Code handoff — the evening of 2026-09-22: npm as `@kozmos-ds`, one file per
module, GAP-56, and the Figma pass under way](claude-code-handoff-2026-09-22-evening.md): the three
branches in merge order, the road to npm 0.1.0, the Figma re-tint pass and the checks after it, the
design-system roadmap from the website's gap findings, and the to-do. Before it, the day's
[Claude Code handoff — every edge in its role, the five open, the five decisions,
PR #56's CI, and the icon tints the live file lost (2026-09-22)](claude-code-handoff-2026-09-22.md):
the exact working state on `claude/pointr-browse-repairs`, what Olcay asked for on the 22nd and
what was done, the CI and the live Figma file as measured, the revised Figma run, the decisions
still his, the traps, and how to resume. Before it, [the handoff of the
21st](claude-code-handoff-2026-09-21.md): the 20th and 21st, the parts' new parameters on three
platforms, the QA app and the SDK as they stand. Before that, the native continuation: [Claude Code handoff after Pass 3 —
2026-09-19](claude-code-handoff-2026-09-19-pass3.md), the state of the Pointr iOS work after the
three passes of [Astra's handoff to Claude Code](claude-code-handoff-2026-09-19.md): routing
between two named places, measured on the simulator, and what a new session does next — updated
20 September with the [closure of Pass 3's leftovers](pointr-ios-pass3-closure-2026-09-20.md).
Later that day the work turned to the design system itself:
[the design system pass](design-system-pass-2026-09-20.md) — the card's header on all three
platforms, the level switcher's open list, and what folded phones need — and the reference for
every screen state became the live prototype, measured in
[pointr-prototype-screen-states-2026-09-20.md](pointr-prototype-screen-states-2026-09-20.md):
read that before building anything a screen shows. The operator's guide for all of it is
[kozmos-pointr-operators-guide-2026-09-20.md](kozmos-pointr-operators-guide-2026-09-20.md).
Then the prototype's three navigation parts were built on iOS, React and Android and the QA
app's directions put on them: [navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md).
Then the glass surface role the handoff had ruled, built on all three platforms and measured:
[glass-surface-2026-09-20.md](glass-surface-2026-09-20.md).
Then the map shell's sheet, fitted to its content and on the surface style, on all three:
[map-shell-sheet-2026-09-20.md](map-shell-sheet-2026-09-20.md). Then the directions for
transitions — lift, escalator, stairs, a level change, a walkway, turning back — on all three:
[transition-arrows-2026-09-20.md](transition-arrows-2026-09-20.md). Last, the search sheet's parts on
the prototype's geometry and the two it lacked, on all three:
[search-sheet-2026-09-20.md](search-sheet-2026-09-20.md).

Latest local continuation: [npm foundations — 2026-09-18](npm-foundations-2026-09-18.md).
It closes declaration-format and inert-opacity debt and migrates the temporal fields.
Earlier baseline: [Overnight quality pass — 2026-09-18](overnight-quality-pass-2026-09-18.md).
Read it before the older measured-state sections: it records repairs, reproducible
checks, source locations, preview ownership and remaining pre-publication gates.

| File                         | What it is                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ds-handoff.md`              | The handoff for the next session: the scope, the priorities in order, the measured state, what is decided, what is open, and the traps.                                           |
| `agent-switch-2026-09-17.md` | The switch from Claude Code to ChatGPT Astra at `a02a008`: how to pick the work up, the working agreement that made it reliable, and the handback to leave before switching back. |
| `ds-scope-2026-09-12.md`     | What the design system is missing and where the SDK components belong: the 24 Product / SDK sets and the eight missing parts.                                                     |
| `style-playbook.md`          | How to change how Kozmos looks without breaking the agreement between Figma, the web and the two native platforms: roles, cookbook, traps, checks.                                |

## Current

The Pointr iOS thread, 2026-09-19 to 2026-09-20, newest first:

- `search-sheet-2026-09-20.md`: the category tile, the result row with its current-floor dot, the
  search field and the location marker on the prototype's geometry, on tokens, plus the AI search
  button with its ring from the theme ramp — iOS, React and Android, measured; the QA app's search row.
- `transition-arrows-2026-09-20.md`: `DirectionType` gains ten cases for transitions on iOS, React and
  Android, each platform drawing what its own icon set has (probed); the QA app maps the SDK's
  message types and the taxonomy's transition subtypes onto them; measured on each platform.
- `map-shell-sheet-2026-09-20.md`: the map shell's sheet fitted to its content — a content detent on
  iOS, `panelSizing` on the web, by construction on Android — and on the surface style, solid by
  default; the QA app's directions sheet on both; measured on each platform.
- `glass-surface-2026-09-20.md`: the glass surface role from `Semantics.Effect.glass` on iOS, React
  and Android — the token emitted natively, the web rule and component, the SwiftUI modifier, the
  Compose defaults — with the card, the summary and the three web map cards on it; Liquid Glass
  renders black in snapshots; the scoped preflight and `kozmos-reset`; three decisions.
- `navigation-parts-2026-09-20.md`: the manoeuvre card over the map that opens into the
  itinerary, the itinerary list, the route progress rail and the summary's navigation layout,
  built on iOS, React and Android with pixel-measured tests, a three-engine browser check,
  Paparazzi goldens, stories, docs and examples; the QA app and the fixture playground on them;
  six decisions.
- `pointr-prototype-screen-states-2026-09-20.md`: the product prototype Olcay named as the reference,
  read through the DOM — every screen state measured in CSS pixels (search, the card, the
  four-mode preview, turn-by-turn with the instruction card, itinerary and progress rail, levels,
  the web layout), each mapped onto the Kozmos part it needs, five decisions and the parts missing.
- `design-system-pass-2026-09-20.md`: Olcay's redirection to the design system — the card's name
  and quick buttons on one row with the name wrapping to three lines, on iOS, the web and
  Android, measured on each; the open level switcher naming every level; folded phones: no
  iPhone Fold SDK in Xcode 26.6, the web shell's hinge model that iOS and Compose lack, a
  recommendation; the gaps seen on the way.
- `pointr-ios-pass3-closure-2026-09-20.md`: Pass 3's five leftovers closed or bounded — the SDK's
  next-portal marker identified through MapLibre's style API, no live no-route candidate on
  Design-QA (every `Do Not Route` is "false"), readiness measured and the not-ready state given a
  retry, the iPad's three panels driven by a new XCUITest, VoiceOver's tree over the directions
  read and repaired; Pass 3's Arabic finding withdrawn (the simulator's language).
- `claude-code-handoff-2026-09-19-pass3.md`: Claude Code's handoff to a new session after Pass 3 —
  the exact Git state, the fifteen commits, routing as built and measured (Dunkin' to Airport
  Shuttles, both modes, every step), the findings, the eight open decisions, and the order of
  what comes next. Read first.
- `pointr-ios-pass3-2026-09-19.md`: Pass 3 — routing between two places the visitor names, on
  the Kozmos routing parts: what PointrKit's wayfinding gives as measured, the flow, one route
  step by step in both modes, the design-system gaps (no transition arrow), the findings for
  Pointr, and what is not done. Its language finding was withdrawn on 20 September: the Arabic
  was the iPhone simulator's own first language, not a Cloud default.
- `pointr-ios-pass2-2026-09-19.md`: Pass 2 — what Design-QA's 1,196 places actually carry, and
  the card connected to it: taxonomy chips and highlights by the web adapter's rules, contacts
  from the SDK's buttons, the venue's hours text, descriptions; six upstream findings.
- `pointr-ios-pass1-2026-09-19.md`: Pass 1 of the handoff below — map controls, the selected
  marker's framing, the native gallery and the sheet card, each measured in the simulator;
  what is verified, what is not, and the decisions that wait on Olcay.
- `claude-code-handoff-2026-09-19.md`: Astra's handover of the Pointr iOS work to Claude Code —
  the worktree, the SDK setup, the seven native findings and the four passes that follow. Its
  status notes say which findings Pass 1 closed.
- `pointr-ios-integration-2026-09-19.md`: the real PointrKit host — SDK artifacts and their
  provenance, the QA configuration, the browse-only milestone and its limits.

The Storybook and POI thread, 2026-09-18:

- `ios-poi-examples-2026-09-18.md`: the native POI card brought up to the shared examples,
  fixture generation from the React fixtures, simulator coverage and the accessibility decision.
- `poi-taxonomy-display-2026-09-18.md`: how taxonomy 10.12.0 properties become card content —
  labels, icons, order, highlights — and the seven upstream questions it left open.
- `poi-reference-examples-2026-09-18.md` and `poi-reference-review-2026-09-18.md`: the web POI
  examples and their follow-up review. The three-cell metadata rule in the later document wins.
- `public-catalogue-guide-2026-09-18.md` and `snippet-validation-2026-09-18.md`: one public
  React catalogue with platform reference tabs, and which of those references are actually
  compiled against installed packages.
- `installed-product-pilot-2026-09-18.md` and `production-readiness-recheck-2026-09-18.md`:
  the installed-package consumer pilot and the release gates it did and did not clear.
- `storybook-component-review-2026-09-18.md` and `storybook-manual-review-2026-09-18.md`: the
  component-by-component visual review and the manual queue behind the green automated scan.

- `storybook-screenshot-audit-2026-09-17.md`: latest screenshot-driven fixes,
  cross-engine regression matrix, exposed Select accessibility blocker, maintenance
  commands and remaining pre-publication gates. Start here for the newest batch.

- `component-owned-css-2026-09-17.md`: approved compatibility migration's first slice,
  source map, customization/migration guide, reproduced failures, verification commands
  and remaining release gates. Start here for the current CSS implementation.

- `browser-compatibility-2026-09-17.md`: reproduced WebKit form-styling blocker,
  real Firefox coverage and the unfixed baseline that motivated the CSS migration.

- `embedding-isolation.md`: scoped ThemeProvider and CSS, automatic portal ownership,
  migration, compatibility decision gate and remaining legacy configuration work.
- `foundation-audit-2026-09-17.md`: the adversarial audit of the first Astra batch,
  reproduced corrections, explicit overlay ownership, verification and remaining release blockers.

- `prepublish-architecture-review-2026-09-17.md`: baseline audit, approved architecture direction,
  publication risks and the phased pre-beta plan.
- `adaptive-map-layout.md`: the first implementation, its coordinate/API contract, migration,
  browser reproduction commands and explicitly unfinished native/device/map-adapter work.

| File                                 | What it is                                                                                                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product-ui-coverage-2026-09-14.md`  | What the running product draws and how much the design system covers: 13 surfaces, 763,776 nodes, measured over the Figma REST API. The answer to §4.2.                                                                            |
| `poi-detail-card-gaps-2026-09-14.md` | The SDK's `fullPOIDetailCard` rebuilt from Kozmos components only, and everything it could not express. The first component of the §11 loop.                                                                                       |
| `map-mode-toggle-gaps-2026-09-15.md` | The SDK's tracking and step-free map toggles measured against Kozmos, the `emphasis`/`labelPlacement` axes and `revealOnChange` they produced, and the inert opacity modifiers they exposed. The second component of the §11 loop. |
| `gap-audit-2026-09-05.md`            | The gap audit: the POI Details Card Revamp designs and the monorepo, measured — about twenty missing patterns.                                                                                                                     |
| `sdk-module-primitives.md`           | What the SDK modules need from the design system: eleven primitives, ranked.                                                                                                                                                       |
| `nested-radius.md`                   | Concentric corner radii: how a rounded shape hugs the rounded shape inside it. `pnpm tokens:radius:nesting` reports against it.                                                                                                    |
| `generated-color-scales.md`          | Scope for colour ramps that derive from a base. Not started.                                                                                                                                                                       |
| `figma-change-workflow.md`           | Who owns what between code, the token JSON and Figma, and how a change travels between them.                                                                                                                                       |
| `product-sdk-react-handoff.md`       | The React Product / SDK reference implementation and the `@kozmos/product-contracts` models behind it.                                                                                                                             |
| `component-variant-gap-analysis.md`  | Which variant axes and values each platform can express. Its data blocks are written by `pnpm components:variant:write`; `components:variant:check` fails when they are stale. The commentary around them is edited by hand.       |
| `session-handoff.md`                 | The long record, 2026-08-24 to 2026-09-10. Read its §3 for the reasoning behind a specific decision.                                                                                                                               |

## Generated data

Built by a script from the tokens, the packages or the Figma REST API. Regenerate rather than edit.

| File                             | Built by                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `figma-foundations-payload.json` | `pnpm figma:foundations` — the variable collections and styles the plugin imports into the Figma library. |
| `figma-library-manifest.json`    | `pnpm figma:manifest` — the tokens, the React components and their Code Connect links as one manifest.    |
| `figma-pointr-icon-catalog.json` | `pnpm figma:icons` — the Pointr icon library, read over REST.                                             |

## Parked: MAP-595

MAP-595 (Easier Content Editing — Part 2) is complete and parked; it is not the design system's
work (`ds-handoff.md` §9). Its record stays at these paths because the files refer to each other by
them.

| File                                     | What it is                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `map-595-handoff.md`                     | The handoff, written 2026-09-12 and patched on the 13th; its §0 is the start. |
| `map-595-figma-2026-09-07.md`            | The change record for the Figma file `nm6qdzaC9B1lknllbwaMTh`, §1–§199.       |
| `map-595-stories-revision-2026-09-11.md` | The stories' 2026-09-11 revision and every change it caused in the file.      |
| `map-595-file-changes-2026-09-11-pm.md`  | The afternoon of 2026-09-11: every change, and how to redo any of it by hand. |
| `map-595-file-changes-2026-09-12.md`     | The nine open items ruled and applied on 2026-09-12.                          |
| `map-595-assets/`                        | The bitmap pipeline: the 2× source render, `geometry.json`, `retouch-map.py`. |

## Archive

`archive/README.md` lists what is superseded, and by what.
