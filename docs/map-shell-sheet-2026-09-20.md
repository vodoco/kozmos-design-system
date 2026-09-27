# The map shell's sheet: fitted to its content, on the surface style, 20 September 2026

The coding agent, on Olcay's answer to the glass stage's second decision
([glass-surface-2026-09-20.md](glass-surface-2026-09-20.md) §5): the shell's sheet takes the
surface style, with the compact detent chosen in the navigation stage. Built on iOS, React and
Android; the Pointr QA app rests its directions sheet on both, as the prototype's navigation
sheet is. Branch `claude/pointr-browse-repairs`, pushed.

| Commit    | What                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `20575a0` | iOS: `KozmosMapPanelDetent.content`; `panelSurface`; the capped layout shared and clamped; the QA app on both |
| `72009db` | React: `panelSizing="content"`; `panelSurface`; the Examples/Navigation sheet fitted and on glass             |
| `ccf33ed` | Android: `panelSurface`; the bottom sheet already fitted by construction, said so; two goldens                |
| the last  | This report, the guide, the index, the log                                                                    |

## 1. What changed, per platform

- **iOS**: a new detent, `.content` — as tall as the panel's content, between the collapsed and
  the large heights. The shell lays the fitted sheet out in one pass through
  `KozmosCappedHeightLayout` (now its own file, shared with the manoeuvre card, and clamped to
  its cap: a fixed-height child taller than the cap used to make the layout taller than the
  cap — the render test caught it) and measures the result for the detent maths — the insets it
  reports, the snapping — which use it a frame later. `panelSurface: KozmosSurfaceStyle` puts
  the sheet and the floating side panel on the surface style; `KozmosPanelShape` is insettable
  so the surface can stroke its edge. Every initialiser takes the parameter.
- **React**: `panelSizing: "fraction" | "content"` — fitted, the content wrapper's scroll height
  becomes the panel's share of the shell, within the same 0.12–0.88 limits as a requested
  fraction, measured a render late as the chrome is. `panelSurface` puts the aside on the
  surface's class in place of its own background.
- **Android**: the bottom sheet was already as tall as what it holds, up to 64 % of the shell
  (`heightIn(max)` with wrap-content) — fitted by construction, now said so in place;
  `panelSurface` puts both panels on `KozmosSurfaceDefaults`.
- **The hosts**: the QA app offers `[.collapsed, .content, .medium, .large]`, rests the sheet on
  `.content` while navigating and back on medium after, and asks for the glass sheet; the
  Storybook Examples/Navigation composition does the same on the web.

A visible consequence on every platform: the solid surface carries the subtle border, so every
shell panel now has a 1px edge it did not have. The prototype's sheet has one.

## 2. Measured

- **iOS**, `KozmosMapShellContentDetentTests`: a 120-point panel makes a sheet of the handle's
  row and the panel with the map's red 40 points above it and the sheet's own colour 8 points
  above; a 2000-point panel stops at the large height, clipped; the glass sheet lets the red
  through its tint where the solid one does not; an unmeasured content detent folds into medium.
  The sheet's shadow darkens the map just above it, so the map is read by a point, not a bounding
  box.
- **Web**, `AdaptiveMapShell.test.tsx`: the aside's surface classes; a 120-pixel panel in a
  400-pixel shell laid out 120 tall at the bottom, through the properties the shell reads live.
  `test:navigation`: the composition's sheet within 2 pixels of its content's height, under half
  the viewport, on the glass class — 20 of 20 on chromium, firefox and webkit.
- **Android**, `KozmosAdaptiveMapShellPaparazziTest`: the fitted bottom sheet solid, and on glass
  over a red map.
- **Live**, the QA app on the iPhone 17 Pro: the directions sheet holds the summary and the
  buttons and nothing more, on glass, the map above it; the flow UI test passed on it.

## 3. Verified

| Check                                                                | Result                                     |
| -------------------------------------------------------------------- | ------------------------------------------ |
| Package, iOS 26.5 (baselines skipped); iOS 18.4                      | 102, from 98; 104, from 100                |
| `node scripts/check-ios-poi.mjs`                                     | 52                                         |
| The QA app's flow UI test                                            | passed on the fitted glass sheet           |
| React unit tests, lint, build, typecheck                             | 515 in 118 files (2 new); clean; ok; ok    |
| `components:classes:check`, `tokens:raw:check`, `tokens:glass:check` | ok; ok; ok                                 |
| `test:navigation`, chromium / firefox / webkit                       | 20 of 20 on each, with the sheet assertion |
| Android, `verifyPaparazziDebug`                                      | passed; two new goldens                    |

Not run: the fixture playground's wayfinding on the content detent (it keeps its own detents);
Chromatic; Android on a device.

## 4. Change it yourself

| Behaviour                | iOS                                                                                         | Web                                                                             | Android                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| The content-fitted sheet | `AdaptiveMapShell.swift`: `.content`, `detentHeight`, the fitted branch of `panelContainer` | `AdaptiveMapShell.tsx`: `panelSizing`, `effectivePanelFraction`, `panelContent` | `AdaptiveMapShell.kt`: `heightIn(max = availableHeight * 0.64f)` |
| The panel's surface      | `panelSurface`, `kozmosSurface(_:style:)` on both containers                                | `panelSurface`, `surfaceClass(panelSurface)` on the aside                       | `panelSurface`, `KozmosSurfaceDefaults`                          |
| The capped layout        | `KozmosCappedHeightLayout.swift`                                                            | —                                                                               | —                                                                |
| The QA app's choice      | `SDKMapScreen.swift`: `panelDetents`, `panelSurface`, the phase change                      | `NavigationExamples.stories.tsx`                                                | —                                                                |
| Tests                    | `KozmosAdaptiveMapShellTests.swift`: `KozmosMapShellContentDetentTests`                     | `AdaptiveMapShell.test.tsx`; `scripts/check-navigation-examples.mjs`            | `adaptivemapshell/KozmosAdaptiveMapShellPaparazziTest.kt`        |
