/**
 * Interactions that only a real browser can prove: focus, the keyboard and
 * scrolling, in the built package (packages/react/tests/integration/
 * interactions-host.tsx). Run with ADAPTIVE_BROWSER=firefox or webkit for the
 * other engines, as CI does.
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("interactions-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];

/** One scenario on a fresh page; any page error or React warning fails it. */
async function scenario(name, mount, run, { reducedMotion } = {}) {
  const page = await browser.newPage({
    viewport: { width: 800, height: 600 },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  try {
    await page.setContent(
      `<!doctype html><html lang="en" data-theme="light"><head><title>Interactions</title><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate(
      (scenario) => window.interactions.mount(scenario),
      mount,
    );
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

/** Where the selected card sits in its scroller, and how far it has moved. */
const selectedCardView = (page) =>
  page.getByTestId("scroller").evaluate((scroller) => {
    const card = scroller.querySelector('[data-poi-id="poi-9"]');
    const box = scroller.getBoundingClientRect();
    const rect = card?.getBoundingClientRect();
    return {
      scrollTop: Math.round(scroller.scrollTop),
      cards: scroller.querySelectorAll("[data-poi-id]").length,
      inView: rect
        ? rect.top >= box.top - 0.5 && rect.bottom <= box.bottom + 0.5
        : false,
    };
  });

/**
 * The selected card's place once the box has stopped moving: ten frames with
 * no change, or three seconds. A smooth scroll takes its time; a check that
 * never scrolled then fails on the assertion that follows, not on a timeout.
 */
const settledCardView = async (page) => {
  await page.getByTestId("scroller").evaluate(
    (scroller) =>
      new Promise((resolve) => {
        const start = performance.now();
        let last = scroller.scrollTop;
        let still = 0;
        const frame = () => {
          const now = scroller.scrollTop;
          still = now === last ? still + 1 : 0;
          last = now;
          if (still >= 10 || performance.now() - start > 3000) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
  return selectedCardView(page);
};

const call = (page, handle, ...args) =>
  page.evaluate(
    ([handle, args]) => window.interactions[handle](...args),
    [handle, args],
  );

// F2: a selection that comes before its results is brought in when they do.
for (const reducedMotion of [true, false]) {
  await scenario(
    `F2: a selection that comes before its results is brought in when they arrive (${reducedMotion ? "reduced motion" : "smooth"})`,
    "late-results",
    async (page) => {
      assert.deepEqual(await selectedCardView(page), {
        scrollTop: 0,
        cards: 0,
        inView: false,
      });

      // A batch without the selected result: nothing to bring in yet.
      await call(page, "deliver", 5);
      await page.waitForFunction(
        () => document.querySelectorAll("[data-poi-id]").length === 5,
      );
      await settleLayout(page);
      assert.equal((await selectedCardView(page)).scrollTop, 0);

      // The batch with it: the list brings it into the box's view.
      await call(page, "deliver");
      await page.waitForFunction(
        () => document.querySelectorAll("[data-poi-id]").length === 12,
      );
      const shown = await settledCardView(page);
      assert.equal(shown.inView, true, "the selected card is in view");
      assert.ok(shown.scrollTop > 0, "the box scrolled to it");

      // The visitor scrolls back up; a new array of the same results must
      // not take them back down.
      await page
        .getByTestId("scroller")
        .evaluate((scroller) => scroller.scrollTo({ top: 0 }));
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="scroller"]').scrollTop === 0,
      );
      await call(page, "rebuild");
      await settleLayout(page);
      assert.equal(
        (await settledCardView(page)).scrollTop,
        0,
        "a new array of the same results moved the list",
      );
    },
    { reducedMotion },
  );
}

await scenario(
  "F2: turned on later, the list brings in the selection it was told to leave",
  "reveal-later",
  async (page) => {
    await call(page, "deliver");
    await page.waitForFunction(
      () => document.querySelectorAll("[data-poi-id]").length === 12,
    );
    await settleLayout(page);
    assert.equal((await selectedCardView(page)).scrollTop, 0);

    await call(page, "reveal", true);
    await settleLayout(page);
    const shown = await settledCardView(page);
    assert.equal(shown.inView, true, "the selected card is in view");
    assert.ok(shown.scrollTop > 0, "the box scrolled to it");
  },
  { reducedMotion: true },
);

// R1: a choice the product holds, from nothing chosen, taken and given back
// from the keyboard.
await scenario(
  "R1: a held choice with nothing chosen is taken and given back from the keyboard",
  "held-choice",
  async (page) => {
    const held = page.getByTestId("held");
    const segment = (name) => page.getByRole("radio", { name, exact: true });
    const checked = async () =>
      Promise.all(
        ["List", "Map"].map((name) =>
          segment(name).getAttribute("aria-checked"),
        ),
      );
    // A key, then the frames a change reported from an effect needs.
    const press = async (key) => {
      await page.keyboard.press(key);
      await settleLayout(page);
    };
    assert.deepEqual(await checked(), ["false", "false"]);

    await segment("List").focus();
    await press("Space");
    assert.equal(await held.textContent(), "list");
    assert.deepEqual(await checked(), ["true", "false"]);

    await press("Space");
    assert.equal(await held.textContent(), "nothing");
    assert.deepEqual(
      await checked(),
      ["false", "false"],
      "the segment stayed pressed after the choice was given back",
    );

    // Choosing again after giving it back.
    await press("ArrowRight");
    await press("Space");
    assert.equal(await held.textContent(), "map");
    assert.deepEqual(await checked(), ["false", "true"]);
    await press("Space");
    assert.equal(await held.textContent(), "nothing");
    assert.deepEqual(await checked(), ["false", "false"]);
  },
);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} interaction check(s) failed.`);
  process.exit(1);
}
