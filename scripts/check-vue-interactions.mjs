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
/**
 * Puts a focusable stand-in after the story, so a Tab out of its last stop
 * has somewhere to land. Without one, Chromium hands focus to the page and
 * Firefox wraps it round to the first stop again, the very element a
 * "Tab leaves the group" check is watching. Returns a check that focus is
 * on the stand-in, and takes the stand-in away.
 */
async function standInAfterStory(page) {
  await page.evaluate(() => {
    const stand = document.createElement("button");
    stand.type = "button";
    stand.dataset.kozmosStandIn = "";
    stand.textContent = "After the story";
    document.body.append(stand);
  });
  return async () => {
    const there = await page.evaluate(
      () =>
        document.activeElement?.hasAttribute("data-kozmos-stand-in") ?? false,
    );
    await page.evaluate(() =>
      document.querySelector("[data-kozmos-stand-in]")?.remove(),
    );
    return there;
  };
}

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

/**
 * Puts a field's caret after its text, so what is typed is added at its
 * end: End would go to the end of a wrapped textarea's line. A number
 * field takes no selection; its caret is at its end already.
 */
const caretAtEnd = (field) =>
  field.evaluate((el) => {
    try {
      el.setSelectionRange(el.value.length, el.value.length);
    } catch {
      // A number field has no selection to set.
    }
  });

/** The fields' values, in order. */
const values = (page) =>
  controls(page, "input").evaluateAll((inputs) => inputs.map((i) => i.value));

/** The overlays open: dialogs, drawers, sheets and popovers. */
const overlayCount = (page) => page.locator("[role=dialog]").count();

/** Opens a story's overlay from its "Open" trigger, by the keyboard. */
async function openHost(page) {
  const open = controls(page, "button").filter({ hasText: "Open" }).first();
  await open.focus();
  await page.keyboard.press("Enter");
  await settle(page);
  assert((await overlayCount(page)) > 0, "Enter on Open opens the overlay");
}

/**
 * A modal overlay from its trigger, the story's first button: Tab reaches
 * it, Enter opens the overlay with focus inside, Tab keeps it inside,
 * Escape closes it back to the trigger, a click opens it and a click on its
 * close named `closeName` closes it.
 */
async function modal(page, closeName) {
  const trigger = controls(page, "button").first();
  const overlay = page.locator("[role=dialog]");
  const inside = () =>
    page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
  await focusStart(page);
  await page.keyboard.press("Tab");
  await settle(page);
  assert.equal(
    await trigger.evaluate((el) => el === document.activeElement),
    true,
    `Tab reaches the trigger (focus is on ${await focused(page)})`,
  );
  await page.keyboard.press("Enter");
  await settle(page);
  assert.equal(await overlay.count(), 1, "Enter opens it");
  assert.equal(
    await inside(),
    true,
    `focus moves in (focus is on ${await focused(page)})`,
  );
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  await settle(page);
  assert.equal(
    await inside(),
    true,
    `Tab stays inside (focus is on ${await focused(page)})`,
  );
  await page.keyboard.press("Escape");
  await settle(page);
  assert.equal(await overlay.count(), 0, "Escape closes it");
  assert.equal(
    await trigger.evaluate((el) => el === document.activeElement),
    true,
    `Escape hands focus back to the trigger (focus is on ${await focused(page)})`,
  );
  await trigger.click();
  await settle(page);
  assert.equal(await overlay.count(), 1, "a click opens it");
  await overlay.getByRole("button", { name: closeName }).click();
  await settle(page);
  assert.equal(await overlay.count(), 0, `a click on ${closeName} closes it`);
  return `Tab to the trigger, Enter opened it with focus inside, Tab stayed inside, Escape closed it to the trigger, a click opened it and ${closeName} closed it`;
}

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
   * ThemeProvider's demo: its three buttons, Tab after Tab, each pressed by
   * Enter, set the theme of the provider the story draws (useTheme's
   * setTheme): Light and Dark their own, System the page's colour scheme.
   * A button that sets nothing, or another theme, fails.
   */
  async "theme-switch"(page) {
    const buttons = await controls(page, "button").all();
    assert.equal(buttons.length, 3, "the demo draws three buttons");
    const themeOf = () =>
      buttons[0].evaluate((el) =>
        el.closest("[data-kozmos-root]")?.getAttribute("data-theme"),
      );
    const system = await page.evaluate(() =>
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
    const wanted = ["light", "dark", system];
    await focusStart(page);
    const did = [];
    for (const [index, button] of buttons.entries()) {
      await page.keyboard.press("Tab");
      await settle(page);
      const name = await button.evaluate((el) =>
        window.__kozmosVue.describe(el),
      );
      assert.equal(
        await button.evaluate((el) => el === document.activeElement),
        true,
        `Tab reaches ${name} (focus is on ${await focused(page)})`,
      );
      // From the other theme, so each press is seen to change it.
      await buttons[index === 1 ? 0 : 1].evaluate((el) => el.click());
      await settle(page);
      await button.focus();
      await page.keyboard.press("Enter");
      await settle(page);
      assert.equal(
        await themeOf(),
        wanted[index],
        `Enter on ${name} sets the provider's theme to ${wanted[index]}`,
      );
      did.push(`${name} ${wanted[index]}`);
    }
    return `Tab, then Enter on each: ${did.join(", ")}`;
  },

  /**
   * Every link, button and field, Tab after Tab in reading order: each link
   * followed by Enter and by a click (heard, not followed), each button
   * pressed and hovered, each field typed into, a read-only one holding its
   * value. A story's controls are reached in the order they are drawn,
   * whatever kind each is.
   */
  async "controls-in-order"(page) {
    await stayOnPage(page);
    // One selector, so every kind is looked for inside the story's surface.
    const all = await controls(
      page,
      ":is(a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]))",
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
      } else if (await control.evaluate((el) => el.readOnly)) {
        const before = await control.inputValue();
        await page.keyboard.type("4");
        await settle(page);
        assert.equal(
          await control.inputValue(),
          before,
          `${name} is read only, and holds its value`,
        );
        done.field++;
      } else {
        await caretAtEnd(control);
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
   * The buttons at fields' ends (GAP-154, GAP-212): Enter on each fires one
   * click, and a toggle's pressed state flips; then each field is typed
   * into, a read-only one holding its value. An edit the story answers by
   * making its field editable (EditAction's Map Style) is seen so: the
   * field takes what is typed.
   */
  async "field-actions"(page) {
    const buttons = await controls(page, "button.kozmos-input-action").all();
    assert(buttons.length > 0, "the story draws a button at a field's end");
    for (const button of buttons) {
      const name = await button.evaluate((el) =>
        window.__kozmosVue.describe(el),
      );
      const pressed = await button.getAttribute("aria-pressed");
      await button.focus();
      await settle(page);
      const before = await clicks(page);
      await page.keyboard.press("Enter");
      await settle(page);
      assert.equal(
        (await clicks(page)) - before,
        1,
        `Enter on ${name} fires one click`,
      );
      if (pressed !== null)
        assert.equal(
          await button.getAttribute("aria-pressed"),
          pressed === "true" ? "false" : "true",
          `Enter on ${name} flips its pressed state`,
        );
    }
    let editable = 0;
    for (const field of await controls(page, "input").all()) {
      const name = await field.evaluate((el) =>
        window.__kozmosVue.describe(el),
      );
      const readOnly = await field.evaluate((el) => el.readOnly);
      const before = await field.inputValue();
      await field.focus();
      await caretAtEnd(field);
      await page.keyboard.type("4");
      await settle(page);
      if (readOnly)
        assert.equal(
          await field.inputValue(),
          before,
          `${name} is read only, and holds its value`,
        );
      else {
        assert.equal(
          await field.inputValue(),
          `${before}4`,
          `${name} holds what was typed`,
        );
        editable++;
      }
    }
    return `${buttons.length} field-end button(s), each by Enter, then ${editable} editable field(s) typed into`;
  },

  /**
   * A mixed field (GAP-153): it shows "Multiple values" and none of its
   * own; typed into, it holds the number or text typed, is no longer mixed
   * and offers its reset; the reset takes it back to mixed, empty, with the
   * focus on the field, not lost to the page.
   */
  async "mixed-field"(page) {
    const field = controls(page, "input[data-mixed]").first();
    assert.equal(
      (await controls(page, "input[data-mixed]").count()) > 0,
      true,
      "the story draws a mixed field",
    );
    const id = await field.getAttribute("id");
    const own = controls(page, `input[id="${id}"]`);
    assert.equal(
      await own.getAttribute("placeholder"),
      "Multiple values",
      "the mixed field shows Multiple values",
    );
    assert.equal(await own.inputValue(), "", "the mixed field shows no value");
    await own.focus();
    await page.keyboard.type("4");
    await settle(page);
    assert.equal(await own.inputValue(), "4", "the field holds what was typed");
    assert.equal(
      await own.getAttribute("data-mixed"),
      null,
      "an edited field is no longer mixed",
    );
    const reset = own
      .locator("xpath=ancestor::*[contains(@class, 'kozmos-field')][1]")
      .locator("[data-slot=reset-mixed]");
    assert.equal(await reset.count(), 1, "the edited field offers its reset");
    await reset.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      "",
      "the reset takes the field back to mixed",
    );
    assert.equal(await own.inputValue(), "", "a mixed field shows no value");
    assert.equal(
      await own.evaluate((el) => el === document.activeElement),
      true,
      `the reset hands the focus to its field (focus is on ${await focused(page)})`,
    );
    return "typed into the mixed field, which took the edit and offered its reset; the reset took it back, the focus on the field";
  },

  /**
   * A native list (wave V2): Tab reaches it, ArrowDown moves its active row
   * (aria-activedescendant, focus staying on the list) and draws the
   * keyboard's ring, Enter chooses the active row, and a click chooses
   * another; a multiple list toggles each in. A list that ignores a key or
   * a press fails.
   */
  async listbox(page) {
    const list = controls(page, "[role=listbox]").first();
    const multiple =
      (await list.getAttribute("aria-multiselectable")) === "true";
    const activeId = () => list.getAttribute("aria-activedescendant");
    const chosen = () =>
      list.evaluate((el) =>
        [...el.querySelectorAll("[role=option][aria-selected=true]")].map(
          (row) => row.querySelector(".kozmos-option-label")?.textContent,
        ),
      );
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await list.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the list (focus is on ${await focused(page)})`,
    );
    const start = await activeId();
    await page.keyboard.press("ArrowDown");
    await settle(page);
    const moved = await activeId();
    assert.notEqual(moved, start, "ArrowDown moves the active row");
    assert.equal(
      await list.evaluate((el) => el === document.activeElement),
      true,
      "focus stays on the list as its active row moves",
    );
    assert.equal(
      await list.getAttribute("data-modality"),
      "keyboard",
      "the keyboard's ring is drawn on the active row",
    );
    const label = await page
      .locator(`[id="${moved}"] .kozmos-option-label`)
      .textContent();
    const before = await chosen();
    await page.keyboard.press("Enter");
    await settle(page);
    const after = await chosen();
    assert.equal(
      after.includes(label),
      !before.includes(label) || !multiple,
      `Enter chooses ${label}`,
    );
    const rows = controls(page, "[role=listbox] [role=option]");
    const other = (await rows.count()) - 1;
    const otherLabel = await rows
      .nth(other)
      .locator(".kozmos-option-label")
      .textContent();
    const held = (await chosen()).includes(otherLabel);
    await rows.nth(other).click();
    await settle(page);
    // A multiple list's click toggles the row; a single list's chooses it.
    assert.equal(
      (await chosen()).includes(otherLabel),
      multiple ? !held : true,
      `a click ${multiple && held ? "takes out" : "chooses"} ${otherLabel}`,
    );
    if (!multiple)
      assert.deepEqual(await chosen(), [otherLabel], "one option is chosen");
    return `Tab to the list, ArrowDown to ${label} with the ring, Enter on it, a click on ${otherLabel}${multiple ? ", each toggled in" : ""}`;
  },

  /**
   * A native Select (wave V2): Tab reaches its trigger, Enter opens its
   * list (in the theme's portal) with focus on a row, ArrowDown and Enter
   * choose the next row, closing the list and handing focus back, and the
   * trigger shows the row's words; then a click opens it and a click on
   * the last row chooses that one. A select that ignores a key or a press
   * fails.
   */
  async select(page) {
    const trigger = controls(page, "[role=combobox]").first();
    const list = page.locator("[role=listbox]");
    const words = async () => (await trigger.textContent()).trim();
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the trigger (focus is on ${await focused(page)})`,
    );
    const before = await words();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await list.count(), 1, "Enter opens the list");
    assert.equal(
      await page.evaluate(
        () => document.activeElement?.getAttribute("role") ?? "",
      ),
      "option",
      `the open list has focus on a row (focus is on ${await focused(page)})`,
    );
    await page.keyboard.press("ArrowDown");
    await settle(page);
    const row = await page.evaluate(() =>
      document.activeElement
        ?.querySelector(".kozmos-option-content")
        ?.textContent?.trim(),
    );
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await list.count(), 0, "Enter on a row closes the list");
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
      `the choice hands focus back to the trigger (focus is on ${await focused(page)})`,
    );
    assert.equal(await words(), row, `the trigger shows ${row}`);
    assert.notEqual(await words(), before, "the choice changed the value");
    await trigger.click();
    await settle(page);
    assert.equal(await list.count(), 1, "a click opens the list");
    const last = list.locator("[role=option]").last();
    const lastWords = (
      await last.locator(".kozmos-option-content").textContent()
    ).trim();
    await last.click();
    await settle(page);
    assert.equal(await list.count(), 0, "a click on a row closes the list");
    assert.equal(await words(), lastWords, `a click chose ${lastWords}`);
    return `Tab to the trigger, Enter to open, ArrowDown and Enter to choose ${row}, a click to open and a click on ${lastWords}`;
  },

  /** A disabled Select: no stop for Tab, and a press opens nothing. */
  async "select-disabled"(page) {
    const trigger = controls(page, "[role=combobox]").first();
    assert.equal(await trigger.isDisabled(), true, "the trigger is disabled");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      false,
      "Tab passes the disabled trigger",
    );
    const box = await trigger.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    assert.equal(
      await page.locator("[role=listbox]").count(),
      0,
      "a press on the disabled trigger opens nothing",
    );
    return "unavailable to Tab, and a press opens nothing";
  },

  /**
   * A Select drawn open: its rows are named by their words and counts, a
   * row has focus, and Escape closes the list, handing focus back to the
   * trigger.
   */
  async "select-open"(page) {
    const list = page.locator("[role=listbox]");
    assert.equal(await list.count(), 1, "the list is drawn open");
    assert.equal(
      await list.locator('[role=option][aria-label="POI, 96"]').count(),
      1,
      "a row is named by its words and its count",
    );
    assert.equal(
      await page.evaluate(
        () => document.activeElement?.getAttribute("role") ?? "",
      ),
      "option",
      `a row has focus (focus is on ${await focused(page)})`,
    );
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await list.count(), 0, "Escape closes the list");
    assert.equal(
      await controls(page, "[role=combobox]")
        .first()
        .evaluate((el) => el === document.activeElement),
      true,
      `Escape hands focus back to the trigger (focus is on ${await focused(page)})`,
    );
    return "open with a row focused, each named by its words and count, Escape closes it and focus goes back";
  },

  /**
   * A mixed Select (GAP-153): a choice edits it, offering its reset, and the
   * reset takes it back to mixed with the focus on its trigger.
   */
  async "select-mixed"(page) {
    const trigger = controls(page, "[role=combobox][data-mixed]").first();
    const id = await trigger.getAttribute("id");
    const own = controls(page, `[role=combobox][id="${id}"]`);
    await own.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      null,
      "a choice edits the mixed field",
    );
    const reset = own
      .locator("xpath=ancestor::*[contains(@class, 'kozmos-field')][1]")
      .locator("[data-slot=reset-mixed]");
    assert.equal(await reset.count(), 1, "the edited field offers its reset");
    await reset.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      "",
      "the reset takes the field back to mixed",
    );
    assert.equal(
      await own.evaluate((el) => el === document.activeElement),
      true,
      `the reset hands the focus to its trigger (focus is on ${await focused(page)})`,
    );
    return "chose in the mixed field, which took the edit and offered its reset; the reset took it back, the focus on the trigger";
  },

  /**
   * A native Combobox (wave V2): Tab reaches its field and opens its list
   * (in the theme's portal), focus staying in the field; typing filters the
   * list and makes the first match active; ArrowDown moves the active row
   * (aria-activedescendant); Enter chooses it, closing the list, and the
   * field shows its label; Escape closes a list opened again. A field that
   * ignores a key or a press fails.
   */
  async combobox(page) {
    const field = controls(page, "input[role=combobox]").first();
    const list = page.locator("[role=listbox]");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the field (focus is on ${await focused(page)})`,
    );
    assert.equal(await list.count(), 1, "focus opens the list");
    const labels = await list
      .locator("[role=option] .kozmos-option-label")
      .allTextContents();
    assert(labels.length > 1, "the list draws its options");
    await field.fill("");
    await settle(page);
    const query = labels[1].slice(0, 2);
    await page.keyboard.type(query);
    await settle(page);
    const shown = await list
      .locator("[role=option] .kozmos-option-label")
      .allTextContents();
    assert(
      shown.every((label) =>
        label.toLowerCase().includes(query.toLowerCase()),
      ) || shown.length < labels.length,
      `typing "${query}" filters the list (${shown.join(", ")})`,
    );
    const activeId = await field.getAttribute("aria-activedescendant");
    assert(activeId, "typing makes the first match active");
    if (shown.length > 1) {
      await page.keyboard.press("ArrowDown");
      await settle(page);
      assert.notEqual(
        await field.getAttribute("aria-activedescendant"),
        activeId,
        "ArrowDown moves the active row",
      );
    }
    const chosen = await page
      .locator(
        `[id="${await field.getAttribute("aria-activedescendant")}"] .kozmos-option-label`,
      )
      .textContent();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await list.count(), 0, "Enter chooses and closes the list");
    assert.equal(await field.inputValue(), chosen, `the field shows ${chosen}`);
    await page.keyboard.press("ArrowDown");
    await settle(page);
    assert.equal(await list.count(), 1, "ArrowDown opens the list again");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await list.count(), 0, "Escape closes the list");
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      "focus stays in the field",
    );
    return `Tab to the field and its list, "${query}" typed and filtered, ArrowDown and Enter to choose ${chosen}, ArrowDown and Escape`;
  },

  /**
   * A mixed Combobox (GAP-153): a query keeps it mixed, a choice edits it,
   * offering its reset, and the reset takes it back to mixed with the focus
   * on its field.
   */
  async "combobox-mixed"(page) {
    const field = controls(page, "input[role=combobox][data-mixed]").first();
    const id = await field.getAttribute("id");
    const own = controls(page, `input[id="${id}"]`);
    await own.focus();
    await page.keyboard.type("d");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      "",
      "a query keeps the field mixed",
    );
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      null,
      "a choice edits the mixed field",
    );
    const reset = own
      .locator("xpath=ancestor::*[contains(@class, 'kozmos-field')][1]")
      .locator("[data-slot=reset-mixed]");
    assert.equal(await reset.count(), 1, "the edited field offers its reset");
    await reset.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await own.getAttribute("data-mixed"),
      "",
      "the reset takes the field back to mixed",
    );
    assert.equal(await own.inputValue(), "", "a mixed field shows no value");
    assert.equal(
      await own.evaluate((el) => el === document.activeElement),
      true,
      `the reset hands the focus to its field (focus is on ${await focused(page)})`,
    );
    return "typed a query that kept the field mixed, chose, which edited it and offered its reset; the reset took it back, the focus on the field";
  },

  /**
   * Filter chips and a removable one (Chip's Default): Tab reaches each
   * toggle in reading order and draws a focus; Enter presses it, which the
   * story answers by selecting it (aria-pressed true); a click presses
   * another; then the removable chip's remove, by Enter, takes the chip
   * away. A chip that ignores a key or a press fails.
   */
  async "chip-toggles"(page) {
    const toggles = await controls(page, "button[aria-pressed]").all();
    assert(toggles.length > 1, "the story draws toggle chips");
    await focusStart(page);
    for (const toggle of toggles) {
      await page.keyboard.press("Tab");
      await settle(page);
      const name = await toggle.evaluate((el) =>
        window.__kozmosVue.describe(el),
      );
      assert.equal(
        await toggle.evaluate((el) => el === document.activeElement),
        true,
        `Tab reaches ${name} (focus is on ${await focused(page)})`,
      );
      const focusLook = await lookOf(toggle);
      await page.keyboard.press("Enter");
      await settle(page);
      assert.equal(
        await toggle.getAttribute("aria-pressed"),
        "true",
        `Enter on ${name} selects it`,
      );
      await toggle.evaluate((el) => el.blur());
      await settle(page);
      assert(
        !same(focusLook, await lookOf(toggle)),
        `${name} draws a focus that differs from its rest`,
      );
      await toggle.focus();
    }
    await toggles[0].click();
    await settle(page);
    assert.equal(
      await toggles[0].getAttribute("aria-pressed"),
      "true",
      "a click selects a chip",
    );
    const removes = controls(page, "button.kozmos-chip-remove");
    const count = await removes.count();
    assert(count > 0, "the story draws a removable chip");
    const chips = await controls(page, "[data-slot=chip]").count();
    await removes.first().focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      await controls(page, "[data-slot=chip]").count(),
      chips - 1,
      "Enter on a chip's remove takes the chip away",
    );
    return `${toggles.length} toggle chips, Tab after Tab, each selected by Enter, one by a click; a remove by Enter took its chip away`;
  },

  /**
   * A MultiSelect: focus on its input opens the list (in the theme's
   * portal), focus staying in the input; ArrowDown moves the active row;
   * Enter toggles it, a chip coming or going, the list staying open;
   * Backspace in the empty input removes the last chip; Escape closes the
   * list; a chip's remove by Enter removes its chip, focus back in the
   * input. A field that ignores a key or a press fails.
   */
  async multiselect(page) {
    const field = controls(page, "input[role=combobox]").first();
    const list = page.locator("[role=listbox]");
    const chips = () => controls(page, "[data-slot=chip]").count();
    await focusStart(page);
    await field.focus();
    await settle(page);
    assert.equal(await list.count(), 1, "focus opens the list");
    assert.equal(
      await list.getAttribute("aria-multiselectable"),
      "true",
      "the list is multi-selectable",
    );
    const before = await chips();
    const activeBefore = await field.getAttribute("aria-activedescendant");
    assert(activeBefore, "the list makes an option active");
    await page.keyboard.press("ArrowDown");
    await settle(page);
    assert.notEqual(
      await field.getAttribute("aria-activedescendant"),
      activeBefore,
      "ArrowDown moves the active row",
    );
    const id = await field.getAttribute("aria-activedescendant");
    const wasChosen = await page
      .locator(`[id="${id}"]`)
      .getAttribute("aria-selected");
    await page.keyboard.press("Enter");
    await settle(page);
    const after = await chips();
    assert.equal(
      after,
      wasChosen === "true" ? before - 1 : before + 1,
      "Enter toggles the active option, a chip coming or going",
    );
    assert.equal(await list.count(), 1, "the list stays open after a choice");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await list.count(), 0, "Escape closes the list");
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      "focus stays in the input",
    );
    if (after > 0) {
      await page.keyboard.press("Backspace");
      await settle(page);
      assert.equal(
        await chips(),
        after - 1,
        "Backspace in the empty input removes the last chip",
      );
    }
    // A chip to remove by its button.
    if ((await chips()) === 0) {
      await page.keyboard.press("ArrowDown");
      await settle(page);
      await page.keyboard.press("Enter");
      await settle(page);
      await page.keyboard.press("Escape");
      await settle(page);
    }
    const left = await chips();
    assert(left > 0, "a choice draws a chip");
    await controls(page, "button.kozmos-chip-remove").first().focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await chips(), left - 1, "a chip's remove removes its chip");
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      `the remove hands focus to the input (focus is on ${await focused(page)})`,
    );
    return "focus opened the list, ArrowDown moved its active row, Enter toggled it, Escape closed it; Backspace and a chip's remove each took a chip away, focus in the input";
  },

  /**
   * A ChipInput: typed text and Enter add an entry as a chip, the field
   * emptied; a comma adds another; Backspace in the empty field removes the
   * last; a chip's remove by Enter removes its chip, focus back in the
   * field.
   */
  async "chip-input"(page) {
    const field = controls(page, "input").first();
    const labels = () =>
      controls(page, "[data-slot=chip-label]").allTextContents();
    await focusStart(page);
    await field.focus();
    const before = await labels();
    await page.keyboard.type("tea");
    await page.keyboard.press("Enter");
    await settle(page);
    assert.deepEqual(
      await labels(),
      [...before, "tea"],
      "Enter adds the typed text as a chip",
    );
    assert.equal(await field.inputValue(), "", "the field is emptied");
    await page.keyboard.type("cake,");
    await settle(page);
    assert.deepEqual(
      await labels(),
      [...before, "tea", "cake"],
      "a comma adds the text before it",
    );
    await page.keyboard.press("Backspace");
    await settle(page);
    assert.deepEqual(
      await labels(),
      [...before, "tea"],
      "Backspace in the empty field removes the last chip",
    );
    await controls(page, "button.kozmos-chip-remove").first().focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(
      (await labels()).length,
      before.length,
      "a chip's remove removes its chip",
    );
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
      `the remove hands focus to the field (focus is on ${await focused(page)})`,
    );
    return "Enter and a comma added entries, Backspace and a chip's remove took them away, focus in the field";
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

  /**
   * One checkbox that owns its state: Tab reaches it and draws a focus;
   * Space ticks it and a click unticks it; Enter does neither, as Radix's;
   * a click on its label ticks it again.
   */
  async checkbox(page) {
    const box = controls(page, "[role=checkbox]");
    assert.equal(await box.count(), 1, "the story draws one checkbox");
    const checked = () => box.getAttribute("aria-checked");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await box.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the checkbox (focus is on ${await focused(page)})`,
    );
    const focusLook = await lookOf(box);
    await box.evaluate((el) => el.blur());
    await settle(page);
    assert(
      !same(focusLook, await lookOf(box)),
      "the checkbox draws no focus: its look is the same focused from the keyboard and at rest",
    );
    await box.focus();
    const start = await checked();
    const flipped = start === "true" ? "false" : "true";
    await page.keyboard.press("Space");
    await settle(page);
    assert.equal(await checked(), flipped, "Space toggles the checkbox");
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await checked(), flipped, "Enter does not toggle it");
    await box.click();
    await settle(page);
    assert.equal(await checked(), start, "a click toggles it back");
    const label = controls(page, "label");
    if (await label.count()) {
      await label.first().click();
      await settle(page);
      assert.equal(await checked(), flipped, "a click on its label toggles it");
    }
    return "Tab to the box, Space and a click toggle it, Enter does not, a click on its label toggles it";
  },

  /**
   * A checkbox its story holds checked: Tab reaches it, and Space and a
   * click ask for a change its owner does not make, so it stays checked.
   */
  async "checkbox-held"(page) {
    const box = controls(page, "[role=checkbox]");
    assert.equal(await box.count(), 1, "the story draws one checkbox");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await box.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the checkbox (focus is on ${await focused(page)})`,
    );
    const held = await box.getAttribute("aria-checked");
    await page.keyboard.press("Space");
    await box.click();
    await settle(page);
    assert.equal(
      await box.getAttribute("aria-checked"),
      held,
      "a held checkbox stays as its owner holds it",
    );
    return `Tab to the box; Space and a click leave it ${held}, as its owner holds it`;
  },

  /** A disabled checkbox: no stop for Tab, and a click leaves it as it is. */
  async "checkbox-disabled"(page) {
    const box = controls(page, "[role=checkbox]");
    assert.equal(await box.isDisabled(), true, "the checkbox is disabled");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await box.evaluate((el) => el === document.activeElement),
      false,
      "Tab passes the disabled checkbox",
    );
    const before = await box.getAttribute("aria-checked");
    await box.click({ force: true });
    await settle(page);
    assert.equal(
      await box.getAttribute("aria-checked"),
      before,
      "a click leaves the disabled checkbox as it is",
    );
    return "unavailable to Tab, and a click leaves it as it is";
  },

  /**
   * A star rating its story holds at a value: Tab reaches the chosen star,
   * the group's one stop; the arrows, Home and End move focus along the
   * scale, in the writing direction, while the value stays its owner's.
   */
  async "rating-held"(page) {
    const radios = controls(page, "[role=radio]");
    const count = await radios.count();
    assert(count > 1, "the story draws a scale");
    const chosen = await radios.evaluateAll((all) =>
      all.findIndex((el) => el.getAttribute("aria-checked") === "true"),
    );
    assert(chosen >= 0, "the story holds a value");
    const at = () =>
      radios.evaluateAll((all) => all.indexOf(document.activeElement));
    const leftFor = await standInAfterStory(page);
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await at(),
      chosen,
      `Tab reaches the chosen option, the group's one stop (focus is on ${await focused(page)})`,
    );
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(await at(), -1, "a second Tab leaves the group");
    assert.equal(
      await leftFor(),
      true,
      `a second Tab reaches what follows the group (focus is on ${await focused(page)})`,
    );
    await radios.nth(chosen).focus();
    for (const [key, to] of [
      ["ArrowRight", chosen + 1],
      ["ArrowLeft", chosen],
      ["End", count - 1],
      ["Home", 0],
      ["ArrowLeft", 0],
    ]) {
      await page.keyboard.press(key);
      await settle(page);
      assert.equal(await at(), to, `${key} moves focus to option ${to + 1}`);
    }
    assert.equal(
      await radios.nth(chosen).getAttribute("aria-checked"),
      "true",
      "the value stays its owner's",
    );
    return `Tab to option ${chosen + 1}, the one stop; the arrows, Home and End move along the scale; the value stays held`;
  },

  /**
   * The thumbs, held by v-model: Tab reaches the first, a click chooses up,
   * a second click on it clears the answer, and ArrowRight chooses as it
   * moves; the story's words follow the value.
   */
  async "rating-thumbs"(page) {
    const radios = controls(page, "[role=radio]");
    const words = () => controls(page, "p").first().textContent();
    assert.equal(await radios.count(), 2, "the scale is a choice of two");
    assert.match(await words(), /value: 0/, "it starts unanswered");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await radios.nth(0).evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the first thumb (focus is on ${await focused(page)})`,
    );
    await radios.nth(1).click();
    await settle(page);
    assert.equal(
      await radios.nth(1).getAttribute("aria-checked"),
      "true",
      "a click chooses the thumb",
    );
    assert.match(await words(), /value: 2 \(up\)/, "v-model holds up");
    await radios.nth(1).click();
    await settle(page);
    assert.match(await words(), /value: 0/, "a second click clears it");
    await radios.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    assert.match(
      await words(),
      /value: 2 \(up\)/,
      "ArrowRight chooses as it moves",
    );
    return "Tab to the first thumb, a click chooses up and a second clears it, ArrowRight chooses as it moves, held by v-model";
  },

  /**
   * One switch that owns its state: Tab reaches it and draws a focus; Space
   * toggles it, and so does Enter (Radix's switch leaves Enter to the
   * button's own click, where a checkbox refuses it); a click toggles it,
   * and so does a click on its label. Its state words, when it draws them,
   * follow it.
   */
  async switch(page) {
    const track = controls(page, "[role=switch]");
    assert.equal(await track.count(), 1, "the story draws one switch");
    const checked = () => track.getAttribute("aria-checked");
    const words = controls(page, "[data-slot=state-label]");
    const said = async () =>
      (await words.count()) ? await words.textContent() : null;
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await track.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the switch (focus is on ${await focused(page)})`,
    );
    const focusLook = await lookOf(track);
    await track.evaluate((el) => el.blur());
    await settle(page);
    assert(
      !same(focusLook, await lookOf(track)),
      "the switch draws no focus: its look is the same focused from the keyboard and at rest",
    );
    await track.focus();
    const start = await checked();
    const flipped = start === "true" ? "false" : "true";
    const startWords = await said();
    await page.keyboard.press("Space");
    await settle(page);
    assert.equal(await checked(), flipped, "Space toggles the switch");
    if (startWords !== null)
      assert.notEqual(await said(), startWords, "its state words follow it");
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await checked(), start, "Enter toggles it back");
    await track.click();
    await settle(page);
    assert.equal(await checked(), flipped, "a click toggles it");
    const label = controls(page, "label");
    if (await label.count()) {
      await label.first().click();
      await settle(page);
      assert.equal(await checked(), start, "a click on its label toggles it");
    }
    return "Tab to the switch, Space, Enter, a click and its label each toggle it, its words following";
  },

  /** A disabled switch: no stop for Tab, and a click leaves it as it is. */
  async "switch-disabled"(page) {
    const track = controls(page, "[role=switch]");
    assert.equal(await track.isDisabled(), true, "the switch is disabled");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await track.evaluate((el) => el === document.activeElement),
      false,
      "Tab passes the disabled switch",
    );
    const before = await track.getAttribute("aria-checked");
    await track.click({ force: true });
    await settle(page);
    assert.equal(
      await track.getAttribute("aria-checked"),
      before,
      "a click leaves the disabled switch as it is",
    );
    return "unavailable to Tab, and a click leaves it as it is";
  },

  /**
   * Each radio group of the story that owns its choice: Tab reaches its
   * chosen option, the group's one stop, and draws a focus; a second Tab
   * leaves the group; an arrow moves to the next option and chooses it, in
   * the writing direction, going round from the last; a click on another
   * option chooses it.
   */
  async "radio-choice"(page) {
    const groups = await controls(page, "[role=radiogroup]").all();
    assert(groups.length > 0, "the story draws a radio group");
    // The last group's second Tab needs somewhere to go: Firefox would wrap
    // it round to the group's own stop (standInAfterStory).
    const takeStandIn = await standInAfterStory(page);
    await focusStart(page);
    for (const group of groups) {
      const radios = group.locator("[role=radio]");
      const count = await radios.count();
      assert(count > 1, "the group draws a choice of options");
      const at = () =>
        radios.evaluateAll((all) => all.indexOf(document.activeElement));
      const chosenAt = () =>
        radios.evaluateAll((all) =>
          all.findIndex((el) => el.getAttribute("aria-checked") === "true"),
        );
      const chosen = await chosenAt();
      await page.keyboard.press("Tab");
      await settle(page);
      assert.equal(
        await at(),
        chosen >= 0 ? chosen : 0,
        `Tab reaches the chosen option, the group's one stop (focus is on ${await focused(page)})`,
      );
      const focusLook = await lookOf(radios.nth(await at()));
      const from = await at();
      await page.keyboard.press("ArrowRight");
      await settle(page);
      const next = (from + 1) % count;
      assert.equal(await at(), next, "ArrowRight moves to the next option");
      assert.equal(
        await chosenAt(),
        next,
        "the option an arrow reaches is chosen",
      );
      await radios.nth(from).click();
      await settle(page);
      assert.equal(await chosenAt(), from, "a click chooses an option");
      await radios.nth(from).focus();
      await page.keyboard.press("Tab");
      await settle(page);
      assert.equal(await at(), -1, "a second Tab leaves the group");
      // Chosen as it was when Tab reached it, and no longer focused.
      assert(
        !same(focusLook, await lookOf(radios.nth(from))),
        "the focused option draws no focus: its look is the same as at rest",
      );
      await page.keyboard.press("Shift+Tab");
      await settle(page);
    }
    await takeStandIn();
    return `${groups.length} group(s): Tab to the chosen option, the one stop; ArrowRight moves and chooses; a click chooses; Tab leaves`;
  },

  /** A disabled radio group: no stop for Tab, and a click chooses nothing. */
  async "radio-disabled"(page) {
    const radios = controls(page, "[role=radio]");
    assert(await radios.count(), "the story draws options");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await radios.evaluateAll((all) => all.includes(document.activeElement)),
      false,
      "Tab passes the disabled options",
    );
    const before = await radios.evaluateAll((all) =>
      all.map((el) => el.getAttribute("aria-checked")),
    );
    await radios.last().click({ force: true });
    await settle(page);
    assert.deepEqual(
      await radios.evaluateAll((all) =>
        all.map((el) => el.getAttribute("aria-checked")),
      ),
      before,
      "a click on a disabled option chooses nothing",
    );
    return "unavailable to Tab, and a click chooses nothing";
  },

  /**
   * A segmented control that owns its choice: Tab reaches the chosen
   * segment and draws a focus; the arrows move focus along the segments
   * without choosing; Space chooses the focused one and Enter too; a click
   * chooses another, and a click on the chosen one takes the choice back.
   */
  async segmented(page) {
    const segments = controls(page, "[role=radio]");
    const count = await segments.count();
    assert(count > 1, "the story draws its segments");
    const at = () =>
      segments.evaluateAll((all) => all.indexOf(document.activeElement));
    const chosenAt = () =>
      segments.evaluateAll((all) =>
        all.findIndex((el) => el.getAttribute("aria-checked") === "true"),
      );
    const chosen = await chosenAt();
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await at(),
      chosen,
      `Tab reaches the chosen segment (focus is on ${await focused(page)})`,
    );
    const focusLook = await lookOf(segments.nth(chosen));
    await segments.nth(chosen).evaluate((el) => el.blur());
    await settle(page);
    assert(
      !same(focusLook, await lookOf(segments.nth(chosen))),
      "the segment draws no focus: its look is the same focused and at rest",
    );
    await segments.nth(chosen).focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    const next = (chosen + 1) % count;
    assert.equal(
      await at(),
      next,
      "ArrowRight moves focus to the next segment",
    );
    assert.equal(await chosenAt(), chosen, "moving focus chooses nothing");
    await page.keyboard.press("Space");
    await settle(page);
    assert.equal(await chosenAt(), next, "Space chooses the focused segment");
    await page.keyboard.press("ArrowLeft");
    await settle(page);
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await chosenAt(), chosen, "Enter chooses the focused segment");
    await segments.nth(next).click();
    await settle(page);
    assert.equal(await chosenAt(), next, "a click chooses a segment");
    await segments.nth(next).click();
    await settle(page);
    assert.equal(
      await chosenAt(),
      -1,
      "a click on the chosen segment takes it back",
    );
    return "Tab to the chosen segment; the arrows move focus, Space and Enter choose, a click chooses and a second takes it back";
  },

  /**
   * A segmented control its story holds at a value: Tab reaches the chosen
   * segment, and a click on another asks for a change its owner does not
   * make, so the choice stays.
   */
  async "segmented-held"(page) {
    const segments = controls(page, "[role=radio]");
    const chosenAt = () =>
      segments.evaluateAll((all) =>
        all.findIndex((el) => el.getAttribute("aria-checked") === "true"),
      );
    const chosen = await chosenAt();
    assert(chosen >= 0, "the story holds a segment");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await segments
        .nth(chosen)
        .evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the chosen segment (focus is on ${await focused(page)})`,
    );
    await segments.nth((chosen + 1) % (await segments.count())).click();
    await settle(page);
    assert.equal(await chosenAt(), chosen, "the choice stays its owner's");
    return "Tab to the chosen segment; a click leaves the choice its owner holds";
  },

  /**
   * A disabled segmented control: the group keeps a Tab stop, so its
   * overflowing segments are still reached, and a click on a segment
   * chooses nothing.
   */
  async "segmented-disabled"(page) {
    const group = controls(page, "[role=group]");
    const segments = controls(page, "[role=radio]");
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(
      await group.evaluate((el) => el === document.activeElement),
      true,
      `Tab reaches the disabled control's group (focus is on ${await focused(page)})`,
    );
    const before = await segments.evaluateAll((all) =>
      all.map((el) => el.getAttribute("aria-checked")),
    );
    await segments.last().click({ force: true });
    await settle(page);
    assert.deepEqual(
      await segments.evaluateAll((all) =>
        all.map((el) => el.getAttribute("aria-checked")),
      ),
      before,
      "a click on a disabled segment chooses nothing",
    );
    return "Tab to the group, its one stop; a click chooses nothing";
  },

  /**
   * Each slider of the story: Tab reaches each thumb in turn, and draws a
   * focus; ArrowRight moves it a step up and ArrowLeft back. A click near
   * the track's end moves the nearest thumb there; Home sends the first
   * thumb to the slider's least and End the last to its most, as Radix's.
   */
  async slider(page) {
    const sliders = await controls(
      page,
      "[aria-disabled][data-orientation]",
    ).all();
    assert(sliders.length > 0, "the story draws a slider");
    const now = async (thumb) =>
      Number(await thumb.getAttribute("aria-valuenow"));
    let count = 0;
    await focusStart(page);
    for (const slider of sliders) {
      const thumbs = await slider.locator("[role=slider]").all();
      for (const thumb of thumbs) {
        await page.keyboard.press("Tab");
        await settle(page);
        assert.equal(
          await thumb.evaluate((el) => el === document.activeElement),
          true,
          `Tab reaches the thumb (focus is on ${await focused(page)})`,
        );
        const focusLook = await lookOf(thumb);
        const start = await now(thumb);
        await page.keyboard.press("ArrowRight");
        await settle(page);
        assert((await now(thumb)) > start, "ArrowRight moves the thumb up");
        await page.keyboard.press("ArrowLeft");
        await settle(page);
        assert.equal(await now(thumb), start, "ArrowLeft moves it back");
        await thumb.evaluate((el) => el.blur());
        await settle(page);
        assert(
          !same(focusLook, await lookOf(thumb)),
          "the thumb draws no focus: its look is the same focused and at rest",
        );
        await thumb.focus();
        count++;
      }
      const first = thumbs[0];
      const last = thumbs[thumbs.length - 1];
      const track = slider.locator(":scope > [data-orientation]").first();
      const box = await track.boundingBox();
      const before = await now(last);
      await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
      await settle(page);
      assert(
        (await now(last)) > before,
        "a click near the track's end moves the nearest thumb there",
      );
      await first.focus();
      await page.keyboard.press("Home");
      await settle(page);
      assert.equal(
        await first.getAttribute("aria-valuenow"),
        await first.getAttribute("aria-valuemin"),
        "Home sends the first thumb to the least",
      );
      await last.focus();
      await page.keyboard.press("End");
      await settle(page);
      assert.equal(
        await last.getAttribute("aria-valuenow"),
        await last.getAttribute("aria-valuemax"),
        "End sends the last thumb to the most",
      );
    }
    return `${count} thumb(s): Tab to each, the arrows move it, a click on the track moves the nearest, Home and End reach the ends`;
  },
  /**
   * A modal overlay (wave V2): Tab reaches its trigger and Enter opens it,
   * with focus inside; Tab stays inside however often it is pressed; Escape
   * closes it and gives the trigger its focus back; a click opens it again
   * and a click on its close closes it. One that ignores a key or a press
   * fails.
   */
  async dialog(page) {
    return modal(page, "Close");
  },
  async drawer(page) {
    return modal(page, "Close drawer");
  },
  async "bottom-sheet"(page) {
    return modal(page, "Close bottom sheet");
  },

  /**
   * An inline panel (GAP-198), open from the start: it took no focus, the
   * page beside it stays usable (a press on the header's Help leaves it
   * open), Escape from inside closes it and gives its trigger the focus, and
   * the trigger opens it again.
   */
  async "drawer-inline"(page) {
    const panel = page.locator("[role=complementary]");
    assert.equal(await panel.count(), 1, "the panel is drawn open");
    assert.equal(
      await page.evaluate(
        () => !!document.activeElement?.closest("[role=complementary]"),
      ),
      false,
      "opened by the page, it took no focus",
    );
    const help = page.getByRole("button", { name: "Help" });
    await help.click();
    await settle(page);
    assert.equal(await panel.count(), 1, "a press on the page leaves it open");
    await panel.getByRole("button", { name: "Close drawer" }).focus();
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await panel.count(), 0, "Escape from inside closes it");
    const trigger = controls(page, "button").filter({ hasText: "Get started" });
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
      `closing hands focus to its trigger (focus is on ${await focused(page)})`,
    );
    await trigger.click();
    await settle(page);
    assert.equal(await panel.count(), 1, "its trigger opens it again");
    return "open without focus, a press on the page left it open, Escape from inside closed it to its trigger, a click opened it";
  },

  /**
   * A Popover: a click on its trigger opens it; Escape closes it, focus back
   * on the trigger; a click outside closes it again.
   */
  async popover(page) {
    const trigger = controls(page, "button").first();
    const panel = page.locator("[role=dialog]");
    await trigger.click();
    await settle(page);
    assert.equal(await panel.count(), 1, "a click opens it");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await panel.count(), 0, "Escape closes it");
    assert.equal(
      await trigger.evaluate((el) => el === document.activeElement),
      true,
      `Escape hands focus back to the trigger (focus is on ${await focused(page)})`,
    );
    await trigger.click();
    await settle(page);
    assert.equal(await panel.count(), 1, "a click opens it again");
    await page.mouse.click(2, 2);
    await settle(page);
    assert.equal(await panel.count(), 0, "a click outside closes it");
    return "a click opened it, Escape closed it to its trigger, a click outside closed it";
  },

  /**
   * GAP-190: a step anchored to "Add desk", a plain button: no popover
   * attributes on it; "Got it" closes the step, "Show the step" opens it, and
   * Escape closes it, focus back on what opened it.
   */
  async "popover-anchored"(page) {
    const step = page.locator('[role=dialog][aria-label="Step 2 of 5"]');
    const desk = controls(page, "button").filter({ hasText: "Add desk" });
    assert.equal(await step.count(), 1, "the step is drawn open");
    for (const attribute of ["aria-haspopup", "aria-expanded", "aria-controls"])
      assert.equal(
        await desk.getAttribute(attribute),
        null,
        `Add desk carries no ${attribute}`,
      );
    await step.getByRole("button", { name: "Got it" }).click();
    await settle(page);
    assert.equal(await step.count(), 0, "Got it closes the step");
    const show = controls(page, "button").filter({ hasText: "Show the step" });
    // From the keyboard: WebKit gives a pressed button no focus, and a step
    // opened with nothing focused gives focus to its anchor as it closes.
    await show.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await step.count(), 1, "Show the step opens it");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await step.count(), 0, "Escape closes it");
    assert.equal(
      await show.evaluate((el) => el === document.activeElement),
      true,
      `focus goes back to what opened it (focus is on ${await focused(page)})`,
    );
    return "plain anchor, Got it closed the step, Show the step opened it, Escape closed it back to Show the step";
  },

  /** A popover beside a rect on a map: drawn open, beside the map, with no anchor element. */
  async "popover-rect"(page) {
    const hint = page.locator('[role=dialog][aria-label="Reception desk"]');
    assert.equal(await hint.count(), 1, "the hint is drawn open");
    const map = await controls(page, ".bg-muted").first().boundingBox();
    const box = await hint.boundingBox();
    assert(
      box.x + box.width > map.x &&
        box.x < map.x + map.width &&
        box.y + box.height <= map.y + map.height * 0.6 + 1,
      "the hint sits above the point on the map",
    );
    return "open above its point on the map, beside no element";
  },

  /**
   * A Tooltip: the pointer resting on its trigger opens it, Escape closes it;
   * Tab onto the trigger opens it at once and describes the trigger by it.
   */
  async tooltip(page) {
    const trigger = controls(page, "button").first();
    const tip = page.locator("[role=tooltip]");
    const box = await trigger.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(900);
    await settle(page);
    assert.equal(await tip.count(), 1, "resting on the trigger opens it");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await tip.count(), 0, "Escape closes it");
    await page.mouse.move(0, 0);
    await focusStart(page);
    await page.keyboard.press("Tab");
    await settle(page);
    assert.equal(await tip.count(), 1, "Tab onto the trigger opens it");
    const describedBy = await trigger.getAttribute("aria-describedby");
    assert.equal(
      await page.evaluate(
        (id) => document.getElementById(id)?.getAttribute("role"),
        describedBy,
      ),
      "tooltip",
      "the trigger is described by the tooltip",
    );
    await page.keyboard.press("Escape");
    await settle(page);
    return "the pointer resting opened it, Escape closed it; Tab opened it, describing the trigger";
  },

  /**
   * Wave V2's reason for porting the overlays together: a native Select in a
   * native overlay. The overlay opens from "Open"; a click opens the Select
   * and a click on a row chooses it, the overlay staying open; Enter opens
   * the list again and Escape closes it alone; the next Escape closes the
   * overlay.
   */
  async "layers-select"(page) {
    const hosts = page.locator("[role=dialog]");
    await openHost(page);
    const before = await hosts.count();
    const field = page.locator("button[role=combobox]");
    const list = page.locator("[role=listbox]");
    await field.click();
    await settle(page);
    assert.equal(await list.count(), 1, "a click opens the Select's list");
    await list.locator("[role=option]").filter({ hasText: "Banana" }).click();
    await settle(page);
    assert.equal(await list.count(), 0, "a click on a row closes the list");
    assert.equal(
      (await field.textContent()).trim(),
      "Banana",
      "the click chose Banana",
    );
    assert.equal(await hosts.count(), before, "the overlay stays open");
    await field.focus();
    await page.keyboard.press("Enter");
    await settle(page);
    assert.equal(await list.count(), 1, "Enter opens the list again");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await list.count(), 0, "Escape closes the list");
    assert.equal(await hosts.count(), before, "and leaves the overlay open");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(
      await overlayCount(page),
      0,
      "the next Escape closes the overlay",
    );
    return "opened the overlay, chose Banana with the pointer, Escape closed the list then the overlay";
  },

  /**
   * A native Combobox in a native overlay: its popup takes the pointer (a
   * modal's body turns pointer events off), a click on a row chooses it and
   * the overlay stays open; Escape closes the popup alone, the next one the
   * overlay.
   */
  async "layers-combobox"(page) {
    const hosts = page.locator("[role=dialog]");
    await openHost(page);
    const before = await hosts.count();
    const field = page.locator("input[role=combobox]");
    const list = page.locator("[role=listbox]");
    await field.click();
    await settle(page);
    assert.equal(await list.count(), 1, "a click on the field opens its list");
    await list.locator("[role=option]").filter({ hasText: "Banana" }).click();
    await settle(page);
    assert.equal(await field.inputValue(), "Banana", "the click chose Banana");
    assert.equal(await hosts.count(), before, "the overlay stays open");
    await field.focus();
    await page.keyboard.press("ArrowDown");
    await settle(page);
    assert.equal(await list.count(), 1, "ArrowDown opens the list again");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await list.count(), 0, "Escape closes the list");
    assert.equal(await hosts.count(), before, "and leaves the overlay open");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(
      await overlayCount(page),
      0,
      "the next Escape closes the overlay",
    );
    return "opened the overlay, chose Banana with the pointer in the popup, Escape closed the popup then the overlay";
  },

  /**
   * A Tooltip on a button in a Dialog: Tab onto the button opens it; Escape
   * closes the tooltip alone, the next one the Dialog.
   */
  async "layers-tooltip"(page) {
    await openHost(page);
    const tip = page.locator("[role=tooltip]");
    const button = page
      .locator("[role=dialog] button")
      .filter({ hasText: "Add to library" });
    // Focus in the Dialog moves to the button from the keyboard.
    await button.focus();
    for (let i = 0; i < 4 && !(await tip.count()); i++) {
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await settle(page);
    }
    assert.equal(await tip.count(), 1, "the button's tooltip opens on focus");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(await tip.count(), 0, "Escape closes the tooltip");
    assert.equal(await overlayCount(page), 1, "and leaves the Dialog open");
    await page.keyboard.press("Escape");
    await settle(page);
    assert.equal(
      await overlayCount(page),
      0,
      "the next Escape closes the Dialog",
    );
    return "the tooltip opened on focus in the Dialog, Escape closed it, then the Dialog";
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
