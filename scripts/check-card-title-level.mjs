/**
 * CardTitle's heading level (GAP-205), on the built package in a real browser
 * (packages/react/tests/integration/card-title-level-host.tsx).
 *
 * CardTitle was always an `h3`, so a card under a page titled with an `h1`
 * skipped a level and axe reported heading-order. It takes `as`, `h2` to
 * `h6`, and is an `h3` without it.
 *
 * - The Settings Metadata board's outline, an `h1` and a card titled
 *   `as="h2"`, passes axe's heading-order: the rule runs and finds nothing.
 * - Each level is that element, a heading of that level to the page's
 *   accessibility roles, named by its words; with no `as`, an `h3`.
 * - The level changes what a screen reader hears, not the title's look: its
 *   size, weight, line height and tracking match the default's at every level.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-card-title-level.mjs
 */
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("card-title-level-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
const expect = (label, actual, wanted) => {
  checked++;
  if (JSON.stringify(actual) !== JSON.stringify(wanted))
    failures.push(
      `${label}: ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`,
    );
};

try {
  // A context of its own: axe's Playwright builder needs one to run in.
  const context = await browser.newContext({
    viewport: { width: 900, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Card title level</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  await page.locator("[data-title]").first().waitFor();
  await settleLayout(page);

  // The board's outline: h1, then the card's title one level down.
  const outline = await new AxeBuilder({ page })
    .include('[data-case="outline"]')
    .withRules(["heading-order"])
    .analyze();
  expect(
    "outline: axe heading-order ran",
    outline.passes.some((rule) => rule.id === "heading-order"),
    true,
  );
  expect(
    "outline: axe heading-order violations",
    outline.violations.map(
      (rule) =>
        `${rule.id}: ${rule.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    ),
    [],
  );
  expect(
    "outline: the page's headings, in order",
    await page
      .locator('[data-case="outline"]')
      .getByRole("heading")
      .evaluateAll((headings) =>
        headings.map((heading) => heading.tagName.toLowerCase()),
      ),
    ["h1", "h2"],
  );

  const look = (title) =>
    page.locator(`[data-title="${title}"]`).evaluate((element) => {
      const style = getComputedStyle(element);
      return [
        style.fontSize,
        style.fontWeight,
        style.lineHeight,
        style.letterSpacing,
      ];
    });
  const drawn = await look("default");
  expect("default: the card title's look", drawn.slice(0, 2), ["24px", "600"]);

  for (const [title, level] of [
    ["default", 3],
    ["h2", 2],
    ["h3", 3],
    ["h4", 4],
    ["h5", 5],
    ["h6", 6],
  ]) {
    expect(
      `${title}: element`,
      await page
        .locator(`[data-title="${title}"]`)
        .evaluate((element) => element.tagName.toLowerCase()),
      `h${level}`,
    );
    expect(
      `${title}: a level-${level} heading, named by its words`,
      await page
        .getByRole("heading", {
          level,
          name: `Title ${title}`,
          exact: true,
        })
        .count(),
      1,
    );
    expect(`${title}: looks as the default does`, await look(title), drawn);
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL card title level (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS card title level: ${checked} checks — an h1 page with a card titled as="h2" passes axe's heading-order, ` +
    "each of h2 to h6 is that heading level, no as is an h3, and every level looks as the default does",
);
