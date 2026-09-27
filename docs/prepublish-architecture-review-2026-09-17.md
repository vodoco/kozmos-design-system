# Kozmos: pre-publication architecture and adaptive-layout review

Reviewed 2026-09-17 at `a02a008` on `main`. The findings below record that baseline.
Olcay subsequently approved proceeding with the recommendations. The first implementation
is on local branch `astra/prepublish-foundations`, based on the handoff at `c274b06`;
see `adaptive-map-layout.md` and `ds-handoff.md` §10. It fixes the three measured React
layout failures and adds a typed region/occlusion contract and browser regression gate.
Native parity, theme/portal/CSS isolation, export cleanup and release safeguards remain work,
not completed features. Nothing has been pushed or published; account settings are unchanged.

The follow-up audit of that first implementation found and fixed four adaptive defect classes
and added explicit overlay destination support. See `foundation-audit-2026-09-17.md`; this is
an incremental foundation, not completion of the broader scoped-theme/CSS recommendation.

The subsequent local implementation supplies scoped ThemeProvider state, automatic owned
portals and scoped CSS with an opt-in reset. `embedding-isolation.md` is its current contract
and migration guide. Browser/WebView support approval and legacy configuration consolidation
remain gates; the baseline findings below should not be mistaken for its current implementation.

## Scope and evidence

Olcay wants to continue development across the coding agent and Codex, support landscape and foldable devices, eventually publish to npm, and rebuild Pointr product modules using the design system.

The specifically requested `kozmos-agent-switch-astra.md` was found in `/Users/olcaykurtulus/.claude/projects/-Volumes-4TB-Depo-development-K-kozmos-design-system-dev/memory/`. It points to `docs/agent-switch-2026-09-17.md` in commit `c274b06` on `claude/agent-switch-handoff`, currently open PR #52. Both were read, together with the corrected `ds-handoff.md` on that branch, the scope/SDK/gap records, current implementation and current platform documentation. The handoff is not yet on the reviewed `main`.

The working agreement is carried forward: keep MAP-595 parked, isolate changes in worktrees, use `astra/<topic>` branches, preserve existing Figma IDs, report unsupported compositions, and obtain Olcay's go-ahead for pushes/PR edits/merges. Before an actual switch back, update the main handoff and leave `docs/agent-handback-<date>.md` with decisions, commits, checks, remaining work and deviations. This analysis began on `astra/prepublish-review-2026-09-17`, renamed to `astra/prepublish-foundations` after approval. Its draft was initially written in the shared checkout before the switch note was located, then moved into this isolated worktree, leaving the shared checkout clean.

The preceding review in this conversation ran the build, lint, unit tests, native compilation, token/contract checks and package check. This review did not rerun that entire suite. It adds source analysis and three actual layout measurements in installed Chrome, using the existing built React package and stylesheet, rendered from its exported `AdaptiveMapShell` with React server rendering. These measurements establish the specific geometry defects below; they do not establish native-device or foldable readiness.

## Assessment

There is substantial reusable work: semantic border/elevation roles, emotional roles, components on three platforms, controlled product presentation models, Code Connect, packaging checks, and examples that have already exposed useful gaps. Preserve it.

Readiness is uneven. Component presence and successful compilation are much further along than embedding isolation, adaptive behavior, cross-platform behavior parity, and public API stability. A single completion percentage would conceal that distinction.

The best pre-publication work is a bounded architectural pass followed by two representative product flows. Completing every conceivable future component is unnecessary. Publishing the entire current barrel as a long-term supported API would make subsequent cleanup significantly more expensive.

## 1. Adaptive layout must use the space the module actually receives

Current implementations:

| Platform | Layout decision                                                                 | Map occlusion reporting                                                                   | Limitation                                                                   |
| -------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| React    | Viewport `md:` queries and `42vw`; root minimum height `28rem`                  | Copies supplied edge insets into CSS variables                                            | Does not measure its own panel/controls or understand container width        |
| Android  | `BoxWithConstraints`, side panel at `maxWidth >= 600.dp`; default minimum 448dp | Callback echoes supplied insets                                                           | No measured panel coverage or folding-feature input                          |
| iOS      | Environment horizontal size class; minimum height 448pt                         | Measures chrome and reports settled panel coverage; controlled detents and RTL conversion | More capable than web/Android, but still lacks a common height/region policy |

Evidence: `packages/react/src/components/AdaptiveMapShell/AdaptiveMapShell.tsx`, `packages/android/src/main/java/com/kozmos/components/AdaptiveMapShell/AdaptiveMapShell.kt`, and `packages/ios/Sources/Components/AdaptiveMapShell/AdaptiveMapShell.swift`.

Browser reproductions, with `height: 100%` passed to the shell and a simple panel:

| Scenario                                       | Measured result                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| 1440×900 viewport, 360×600 host container      | Shell width 360; panel width 416, starting at x = -72; the shell clips it      |
| 844×390 landscape viewport and host            | Shell height 448, panel height 416; document grows to 448                      |
| 1024×768 viewport, RTL, `panelPlacement="end"` | Panel x = 592, width 416: it remains at physical right rather than logical end |

These are concrete failures for embedded and landscape use. Native minimum sizes may be constrained differently by their parent layout systems; the Chrome result must not be presented as a reproduced native failure.

Recommendation: introduce a small, platform-neutral adaptive-layout contract, with native implementations. Inputs should describe local available width/height, usable regions, safe areas, keyboard occlusion, direction, and relevant accessibility preferences. Preserve an unknown/unsupported posture fallback. Dimensions must have defined coordinate spaces and units: CSS pixels, points or dp at each platform boundary, not interchangeable device pixels.

Compute presentation from that input and content constraints. Allow an explicit host override for embedded use. Do not spread `isPhone`, model-name checks or `isLandscape` branches through components. Use container queries for ordinary web composition and measured geometry where map positioning needs actual numbers. Android and iOS adapters supply their platform's window and local-layout information.

This is consistent with Android's separate width/height size classes and dynamically changing window space, and Apple's guidance for resizable, non-destructive layouts. The shared contract should express common behavior without requiring identical numerical breakpoints or identical APIs on all platforms. [Android window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes), [Apple iPad layout guidance](https://developer.apple.com/videos/play/wwdc2025/208/), [CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries).

## 2. Foldables require usable regions and state continuity

A width breakpoint cannot represent a hinge through the middle of a map. `MapCollisionInsets` currently describes only four outer edges. Retain edge padding as an output for compatible map renderers, but model usable map rectangles and internal exclusions separately. Define whether rectangles are shell-local or map-local and convert them explicitly at the adapter boundary.

The shell should measure chrome, resolve usable map space, and notify the map adapter. The adapter owns camera padding, viewport changes and renderer-specific collision behavior. If an engine only supports edge padding, choose a safe rectangular map region or a single-region fallback; do not pretend four edge values can express every internal obstruction.

Recommended initial behavior, subject to product validation:

| Available space                               | Proposed presentation                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Narrow and tall                               | Map plus a nonmodal docked panel with controlled detents                                                                        |
| Wide and short                                | Compact chrome; side panel only if map and panel minimum usable sizes both fit; otherwise collapsed or single-pane presentation |
| Wide continuous region                        | Map and detail pane alongside each other                                                                                        |
| Two regions separated vertically              | Consider map in one region, detail in the other; keep critical controls away from the separator                                 |
| Tabletop, horizontal separator                | Consider map above and directions/actions below; verify region heights before splitting                                         |
| Small cover display or a narrow embedded host | Compact presentation preserving the same selected item and task state                                                           |

A fold is not automatically an opaque hinge, and not every fold requires two panes. Android exposes separation, bounds, orientation and occlusion information for this distinction. Web posture APIs have limited availability, so enhancement must be feature-detected and retain a usable single-region fallback. [Android folding features](https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware), [MDN Device Posture API](https://developer.mozilla.org/en-US/docs/Web/API/Device_Posture_API).

Preserve selected POI/floor, search text, route choice, sheet state, scroll position and appropriate focus when rotating, folding or resizing. Android activity recreation and restoration need coverage as well as recomposition. Keep one logical map instance where the renderer permits it; relayout must not silently reset its camera or restart routing. Define how panel state maps between sheet and side-pane presentations.

Separate a nonmodal docked map panel from a modal sheet: focus trapping, dismissal, scroll locking and map interaction differ. Web `BottomSheet` currently builds on `Drawer`, while the iOS map panel explicitly keeps the map interactive. Similar appearance is insufficient to establish equal behavior.

The current Android package uses compile SDK 34 and an older Compose dependency set. Review and test its compatibility with the selected adaptive libraries and consuming apps' SDK targets. A library's compile SDK is distinct from an app's target SDK. Android documents changed orientation/resizing behavior for apps targeting API 36 on large screens; do not rely on orientation locks to make layout defects unreachable. [Android resizability guidance](https://developer.android.com/develop/ui/compose/layouts/adaptive/app-orientation-aspect-ratio-resizability).

## 3. Make embedding and theme isolation a supported contract

`ThemeProvider` modifies `document.documentElement`, reads/writes `localStorage`, and samples the system theme without subscribing to subsequent preference changes. `KozmosTheme` and `DesignConfigProvider` introduce additional configuration and persistence paths. `PopoverContent` creates a Radix portal without exposing a container. The distributed stylesheet includes Tailwind Preflight and generic utility selectors.

Recommendation: provide one documented public provider contract for theme mode, semantic token overrides, locale/direction, motion preferences and portal ownership. Separate its internal contexts if useful. Prefer a controlled theme with optional persistence; scope changes to a Kozmos root. If full-page theming is desired, make it explicit. Ensure popup content inherits the same theme, direction and overlay policy even when portalled.

Ship component CSS with a deliberate isolation strategy and an explicit optional reset. Removing Preflight alone does not prevent generic utility-class collisions with host applications. Prefix or otherwise scope emitted component styling, and test it alongside an unrelated host stylesheet. Test two differently themed modules on one page, including open menus/dialogs. Handle inaccessible storage and live system-theme changes.

Finalize the already-approved brand, type-scale and glass-role work against the semantic layer. The handoff distinguishes decisions made from implementation completed; a ruling does not prove the generated tokens or consumers changed. Route icon usage through the owned registry and keep payment-brand assets distinct from UI glyphs. These foundations are easier to correct before customer overrides depend on them.

## 4. Enforce the boundary between the design system and product modules

The handoff's policy says product compositions are examples. The public React barrel still exports POI/detail/browse/route panels alongside buttons and text, plus map synchronization, analytics and runtime design configuration. Its package depends directly on `@kozmos/product-contracts`.

Keep the intended dependency direction: tokens/icons support core components; reusable layout and map primitives support product modules; product modules own domain adapters and orchestration. Core controls should not import POI/routing contracts. Avoid promoting a fixed product screen into a fundamental DS component merely to achieve “DS-only.”

Before publication, classify each export as stable Core, reusable map/layout primitive, product composition, or experimental/tooling. Start with a small number of deliberate entry points; package-per-component is unnecessary. A `@kozmos/react/map` subpath can isolate the API/module graph, though it does not remove package-level install dependencies. Use a separate package only where ownership, dependency weight or release cadence justify it.

Keep product compositions as examples or in a private product workspace until their public support is intentional. Keep `@kozmos/vue` private as already decided. Reassess whether `@kozmos/product-contracts` belongs in the first public release once the core/product boundary is enforced. Preserve legacy Figma node IDs and deprecate sets in place, consistent with the existing decision.

“Solely this design system” should mean all reusable visual controls, layout roles and appearance come from Kozmos. Modules still own routing, data, permissions, search state, localization content, map engines and services. That ownership already appears in `docs/product-sdk-react-handoff.md` and is worth preserving.

Add only primitives exposed by real compositions: likely adaptive panel/pane layout, in-surface status, control clusters/toolbars and attribute sections first. MetaStrip and opening-hours work already exist; do not recreate them. Defer a general-purpose carousel or other large abstractions until an actual module proves the contract.

## 5. Stabilize public APIs and behavioral contracts

Finalize naming and defaults before public consumers depend on them. Priorities include the approved native enum normalization; logical start/end; a consistent meaning for emotion, emphasis, variant, size and state; controlled/default state behavior; and localized accessible labels. Platform-idiomatic syntax can differ while behavior remains specified.

Use one canonical selection identity. Current product models carry `selected` flags while components also accept selected IDs; define precedence or derive selection outside immutable item data, avoiding two independent authorities.

TypeScript product models are manually mirrored in Swift and Kotlin. Adopt shared cross-platform fixtures for defaults, identifiers, nullability and state transitions. A small schema/code generator becomes worthwhile if this contract grows; a wholesale cross-language UI generator is unnecessary.

Current checks include useful source-string and structure checks, but those cannot establish rendered behavior. React shell tests cover region naming and error content; iOS has meaningful detent and inset geometry tests; neither proves fold/unfold transitions across the product. Accessibility should include large text, keyboard operation, focus restoration, screen-reader semantics, reduced motion and RTL in the layouts being released.

## 6. Publish only a package surface that has been consumed outside this monorepo

The earlier package-install check is a valuable foundation. Resolve the known React/icons `FalseCJS` and product-contracts `CJSResolvesToESM` declaration findings before promising those module-resolution modes. Explicitly test the supported ESM/CommonJS and TypeScript modes. Do not describe every consumer as broken: the check records specific compatibility gaps.

Choose the intended bundling and server-rendering contract. The current React bundle has a blanket `use client` banner. That is a product decision for server-component consumers, not automatically a bug. Test a minimal consumer import for dependency/bundle cost; test SSR/hydration only for the support promised. Keep development-only Code Connect/tooling out of runtime distribution, including reviewing the iOS runtime target's Figma dependency.

A build should reproduce its publish directory. The prior local install-check failure involved an ignored SCSS artifact in tokens/dist; the clean GitHub release runner passed. The temporary local clean-check attempt in that review did not establish a successful clean package installation. Preserve the distinction and add a reproducible build/pack check rather than deleting arbitrary local artifacts to get a green result.

The current release workflow is triggered by CI completion but checkout does not specify the triggering run's `head_sha`. It can therefore build a newer default-branch revision than the one that passed CI. Publishing must be tied to a verified revision, and visual approval should be part of that revision's eligibility; the separate visual workflow currently is not a dependency of release. [GitHub workflow_run behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run).

The latest release run inspected remains `35222245459`: build/install succeeded and publishing was skipped for absent `NPM_TOKEN`. No changeset exists beyond configuration. **Correction to my preceding report: missing changesets do not block an initial publish.** The switch handoff explicitly identifies that `changesets/action` can publish unpublished package versions when no changesets are pending. The installed Changesets CLI independently confirms that it selects any local version absent from the registry. With the current workflow, enabling valid credentials can publish all four public packages at `0.0.1` on a subsequent successful main CI run. Prepare the intended version, package surface and release controls before enabling publishing; Olcay retains the publish decision.

The previous review also found no branch protection; this review found no applicable branch rules from the rules endpoint. An npm 404 establishes no visible package, not guaranteed ownership or name availability. The handoff also corrects the inventory to 98 component directories, and direct lucide imports to 50 shipping component implementations rather than the previously claimed 70 of 99; these are handoff measurements, not fresh counts made by this review.

Update the earlier authentication recommendation: prefer npm trusted publishing where applicable, with an explicit initial-package bootstrap plan. npm now documents trusted publishing from private repositories, while provenance remains unavailable for those repositories. Its repository metadata requirement means revisiting the handoff's decision to omit that metadata if choosing this route. Otherwise use a scoped granular token; legacy automation tokens are no longer supported. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [npm access tokens](https://docs.npmjs.com/about-access-tokens/).

## 7. Recommended work and release sequence

1. **Record the contracts.** Classify exports; agree adaptive geometry, map occlusion, state ownership, theme/portal scope and public support targets. Preserve existing approved decisions unless explicitly revised. Keep the handoff's corrections from PR #52 when it merges.
2. **Implement the foundations.** Fix the demonstrated layout defects, scoped theming/portals, inert classes and declaration problems. Complete the already-decided semantic token changes. Add focused behavior checks for these changes.
3. **Prove representative modules before broad publication.** Use the POI flow and a routing flow inside both a full window and a narrow host container. Install packed packages in an external consumer fixture, avoiding workspace source aliases. These two flows should drive any missing primitives.
4. **Publish an explicitly named prerelease once those contracts hold.** A beta can support internal product rebuilding while the remaining modules expose additive gaps. Reserve stable/default-tag publication for the supported surface after integration sign-off. Changeset/version changes alone are not release readiness.

Minimum acceptance scenarios for the adaptive foundations:

- Phone portrait and short landscape; resize while a panel and menu are open.
- Narrow embedded module in a wide desktop page; multiple module instances with different themes.
- Folded cover screen, unfolded continuous display, and simulated separating regions; actual Android foldable/emulator integration in addition to pure geometry fixtures.
- Split-screen/resizable iPad window; keyboard open and closed; safe-area changes.
- Large text, RTL, keyboard/screen-reader navigation and reduced motion in representative flows.
- Selection, route, search, focus and scroll preservation through transitions; map camera padding matches visible chrome and usable regions.

Existing shell minimum sizes, the inert-class baseline and type-resolution debt must not be accepted as “done” because a ratchet check is green. Conversely, every pending product pattern or cosmetic Figma cleanup need not block a deliberately limited core prerelease. Publish a documented support surface with evidence for the promises it makes.

## Continuation note for the coding agent or Codex

Olcay requested analysis and reporting. This document's architectural proposals are recommendations, not accepted decisions or implemented work. The requested memory note and its actual handoff at `c274b06` were read. No implementation, account configuration, Figma write, commit, push or publish was performed in this review. The report is uncommitted in its own worktree; the shared main checkout is clean. No full handback is due yet because Olcay is continuing here.

Next implementation candidate: the adaptive container and map-occlusion contract, exercised by the existing POI example, together with theme/portal isolation. Do not begin by rebuilding all modules or by introducing a new framework. Read `docs/ds-handoff.md` alongside this report; the code and fresh measurements take precedence over stale completion prose.
