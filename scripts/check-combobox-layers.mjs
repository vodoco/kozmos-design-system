import assert from "node:assert/strict";
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
} finally {
  await browser.close();
}
console.log(
  `${count} built-package popup-layer cases passed; no baselines recorded.`,
);
