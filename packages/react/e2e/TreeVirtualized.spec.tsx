import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TreeVirtualizedFixture } from "./TreeVirtualized.fixture";

// GAP-151 with GAP-201: a virtualised tree scrolls itself, and a scroller
// clips what reaches past it. Divided with a bleed, the strokes must still
// reach the panel's edges with no sideways scroll; undivided, the focus ring
// must not be cut by the scroller's edge.

test("virtualized, divided and bled: no sideways scroll, and each stroke spans the panel", async ({
  mount,
  page,
}) => {
  const component = await mount(<TreeVirtualizedFixture divided />);
  const read = await component.evaluate((host) => {
    const panel = host.querySelector("[data-panel]") as HTMLElement;
    const tree = host.querySelector('[role="tree"]') as HTMLElement;
    const box = host.querySelector("[data-tree-divider]") as HTMLElement;
    const p = panel.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    return {
      scrollWidth: tree.scrollWidth,
      clientWidth: tree.clientWidth,
      strokeStart: Math.round(b.left - p.left),
      strokeEnd: Math.round(p.right - b.right),
    };
  });
  expect(read.scrollWidth).toBe(read.clientWidth);
  expect(read.strokeStart).toBe(0);
  expect(read.strokeEnd).toBeLessThanOrEqual(16);
  // A key first, so the browser treats the focus as the keyboard's.
  await page.keyboard.press("Shift");
  await component.locator('[role="treeitem"]').first().focus();
  const ring = await component.evaluate(
    () => getComputedStyle(document.activeElement as HTMLElement).boxShadow,
  );
  expect(ring).toContain("inset");
});

test("virtualized, undivided: the focus ring is drawn inside the row, where the scroller cannot cut it", async ({
  mount,
  page,
}) => {
  const component = await mount(<TreeVirtualizedFixture divided={false} />);
  // A key first, so the browser treats the focus as the keyboard's.
  await page.keyboard.press("Shift");
  await component.locator('[role="treeitem"]').first().focus();
  const read = await component.evaluate(() => {
    const row = document.activeElement as HTMLElement;
    const tree = row.closest('[role="tree"]') as HTMLElement;
    return {
      role: row.getAttribute("role"),
      ring: getComputedStyle(row).boxShadow,
      scrollWidth: tree.scrollWidth,
      clientWidth: tree.clientWidth,
    };
  });
  expect(read.role).toBe("treeitem");
  expect(read.ring).toContain("inset");
  expect(read.scrollWidth).toBe(read.clientWidth);
});
