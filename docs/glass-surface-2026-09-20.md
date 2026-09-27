# The glass surface role, 20 September 2026

The coding agent, on Olcay's answer to the navigation stage's second decision
([navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md) §5): not white at 90 %, not
opaque, but "glass-like material for each platform" — which the design system had ruled and not
built ([ds-handoff.md](ds-handoff.md) §5.13, "a glass surface role is added, composed from the
`Semantics.Effect.glass` values that already exist"). Built on iOS, React and Android, the
manoeuvre card and the route summary on it, the three web map cards after. Branch
`claude/pointr-browse-repairs`, pushed.

| Commit    | What                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| `60cca79` | The token emitted natively (`KozmosEffects.swift`, `.kt`); the SwiftUI role; the card and the summary on it      |
| `cae0b91` | The web's `.kozmos-surface-glass` from the token; `GlassSurface`; five surfaces on the role; raw colours 32 → 20 |
| `c72a06d` | The Compose role — the tint and the edge; the card and the summary on it; goldens re-recorded                    |
| `bfb035c` | `tokens:glass:check`: the token, its native emission, the web's rule and every consumer agree                    |
| the last  | This report, the log, the guide, the index                                                                       |

## 1. What the role is, on each platform

`Semantics.Effect.glass` — opacity 0.7, blur 20, saturation 1.8, noise 0.03, border 0.2,
refraction 0.4, the same in both themes — is the source. The tokens build now emits it to the
native platforms as it emits the elevation roles, refusing a mode that disagreed.

- **Web**: `.kozmos-surface-glass`, an owned rule in `owned-components.css`: the theme's glass
  colour (white in light, black in dark, already `--kozmos-glass-rgb`) at the token's opacity;
  `backdrop-filter: blur(20px) saturate(1.8)` read from the token's variables; a 1px light edge at
  the token's border opacity; the plain colour under `prefers-reduced-transparency`. The design
  config switches it off through two variables it sets only while its own
  `accessibility.reduceTransparency` is on; otherwise the token is the value — the config's
  slider-driven `--glass-*` numbers (blur 22 by default) stay the Button's glass variant's.
  `GlassSurface` is the role as a component; a component that is itself a landmark applies the
  class to its own element.
- **iOS**: `kozmosGlassSurface(shape)`: the background colour at the token's opacity over the
  system's thin material, which blurs what shows through — the material's blur and saturation
  are the system's, not the token's numbers — and a light edge at the token's border opacity;
  the plain background colour when Reduce Transparency is on.
- **Android**: `KozmosGlassSurfaceDefaults.tint` and `.border`, and
  `Modifier.kozmosGlassSurface(shape)` for a node that is not a `Surface`: the tint and the edge
  alone. Compose blurs a node's own content (`Modifier.blur`, API 31), not what lies behind it,
  and a backdrop blur needs a capture of the layer beneath that the framework does not offer.
  Recorded as the role's shape there, not papered over.

**On the role now:** the manoeuvre card and both layouts of the route summary on all three
platforms; on the web also FeedbackCard, SaveLocationCard and RoutingInputGroup, whose
hand-rolled `bg-white/70 dark:bg-black/70 backdrop-blur-3xl ring-1 …` — the "missing surface"
the raw-value ratchet named — is gone: 32 raw colours become 20, and the baseline is lowered to
lock it in.

## 2. Two things found on the way

**Liquid Glass renders black in a hosted snapshot.** The first iOS build used the system's
`glassEffect` where iOS 26 offers it, as Olcay's answer allowed. On the iOS 26.5 simulator every
render test of a surface on it then read black — the card, the summary, the new glass test —
where the same tests on iOS 18.4 (the material path) passed. CI's simulator step and the
package's pixel evidence both run on 26.5. So the material composition is the role on every iOS
version, and the system's glass is a decision (§5), not a default.

**The scoped preflight beat the role's edge.** On chromium, firefox and webkit alike, the built
stylesheet's `.kozmos-surface-glass` set the tint and the filter but its 1px edge computed to
0px in Tailwind's grey: the legacy preflight's `*` reset lives inside `@scope ([data-kozmos-root])`
with `:scope` specificity, and a scoped declaration wins over an unscoped one of equal
specificity by proximity, whatever the order. The plugin's own escape is the `kozmos-reset`
class, which the preflight excludes and the foundations restyle; the role and its five consumers
carry it, as the Navbar does. The owned-CSS suite now measures the role in both themes so this
cannot come back unseen.

## 3. Verified

| Check                                                                                  | Result                                                                                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tokens:build`; the other native outputs unchanged                                     | ok; `KozmosShadows`/`KozmosDimensions` identical to the package copies                                                              |
| `tokens:glass:check` (new), `tokens:elevation:check`, `tokens:raw:check`               | ok; ok; colour 20 across 7 (from 32), locked                                                                                        |
| Package, `swift test` on macOS                                                         | 82, from 81                                                                                                                         |
| Glass and navigation render tests, iOS 26.5 and 18.4                                   | 11 of 11 on each, once the material path replaced the system's glass                                                                |
| React unit tests, lint, build, typecheck (react, docs)                                 | 510 in 118 files (3 new); clean; ok; ok                                                                                             |
| `components:classes:check`, contract parity, `docs:snippets:check`                     | ok; ok; 346 identifiers                                                                                                             |
| `test:owned-css`, chromium / firefox / webkit, with and without @scope                 | PASS on each, the role's tint, filter and edge measured in both themes                                                              |
| `test:navigation`, chromium / firefox / webkit                                         | 20 of 20 on each, on the glass role                                                                                                 |
| Storybook docs check                                                                   | 103 pages at two widths, 174 snippet sections, axe                                                                                  |
| `test:css-build`                                                                       | 9 pass                                                                                                                              |
| Android, `verifyPaparazziDebug`                                                        | passed; a new golden of the surface over red, the three navigation goldens re-recorded on the role                                  |
| Package, iOS 26.5, iPhone 17 Pro, baselines skipped; iOS 18.4, iPhone 16, baselines on | 97, from 94; 99, from 96                                                                                                            |
| CI's simulator step, `node scripts/check-ios-poi.mjs`                                  | 52                                                                                                                                  |
| The QA app's flow UI test, iPhone 17 Pro                                               | passed on the glass card and summary (the building at launch was Central Parking that run, two steps; item G of the Pointr handoff) |

Not run: Chromatic; Android on a device or emulator; the Vue wrapper. Not done: the Figma side —
the importer paints the Button's glass variant from its own literals and has no glass surface
style; drift to reconcile through the plugin, with the token as the source.

## 4. Change it yourself

| Behaviour                       | Where                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The numbers                     | `packages/tokens/src/tokens-light.json` and `-dark.json`, `Semantics.Effect.glass` (synced with Figma's variables)                                                   |
| The native emission             | `packages/tokens/build.mjs`: `glassEffect`, the `ios-swift/effects` and `android-compose/effects` formatters; then `pnpm tokens:build` and `pnpm tokens:native:copy` |
| The web rule and its off switch | `packages/react/src/styles/owned-components.css`: `.kozmos-surface-glass`; `src/context/design-config.ts`: the two `--kozmos-surface-glass-*` variables              |
| The web component               | `packages/react/src/components/GlassSurface/` (component, test, story, docs)                                                                                         |
| The iOS role                    | `packages/ios/Sources/KozmosGlassSurface.swift`; its test `Tests/KozmosTests/KozmosGlassSurfaceTests.swift`                                                          |
| The Android role                | `packages/android/src/main/java/com/kozmos/components/GlassSurface/GlassSurface.kt`; its golden test under `test/…/glasssurface/`                                    |
| Who is on the role              | `scripts/check-glass-parity.mjs` §4 lists them and fails when one leaves it or hand-rolls glass again                                                                |
| The browser evidence            | `scripts/check-owned-css.mjs` (the role's computed values); `tests/integration/owned-css-host.tsx` renders it                                                        |

## 5. Decisions for Olcay

1. **The system's Liquid Glass on iOS 26.** It renders black in a hosted snapshot, so a surface
   on it is invisible to the package's pixel tests and to CI's simulator step. Keep the material
   composition (the tests see it), or adopt Liquid Glass and give up that evidence for every glass
   surface; a third way is Liquid Glass behind a parameter the products opt into, with the tests
   on the default.
2. **The adaptive map shell's sheet.** The prototype's bottom sheet is blurred glass too; the
   shell's panel is still the plain background on all three platforms. Put it on the role — a
   shell change, measured — or leave the sheet opaque.
3. **The Button's glass variant** still draws from the design config's slider numbers on the web
   (blur 22 by default) and as white at 16 % with no blur on iOS and Android. Move it onto the
   role's token, or leave it as the Button's own effect.

## 6. Later the same night: solid by default, glass on request

Olcay's answers to §5: the default is not to be glass-like — glass is an option beside solid;
the shell's sheet goes on the surface with the compact detent; the Button's glass variant moves
onto the token. So the role became a **surface style** on every platform (`04bce5a`, `480471f`,
`e6898e3`): `KozmosSurfaceStyle` and `kozmosSurface(shape, style:)` on iOS, `Surface` with
`variant` and `surfaceClass()` on the web, `KozmosSurfaceStyle` with `KozmosSurfaceDefaults` and
`Modifier.kozmosSurface(shape, style)` on Android. **Solid** — the background colour with the
subtle border — is the default; **glass** is the role as built. The manoeuvre card, the route
summary, FeedbackCard, SaveLocationCard and RoutingInputGroup take `surface`, solid unless asked;
the Pointr QA app, the fixture playground and the Storybook navigation examples ask for glass,
the prototype's look. The three web map cards therefore change from their old hand-rolled glass
to solid by default — the ruling applied to them as to everything.

Measured: on iOS, solid whole, glass translucent, glass solid under Reduce Transparency, the
navigation tests on the solid default; on the web, both variants in both themes in the owned-CSS
suite (the solid one opaque in the background colour with a 1px subtle edge) on three engines,
513 unit tests, the parity check reading the consumers through `surfaceClass`; on Android, a
golden of both styles over red and the navigation goldens re-recorded on the solid default.

Final gates on the surface style: the package 98 on iOS 26.5 and 100 on 18.4, CI's simulator step
52, the QA app's flow UI test on the glass card and summary, `test:navigation` 20 of 20 on three
engines, the Storybook docs check, `verifyPaparazziDebug`.

Left from §5: the system's Liquid Glass — Olcay did not choose it; glass stays the material
composition, measured. Next, in his order: the shell's sheet on the surface style with the
compact detent; the Button's glass variant onto the token; then the transition arrows and the
search sheet.

## 7. Later still: the Button's glass variant onto the token

Olcay's third answer: one glass on every platform. The Button's and the IconButton's glass
variant drew white at 16 % with no blur on iOS and Android, and on the web the design config's
slider-driven `glass` utility (blur 22 by default) with a raw `hover:bg-white/10`. It is now the
glass surface (`5d9c980`, `1f10259`, `45b35b5`): on iOS `kozmosSurface(shape, style: .glass)`
behind a small helper that leaves every other variant's fill, corner and edge exactly as they
were — the pinned baselines on 18.4 still match; on Android `KozmosSurfaceDefaults`' tint and
edge, the button through Material's border, the icon button through a border on its root; on the
web the surface's declarations written into `.kozmos-button-glass` (`@apply` will not take an
owned class; `tokens:glass:check` holds the two rules to the same token variables) with the
spotlight the design config still drives and a hover a tenth more of the tint. The label is the
ink colour on every platform. The last raw palette class in the owned CSS went with it: the
ratchet stands at 19 across 6.

Measured: over pure red, the iOS glass button's and icon button's middles are the tint over what
shows through — both tests fail against the old chip; the Android golden of both over red; the
owned-CSS suite asserts the glass button's filter (blur 20, saturate 1.8) and tint (0.7) in both
themes on chromium, firefox and webkit.

| Check                                                              | Result                                                |
| ------------------------------------------------------------------ | ----------------------------------------------------- |
| Package, iOS 26.5 (baselines skipped); iOS 18.4 with the baselines | 104, from 102; 106, from 104                          |
| `node scripts/check-ios-poi.mjs`                                   | 52                                                    |
| React: Button and IconButton tests, build, classes, raw, parity    | 19; ok; ok; 19 across 6, locked; ok                   |
| `test:owned-css`, chromium / firefox / webkit                      | PASS on each, with the glass button's filter and tint |
| Storybook docs check; `test:navigation` on chromium                | passed; 20 of 20                                      |
| Android, `verifyPaparazziDebug`                                    | passed; a new golden of the glass buttons             |

What the design config's `glass` utility still drives: its own consumers and the button's
spotlight; the `GlassSettingsPanel` dev tool keeps its sliders, but no Kozmos component reads
them for its surface any more.
