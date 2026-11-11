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
    const tree = (host.querySelector("[data-tree-scroller]") ??
      host.querySelector('[role="tree"]')) as HTMLElement;
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
    const tree = (row.closest("[data-tree-scroller]") ??
      row.closest('[role="tree"]')) as HTMLElement;
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

// The product's own width stays the tree's: the scroller, inside it, takes
// the bleed (second review of #524).
for (const [label, props, expected] of [
  ["className w-40", { className: "w-40" }, 160],
  ["style width 100%", { width: "100%" }, 268],
] as const) {
  test(`virtualized, divided and bled, with ${label}: the tree keeps its width and the strokes reach the bleed`, async ({
    mount,
  }) => {
    const component = await mount(
      <TreeVirtualizedFixture divided {...props} />,
    );
    const read = await component.evaluate((host) => {
      const tree = host.querySelector('[role="tree"]') as HTMLElement;
      const scroller = tree.querySelector(
        "[data-tree-scroller]",
      ) as HTMLElement;
      const box = host.querySelector("[data-tree-divider]") as HTMLElement;
      const t = tree.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      return {
        width: Math.round(t.width),
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
        strokeStart: Math.round(t.left - b.left),
        strokeEnd: Math.round(b.right - t.right),
      };
    });
    expect(read.width).toBe(expected);
    expect(read.scrollWidth).toBe(read.clientWidth);
    expect(read.strokeStart).toBe(16);
    // The end is the bleed less any classic scrollbar's width.
    expect(read.strokeEnd).toBeGreaterThanOrEqual(0);
    expect(read.strokeEnd).toBeLessThanOrEqual(16);
  });
}
