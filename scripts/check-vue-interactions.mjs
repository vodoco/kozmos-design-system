/**
 * Interactions for @kozmos-ds/vue, over the built Vue Storybook (Vue 3
 * Phase 0, P0.5), light and dark: Vue's counterpart of
 * check-storybook-interactions.mjs, which drives React's stories with real
 * keyboard and pointer input in Chromium, Firefox and WebKit.
 *
 * Each story names its interaction in scripts/vue/coverage.mjs; this file
 * holds them. A story with none says why there; a story in neither fails
 * here before any is drawn.
 *
 * Every story, with an interaction or without, is scanned by axe at WCAG
 * 2.2 AA, light and dark, as it first draws (React's audit-storybook.mjs
 * scans every React story so), and a story with an interaction again after
 * it, when nothing it opened may sit outside a Kozmos root either. axe
 * must find nothing, and the page must throw nothing.
 *
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit VUE_STORYBOOK_URL=… \
 *     node scripts/check-vue-interactions.mjs
 */
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { settleLayout } from "./lib/built-react-fixture.mjs";
import { VUE_STORIES } from "./vue/coverage.mjs";
import {
  finish,
  launch,
  newStoryPage,
  openStory,
  storiesFor,
} from "./vue/stories.mjs";

const SUITE = "interactions";

/** The story's drawn controls of a role, in document order. */
const controls = (page, selector) =>
  page.locator(`.kozmos-story-surface ${selector}`);

const clicks = (page) => page.evaluate(() => window.__kozmosVue.clicks.length);
const lookOf = (locator) =>
  locator.evaluate((element) => window.__kozmosVue.look(element));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Settles hover and focus: the transitions they start, and a frame. */
async function settle(page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  await settleLayout(page);
}

/** Puts focus at the page's start, so the next Tab is the story's first stop. */
async function focusStart(page) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.getSelection()?.removeAllRanges();
  });
  await page.mouse.move(0, 0);
}

/** The element focus is on, as the probes name it. */
const focused = (page) =>
  page.evaluate(() =>
    document.activeElement && document.activeElement !== document.body
      ? window.__kozmosVue.describe(document.activeElement)
      : "the page",
  );

/**
 * One enabled button: Tab reaches it and draws a focus that differs from its
 * rest; Enter and Space each fire one click; the pointer's hover changes its
 * look; a click fires one click. `tabbed` says Tab already put focus on it.
 */
async function pressButton(page, button, { tabbed = false } = {}) {
  const name = await button.evaluate((el) => window.__kozmosVue.describe(el));
  await page.mouse.move(0, 0);
  if (!tabbed) {
    await focusStart(page);
    await page.keyboard.press("Tab");
  }
  await settle(page);
  assert.equal(
    await button.evaluate((el) => el === document.activeElement),
    true,
    `Tab reaches ${name} (focus is on ${await focused(page)})`,
  );
  const focusLook = await lookOf(button);
  await button.evaluate((el) => el.blur());
  await settle(page);
  const rest = await lookOf(button);
  assert(
    !same(focusLook, rest),
    `${name} draws no focus: its look is the same focused from the keyboard and at rest`,
  );
  await button.focus();
  for (const key of ["Enter", " "]) {
    const before = await clicks(page);
    await page.keyboard.press(key === " " ? "Space" : key);
    await settle(page);
    assert.equal(
      (await clicks(page)) - before,
      1,
      `${key === " " ? "Space" : key} on ${name} fires one click`,
    );
  }
  await button.evaluate((el) => el.blur());
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  assert(
    !same(await lookOf(button), rest),
    `${name} draws no hover: its look is the same under the pointer and at rest`,
  );
  const before = await clicks(page);
  await page.mouse.down();
  await page.mouse.up();
  await settle(page);
  assert.equal(
    (await clicks(page)) - before,
    1,
    `a click on ${name} fires one click`,
  );
  await page.mouse.move(0, 0);
  return name;
}

/** A disabled or loading button: no stop for Tab, no click for the pointer. */
async function unavailable(page) {
  const button = controls(page, "button").first();
  assert.equal(await button.isDisabled(), true, "the button is disabled");
  await focusStart(page);
  await page.keyboard.press("Tab");
  await settle(page);
  assert.equal(
    await button.evaluate((el) => el === document.activeElement),
    false,
    "Tab passes the unavailable button",
  );
  const box = await button.boundingBox();
  const before = await clicks(page);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  const landed = await page.evaluate(
    (from) => window.__kozmosVue.clicks.slice(from),
    before,
  );
  assert(
    !landed.some((target) => target.includes("button.")),
    `a click on the unavailable button reaches it (${landed.join("; ")})`,
  );
  return "unavailable to Tab and to a click";
}

/**
 * One link: Tab put focus on it, which draws a look that differs from its
 * rest; Enter fires one click; the pointer's hover changes its look; a click
 * fires one click. What the click would open is not followed: the story
 * stays on its page.
 */
async function followLink(page, link) {
  const name = await link.evaluate((el) => window.__kozmosVue.describe(el));
  await page.mouse.move(0, 0);
  await settle(page);
  const focusLook = await lookOf(link);
  await link.evaluate((el) => el.blur());
  await settle(page);
  const rest = await lookOf(link);
  assert(
    !same(focusLook, rest),
    `${name} draws no focus: its look is the same focused from the keyboard and at rest`,
  );
  await link.focus();
  await settle(page);
  let before = await clicks(page);
  await page.keyboard.press("Enter");
  await settle(page);
  assert.equal(
    (await clicks(page)) - before,
    1,
    `Enter on ${name} fires one click`,
  );
  await link.evaluate((el) => el.blur());
  const box = await link.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  assert(
    !same(await lookOf(link), rest),
    `${name} draws no hover: its look is the same under the pointer and at rest`,
  );
  before = await clicks(page);
  await page.mouse.down();
  await page.mouse.up();
  await settle(page);
  assert.equal(
    (await clicks(page)) - before,
    1,
    `a click on ${name} fires one click`,
  );
  await page.mouse.move(0, 0);
  return name;
}

/** Keeps the story on its page: a link's click is heard, and not followed. */
const stayOnPage = (page) =>
  page.evaluate(() => {
    if (window.__kozmosStays) return;
    window.__kozmosStays = true;
    addEventListener("click", (event) => {
      if (event.target.closest?.("a[href]")) event.preventDefault();
    });
  });

/** axe at WCAG 2.2 AA over the page: what it finds, by rule and node. */
async function axeFinds(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  return violations.map(
    (v) =>
      `${v.id}: ${v.nodes.map((n) => `${n.target} (${n.failureSummary?.split("\n").slice(1).join(" ").trim()})`).join(", ")}`,
  );
}

/** The fields' values, in order. */
const values = (page) =>
  controls(page, "input").evaluateAll((inputs) => inputs.map((i) => i.value));

const INTERACTIONS = {
  /** The story's one button, by keyboard and pointer. */
  async button(page) {
    const buttons = controls(page, "button");
    assert.equal(await buttons.count(), 1, "the story draws one button");
    const name = await pressButton(page, buttons.first());
    return `${name}: Tab, a focus, Enter, Space, a hover and a click`;
  },

  /** A disabled button: no stop for Tab, no click for the pointer, no loader. */
  async "button-disabled"(page) {
    const did = await unavailable(page);
    const loader = await controls(page, "button")
      .first()
      .evaluate((el) => !!el.querySelector(".kozmos-button-loader"));
    assert.equal(loader, false, "a disabled button draws no loading arc");
    return did;
  },

  /**
   * A loading button: unavailable as a disabled one is, and its arc leads
   * the label, hidden from assistive technology. A loading story with no
   * arc fails.
   */
  async "button-loading"(page) {
    const did = await unavailable(page);
    const arc = await controls(page, "button")
      .first()
      .evaluate((el) => {
        const loader = el.querySelector(".kozmos-button-loader");
        // The arc is the loader's own <svg> (SpinnerArc.ts).
        return {
          drawn: !!loader,
          first: el.firstElementChild === loader && !!loader,
          hidden: loader?.getAttribute("aria-hidden"),
        };
      });
    assert.equal(arc.drawn, true, "the loading button draws its arc");
    assert.equal(arc.first, true, "the loading arc leads the label");
    assert.equal(
      arc.hidden,
      "true",
      "the loading arc is hidden from assistive technology",
    );
    return `${did}, its arc before the label`;
  },

  /** Every button, Tab after Tab in reading order, each pressed and hovered. */
  async "buttons-in-order"(page) {
    const buttons = await controls(page, "button:not([disabled])").all();
    assert(buttons.length > 1, "the story draws more than one button");
    await focusStart(page);
    for (const button of buttons) {
      await page.keyboard.press("Tab");
      await settle(page);
      await pressButton(page, button, { tabbed: true });
      // Focus back on it, so the next Tab is the next button's.
      await button.focus();
    }
    return `${buttons.length} buttons, Tab after Tab in reading order, each pressed and hovered`;
  },

  /**
   * Every link, button and field, Tab after Tab in reading order: each link
   * followed by Enter and by a click (heard, not followed), each button
   * pressed and hovered, each field typed into. A story's controls are
   * reached in the order they are drawn, whatever kind each is.
   */
  async "controls-in-order"(page) {
    await stayOnPage(page);
    // One selector, so every kind is looked for inside the story's surface.
    const all = await controls(
      page,
      ":is(a[href], button:not([disabled]), input:not([disabled]))",
    ).all();
    assert(all.length > 0, "the story draws a link, a button or a field");
    await focusStart(page);
    const done = { link: 0, button: 0, field: 0 };
    for (const control of all) {
      await page.keyboard.press("Tab");
      await settle(page);
      const name = await control.evaluate((el) =>
        window.__kozmosVue.describe(el),
      );
      assert.equal(
        await control.evaluate((el) => el === document.activeElement),
        true,
        `Tab reaches ${name} (focus is on ${await focused(page)})`,
      );
      const tag = await control.evaluate((el) => el.localName);
      if (tag === "a") {
        await followLink(page, control);
        done.link++;
      } else if (tag === "button") {
        await pressButton(page, control, { tabbed: true });
        done.button++;
      } else {
        await page.keyboard.type("4");
        await settle(page);
        assert.match(
          await control.inputValue(),
          /4$/,
          `${name} holds what was typed`,
        );
        done.field++;
      }
      // Focus back on it, so the next Tab is the next control's.
      await control.focus();
    }
    return `${done.link} link(s), ${done.button} button(s) and ${done.field} field(s), Tab after Tab in reading order`;
  },

  /**
   * A bridged group and its bridged options, one React tree (GAP-230): Tab
   * reaches the chosen option, a held arrow moves to the next and chooses
   * it, and a click chooses another, each held by v-model.
   */
  async "radio-group"(page) {
    const radios = controls(page, "[role=radio]");
    const chosen = () => controls(page, "output").textContent();
    assert.equal(await radios.count(), 3, "the group draws its three options");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await radios.nth(0).evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the chosen option (focus is on ${await focused(page)})`,
    );
    // Radix chooses the option an arrow moves to while the key is down.
    await page.keyboard.down("ArrowDown");
    await settle(page);
    await page.keyboard.up("ArrowDown");
    await settle(page);
    assert.equal(
      await radios.nth(1).getAttribute("aria-checked"),
      "true",
      "ArrowDown chooses the next option",
    );
    assert.equal(await chosen(), "Level 2", "v-model holds the option chosen");
    await radios.nth(2).click();
    await settle(page);
    assert.equal(await chosen(), "Level 3", "a click chooses an option");
    return "Tab to the chosen option, ArrowDown to the next, a click on the last, each held by v-model";
  },

  /** Typing into the search field, its value held in Vue through the bridge. */
  async "search-typing"(page) {
    const field = controls(page, "input").first();
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the search field (focus is on ${await focused(page)})`,
    );
    await page.keyboard.type("Gate 4");
    await settle(page);
    assert.equal(
      await field.inputValue(),
      "Gate 4",
      "the field holds what was typed",
    );
    await page.keyboard.press("Backspace");
    await settle(page);
    assert.equal(
      await field.inputValue(),
      "Gate ",
      "Backspace takes the last letter",
    );
    return "Tab to the field, typed and corrected, the value held by v-model";
  },

  /** Label's field: a click on the words moves focus into the field it names. */
  async "label-focuses-field"(page) {
    const label = controls(page, "label").first();
    const field = controls(page, "input").first();
    const id = await field.getAttribute("id");
    assert(id, "the field has an id for the label to name");
    assert.equal(
      await label.getAttribute("for"),
      id,
      "the label names its field (for = the field's id)",
    );
    await focusStart(page);
    await label.click();
    await settle(page);
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      `a click on the label focuses its field (focus is on ${await focused(page)})`,
    );
    return "a click on the label moved focus into the field it names";
  },

  /** WayfindingCard's swap, in Vue's state through @swap and v-model. */
  async "wayfinding-swap"(page) {
    const [origin, destination] = await values(page);
    assert(origin && destination, "the card shows an origin and a destination");
    const swap = page.getByRole("button", { name: /swap/i });
    await swap.click();
    await settle(page);
    assert.deepEqual(
      await values(page),
      [destination, origin],
      "the swap button swaps origin and destination",
    );
    await swap.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.deepEqual(
      await values(page),
      [origin, destination],
      "Enter on the swap button swaps them back",
    );
    const field = controls(page, "input").first();
    await field.fill("");
    await field.pressSequentially("Gate 42");
    await settle(page);
    assert.equal(
      await field.inputValue(),
      "Gate 42",
      "the origin field holds what was typed",
    );
    await swap.click();
    await settle(page);
    assert.deepEqual(
      await values(page),
      [destination, "Gate 42"],
      "what was typed is what the swap moves: Vue holds it (v-model:originValue)",
    );
    return "swapped by pointer and by Enter, and a typed origin swapped from Vue's state";
  },

  /**
   * A virtualized Grid (GAP-172): it draws fewer items than it holds, from
   * the first; Tab reaches its scroller, End scrolls it to the bottom, and
   * the rows drawn follow, the last item among them and the first gone,
   * still in reading order.
   */
  async "virtual-grid"(page) {
    const scroller = controls(page, "[data-virtual-scroller]");
    const items = controls(page, "[role=listitem]");
    const places = () =>
      items.evaluateAll((all) =>
        all.map((item) => Number(item.getAttribute("aria-posinset"))),
      );
    const size = Number(await items.first().getAttribute("aria-setsize"));
    const first = await places();
    assert.equal(first[0], 1, "it draws from the first item");
    assert(
      first.length < size,
      `it draws fewer items than it holds (${first.length} of ${size})`,
    );
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await scroller.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the scroller (focus is on ${await focused(page)})`,
    );
    await page.keyboard.press("End");
    // Keyboard scrolling is smooth: wait for it to reach the bottom, or 5 s.
    await scroller.evaluate(
      (el) =>
        new Promise((resolve) => {
          const deadline = performance.now() + 5000;
          const check = () =>
            el.scrollTop + el.clientHeight >= el.scrollHeight - 1 ||
            performance.now() > deadline
              ? resolve()
              : requestAnimationFrame(check);
          check();
        }),
    );
    await settle(page);
    const last = await places();
    assert.equal(last.at(-1), size, "End draws the last item");
    assert(!last.includes(1), "the first row is no longer drawn");
    assert.deepEqual(
      last,
      [...last].sort((a, b) => a - b),
      "the items drawn are in reading order",
    );
    return `Tab to the scroller; End scrolls it, and the rows drawn follow to item ${size}`;
  },

  /**
   * Notice's disclosure (KozmosNotice): Tab reaches More, Enter and Space
   * each open or close the detail, as a click does, and the detail's
   * `hidden` follows `aria-expanded` every time.
   */
  async "notice-disclosure"(page) {
    const more = controls(page, "button[aria-expanded]");
    assert.equal(await more.count(), 1, "the notice offers one disclosure");
    const id = await more.getAttribute("aria-controls");
    assert(id, "More names the detail it controls");
    const state = async () => ({
      expanded: (await more.getAttribute("aria-expanded")) === "true",
      shown: await page.evaluate(
        (detail) => !document.getElementById(detail)?.hidden,
        id,
      ),
    });
    const start = await state();
    assert.equal(start.shown, start.expanded, "the detail shows as More says");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await more.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches More (focus is on ${await focused(page)})`,
    );
    let expected = start.expanded;
    const steps = [
      ["Enter", () => page.keyboard.press("Enter")],
      ["Space", () => page.keyboard.press("Space")],
      ["a click", () => more.click()],
      ["a second click", () => more.click()],
    ];
    for (const [how, act] of steps) {
      await act();
      await settle(page);
      expected = !expected;
      assert.deepEqual(
        await state(),
        { expanded: expected, shown: expected },
        `${how} on More ${expected ? "opens" : "closes"} the detail`,
      );
    }
    return "Tab to More; Enter, Space and two clicks each open or close the detail, hidden as aria-expanded says";
  },

  /**
   * Map Persona Visibility's rows: each row's checkbox, by the pointer and
   * by Space, ticks and unticks it, and the row's tint (data-selected)
   * follows, held in the story's Vue state.
   */
  async "persona-visibility"(page) {
    const boxes = await controls(page, "[role=checkbox]").all();
    assert.equal(boxes.length, 3, "the list draws three checkboxes");
    const look = (box) =>
      box.evaluate((el) => ({
        checked: el.getAttribute("aria-checked") === "true",
        tinted: el.closest("li")?.hasAttribute("data-selected") ?? null,
      }));
    for (const box of boxes) {
      const before = await look(box);
      assert.equal(before.tinted, before.checked, "a ticked row is tinted");
      await box.click();
      await settle(page);
      assert.deepEqual(
        await look(box),
        { checked: !before.checked, tinted: !before.checked },
        "a click ticks or unticks the row, and its tint follows",
      );
      await box.focus();
      await page.keyboard.press("Space");
      await settle(page);
      assert.deepEqual(
        await look(box),
        before,
        "Space puts it back, and its tint follows",
      );
    }
    return "three rows ticked and unticked by a click and by Space, each row's tint following";
  },

  /** A MetaStrip is a stop for Tab, so its facts can be scrolled to. */
  async "meta-strip-focus"(page) {
    const strip = controls(page, "dl[data-slot=meta-strip]");
    assert.equal(await strip.count(), 1, "the story draws one strip");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await strip.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the strip (focus is on ${await focused(page)})`,
    );
    return "Tab to the strip";
  },

  /**
   * A MetaStrip wider than its column: Tab reaches it, and its keys scroll
   * it (End to its end, Home back, ArrowRight a step), as React's do.
   */
  async "meta-strip-scroll"(page) {
    const strip = controls(page, "dl[data-slot=meta-strip]");
    await INTERACTIONS["meta-strip-focus"](page);
    const at = () => strip.evaluate((el) => Math.abs(el.scrollLeft));
    assert(
      await strip.evaluate((el) => el.scrollWidth > el.clientWidth),
      "the strip is wider than its column",
    );
    assert.equal(await at(), 0, "the strip starts at its start");
    await page.keyboard.press("End");
    await settle(page);
    assert((await at()) > 0, "End scrolls the strip to its end");
    await page.keyboard.press("Home");
    await settle(page);
    assert.equal(await at(), 0, "Home scrolls it back to its start");
    await page.keyboard.press("ArrowRight");
    await settle(page);
    assert((await at()) > 0, "ArrowRight scrolls it a step");
    return "Tab to the strip; End, Home and ArrowRight scroll it";
  },

  /** The Backdrop's cut-out lets the target through and catches the rest. */
  async "backdrop-target"(page) {
    const target = controls(page, "button").first();
    const backdrop = page.locator(".kozmos-backdrop");
    const box = await target.boundingBox();
    let before = await clicks(page);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    let landed = await page.evaluate(
      (from) => window.__kozmosVue.clicks.slice(from),
      before,
    );
    assert(
      landed.length === 1 &&
        landed[0].includes("button.kozmos-reset.kozmos-button"),
      `a click on the target through the cut-out reaches it (${landed.join("; ") || "nothing"})`,
    );
    const area = await backdrop.boundingBox();
    before = await clicks(page);
    await page.mouse.click(area.x + area.width - 24, area.y + area.height - 24);
    await settle(page);
    landed = await page.evaluate(
      (from) => window.__kozmosVue.clicks.slice(from),
      before,
    );
    assert(
      !landed.some((at) => at.includes("button.kozmos-reset.kozmos-button")),
      `a click on the backdrop away from the target does not reach it (${landed.join("; ")})`,
    );
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await target.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the lit target (focus is on ${await focused(page)})`,
    );
    return "the target takes a click through the cut-out and Tab; the backdrop takes the rest";
  },
};

const { base, ids, covered } = await storiesFor(SUITE);
for (const id of covered) {
  const { interaction } = VUE_STORIES[id];
  if (!Object.hasOwn(INTERACTIONS, interaction)) {
    console.error(
      `FAIL coverage: ${id} names the interaction "${interaction}", which scripts/check-vue-interactions.mjs does not have`,
    );
    process.exit(1);
  }
}

const browser = await launch({ pointer: "mouse" });
const failures = [];
let scans = 0;
let interactions = 0;
try {
  for (const theme of ["light", "dark"]) {
    const { context, page, errors } = await newStoryPage(browser, base);
    try {
      for (const id of ids) {
        const { interaction } = VUE_STORIES[id];
        const at = `${id} ${theme}`;
        let step = "as it draws";
        try {
          await openStory(page, base, id, { theme });
          await page.mouse.move(0, 0);
          await settle(page);
          const atRest = await axeFinds(page);
          assert(
            !atRest.length,
            `axe finds ${atRest.join("; ")} as the story draws`,
          );
          scans++;
          let did = "no interaction";
          if (interaction) {
            step = interaction;
            did = await INTERACTIONS[interaction](page);
            await page.mouse.move(0, 0);
            await settle(page);
            const outside = await page.evaluate(() =>
              window.__kozmosVue.outsideRoots(),
            );
            assert(
              !outside.length,
              `${outside.join("; ")} is drawn outside every Kozmos root after the interaction`,
            );
            const after = await axeFinds(page);
            assert(
              !after.length,
              `axe finds ${after.join("; ")} after the interaction`,
            );
            scans++;
            interactions++;
          }
          const thrown = errors.splice(0);
          assert(!thrown.length, `the page throws ${thrown.join("; ")}`);
          console.log(
            `PASS ${at} ${interaction ?? "(axe only)"}: ${did}; axe finds nothing${interaction ? " before or after" : ""}`,
          );
        } catch (error) {
          failures.push(`${at} ${step}: ${error.message.split("\n")[0]}`);
          errors.splice(0);
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${interactions} interaction(s) run and ${scans} axe scan(s) clean, over ${ids.length} stories light and dark`,
);
finish(SUITE, ids, failures);
