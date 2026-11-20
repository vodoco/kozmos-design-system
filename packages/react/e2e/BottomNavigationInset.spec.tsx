import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { BottomNavigationInsetFixture } from "./BottomNavigationInset.fixture";

// GAP-245: the selected item's fill touched the bar's top line, and the
// boards wrapped the bar in 8 of top padding. `inset` puts 8 between the
// line and the items; without it the bar is drawn as it was.

const measure = (host: HTMLElement) => {
  const bar = host.querySelector("nav") ?? (host as HTMLElement);
  const item = bar.querySelector("[data-selected]") as HTMLElement;
  const b = bar.getBoundingClientRect();
  const i = item.getBoundingClientRect();
  return {
    gap: i.top - b.top,
    height: b.height,
    itemHeight: i.height,
  };
};

for (const density of ["compact", "default"] as const) {
  test(`${density}: without inset the selected item meets the top line, as before`, async ({
    mount,
  }) => {
    const component = await mount(
      <BottomNavigationInsetFixture density={density} />,
    );
    const drawn = await component.evaluate(measure);
    expect(drawn.gap).toBe(0);
    expect(drawn.height).toBe(drawn.itemHeight);
  });

  test(`${density}: inset puts 8 between the top line and the selected item`, async ({
    mount,
  }) => {
    const component = await mount(
      <BottomNavigationInsetFixture density={density} inset />,
    );
    const drawn = await component.evaluate(measure);
    expect(drawn.gap).toBe(8);
    expect(drawn.height).toBe(drawn.itemHeight + 8);
  });
}
