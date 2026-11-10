import { test, expect, type Page } from "@playwright/experimental-ct-react";
import React from "react";
import { FieldPopupOpenFixture } from "./FieldPopupOpen.fixture";

// GAP-231 and #513. Opening MultiSelect's or Combobox's list must draw the
// list, and in every frame the browser paints, the field's
// aria-activedescendant must name a drawn, enabled option, or nothing. A
// frame is read in requestAnimationFrame, as it is about to be painted;
// jsdom paints nothing, and it drew a list that a real browser never did.

type Frame = { active: string | null; listbox: boolean };

async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const tick = () => {
      const field = document.querySelector('[role="combobox"]');
      const id = field?.getAttribute("aria-activedescendant");
      const option = id ? document.getElementById(id) : null;
      w.__frames.push({
        active: !id
          ? null
          : !option
            ? `undrawn ${id}`
            : `${option.getAttribute("role")}${option.getAttribute("aria-disabled") === "true" ? " disabled" : ""}`,
        listbox: document.querySelector('[role="listbox"]') !== null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function frames(page: Page) {
  return page.evaluate(() =>
    (window as unknown as { __frames: Frame[] }).__frames.splice(0),
  );
}

/**
 * The React this run draws with, recorded, and held to the project's: the
 * chromium-react18 project (playwright.react18.config.ts) must draw with
 * React 18, or its run proves nothing about React 18 (an alias that stopped
 * applying, or apps/docs moved to 19, would leave it on the package's 19).
 */
async function expectReact(page: Page) {
  const version =
    (await page.locator("[data-react]").getAttribute("data-react")) ?? "";
  test.info().annotations.push({ type: "react", description: version });
  if (test.info().project.name === "chromium-react18")
    expect(version, "React in the chromium-react18 project").toMatch(/^18\./);
}

for (const part of ["MultiSelect", "Combobox"] as const) {
  for (const how of ["pointer", "ArrowDown"] as const) {
    test(`${part} opened with ${how} draws its list, and names a drawn option or none in every frame`, async ({
      mount,
      page,
    }) => {
      const component = await mount(<FieldPopupOpenFixture part={part} />);
      await expectReact(page);
      const field = component.getByRole("combobox", { name: "Tools" });
      if (how === "ArrowDown") {
        await field.focus();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("listbox")).toHaveCount(0);
      }
      await recordFrames(page);
      if (how === "pointer") await field.click();
      else await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("listbox")).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      const painted = await frames(page);
      expect(painted.length).toBeGreaterThan(0);
      expect(
        painted.filter(
          (frame) => frame.active !== null && frame.active !== "option",
        ),
      ).toEqual([]);
      // Once the list is drawn the field names its active option.
      expect(painted.at(-1)).toEqual({ active: "option", listbox: true });
    });
  }
}

for (const part of ["MultiSelect", "Combobox"] as const) {
  test(`${part} stays drawn, without a React error, through choices and text that matches nothing`, async ({
    mount,
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const component = await mount(<FieldPopupOpenFixture part={part} />);
    await expectReact(page);
    const field = component.getByRole("combobox", { name: "Tools" });
    await recordFrames(page);
    await field.click();
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 5000 });
    if (part === "MultiSelect")
      for (const option of await page.getByRole("option").all())
        await option.click();
    await field.fill("no matching result");
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
    await expect(
      page.getByRole("status").filter({ hasText: "No" }),
    ).toBeAttached({ timeout: 5000 });
    await expect(field).toHaveAttribute("aria-expanded", "false");
    expect(errors).toEqual([]);
    expect(
      (await frames(page)).filter(
        (frame) => frame.active !== null && frame.active !== "option",
      ),
    ).toEqual([]);
  });
}
