/**
 * The map shell's bottom sheet, driven in a real browser against the
 * Storybook build, as the prototype was driven
 * (docs/pointr-prototype-initial-sheet-2026-09-20.md, scripts/measure-prototype-sheet.cjs):
 * the three detents' heights, a drag anywhere on the sheet snapping to the
 * nearest detent, the handle's tap and keys, the content's scroll locked
 * below the largest detent, and the collapsed detent resting on a peek anchor.
 *
 *   STORYBOOK_URL=http://127.0.0.1:6012 node scripts/check-map-sheet.mjs
 *   ADAPTIVE_BROWSER=firefox|webkit for the other engines.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = path.resolve("test-results/map-sheet", engine);
fs.mkdirSync(output, { recursive: true });

const results = [];
const browser = await launchFixtureBrowser();
const near = (actual, expected, tolerance, message) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} is not within ${tolerance} of ${expected}`);

try {
  const open = async (id) => {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
    await page.locator("aside").first().waitFor();
    // The sheet takes its first detent at once: an eased first placement
    // flew in from the shell's top.
    const moving = await page
      .locator("aside")
      .first()
      .evaluate((node) =>
        node
          .getAnimations()
          .filter((animation) => ["top", "height"].includes(animation.transitionProperty)).length,
      );
    if (moving > 0) errors.push("the sheet's first placement eased");
    await page.waitForTimeout(600);
    return { context, page, errors };
  };
  const finish = async ({ context, page, errors }, name, checks) => {
    const record = { name, status: "pending" };
    try {
      await checks(page);
      assert.deepEqual(errors, [], `${name}: page errors`);
      record.status = "ok";
    } catch (error) {
      record.status = `FAIL ${error.message}`;
    } finally {
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      await context.close();
    }
    results.push(record);
    console.log(`${record.status === "ok" ? "ok  " : "FAIL"} ${name}${record.status === "ok" ? "" : ` — ${record.status}`}`);
  };
  const sheetBox = (page) =>
    page.locator("aside").first().evaluate((node) => {
      const r = node.getBoundingClientRect();
      const shell = node.parentElement.getBoundingClientRect();
      return { top: r.top, height: r.height, shellHeight: shell.height, shellTop: shell.top, x: r.left + r.width / 2 };
    });
  // Wait for the sheet to stop moving, not for a fixed 400ms.
  //
  // CI run 36030288431 read 462.875 where it wanted 362.88 on webkit — a
  // difference of 100, which is exactly the drag that had just been made. The
  // sheet had not snapped back to its detent yet: the spring outlived a fixed
  // waitForTimeout(400) on a cold runner that had just downloaded the browser.
  //
  // "Stopped" here means BOTH of the sheet's moving parts have stopped: its
  // height, which a drag or a key changes, and its scroller's scrollTop, which
  // a wheel changes while the height stands still. Watching only the height
  // was not enough — run 36046003995 then failed on "the list is not back at
  // its top", because settle returned the instant a wheel began and the scroll
  // was still running when scrollTop was read.
  //
  // Readings are a frame apart on purpose: WebKit reports a running
  // animation's values as they move, so two reads inside one task can differ
  // for a sheet that is not moving at all.
  const settle = async (page, timeout = 4000) => {
    const stopped = await page
      .locator("aside")
      .first()
      .evaluate(
        (node, limit) =>
          new Promise((resolve) => {
            const started = performance.now();
            // Two equal frames are not proof on their own: settle can be
            // called before a wheel has begun, and would then read the value
            // it is waiting to see change. So require the reading to hold for
            // three frames AND for at least 120ms to have passed, which is
            // still a third of the fixed wait this replaces.
            const HOLD = 3;
            const FLOOR = 120;
            let steady = 0;
            const read = () => {
              const scroller = node.querySelector(":scope > div:last-of-type");
              return [
                node.getBoundingClientRect().height,
                scroller ? scroller.scrollTop : 0,
              ];
            };
            let last = null;
            const tick = () => {
              const now = read();
              const still =
                last &&
                Math.abs(now[0] - last[0]) < 0.05 &&
                Math.abs(now[1] - last[1]) < 0.05;
              steady = still ? steady + 1 : 0;
              if (steady >= HOLD && performance.now() - started >= FLOOR) {
                resolve(true);
                return;
              }
              if (performance.now() - started > limit) {
                resolve(false);
                return;
              }
              last = now;
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }),
        timeout,
      );
    // Still moving after four seconds is a defect worth failing on, not a slow
    // machine worth waiting longer for.
    assert.ok(stopped, `the sheet was still moving after ${timeout}ms`);
  };

  // A drag that starts with two small moves, so the sheet decides and takes
  // the pointer before it leaves the sheet — a finger's first move is small.
  const drag = async (page, x, y, dy) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    const sign = Math.sign(dy);
    await page.mouse.move(x, y + sign * 3);
    await page.mouse.move(x, y + sign * 8);
    for (let step = 1; step <= 10; step += 1) {
      await page.mouse.move(x, y + sign * 8 + (dy - sign * 8) * (step / 10));
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(150); // the flick is spent: distance alone decides
    await page.mouse.up();
    await settle(page);
  };

  await finish(await open("product-sdk-adaptivemapshell--sheet"), "detents-and-drag", async (page) => {
    let box = await sheetBox(page);
    const H = box.shellHeight;
    near(box.height, H * 0.54, 1.5, "the sheet does not rest at medium");
    const x = box.x;
    const onSheet = () => box.shellTop + H - box.height + 40; // 40 under the sheet's top: the header row
    // +100 stays at medium; +200 reaches large.
    await drag(page, x, onSheet(), -100); box = await sheetBox(page);
    near(box.height, H * 0.54, 1.5, "a short drag left medium");
    await drag(page, x, onSheet(), -200); box = await sheetBox(page);
    near(box.height, H * 0.94, 1.5, "+200 from medium is not large");
    // At large the content is free: an upward drag on a row is the list's
    // (a mouse drag selects rather than scrolls, so the sheet simply stays),
    // and the wheel scrolls it.
    const rows = page.getByTestId("sheet-row");
    const firstRow = await rows.first().boundingBox();
    await drag(page, x, firstRow.y + firstRow.height + 20, -150); box = await sheetBox(page);
    near(box.height, H * 0.94, 1.5, "an upward drag at large moved the sheet instead of leaving it to the list");
    const scroller = page.locator("aside > div").last();
    await page.mouse.move(x, onSheet() + 200); await page.mouse.wheel(0, 300); await settle(page);
    const scrolledTop = await scroller.evaluate((node) => node.scrollTop);
    assert.ok(scrolledTop > 100, `the list did not scroll at large: ${scrolledTop}`);
    // A downward drag on a scrolled list is the list's: the sheet stays.
    await drag(page, x, onSheet() + 200, 120); box = await sheetBox(page);
    near(box.height, H * 0.94, 1.5, "a downward drag on a scrolled list moved the sheet");
    // Back at its top, the same drag moves the sheet.
    await page.mouse.move(x, onSheet() + 200); await page.mouse.wheel(0, -3000); await settle(page);
    assert.equal(await scroller.evaluate((node) => node.scrollTop), 0, "the list is not back at its top");
    await drag(page, x, onSheet() + 200, 200); box = await sheetBox(page);
    near(box.height, H * 0.54, 1.5, "−200 from large is not medium");
    // Below large the list is locked: a wheel moves nothing, and an upward drag on a row grows the sheet.
    await page.mouse.move(x, onSheet() + 200); await page.mouse.wheel(0, 300); await settle(page);
    assert.equal(await scroller.evaluate((node) => node.scrollTop), 0, "the list scrolled at medium");
    await drag(page, x, onSheet() + 200, -160); box = await sheetBox(page);
    near(box.height, H * 0.94, 1.5, "a drag on a row did not grow the sheet");
    await drag(page, x, onSheet(), 200); box = await sheetBox(page);
    near(box.height, H * 0.54, 1.5, "−200 from large is not medium (second time)");
    await drag(page, x, onSheet(), 200); box = await sheetBox(page);
    near(box.height, Math.max(H * 0.2, 112), 1.5, "−200 from medium does not reach collapsed");
    // The handle: a tap cycles, the keys step.
    const handle = page.getByRole("slider", { name: "Panel height" });
    await handle.click();
    // A new detent eases, where the first placement and a host resize do not.
    assert.ok(
      await page
        .locator("aside")
        .first()
        .evaluate((node) => node.getAnimations().some((animation) => animation.transitionProperty === "top")),
      "a new detent did not ease",
    );
    await settle(page); box = await sheetBox(page);
    near(box.height, H * 0.54, 1.5, "a handle tap from collapsed is not medium");
    await handle.focus(); await page.keyboard.press("ArrowUp"); await settle(page); box = await sheetBox(page);
    near(box.height, H * 0.94, 1.5, "ArrowUp from medium is not large");
    assert.equal(await handle.getAttribute("aria-valuetext"), "Expanded");
    await page.keyboard.press("Home"); await settle(page); box = await sheetBox(page);
    near(box.height, Math.max(H * 0.2, 112), 1.5, "Home is not collapsed");
  });

  if (engine === "chromium") {
    // A finger, through Chromium's touch events: below large the sheet takes
    // the touch (touch-action none); at large the list scrolls natively
    // (pan-up, then pan-y) and hands a downward touch back only at its top.
    await finish(await open("product-sdk-adaptivemapshell--sheet"), "touch-handoff", async (page) => {
      const cdp = await page.context().newCDPSession(page);
      const touchDrag = async (x, y, dy) => {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        const sign = Math.sign(dy);
        for (const step of [3, 8]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + sign * step }] });
        for (let step = 1; step <= 10; step += 1) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + sign * 8 + (dy - sign * 8) * (step / 10) }] });
          await page.waitForTimeout(16);
        }
        await page.waitForTimeout(150);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await settle(page);
      };
      let box = await sheetBox(page);
      const H = box.shellHeight;
      const x = box.x;
      const rowY = () => box.shellTop + H - box.height + 120; // on the second row
      await touchDrag(x, rowY(), -200); box = await sheetBox(page);
      near(box.height, H * 0.94, 1.5, "a touch on a row at medium did not grow the sheet to large");
      const scroller = page.locator("aside > div").last();
      await touchDrag(x, rowY(), -200); box = await sheetBox(page);
      near(box.height, H * 0.94, 1.5, "a touch at large moved the sheet");
      const scrolledTop = await scroller.evaluate((node) => node.scrollTop);
      assert.ok(scrolledTop > 60, `a touch at large did not scroll the list: ${scrolledTop}`);
      await touchDrag(x, rowY(), 400); box = await sheetBox(page);
      near(box.height, H * 0.94, 1.5, "a downward touch on a scrolled list moved the sheet");
      assert.equal(await scroller.evaluate((node) => node.scrollTop), 0, "the list did not scroll back to its top");
      await touchDrag(x, rowY(), 200); box = await sheetBox(page);
      near(box.height, H * 0.54, 1.5, "a downward touch at the list's top did not lower the sheet to medium");
    });
  }

  await finish(await open("product-sdk-adaptivemapshell--sheet-peek-anchor"), "peek-anchor", async (page) => {
    const box = await sheetBox(page);
    const H = box.shellHeight;
    const go = await page.getByTestId("card-go").boundingBox();
    const goBottomFromSheetTop = go.y + go.height - box.top;
    const expected = Math.min(Math.max(goBottomFromSheetTop + 16, H * 0.24), H * 0.72);
    near(box.height, expected, 1.5, "collapsed does not rest on the Go row");
    assert.ok(box.height > Math.max(H * 0.2, 112) + 20, `the peek is no taller than a fifth: ${box.height}`);
    const body = await page.getByTestId("card-body").boundingBox();
    assert.ok(body.y > box.top + box.height - 40, "the card's body shows under the peek");
  });
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.status !== "ok");
console.log(`${results.length - failed.length}/${results.length} map-sheet checks passed on ${engine}`);
if (failed.length) process.exit(1);
