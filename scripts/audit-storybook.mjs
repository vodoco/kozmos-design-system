import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
import {
  assertPinnedReact,
  recordRenderers,
  renderersIn,
} from "./lib/storybook-react-pin.mjs";

// Discovery, not a replacement for stateful regressions. Every indexed story
// group is represented, with Default preferred; no hand-picked consumer list.
const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6008";
const response = await fetch(`${base}/index.json`);
assert(response.ok, "Missing Storybook index");
const groups = new Map();
const stories = Object.values((await response.json()).entries).filter(
  (story) => story.type === "story",
);
for (const story of stories) {
  if (story.type !== "story") continue;
  if (!groups.has(story.title) || story.name === "Default")
    groups.set(story.title, story);
}
assert(groups.size > 0, "No stories discovered");
const selected = (
  process.env.STORY_SCOPE === "all" ? stories : [...groups.values()]
).filter(
  (story) =>
    !process.env.STORY_FILTER ||
    new RegExp(process.env.STORY_FILTER).test(story.id),
);
assert(selected.length > 0, "Story filter matched nothing");
const scenarios = selected.flatMap((story) =>
  ["light", "dark"].flatMap((theme) =>
    [
      { width: 320, height: 568 },
      { width: 1280, height: 800 },
    ].map((viewport) => ({ story, theme, viewport })),
  ),
);
const browser = await launchFixtureBrowser();
const browserVersion = browser.version();
{
  // First, the react-dom the stories draw with: apps/docs's, by the React
  // pin, or the audit stops here (scripts/lib/storybook-react-pin.mjs).
  const page = await browser.newPage();
  await recordRenderers(page);
  await page.goto(`${base}/iframe.html?id=${selected[0].id}&viewMode=story`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page
    .waitForFunction(() => window.__kozmosRenderers?.length > 0, null, {
      timeout: 20000,
    })
    .catch(() => {});
  const renderers = await renderersIn(page);
  await page.close();
  try {
    console.log(assertPinnedReact(renderers, "The React Storybook"));
  } catch (error) {
    await browser.close();
    throw error;
  }
}
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < scenarios.length) {
    const { story, theme, viewport } = scenarios[cursor++];
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const entry = {
      id: story.id,
      title: story.title,
      theme,
      viewport,
      errors: [],
      violations: [],
      incomplete: [],
      overflow: [],
    };
    page.on("pageerror", (e) => entry.errors.push(e.message));
    try {
      await page.goto(
        `${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        { waitUntil: "domcontentloaded", timeout: 30000 },
      );
      await page
        .locator(
          '#storybook-root .kozmos-story-surface > *, [data-kozmos-portal] [role="dialog"]',
        )
        .first()
        .waitFor({ state: "attached", timeout: 20000 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        );
      });
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      entry.violations = axe.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          html: n.html,
          summary: n.failureSummary,
        })),
      }));
      entry.incomplete = axe.incomplete.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          summary: n.failureSummary,
          checks: [...n.any, ...n.all, ...n.none].map((check) => check.message),
        })),
      }));
      entry.overflow = await page.evaluate(() => {
        if (document.documentElement.scrollWidth <= innerWidth) return [];
        return [
          {
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: innerWidth,
          },
          ...[...document.querySelectorAll("#storybook-root *")]
            .filter((n) => {
              const r = n.getBoundingClientRect(),
                s = getComputedStyle(n);
              return (
                r.width > 0 &&
                (r.right > innerWidth + 1 || r.left < -1) &&
                s.position !== "absolute" &&
                s.position !== "fixed"
              );
            })
            .slice(0, 12)
            .map((n) => ({
              tag: n.tagName,
              class: n.className,
              text: n.textContent?.slice(0, 80),
              width: n.getBoundingClientRect().width,
            })),
        ];
      });
    } catch (error) {
      entry.errors.push(error.message);
    } finally {
      await context.close();
    }
    results.push(entry);
    console.log(
      `${entry.errors.length || entry.violations.length || entry.overflow.length ? "FAIL" : "PASS"} ${story.id} ${theme} ${viewport.width}: ${entry.violations.map((v) => v.id).join(",")} ${entry.overflow.length ? "overflow" : ""} ${entry.errors.join(";")}`,
    );
  }
}
try {
  await Promise.all([worker(), worker(), worker()]);
} finally {
  await browser.close();
}
results.sort((a, b) =>
  `${a.id}${a.theme}${a.viewport.width}`.localeCompare(
    `${b.id}${b.theme}${b.viewport.width}`,
  ),
);
const report = {
  browser: process.env.ADAPTIVE_BROWSER ?? "chromium",
  browserVersion,
  scope: process.env.STORY_SCOPE ?? "groups",
  groups: groups.size,
  stories: stories.length,
  selected: selected.length,
  cases: results.length,
  failed: results.filter(
    (r) => r.errors.length || r.violations.length || r.overflow.length,
  ).length,
  results,
};
const output = process.env.AUDIT_OUTPUT ?? "test-results/storybook-audit.json";
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  `Audit: ${report.failed}/${report.cases} failing; ${report.selected}/${report.stories} stories (${report.groups} groups); ${output}`,
);
process.exitCode = report.failed ? 1 : 0;
