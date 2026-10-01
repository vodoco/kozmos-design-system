# Visual review

Kozmos checks how every story looks on every pull request, for free. It replaced Chromatic, which
stopped comparing screenshots when its free quota ran out (every pull request from #60 on 2026-09-23
had no visual review), at a price Olcay chose not to pay (decision 11, 2026-09-27).

## What it checks

Every story in the built Storybook, in the **light and the dark theme**, drawn by Chromium in the
official Playwright image (`mcr.microsoft.com/playwright:v1.58.2-noble`) and compared with a
**baseline committed beside the code**: `tests/visual/baselines/<story-id>--<theme>.png`.

- **One renderer.** Baselines are drawn only in that image, on CI or on your machine through Docker,
  so the same fonts and the same Chromium draw both sides of every comparison. A bare Mac draws text
  differently and must never record a baseline.
- **Only the drawing.** Each screenshot is cropped to what paints (text, images, controls, anything
  with a fill, border, shadow or outline, portals included), so a button's baseline is about 94×60 px
  and 1 KB.
- **Nothing from outside.** The suite refuses every request that is not to its own Storybook: remote
  photos become one grey pixel, and Pointr's taxonomy symbols a filled circle, and Google Fonts are refused, so text is drawn in the image's own
  fonts, which never update underneath a baseline. Map canvases (WebGL, from tiles) and the slots of
  outside symbols are **masked** (drawn as solid magenta): their size and place are compared, their
  pixels are not. A symbol scaled into its slot rasterised a pixel or two differently from run to run.
- **Sensitive to token changes.** Colours are compared at `threshold: 0.02`: this permits tiny
  anti-aliasing rounding differences. Playwright's default tolerance passed a whole token step
  (the Skeleton's move from background/100 to /200) as unchanged. See the configuration's
  measured comparison; this is not a claim of byte-identical screenshots.
- **Still.** The clock is fixed (2026-01-15 10:30 UTC), `Math.random` is seeded, animations and
  transitions are prevented before the first render, the caret is hidden, and the page asks for reduced motion.
- **Opting out.** Give a story the tag `no-visual`, with a comment saying why.

The suite is `tests/visual/stories.visual.ts`; its configuration is `playwright.visual.config.ts`;
CI runs it in `.github/workflows/visual.yml` ("Visual Review").

## Reading a difference

When a pull request draws a story differently, the "Visual Review" check fails:

1. The job's **summary** lists each story and theme that differs, and what Playwright measured.
2. The **`visual-report` artifact** is Playwright's report: for each difference, the baseline, the
   new drawing and a highlighted difference, with a slider. Download it and open `index.html`, or run
   `pnpm test:visual:report` after a local run.

## Accepting a change

If the difference is what you meant, record new baselines. They are committed with your change, so
**the pull request's "Files changed" shows each baseline before and after**, with GitHub's image
views (2-up, swipe, onion skin). Approving the pull request approves the look.

- **With Docker** (`pnpm test:visual:update`) records the baselines of the stories that changed.
  Build first:
  ```bash
  pnpm exec turbo run build --filter=@kozmos-ds/react...
  pnpm --filter @kozmos-ds/docs build-storybook
  pnpm test:visual:update          # or: pnpm test:visual:update --grep "chip"
  ```
  then commit `tests/visual/baselines`. Only drawings that fail the comparison are redrawn, so
  "Files changed" shows real changes and nothing else; baselines of deleted stories are pruned.
- **Without Docker**: in GitHub's Actions tab, run **Visual Regression** on your branch with
  **record** ticked. It redraws the drawings that fail the comparison, prunes the baselines of
  stories that no longer exist, and commits the result to your branch. A commit pushed by a workflow
  starts no checks, so push again (or re-run the checks) to see them pass.

`pnpm test:visual` compares without recording, as CI does. Extra arguments go to Playwright in both
scripts, e.g. `--grep chip`.

**On a Mac, it draws what CI draws.** Both scripts run the image's amd64 build, the one CI uses, even
on Apple silicon (under emulation). Measured on 2026-09-28 on an M-series Mac:

- **Compare, amd64:** every story, 634 drawings, in about 4 to 5 minutes; all equal to CI's.
- **Compare, native arm64:** about 1 minute, also all equal, but only within the review's tolerance:
  arm64 draws a few anti-aliased pixels one level apart (149 pixels of one drawing).
- **Record, amd64:** byte-identical to CI's baselines.
- **Record, native arm64:** would commit those one-level differences beside CI's pixels, so don't.

For a quick check, `VISUAL_PLATFORM=linux/arm64 pnpm test:visual` compares natively; never record
that way.

## When it fails for no reason

A story that draws differently on two runs of the same code is a bug in the story or the suite, not
bad luck: the suite has no retries on purpose. Find what moves (a timer, a random value, a remote
resource, an animation that JavaScript drives) and still it, or tag the story `no-visual` with the
reason.

Two such bugs were found by running the review on a slower machine (2026-09-28):

- **The suite photographed Storybook's loading spinner.** It waited for `#storybook-root`, which
  is in the page from the first byte, and then for network idle. It now waits for Storybook's own
  `sb-show-main`, and fails with the story's name if the error display shows instead.
- **A story raced its own timer.** Progress's Default story went from 13 to 66 after 500ms, so a
  fast machine drew 66 and a slow one 13. A story draws the state it means from the start; the
  motion lives in its own story tagged `no-visual`.

The suite fixes `Date`, not timers.

A further timing defect was reproduced on 2026-10-01: disabling entrance animations only
after rendering left floor-tooltip SVG arrows with different edge pixels, despite identical
final geometry and stable successive screenshots. Installing the stillness stylesheet before
application code ran matched the existing baseline; changing only that timing reproduced
the failed CI drawing. `tests/visual/stillness.visual.ts` checks the component's first computed
styles, including its pseudo-element, so a late-only suppression cannot regress unnoticed.
This does not change production motion, mask arrows, or relax comparison tolerances.
