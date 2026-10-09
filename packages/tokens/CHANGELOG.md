# @kozmos-ds/tokens

## 0.6.0

### Minor Changes

- 2f12ee8: Decision 68: Kozmos has an accent colour, the one a client sets in the Pointr Cloud Dashboard beside the theme, background, foreground and emotional colours.
  - `Primitives.Colors.accent` is a 0–1000 ramp like theme's, with 500 as the base: `#FAB735` in both themes by default, and the other steps the alert ramp's.
  - `Semantics.Accent.fill` references accent 500, and `Semantics.Accent.onFill` is its ink, black in both themes by default.
  - The CSS (`--primitives-colors-accent-*`, `--semantics-accent-fill`, `--semantics-accent-on-fill`), the JS module, Swift, Kotlin and the Figma variables all carry them.
  - To use your own accent, override accent 500 and, if your colour is dark, the on-fill ink. On the web, set both on `ThemeProvider`'s `tokens`.

- 7471bf0: Decision 60: a filled emotion button's hover is one step and its pressed two steps further along the emotion's own ramp, away from the page: darker in light, lighter in dark. Its focus is its hover. `Components.Primary Buttons.{success,alert,danger,informative,neutral}.button.background.{idle,hover,pressed,focus}` are now references to their ramp steps, so the CSS writes them as `var()` references (GAP-23), and the Swift, Kotlin and Figma outputs carry the same steps. `tokens:contrast:check` holds each state to its ramp step and its direction, and focus to hover.

  **What you'll see:** hovered and pressed emotion buttons move away from the page in both themes.

  | Emotion                     | Theme | Idle      | Hover and focus                                  | Pressed                                     |
  | --------------------------- | ----- | --------- | ------------------------------------------------ | ------------------------------------------- |
  | Danger                      | Light | `#B01736` | `#8C132B` (was `#D41C42`, lighter than the fill) | `#670E20` (was `#8C132B`)                   |
  | Danger                      | Dark  | `#EE7E95` | `#F3A2B3` (was `#E95A77`)                        | `#F8C6D0` (was `#F3A2B3`)                   |
  | Success, alert, informative | Dark  | 700       | 800 (was 600)                                    | 900 (was 800)                               |
  | Informative                 | Light | 700       | 800                                              | 900, `#154761` (was 800, the same as hover) |
  | Neutral                     | Light | `#C7CAD1` | `#ABAFBA`                                        | `#9095A2` (was `#E3E4E8`, lighter)          |
  | Neutral                     | Dark  | `#464A53` | `#2E3138` (was `#5C6069`)                        | `#17191C` (was `#2E3138`)                   |
  - Light success and alert already followed the rule and don't change.
  - The dark neutral keeps darkening: white, its ink, reads 3.72:1 on the lighter step.
  - The themed button keeps decision 59's values.
  - The inks don't change. Each still reads at least 4.5:1, and black on the light neutral pressed reads 7.01:1.

- 8186d4d: GAP-23: `css/light.css` and `css/dark.css` write a token whose source value is an alias as a reference to the token it names: `--components-primary-buttons-themed-button-background-idle` is `var(--primitives-colors-theme-500)`, `--semantics-border-subtle` is `var(--primitives-colors-background-200)`. Every token still computes the value it had. A value a transform changed stays literal, and so do the four elevation roles (`DesignConfigProvider` sets the shadow ramp they alias as legacy aliases). Declarations keep their order. The 28 themed button colours the sources held as hex copied from the theme ramp (primary dimmed content; secondary and tertiary themed) are now aliases of their steps; their values are unchanged, and Android's `colors.xml` names them as `@color` references. The JavaScript, Swift and Kotlin outputs are unchanged.

  **What you'll see:** nothing, unless you override a token. Override `--primitives-colors-theme-500` and every token that names it follows, the themed primary Button's fill among them; override the ramp's other steps and the button's hover, focus and pressed (600 and 700 light, 400 and 300 dark) and the outline, ghost and link ink (700) follow. A tool that reads these files as text now meets `var(--…)` where it read a colour: resolve it in the same file. The other emotions' button colours follow their own ramps only in part: in the light file 30 of them are references (the success and alert fills and their states, informative's hover and focus, and every emotion's secondary ink), in the dark file only neutral's four inks; the rest are still values. An override now also moves what references the primitive it names: `background-200` moves `border-subtle` and the neutral emotion's surface, `foreground-500` moves `border-input`, `foreground-0` moves the neutral emotion's on-surface and the light alert's on-fill, the radius primitives move the semantic radii, the font family the brand font, and an emotional ramp its emotion's roles. On Android, overriding a `primitives_colors_theme_*` resource now moves the 28 button colours too.

- 8186d4d: Decision 59: the theme fill is theme 500, the client's base colour set in the Pointr Cloud Dashboard, in both themes, and the theme foreground on it is white in both. `Components.Primary Buttons.themed.button.background.idle` now aliases `Primitives.Colors.theme.500` (`#135BEC`) in light and dark; hover and focus are `#1051E8` in both (theme 600 in light, 400 in dark), pressed `#0D44C2` in both (700 and 300); `foreground.content.{idle,hover,pressed,focus}` is `#FFFFFF` in both, where the dark theme had black. The CSS, Swift, Kotlin and Figma outputs carry the same values. `tokens:contrast:check` now pins the fill to theme 500 and the foreground to white in each theme, as well as their contrast (5.62:1 at rest, 6.24:1 hovered, 8.01:1 pressed).

  **What you'll see:** every primary button is brighter in the light theme, `#135BEC` where it was theme 700, `#0D44C2`. In the dark theme it changes most: from light blue (`#7EA2F6`) with black text to the same `#135BEC` with white text. Anything you paint with these two tokens moves with them. Text, icons, borders and focus rings in the theme's colour keep theme 600, which still turns over with the theme.

### Patch Changes

- 7471bf0: Decision 63: brand variant 1's 500 (`Primitives.Colors.theme.variant.1.500`) is `#4135F1` in both themes, lightened from `#4134F1` just enough to read 3:1 as a shape on the dark page (3.00:1; it read 2.99:1). Its hue is unchanged. White on it reads 6.99:1, and it reads 2.52:1 on the dark sheet. The CSS, Swift, Kotlin and Figma outputs carry the same value. `tokens:contrast:check` now holds it to 3:1 on the page and white on it to 4.5:1.
- 2f12ee8: GAP-45 (decision 69): brand variant 1's dark 600 (`Primitives.Colors.theme.variant.1.600`) is `#716EFF`, lightened from `#6258F3` with the same hue. It now reads 4.5:1 as text on the dark page (5.38:1) and on the dark sheet (4.51:1); it read 4.21:1 and 3.53:1. The light value is unchanged.

## 0.5.0

### Minor Changes

- 7097e1a: Add `Semantics.Map marker.dot` (#2563EB) and `Semantics.Map marker.ring` (#FFFFFF), fixed in both themes: the user-location marker's blue and its dot's ring. Data blue lightens in dark, which left the dot at 2.54:1 against a white ring; the marker's own blue holds 5.17:1.

## 0.4.0

### Minor Changes

- d096d4f: Make the approved SDK result presentation the default: shared neutral selected/hover surfaces, combined numbered Featured and badge tabs, matching corner radii, wrapping names and an outlined navigation icon on Go actions. Grouped and standalone results share the treatment. `presentationStyle="legacy"` preserves the prior appearance for staged migration; numbering remains opt-in and product-supplied.

  Add themed result surface tokens. SwiftUI and Compose source implementations adopt the same default and add directly composable expandable result groups. Existing callbacks and positional native calls remain supported. Review changed card heights and accessible names; SDK sprite integration and physical accessibility acceptance are separate from this source change.

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
