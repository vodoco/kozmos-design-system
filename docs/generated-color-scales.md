# Generated Colour Scales

Scope for making the colour ramps derive from a base, so that changing the base
regenerates every step. Written 2026-09-02. Not started.

## Why

Every step of every ramp is a hand-typed hex. `Primitives.Colors.background` is
thirteen literals, `foreground` eleven, `theme` eleven; `build.mjs` contains no
interpolation and no colour library. So "make the background pink" means
hand-editing thirteen values and hoping they stay evenly spaced — and the two
steps added on 2026-09-02, `background/25` and `/50`, are two more literals in
the same file, because there was nowhere else to put them.

This is the radius problem again, in colour. A value that depends on another
value, stored as a literal, goes stale the moment the thing it depends on moves.
Three fixed radii went stale in one day before the plugin stopped writing
numbers and started deriving them. The ramps have the same shape and have simply
not been asked to move yet.

## What the ramps look like today

Measured in OKLab lightness, which is what the eye actually reads as "evenly
spaced" — not RGB, where equal numeric steps bunch in the midtones.

```
background   L per step:  0:100  25:98  50:96  100:92  200:84  300:75  400:67
                          500:58  600:50  700:41  800:31  900:21  1000:0
             ΔL per step: 2.1 1.8 4.2 | 8.1 8.5 8.4 8.7 8.6 8.8 9.6 10.0 | 21.3

theme        L per step:  0:97  100:89  200:80  300:72  400:64  500:53  600:51
                          700:45  800:38  900:32  1000:25
             ΔL per step: 8.4 8.2 8.3 7.8 | 11.5  2.2 | 6.0 6.4 6.6 6.8
```

Two things stand out, and both are exactly where a human pinned a value:

- **Both grey ramps jump ΔL 21 at the black end.** `900 → 1000` is `#17191C →
#000000`, more than twice the ~9 of every other step. `foreground` is the
  mirror and has the same jump. Pure black was pinned as the endpoint and the
  scale was not asked to reach it evenly.
- **`theme` 500 and 600 are nearly the same colour.** ΔL 2.2 between them,
  against 11.5 on the step before. `500` is the brand blue and was placed by
  hand; `600` was never moved to compensate, so two adjacent steps do the job
  of one and the scale has a kink at the exact point the product uses most.

The rest is remarkably even — `background` 100 through 900 sits within
8.1–10.0 throughout. So this is not a rescue. It is formalising a scale that
already mostly obeys the rule, and fixing the two places it does not.

## What "generated" should mean here

A ramp is defined by a **base** and a **curve**, and the steps are computed.

- **Greys** (`background`, `foreground`): a tint — the slight blue in `#E3E4E8`
  — plus a lightness curve from the page colour to its opposite. `foreground`
  is `background` reflected, and should be generated as exactly that rather
  than authored twice.
- **Hue ramps** (`theme`, `emotional`): the brand colour is the anchor and must
  survive to the pixel — it is the brand. The scale bends around it in OKLCH,
  holding hue, easing chroma toward the ends, and stepping lightness evenly.
  That is what removes the 500/600 kink without moving 500.
- **Dark** is the same base with the lightness curve reversed, generated, not a
  second hand-authored file. Today the dark ramps are independent literals and
  nothing checks that they mirror.

OKLCH, not RGB or HSL. RGB interpolation bunches in the midtones and HSL
lightness is not perceptual; both produce ramps that measure even and look
wrong. OKLCH is the current standard for this and needs no dependency — the
conversion is about sixty lines and already exists in
`scripts/check-nested-radius.mjs`'s sibling, the contrast checker, in its
luminance half.

## Decisions to make before starting

1. **Which values are anchors.** The brand colour at `theme/500` certainly.
   Whether `background/0` stays pure white and `/1000` pure black, or whether
   the ends get the same tint as the middle — which is what would remove the
   ΔL 21 jump. Pure black text on tinted grey is a look; so is tinted black.
   That is a design call.
2. **Whether existing steps may move.** Generation will not reproduce the
   hand-picked hexes exactly. Most will shift by a ΔE the eye cannot see; the
   two defects above will shift visibly, because fixing them is the point. This
   is a library-wide visual change: the visual review redraws every story, and
   those drawings are what gets reviewed (`visual-review.md`).
3. **Where generation runs.** Recommended: a script that writes _values_ into
   `tokens-light.json` and `tokens-dark.json` and preserves everything else,
   because those files carry `com.figma.variableId` in `$extensions` and the
   IDs are what the Figma bindings pin. Regenerate the numbers, never the
   structure. Paired with `pnpm tokens:color:check`, which fails when an
   authored value drifts from what the generator would produce — the same
   pattern as `tokens:radius:check`.
4. **The 25/50 question, generalised.** Once steps are generated, adding one is
   a curve change rather than a hex. Worth deciding whether the scale wants a
   fixed set of names or a density, and whether `emotional` (four steps today)
   joins the same system.

## Two more things the generator has to reconcile

Found on 2026-09-03, while adding the border roles.

**`Semantics.Surface` is not on the ramp.** Its four steps are hand-typed
hexes — `#FFFFFF`, `#F8F9FA`, `#E9ECEF`, `#DEE2E6` — and none of them is a
`background` step. `Surface.100` is `#F8F9FA` where `background/25` is
`#F7F8FA`: close enough to look like a mistake and far enough to be one. They
predate the ramp and nothing reconciles them, so a generated ramp would leave
Surface behind unless it is folded in at the same time. It is used by the
native outputs as well as the plugin, so this is not a cosmetic tidy.

**The dark ramp is a different hue from the light one.** Light greys are cool
and blue-tinted (`#747B8B`); the dark steps of the same rows are warm
(`#8B8474`, `#A29D90`, `#B9B5AC`). The two ramps are near mirror images in
lightness and opposites in temperature, which is visible when toggling modes
and is invisible in any per-mode review. A generated pair would hold hue
constant across modes by construction — that is most of the argument for
generating them.

## What it costs

Two sessions, in order:

1. **The generator and the check**, run against the current values first. It
   should reproduce every step within a stated ΔE tolerance except the two
   known defects, which it should report. That run is the proof the curve is
   right before anything moves.
2. **The visual pass.** Regenerate, rebuild `packages/react`, record the
   visual review's new baselines, and read them in the pull request. Then the
   Figma run, since every colour variable in the file changes value.

Prerequisite: `tokens:contrast:check` staying green across its pairs in both
themes, which the generator should run as its own last step.

## What this is not

Not a rebrand and not a palette redesign. The brand colour does not move, the
step names do not change, and a component that reads `background/100` today
reads a value within a hair of `#E3E4E8` afterwards. The deliverable is that
the _next_ rebrand is one line.
