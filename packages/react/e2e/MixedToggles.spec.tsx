import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { MixedTogglesFixture } from "./MixedToggles.fixture";

// Decisions 188 to 190 (17 Nov 2026), read from the built stylesheet in
// Chromium and WebKit. A mixed Switch is its track filled with the theme
// fill as when on, no thumb, and Checkbox's dash, white, in its middle. A
// mixed ToggleButton is a dashed theme edge on the muted fill under the
// page's ink, with the dash before its label. A switch and a toggle at rest,
// on and pressed keep the looks they had.
const FILL = "rgb(19, 91, 236)"; // theme 500, both themes
const INK = "rgb(255, 255, 255)"; // the theme foreground, both themes
const MUTED = { light: "rgb(227, 228, 232)", dark: "rgb(23, 25, 28)" }; // background/100
const TEXT = { light: "rgb(0, 0, 0)", dark: "rgb(255, 255, 255)" }; // foreground/0
const DANGER = { light: "rgb(212, 28, 66)", dark: "rgb(233, 90, 119)" }; // danger 600

const style = (
  locator: import("@playwright/test").Locator,
  properties: string[],
) =>
  locator.evaluate((node, names) => {
    const computed = getComputedStyle(node);
    return Object.fromEntries(
      names.map((name) => [name, computed.getPropertyValue(name)]),
    );
  }, properties);

for (const theme of ["light", "dark"] as const) {
  test(`a mixed Switch is the theme fill with a centred white dash and no thumb (${theme})`, async ({
    mount,
  }) => {
    const component = await mount(<MixedTogglesFixture />);
    const track = component.getByTestId(`${theme}-switch-mixed`);
    expect(
      await style(track, ["background-color", "border-top-color"]),
    ).toEqual({ "background-color": FILL, "border-top-color": FILL });
    const dash = track.locator('[data-slot="mixed-dash"]');
    expect(await style(dash, ["color"])).toEqual({ color: INK });
    await expect(track.locator("span")).toHaveCount(0);
    const [trackBox, dashBox] = [
      await track.boundingBox(),
      await dash.boundingBox(),
    ];
    if (!trackBox || !dashBox) throw new Error("not drawn");
    expect(dashBox.width).toBe(16);
    expect(
      Math.abs(
        trackBox.x + trackBox.width / 2 - (dashBox.x + dashBox.width / 2),
      ),
    ).toBeLessThanOrEqual(0.5);
    expect(
      Math.abs(
        trackBox.y + trackBox.height / 2 - (dashBox.y + dashBox.height / 2),
      ),
    ).toBeLessThanOrEqual(0.5);

    const error = component.getByTestId(`${theme}-switch-mixed-error`);
    expect(await style(error, ["background-color"])).toEqual({
      "background-color": DANGER[theme],
    });
  });

  test(`a mixed ToggleButton is a dashed theme edge on the muted fill, with a dash before its label (${theme})`, async ({
    mount,
    page,
  }) => {
    const component = await mount(<MixedTogglesFixture />);
    for (const id of ["toggle-mixed", "toggle-mixed-outline"]) {
      const toggle = component.getByTestId(`${theme}-${id}`);
      const look = {
        "border-top-style": "dashed",
        "border-top-width": "1px",
        "border-top-color": FILL,
        "background-color": MUTED[theme],
        color: TEXT[theme],
      };
      expect(await style(toggle, Object.keys(look))).toEqual(look);
      await toggle.hover();
      expect(
        await style(toggle, ["background-color", "border-top-style"]),
      ).toEqual({
        "background-color": MUTED[theme],
        "border-top-style": "dashed",
      });
      await page.mouse.move(0, 0);
      const dash = toggle.locator('[data-slot="mixed-dash"]');
      const [dashBox, toggleBox] = [
        await dash.boundingBox(),
        await toggle.boundingBox(),
      ];
      if (!dashBox || !toggleBox) throw new Error("not drawn");
      expect(dashBox.width).toBe(16);
      // Before the label: the dash leads, the words follow it.
      const wordsLeft = await toggle.evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node.lastChild as Node);
        return range.getBoundingClientRect().left;
      });
      expect(dashBox.x + dashBox.width).toBeLessThan(wordsLeft);
    }
  });

  test(`a switch and a toggle at rest, on and pressed keep their looks (${theme})`, async ({
    mount,
  }) => {
    const component = await mount(<MixedTogglesFixture />);
    expect(
      await style(component.getByTestId(`${theme}-switch-on`), [
        "background-color",
      ]),
    ).toEqual({ "background-color": FILL });
    await expect(
      component.getByTestId(`${theme}-switch-on`).locator("span"),
    ).toHaveCount(1);
    expect(
      await style(component.getByTestId(`${theme}-toggle-on`), [
        "background-color",
        "color",
        "border-top-width",
      ]),
    ).toEqual({
      "background-color": FILL,
      color: INK,
      "border-top-width": "0px",
    });
    expect(
      await style(component.getByTestId(`${theme}-toggle-off`), [
        "background-color",
        "border-top-width",
      ]),
    ).toEqual({
      "background-color": "rgba(0, 0, 0, 0)",
      "border-top-width": "0px",
    });
  });
}
