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

// 0.5.0's contract: a wrapper that forwards an undefined `value` leaves the
// choice to the control, and a press shows.
await scenario(
  "SegmentedControl: a wrapper forwarding an undefined value keeps its own choice, as in 0.5.0",
  "forwarded-toggle",
  async (page) => {
    const segment = (name) => page.getByRole("radio", { name, exact: true });
    const checked = async () =>
      Promise.all(
        ["List", "Map"].map((name) =>
          segment(name).getAttribute("aria-checked"),
        ),
      );
    await segment("Map").click();
    await settleLayout(page);
    assert.deepEqual(
      await checked(),
      ["false", "true"],
      "the press did nothing visible",
    );
    await segment("List").focus();
    await page.keyboard.press("Space");
    await settleLayout(page);
    assert.deepEqual(await checked(), ["true", "false"]);
  },
);

// R2: Escape with the product's own key handler, and a part inside that
// handles Escape itself.
await scenario(
  "R2: Escape runs the product's handler, respects a handled Escape, and closes",
  "assistant-escape",
  async (page) => {
    const panel = page.getByRole("region", { name: "Assistant" });
    const draft = page.getByRole("textbox", { name: "Draft" });
    const keys = page.getByTestId("keys");
    const press = async (key) => {
      await page.keyboard.press(key);
      await settleLayout(page);
    };
    await draft.focus();

    // The product keeps Escape for itself: the panel stays.
    await call(page, "keepEscape", true);
    await settleLayout(page);
    await press("Escape");
    assert.equal(await panel.count(), 1, "the product kept Escape");
    await call(page, "keepEscape", false);
    await settleLayout(page);

    // Other keys never close it.
    await press("x");
    await press("Enter");
    assert.equal(await panel.count(), 1);
    assert.equal(await draft.inputValue(), "x");

    // The draft clears itself on Escape and says so: the panel stays.
    await press("Escape");
    assert.equal(await draft.inputValue(), "");
    assert.equal(await panel.count(), 1, "the draft handled that Escape");

    // Nothing left to handle: Escape closes the panel, after the product's
    // handler has seen it.
    await press("Escape");
    assert.equal(
      await panel.count(),
      0,
      "Escape did not close the panel beside the product's handler",
    );
    assert.equal(
      await keys.textContent(),
      "Escape x Enter Escape Escape",
      "the product's handler saw every key",
    );
  },
);

// GAP-93: what the assistant covers is out of reach while it is open.

/** Where focus is: its name, and whether it is in the frame, in the panel. */
const focusIn = (page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    const frame = document.querySelector('[data-testid="frame"]');
    const panel = document.querySelector('[role="region"]');
    const labelledBy = active?.getAttribute("aria-labelledby");
    const body = !active || active === document.body;
    return {
      // The page itself has no name: its text is not a control's.
      name: body
        ? null
        : (active.getAttribute("aria-label") ??
          (labelledBy
            ? document.getElementById(labelledBy)?.textContent?.trim()
            : active.textContent?.trim()) ??
          null),
      body,
      inFrame: Boolean(frame?.contains(active)),
      inPanel: Boolean(panel?.contains(active)),
    };
  });

/** Ask a control for focus directly, and say whether it took it. */
const takesFocus = (page, name) =>
  page.getByRole("button", { name, exact: true }).evaluate((button) => {
    button.focus();
    return document.activeElement === button;
  });

/** Open the assistant from its button, from the keyboard. */
async function openAssistant(page) {
  await page.getByRole("button", { name: "Ask the assistant" }).focus();
  await page.keyboard.press("Enter");
  await settleLayout(page);
  assert.equal(
    (await focusIn(page)).name,
    "Assistant",
    "the panel took focus as the visitor opened it (decision 16)",
  );
}

await scenario(
  "GAP-93: over its frame, the assistant keeps the keyboard out of what it covers, and gives it back",
  "assistant-cover",
  async (page) => {
    await openAssistant(page);

    // Stepping back out of the panel leaves the frame, for the toolbar
    // before it, instead of landing on a tile under the panel.
    await page.keyboard.press("Shift+Tab");
    const back = await focusIn(page);
    assert.equal(
      back.inFrame && !back.inPanel,
      false,
      `Shift+Tab landed under the panel, on "${back.name}"`,
    );
    assert.equal(back.name, "Toolbar");

    // Nothing under it takes focus, even asked directly; the page beyond the
    // frame is left alone.
    assert.equal(await takesFocus(page, "Shops"), false, "a covered tile");
    assert.equal(await takesFocus(page, "Ask the assistant"), false);
    assert.equal(await takesFocus(page, "After the frame"), true);
    assert.equal(await takesFocus(page, "Toolbar"), true);

    // Forward from the toolbar goes straight into the panel.
    await page.keyboard.press("Tab");
    assert.equal((await focusIn(page)).inPanel, true, "Tab into the panel");

    // Closed, it gives everything back and hands focus to its button.
    await page.keyboard.press("Escape");
    await settleLayout(page);
    assert.equal(await page.getByRole("region").count(), 0, "closed");
    assert.equal((await focusIn(page)).name, "Ask the assistant");
    assert.equal(
      await page.evaluate(() => document.querySelectorAll("[inert]").length),
      0,
      "inert left behind",
    );
    await page.keyboard.press("Tab");
    assert.equal((await focusIn(page)).name, "Shops", "the tiles are back");
  },
);

await scenario(
  "GAP-93: the product's onCloseAutoFocus can put focus on what the panel covered",
  "assistant-cover-focus-under",
  async (page) => {
    await openAssistant(page);
    await page.keyboard.press("Escape");
    await settleLayout(page);
    assert.equal((await focusIn(page)).name, "Shops");
  },
);

await scenario(
  "GAP-93: mounted open, it covers what is under it and takes no focus (decision 16)",
  "assistant-cover-mounted-open",
  async (page) => {
    assert.equal((await focusIn(page)).body, true, "focus stayed on the page");
    assert.equal(await takesFocus(page, "Shops"), false, "a covered tile");
    assert.equal(await takesFocus(page, "Toolbar"), true);
  },
);

for (const placement of ["side", "flow"]) {
  await scenario(
    `GAP-93: ${placement === "side" ? "over half its frame" : "in flow"}, it covers nothing, and nothing changes`,
    `assistant-${placement}`,
    async (page) => {
      await openAssistant(page);
      assert.equal(
        await page.evaluate(() => document.querySelectorAll("[inert]").length),
        0,
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal((await focusIn(page)).name, "Offices");
      assert.equal(await takesFocus(page, "Shops"), true);
    },
  );
}

await scenario(
  "GAP-93: fixed over the whole page, it covers the page and keeps its own menu in reach",
  "assistant-fixed",
  async (page) => {
    await openAssistant(page);
    assert.equal(
      await takesFocus(page, "Toolbar"),
      false,
      "the page under a panel that covers it",
    );
    assert.equal(await takesFocus(page, "After the frame"), false);
    assert.equal(await takesFocus(page, "Shops"), false);

    // A menu opened from inside the panel draws in the page's portal.
    await page.getByRole("button", { name: "Suggestions" }).focus();
    await page.keyboard.press("Enter");
    const item = page.getByRole("menuitem", { name: "Nearest restroom" });
    await item.waitFor();
    await settleLayout(page);
    assert.equal(
      await item.evaluate((node) => node.closest("[inert]") === null),
      true,
      "the panel's own menu was made inert",
    );
    assert.equal(
      await item.evaluate((node) => {
        node.focus();
        return document.activeElement === node;
      }),
      true,
      "the panel's own menu takes focus",
    );
    await page.keyboard.press("Escape");
    await settleLayout(page);
  },
);

// B1: 0.5.0's contract, for a panel given no `open`: mounting it opens it.
await scenario(
  "B1: a panel mounted to open it, with no open, takes focus and hands it back as it unmounts",
  "assistant-mount-to-open",
  async (page) => {
    const ask = page.getByRole("button", { name: "Ask the assistant" });
    await ask.focus();
    await page.keyboard.press("Enter");
    await settleLayout(page);
    assert.equal(
      await page.evaluate(
        () => document.activeElement?.getAttribute("role") ?? null,
      ),
      "region",
      "the mounted panel did not take focus as it opened",
    );
    // Covered by the panel, the button is out of reach meanwhile (GAP-93).
    assert.equal(await takesFocus(page, "Ask the assistant"), false);

    await page.keyboard.press("Escape");
    await settleLayout(page);
    assert.equal(await page.getByRole("region").count(), 0, "unmounted");
    assert.equal((await focusIn(page)).name, "Ask the assistant");
  },
);

// R3: clearing every choice from the keyboard hands focus to the field.
for (const key of ["Enter", "Space"]) {
  await scenario(
    `R3: clearing every choice with ${key} hands focus to the field, its list closed`,
    "multi-select",
    async (page) => {
      const field = page.getByRole("combobox", { name: "Tools" });
      const press = async (keys) => {
        await page.keyboard.press(keys);
        await settleLayout(page);
      };
      // From the field, as a keyboard comes: Tab on to the clear button. The
      // list the field opened stays open past it, as before.
      await field.focus();
      await settleLayout(page);
      await press("Tab");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label"),
        ),
        "Clear selected options",
      );

      await press(key);
      const after = await page.evaluate(() => ({
        role: document.activeElement?.getAttribute("role"),
        body: document.activeElement === document.body,
        chips: document.querySelectorAll('[aria-label^="Remove "]').length,
      }));
      assert.equal(after.chips, 0, "the choices were cleared");
      assert.equal(after.body, false, "focus fell to the page");
      assert.equal(after.role, "combobox", "focus is in the field");
      assert.equal(await field.getAttribute("aria-expanded"), "false");
      assert.equal(await page.getByRole("listbox").count(), 0);

      // Typing goes on at once, and a choice can be made again.
      await page.keyboard.type("lay");
      await settleLayout(page);
      assert.equal(await field.inputValue(), "lay");
      assert.equal(await page.getByRole("listbox").count(), 1);
      await press("Enter");
      assert.equal(
        await page.getByRole("button", { name: "Remove Layers" }).count(),
        1,
      );
    },
  );
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} interaction check(s) failed.`);
  process.exit(1);
}
