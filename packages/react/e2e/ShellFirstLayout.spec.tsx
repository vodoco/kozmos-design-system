import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { ShellFirstLayoutFixture } from "./ShellFirstLayout.fixture";

// GAP-265 lays the panel out at the host's width before the shell has
// measured itself, never at width 0. It must stay focusable then: a field
// that takes focus as the panel mounts (the route setup's From field) kept
// it until the panel was hidden with visibility, which no element can be
// focused under (#582's Visual Review: the journey stories lost their
// focused field and open list).
test("a field focused as the panel mounts keeps its focus", async ({
  mount,
}) => {
  const component = await mount(<ShellFirstLayoutFixture />);
  await expect(component.getByTestId("from")).toBeFocused();
});
