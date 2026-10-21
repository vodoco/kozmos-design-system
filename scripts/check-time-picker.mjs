/**
 * TimePicker's list of times (decision 104, W4), in a real browser, on the
 * built package (packages/react/tests/integration/time-picker-host.tsx).
 *
 * - In every engine: no browser draws a time picker button a page cannot
 *   hide (Chromium's clock is hidden; WebKit and Firefox 146 draw none), so
 *   Kozmos's button ends the field everywhere, and the browser's typing
 *   stays.
 * - The list is Combobox's Listbox, Figma's 2262:49480: 6 under the field,
 *   as wide as it, the Control corner, 16rem tall or the room there is; it
 *   opens on the field's time, in view, and takes focus.
 * - A time chosen by key or pointer is typed into the field and closes it,
 *   focus back on the button; Escape changes nothing; Alt+Down Arrow and F4
 *   in the field open it, refused to the browser.
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

const { code, css } = await buildReactFixture("time-picker-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
const BASE = { defaultValue: "18:30", locale: "en-GB" };

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
      `<!doctype html><html lang="en"><head><title>TimePicker</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate((mount) => window.timePicker.mount(mount), mount);
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

const field = (page) => page.locator('input[type="time"][data-picker]');
const trigger = (page) => page.getByRole("button", { name: "Choose time" });
const list = (page) => page.getByRole("listbox", { name: "Opening time" });
const activeName = (page) =>
  page.evaluate(
    () =>
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.textContent,
  );
const activeOption = (page) =>
  page.evaluate(
    () =>
      document.getElementById(
        document.activeElement?.getAttribute("aria-activedescendant"),
      )?.textContent,
  );
const closed = (page) =>
  list(page).waitFor({ state: "detached", timeout: 5000 });

await scenario(
  "Kozmos's button ends the field, the browser's own gone",
  { props: BASE },
  async (page) => {
    assert.equal(await trigger(page).count(), 1);
    assert.equal(await field(page).getAttribute("data-picker"), "kozmos");
    await page.getByRole("button", { name: "before" }).focus();
    const stops = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const name = await activeName(page);
      if (name === "after") break;
      stops.push(name);
    }
    // The field's segments (two, or three with AM/PM: the engine's clock),
    // then Kozmos's button: Chromium's clock is no stop of its own any more.
    // A bare field with its own button hidden counts the segments.
    const segments = await page
      .evaluate(async () => {
        const host = document.createElement("div");
        host.innerHTML =
          '<style>#bare::-webkit-calendar-picker-indicator{display:none}</style><button id="from">from</button><input id="bare" type="time"><button id="to">to</button>';
        document.body.append(host);
        return host;
      })
      .then(async () => {
        await page.locator("#from").focus();
        let count = 0;
        for (; count < 8; count++) {
          await page.keyboard.press("Tab");
          if (await page.evaluate(() => document.activeElement.id === "to"))
            break;
        }
        return count;
      });
    // Two, or three with AM/PM; one where WebKit draws a plain field (Linux).
    assert.ok(segments >= 1 && segments <= 3, `segments: ${segments}`);
    assert.equal(stops.at(-1), "Choose time");
    assert.equal(
      stops.length,
      segments + 1,
      `the segments and the button: ${stops}`,
    );
    const [button, input] = [
      await trigger(page).boundingBox(),
      await field(page).boundingBox(),
    ];
    assert.equal(button.height, input.height, "as tall as the field");
    assert.equal(button.x + button.width, input.x + input.width, "at its end");
    assert.equal(
      await field(page).evaluate((n) => getComputedStyle(n).paddingInlineEnd),
      "48px",
    );
  },
);

await scenario(
  "the list opens on the field's time, in view, Figma's listbox",
  { props: BASE },
  async (page) => {
    await trigger(page).click();
    await list(page).waitFor();
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    assert.equal(await activeName(page), "Opening time", "the list has focus");
    assert.equal(await activeOption(page), "18:30");
    const geometry = await list(page).evaluate((node) => {
      const r = node.getBoundingClientRect();
      const option = node.querySelector('[data-active="true"]');
      const o = option.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        radius: getComputedStyle(node).borderTopLeftRadius,
        inView: o.top >= r.top && o.bottom <= r.bottom,
      };
    });
    const input = await field(page).boundingBox();
    assert.equal(
      Math.round(geometry.y - (input.y + input.height)),
      6,
      "6 under the field",
    );
    assert.equal(Math.round(geometry.x), Math.round(input.x), "from its start");
    assert.equal(
      Math.round(geometry.width),
      Math.round(input.width),
      "as wide as the field",
    );
    assert.equal(geometry.radius, "16px");
    assert.ok(geometry.height <= 256, "16rem at most");
    assert.ok(geometry.inView, "the field's time is in view");
  },
);

await scenario(
  "a time by key or pointer is typed in; Escape changes nothing",
  { props: BASE },
  async (page) => {
    await trigger(page).click();
    await list(page).waitFor();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await closed(page);
    assert.equal(await field(page).inputValue(), "19:00");
    assert.equal(
      await activeName(page),
      "Choose time",
      "focus back on the button",
    );
    await trigger(page).click();
    await page.getByRole("option", { name: "20:30" }).click();
    await closed(page);
    assert.equal(await field(page).inputValue(), "20:30");
    await trigger(page).click();
    await list(page).waitFor();
    await page.keyboard.press("Escape");
    await closed(page);
    assert.equal(await field(page).inputValue(), "20:30");
    assert.deepEqual(await page.evaluate(() => window.timePicker.changes), [
      "19:00",
      "20:30",
    ]);
  },
);

for (const key of ["Alt+ArrowDown", "F4"])
  await scenario(
    `${key} in the field opens the list, refused to the browser`,
    { props: BASE },
    async (page) => {
      await page.evaluate(() => {
        window.heardKeys = [];
        window.addEventListener("keydown", (event) =>
          window.heardKeys.push([event.key, event.defaultPrevented]),
        );
      });
      await field(page).focus();
      await page.keyboard.press(key);
      await list(page).waitFor();
      assert.deepEqual(await page.evaluate(() => window.heardKeys.at(-1)), [
        key === "F4" ? "F4" : "ArrowDown",
        true,
      ]);
    },
  );

await scenario(
  "the browser's typing still works in the field",
  { props: BASE },
  async (page) => {
    // Whatever the browser does with a bare field, it does with Kozmos's: a
    // click on the hours and ArrowUp step them in Chromium, Firefox and
    // Safari, and do nothing to WebKit's plain field on Linux.
    const bare = await page.evaluate(() => {
      const host = document.createElement("div");
      host.innerHTML =
        '<style>#bare::-webkit-calendar-picker-indicator{display:none}#bare{width:320px;height:44px;padding:0 12px 0 36px;font:14px sans-serif}</style><input id="bare" type="time" value="18:30">';
      document.body.append(host);
      return true;
    });
    assert.ok(bare);
    const bareBox = await page.locator("#bare").boundingBox();
    await page.mouse.click(bareBox.x + 44, bareBox.y + bareBox.height / 2);
    await page.keyboard.press("ArrowUp");
    const expected = await page.locator("#bare").inputValue();
    await page.evaluate(() =>
      document.querySelector("#bare").parentElement.remove(),
    );
    const box = await field(page).boundingBox();
    await page.mouse.click(box.x + 44, box.y + box.height / 2);
    await page.keyboard.press("ArrowUp");
    assert.equal(
      await field(page).inputValue(),
      expected,
      "it steps as a bare field does",
    );
    assert.equal(await list(page).count(), 0, "and opens nothing");
  },
);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} TimePicker scenario(s) failed.`);
  process.exit(1);
}
console.log("\nTimePicker: every scenario passed.");
