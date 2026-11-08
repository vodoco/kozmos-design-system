#!/usr/bin/env node
/**
 * The four Vue browser suites, one after the other, in ADAPTIVE_BROWSER's
 * engine: themes, owned CSS, token references, interactions
 * (scripts/vue/coverage.mjs says what each holds). Every suite runs whatever
 * the one before it found, so one red suite never hides another, and the
 * run fails if any did.
 *
 *   pnpm --filter @kozmos-ds/docs build-storybook:vue
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit pnpm test:vue-stories
 */
import { spawnSync } from "node:child_process";

const SUITES = [
  "scripts/check-vue-themes.mjs",
  "scripts/check-vue-owned-css.mjs",
  "scripts/check-vue-token-references.mjs",
  "scripts/check-vue-interactions.mjs",
];

const results = SUITES.map((suite) => {
  console.log(`\n▶ ${suite}`);
  const started = Date.now();
  const { status } = spawnSync(process.execPath, [suite], {
    stdio: "inherit",
  });
  return { suite, status, seconds: Math.round((Date.now() - started) / 1000) };
});

console.log(
  `\nVue browser suites (${process.env.ADAPTIVE_BROWSER ?? "chromium"}):`,
);
for (const { suite, status, seconds } of results)
  console.log(`  ${status === 0 ? "PASS" : "FAIL"}  ${suite}  ${seconds}s`);
process.exit(results.every(({ status }) => status === 0) ? 0 : 1);
