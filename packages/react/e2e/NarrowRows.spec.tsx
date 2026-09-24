import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { ButtonAtTheEnd, NarrowStepper } from "./NarrowRows.fixture";

// Rows that must fit a phone whatever the face's metrics. The story audit on
// CI's Linux found both widening the page at 320 on 2026-09-22.
const overflow = (row: import("@playwright/test").Locator) =>
  row.evaluate((el) => el.scrollWidth - el.clientWidth);

// Four steps at 16 a side took 96 of the row for margins, and a step could not
// shrink below its label: "Confirmation" ran 12 past the edge.
test("the stepper fits a 288 row in a wide face", async ({ mount }) => {
  const component = await mount(<NarrowStepper />);
  expect(await overflow(component.getByTestId("row"))).toBe(0);
});

// The ring turns as a square with round corners, and layout counts the turned
// square: at 45° it reaches 10 past the button. At the end of a row that
// widened the page for part of every turn.
test("the AI button's ring stays inside the button as it turns", async ({
  mount,
}) => {
  const component = await mount(<ButtonAtTheEnd />);
  const row = component.getByTestId("row");
  await row.evaluate((el) => {
    const ring = el.querySelector(".kozmos-ai-search-ring") as HTMLElement;
    for (const animation of ring.getAnimations()) {
      animation.pause();
      animation.currentTime = 450; // an eighth of 3.6 s: 45°
    }
  });
  expect(await overflow(row)).toBe(0);
});
