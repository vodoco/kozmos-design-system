import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { RadioCardFixture } from "./RadioCard.fixture";

// GAP-158: a chosen card's edge is theme 600 and a pixel heavier, an inset
// 1px inside its border, and it stays when the card is focused, with the
// focus ring around it. Drawn as an outline, the heavier pixel vanished on
// :focus-visible, as the scoped outline-none outweighed the owned rule.
const THEME_600 = "rgb(16, 81, 232)";
const inset = new RegExp(
  `${THEME_600.replace(/[()]/g, "\\$&")} 0px 0px 0px 1px inset`,
);

test("a chosen card's heavier edge is drawn, and kept under the focus ring", async ({
  mount,
  page,
}) => {
  const component = await mount(<RadioCardFixture />);
  const chosen = component.getByRole("radio", { name: "Satellite" });
  const other = component.getByRole("radio", { name: "Vector" });
  await expect(chosen).toHaveCSS("box-shadow", inset);
  await expect(other).not.toHaveCSS("box-shadow", inset);

  // The group's one Tab stop lands on the chosen card.
  await page.keyboard.press("Tab");
  await expect(chosen).toBeFocused();
  await expect(chosen).toHaveCSS("box-shadow", inset);
  await expect(chosen).toHaveCSS("box-shadow", /0px 0px 0px 4px/);
});

// In forced colours a box-shadow is not drawn, so the chosen card's heavier
// edge is a 2px outline in Highlight there: the choice still shows by weight.
test("a chosen card's heavier edge stays in forced colours", async ({
  mount,
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "forced colours are emulated in Chromium",
  );
  await page.emulateMedia({ forcedColors: "active" });
  const component = await mount(<RadioCardFixture />);
  const chosen = component.getByRole("radio", { name: "Satellite" });
  const other = component.getByRole("radio", { name: "Vector" });
  await expect(chosen).toHaveCSS("outline-style", "solid");
  await expect(chosen).toHaveCSS("outline-width", "2px");
  await expect(other).toHaveCSS("outline-style", "none");
});
