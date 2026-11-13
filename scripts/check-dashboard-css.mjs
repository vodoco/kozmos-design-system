/**
 * The Dashboard modules' sheet in a browser (decision 183): what
 * @kozmos-ds/react/dashboard draws with dashboard.css loaded after style.css,
 * from the built package, as an app loads them. Run twice, as
 * check-owned-css.mjs runs, the second time with every @scope rule removed
 * from style.css: a module's promises live in owned rules, so they hold in a
 * browser that drops the utility layer. ADAPTIVE_BROWSER picks the engine.
 *
 * BrandLoader (CLOUD-UI-008): a 120 box; two rings in theme 500 (decision
 * 176), 6 and 4 thick, rippling; a 32 pin; the label heard, never seen. Under
 * reduced motion, still: one ring at rest, 108 round, the pin upright. As an
 * overlay, the window covered and the page under it inert.
 *
 * MapEditToolbar (CLOUD-UI-005): on maps 640, 700 and 760 wide its items,
 * the dividers' inline margins counted, stay inside the card. PropertyPicker
 * (CLOUD-UI-003): its status region is in the page before it has words.
 * KeyValueList (CLOUD-UI-004): a row lays out the same inside a <form>,
 * where a Select adds a hidden native select to it, as outside one.
 * OpeningHoursEditor (CLOUD-UI-004): a time field's arrows step its 5
 * minutes, carrying into the hour, not the browser's one part by one.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("dashboard-host.tsx");
const dashboardCss = fs.readFileSync(
  path.join(process.cwd(), "packages/react/dist/dashboard.css"),
  "utf8",
);
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const unscoped = postcss.parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

const browser = await launchFixtureBrowser();
const passed = [];
try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ])
    for (const motion of ["no-preference", "reduce"]) {
      const page = await browser.newPage({
        viewport: { width: 800, height: 600 },
        reducedMotion: motion,
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setContent(
        '<!doctype html><html><head></head><body><div id="fixture"></div></body></html>',
      );
      await page.addStyleTag({ content: stylesheet });
      await page.addStyleTag({ content: dashboardCss });
      await page.addScriptTag({ content: code });
      await page.getByTestId("light").waitFor();
      await settleLayout(page);
      const read = (id) =>
        page.getByTestId(id).evaluate((root) => {
          const box = (node) => {
            const r = node.getBoundingClientRect();
            return { width: r.width, height: r.height };
          };
          const style = (node) => getComputedStyle(node);
          const theme500 = (() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--primitives-colors-theme-500)";
            root.append(probe);
            const colour = style(probe).color;
            probe.remove();
            return colour;
          })();
          const [first, second] = root.querySelectorAll(
            ".kozmos-brand-loader-ring",
          );
          const pin = root.querySelector(".kozmos-brand-loader-pin");
          const label = root.querySelector(".kozmos-brand-loader-label");
          return {
            box: box(root),
            theme500,
            ring: {
              colour: style(first).borderTopColor,
              width: style(first).borderTopWidth,
              animation: style(first).animationName,
              opacity: style(first).opacity,
              box: box(first),
            },
            second: {
              width: style(second).borderTopWidth,
              display: style(second).display,
              delay: style(second).animationDelay,
            },
            // Its laid-out size: a wobbling pin's bounding box is turned.
            pin: {
              box: {
                width: parseFloat(style(pin).width),
                height: parseFloat(style(pin).height),
              },
              animation: style(pin).animationName,
            },
            label: { box: box(label), text: label.textContent },
          };
        });
      const where = `${mode}, ${motion}`;
      for (const id of ["light", "dark"]) {
        const drawn = await read(id);
        assert.deepEqual(
          drawn.box,
          { width: 120, height: 120 },
          `${where} ${id}: the box`,
        );
        assert.equal(
          drawn.ring.colour,
          drawn.theme500,
          `${where} ${id}: the ring is theme 500`,
        );
        assert.equal(drawn.ring.width, "6px", `${where} ${id}: the first ring`);
        assert.deepEqual(
          drawn.pin.box,
          { width: 32, height: 32 },
          `${where} ${id}: the pin`,
        );
        assert.equal(
          drawn.label.text,
          "Loading Pointr Cloud",
          `${where} ${id}: the label`,
        );
        assert.ok(
          drawn.label.box.width <= 1 && drawn.label.box.height <= 1,
          `${where} ${id}: the label is not seen`,
        );
        if (motion === "reduce") {
          assert.equal(
            drawn.ring.animation,
            "none",
            `${where} ${id}: the ring stands still`,
          );
          assert.equal(
            drawn.pin.animation,
            "none",
            `${where} ${id}: the pin stands still`,
          );
          assert.equal(
            drawn.ring.opacity,
            "1",
            `${where} ${id}: the still ring is seen`,
          );
          assert.deepEqual(
            drawn.ring.box,
            { width: 108, height: 108 },
            `${where} ${id}: the still ring at rest`,
          );
          assert.equal(
            drawn.second.display,
            "none",
            `${where} ${id}: one ring when still`,
          );
        } else {
          assert.equal(
            drawn.ring.animation,
            "kozmos-brand-loader-ripple",
            `${where} ${id}: the ring ripples`,
          );
          assert.equal(
            drawn.pin.animation,
            "kozmos-brand-loader-wobble",
            `${where} ${id}: the pin wobbles`,
          );
          assert.equal(
            drawn.second.width,
            "4px",
            `${where} ${id}: the second ring`,
          );
          assert.equal(
            drawn.second.delay,
            "-0.5s",
            `${where} ${id}: the second ring half a second ahead`,
          );
        }
      }
      // The overlay covers the window, the loader in its middle, and the
      // page under it is inert.
      const overlay = await page
        .locator(".kozmos-brand-loader-overlay")
        .evaluate((scrim) => {
          const r = scrim.getBoundingClientRect();
          const loader = scrim
            .querySelector(".kozmos-brand-loader")
            .getBoundingClientRect();
          return {
            covers: {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            },
            centre: [
              loader.left + loader.width / 2,
              loader.top + loader.height / 2,
            ],
            hit:
              document
                .elementFromPoint(5, 5)
                ?.closest(".kozmos-brand-loader-overlay") === scrim,
            cursor: getComputedStyle(scrim).cursor,
          };
        });
      assert.deepEqual(
        overlay.covers,
        { left: 0, top: 0, width: 800, height: 600 },
        `${where}: the overlay covers the window`,
      );
      assert.deepEqual(
        overlay.centre,
        [400, 300],
        `${where}: the loader in the middle`,
      );
      assert.ok(overlay.hit, `${where}: the overlay takes the pointer`);
      assert.equal(overlay.cursor, "wait", `${where}: the overlay's pointer`);
      assert.ok(
        await page
          .getByTestId("under")
          .evaluate((node) => node.closest("[inert]") !== null),
        `${where}: the page under the overlay is inert`,
      );
      assert.deepEqual(errors, [], `${where}: page errors`);
      passed.push(where);
      await page.close();
    }

  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<!doctype html><html><head></head><body><div id="fixture"></div></body></html>',
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addStyleTag({ content: dashboardCss });
    await page.evaluate(() => {
      window.__dashboardModules = true;
    });
    await page.addScriptTag({ content: code });
    await page.getByTestId("list-inside").waitFor();
    await settleLayout(page);

    // The toolbar: nothing runs past the card, at any of the three widths.
    for (const width of [640, 700, 760]) {
      const drawn = await page
        .getByTestId(`toolbar-${width}`)
        .evaluate((box) => {
          const card = box.querySelector(".kozmos-map-edit-toolbar");
          const row = card.querySelector(".kozmos-map-edit-toolbar-items");
          const last = row.lastElementChild.getBoundingClientRect();
          const inner = card.getBoundingClientRect();
          const style = getComputedStyle(card);
          return {
            scrollWidth: card.scrollWidth,
            clientWidth: card.clientWidth,
            past:
              Math.round(
                (last.right -
                  (inner.right -
                    parseFloat(style.paddingRight) -
                    parseFloat(style.borderRightWidth))) *
                  100,
              ) / 100,
            more: card.querySelector('[aria-haspopup="menu"]') !== null,
          };
        });
      assert.ok(
        drawn.scrollWidth <= drawn.clientWidth,
        `${mode} toolbar ${width}: scrollWidth ${drawn.scrollWidth} <= clientWidth ${drawn.clientWidth}`,
      );
      assert.ok(
        drawn.past <= 0,
        `${mode} toolbar ${width}: the last item ends ${drawn.past}px past the card's content box`,
      );
      assert.ok(
        drawn.more,
        `${mode} toolbar ${width}: the rest is behind More`,
      );
    }

    // The picker: its status region is rendered (not display: none) before
    // anything is typed, and draws the empty state once nothing matches.
    await page.locator(".kozmos-property-picker-trigger").click();
    await page.locator(".kozmos-property-picker-status").waitFor({
      state: "attached",
    });
    const status = () =>
      page.locator(".kozmos-property-picker-status").evaluate((region) => {
        const r = region.getBoundingClientRect();
        return {
          display: getComputedStyle(region).display,
          box: { width: r.width, height: r.height },
          text: region.textContent,
        };
      });
    const before = await status();
    assert.notEqual(
      before.display,
      "none",
      `${mode} picker: the status region is rendered before it has words`,
    );
    assert.ok(
      before.box.width <= 1 && before.box.height <= 1,
      `${mode} picker: the empty status region takes no room`,
    );
    await page.keyboard.type("zzz");
    await settleLayout(page);
    const after = await status();
    assert.match(
      after.text,
      /No properties match/,
      `${mode} picker: the words`,
    );
    assert.ok(
      after.box.width > 100 && after.box.height > 20,
      `${mode} picker: the empty state is seen`,
    );
    await page.keyboard.press("Escape");
    await settleLayout(page);

    // The list: a row's value under its name and type, the delete button at
    // the end of the first line, inside a <form> as outside it.
    const rows = (id) =>
      page.getByTestId(id).evaluate((root) =>
        [...root.querySelectorAll(".kozmos-key-value-row")].map((row) => {
          const at = (node) => {
            const r = node.getBoundingClientRect();
            const origin = row.getBoundingClientRect();
            return [
              Math.round(r.left - origin.left),
              Math.round(r.top - origin.top),
              Math.round(r.width),
              Math.round(r.height),
            ];
          };
          return {
            hiddenSelect: row.querySelector("select") !== null,
            name: at(row.querySelector("input")),
            // Found by name, not by class, so the check reads any markup.
            value: at(
              [...row.children].find((child) =>
                child.matches(
                  '[aria-label$=" value"], :has([aria-label$=" value"])',
                ),
              ),
            ),
            remove: at(row.querySelector('button[aria-label^="Remove"]')),
            row: at(row),
          };
        }),
      );
    const outside = await rows("list-outside");
    const inside = await rows("list-inside");
    assert.ok(
      inside.every((row) => row.hiddenSelect),
      `${mode} list: a Select inside the form adds its native select`,
    );
    for (const [index, row] of inside.entries()) {
      const { hiddenSelect: _, ...boxes } = row;
      const { hiddenSelect: __, ...expected } = outside[index];
      assert.deepEqual(
        boxes,
        expected,
        `${mode} list row ${index + 1}: inside a form as outside one`,
      );
      assert.ok(
        row.value[1] >= row.name[1] + row.name[3],
        `${mode} list row ${index + 1}: the value under the name`,
      );
      assert.ok(
        row.remove[1] < row.name[1] + row.name[3] &&
          row.remove[0] + row.remove[2] === row.row[2],
        `${mode} list row ${index + 1}: delete at the end of the first line`,
      );
    }
    // A mixed Boolean says so beside its switch, on the track's line, not
    // pushed to the row's far side (the switch's own box is full width).
    const mixed = await page.getByTestId("list-mixed").evaluate((root) => {
      const track = root
        .querySelector('[role="switch"]')
        .getBoundingClientRect();
      const words = [...root.querySelectorAll("*")].find(
        (node) =>
          node.childElementCount === 0 &&
          node.textContent.trim() === "Multiple values",
      );
      const box = words.getBoundingClientRect();
      return {
        gap: Math.round(box.left - track.right),
        sameLine:
          box.top < track.bottom && box.bottom > track.top && box.height <= 24,
      };
    });
    assert.ok(
      mixed.gap >= 0 && mixed.gap <= 16 && mixed.sameLine,
      `${mode} list: a mixed Boolean's words beside its switch (gap ${mixed.gap}, same line ${mixed.sameLine})`,
    );
    // The hours: a time field's own Down Arrow steps the editor's 5
    // minutes, carrying into the hour, whichever part of the time has focus
    // (the browser's would make 07:00 or 08:59).
    const opening = page.getByLabel("Monday opening time", { exact: true });
    await opening.focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(
      await opening.inputValue(),
      "07:55",
      `${mode} hours: Down Arrow from 08:00`,
    );
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    assert.equal(
      await opening.inputValue(),
      "08:05",
      `${mode} hours: Up Arrow twice from 07:55`,
    );
    assert.deepEqual(errors, [], `${mode} modules: page errors`);
    passed.push(`${mode} modules`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(
  `PASS dashboard.css in ${process.env.ADAPTIVE_BROWSER ?? "chromium"}: BrandLoader's box, rings, pin, label, stillness and overlay; MapEditToolbar inside its card at 640, 700 and 760; PropertyPicker's status region rendered before its words; KeyValueList's rows inside a form as outside; OpeningHoursEditor's arrows (${passed.join("; ")})`,
);
