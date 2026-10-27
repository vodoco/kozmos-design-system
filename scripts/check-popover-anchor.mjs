// GAP-190: PopoverAnchor, in a browser, on the built package. A popover the
// product opens with no trigger sits beside the element or rect it anchors
// to, on each side, and stays beside it as the page scrolls, as the window
// resizes and as a virtual rect moves; its target stays a plain button that
// opens nothing; Escape closes it and focus goes back to the target with no
// handler of the product's; axe finds nothing while it is open. Then, each on
// a page of its own: a two-step tour keeps step 2 open with focus on it;
// PopoverTrigger keeps Radix's focus handling; a rect with a contextElement
// follows the panel its map scrolls in and hides once out of it; collisions
// flip a step at the window's foot; and right to left, align="start" lines up
// the right edges.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("popover-anchor-host.tsx");
const browser = await launchFixtureBrowser();
const OFFSET = 8;
const TOLERANCE = 1;

// Where the popover sits against its anchor, by side: the gap between them
// and how far the popover's centre is from the anchor's, across that side.
function placement(content, anchor, side) {
  const centreX = (r) => r.left + r.width / 2;
  const centreY = (r) => r.top + r.height / 2;
  if (side === "bottom")
    return { gap: content.top - anchor.bottom, off: centreX(content) - centreX(anchor) };
  if (side === "top")
    return { gap: anchor.top - content.bottom, off: centreX(content) - centreX(anchor) };
  if (side === "right")
    return { gap: content.left - anchor.right, off: centreY(content) - centreY(anchor) };
  return { gap: anchor.left - content.right, off: centreY(content) - centreY(anchor) };
}

/**
 * Waits, on a timer and not on frames (a stalled WebKit renders none), until
 * `selector`'s popover has finished animating in and sits `offset` from its
 * anchor on `side`; resolves what it last read either way, for the caller to
 * assert on.
 */
async function placed(page, selector, anchor, side, offset) {
  const read = () =>
    page.evaluate(
      ({ selector, anchor }) => {
        const content = document.querySelector(selector);
        if (!content) return null;
        const animating = content
          .getAnimations()
          .some((animation) => animation.playState === "running");
        const box = (node) => {
          const r = node.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
        };
        const target =
          typeof anchor === "string"
            ? box(document.querySelector(anchor))
            : anchor;
        return { animating, content: box(content), anchor: target };
      },
      { selector, anchor },
    );
  const deadline = Date.now() + 10_000;
  let last = await read();
  while (Date.now() < deadline) {
    if (last && !last.animating) {
      const { gap, off } = placement(last.content, last.anchor, side);
      if (Math.abs(gap - offset) <= TOLERANCE && Math.abs(off) <= TOLERANCE)
        return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    last = await read();
  }
  return last;
}

function assertPlaced(last, side, offset, label) {
  assert.ok(last, `${label}: the popover is open`);
  const { gap, off } = placement(last.content, last.anchor, side);
  assert.ok(
    Math.abs(gap - offset) <= TOLERANCE,
    `${label}: ${offset}px from its anchor on the ${side}, read ${gap.toFixed(2)} (${JSON.stringify(last)})`,
  );
  assert.ok(
    Math.abs(off) <= TOLERANCE,
    `${label}: centred on its anchor, read ${off.toFixed(2)} off (${JSON.stringify(last)})`,
  );
}

/** A page of a context of its own (axe wants one), in `mode`. */
async function openPage(mode, viewport = { width: 1000, height: 800 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>PopoverAnchor</title><style>${css}</style></head><body><div id="root" data-mode="${mode}"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  return { context, page, errors };
}

/** Waits, on a timer, until `id` has focus; fails naming what has it. */
async function focusOn(page, id, label) {
  try {
    await page.waitForFunction(
      (id) => document.activeElement?.id === id,
      id,
      { polling: 50, timeout: 5000 },
    );
  } catch {
    const at = await page.evaluate(
      () => document.activeElement?.id || document.activeElement?.tagName,
    );
    assert.fail(`${label}: focus is on ${at}, not #${id}`);
  }
}

let count = 0;
try {
  const { context, page, errors } = await openPage("step");
  const target = page.locator("#target");
  await target.waitFor();

  // The target is the product's button: no popover attributes, and a press
  // on it opens nothing, as a trigger's would.
  const plain = () =>
    target.evaluate((node) =>
      ["aria-haspopup", "aria-expanded", "aria-controls", "data-state"].filter(
        (name) => node.hasAttribute(name),
      ),
    );
  assert.deepEqual(await plain(), [], "the target carries no popover attributes");
  await target.click();
  assert.equal(await page.locator("#step").count(), 0, "a press on the target opens nothing");
  console.log("PASS the target is a plain button that opens nothing");
  count++;

  for (const side of ["bottom", "top", "right", "left"]) {
    await page.evaluate((side) => window.openStep(side), side);
    assertPlaced(await placed(page, "#step", "#target", side, OFFSET), side, OFFSET, `beside the target, ${side}`);
    assert.deepEqual(await plain(), [], `${side}: the open popover adds nothing to its target`);
    console.log(`PASS beside the target on the ${side}`);
    count++;
  }

  // It follows its target when the box it scrolls in scrolls.
  await page.evaluate(() => window.openStep("bottom"));
  await page.locator("#scroller").evaluate((node) => {
    node.scrollTop = 60;
  });
  const scrolled = await placed(page, "#step", "#target", "bottom", OFFSET);
  assertPlaced(scrolled, "bottom", OFFSET, "after a scroll");
  assert.ok(scrolled.anchor.top < 160, `after a scroll: the target moved up (${scrolled.anchor.top})`);
  console.log("PASS it follows its target as the page scrolls");
  count++;

  // And when the window resizes and the target moves with it.
  const before = await target.boundingBox();
  await page.setViewportSize({ width: 700, height: 800 });
  const resized = await placed(page, "#step", "#target", "bottom", OFFSET);
  assertPlaced(resized, "bottom", OFFSET, "after a resize");
  assert.ok(resized.anchor.left < before.x - 50, `after a resize: the target moved (${before.x} to ${resized.anchor.left})`);
  console.log("PASS it follows its target as the window resizes");
  count++;

  // Nothing on the page is inaccessible while it is open.
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;
  assert.deepEqual(
    violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    [],
    "open, axe finds nothing",
  );
  console.log("PASS axe finds nothing while it is open");
  count++;

  // Escape closes it, and focus goes back to the target with no handler of
  // the product's: nothing had focus as it opened (window.openStep).
  await page.locator("#step").getByRole("button", { name: "Next" }).focus();
  await page.keyboard.press("Escape");
  await page.locator("#step").waitFor({ state: "detached" });
  await focusOn(page, "target", "after Escape");
  console.log("PASS Escape closes it and focus goes back to the target");
  count++;

  // A virtual rect, a point on a map: beside it, and following it as it
  // moves with nothing else on the page changing (updatePositionStrategy).
  const point = async () =>
    page.evaluate(() => {
      const box = document.getElementById("map").getBoundingClientRect();
      return { box: { left: box.left, top: box.top } };
    });
  await page.evaluate(() => window.openFeature());
  const map = (await point()).box;
  const rect = (x, y) => ({ left: map.left + x, right: map.left + x, top: map.top + y, bottom: map.top + y, width: 0, height: 0 });
  assertPlaced(await placed(page, "#feature", rect(120, 60), "top", 12), "top", 12, "beside a virtual rect");
  await page.evaluate(() => window.moveFeature(360, 180));
  assertPlaced(await placed(page, "#feature", rect(360, 180), "top", 12), "top", 12, "after the virtual rect moved");
  console.log("PASS beside a virtual rect, and following it as it moves");
  count++;

  assert.deepEqual(errors, [], "no page errors");
  await context.close();

  {
    // A two-step tour: step 1's Next closes it and opens step 2. Step 1's
    // closing must not take focus from step 2, which would dismiss it.
    const { context, page, errors } = await openPage("tour");
    await page.locator("#start").focus();
    await page.keyboard.press("Enter");
    await page.locator("#step-1").waitFor();
    // Radix moves focus into the step as it opens.
    await page.waitForFunction(
      () => document.getElementById("step-1")?.contains(document.activeElement),
      undefined,
      { polling: 50, timeout: 5000 },
    );
    await page.locator("#step-1").getByRole("button", { name: "Next" }).click();
    await page.locator("#step-2").waitFor();
    // Long enough for step 1's FocusScope to hand focus over (setTimeout 0)
    // and for a focus outside to dismiss step 2.
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#step-2").count(), 1, "step 2 stays open");
    assert.equal(await page.locator("#step-1").count(), 0, "step 1 is closed");
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Done",
      "focus is on step 2's Done",
    );
    assert.deepEqual(
      await page.evaluate(() => window.tourLog),
      [],
      "nothing asked step 2 to close",
    );
    await page.keyboard.press("Escape");
    await page.locator("#step-2").waitFor({ state: "detached" });
    // Step 1's Next, which had focus as step 2 opened, is gone: its anchor.
    await focusOn(page, "target-2", "the tour's end");
    assert.deepEqual(errors, [], "tour: no page errors");
    console.log("PASS a two-step tour keeps step 2 open, and its end gives focus to step 2's control");
    count++;
    await context.close();
  }

  {
    // PopoverTrigger: Escape gives the trigger focus (Radix's), and a press
    // outside leaves focus where it put it, as before.
    const { context, page } = await openPage("trigger");
    await page.locator("#trigger").focus();
    await page.keyboard.press("Enter");
    await page.locator("#panel").waitFor();
    await page.keyboard.press("Escape");
    await page.locator("#panel").waitFor({ state: "detached" });
    await focusOn(page, "trigger", "trigger, Escape");
    await page.keyboard.press("Enter");
    await page.locator("#panel").waitFor();
    // Radix listens for a press outside from a timer after opening: press
    // again until it has heard one.
    for (let tries = 0; tries < 10; tries += 1) {
      await page.mouse.click(600, 600);
      const closed = await page
        .locator("#panel")
        .waitFor({ state: "detached", timeout: 500 })
        .then(() => true, () => false);
      if (closed) break;
    }
    await page.locator("#panel").waitFor({ state: "detached" });
    await page.waitForTimeout(150);
    assert.equal(
      await page.evaluate(() => document.activeElement === document.body),
      true,
      "trigger, a press outside: focus stays where the press left it",
    );
    console.log("PASS PopoverTrigger keeps Radix's focus handling");
    count++;
    await context.close();
  }

  {
    // A map in a scrolling panel: the rect's contextElement is the map's
    // canvas, so the popover follows the panel's scroll, and hideWhenDetached
    // hides it once the point is scrolled out of the panel.
    const { context, page } = await openPage("context");
    await page.locator("#pin").waitFor();
    const pointIn = () =>
      page.evaluate(() => {
        const box = document.getElementById("canvas").getBoundingClientRect();
        const x = box.left + 160;
        const y = box.top + 200;
        return { left: x, right: x, top: y, bottom: y, width: 0, height: 0 };
      });
    assertPlaced(await placed(page, "#pin", await pointIn(), "top", OFFSET), "top", OFFSET, "beside a point in a panel");
    await page.locator("#panel-box").evaluate((node) => {
      node.scrollTop = 120;
    });
    const scrolledPoint = await pointIn();
    assertPlaced(await placed(page, "#pin", scrolledPoint, "top", OFFSET), "top", OFFSET, "after the panel scrolled");
    const visibility = () =>
      page.locator("#pin").evaluate((node) => getComputedStyle(node).visibility);
    assert.equal(await visibility(), "visible", "in the panel, shown");
    await page.locator("#panel-box").evaluate((node) => {
      node.scrollTop = 400;
    });
    await page.waitForFunction(
      () => getComputedStyle(document.getElementById("pin")).visibility === "hidden",
      undefined,
      { polling: 50, timeout: 5000 },
    );
    console.log("PASS a point with a contextElement follows its panel and hides out of it");
    count++;
    await context.close();
  }

  {
    // Collisions on: asked for below a control at the window's foot, the step
    // flips above it.
    const { context, page } = await openPage("flip");
    await page.locator("#flipped").waitFor();
    const last = await placed(page, "#flipped", "#foot", "top", OFFSET);
    assertPlaced(last, "top", OFFSET, "flipped above the control");
    assert.equal(
      await page.locator("#flipped").getAttribute("data-side"),
      "top",
      "flipped: data-side",
    );
    console.log("PASS collisions flip a step at the window's foot");
    count++;
    await context.close();
  }

  {
    // Right to left, align="start": the popover's right edge is the
    // control's.
    const { context, page } = await openPage("rtl");
    await page.locator("#rtl-step").waitFor();
    const read = () =>
      page.evaluate(() => {
        const step = document.getElementById("rtl-step").getBoundingClientRect();
        const target = document.getElementById("rtl-target").getBoundingClientRect();
        return { right: step.right - target.right, left: step.left - target.left, top: step.top - target.bottom };
      });
    let edge;
    for (let tries = 0; tries < 100; tries += 1) {
      edge = await read();
      if (Math.abs(edge.right) <= TOLERANCE && Math.abs(edge.top - OFFSET) <= TOLERANCE) break;
      await page.waitForTimeout(50);
    }
    assert.ok(
      Math.abs(edge.right) <= TOLERANCE && Math.abs(edge.top - OFFSET) <= TOLERANCE,
      `right to left, start: right edges meet, 8 below (${JSON.stringify(edge)})`,
    );
    console.log("PASS right to left, align start lines up the right edges");
    count++;
    await context.close();
  }

  console.log(`PopoverAnchor: ${count} checks passed`);
} finally {
  await browser.close();
}
