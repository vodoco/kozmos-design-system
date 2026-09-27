#!/usr/bin/env node
// Writes, as Markdown, which stories the visual review found changed, for a
// CI job summary: the story and theme, and what Playwright said. The report
// artifact holds each one's baseline, the new drawing and the difference.
import { readFileSync } from "node:fs";

let results;
try {
  results = JSON.parse(readFileSync("visual-report/results.json", "utf8"));
} catch {
  console.log("## Visual review\n\nThe suite did not report: see the job log.");
  process.exit(0);
}

// Playwright colours its messages for a terminal; a summary wants text.
const colour = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const failed = [];
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const run of spec.tests ?? []) {
      const last = run.results?.at(-1);
      if (last && last.status !== "passed" && last.status !== "skipped") {
        const message = (last.error?.message ?? last.status)
          .replace(colour, "")
          .split("\n")[0];
        failed.push({ title: spec.title, message });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of results.suites ?? []) walk(suite);

const total = results.stats
  ? results.stats.expected + results.stats.unexpected + results.stats.flaky
  : "?";
console.log(`## Visual review\n`);
if (!failed.length) {
  console.log(`All ${total} drawings match their baselines.`);
} else {
  console.log(
    `${failed.length} of ${total} drawings differ from their baselines. ` +
      "Download the `visual-report` artifact and open its `index.html` to see " +
      "each baseline, the new drawing and the difference. If a change is " +
      "intended, record it (docs/visual-review.md).\n",
  );
  console.log("| Story and theme | What Playwright said |\n| --- | --- |");
  for (const { title, message } of failed) {
    console.log(`| \`${title}\` | ${message.replace(/\|/g, "\\|")} |`);
  }
}
