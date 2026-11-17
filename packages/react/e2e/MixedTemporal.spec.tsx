import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { MixedTemporalFixture } from "./MixedTemporal.fixture";

// GAP-255: a mixed TimePicker or DatePicker draws "Multiple values" where a
// text field draws its placeholder, in the placeholder's colour, over the
// empty segments, which it hides; focused, the segments come back to be
// typed in. Measured in every engine the suite runs.
const style = (element: import("@playwright/test").Locator, property: string) =>
  element.evaluate(
    (node, name) => getComputedStyle(node).getPropertyValue(name),
    property,
  );

for (const name of ["Opens", "Opens on"]) {
  test(`a mixed ${name === "Opens" ? "TimePicker" : "DatePicker"} draws the mixed label over its hidden segments until focused`, async ({
    mount,
  }) => {
    const component = await mount(<MixedTemporalFixture />);
    const field = component.getByLabel(name, { exact: true });
    const box = field.locator("xpath=..");
    const drawn = box.locator(".kozmos-temporal-mixed");

    await expect(drawn).toBeVisible();
    await expect(drawn).toHaveText("Multiple values");
    // The placeholder's colour, foreground/400, at the field's text size.
    expect(await style(drawn, "color")).toBe(
      await box.evaluate((node) => {
        const probe = node.ownerDocument.createElement("span");
        probe.style.color = "var(--primitives-colors-foreground-400)";
        node.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    );
    expect(await style(drawn, "font-size")).toBe(
      await style(field, "font-size"),
    );
    expect(await style(drawn, "pointer-events")).toBe("none");
    // The segments give way: the field's own text is transparent.
    expect(await style(field, "color")).toBe("rgba(0, 0, 0, 0)");
    // The words start where the field's text does, after the icon.
    const [fieldBox, drawnBox] = [
      await field.boundingBox(),
      await drawn.boundingBox(),
    ];
    expect(Math.round(drawnBox!.x)).toBe(Math.round(fieldBox!.x));
    expect(await style(drawn, "padding-left")).toBe(
      await style(field, "padding-left"),
    );

    // A press on the words reaches the field under them.
    await drawn.click({ force: true });
    await expect(field).toBeFocused();
    await expect(drawn).toBeHidden();
    expect(await style(field, "color")).not.toBe("rgba(0, 0, 0, 0)");

    await component.getByRole("button", { name: "Elsewhere" }).focus();
    await expect(drawn).toBeVisible();
  });
}
