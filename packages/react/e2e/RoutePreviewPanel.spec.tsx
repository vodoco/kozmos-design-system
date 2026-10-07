import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { RoutePreviewInDirection } from "./RoutePreviewPanel.fixture";

// Back points to the start edge: left, left to right, and right, right to
// left. The arrow is drawn pointing left, so right to left it is mirrored,
// as SwiftUI's arrow.backward and Compose's AutoMirrored ArrowBack are. The
// rule scales by 1 - 2 * --kozmos-rtl, so left to right it is the identity,
// not none.
for (const dir of ["ltr", "rtl"] as const) {
  test(`the back arrow points to the start edge, ${dir}`, async ({ mount }) => {
    const component = await mount(<RoutePreviewInDirection dir={dir} />);
    const arrow = component
      .getByRole("button", { name: "Back" })
      .locator("svg");
    await expect(arrow).toHaveCSS(
      "transform",
      dir === "rtl" ? "matrix(-1, 0, 0, 1, 0, 0)" : "matrix(1, 0, 0, 1, 0, 0)",
    );
  });
}
