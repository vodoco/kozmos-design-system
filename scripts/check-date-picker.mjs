/**
 * DatePicker opens Kozmos's calendar (decision 105), in a real browser, on
 * the built package (packages/react/tests/integration/date-picker-host.tsx).
 *
 * - Which field: where the browser's own picker button can give way
 *   (Chromium, which hides it; WebKit, which draws none), Kozmos's button
 *   opens the calendar and the browser's is gone, its tab stop with it;
 *   where it cannot (Firefox 146), the field is the browser's, untouched.
 *   The page reads it from the engine's CSS, never its name; this check
 *   holds each engine to the answer measured on 21 Oct 2026.
 * - The dialog, as the WAI-ARIA date picker dialog: the button opens it,
 *   and so do Alt+Down Arrow and F4 in the field, where Chromium's own
 *   picker would open; focus goes to the field's day, or today, and stays in
 *   the calendar; a choice types the day into the field (its change event
 *   with it) and Escape changes nothing, and either closes it and returns
 *   focus to the button.
 * - Figma's panel (2262:43097): 6 under the field, from its start edge, 12
 *   inside, the Control corner; the button as tall as the field at its end.
 * - The browser's typing still works in the field.
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

const { code, css } = await buildReactFixture("date-picker-host.tsx");
const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();
// Measured on 21 Oct 2026: Chromium 145 and WebKit 26.0 give way, Firefox
// 146 cannot (Mozilla bug 2051201). A new engine version that changes its
// answer fails here first, and this table and the docs follow.
const KOZMOS = { chromium: true, webkit: true, firefox: false }[engine];
const failures = [];
const BASE = {
  defaultValue: "2026-05-25",
  today: "2026-05-22",
  locale: "en-US",
};

async function scenario(name, mount, run) {
  const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>DatePicker</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.datePicker.mount(mount), mount);
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

const field = (page) => page.locator('input[type="date"]');
const trigger = (page) =>
  page.getByRole("button", { name: "Choose date", includeHidden: true });
const activeName = (page) =>
  page.evaluate(
    () =>
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.textContent,
  );
const pickerOpen = (page) =>
  page.evaluate(() => {
    try {
      return document.querySelector('input[type="date"]').matches(":open");
    } catch {
      return null; // WebKit 26.0 has no :open
    }
  });
/** Closed: the dialog gone, after its exit animation. */
const closed = (page) =>
  page.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 });

await scenario(
  `the field is ${KOZMOS ? "Kozmos's, its button the calendar's" : "the browser's, untouched"} in ${engine}`,
  { props: BASE },
  async (page) => {
    const detected = await page.evaluate(
      () =>
        CSS.supports("selector(::-webkit-calendar-picker-indicator)") ||
        CSS.supports("selector(::-webkit-datetime-edit)"),
    );
    assert.equal(detected, KOZMOS, "the engine's CSS answers as measured");
    assert.equal(
      await trigger(page).count(),
      KOZMOS ? 1 : 0,
      "Kozmos's button",
    );
    assert.equal(
      await field(page).getAttribute("data-picker"),
      KOZMOS ? "kozmos" : null,
    );
    // Tab stops from before to after: the field's three segments, then
    // Kozmos's button; Firefox's own button is a fourth stop of the field.
    await page.getByRole("button", { name: "before" }).focus();
    const stops = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const name = await activeName(page);
      if (name === "after") break;
      stops.push(name);
    }
    if (KOZMOS) {
      assert.equal(
        stops.at(-1),
        "Choose date",
        "Kozmos's button ends the field",
      );
      assert.equal(stops.length, 4, `three segments and the button: ${stops}`);
    } else {
      assert.equal(stops.length, 4, "three segments and Firefox's button");
      assert.ok(!stops.includes("Choose date"));
    }
    const box = await field(page).evaluate((input) => {
      const s = getComputedStyle(input);
      return {
        end: s.paddingInlineEnd,
        height: input.getBoundingClientRect().height,
      };
    });
    assert.equal(
      box.end,
      KOZMOS ? "48px" : "12px",
      "room for the button, or none",
    );
    if (KOZMOS) {
      const button = await trigger(page).boundingBox();
      const input = await field(page).boundingBox();
      assert.equal(
        button.height,
        input.height,
        "the button is as tall as the field",
      );
      assert.equal(button.width, input.height, "and square");
      assert.equal(
        button.x + button.width,
        input.x + input.width,
        "at its end",
      );
      assert.equal(button.y, input.y);
    }
  },
);

await scenario(
  "the browser's typing still works in the field",
  { props: BASE },
  async (page) => {
    const before = await field(page).inputValue();
    const box = await field(page).boundingBox();
    await page.mouse.click(box.x + 44, box.y + box.height / 2);
    await page.keyboard.press("ArrowUp");
    const after = await field(page).inputValue();
    assert.notEqual(after, before, "ArrowUp on a segment changes the date");
    assert.match(after, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(await page.evaluate(() => window.datePicker.changes), [
      after,
    ]);
    assert.equal(
      await page.getByRole("dialog").count(),
      0,
      "and opens nothing",
    );
  },
);

if (KOZMOS) {
  for (const dir of ["ltr", "rtl"])
    await scenario(
      `the button opens the calendar on the field's day, ${dir}`,
      { props: BASE, dir },
      async (page) => {
        await trigger(page).click();
        const dialog = page.getByRole("dialog", { name: "Visit date" });
        await dialog.waitFor();
        assert.equal(await dialog.getAttribute("aria-modal"), "true");
        assert.equal(await trigger(page).getAttribute("aria-expanded"), "true");
        assert.equal(await activeName(page), "Monday, May 25, 2026");
        assert.equal(
          (await pickerOpen(page)) ?? false,
          false,
          "the browser's own stays shut",
        );
        // Its exit and entry animations settled, the panel is Figma's.
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished)),
        );
        const panel = await dialog.evaluate((node) => {
          const s = getComputedStyle(node);
          const r = node.getBoundingClientRect();
          return {
            x: r.x,
            right: r.right,
            y: r.y,
            width: r.width,
            padding: s.paddingTop,
            radius: s.borderTopLeftRadius,
          };
        });
        const input = await field(page).boundingBox();
        assert.equal(
          Math.round(panel.y - (input.y + input.height)),
          6,
          "6 under the field",
        );
        if (dir === "ltr")
          assert.equal(
            Math.round(panel.x),
            Math.round(input.x),
            "from its start",
          );
        else
          assert.equal(
            Math.round(panel.right),
            Math.round(input.x + input.width),
            "from its start, at the right",
          );
        assert.equal(panel.padding, "12px", "12 inside");
        assert.equal(panel.radius, "16px", "the Control corner");
        assert.equal(
          Math.round(panel.width),
          276 + 24 + 2,
          "as wide as the calendar",
        );
        // Focus stays in the calendar.
        for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
        assert.ok(
          await page.evaluate(() =>
            document
              .querySelector('[role="dialog"]')
              .contains(document.activeElement),
          ),
          "Tab stays in the dialog",
        );
      },
    );

  await scenario(
    "a choice types the day into the field, closes, and returns focus",
    { props: BASE },
    async (page) => {
      await trigger(page).click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await closed(page);
      assert.equal(await field(page).inputValue(), "2026-05-26");
      assert.deepEqual(await page.evaluate(() => window.datePicker.changes), [
        "2026-05-26",
      ]);
      assert.equal(
        await activeName(page),
        "Choose date",
        "focus is back on the button",
      );
      assert.equal(await trigger(page).getAttribute("aria-expanded"), "false");
      // The pointer too.
      await trigger(page).click();
      await page
        .getByRole("gridcell", { name: "Friday, May 29, 2026" })
        .click();
      await closed(page);
      assert.equal(await field(page).inputValue(), "2026-05-29");
    },
  );

  await scenario(
    "Escape changes nothing, closes, and returns focus",
    { props: { ...BASE, defaultValue: undefined } },
    async (page) => {
      await trigger(page).click();
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await activeName(page),
        "Friday, May 22, 2026",
        "an empty field opens on today",
      );
      await page.keyboard.press("Escape");
      await closed(page);
      assert.equal(await field(page).inputValue(), "");
      assert.deepEqual(
        await page.evaluate(() => window.datePicker.changes),
        [],
      );
      assert.equal(await activeName(page), "Choose date");
    },
  );

  for (const key of ["Alt+ArrowDown", "F4"])
    await scenario(
      `${key} in the field opens Kozmos's calendar, not the browser's`,
      { props: BASE },
      async (page) => {
        await field(page).focus();
        await page.keyboard.press(key);
        await page.getByRole("dialog").waitFor();
        assert.equal(
          (await pickerOpen(page)) ?? false,
          false,
          "the browser's own stays shut",
        );
        assert.equal(await activeName(page), "Monday, May 25, 2026");
      },
    );

  await scenario(
    "a controlled field takes the day through its own onChange",
    { props: { ...BASE, defaultValue: undefined }, controlled: "2026-05-25" },
    async (page) => {
      await trigger(page).click();
      await page
        .getByRole("gridcell", { name: "Thursday, May 14, 2026" })
        .click();
      await closed(page);
      assert.equal(await field(page).inputValue(), "2026-05-14");
      assert.deepEqual(await page.evaluate(() => window.datePicker.opens), [
        true,
        false,
      ]);
    },
  );

  await scenario(
    "disabled and read only, the button cannot open it",
    { props: { ...BASE, readOnly: true } },
    async (page) => {
      assert.equal(await trigger(page).isDisabled(), true);
      await field(page).focus();
      await page.keyboard.press("F4");
      await page.waitForTimeout(200);
      assert.equal(await page.getByRole("dialog").count(), 0);
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} DatePicker scenario(s) failed.`);
  process.exit(1);
}
console.log("\nDatePicker: every scenario passed.");
