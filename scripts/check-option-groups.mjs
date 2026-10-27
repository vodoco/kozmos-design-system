// GAP-192: options under their groups, in a browser, on the built package,
// in Combobox, Listbox and MultiSelect, light and dark, with and without
// @scope. Each group is a role="group" named by its label, which is inside it
// and is not an option; the groups come in the order they first appear; the
// label is drawn as Select's SelectLabel draws its own, above its rows; the
// real arrow keys move aria-activedescendant through the options as they are
// drawn, never onto a label, and keep the active one in view; filtering
// keeps a group's label while any of its options matches and drops it when
// none does; and axe finds nothing.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("option-groups-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const unscoped = postcss.parse(css);
// A browser without @scope has no utilities: the label must hold on owned
// rules alone.
unscoped.walkAtRules("scope", (rule) => rule.remove());

// Options with no group first, unlabelled; then the groups.
const VISUAL_ORDER = [
  "Lift",
  "Office Desk",
  "Hot Desk",
  "Standing Desk",
  "Reception Desk",
];
const GROUPS = [
  ["Interior Asset", ["Office Desk", "Hot Desk", "Standing Desk"]],
  ["POI", ["Reception Desk"]],
];
// SelectLabel's px-3 py-1.5 text-sm font-semibold.
const LABEL = {
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: "600",
  paddingTop: "6px",
  paddingBottom: "6px",
  paddingLeft: "12px",
  paddingRight: "12px",
};
const LABEL_PROPS = Object.keys(LABEL).concat("color");

const browser = await launchFixtureBrowser();
let count = 0;

async function open(part, theme, stylesheet) {
  const context = await browser.newContext({
    viewport: { width: 480, height: 720 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Option groups</title><style>${stylesheet}</style></head><body><div id="root" data-part="${part}" data-theme="${theme}"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });
  return { context, page, errors };
}

/** The list's groups, its options and its labels' styles, as drawn. */
function readList(page, owner) {
  return page.evaluate(
    ({ owner, props }) => {
      const field = document.querySelector(owner);
      const listId =
        field.getAttribute("role") === "listbox"
          ? field.id
          : field.getAttribute("aria-controls");
      const list = document.getElementById(listId);
      const rect = (node) => {
        const r = node.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      };
      const groups = [...list.querySelectorAll('[role="group"]')].map(
        (group) => {
          const label = document.getElementById(
            group.getAttribute("aria-labelledby"),
          );
          const style = getComputedStyle(label);
          const options = [...group.querySelectorAll('[role="option"]')];
          return {
            name: label.textContent,
            labelInside: group.contains(label),
            labelRole: label.getAttribute("role"),
            options: options.map((option) => option.textContent),
            style: Object.fromEntries(props.map((p) => [p, style[p]])),
            label: rect(label),
            rows: options.map(rect),
          };
        },
      );
      const ungrouped = [...list.querySelectorAll('[role="option"]')]
        .filter((option) => !option.closest('[role="group"]'))
        .map(rect);
      return {
        groups,
        ungrouped,
        options: [...list.querySelectorAll('[role="option"]')].map(
          (option) => option.textContent,
        ),
      };
    },
    { owner, props: LABEL_PROPS },
  );
}

/** The active option, as aria-activedescendant names it, and whether it is in view. */
function readActive(page, owner) {
  return page.evaluate((owner) => {
    const field = document.querySelector(owner);
    const active = document.getElementById(
      field.getAttribute("aria-activedescendant"),
    );
    if (!active) return null;
    let scroller = active.parentElement;
    while (scroller && getComputedStyle(scroller).overflowY === "visible")
      scroller = scroller.parentElement;
    const a = active.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    return {
      role: active.getAttribute("role"),
      name: active.textContent,
      inView: a.top >= s.top - 0.5 && a.bottom <= s.bottom + 0.5,
    };
  }, owner);
}

try {
  // Select's own SelectLabel, as the stylesheet draws it in each theme.
  const selectLabel = {};
  for (const theme of ["light", "dark"]) {
    const { context, page } = await open("select", theme, css);
    const label = page.locator("[data-select-label]");
    await label.waitFor();
    selectLabel[theme] = await label.evaluate(
      (node, props) =>
        Object.fromEntries(props.map((p) => [p, getComputedStyle(node)[p]])),
      LABEL_PROPS,
    );
    assert.deepEqual(
      Object.fromEntries(Object.keys(LABEL).map((p) => [p, selectLabel[theme][p]])),
      LABEL,
      `${theme}: SelectLabel draws as this check expects`,
    );
    await context.close();
  }

  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ])
    for (const theme of ["light", "dark"])
      for (const part of ["combobox", "listbox", "multiselect"]) {
        const label = `${mode}/${theme}/${part}`;
        const { context, page, errors } = await open(part, theme, stylesheet);
        const owner =
          part === "listbox" ? '[role="listbox"]' : '[role="combobox"]';
        const field = page.locator(owner);
        await field.waitFor();
        await field.focus();
        if (part !== "listbox") await page.getByRole("listbox").waitFor();
        await settleLayout(page);

        const list = await readList(page, owner);
        assert.deepEqual(
          list.groups.map((g) => [g.name, g.options]),
          GROUPS,
          `${label}: the groups, in the order they first appear`,
        );
        assert.deepEqual(list.options, VISUAL_ORDER, `${label}: no label is an option`);
        for (const group of list.groups) {
          assert.ok(group.labelInside, `${label}: ${group.name}'s label is in its group`);
          assert.equal(group.labelRole, "presentation", `${label}: ${group.name}'s label`);
          // Drawn as SelectLabel: its numbers, and in full, its colour too.
          assert.deepEqual(
            Object.fromEntries(Object.keys(LABEL).map((p) => [p, group.style[p]])),
            LABEL,
            `${label}: ${group.name}'s label is drawn as SelectLabel`,
          );
          if (mode === "full")
            assert.equal(
              group.style.color,
              selectLabel[theme].color,
              `${label}: ${group.name}'s label has SelectLabel's colour`,
            );
          const [first] = group.rows;
          assert.ok(
            group.label.bottom <= first.top + 0.5,
            `${label}: ${group.name}'s label is above its rows`,
          );
          assert.ok(
            Math.abs(group.label.left - first.left) <= 0.5,
            `${label}: ${group.name}'s label starts where its rows do`,
          );
          // The rows keep the list's spacing: the Listbox grid's 4, 2
          // elsewhere.
          for (let i = 1; i < group.rows.length; i += 1)
            assert.ok(
              Math.abs(group.rows[i].top - group.rows[i - 1].bottom - (part === "listbox" ? 4 : 2)) <= 0.5,
              `${label}: ${group.name}'s rows ${i - 1} and ${i} are ${part === "listbox" ? 4 : 2} apart, read ${group.rows[i].top - group.rows[i - 1].bottom}`,
            );
        }
        // And at every join: a label and its first row, the rows with no
        // group and the first label, a group's last row and the next label.
        const gap = part === "listbox" ? 4 : 2;
        const joins = [];
        list.groups.forEach((group, i) => {
          joins.push([`${group.name}'s label and its first row`, group.rows[0].top - group.label.bottom]);
          const before = i === 0 ? list.ungrouped.at(-1) : list.groups[i - 1].rows.at(-1);
          if (before)
            joins.push([`the row before ${group.name}'s label and the label`, group.label.top - before.bottom]);
        });
        for (const [what, read] of joins)
          assert.ok(Math.abs(read - gap) <= 0.5, `${label}: ${what} are ${gap} apart, read ${read}`);
        assert.ok(
          list.ungrouped.length === 1 && list.ungrouped[0].bottom <= list.groups[0].label.top + 0.5,
          `${label}: Lift, with no group, comes before every group`,
        );

        // The real keys: down through every option as drawn, and round.
        const seen = [];
        let active = await readActive(page, owner);
        seen.push(active?.name);
        for (let step = 0; step < VISUAL_ORDER.length; step += 1) {
          const before = await field.getAttribute("aria-activedescendant");
          await page.keyboard.press("ArrowDown");
          // Every step moves it: the next option, or round to the first.
          await page.waitForFunction(
            ({ owner, before }) =>
              document.querySelector(owner).getAttribute("aria-activedescendant") !== before,
            { owner, before },
            { polling: 50, timeout: 5000 },
          );
          active = await readActive(page, owner);
          assert.equal(active?.role, "option", `${label}: the keys land on options only`);
          assert.ok(active.inView, `${label}: ${active.name} is scrolled into view`);
          seen.push(active.name);
        }
        assert.deepEqual(
          seen,
          VISUAL_ORDER.concat(VISUAL_ORDER[0]),
          `${label}: the arrow keys follow the options as drawn`,
        );

        // To the last option, POI's only one, and up into Interior Asset:
        // each time the group's label comes into view with its first option.
        const labelInView = (name) =>
          page.evaluate((name) => {
            const label = [...document.querySelectorAll(".kozmos-option-group-label")].find(
              (node) => node.textContent === name,
            );
            let scroller = label.parentElement;
            while (scroller && getComputedStyle(scroller).overflowY === "visible")
              scroller = scroller.parentElement;
            const l = label.getBoundingClientRect();
            const box = scroller.getBoundingClientRect();
            return l.top >= box.top - 0.5 && l.bottom <= box.bottom + 0.5;
          }, name);
        const moveTo = async (key, name) => {
          await page.keyboard.press(key);
          await page.waitForFunction(
            ({ owner, name }) => {
              const id = document.querySelector(owner).getAttribute("aria-activedescendant");
              return document.getElementById(id)?.textContent === name;
            },
            { owner, name },
            { polling: 50, timeout: 5000 },
          );
        };
        // MultiSelect has no Home or End: up from the first wraps to the last.
        await moveTo(part === "multiselect" ? "ArrowUp" : "End", "Reception Desk");
        assert.ok(await labelInView("POI"), `${label}: at the last option, POI's label is in view`);
        await moveTo("ArrowUp", "Standing Desk");
        await moveTo("ArrowUp", "Hot Desk");
        await moveTo("ArrowUp", "Office Desk");
        assert.ok(
          await labelInView("Interior Asset"),
          `${label}: up into Interior Asset, its label is in view`,
        );
        if (part !== "multiselect") {
          await moveTo("Home", "Lift");
          await moveTo("End", "Reception Desk");
          assert.ok(await labelInView("POI"), `${label}: Home, then End, POI's label is in view`);
        }

        if (part !== "listbox") {
          // A press on a group's label, or on the list's padding, takes no
          // focus from the field, so its list stays open.
          const input = page.getByRole("combobox");
          await page.locator(".kozmos-option-group-label", { hasText: "POI" }).click();
          await page.waitForTimeout(100);
          assert.equal(await page.getByRole("listbox").count(), 1, `${label}: a press on a label keeps the list open`);
          assert.equal(
            await input.evaluate((node) => document.activeElement === node),
            true,
            `${label}: a press on a label keeps focus in the field`,
          );
          // Combobox's frame holds its list; MultiSelect's list is its frame.
          // Its padding is a utility, gone without @scope: press it where
          // it has some.
          const frame = await page.evaluate(() => {
            const node =
              document.querySelector("[data-combobox-popup]") ??
              document.querySelector('[role="listbox"]');
            const r = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              x: r.left + parseFloat(style.paddingLeft) / 2,
              y: r.top + parseFloat(style.paddingTop) / 2,
              padded: parseFloat(style.paddingTop) >= 4,
            };
          });
          if (frame.padded) await page.mouse.click(frame.x, frame.y);
          await page.waitForTimeout(100);
          assert.equal(await page.getByRole("listbox").count(), 1, `${label}: a press on a label or the padding keeps the list open`);
          assert.equal(
            await input.evaluate((node) => document.activeElement === node),
            true,
            `${label}: and focus in the field`,
          );
        }

        const violations = (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
          [],
          `${label}: axe finds nothing`,
        );

        if (part !== "listbox") {
          // Filtering: "hot" leaves Interior Asset's label and drops POI's.
          await field.pressSequentially("hot");
          await page.waitForFunction(
            () => document.querySelectorAll('[role="option"]').length === 1,
            undefined,
            { polling: 50, timeout: 5000 },
          );
          const filtered = await readList(page, owner);
          assert.deepEqual(
            filtered.groups.map((g) => [g.name, g.options]),
            [["Interior Asset", ["Hot Desk"]]],
            `${label}: filtered, only the group that matches keeps its label`,
          );
          assert.equal(
            await page.getByText("POI", { exact: true }).count(),
            0,
            `${label}: filtered, POI's label is gone`,
          );
          active = await readActive(page, owner);
          assert.equal(active?.name, "Hot Desk", `${label}: filtered, the match is active`);
        }
        assert.deepEqual(errors, [], `${label}: no page errors`);
        console.log(`PASS ${label}`);
        count++;
        await context.close();
      }
  // A long option in a group, in a 280 Listbox: the group's grid column is
  // the list's width, so the option truncates and nothing scrolls sideways.
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ]) {
    const { context, page, errors } = await open("listbox-long", "light", stylesheet);
    const list = page.getByRole("listbox");
    await list.waitFor();
    await settleLayout(page);
    const read = await list.evaluate((node) => {
      // The grouped one: Lift, with no group, comes first.
      const option = node.querySelector('[role="group"] [role="option"]');
      const label = option.querySelector(".kozmos-option-label");
      return {
        overflow: node.scrollWidth - node.clientWidth,
        option: option.getBoundingClientRect().width,
        list: node.clientWidth,
        clipped: label.scrollWidth > label.clientWidth,
      };
    });
    assert.ok(
      read.overflow <= 1,
      `${mode}: a long grouped option scrolls the list sideways by ${read.overflow}px (${JSON.stringify(read)})`,
    );
    assert.ok(
      read.option <= read.list + 0.5 && read.clipped,
      `${mode}: the long grouped option truncates in the list's width (${JSON.stringify(read)})`,
    );
    assert.deepEqual(errors, [], `${mode}: long: no page errors`);
    console.log(`PASS ${mode}/listbox-long`);
    count++;
    await context.close();
  }
  console.log(`Option groups: ${count} passes`);
} finally {
  await browser.close();
}
