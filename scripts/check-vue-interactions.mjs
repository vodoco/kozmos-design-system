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
