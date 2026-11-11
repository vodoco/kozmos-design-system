import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { MixedNumberInputFixture } from "./MixedNumberInput.fixture";

// GAP-153, decision of 11 Nov: a mixed NumberInput is never stepped. On an
// empty number input, ArrowUp became "1" and fired input and change in
// Chromium and WebKit, and the product wrote 1 over every selected feature.
test("a mixed NumberInput is not stepped by the keys or the wheel; a typed number edits it", async ({
  mount,
  page,
}) => {
  const component = await mount(<MixedNumberInputFixture />);
  const field = component.getByLabel("Height");
  const reported = component.getByTestId("reported");
  await field.focus();
  for (const key of ["ArrowUp", "ArrowDown", "PageUp", "PageDown"]) {
    await page.keyboard.press(key);
  }
  await field.hover();
  await page.mouse.wheel(0, -100);
  await expect(field).toHaveValue("");
  await expect(field).toHaveAttribute("placeholder", "Multiple values");
  await expect(reported).toHaveText("");
  await expect(component.getByRole("spinbutton")).toHaveCount(0);

  await page.keyboard.type("42");
  await expect(field).toHaveValue("42");
  await expect(field).toBeFocused();
  await expect(
    component.getByRole("spinbutton", { name: "Height" }),
  ).toHaveValue("42");
  await expect(reported).toHaveText("4,42");
});
