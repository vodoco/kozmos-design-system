import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

// GAP-124: beside the map the shell's panel hugged its content, so a part that
// fills its panel (AICompanionPanel, h-full) grew with the conversation: its
// title, close button and input scrolled away with the thread. It gets the
// panel's whole height now, and only the thread scrolls; other content still
// hugs.
const fixture = await buildReactFixture("side-panel-fill.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    reducedMotion: "reduce",
  });
  await page.setContent('<!doctype html><div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  const read = () =>
    page.evaluate(() => {
      const box = (node) => node && node.getBoundingClientRect().toJSON();
      const panel = document.querySelector('aside[aria-label="Assistant"]');
      const scroller = panel.querySelector("[data-kozmos-scroller]");
      const heading = panel.querySelector("h1, h2, h3, h4, h5, h6");
      const input = panel.querySelector("textarea, input");
      const thread = panel.querySelector('[role="log"]') ?? null;
      return {
        panel: box(panel),
        scrollerScrolls: scroller.scrollHeight > scroller.clientHeight + 1,
        heading: box(heading),
        input: box(input),
        threadScrolls: thread
          ? thread.scrollHeight > thread.clientHeight + 1
          : null,
        list: box(panel.querySelector('[data-testid="list"]')),
      };
    });
  const inside = (outer, inner) =>
    inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  let cap = 0;
  for (const dir of ["ltr", "rtl"])
    for (const turns of [1, 40]) {
      await page.evaluate((config) => window.renderSidePanelFill(config), {
        turns,
        dir,
      });
      await settleLayout(page);
      const state = await read();
      const where = JSON.stringify({ dir, turns, state });
      assert.equal(
        state.scrollerScrolls,
        false,
        `the panel itself never scrolls the assistant: ${where}`,
      );
      assert.ok(
        inside(state.panel, state.heading),
        `the title stays in view: ${where}`,
      );
      assert.ok(
        inside(state.panel, state.input),
        `the input stays in view: ${where}`,
      );
      if (turns === 40)
        assert.equal(
          state.threadScrolls,
          true,
          `only the thread scrolls: ${where}`,
        );
      cap = Math.max(cap, state.panel.height);
    }
  // The assistant takes the panel's whole height, short or long: the same
  // height at one turn and at forty.
  await page.evaluate(() => window.renderSidePanelFill({ turns: 1 }));
  await settleLayout(page);
  const short = await read();
  assert.ok(
    Math.abs(short.panel.height - cap) < 1,
    `a short conversation has the panel's height: ${JSON.stringify({ short: short.panel, cap })}`,
  );
  // Content that doesn't fill still hugs, and still scrolls inside the cap.
  await page.evaluate(() => window.renderSidePanelFill({ list: 3 }));
  await settleLayout(page);
  const hugging = await read();
  assert.ok(
    hugging.panel.height < cap - 100,
    `a short list hugs: ${JSON.stringify(hugging.panel)}`,
  );
  await page.evaluate(() => window.renderSidePanelFill({ list: 60 }));
  await settleLayout(page);
  const long = await read();
  assert.equal(long.scrollerScrolls, true, "a long list scrolls in the panel");
  assert.ok(
    Math.abs(long.panel.height - cap) < 1,
    "a long list is capped where the assistant is",
  );
  console.log(
    "PASS side panel fill: the assistant takes the panel's height (short and long, LTR and RTL), only its thread scrolls; lists still hug and scroll",
  );
} finally {
  await browser.close();
}
