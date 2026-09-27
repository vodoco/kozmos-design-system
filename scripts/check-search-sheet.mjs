/**
 * The search sheet's parts, measured in a real browser against the
 * Storybook build: the category grid aligns its cells at the top, so a
 * one-line label beside a two-line one keeps its square on the same edge;
 * the AI search button is a 48 circle whose gradient ring is a 2.5 band cut by
 * a mask, and the ring's gradient turns in place unless motion is reduced.
 *
 *   STORYBOOK_URL=http://127.0.0.1:6012 node scripts/check-search-sheet.mjs
 *   ADAPTIVE_BROWSER=firefox|webkit for the other engines.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = path.resolve("test-results/search-sheet", engine);
fs.mkdirSync(output, { recursive: true });

const results = [];
const browser = await launchFixtureBrowser();
const near = (actual, expected, tolerance, message) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} is not within ${tolerance} of ${expected}`);

try {
  const open = async (id, options = {}) => {
    const context = await browser.newContext({ viewport: { width: 402, height: 874 }, ...options });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
    await page.waitForTimeout(500);
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

  await finish(await open("product-sdk-browsecategoriespanel--default"), "tiles-share-a-top-edge", async (page) => {
    const tiles = page.locator(".kozmos-category-tile");
    await tiles.first().waitFor();
    const rows = await tiles.evaluateAll((nodes) =>
      nodes.slice(0, 4).map((node) => {
        const square = node.querySelector("span[aria-hidden]").getBoundingClientRect();
        const label = node.querySelectorAll(":scope > span")[1].getBoundingClientRect();
        return { squareTop: square.top, squareHeight: square.height, labelHeight: label.height, label: node.textContent.trim() };
      }),
    );
    assert.equal(rows.length, 4, "the first row has four tiles");
    const labelHeights = rows.map((r) => r.labelHeight);
    assert.ok(Math.max(...labelHeights) >= 26 && Math.min(...labelHeights) <= 16, `the row mixes one- and two-line labels: ${JSON.stringify(rows)}`);
    for (const row of rows) {
      near(row.squareHeight, 64, 1, `${row.label}: the square is not 64`);
      near(row.squareTop, rows[0].squareTop, 1, `${row.label}: its square is not on the first tile's top edge`);
    }
  });


  // The tile's count: the system's counter, brand tone, 20 tall, four beyond
  // the square's top and right edges; its spoken form is not drawn.
  await finish(await open("product-sdk-categorytile--default"), "the-count-is-a-counter-at-the-squares-top-right", async (page) => {
    const counter = page.locator('.kozmos-category-tile [data-slot="counter"]');
    await counter.waitFor();
    const m = await counter.evaluate((node) => {
      const square = node.parentElement.getBoundingClientRect();
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        squareRight: square.right, squareTop: square.top, squareWidth: square.width,
        right: box.right, top: box.top, height: box.height, width: box.width,
        background: style.backgroundColor, text: node.textContent,
      };
    });
    near(m.squareWidth, 64, 0.5, "the square is not 64");
    near(m.height, 20, 0.5, "the counter is not the system's 20 counter");
    assert.ok(m.width >= 20, `the counter is narrower than its 20 minimum: ${m.width}`);
    near(m.right, m.squareRight + 4, 0.5, "the counter does not overhang the square's right edge by 4");
    near(m.top, m.squareTop - 4, 0.5, "the counter does not overhang the square's top edge by 4");
    assert.equal(m.text, "12", `the counter does not show the count: ${m.text}`);
    assert.notEqual(m.background, "rgba(0, 0, 0, 0)", "the counter has no fill");
    const spoken = page.locator(".kozmos-category-tile .sr-only");
    assert.equal(await spoken.count(), 1, "no spoken form for the count");
    const spokenBox = await spoken.boundingBox();
    assert.ok(!spokenBox || spokenBox.width <= 1, `the spoken form is drawn: ${JSON.stringify(spokenBox)}`);
  });

  // In a sheet the POI panel paints no surface of its own: no fill, no border.
  await finish(await open("product-sdk-poidetailpanel--sheet"), "the-poi-panel-in-a-sheet-paints-no-surface", async (page) => {
    const panel = page.locator('.kozmos-poi-detail[data-presentation="sheet"]');
    await panel.waitFor();
    const m = await panel.evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, borderTop: style.borderTopWidth, borderLeft: style.borderLeftWidth, shadow: style.boxShadow };
    });
    assert.equal(m.background, "rgba(0, 0, 0, 0)", `the sheet panel paints a surface: ${m.background}`);
    assert.equal(m.borderTop, "0px", `the sheet panel keeps a top border: ${m.borderTop}`);
    assert.equal(m.borderLeft, "0px", `the sheet panel keeps a side border: ${m.borderLeft}`);
  });
  // Eight device pixels to the CSS pixel: a 2.5 band is two or three pixels
  // at 1x, antialiasing is most of it, and rays through it read anywhere
  // from nothing to three and a fifth. The band is measured in the paint
  // below, so the paint has to be worth measuring.
  await finish(await open("product-sdk-aisearchbutton--default", { deviceScaleFactor: 8 }), "ai-search-ring-turns", async (page) => {
    const button = page.getByRole("button", { name: "AI search" });
    await button.waitFor();
    const box = await button.boundingBox();
    near(box.width, 48, 1, "the button is not laid out at 48");
    near(box.height, 48, 1, "the button is not laid out at 48");
    // The layout size, not the client rect: a turning square's client rect
    // is its rotated bounds, up to 66 x root two.
    const ring = await page.locator(".kozmos-ai-search-ring").evaluate((node) => {
      const s = getComputedStyle(node);
      return { width: node.offsetWidth, height: node.offsetHeight, animationName: s.animationName, animationDuration: s.animationDuration, background: s.backgroundImage };
    });
    near(ring.width, 48, 1, "the ring is not the button's 48");
    near(ring.height, 48, 1, "the ring is not the button's 48");
    // The band is cut out of the ring by a mask, not left over between two
    // stacked circles: as a 43 disc inside a 48 circle it measured 1.93 to 3.20
    // wide around the turn in Chromium, the disc's rounded rect painting 0.44px
    // off the ring's while `offsetWidth` and `offsetLeft` — which is all this
    // check used to read — swore they were concentric.
    //
    // The band itself is measured in the paint, in `check-owned-css.mjs`, on a
    // page whose device ratio that check controls: a 2.5 band is two or three
    // device pixels at 1x and mostly antialiasing, so rays through it in a
    // Storybook viewport read anywhere from 1.7 to 2.6 whatever is drawn. Here
    // the structure is asserted, and the structure is what can be got wrong by
    // editing.
    const mask = await page.locator(".kozmos-ai-search-ring").evaluate((node) => {
      const s = getComputedStyle(node);
      return s.maskImage === "none" ? s.webkitMaskImage : s.maskImage;
    });
    assert.match(
      mask,
      /radial-gradient/,
      `the ring's band is not cut by a mask: ${mask}`,
    );
    assert.match(
      mask,
      /100% - 2\.5px/,
      `the ring's band is not cut at two and a half: ${mask}`,
    );
    // The disc is inset 2 — inside the 2.5 band — and painted before the ring,
    // so its own edge is covered and never decides where the ring ends.
    const disc = await page
      .locator(".kozmos-ai-search > span:first-of-type")
      .evaluate((node) => ({
        left: node.offsetLeft,
        width: node.offsetWidth,
        beforeTheRing: Boolean(
          node.nextElementSibling &&
            node.nextElementSibling.classList.contains("kozmos-ai-search-ring"),
        ),
      }));
    assert.equal(disc.left, 2, `the disc is not inset 2: ${JSON.stringify(disc)}`);
    assert.equal(disc.width, 44, `the disc is not 44: ${JSON.stringify(disc)}`);
    assert.ok(disc.beforeTheRing, "the disc is not painted behind the ring");
    assert.equal(ring.animationName, "kozmos-ai-search-spin", `the ring does not turn: ${ring.animationName}`);
    assert.equal(ring.animationDuration, "3.6s", `the ring's turn is not the prototype's 3.6 seconds: ${ring.animationDuration}`);
    assert.match(ring.background, /conic-gradient/, `the ring is not the conic gradient: ${ring.background}`);
    // The rainbow's stops resolve to the data colours: red first and last, blue among them.
    assert.match(ring.background, /rgb\(220, 38, 38\)/, `the ring's red is not the data red: ${ring.background}`);
    assert.match(ring.background, /rgb\(37, 99, 235\)/, `the ring's blue is not the data blue: ${ring.background}`);
    // It turns: the transform differs a moment later.
    const first = await page.locator(".kozmos-ai-search-ring").evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(400);
    const later = await page.locator(".kozmos-ai-search-ring").evaluate((node) => getComputedStyle(node).transform);
    assert.notEqual(first, later, `the ring's transform did not change over 400 ms: ${first}`);
  });

  await finish(await open("product-sdk-categoryfield--in-the-search-row"), "category-field-in-the-row", async (page) => {
    const field = page.getByRole("group", { name: "Gates, 2 places" });
    await field.waitFor();
    const box = await field.boundingBox();
    near(box.height, 48, 1, "the category field is not 48 tall");
    const styles = await field.evaluate((node) => {
      const s = getComputedStyle(node);
      const pill = node.querySelector("[aria-label='2 places']");
      const clear = node.querySelector("button");
      const clearCircle = clear ? clear.firstElementChild : null;
      const icon = node.querySelector("span[aria-hidden]");
      return {
        border: s.borderTopWidth + " " + s.borderTopColor,
        background: s.backgroundColor,
        color: s.color,
        radius: s.borderTopLeftRadius,
        pill: pill ? { height: pill.offsetHeight, background: getComputedStyle(pill).backgroundColor, color: getComputedStyle(pill).color } : null,
        clear: clear ? clear.offsetWidth + "x" + clear.offsetHeight : null,
        clearCircle: clearCircle ? clearCircle.offsetWidth + "x" + clearCircle.offsetHeight : null,
        icon: icon ? icon.offsetWidth : null,
      };
    });
    // The taxonomy's yellow, #f9ac17, as the border and the pill; a 12 % tint as the fill;
    // the dark ink, #17191c, on the pill, where white would read at 1.92:1.
    //
    // The NAME is foreground/0, not the colour: Olcay ruled on 2026-09-21
    // (ce6e807) that the category colour on its own 12 % wash fails 4.5:1 for
    // seven of the eight tints, this yellow at 1.77. The border, the wash, the
    // icon and the count pill keep the colour; the name and the clear's cross
    // do not. This check asked for the yellow until 2026-09-22 and was never
    // run by CI, so it stayed red for a day asking for a contrast failure.
    assert.equal(styles.border, "1px rgb(249, 172, 23)", `the border is not the category's colour: ${styles.border}`);
    assert.equal(styles.color, "rgb(0, 0, 0)", `the name is not foreground/0: ${styles.color}`);
    // color-mix resolves to rgba() on some engines and color(srgb …) on others.
    const fill = /rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(styles.background) ?? (() => {
      const m = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)/.exec(styles.background);
      return m ? [m[0], String(Math.round(m[1] * 255)), String(Math.round(m[2] * 255)), String(Math.round(m[3] * 255)), m[4]] : null;
    })();
    assert.ok(fill, `the fill is not a colour with alpha: ${styles.background}`);
    assert.deepEqual(fill.slice(1, 4).map(Number), [249, 172, 23], `the fill is not the category's colour: ${styles.background}`);
    near(Number(fill[4]), 0.12, 0.01, "the fill is not at 12 %");
    assert.equal(styles.radius, "16px", `the radius is not the control's: ${styles.radius}`);
    assert.equal(styles.pill?.height, 22, `the pill is not 22 tall: ${JSON.stringify(styles.pill)}`);
    assert.equal(styles.pill?.background, "rgb(249, 172, 23)", `the pill is not filled with the colour: ${JSON.stringify(styles.pill)}`);
    assert.equal(styles.pill?.color, "rgb(23, 25, 28)", `the pill's digits are not the fill's ink: ${JSON.stringify(styles.pill)}`);
    // A 32 circle to see inside a 44 target to hit, as the search bar's clear
    // beside it (Olcay, 2026-09-21, 701f919). This check measured the button
    // alone and asked it to be 32, which would have been a target under the
    // minimum; CI never ran it, so the ruling and the check never met.
    assert.equal(styles.clear, "44x44", `the clear's target is not 44: ${styles.clear}`);
    assert.equal(styles.clearCircle, "32x32", `the clear's circle is not 32: ${styles.clearCircle}`);
    assert.equal(styles.icon, 28, `the icon is not 28: ${styles.icon}`);
    // The row: the field, Filters at 48 and the AI search at 48, all one height band.
    const filters = await page.getByRole("button", { name: "Filters" }).boundingBox();
    const ai = await page.getByRole("button", { name: "AI search" }).boundingBox();
    near(filters.height, 48, 1, "Filters is not 48");
    near(ai.height, 48, 1, "the AI search is not 48");
    near(filters.y + filters.height / 2, box.y + box.height / 2, 1, "Filters is not centred on the field");
  });

  await finish(await open("product-sdk-aisearchbutton--default", { reducedMotion: "reduce" }), "ai-search-ring-rests-with-reduced-motion", async (page) => {
    await page.getByRole("button", { name: "AI search" }).waitFor();
    const animationName = await page.locator(".kozmos-ai-search-ring").evaluate((node) => getComputedStyle(node).animationName);
    assert.equal(animationName, "none", `the ring still turns with reduced motion: ${animationName}`);
  });
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.status !== "ok");
console.log(`${results.length - failed.length}/${results.length} search-sheet checks passed on ${engine}`);
if (failed.length) process.exit(1);
