/**
 * toast() and Toaster (GAP-167), on the built package in a real browser
 * (packages/react/tests/integration/toaster-host.tsx).
 *
 * - Announced: each toast once, by Radix's region, which says its aria-live
 *   out loud as every Kozmos live part does (GAP-193): assertive for a
 *   critical toast, polite for every other tone, unless the call says;
 *   in the product's words (the region, the announcement and the close),
 *   and while a modal Select or Menu hides the page, with the toast behind
 *   it hidden and inert together (GAP-193).
 * - Focus is never taken: typing goes on in a field while toasts come, act
 *   and go.
 * - The queue: no more than `limit` at once, oldest first, each in turn.
 * - Paused while hovered or focused, and resumed after.
 * - Closed by its close button, Escape, a swipe and its action, each once;
 *   Escape with focus in a field closes the newest and leaves focus there.
 * - Reduced motion, by the media query and by the design config's mark:
 *   no entry, no exit and no spring; with neither, it moves.
 * - Several ThemeProviders: each Toaster draws in its own provider's portal
 *   and theme, a second Toaster of one id draws nothing, and a box that
 *   isolates its stacking (a map) cannot trap it under a bar.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-toaster.mjs
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("toaster-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const failures = [];
let passed = 0;

async function scenario(name, mount, run, pageOptions = {}) {
  const page = await browser.newPage({
    viewport: { width: 900, height: 700 },
    reducedMotion: "no-preference",
    ...pageOptions,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setContent(
      `<!doctype html><html lang="en"><head><title>Toaster</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
    );
    await page.addScriptTag({ content: code });
    await page.evaluate(recordAnnouncements);
    await page.evaluate((mount) => window.toaster.mount(mount), mount);
    await settleLayout(page);
    const said = await run(page);
    assert.deepEqual(errors, [], "no page errors");
    passed += 1;
    console.log(`PASS ${name}${said ? `: ${said}` : ""}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}\n${error.stack ?? error}`);
  } finally {
    await page.close();
  }
}

const show = (page, title, options) =>
  page.evaluate(
    ([title, options]) => window.toaster.show(title, options),
    [title, options ?? {}],
  );
const item = (page, title) =>
  page.locator("li.kozmos-toast").filter({ hasText: title });
/** Drawn and done arriving, so the pointer finds it where it rests. */
async function arrived(page, title) {
  await item(page, title).waitFor();
  await item(page, title).evaluate((li) =>
    Promise.all(li.getAnimations().map((animation) => animation.finished)),
  );
}

/**
 * Radix's announcements: the visually hidden regions it mounts beside the
 * page for a second, two frames after the toast, each with its words once
 * they are written. A recorder installed with the page keeps every one as it
 * was when its words arrived, in reach or not, so a slow runner cannot miss
 * one that has already gone.
 */
function recordAnnouncements() {
  const said = new Map();
  const read = () => {
    for (const node of document.querySelectorAll(
      '[role="status"][aria-live]',
    )) {
      if (node.closest("li") || !node.textContent || said.has(node)) continue;
      said.set(node, {
        text: node.textContent,
        live: node.getAttribute("aria-live"),
        hidden: !!node.closest('[aria-hidden="true"]'),
        inert: !!node.closest("[inert]"),
      });
    }
  };
  new MutationObserver(read).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  window.announced = () => [...said.values()];
}
const announcements = (page) => page.evaluate(() => window.announced());
const waitForAnnouncements = (page, count) =>
  page.waitForFunction((count) => window.announced().length >= count, count, {
    timeout: 5000,
  });

await scenario(
  "announced once each, at each tone's politeness, in the product's words",
  {
    toaster: {
      label: "Mitteilungen ({hotkey})",
      toastLabel: "Mitteilung",
      closeLabel: "Mitteilung schließen",
      limit: 5,
      duration: Infinity,
    },
  },
  async (page) => {
    await show(page, "Could not save", {
      tone: "critical",
      description: "Try again.",
    });
    await show(page, "Saved", { tone: "success" });
    await show(page, "Offline", { tone: "warning", live: "assertive" });
    await show(page, "Updated", { tone: "info", withAction: true });
    await show(page, "Synced");
    await waitForAnnouncements(page, 5);
    const said = await announcements(page);
    assert.deepEqual(
      Object.fromEntries(said.map(({ text, live }) => [text, live])),
      {
        "Mitteilung Could not save Try again.": "assertive",
        "Mitteilung Saved": "polite",
        "Mitteilung Offline": "assertive",
        "Mitteilung Updated Undo from the history": "polite",
        "Mitteilung Synced": "polite",
      },
      "each toast is said once, critical and an assertive call interrupting",
    );
    assert.equal(said.length, 5, "said once each");
    assert.ok(
      said.every(({ hidden, inert }) => !hidden && !inert),
      "every announcement is in reach",
    );
    const parts = await page.evaluate(() => ({
      region: document
        .querySelector('[role="region"]')
        ?.getAttribute("aria-label"),
      live: Array.from(document.querySelectorAll("li.kozmos-toast")).map(
        (li) => li.getAttribute("role") ?? li.getAttribute("aria-live"),
      ),
      closes: Array.from(
        document.querySelectorAll("li.kozmos-toast button[aria-label]"),
      ).map((button) => button.getAttribute("aria-label")),
    }));
    assert.equal(parts.region, "Mitteilungen (F8)", "the region's own name");
    assert.deepEqual(parts.live, [null, null, null, null, null]);
    assert.deepEqual(parts.closes, Array(5).fill("Mitteilung schließen"));
    return "5 announcements, 2 assertive, in the product's words";
  },
);

/**
 * GAP-193 (#420): nothing behind an open Select or modal Menu may be hidden
 * from a screen reader yet still focusable. The toasts drawn while one is
 * open are behind it: each focusable box in them is either hidden and inert
 * together, or neither.
 */
const hiddenYetFocusable = (page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll("li.kozmos-toast, li.kozmos-toast button"),
    )
      .filter(
        (node) =>
          !!node.closest('[aria-hidden="true"]') !== !!node.closest("[inert]"),
      )
      .map((node) => node.outerHTML.slice(0, 80)),
  );

for (const [popup, open, inside] of [
  ["a modal Select", "#select", '[role="listbox"]'],
  ["a modal Menu", "#menu", '[role="menu"]'],
]) {
  await scenario(
    `announced while ${popup} hides the page; the toast behind it is hidden and inert together, and the popup keeps focus`,
    {},
    async (page) => {
      await page.locator(open).click();
      await page.locator(inside).waitFor();
      await show(page, "Saved", { tone: "success", withAction: true });
      await waitForAnnouncements(page, 1);
      const [said] = await announcements(page);
      assert.deepEqual(
        said,
        {
          text: "Notification Saved Undo from the history",
          live: "polite",
          hidden: false,
          inert: false,
        },
        "the announcement is outside what the popup hides",
      );
      await item(page, "Saved").waitFor({ state: "attached" });
      await settleLayout(page);
      assert.deepEqual(
        await hiddenYetFocusable(page),
        [],
        "no box in the toast is hidden yet focusable, or inert yet read",
      );
      const focus = await page.evaluate(
        (inside) => !!document.activeElement?.closest(inside),
        inside,
      );
      assert.equal(focus, true, "focus stays in the open popup");
    },
  );
}

await scenario(
  "never takes focus: typing goes on while toasts come, act and go",
  { toaster: { duration: 600 } },
  async (page) => {
    await page.locator("#name").click();
    await page.keyboard.type("Ab");
    await show(page, "Saved", { withAction: true });
    await item(page, "Saved").waitFor();
    await page.keyboard.type("cd");
    await item(page, "Saved").waitFor({ state: "detached", timeout: 4000 });
    await page.keyboard.type("e");
    const state = await page.evaluate(() => ({
      value: document.getElementById("name").value,
      focused: document.activeElement?.id,
    }));
    assert.deepEqual(state, { value: "Abcde", focused: "name" });
  },
);

await scenario(
  "Escape in a field closes the newest toast and leaves focus and the words alone",
  { toaster: { limit: 2 } },
  async (page) => {
    await page.locator("#name").click();
    await page.keyboard.type("Desk");
    await show(page, "Older", { duration: Infinity });
    await show(page, "Newer", { duration: Infinity });
    await item(page, "Newer").waitFor();
    await page.keyboard.press("Escape");
    await item(page, "Newer").waitFor({ state: "detached" });
    const state = await page.evaluate(() => ({
      left: Array.from(document.querySelectorAll("li.kozmos-toast")).map(
        (li) => li.querySelector("div > div")?.textContent,
      ),
      value: document.getElementById("name").value,
      focused: document.activeElement?.id,
    }));
    assert.deepEqual(state, {
      left: ["Older"],
      value: "Desk",
      focused: "name",
    });
  },
);

await scenario(
  "queues past its limit, oldest first, each in turn",
  { toaster: { limit: 2, duration: 500 } },
  async (page) => {
    await page.evaluate(() => {
      const seen = [];
      let most = 0;
      window.queueRead = { seen, most: () => most };
      const read = () => {
        const drawn = Array.from(
          document.querySelectorAll("li.kozmos-toast"),
        ).map((li) => li.querySelector("div > div")?.textContent);
        most = Math.max(most, drawn.length);
        for (const title of drawn) if (!seen.includes(title)) seen.push(title);
        requestAnimationFrame(read);
      };
      read();
    });
    for (const title of ["One", "Two", "Three", "Four"])
      await show(page, title);
    await page.waitForFunction(
      () =>
        window.toaster.dismissed.length === 4 &&
        !document.querySelector("li.kozmos-toast"),
      undefined,
      { timeout: 8000 },
    );
    const read = await page.evaluate(() => ({
      seen: window.queueRead.seen,
      most: window.queueRead.most(),
      dismissed: window.toaster.dismissed,
    }));
    assert.deepEqual(read.seen, ["One", "Two", "Three", "Four"]);
    assert.equal(read.most, 2, "never more than the limit at once");
    assert.deepEqual(read.dismissed, ["One", "Two", "Three", "Four"]);
  },
);

await scenario(
  "pauses while hovered or focused, and resumes after",
  { toaster: { duration: 800 } },
  async (page) => {
    await show(page, "Hovered");
    await arrived(page, "Hovered");
    const box = await item(page, "Hovered").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 2);
    await page.waitForTimeout(1600);
    assert.equal(
      await item(page, "Hovered").getAttribute("data-state"),
      "open",
      "still open after twice its time under the pointer",
    );
    await page.mouse.move(5, 5);
    await item(page, "Hovered").waitFor({ state: "detached", timeout: 3000 });

    await page.locator("#name").click();
    await show(page, "Focused");
    await item(page, "Focused").waitFor();
    await page.keyboard.press("F8");
    assert.equal(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="region"]'),
      ),
      true,
      "F8 moves focus to the toasts",
    );
    await page.waitForTimeout(1600);
    assert.equal(
      await item(page, "Focused").getAttribute("data-state"),
      "open",
      "still open after twice its time with focus in it",
    );
    await page.locator("#name").click();
    await item(page, "Focused").waitFor({ state: "detached", timeout: 3000 });
  },
);

async function closes(page) {
  await page.evaluate(() => {
    window.toaster.dismissed.length = 0;
  });
  await show(page, "By the close", { duration: Infinity });
  await item(page, "By the close")
    .getByRole("button", { name: "Dismiss notification" })
    .click();
  await item(page, "By the close").waitFor({ state: "detached" });

  await show(page, "By Escape", { duration: Infinity });
  await item(page, "By Escape").focus();
  await page.keyboard.press("Escape");
  await item(page, "By Escape").waitFor({ state: "detached" });

  await show(page, "By a swipe", { duration: Infinity });
  await arrived(page, "By a swipe");
  const box = await item(page, "By a swipe").boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 40, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1)
    await page.mouse.move(box.x + 40 + step * 20, y);
  await page.mouse.up();
  await item(page, "By a swipe").waitFor({ state: "detached" });

  await show(page, "By its action", { duration: Infinity, withAction: true });
  await item(page, "By its action")
    .getByRole("button", { name: "Undo" })
    .click();
  await item(page, "By its action").waitFor({ state: "detached" });
  const read = await page.evaluate(() => ({
    dismissed: window.toaster.dismissed,
    pressed: window.toaster.pressed,
  }));
  assert.deepEqual(read, {
    dismissed: ["By the close", "By Escape", "By a swipe", "By its action"],
    pressed: ["By its action"],
  });
}

await scenario(
  "closes at its close button, Escape, a swipe and its action, each once",
  {},
  closes,
);

/** The toast's own motion, as the engine resolves it. */
const motion = (page, title) =>
  item(page, title).evaluate((li) => {
    const style = getComputedStyle(li);
    return {
      animation: style.animationName,
      transition: style.transitionDuration,
    };
  });

await scenario(
  "reduced motion by the media query: no entry, no exit, no spring; a swipe still closes it",
  {},
  async (page) => {
    await show(page, "Saved", { duration: Infinity });
    assert.deepEqual(await motion(page, "Saved"), {
      animation: "none",
      transition: "0s",
    });
    await page.evaluate(() => window.toaster.dismiss());
    await item(page, "Saved").waitFor({ state: "detached", timeout: 300 });
    await closes(page);
  },
  { reducedMotion: "reduce" },
);

await scenario(
  "reduced motion by the design config's mark: no entry, no exit, no spring",
  { configReduced: true },
  async (page) => {
    await show(page, "Saved", { duration: Infinity });
    assert.deepEqual(await motion(page, "Saved"), {
      animation: "none",
      transition: "0s",
    });
    await page.evaluate(() => window.toaster.dismiss());
    await item(page, "Saved").waitFor({ state: "detached", timeout: 300 });
  },
);

await scenario("with neither, it moves (the control)", {}, async (page) => {
  await show(page, "Saved", { duration: Infinity });
  const moving = await motion(page, "Saved");
  assert.match(moving.animation, /^kozmos-enter/);
  assert.notEqual(moving.transition, "0s");
});

await scenario(
  "several ThemeProviders: each Toaster in its own provider's portal and theme, a second of one id draws nothing",
  { layout: "providers" },
  async (page) => {
    await show(page, "For the page");
    await show(page, "For the module", { toaster: "module" });
    await item(page, "For the module").waitFor();
    await waitForAnnouncements(page, 2);
    const read = await page.evaluate(() =>
      Array.from(document.querySelectorAll("li.kozmos-toast")).map((li) => {
        const portal = li.closest("[data-kozmos-portal]");
        return {
          title: li.querySelector("div > div")?.textContent,
          theme: portal?.getAttribute("data-theme"),
          dir: portal?.getAttribute("dir"),
          fill: getComputedStyle(li).backgroundColor,
        };
      }),
    );
    const page_ = read.find(({ title }) => title === "For the page");
    const module_ = read.find(({ title }) => title === "For the module");
    assert.equal(read.length, 2, "each toast drawn once");
    assert.deepEqual(
      { theme: page_.theme, dir: page_.dir },
      { theme: "light", dir: "ltr" },
    );
    assert.deepEqual(
      { theme: module_.theme, dir: module_.dir, fill: module_.fill },
      { theme: "dark", dir: "rtl", fill: "rgb(32, 42, 68)" },
      "the module's toast takes its provider's theme, direction and tokens",
    );
    assert.notEqual(page_.fill, module_.fill);
    await page.waitForTimeout(300);
    assert.equal((await announcements(page)).length, 2, "said once each");
  },
);

await scenario(
  "a box that isolates its stacking cannot trap it under a bar",
  { layout: "trapped" },
  async (page) => {
    await show(page, "Saved", { duration: Infinity });
    await arrived(page, "Saved");
    await settleLayout(page);
    const read = await item(page, "Saved").evaluate((li) => {
      const r = li.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      const bar = document.getElementById("bar").getBoundingClientRect();
      return {
        onBar: r.top < bar.bottom && r.bottom > bar.top,
        top: hit ? (li.contains(hit) ? "toast" : hit.id || hit.tagName) : null,
        inMap: !!li.closest("#map"),
      };
    });
    assert.deepEqual(read, { onBar: true, top: "toast", inMap: false });
  },
);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} of ${passed + failures.length} failed`);
  process.exit(1);
}
console.log(`\n${passed} of ${passed} passed`);
