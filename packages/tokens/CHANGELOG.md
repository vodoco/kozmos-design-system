# @kozmos-ds/tokens

## 0.10.0

### Minor Changes

- e48c11d: DialogHeader takes `media`, an illustration or a photo above the title, 16 over it (decision 195, GAP-214). With `mediaBleed` it reaches the dialog's edges and top corners, past the dialog's 24 of padding, and the dialog's corner rounds it; the close keeps its corner, over the media. The media is decorative, hidden from assistive technology, unless `mediaLabel` names it, when it is read as one image.

  DialogContent takes `size="full"`: the window less 16 on each side, its first child keeping its height and the second taking the rest (decision 202, GAP-259). `size="default"`, at most 512 wide, is unchanged, and DialogContent now writes `data-size`. ImageField's full-screen preview opens in it and no longer carries `.kozmos-image-field-preview` or its own sizing rule; it draws and behaves as before.

  Text and Heading take one display size, `size="display"`: 48 on 54 lines, bold unless Text is given a weight, for a marketing-style headline (decision 203, GAP-272). Heading keeps its `level` as its rank. The tokens package adds the display type tokens, `Semantics.Typography.Display` (`--semantics-typography-display-size` 3rem, `-line-height` 3.375rem, `-weight` 700 and `-letter-spacing` 0rem), with their Swift and Kotlin members and Android resources.

  TourStep takes `anchor`, where the card is placed apart from what it lights (decision 198, GAP-220): an element, a ref, a virtual element or a rect. Backdrop still lights `target`, and where the card overlaps the lit area it stays above the cut-out. Without an anchor, or with one not on the page, the card is placed by the target, as before.

- e48c11d: A disabled pair, `Semantics.Disabled` (decision 197, GAP-218): `Semantics.Disabled.fill`, background/100 (#E3E4E8 in light, #17191C in dark), and `Semantics.Disabled.foreground`, foreground/400 (#5D626F, #A29D90). In CSS `--semantics-disabled-fill` and `--semantics-disabled-foreground`; in TypeScript `SemanticsDisabledFill` and `SemanticsDisabledForeground`; in Swift and Kotlin `semanticsDisabledFill` and `semanticsDisabledForeground`; in the Android resources `semantics_disabled_fill` and `semantics_disabled_foreground`. The foreground reads 4.80:1 on the fill in light and 6.51:1 in dark, and `tokens:contrast:check` holds the pair to 3:1 or more.

  **A disabled Button is no longer drawn at half opacity.** `.kozmos-button` loses `disabled:opacity-50`, and a disabled Button is drawn from the pair in every variant and emotion, at full strength. Its label and its icon take the foreground. A filled variant (`default`, `destructive`, `secondary`, `subtle`, or any emotion's fill) takes the fill under them, and so does a `ghost`, icon-only too, because an enabled ghost can already be grey. An `outline` Button keeps the page under it, where the foreground reads 6.10:1 and 7.76:1, and its edge takes the foreground too. A `link` gains no fill: grey with no underline is what differs from its theme-coloured self. `glass` keeps its glass. IconButton, FloatingActionButton, SplitButton (both halves) and MapControlButton take Button's props and are drawn the same; a disabled map control's surface takes the fill, on or off, as its surface is its fill, and a disabled IconButton's count turns over to the pair. MapEditToolbar's disabled actions and tools, ImageField's parts and AISearchButton (its disc and glyph; the ring stays) take the pair too, no longer at half. The cursor stays the default and the Button still takes no press. **This changes every disabled Button's pixels.**

  An unavailable Button, `aria-disabled="true"`, as RouteSummary's step controls and ImageCropper's zoom are, is drawn the same, under the pointer too, and keeps its focus and its ring. It was drawn at half.

  A loading Button is busy, not unavailable: it keeps its variant's colours at full strength, with its spinner in its label's colour, and takes no press while it waits. It was drawn at half. A Button that is disabled and loading is drawn as disabled.

  An inverse surface, `Semantics.Inverse` (decision 192, GAP-210): `Semantics.Inverse.surface`, foreground/200 (#2E3138 in light, #D1CEC7 in dark), and `Semantics.Inverse.onSurface`, background/0 (white, black), 13.0:1 and 13.4:1. In CSS `--semantics-inverse-surface` and `--semantics-inverse-on-surface`; in TypeScript `SemanticsInverseSurface` and `SemanticsInverseOnSurface`; in Swift and Kotlin `semanticsInverseSurface` and `semanticsInverseOnsurface`; in the Android resources `semantics_inverse_surface` and `semantics_inverse_on_surface`. The stylesheet adds the `inverse` colour role (`bg-inverse`, `text-inverse-foreground`, `border-inverse`, `fill-inverse`).

  `TooltipContent` takes `tone="inverse"`: the inverse surface under its words, its border and its arrow in the surface's colour, the same size as the default. In light it is exactly Pointr Cloud's tooltip, #2E3138 under white. The default tone, the popover surface with its border, is unchanged.

- e48c11d: The glass edge has a colour token, and the Android resources write every length as a `<dimen>` (decisions 208 and 206, GAP-229 and GAP-237).

  **Upgrade note (breaking, Android XML resources only):** `@kozmos-ds/tokens`' Android resources (`android/src/main/res/values/colors.xml` and `values-night/colors.xml`) now write the layout spacing, sizing and radius primitives (`primitives_layout_spacing_*`, `primitives_layout_sizing_*`, `primitives_layout_radius_*`), `semantics_motion_slide_sm`, `semantics_motion_slide_md` and `semantics_effect_glass_blur` as `<dimen>` in dp, where they were `<integer>`; and the type scale, with the `components_html_elements_headings_*` tokens, as `<dimen>`, where it was unitless `<string>` (and `<integer>` for `primitives_typography_paragraph_spacing_0` and `components_html_elements_headings_paragraphs_font_size`): font sizes, line heights and letter spacing in sp, so they follow the reader's font scale, and paragraph spacing in dp. An app that reads any of them as `@integer/` or `@string/` (`R.integer`, `R.string`, `getInteger`, `getString`) no longer builds or finds them: read them as `@dimen/` (`R.dimen`, `getDimension`) instead, which an XML layout can now use. The numbers are unchanged. Compose (`KozmosDimensions`) and SwiftUI read no XML and are unaffected, and nothing on the web changes. `pnpm tokens:android:refs:check` now fails on any length written as an `<integer>` or a unitless `<string>`.
  - **`Semantics.Effect.glass.border.color`**, new: the glass edge's colour, white (#FFFFFF) in both themes, beside `Semantics.Effect.glass.border.opacity`. It is `--semantics-effect-glass-border-color` in CSS, `SemanticsEffectGlassBorderColor` in the JavaScript module, `semanticsEffectGlassBorderColor` in the Swift and Kotlin palettes, and `semantics_effect_glass_border_color` in the Android resources; Figma's Effect/glass gains it at the foundations importer's next Update.
  - **Every glass edge reads it** at the edge's opacity: `.kozmos-surface-glass` and Button's glass variant on the web (`color-mix()` of the token with transparent at the opacity), where white was written in. Nothing is drawn differently: the edge is the same white at 0.2, pixel for pixel in Chromium and WebKit, though its computed value now reads `color(srgb 1 1 1 / 0.2)` where it read `rgba(255, 255, 255, 0.2)`.

- e4846e8: **Badge on Chip's scale** (GAP-147, decision 93): a status badge, not a control. `size="sm"` is 28, the default 32 and `lg` 36 tall at touch, and 20, 24 and 28 under `ThemeProvider density="compact"`; an icon Badge is the default height, square. Every size was 44. No variant has a hover state any more. The tokens add `Density.Badge.Height` (`sm`, `md`, `lg`; `--density-badge-height-*`), and the stylesheet the `h-badge-sm`, `h-badge`, `h-badge-lg` and `w-badge` sizes that read them. A layout that counted on a 44 Badge changes.

### Patch Changes

- e4846e8: MapEditToolbar's disabled tools and actions can say why with `disabledReason` (decision 217, GAP-284): with a reason, the item stays in the arrow-key order and under the pointer, says it is unavailable with `aria-disabled="true"`, does nothing when pressed, and shows the reason as its tooltip and accessible description, drawn from the disabled pair. Without one, a disabled item is unchanged.

  Every component colour that is a primitive's value now refers to that primitive (GAP-281): 198 light and 208 dark Button colours were hex copies. The token stylesheets and Android resources write them as references (`var(--primitives-colors-foreground-1000)`, `@color/…`), so a change to a ramp, or a product's override of one, reaches every Button state drawn from it. Every value resolves to what it did on every platform.

  A new primitive, `Primitives.Colors.white` (`--primitives-colors-white`), is `#FFFFFF` in both themes (decision 223). The themed Button's words and marks refer to it rather than to foreground 1000 in light and foreground 0 in dark, so an override of either ramp step no longer reaches a white that is meant never to change.

  MapEditToolbar draws its items as Pointr Cloud's live toolbar does (decision 226). No item has a fill at rest. An enabled item's label is foreground 0 over a foreground 400 icon. A chosen tool is the theme's ink (the themed emotion's text) with no fill. A disabled item, with a reason or without, is foreground 500 with no fill, lighter than enabled and still 3:1: the toolbar is an exception to decision 197's disabled fill. Hovered, an enabled or chosen item takes the hover fill.

## 0.9.0

### Minor Changes

- 2e768c2: Button takes `variant="subtle"`, CardHeader takes `tone="subtle"` and CardTitle takes `size` (GAP-200, CLOUD-UI-001, GAP-035; decisions 132, 135 and 139).
  - **`variant="subtle"` on Button**: a pale fill of its own token tier, `Components.Subtle Buttons`, new in `@kozmos-ds/tokens` in both themes. Unset, it is theme 0 under theme 600, the theme as text (decision 59): 5.72:1 in light and 4.80:1 in dark. Hovered and focused it is theme 100 under theme 700, and pressed theme 200 under theme 800: its words step with its fill, because theme 600 on theme 100 reads only 4.41:1. Every state is a step of the theme ramp, so a client's ramp carries it. With `emotion` it is that emotion's pale fill under its words; `emotion="danger"` is the destructive tone of Pointr Cloud's Delete Feature, danger 0 under the danger text (decision 139). In dark a pressed `alert` keeps its hover's fill, as no step of the dark alert ramp reads 4.5:1 on its 200. The tier has no disabled tokens: a disabled Button is drawn at half, as every Button is. Its class sets the themed emotion's custom properties itself, so `buttonVariants({ variant: "subtle" })` draws it on a link too, and an emotion's inline properties replace them. A subtle SplitButton's seam is the fill's pressed step, as the filled variants' white at a fifth does not show on it. Full width is `className="w-full"`, as for every Button. IconButton, FloatingActionButton, MapControlButton and SplitButton take Button's props, so their `variant` types list `subtle` too.
  - **An emotion's filled Button now takes its words from each state's token** (`--kz-button-fg-focus` and `--kz-button-fg-pressed` join the custom properties an emotion sets). The Primary tier's words are one colour in every state, so nothing it draws changes; the subtle tier's step.
  - **`tone="subtle"` on CardHeader**: Pointr Cloud's form side panel header, a pale theme strip, theme 0, full-bleed to the card's edges and inside its top corners, at least 52 tall and taller as its content needs (its top corners the card's only when it is the card's first child), 12 above and below its words and the card's padding at its sides, with the card's padding below the tint before the content. With `actions`, its title and actions are centred in it. Its title, description and a ghost action's ink read 4.5:1 on it in both themes.
  - **`size` on CardTitle** (the owner's ruling of 9 Nov): `lg` 24, the default, as it was; `md` 18 for a compact card on a phone or a dashboard's section card; `sm` 14, as `sm` is 14 on Text. Unset, a title in a subtle header is `sm`, the strip's. With `actions`, they are centred on the smaller title's line. The heading level stays `as`'s.

- 5a919ba: A hover fill role, `Semantics.Hover.fill` (GAP-228, decision 173): `--semantics-hover-fill` in CSS, `SemanticsHoverFill` in TypeScript, `semanticsHoverFill` in Swift and Kotlin, and `semantics_hover_fill` in the Android resources. It is background/100 in light, the muted fill hovers always drew, and background/200 in dark, #2E3138, 1.61:1 on the black page where background/100, #17191C, is 1.19:1 and a hover was barely seen. The stylesheet adds the `bg-hover-fill` utility, with its variants and opacity steps.

  Every fill under the pointer moves to it, so in light these hovers draw exactly what they drew and in dark they draw one step lighter: AIInputBar's voice button, BottomNavigation's and NavigationItem's items (hovered and pressed, and NavigationItem's `state="hover"`), BottomSheet's and Drawer's close buttons, Chip's neutral variant, FileUpload's drop zone, POIResultGroup's show-more row, RouteOptionCard, Table's rows, ToggleButton, Tree's rows, Accordion's trigger, NumberInput's steps, the buttons at a field's end (Combobox, MultiSelect, Input's action, PasswordInput's reveal, DatePicker's and TimePicker's triggers), Calendar's days and the ghost map controls.

  The highlighted option, under the pointer or the keyboard, in Listbox, Combobox, MultiSelect, Select, TimePicker and LanguageSwitcher, takes the hover fill too. **This is a deliberate change in light**: the highlight moves from background/50 (#F1F2F4) to background/100 (#E3E4E8), a slightly stronger row, and in dark from background/50 (#0C0D0E) to background/200. In light the highlighted row and the chosen row are now one grey; the chosen row keeps its check.

  A selected Tree row and a selected Table row draw the hover fill at full strength, so selection stays stronger than the hover at its opacity step (`/50`): unchanged in light, background/200 in dark. A selected Tree row now keeps its full fill under the pointer, where the hover's half step used to replace it; the half step is for the rows not selected.

  Fills that are not a hover stay on `muted`: Calendar's today, disabled fields, placeholders and tracks. Two named exceptions keep the muted step, checked by `tokens:contrast:check`: Button's outline and text treatments with an emotion keep the muted hover, because on the dark hover fill the themed and danger hover inks read 3.83:1 and 3.84:1, under AA. A selected NavigationItem (top and side) and BottomNavigation item keep the muted fill, because their theme 600 label reads 3.83:1 on the dark hover fill.

### Patch Changes

- ffd04b0: The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) write every `<dimen>` in dp. The nine px-valued tokens, `primitives_radius_full`, `primitives_border_width_none`, `_sm`, `_md` and `_lg`, `primitives_grid_gutter` and `_margin`, and `primitives_touch_min` and `_comfortable`, were written in `px`, which Android reads as device pixels, so on a 3x phone the 44px touch target was about 15dp and a 1px border a third of a dp. A Kozmos px is a CSS pixel, which is a dp, as `KozmosDimensions` writes its lengths and as Compose's parts draw these ones (`border(1.dp)`, `44.dp`): each is now its number in dp (`44dp`, `1dp`). No name or number changes, only the unit, so an app that reads these through `R.dimen` gets three times the size it got on a 3x screen, the size it was meant to have. The lengths written as `<integer>` (layout spacing, sizing and radius) and the type scale written as unitless `<string>`s are unchanged. The fix is in the token build, which `@kozmos-ds/styles` and React take their stylesheet's tokens from, so they are named here, but their CSS is byte for byte what it was.
- 7aa497a: The Android resources (`dist/android/src/main/res/values/colors.xml` and `values-night/colors.xml`) link in an app. The six semantic radii, `semantics_radius_none`, `_marker`, `_control`, `_container`, `_panel` and `_pill`, were written as references to `@dimen/primitives_layout_radius_*`, but those primitives are unitless numbers, written as `<integer>`s, so no such dimen existed and every app that built against these resources failed to link (`resource dimen/primitives_layout_radius_200 … not found`). Each radius is now its value in dp: 0dp, 4dp, 16dp, 20dp, 24dp and 9999dp, the same lengths as Compose's `KozmosDimensions` (which emits no pill; a pill is a shape there). No other resource changes. The fix is in the token build, which `@kozmos-ds/styles` and React take their stylesheet's tokens from, so they are named here, but their CSS is byte for byte what it was: only the Android resources change.

## 0.8.1

### Patch Changes

- bfc1ce8: The two border roles' descriptions name the parts each one draws on the web, in SwiftUI and in Compose. No value changes.
  - `--semantics-border-subtle` no longer names the file dropzone, which is drawn in the input border, or list rows, whose dividers the platforms draw in different colours. It now also names tooltips, listboxes, and the dividers in menus and tables.
  - `--semantics-border-input` no longer names the switch, whose track is the muted foreground, the progress track, a fill with no edge, or the toast's action, which is not drawn in it. It now names the fields one by one, a select's trigger, and the slider's track.

## 0.8.0

### Minor Changes

- 8ceb3bb: Density tokens (decision 82): `@kozmos-ds/tokens/css/density.css` sets the control sizes for both densities. Touch, the default, is on `:root` and on `[data-kozmos-density='touch']`, at today's sizes: buttons 44, icon buttons 44 and 48, text fields 44. Compact is on `[data-kozmos-density='compact']`: buttons 32, 40 and 48; icon buttons 28, 32 and 40; text fields 40. The sizes are in rem (44 is `2.75rem`), so the controls follow the reader's font size as before. `ThemeProvider density` and `DensityScope` set the attribute. The tokens are web only; the iOS and Android outputs are unchanged.

### Patch Changes

- 08207f4: Three descriptions no longer describe LocationPin's old look. No value changes.
  - `--semantics-accent-fill` no longer names a featured LocationPin: the SDK's featured tile has no accent (decision 81). The accent still draws the Featured tag and the edge of its card.
  - The theme fill (decision 59) no longer names a filled LocationPin. A selected pin is theme 600, as the SDK's sprite is.
  - The category colours are for a category's tile and chip. LocationPin takes no tint now (decision 79); the map's category markers come from the sprite.

## 0.7.0

### Minor Changes

- da7c7a7: `Semantics.Scrollbar.thumb` and `thumbHover` (GAP-139): the thumb of Kozmos's thin scrollbar and the thumb under the pointer, foreground 500 and 400, 3:1 on the page in both themes (in the contrast contract). CSS `--semantics-scrollbar-thumb` and `--semantics-scrollbar-thumb-hover`, and the JS, Swift, Kotlin and Figma outputs carry them.

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
