// GAP-190: PopoverAnchor, in a browser, on the built package. A popover the
// product opens with no trigger sits beside the element or rect it anchors
// to, on each side, and stays beside it as the page scrolls, as the window
// resizes and as a virtual rect moves; its target stays a plain button that
// opens nothing; Escape closes it and the documented onCloseAutoFocus gives
// focus back to the target; and axe finds nothing while it is open.
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

let count = 0;
try {
  // axe wants a page of a context of its own.
  const context = await browser.newContext({
    viewport: { width: 1000, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>PopoverAnchor</title><style>${css}</style></head><body><div id="root"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
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

  // Escape closes it; onCloseAutoFocus gives focus back to the target.
  await page.locator("#step").getByRole("button", { name: "Next" }).focus();
  await page.keyboard.press("Escape");
  await page.locator("#step").waitFor({ state: "detached" });
  await page.waitForFunction(
    () => document.activeElement?.id === "target",
    undefined,
    { polling: 50, timeout: 5000 },
  );
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
  console.log(`PopoverAnchor: ${count} checks passed`);
} finally {
  await browser.close();
}
