/**
 * Calendar in a real browser, on the built package
 * (packages/react/tests/integration/calendar-host.tsx), with and without
 * every @scope rule, as Figma draws its panels (decision 104): DatePicker's
 * month (438:4292, panel 2262:43097) and DateRangePicker's two months
 * (443:10939, panel 2262:45377).
 *
 * - The geometry: 36 days in one month and 40 in a range, 4 apart; the 32
 *   header and its two 32 buttons 4 apart; 8 from the header to the 20
 *   weekday row and 8 from it to the days; the Control corner; two months 12
 *   apart; right to left, the week starts at the right and the chevrons turn.
 * - The colours, light and dark, each from its token: the chosen day the
 *   theme fill under the theme foreground, today background/100, a range's
 *   days theme/100, another month's days and the weekdays ink 400.
 * - The keyboard: one tab stop after the two buttons; the arrows, Home,
 *   End, Page Up and Down, with Shift a year, Enter and Space; right to left
 *   the arrows follow the page; a visible focus ring.
 * - The locale: German weeks start on Monday, Egyptian ones on Saturday in
 *   Arabic-Indic digits, in Firefox from CLDR's table (it has no weekInfo).
 * - What a reader is told: each day's full date and its chosen state.
 *
 * Run with ADAPTIVE_BROWSER=firefox or webkit for the other engines, as CI
 * does in test:react-interactions.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("calendar-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const unscoped = require("postcss").parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());
const browser = await launchFixtureBrowser();
const failures = [];

const TODAY = "2026-05-22";
const SINGLE = { defaultValue: "2026-05-25", today: TODAY, locale: "en-US" };
const RANGE = {
  mode: "range",
  months: 2,
  defaultValue: { start: "2026-05-21", end: "2026-05-25" },
  today: TODAY,
  locale: "en-US",
};

async function scenario(name, stylesheet, mount, run) {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Calendar</title><style>body{margin:0}</style><style>${stylesheet}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.calendar.mount(mount), mount);
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

/** Boxes, styles and the tokens they should come from, read in the page. */
const measure = (page) =>
  page.getByTestId("calendar").evaluate((root, TODAY) => {
    // To a hundredth: Firefox places boxes at fractions of a pixel.
    const round = (n) => Math.round(n * 100) / 100;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: round(r.x),
        y: round(r.y),
        w: round(r.width),
        h: round(r.height),
      };
    };
    const token = (name) => {
      const probe = document.createElement("i");
      probe.style.color = `var(${name})`;
      root.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const style = (el) => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        radius: s.borderRadius,
        font: `${s.fontSize}/${s.lineHeight}/${s.fontWeight}`,
        transform: s.transform,
      };
    };
    const months = [...root.querySelectorAll(".kozmos-calendar-month")];
    const days = [...root.querySelectorAll("[data-day]")];
    const at = (iso) => root.querySelector(`[data-day="${iso}"]`);
    return {
      months: months.map(box),
      header: box(root.querySelector(".kozmos-calendar-header")),
      title: style(root.querySelector(".kozmos-calendar-title")),
      nav: [...root.querySelectorAll(".kozmos-calendar-nav-button")].map(
        (button) => ({
          ...box(button),
          icon: style(button.querySelector("svg")),
        }),
      ),
      weekday: {
        ...box(root.querySelector("th")),
        ...style(root.querySelector("th")),
        text: [...months[0].querySelectorAll("th")].map((th) => th.textContent),
        firstX: box(months[0].querySelector("th")).x,
      },
      first: box(days[0]),
      second: box(days[1]),
      nextWeek: box(days[7]),
      firstText: months[0].querySelector("td").textContent,
      day: style(days[0]),
      selected: style(at("2026-05-25")),
      inRange: at("2026-05-23") && style(at("2026-05-23")),
      today: style(at(TODAY)),
      plain: style(at("2026-05-12")),
      outside: style(root.querySelector("[data-outside]")),
      tokens: {
        fill: token("--primitives-colors-theme-500"),
        fillInk: token(
          "--components-primary-buttons-themed-button-foreground-content-idle",
        ),
        today: token("--primitives-colors-background-100"),
        range: token("--primitives-colors-theme-100"),
        ink: token("--primitives-colors-foreground-0"),
        muted: token("--primitives-colors-foreground-400"),
      },
    };
  }, TODAY);

const transparent = "rgba(0, 0, 0, 0)";

for (const [mode, stylesheet] of [
  ["full", css],
  ["without @scope", unscoped.toString()],
]) {
  for (const theme of ["light", "dark"]) {
    await scenario(
      `one month, ${theme}, ${mode}: Figma's DatePicker panel`,
      stylesheet,
      { props: SINGLE, theme },
      async (page) => {
        const m = await measure(page);
        assert.equal(m.first.w, 36, "a day is 36 wide");
        assert.equal(m.first.h, 36, "a day is 36 tall");
        assert.equal(m.second.x - m.first.x, 40, "days are 4 apart");
        assert.equal(m.nextWeek.y - m.first.y, 40, "weeks are 4 apart");
        assert.equal(m.months[0].w, 7 * 36 + 6 * 4, "the month is its days");
        assert.equal(m.header.h, 32, "the header is 32");
        assert.equal(
          m.weekday.y - (m.header.y + m.header.h),
          8,
          "header to weekdays 8",
        );
        assert.equal(
          m.first.y - m.weekday.y,
          20 + 8,
          "a 20 weekday row, 8 to the days",
        );
        assert.deepEqual(
          m.nav.map(({ w, h }) => [w, h]),
          [
            [32, 32],
            [32, 32],
          ],
          "the buttons are 32",
        );
        assert.equal(
          m.nav[1].x - (m.nav[0].x + m.nav[0].w),
          4,
          "the buttons are 4 apart",
        );
        assert.equal(
          m.nav[1].x + 32,
          m.months[0].x + m.months[0].w,
          "next ends the header",
        );
        assert.equal(m.day.radius, "16px", "the Control corner");
        assert.equal(m.title.font, "14px/20px/500", "the month title");
        assert.equal(m.weekday.font, "12px/16px/400", "the weekdays");
        assert.equal(m.day.font, "14px/20px/400", "the days");
        assert.deepEqual(m.weekday.text, [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ]);
        const t = m.tokens;
        assert.equal(m.selected.bg, t.fill, "the chosen day is the theme fill");
        assert.equal(m.selected.color, t.fillInk, "under the theme foreground");
        assert.equal(m.today.bg, t.today, "today is background/100");
        assert.equal(m.plain.bg, transparent, "another day has no fill");
        assert.equal(m.plain.color, t.ink, "and full ink");
        assert.equal(
          m.outside.color,
          t.muted,
          "another month's days are ink 400",
        );
        assert.equal(m.weekday.color, t.muted, "the weekdays are ink 400");
        assert.equal(m.nav[0].icon.color, t.muted, "the chevrons are ink 400");
      },
    );
  }

  await scenario(
    `two months, a range, ${mode}: Figma's DateRangePicker panel`,
    stylesheet,
    { props: RANGE },
    async (page) => {
      const m = await measure(page);
      assert.equal(m.first.w, 40, "a range's day is 40");
      assert.equal(m.second.x - m.first.x, 44, "4 apart");
      assert.equal(m.months.length, 2);
      assert.equal(m.months[0].w, 7 * 40 + 6 * 4, "a month is its days");
      assert.equal(
        m.months[1].x - (m.months[0].x + m.months[0].w),
        12,
        "months 12 apart",
      );
      assert.equal(
        m.inRange.bg,
        m.tokens.range,
        "a range's days are theme/100",
      );
      assert.equal(m.inRange.color, m.tokens.ink);
      assert.equal(m.selected.bg, m.tokens.fill, "its end is the theme fill");
      assert.equal(m.nav.length, 2, "one pair of buttons");
      assert.ok(
        m.nav[0].x > m.months[1].x,
        "the buttons end the last month's header",
      );
    },
  );

  await scenario(
    `right to left in Arabic (Egypt), ${mode}`,
    stylesheet,
    { props: { ...RANGE, locale: "ar-EG" }, dir: "rtl" },
    async (page) => {
      const m = await measure(page);
      assert.ok(
        m.months[0].x > m.months[1].x,
        "the first month is at the right",
      );
      assert.ok(
        m.weekday.firstX > m.months[0].x + m.months[0].w - 41,
        "the week starts at the right",
      );
      // The engine's own short name for a Saturday (23 May 2026): WebKit's
      // CLDR names it otherwise than Chromium's and Firefox's.
      const saturday = await page.evaluate(() =>
        new Intl.DateTimeFormat("ar-EG", {
          weekday: "short",
          timeZone: "UTC",
        }).format(Date.UTC(2026, 4, 23)),
      );
      assert.equal(m.weekday.text[0], saturday, "on Saturday");
      assert.equal(m.firstText, "٢٥", "in Arabic-Indic digits");
      assert.ok(m.nav[0].x < m.months[1].x + 80, "the buttons are at the left");
      for (const button of m.nav)
        assert.match(
          button.icon.transform,
          /^matrix\(-1, 0, 0, 1/,
          "the chevrons turn",
        );
    },
  );
}

await scenario(
  "German weeks start on Monday",
  css,
  { props: { ...SINGLE, locale: "de-DE" } },
  async (page) => {
    const m = await measure(page);
    assert.equal(m.weekday.text[0], "Mo");
    assert.equal(m.firstText, "27", "27 April, a Monday");
    await page
      .getByRole("grid", { name: "Mai 2026" })
      .getByRole("gridcell", { name: "Montag, 25. Mai 2026" })
      .waitFor();
  },
);

const active = (page) =>
  page.evaluate(
    () =>
      document.activeElement?.getAttribute("data-day") ??
      document.activeElement?.textContent,
  );

await scenario(
  "the keyboard, one month",
  css,
  { props: { ...SINGLE, defaultValue: "2026-05-25" } },
  async (page) => {
    await page.getByRole("button", { name: "before" }).focus();
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute("aria-label"),
      ),
      "Previous month",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(
      await active(page),
      "2026-05-25",
      "the chosen day is the grid's tab stop",
    );
    const ring = await page.evaluate(
      () => getComputedStyle(document.activeElement).boxShadow,
    );
    assert.notEqual(ring, "none", "the focus is drawn");
    for (const [key, expected] of [
      ["ArrowRight", "2026-05-26"],
      ["ArrowDown", "2026-06-02"],
      ["ArrowUp", "2026-05-26"],
      ["ArrowLeft", "2026-05-25"],
      ["End", "2026-05-30"],
      ["Home", "2026-05-24"],
      ["PageDown", "2026-06-24"],
      ["PageUp", "2026-05-24"],
      ["Shift+PageDown", "2027-05-24"],
      ["Shift+PageUp", "2026-05-24"],
    ]) {
      await page.keyboard.press(key);
      assert.equal(await active(page), expected, key);
    }
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    assert.deepEqual(
      await page.evaluate(() => window.calendar.values),
      ["2026-05-24", "2026-05-25"],
      "Enter and Space choose",
    );
    assert.deepEqual(
      await page.evaluate(() => window.calendar.months),
      ["2026-06", "2026-05", "2026-06", "2026-05", "2027-05", "2026-05"],
      "leaving the month shows the next",
    );
    await page.keyboard.press("Tab");
    assert.equal(await active(page), "after", "one tab stop in the grid");
    const snapshot = await page.getByRole("grid").ariaSnapshot();
    assert.match(snapshot, /gridcell "Monday, May 25, 2026" \[selected\]/);
    assert.match(snapshot, /gridcell "Tuesday, May 26, 2026"/);
  },
);

await scenario(
  "the keyboard, right to left",
  css,
  { props: SINGLE, dir: "rtl" },
  async (page) => {
    await page.getByRole("gridcell", { name: "Monday, May 25, 2026" }).focus();
    await page.keyboard.press("ArrowLeft");
    assert.equal(await active(page), "2026-05-26", "left is the next day");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    assert.equal(await active(page), "2026-05-24", "right is the day before");
  },
);

await scenario(
  "the keyboard, a range across two months",
  css,
  { props: { ...RANGE, defaultValue: undefined } },
  async (page) => {
    await page
      .getByRole("gridcell", { name: "Thursday, May 28, 2026" })
      .click();
    await page.keyboard.press("ArrowDown");
    assert.equal(await active(page), "2026-06-04", "into the second month");
    assert.equal(
      await page
        .locator('[data-day="2026-05-31"]')
        .getAttribute("data-in-range"),
      "true",
      "the focused day shows where the range would end",
    );
    await page.keyboard.press("Enter");
    assert.deepEqual(await page.evaluate(() => window.calendar.values), [
      { start: "2026-05-28" },
      { start: "2026-05-28", end: "2026-06-04" },
    ]);
    assert.deepEqual(await page.evaluate(() => window.calendar.months), []);
  },
);

await scenario(
  "bounds and closed days",
  css,
  {
    props: { ...SINGLE, min: "2026-05-10", max: "2026-06-20" },
    weekends: true,
  },
  async (page) => {
    const sunday = page.getByRole("gridcell", { name: "Sunday, May 10, 2026" });
    assert.equal(await sunday.getAttribute("aria-disabled"), "true");
    // Pressed anyway: a day that cannot be chosen says so and ignores it.
    await sunday.click({ force: true });
    await page
      .getByRole("gridcell", { name: "Saturday, May 9, 2026" })
      .click({ force: true });
    assert.deepEqual(await page.evaluate(() => window.calendar.values), []);
    assert.equal(
      await page.getByRole("button", { name: "Previous month" }).isDisabled(),
      true,
    );
    const muted = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.color = "var(--primitives-colors-foreground-400)";
      document.querySelector("[data-kozmos-root]").appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return [
        value,
        getComputedStyle(document.querySelector('[data-day="2026-05-09"]'))
          .color,
        getComputedStyle(document.querySelector('[data-day="2026-05-16"]'))
          .color,
      ];
    });
    assert.equal(muted[1], muted[0], "a day out of bounds is ink 400");
    assert.equal(muted[2], muted[0], "a closed day is ink 400");
  },
);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} Calendar scenario(s) failed.`);
  process.exit(1);
}
console.log("\nCalendar: every scenario passed.");
