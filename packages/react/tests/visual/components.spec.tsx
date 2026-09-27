import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { DynamicIsland } from "@kozmos-ds/react";

test.describe("Kozmos Runtime Component Matrix", () => {
  test("DynamicIsland geometry and shadows - Compact", async ({ mount }) => {
    const component = await mount(
      <DynamicIsland
        islandState="compact"
        compactLeading={<span style={{ color: "#4ade80" }}>Icon</span>}
        compactTrailing={<span style={{ color: "white" }}>1.2m</span>}
      />,
    );

    // Await the physics engine spring (300ms + buffer)
    await component.waitFor({ state: "visible" });
    await new Promise((r) => setTimeout(r, 600));

    await expect(component).toHaveScreenshot("dynamic-island-compact.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("DynamicIsland geometry and shadows - Minimal", async ({ mount }) => {
    const component = await mount(
      <DynamicIsland
        islandState="minimal"
        minimalContent={<span style={{ color: "#4ade80" }}>Icon</span>}
      />,
    );

    // Await the physics engine spring (300ms + buffer)
    await component.waitFor({ state: "visible" });
    await new Promise((r) => setTimeout(r, 600));

    await expect(component).toHaveScreenshot("dynamic-island-minimal.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});
