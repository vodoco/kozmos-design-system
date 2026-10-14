import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("combobox-layers.tsx");
const browser = await launchFixtureBrowser();
let count = 0;
try {
  for (const host of ["dialog", "popover", "assistant"])
    for (const layout of ["inline", "overlay"])
      for (const mode of [
        "normal",
        "empty",
        "status",
        "ime",
        "host",
        "toggle",
      ]) {
        const page = await browser.newPage({
          viewport: { width: 320, height: 800 },
          reducedMotion: "reduce",
        });
        try {
          await page.setContent(
            `<div id="root" data-host="${host}" data-layout="${layout}" data-empty="${mode === "empty"}" data-status="${mode === "status"}" data-prevent="${mode === "host"}"></div>`,
          );
          await page.addStyleTag({ content: css });
          await page.addScriptTag({ content: code });
          const trigger = page.getByRole("button", {
            name: "Open",
            exact: true,
          });
          // Safari pointer activation does not focus a button. This keyboard
          // contract must begin with a genuinely focused opener to restore.
          await trigger.focus();
          await trigger.press("Enter");
          const field = page.getByRole("combobox");
          await field.click();
          if (mode === "status") {
            // Only a status, already shown once as the field's helper text:
            // the open popup has nothing to show, so it is not drawn, takes no
            // layer, and the first Escape is the parent's.
            await expect(
              page.getByText("Locations unavailable", { exact: true }),
            ).toHaveCount(1);
            await expect(field).toHaveAccessibleDescription(
              "Locations unavailable",
            );
            await expect(page.locator("[data-combobox-popup]")).toHaveCount(0);
            await page.keyboard.press("Escape");
            await page.waitForFunction(
              () =>
                document.querySelector("[data-close-count]")?.textContent ===
                "1",
            );
            await expect(
              trigger,
              `${host}/${layout}/${mode}: parent restores trigger focus`,
            ).toBeFocused();
            console.log(`PASS ${host}/${layout}/${mode}`);
            count++;
            continue;
          }
          await page
            .locator("[data-combobox-popup]")
            .waitFor({ state: "attached" });
          await expect(page.locator("[data-combobox-popup]")).toBeVisible();
          if (mode === "toggle") await field.press("Tab");
          if (mode === "ime")
            await field.dispatchEvent("keydown", {
              key: "Escape",
              isComposing: true,
              bubbles: true,
              cancelable: true,
            });
          else await page.keyboard.press("Escape");
          const kept = mode === "ime" || mode === "host";
          await page.waitForFunction(
            (expected) =>
              document.querySelectorAll("[data-combobox-popup]").length ===
              expected,
            kept ? 1 : 0,
          );
          assert.equal(
            await page.locator("[data-close-count]").textContent(),
            "0",
            `${host}/${layout}/${mode}: parent remains open`,
          );
          assert.equal(
            await field.evaluate((node) => document.activeElement === node),
            true,
            "input keeps or regains focus",
          );
          if (kept) {
            await page
              .locator("#root")
              .evaluate((node) => (node.dataset.prevent = "false"));
            await page.keyboard.press("Escape");
            await page
              .locator("[data-combobox-popup]")
              .waitFor({ state: "detached" });
          }
          await page.keyboard.press("Escape");
          await page.waitForFunction(
            () =>
              document.querySelector("[data-close-count]")?.textContent === "1",
          );
          // Radix returns focus when the closing surface unmounts, not when
          // onOpenChange first fires. Assert that completed lifecycle outcome.
          await expect(
            trigger,
            `${host}/${layout}/${mode}: parent restores trigger focus`,
          ).toBeFocused();
          // A second cycle catches stale registrations and StrictMode cleanup.
          await trigger.press("Enter");
          await page.getByRole("combobox").click();
          await page.keyboard.press("Escape");
          await page.keyboard.press("Escape");
          await page.waitForFunction(
            () =>
              document.querySelector("[data-close-count]")?.textContent === "2",
          );
          console.log(`PASS ${host}/${layout}/${mode}`);
          count++;
        } finally {
          await page.close();
        }
      }
  // A field's overlay popup is in a portal: a box that clips its overflow
  // never cuts the list off (0.10.1). Its last place is reachable, and a
  // press on it lands in the list, not on what the box hides it behind.
  for (const name of ["Origin", "Tags"]) {
    const page = await browser.newPage({
      viewport: { width: 320, height: 800 },
    });
    try {
      await page.setContent(
        '<div id="root" data-host="clip" data-layout="overlay"></div>',
      );
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: code });
      await page.getByRole("combobox", { name }).click();
      const list = page.getByRole("listbox", { name });
      await list.waitFor();
      const drawn = await list.evaluate((node) => {
        const clip = document
          .querySelector("[data-clip]")
          .getBoundingClientRect();
        const box = node.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = Math.min(box.bottom - 8, clip.bottom + 60);
        const hit = document.elementFromPoint(x, y);
        return {
          below: box.bottom - clip.bottom,
          hitInList: Boolean(hit && node.contains(hit)),
        };
      });
      assert.ok(
        drawn.below > 40 && drawn.hitInList,
        `${name}: the popup is cut off by a box that clips its overflow (${JSON.stringify(drawn)})`,
      );
      const last = page.getByRole("option", { name: "Place 10" });
      await last.scrollIntoViewIfNeeded();
      await last.click();
      console.log(`PASS ${name}: the overlay popup is not clipped by its box`);
      count++;
    } finally {
      await page.close();
    }
  }
  // A MultiSelect in a modal dialog: its list is in a portal, outside the
  // dialog, which turns pointer events off everywhere but its layers. A press
  // on a place must choose it and leave the dialog open.
  {
    const page = await browser.newPage({
      viewport: { width: 320, height: 800 },
      reducedMotion: "reduce",
    });
    try {
      await page.setContent(
        '<div id="root" data-host="dialog-multi" data-layout="overlay"></div>',
      );
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: code });
      await page.getByRole("button", { name: "Open", exact: true }).click();
      await page.getByRole("combobox", { name: "Tags" }).click();
      const place = page.getByRole("option", { name: "Place 3" });
      await place.waitFor();
      // A real press at the option's centre, as a pointer makes it: the
      // dialog's overlay takes it if the list is not a layer.
      const at = await place.evaluate((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.mouse.click(at.x, at.y);
      await page.waitForTimeout(200);
      assert.equal(
        await page.locator("[data-close-count]").textContent(),
        "0",
        "MultiSelect in a dialog: a press on a place closed the dialog",
      );
      assert.equal(
        await page.getByRole("dialog").count(),
        1,
        "MultiSelect in a dialog: the dialog is gone",
      );
      assert.equal(
        await page
          .getByRole("option", { name: "Place 3" })
          .getAttribute("aria-selected"),
        "true",
        "MultiSelect in a dialog: a press on a place did not choose it",
      );
      // Focus on one of the field's own buttons, the list still open: the
      // first Escape closes the list, the second the dialog. The list's
      // layer is the topmost, so the dialog does not take the first, and the
      // field's handler is on its input.
      await page
        .getByRole("button", { name: "Clear selected options" })
        .focus();
      await expect(page.getByRole("listbox", { name: "Tags" })).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("listbox", { name: "Tags" }),
        "MultiSelect in a dialog: Escape on the clear button leaves the list open",
      ).toHaveCount(0);
      assert.equal(
        await page.locator("[data-close-count]").textContent(),
        "0",
        "MultiSelect in a dialog: the first Escape closed the dialog",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () => document.querySelector("[data-close-count]")?.textContent === "1",
      );
      console.log(
        "PASS MultiSelect in a modal dialog: a press chooses a place; Escape closes the list, then the dialog",
      );
      count++;
    } finally {
      await page.close();
    }
  }
  // GAP-137: the list scrolls in the listbox the field controls, not in an
  // unnamed wrapper axe can't reach (scrollable-region-focusable).
  for (const layout of ["inline", "overlay"]) {
    // axe reads a page that belongs to a context.
    const context = await browser.newContext({
      viewport: { width: 320, height: 800 },
    });
    const page = await context.newPage();
    try {
      await page.setContent(
        `<div id="root" data-host="clip" data-layout="${layout}"></div>`,
      );
      await page.addStyleTag({ content: css });
      await page.addScriptTag({ content: code });
      await page.getByRole("combobox", { name: "Origin" }).click();
      await page.getByRole("listbox", { name: "Origin" }).waitFor();
      const scrolls = await page
        .getByRole("listbox", { name: "Origin" })
        .evaluate((node) => node.scrollHeight > node.clientHeight);
      assert.ok(scrolls, `${layout}: the listbox itself scrolls`);
      const axe = await new AxeBuilder({ page })
        .withRules(["scrollable-region-focusable"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
        `${layout}: ${JSON.stringify(axe.violations.map((v) => v.nodes.map((n) => n.target)))}`,
      );
      console.log(
        `PASS GAP-137 ${layout}: the listbox is the scroll region and axe finds no unreachable scroller`,
      );
      count++;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${count} built-package popup-layer cases passed; no baselines recorded.`,
);
