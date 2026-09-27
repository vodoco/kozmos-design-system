---
"@kozmos-ds/react": minor
---

`AdaptiveMapShell` learns the chrome it cannot see, stops padding the camera for its controls, and
gains a header that stays put.

**`deviceSafeAreaInsets`.** The device's safe areas as a prop, merged with CSS `env()` so the larger
wins: passing them can only add room. `env()` isn't always the truth — inside a device frame on a
canvas, or a web view whose host paints its own bar — and the controls ended up under the status bar.

**`controlsPadCamera`, off by default.** Collision insets are edge bands, so a 44px column of
controls handed the camera the whole edge it sat on, at every height (120px, measured), and a map
following the visitor centred itself off to one side. The controls stay in the snapshot's
`occlusions` with their true bounds, so a product that wants to fit around them still can;
`controlsPadCamera` brings the old padding back.

**The controls sit where map apps put them on a sheet.** They were placed opposite the panel — right
for a docked side panel, wrong for a bottom sheet, which spans the width. On a sheet they now sit at
the inline end, mirrored right to left.

**`panelHeader` stays put while the content scrolls.** It is drawn under the grip and above the
scrolling content, and counted in the detent heights (`PanelDetentMeasures.headerBottom`). Its first
control keeps 4px under the grip, so the grip's 16px target keeps the spacing WCAG 2.5.8 asks for. A
sheet fitted to its content now counts its grip as well: it is 16px taller when `content` is offered
with another detent.
