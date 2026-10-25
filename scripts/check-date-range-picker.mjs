/**
 * DateRangePicker on Kozmos's range calendar (decisions 104 and 105, W3), in
 * a real browser, on the built package
 * (packages/react/tests/integration/date-range-picker-host.tsx).
 *
 * - Which fields: as DatePicker's (scripts/check-date-picker.mjs), Kozmos's
 *   button ends each field where the browser's own can give way (Chromium,
 *   WebKit); in Firefox 146 both fields are the browser's, as on main.
 * - One panel for the range, as Figma's (443:10939, 2262:45377): 6 under
 *   the two fields from their start edge, two months 12 apart where the
 *   window has room, one where it has not; each field's button opens it on
 *   that field's day and gets focus back.
 * - A range by pointer, with the days under the pointer showing it, and by
 *   keyboard; a start clears the end; the end closes it.
 * - Alt+Down Arrow and F4 in either field open it, refused to the browser.
 * - One label for the range (GAP-051): hideFieldLabels reads the fields'
 *   labels and shows none, with no row left for them.
 *
 * Run with ADAPTIVE_BROWSER=firefox or webkit for the other engines, as CI
 * does in test:react-interactions.
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("date-range-picker-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
// As measured for DatePicker on 21 Oct 2026 (check-date-picker.mjs).
const KOZMOS = { chromium: true, webkit: true, firefox: false }[engine];
// A bare date field's tab stops, measured on 21 Oct 2026: three segments in
// every engine but WebKit on Linux (Playwright's, as CI's), which draws a
// plain field, one stop. Holding the bare field to this keeps the count
// below from following a field that has lost its segments.
const PLAIN_FIELD = engine === "webkit" && process.platform === "linux";
const failures = [];
const RANGE = {
  defaultValue: { start: "2026-05-21", end: "2026-05-25" },
  today: "2026-05-22",
  locale: "en-US",
};
const TWO_MONTHS = 2 * (7 * 40 + 6 * 4) + 12 + 2 * 12 + 2;

async function scenario(
  name,
  mount,
  run,
  viewport = { width: 760, height: 760 },
) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>DateRangePicker</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.dateRange.mount(mount), mount);
    await settleLayout(page);
    await run(page);
    assert.deepEqual(errors, [], "no page errors or warnings");
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

const buttons = (page) =>
  page.getByRole("button", { name: "Choose dates", includeHidden: true });
const field = (page, name) =>
  page.getByLabel(name, { exact: true }).and(page.locator("input"));
const active = (page) =>
  page.evaluate(() => {
    const node = document.activeElement;
    return node?.getAttribute("aria-label") === "Choose dates"
      ? `Choose dates: ${document.getElementById(node.getAttribute("aria-describedby"))?.textContent}`
      : (node?.getAttribute("aria-label") ?? node?.textContent);
  });
const settled = (page) =>
  page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  );
const closed = (page) =>
  page.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 });
const values = (page) => page.evaluate(() => window.dateRange.values);

await scenario(
  `the fields are ${KOZMOS ? "Kozmos's, a button ending each" : "the browser's, as on main"} in ${engine}`,
  { props: RANGE },
  async (page) => {
    assert.equal(await buttons(page).count(), KOZMOS ? 2 : 0);
    for (const name of ["Start date", "End date"]) {
      const input = field(page, name);
      assert.equal(
        await input.getAttribute("data-picker"),
        KOZMOS ? "kozmos" : null,
      );
      assert.equal(
        await input.evaluate((node) => getComputedStyle(node).paddingInlineEnd),
        KOZMOS ? "48px" : "12px",
      );
    }
    // Tab stops: each field's segments, as a bare field has them (three, or
    // one where WebKit draws a plain field, as on Linux), then its button.
    const segments = await page
      .evaluate(() => {
        const host = document.createElement("div");
        host.innerHTML =
          '<style>#bare::-webkit-calendar-picker-indicator{display:none}</style><button id="from">from</button><input id="bare" type="date"><button id="to">to</button>';
        document.body.append(host);
      })
      .then(async () => {
        await page.locator("#from").focus();
        let count = 0;
        for (; count < 8; count++) {
          await page.keyboard.press("Tab");
          if (await page.evaluate(() => document.activeElement.id === "to"))
            break;
        }
        await page.evaluate(() =>
          document.querySelector("#bare").parentElement.remove(),
        );
        return count;
      });
    await page.getByRole("button", { name: "before" }).focus();
    const stops = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const name = await active(page);
      if (name === "after") break;
      stops.push(name);
    }
    if (KOZMOS) {
      assert.equal(
        segments,
        PLAIN_FIELD ? 1 : 3,
        "a bare field's stops in this engine, as measured",
      );
      assert.equal(
        stops.length,
        2 * (segments + 1),
        `${segments} segment stop(s) and a button, twice: ${stops}`,
      );
      assert.equal(stops[segments], "Choose dates: Start date");
      assert.equal(stops[2 * segments + 1], "Choose dates: End date");
    } else assert.ok(!stops.some((name) => name?.startsWith("Choose dates")));
  },
);

if (KOZMOS) {
  for (const dir of ["ltr", "rtl"])
    await scenario(
      `the end field's button opens two months on its day, ${dir}`,
      { props: RANGE, dir },
      async (page) => {
        await buttons(page).nth(1).click();
        const dialog = page.getByRole("dialog", { name: "Stay" });
        await dialog.waitFor();
        await settled(page);
        assert.equal(await dialog.getAttribute("aria-modal"), "true");
        assert.equal(await dialog.getByRole("grid").count(), 2, "two months");
        assert.equal(await active(page), "Monday, May 25, 2026");
        const panel = await dialog.boundingBox();
        const start = await field(page, "Start date").boundingBox();
        const end = await field(page, "End date").boundingBox();
        const bottom = Math.max(start.y + start.height, end.y + end.height);
        assert.equal(Math.round(panel.y - bottom), 6, "6 under the fields");
        assert.equal(
          Math.round(panel.width),
          TWO_MONTHS,
          "two months, 12 apart",
        );
        if (dir === "ltr")
          assert.equal(
            Math.round(panel.x),
            Math.round(start.x),
            "from their start",
          );
        else
          assert.equal(
            Math.round(panel.x + panel.width),
            Math.round(start.x + start.width),
            "from their start, at the right",
          );
        await page.keyboard.press("Escape");
        await closed(page);
        assert.equal(
          await active(page),
          "Choose dates: End date",
          "focus back on its button",
        );
        assert.deepEqual(await values(page), []);
      },
    );

  await scenario(
    "a range by pointer: the start clears the end, the days under the pointer show it, the end closes it",
    { props: RANGE },
    async (page) => {
      await buttons(page).first().click();
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await active(page),
        "Thursday, May 21, 2026",
        "the start field's day",
      );
      await page
        .getByRole("gridcell", { name: "Monday, May 18, 2026" })
        .click();
      assert.equal(await field(page, "End date").inputValue(), "");
      await page
        .getByRole("gridcell", { name: "Wednesday, June 3, 2026" })
        .hover();
      for (const day of ["2026-05-19", "2026-05-31", "2026-06-02"])
        assert.equal(
          await page
            .locator(`[data-day="${day}"]`)
            .getAttribute("data-in-range"),
          "true",
          `${day} shows the range`,
        );
      await page
        .getByRole("gridcell", { name: "Wednesday, June 3, 2026" })
        .click();
      await closed(page);
      assert.deepEqual(await values(page), [
        { start: "2026-05-18", end: "" },
        { start: "2026-05-18", end: "2026-06-03" },
      ]);
      assert.equal(await field(page, "Start date").inputValue(), "2026-05-18");
      assert.equal(await field(page, "End date").inputValue(), "2026-06-03");
      assert.equal(await active(page), "Choose dates: Start date");
    },
  );

  for (const [key, which] of [
    ["Alt+ArrowDown", "Start date"],
    ["F4", "End date"],
  ])
    await scenario(
      `${key} in the ${which.toLowerCase()} field opens it, refused to the browser, and a range by keyboard`,
      { props: { ...RANGE, defaultValue: undefined } },
      async (page) => {
        await page.evaluate(() => {
          window.heardKeys = [];
          window.addEventListener("keydown", (event) =>
            window.heardKeys.push([event.key, event.defaultPrevented]),
          );
        });
        await field(page, which).focus();
        await page.keyboard.press(key);
        await page.getByRole("dialog").waitFor();
        assert.deepEqual(await page.evaluate(() => window.heardKeys.at(-1)), [
          key === "F4" ? "F4" : "ArrowDown",
          true,
        ]);
        assert.equal(await active(page), "Friday, May 22, 2026", "today");
        await page.keyboard.press("Enter");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await closed(page);
        assert.deepEqual(await values(page), [
          { start: "2026-05-22", end: "" },
          { start: "2026-05-22", end: "2026-05-29" },
        ]);
        assert.equal(await active(page), `Choose dates: ${which}`);
      },
    );

  await scenario(
    "one month where the window has no room for two",
    { props: RANGE, width: 360 },
    async (page) => {
      await buttons(page).nth(1).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.equal(await dialog.getByRole("grid").count(), 1);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "no sideways scroll",
      );
    },
    { width: 390, height: 760 },
  );

  await scenario(
    "one label for the range (GAP-051)",
    { props: { ...RANGE, hideFieldLabels: true }, width: 420 },
    async (page) => {
      const [start, end] = [
        await field(page, "Start date").boundingBox(),
        await field(page, "End date").boundingBox(),
      ];
      assert.equal(start.y, end.y, "the fields share a line");
      const label = await page.getByText("Stay", { exact: true }).boundingBox();
      // FieldWrapper's 6 between its label and the control; no row for the
      // fields' own labels.
      assert.ok(
        start.y - (label.y + label.height) <= 8,
        "no row for the fields' labels",
      );
      for (const name of ["Start date", "End date"])
        assert.equal(
          await page.getByText(name, { exact: true }).evaluate((node) => {
            const r = node.getBoundingClientRect();
            return r.width <= 1 && r.height <= 1;
          }),
          true,
          `${name} is read, not shown`,
        );
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} DateRangePicker scenario(s) failed.`);
  process.exit(1);
}
console.log("\nDateRangePicker: every scenario passed.");
