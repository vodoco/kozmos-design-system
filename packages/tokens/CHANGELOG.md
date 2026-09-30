# @kozmos-ds/tokens

## 0.3.0

### Minor Changes

- ccc6580: Add MapAttribution: provider-neutral, single-line horizontally scrollable credits with safe links and independently optional branding. The host supplies approved content and owns SDK provider resolution and map placement. Matching SwiftUI and Compose components accompany the web presentation.

  Use compact text-height credit rows and 4-unit spacing across all three platforms, without map-button minimum heights.

  Bundle the official Pointr logo by default on all three platforms. Supply brand to replace it for white-label use, or showBrand=false to hide branding without hiding credits. Artwork loads locally with no network dependency.

  Encode the web artwork as a compact SVG data URL without changing the canonical image, and keep generated branding stable under repository formatting.

  Default to transparent map appearance with tokenized grey text and a thin white halo across all three platforms. The optional surface appearance retains the opaque themed treatment. Preserve underlines, a single accessible label per credit, one-line scrolling and independent branding.

## 0.2.0

### Minor Changes

- 0956f93: A loud fill for the alert emotion and its ink, `Semantics.Emotion.alert.fill` and `Semantics.Emotion.alert.onFill` (`--semantics-emotion-alert-fill` and `--semantics-emotion-alert-on-fill`, `semanticsEmotionAlertFill` and `semanticsEmotionAlertOnfill` on iOS and Android). The map status pill's Turn Back reads them: the SDK's bright amber under black words.

  The fill is `alert/600` in both themes (#F9A707 light, #FBC459 dark), a mid step of the ramp that stays bright, so it is not a surface that turns over with the theme. Its ink is black in both themes: `foreground/0` in the light file and `foreground/1000` in the dark, because no one primitive is dark in both. The pair reads at 10.56:1 in the light and 13.14:1 in the dark, and the contrast contract holds it at 4.5:1 or more.

  Next to `surface` and `onSurface` (the quiet field a label sits on) and `text` (the emotion on the page), `fill` and `onFill` are the loud pair. They take the shape of the taxonomy's `Semantics.Category.Fill` and `OnFill`.

- 6ce1001: A fourth elevation role, `Semantics.Elevation.Map Control` (`--semantics-elevation-map-control`, `semanticsElevationMapControl` on iOS and Android), for a control over a map: the SDK's own three shadows, Pointr's "Shadows/Floating Components BG" — 0 8px 8px at 16%, 0 24px 24px at 8% and 0 0 32px at 12% — aliasing a new `shadow.xl`. Dark mode gives the key layer the Floating role's dark alpha and keeps the SDK's proportions (0.4, 0.2, 0.3).

  The native builds carry layered roles: iOS as the layers, each radius half its CSS blur, which is how SwiftUI's radius draws, with `kozmosElevation(_:in:fill:)` to cast them from a surface; Android as the key light's blur, 8.dp, since Compose here draws one elevation.

## 0.1.0

### Minor Changes

- 42fbe70: Emotion text reads on every neutral surface. `Semantics.Emotion.*.Text` was
  measured on white alone, and four of six failed 4.5:1 on the greys a panel,
  card or sheet paints (background/50 and /100): success and alert move from 800
  to 900, informative from 700 to 800, danger from 600 to 700; themed and neutral
  already passed. The contrast contract now holds every emotion's text on
  background/0, /50 and /100 in both themes.

  React draws status text and glyphs with the new Tailwind `*-text` roles
  (`text-success-text`, `text-warning-text`, `text-info-text`,
  `text-destructive-text`), which read those tokens; `success`, `warning`, `info`
  and `destructive` stay the fills, edges and rings they were.
