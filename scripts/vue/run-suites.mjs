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
 *
 * VUE_SUITES runs some of them, by name (`themes,owned-css`): CI splits
 * each browser's four suites across two shards, so no shard nears its time
 * limit as the stories grow. A name that is not a suite fails the run.
 */
import { spawnSync } from "node:child_process";

const SUITES = [
  "scripts/check-vue-themes.mjs",
  "scripts/check-vue-owned-css.mjs",
  "scripts/check-vue-token-references.mjs",
  "scripts/check-vue-interactions.mjs",
];

const nameOf = (suite) =>
  suite.replace(/^scripts\/check-vue-/, "").replace(/\.mjs$/, "");
const wanted = process.env.VUE_SUITES?.split(",")
  .map((name) => name.trim())
  .filter(Boolean);
const unknown = (wanted ?? []).filter(
  (name) => !SUITES.some((suite) => nameOf(suite) === name),
);
if (unknown.length) {
  console.error(
    `VUE_SUITES names no suite: ${unknown.join(", ")} (the suites: ${SUITES.map(nameOf).join(", ")})`,
  );
  process.exit(1);
}
const chosen = wanted
  ? SUITES.filter((suite) => wanted.includes(nameOf(suite)))
  : SUITES;

const results = chosen.map((suite) => {
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
