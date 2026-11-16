/**
 * Chips longer than their room, on the built package in a real browser
 * (packages/react/tests/integration/chip-shrink-host.tsx): MultiSelect in a
 * 296px and a 200px field with long chosen labels, and Chip on its own,
 * removable, pressable and plain, in a 120px box and a 160px ChipGroup. In
 * touch and compact, left to right and right to left.
 *
 * - A chip shrinks to its room: it lies inside its ChipGroup (MultiSelect's
 *   chip area, before the clear and open) or its box, never past it. A
 *   chip's automatic minimum was its words, which never wrap, so "Booking
 *   required" ran 156.7 wide in a 136 chip area, under the field's clear
 *   (#537's audit, WCAG 2.5.8).
 * - No chip, and no chip's remove, overlaps MultiSelect's clear or open.
 * - Every remove is drawn at least 24 by 24, and a point at its middle hits
 *   it, not a button over it.
 * - A label that does not fit ends in an ellipsis, on one line, and its words
 *   are all still there, so the chip's name and its remove's ("Remove
 *   Booking required") are the whole label.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-chip-shrink.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const PARTS = [
  "multiselect",
  "multiselect-narrow",
  "chip-removable",
  "chip-pressable",
  "chip-plain",
  "chip-group",
];
/** The fixture's longest label, wider than every room it is drawn in. */
const LONGEST = "Step-free access from the street entrance";
/** Half a pixel, for subpixel layout. */
const SLACK = 0.5;

const { code, css } = await buildReactFixture("chip-shrink-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let reads = 0;
const expect = (label, ok, detail) => {
  reads++;
  if (!ok) failures.push(`${label}: ${detail}`);
};
const fmt = (r) =>
  `${r.left.toFixed(1)}–${r.right.toFixed(1)} × ${r.top.toFixed(1)}–${r.bottom.toFixed(1)}`;
const overlaps = (a, b) =>
  a.left < b.right - SLACK &&
  b.left < a.right - SLACK &&
  a.top < b.bottom - SLACK &&
  b.top < a.bottom - SLACK;

try {
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>Chip shrink</title><style>${css}</style></head><body><div id="fixture"></div></body></html>`,
  );
  await page.addScriptTag({ content: code });

  for (const density of ["touch", "compact"]) {
    for (const dir of ["ltr", "rtl"]) {
      const board = `${density} ${dir}`;
      await page.evaluate((mount) => window.mountChips(mount), {
        density,
        dir,
      });
      await page
        .locator('[data-part="chip-group"] [data-slot="chip"]')
        .first()
        .waitFor();
      await settleLayout(page);

      for (const part of PARTS) {
        const read = await page.evaluate((part) => {
          const host = document.querySelector(`[data-part="${part}"]`);
          const box = (el) => {
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            };
          };
          const group = host.querySelector('[data-slot="chip-group"]');
          const room = box(group ?? host);
          const actions = [
            ...host.querySelectorAll("button.kozmos-combobox-action"),
          ].map((b) => ({ label: b.getAttribute("aria-label"), box: box(b) }));
          const chips = [...host.querySelectorAll('[data-slot="chip"]')].map(
            (chip) => {
              const label = chip.querySelector('[data-slot="chip-label"]');
              const remove = chip.querySelector(".kozmos-chip-remove");
              const style = getComputedStyle(label);
              let hit = null;
              if (remove) {
                const r = remove.getBoundingClientRect();
                const at = document.elementFromPoint(
                  r.left + r.width / 2,
                  r.top + r.height / 2,
                );
                hit = at?.closest("button")?.getAttribute("aria-label") ?? null;
              }
              return {
                text: label.textContent,
                box: box(chip),
                truncated: label.scrollWidth > label.clientWidth + 0.5,
                ellipsis: style.textOverflow,
                nowrap: style.whiteSpace,
                remove: remove && {
                  name: remove.getAttribute("aria-label"),
                  box: box(remove),
                  hit,
                },
              };
            },
          );
          return { room, actions, chips };
        }, part);

        expect(
          `${board} ${part}: has chips`,
          read.chips.length > 0,
          "no chip drawn",
        );
        for (const chip of read.chips) {
          const at = `${board} ${part} "${chip.text}"`;
          expect(
            `${at}: inside its room`,
            chip.box.left >= read.room.left - SLACK &&
              chip.box.right <= read.room.right + SLACK,
            `chip ${fmt(chip.box)}, room ${fmt(read.room)} (${(chip.box.right - chip.box.left).toFixed(1)} wide in ${(read.room.right - read.room.left).toFixed(1)})`,
          );
          for (const action of read.actions) {
            expect(
              `${at}: clear of "${action.label}"`,
              !overlaps(chip.box, action.box),
              `chip ${fmt(chip.box)}, button ${fmt(action.box)}`,
            );
          }
          // The longest label fits none of the rooms here.
          if (chip.text === LONGEST)
            expect(
              `${at}: truncated`,
              chip.truncated,
              "its words are drawn whole, so the chip is as wide as they are",
            );
          if (chip.truncated)
            expect(
              `${at}: a label that does not fit ends in an ellipsis`,
              chip.ellipsis === "ellipsis" && chip.nowrap === "nowrap",
              `text-overflow ${chip.ellipsis}, white-space ${chip.nowrap}`,
            );
          if (chip.remove) {
            const { box, name, hit } = chip.remove;
            const w = box.right - box.left;
            const h = box.bottom - box.top;
            expect(
              `${at}: remove at least 24 × 24`,
              w >= 24 - 0.01 && h >= 24 - 0.01,
              `${w.toFixed(1)} × ${h.toFixed(1)}`,
            );
            expect(
              `${at}: remove inside its room`,
              box.left >= read.room.left - SLACK &&
                box.right <= read.room.right + SLACK,
              `remove ${fmt(box)}, room ${fmt(read.room)}`,
            );
            expect(
              `${at}: remove named by the whole label`,
              name === `Remove ${chip.text}`,
              JSON.stringify(name),
            );
            expect(
              `${at}: its middle hits the remove`,
              hit === name,
              `hits ${JSON.stringify(hit)}`,
            );
            for (const action of read.actions)
              expect(
                `${at}: remove clear of "${action.label}"`,
                !overlaps(box, action.box),
                `remove ${fmt(box)}, button ${fmt(action.box)}`,
              );
          }
        }
      }
    }
  }
  if (errors.length) failures.push(`page errors: ${errors.join("; ")}`);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL chip shrink (${failures.length} of ${reads}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS chip shrink: ${reads} reads — long chips in MultiSelect's 296 and 200 fields and Chip alone in 120 and 160 ` +
    "boxes, touch and compact, both directions: every chip inside its room and clear of the field's clear and open, " +
    "its words truncated with an ellipsis, every remove at least 24 × 24, hit at its middle and named by the whole label",
);
