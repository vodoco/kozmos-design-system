import { defineConfig, devices } from "@playwright/test";

const PORT = 5181;

/**
 * End-to-end checks against the built site, served the way a static host
 * serves it. Run `pnpm build` first; `pnpm test:e2e` does not build.
 */
export default defineConfig({
  testDir: "tests",
  // The screenshot run is for people, on demand (tests/screenshots.spec.ts).
  testIgnore: process.env.SCREENSHOTS ? [] : ["**/screenshots.spec.ts"],
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `node scripts/serve-static.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
