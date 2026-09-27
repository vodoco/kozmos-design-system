import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // The Storybook to measure, not whichever one happens to be on 6006. This
    // machine runs several worktrees, and a suite that silently compares against
    // another branch's build is worse than no suite.
    baseURL: process.env.STORYBOOK_URL ?? "http://localhost:6006",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  // With STORYBOOK_URL set the caller owns the server — CI serves the built
  // static Storybook, and a local run points at one it started itself. Without
  // it, start the dev server, and never reuse one already listening: that is
  // how a run ends up measuring another worktree.
  webServer: process.env.STORYBOOK_URL
    ? undefined
    : {
        command: "npx turbo run dev --filter=@kozmos-ds/docs",
        url: "http://localhost:6006",
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
});
