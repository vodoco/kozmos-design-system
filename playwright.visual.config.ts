import { defineConfig, devices } from "@playwright/test";

// Kozmos's own visual review: every story, in both themes, compared with a
// baseline committed beside the code that draws it. It replaces Chromatic,
// which stopped comparing when its free quota ran out (#60 onwards).
// docs/visual-review.md says how to read a difference and how to accept one.
//
// Run it inside the Playwright image (`pnpm test:visual`), never on a bare
// Mac: the baselines are drawn by that image's Chromium and fonts, which is
// what CI uses, and a Mac draws text differently.

const port = Number(process.env.VISUAL_PORT ?? 6199);

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "*.visual.ts",
  // One baseline per story and theme, shared by CI and a local run in the
  // image: no platform suffix, because only one platform ever draws them.
  snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A difference is an answer, not bad luck. A story that draws differently
  // twice in a row is a bug in the story or the suite, to be fixed.
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "visual-report" }],
    ["json", { outputFile: "visual-report/results.json" }],
  ],
  outputDir: "visual-results",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      // Exact colours. Playwright's default tolerance (0.2 in pixelmatch's
      // YIQ space, a delta of 1,409) passed the Skeleton's move from
      // background/100 to /200 (#E3E4E8 to #C7CAD1, a delta of 351) as
      // unchanged: a whole token step, the change a design system most
      // needs to see. The image draws the same pixels every run (608 of 630
      // baselines came out byte-identical from two runs), and pixelmatch
      // still sets anti-aliased edges aside.
      threshold: 0,
    },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: "en-GB",
    timezoneId: "UTC",
    // Components that move rest under this preference (GAP-50), so what is
    // drawn is their still state.
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium" }],
  // This suite's own server for this checkout's static Storybook, on a port of
  // its own: never whatever another worktree has listening on 6006.
  webServer: {
    command: `node scripts/visual/serve-storybook.mjs ${port}`,
    url: `http://127.0.0.1:${port}/index.json`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
