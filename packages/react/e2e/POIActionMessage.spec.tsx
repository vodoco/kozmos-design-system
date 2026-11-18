import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { POIActionMessageFixture } from "./POIActionMessage.fixture";

// GAP-226 moved each action message into a live region mounted before it,
// so the message is no longer the box with the role. An error message must
// still be drawn as one, in the destructive text on the page's colour, and
// a status message on the muted fill, as they were.
test("an action's error message keeps its look inside its alert region", async ({
  mount,
}) => {
  const component = await mount(<POIActionMessageFixture />);
  const read = (words: string) =>
    component.getByText(words).evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, background: style.backgroundColor };
    });
  const status = await read("Link copied");
  const error = await read("Ordering is unavailable.");
  expect(error.background).not.toBe(status.background);
  expect(error.color).not.toBe(status.color);
});
