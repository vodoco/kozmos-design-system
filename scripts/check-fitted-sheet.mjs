import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

// A bottom sheet fitted to its content (`panelDetents` with "content") is as
// tall as what it holds: its content's scroll height. AICompanionPanel fills
// its panel (`height: 100%`, GAP-124), so its height was the box's own, and
// the sheet was fitted to itself:
// - in standards mode, in every engine, it kept whatever height it was first
//   measured at, which depended on where the sheet came from, and it did not
//   grow with the conversation;
// - in WebKit in quirks mode, as check-panel-spacing's page loads, the part's
//   `100%` resolves against the panel rather than the content box, so it read
//   the grip's row (or the content's top padding) more at every measurement.
//   Each taller sheet changed the shell's `--kozmos-map-inset-*`, the shell's
//   observer on its own style measured again without waiting for a frame, and
//   in about 45 ms the sheet reached the large detent and its grip went.
// The shell now reads such a part as content with a height of its own, laid
// out unstretched, and fits the sheet to that: its header, its whole
// conversation and its input. This renders that, and a list, which has a
// height of its own, in both document modes, with and without a grip, in
// both directions, and waits for the sheet to come to rest.
const SHELL = 800;
const COLLAPSED = Math.min(Math.max(SHELL * 0.2, 112), SHELL * 0.4);
const LARGE = SHELL * 0.94;

/**
 * Renders with `act` and waits for the sheet to come to rest: its height and
 * whether it draws a grip unchanged for 3 frames and 150 ms, counted from the
 * last change or from when `act` returned, with the sheet's own transitions
 * ended. Read before `act`, then on every frame, every 50 ms, and on every
 * mutation in the shell, so a sheet that resizes between frames is seen at
 * each step. The limit is on a timer, and a Node timer 5 s past it gives up on
 * a page that has stopped answering. Resolves `{ settled, why, heights,
 * timeline }`: `heights` is every height the sheet took after `act`.
 */
async function sheetSettled(page, act, { limit = 10_000 } = {}) {
  const watch = await page.evaluateHandle((limit) => {
    const t0 = performance.now();
    const at = () => Math.round(performance.now() - t0);
    const read = () => {
      const panel = document.querySelector("aside");
      if (!panel || panel.hidden) return null;
      return {
        height: Math.round(panel.getBoundingClientRect().height * 100) / 100,
        grip: panel.querySelector(".kozmos-map-sheet-grip") !== null,
      };
    };
    const show = (reading) =>
      reading === null
        ? "no sheet"
        : `${reading.height}${reading.grip ? "" : " (no grip)"}`;
    const same = (a, b) =>
      a === b ||
      (a !== null &&
        b !== null &&
        Math.abs(a.height - b.height) < 0.05 &&
        a.grip === b.grip);
    let last = read();
    const timeline = [`0 ms ${show(last)}`];
    const heights = [];
    let armed = false;
    let quietSince = t0;
    let still = 0;
    let frames = 0;
    let done = false;
    let resolve;
    const result = new Promise((settle) => (resolve = settle));
    const running = () =>
      document
        .querySelector("aside")
        ?.getAnimations()
        .some((animation) => animation.playState === "running") ?? false;
    const finish = (settled, why) => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearInterval(timer);
      timeline.push(`${at()} ms, ${frames} frames`);
      const lines =
        timeline.length <= 14
          ? timeline
          : [
              ...timeline.slice(0, 6),
              `… ${timeline.length - 12} more`,
              ...timeline.slice(-6),
            ];
      resolve({
        settled,
        why,
        reading: last,
        heights,
        timeline: lines.join(", "),
      });
    };
    const sample = (via, onFrame) => {
      if (done) return;
      const now = performance.now();
      const value = read();
      const animating = running();
      if (!same(value, last)) {
        timeline.push(`${at()} ms f${frames} ${via} ${show(value)}`);
        if (value !== null) heights.push(value.height);
        last = value;
        quietSince = now;
        still = 0;
      } else if (animating) {
        quietSince = now;
        still = 0;
      } else if (onFrame) still++;
      if (armed && last !== null && still >= 3 && now - quietSince >= 150)
        finish(true, "");
    };
    const observer = new MutationObserver(() => sample("mutation", false));
    observer.observe(document.getElementById("root"), {
      subtree: true,
      childList: true,
      attributes: true,
    });
    const timer = setInterval(() => sample("timer", false), 50);
    const frame = () => {
      if (done) return;
      frames++;
      sample("frame", true);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return {
      arm() {
        armed = true;
        quietSince = performance.now();
        still = 0;
        timeline.push(`${at()} ms act done`);
        setTimeout(
          () =>
            finish(
              false,
              last === null
                ? "never drew a sheet"
                : `was still changing ${limit} ms on`,
            ),
          limit,
        );
        return result;
      },
      stop() {
        done = true;
      },
    };
  }, limit);
  let timer;
  try {
    await act();
    return await Promise.race([
      watch.evaluate((watching) => watching.arm()),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `${limit + 5000} ms on, the page had not answered: its main thread may be hung`,
              ),
            ),
          limit + 5000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    watch
      .evaluate((watching) => watching.stop())
      .then(() => watch.dispose())
      .catch(() => {});
  }
}

/**
 * The sheet as it rests, and the height the definition gives it: what it
 * holds, read from the layout of its children rather than from the content
 * box, with the content's padding, the panel's border and the grip's row,
 * between collapsed and large. The assistant's own height is its header, its
 * thread's whole conversation and its input, stacked.
 */
const measureSheet = (page) =>
  page.evaluate(
    ({ collapsed, large }) => {
      const panel = document.querySelector("aside");
      const scroller = panel.querySelector("[data-kozmos-scroller]");
      const style = getComputedStyle(scroller);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const handle = panel.querySelector('[role="slider"]');
      const box = (node) => node.getBoundingClientRect();
      const part = scroller.querySelector('[role="region"]');
      let own;
      let fills = null;
      let threadShown = null;
      if (part) {
        own = 0;
        for (const child of part.children) {
          // With its margins: in quirks mode the input's form keeps the
          // 16px below it that browsers give a form there.
          const childStyle = getComputedStyle(child);
          own +=
            (parseFloat(childStyle.marginTop) || 0) +
            (parseFloat(childStyle.marginBottom) || 0);
          if (child.getAttribute("role") !== "log") {
            own += box(child).height;
            continue;
          }
          // The conversation's end, wherever the thread's box ends.
          const threadStyle = getComputedStyle(child);
          const items = [...child.children];
          const end = items.length
            ? box(items[items.length - 1]).bottom -
              (box(child).top + child.clientTop) +
              child.scrollTop +
              (parseFloat(threadStyle.paddingBottom) || 0)
            : (parseFloat(threadStyle.paddingTop) || 0) +
              (parseFloat(threadStyle.paddingBottom) || 0);
          own += end + child.offsetHeight - child.clientHeight;
          threadShown = child.scrollHeight <= child.clientHeight + 1;
        }
        // The part fills the box the sheet gives it.
        const content = box(scroller);
        const top = content.top + scroller.clientTop + padTop;
        const bottom =
          content.top + scroller.clientTop + scroller.clientHeight - padBottom;
        fills = {
          top: Math.round((box(part).top - top) * 100) / 100,
          bottom: Math.round((box(part).bottom - bottom) * 100) / 100,
          // The panel itself never scrolls the assistant: its thread does.
          scrolls: scroller.scrollHeight > scroller.clientHeight + 1,
        };
      } else own = box(scroller.querySelector("[data-fitted-list]")).height;
      const border = panel.offsetHeight - panel.clientHeight;
      const grip = handle ? box(handle).height : 0;
      const wanted = Math.min(
        Math.max(padTop + own + padBottom + border + grip, collapsed),
        large,
      );
      return {
        height: box(panel).height,
        grip: panel.querySelector(".kozmos-map-sheet-grip") !== null,
        detents: handle ? Number(handle.getAttribute("aria-valuemax")) + 1 : 1,
        wanted: Math.round(wanted * 100) / 100,
        fills,
        threadShown,
      };
    },
    { collapsed: COLLAPSED, large: LARGE },
  );

const fixture = await buildReactFixture("fitted-sheet.fixture.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let checked = 0;
try {
  for (const mode of ["standards", "quirks"]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      mode === "standards"
        ? '<!doctype html><div id="root"></div>'
        : '<div id="root"></div>',
    );
    assert.equal(
      await page.evaluate(() => document.compatMode),
      mode === "standards" ? "CSS1Compat" : "BackCompat",
      `the ${mode} page's mode`,
    );
    await page.addStyleTag({ content: fixture.css });
    await page.addScriptTag({ content: fixture.code });
    let instances = 0;
    const render = (config) =>
      page.evaluate((config) => window.renderFittedSheet(config), config);
    // `steps` render one after another into the same shell; the last is
    // the one checked.
    const check = async (name, steps, { wantsGrip }) => {
      checked++;
      let rested;
      for (const step of steps) {
        rested = await sheetSettled(page, () => render(step));
        if (!rested.settled) break;
      }
      const where = `${mode}, ${name}`;
      if (!rested.settled) {
        failures.push(`${where}: the sheet ${rested.why}: ${rested.timeline}`);
        return null;
      }
      const sheet = await measureSheet(page);
      const problems = [];
      const grew = rested.heights.filter(
        (height, index) => index > 0 && height > rested.heights[index - 1],
      ).length;
      if (grew > 2)
        problems.push(
          `it ran away, growing ${grew} times before it rested at ${sheet.height}`,
        );
      if (sheet.grip !== wantsGrip)
        problems.push(
          wantsGrip
            ? `it drew no grip, with a second detent offered (${sheet.detents} detent${sheet.detents === 1 ? "" : "s"} left)`
            : "it drew a grip with one detent",
        );
      if (Math.abs(sheet.height - sheet.wanted) > 1.5)
        problems.push(
          `it rests at ${sheet.height}, where what it holds needs ${sheet.wanted}`,
        );
      if (sheet.threadShown === false && sheet.wanted < LARGE - 0.5)
        problems.push("its thread scrolls, so the sheet does not fit it");
      if (sheet.threadShown === true && sheet.wanted >= LARGE - 0.5)
        problems.push("at large its thread shows the whole conversation");
      // In WebKit in quirks mode the part is drawn as tall as the panel's
      // inside at every detent, past the content box: a quirks-mode layout
      // the fit no longer reads, and none a standards page has.
      if (
        mode === "standards" &&
        sheet.fills &&
        (Math.abs(sheet.fills.top) > 1 ||
          Math.abs(sheet.fills.bottom) > 1 ||
          sheet.fills.scrolls)
      )
        problems.push(
          `the assistant does not fill its box: ${JSON.stringify(sheet.fills)}`,
        );
      if (problems.length)
        failures.push(
          `${where}: ${problems.join("; ")}. Its heights: ${rested.timeline}`,
        );
      return sheet;
    };
    for (const content of ["assistant", "list"])
      for (const grip of [true, false])
        for (const rtl of [false, true])
          await check(
            `${content}, ${grip ? "grip" : "no grip"}, ${rtl ? "RTL" : "LTR"}`,
            [{ content, grip, rtl, rows: 8, instance: `fresh-${++instances}` }],
            { wantsGrip: grip },
          );
    // Where the sheet came from does not decide where it fits.
    for (const content of ["assistant", "list"])
      for (const from of ["large", "medium"]) {
        const instance = `from-${++instances}`;
        await check(
          `${content}, grip, LTR, fitted after resting at ${from}`,
          [
            {
              content,
              grip: true,
              rtl: false,
              rows: 8,
              instance,
              detent: from,
            },
            { content, grip: true, rtl: false, rows: 8, instance },
          ],
          { wantsGrip: true },
        );
      }
    // Past either end of the fit the part still fills the sheet: at the
    // collapsed floor with no conversation at all, and at large, where the
    // fitted detent is the large one and only the thread scrolls.
    await check(
      "assistant, grip, LTR, its header alone, at the collapsed floor",
      [
        {
          content: "assistant",
          grip: true,
          rtl: false,
          bare: true,
          instance: `bare-${++instances}`,
        },
      ],
      { wantsGrip: true },
    );
    await check(
      "assistant, grip, LTR, twelve turns, at large",
      [
        {
          content: "assistant",
          grip: true,
          rtl: false,
          turns: 12,
          instance: `long-${++instances}`,
        },
      ],
      { wantsGrip: false },
    );
    // The sheet follows the conversation as it grows.
    {
      const instance = `grows-${++instances}`;
      await check(
        "assistant, grip, LTR, from one turn to three",
        [
          { content: "assistant", grip: true, rtl: false, turns: 1, instance },
          { content: "assistant", grip: true, rtl: false, turns: 3, instance },
        ],
        { wantsGrip: true },
      );
    }
    if (errors.length)
      failures.push(`${mode}: page errors: ${errors.join("; ")}`);
    await page.close();
  }
  assert.equal(
    failures.length,
    0,
    `${failures.length} of ${checked} fitted sheets:\n- ${failures.join("\n- ")}`,
  );
  console.log(
    `PASS fitted sheet: ${checked} sheets in standards and quirks mode come to rest where what they hold needs, with their grip; the assistant at its unstretched height, filling its box, from any detent and as its conversation grows`,
  );
} finally {
  await browser.close();
}
