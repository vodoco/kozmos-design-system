/**
 * The list rows of Combobox, MultiSelect, Select and Listbox follow Figma
 * (owner, 21 Oct 2026), in a real browser, on the built package
 * (packages/react/tests/integration/list-rows-host.tsx). The importer's
 * painters (createComboboxOption, createMultiSelectOption,
 * createTimePickerOption) draw every row the same:
 *
 * - 44 tall, Combobox/option/height, which aliases Button/height/default,
 *   so 40 at compact density (decision 82); 12 at the sides; the Marker
 *   corner, 4; 2 between rows (Combobox/listbox/gap), and the standalone
 *   Listbox's own 4 (Listbox/gap); the words 14/20 regular in full ink.
 * - The active row, under the pointer or the keyboard, on background/50
 *   with the words in full ink: a light row, not a filled one.
 * - The chosen row on background/100, its check at the end in theme 600.
 *
 * In light and dark, at touch and compact. Run with ADAPTIVE_BROWSER=firefox
 * or webkit for the other engines, as CI does in test:overlays.
 */
import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("list-rows-host.tsx");
const browser = await launchFixtureBrowser({ pointer: "mouse" });
const failures = [];

/** Opens the part's list; returns its rows' locator. */
async function open(page, part) {
  if (part === "combobox" || part === "multiselect") {
    await page.getByRole("combobox").first().click();
    await page.keyboard.press("ArrowDown");
  } else if (part === "select") {
    await page.getByRole("combobox", { name: "City" }).click();
  }
  await page.getByRole("option").first().waitFor();
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished)),
  );
}

const read = (page) =>
  page.evaluate(() => {
    const root = document.querySelector("[data-kozmos-root]");
    const token = (name) => {
      const probe = document.createElement("i");
      probe.style.color = `var(${name})`;
      root.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const rows = [...document.querySelectorAll('[role="option"]')];
    const box = (el) => el.getBoundingClientRect();
    const style = (row) => {
      const s = getComputedStyle(row);
      const words = row.querySelector(
        ".kozmos-option-label, [data-radix-select-item-text], span",
      );
      const w = getComputedStyle(words ?? row);
      const check = row.querySelector("svg");
      return {
        text: row.textContent.trim(),
        height: Math.round(box(row).height * 100) / 100,
        top: box(row).top,
        bottom: box(row).bottom,
        right: box(row).right,
        start: s.paddingInlineStart,
        end: s.paddingInlineEnd,
        radius: s.borderTopLeftRadius,
        bg: s.backgroundColor,
        color: w.color,
        font: `${w.fontSize}/${w.lineHeight}/${w.fontWeight}`,
        check: check
          ? {
              color: getComputedStyle(check).color,
              right: box(check).right,
            }
          : null,
      };
    };
    return {
      rows: rows.map(style),
      tokens: {
        active: token("--primitives-colors-background-50"),
        chosen: token("--primitives-colors-background-100"),
        ink: token("--primitives-colors-foreground-0"),
        check: token("--primitives-colors-theme-600"),
      },
    };
  });

for (const part of ["combobox", "multiselect", "select", "listbox"])
  for (const theme of ["light", "dark"])
    for (const density of ["touch", "compact"]) {
      const name = `${part}, ${theme}, ${density}`;
      const page = await browser.newPage({
        viewport: { width: 480, height: 480 },
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.setContent(
          `<!doctype html><html lang="en"><head><title>Rows</title><style>body{margin:0}</style><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
        );
        await page.addScriptTag({ content: code });
        await page.evaluate((mount) => window.listRows.mount(mount), {
          part,
          theme,
          density,
        });
        await settleLayout(page);
        await open(page, part);
        // The pointer on Lisbon Oriente: the active row.
        await page
          .getByRole("option", { name: "Lisbon Oriente", exact: true })
          .hover();
        await settleLayout(page);
        const { rows, tokens } = await read(page);
        const height = density === "compact" ? 40 : 44;
        const [lisbon, porto, faro] = [
          "Lisbon",
          "Lisbon Oriente",
          "Lisbon Rossio",
        ].map((t) => rows.find((row) => row.text === t));
        for (const row of [lisbon, porto, faro]) {
          assert.ok(row, `${name}: a row is missing`);
          assert.equal(
            row.height,
            height,
            `${name}: ${row.text} is ${height} tall`,
          );
          assert.equal(row.start, "12px", `${name}: 12 at the start`);
          assert.equal(row.radius, "4px", `${name}: the Marker corner`);
          assert.equal(
            row.font,
            "14px/20px/400",
            `${name}: ${row.text}'s words`,
          );
        }
        const gap = Math.round((porto.top - lisbon.bottom) * 100) / 100;
        assert.equal(gap, part === "listbox" ? 4 : 2, `${name}: between rows`);
        assert.equal(
          porto.bg,
          tokens.active,
          `${name}: the active row is background/50`,
        );
        assert.equal(porto.color, tokens.ink, `${name}: in full ink`);
        assert.equal(
          lisbon.bg,
          tokens.chosen,
          `${name}: the chosen row is background/100`,
        );
        assert.equal(lisbon.color, tokens.ink, `${name}: in full ink`);
        assert.ok(lisbon.check, `${name}: the chosen row has its check`);
        assert.equal(
          lisbon.check.color,
          tokens.check,
          `${name}: the check is theme 600`,
        );
        assert.ok(
          Math.abs(lisbon.right - 12 - lisbon.check.right) <= 1,
          `${name}: the check ends the row, 12 in (${lisbon.right - lisbon.check.right})`,
        );
        assert.equal(
          faro.bg,
          "rgba(0, 0, 0, 0)",
          `${name}: a plain row has no fill`,
        );
        assert.deepEqual(errors, [], "no page errors");
        console.log(`PASS ${name}`);
      } catch (error) {
        failures.push(name);
        console.error(`FAIL ${name}\n${error.message ?? error}`);
      } finally {
        await page.close();
      }
    }

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} list-row scenario(s) failed.`);
  process.exit(1);
}
console.log("\nList rows: every scenario passed.");
