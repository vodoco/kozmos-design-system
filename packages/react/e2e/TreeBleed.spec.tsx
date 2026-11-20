import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TreeBleedFixture } from "./TreeBleed.fixture";

// GAP-201, a suspected sideways overflow: a divided tree with a bleed, not
// virtualized, its strokes reaching 16 past it into the panel's padding.
// The virtualized tree has its own test (TreeVirtualized.spec). Each place
// a product puts the tree must neither scroll sideways nor widen the page,
// and each stroke must still run from the panel's edge to its edge.

const read = (host: HTMLElement) => {
  const panel = host.querySelector("[data-panel]") as HTMLElement;
  const tree = host.querySelector('[role="tree"]') as HTMLElement;
  const p = panel.getBoundingClientRect();
  const strokes = [
    ...host.querySelectorAll<HTMLElement>("[data-tree-divider]"),
  ].map((box) => {
    const b = box.getBoundingClientRect();
    return {
      start: Math.round(b.left - p.left),
      end: Math.round(p.right - b.right),
    };
  });
  return {
    panel: { scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth },
    tree: { scrollWidth: tree.scrollWidth, clientWidth: tree.clientWidth },
    page: {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    },
    strokes,
  };
};

for (const dir of ["ltr", "rtl"] as const)
  for (const [label, props] of [
    ["in a panel that does not scroll", {}],
    ["in a panel that scrolls", { panelScrolls: true }],
  ] as const)
    test(`divided and bled, ${label}, ${dir}: no sideways scroll, and every stroke spans the panel`, async ({
      mount,
    }) => {
      const component = await mount(<TreeBleedFixture dir={dir} {...props} />);
      const drawn = await component.evaluate(read);
      test.info().annotations.push({
        type: "measured",
        description: JSON.stringify({
          ...drawn,
          strokes: drawn.strokes.length,
        }),
      });
      // The tree's own scrollWidth counts the strokes past it, but it does
      // not scroll: the panel and the page are what could.
      expect(drawn.panel.scrollWidth).toBe(drawn.panel.clientWidth);
      expect(drawn.page.scrollWidth).toBe(drawn.page.clientWidth);
      expect(drawn.strokes.length).toBeGreaterThan(10);
      for (const [i, stroke] of drawn.strokes.entries()) {
        expect(stroke.start, `stroke ${i + 1} start`).toBe(0);
        expect(stroke.end, `stroke ${i + 1} end`).toBe(0);
      }
    });

// A product that makes the tree itself scroll (its own height and
// overflow) makes it the box that clips: the strokes reaching past it
// scrolled it sideways by the bleed, 16, in both engines. Its rows take no
// bleed then, and each stroke spans the tree, 16 in from the panel's edges.
test("divided and bled, the tree made to scroll by the product: no sideways scroll, the strokes span the tree", async ({
  mount,
}) => {
  const component = await mount(<TreeBleedFixture treeScrolls />);
  const drawn = await component.evaluate(read);
  test.info().annotations.push({
    type: "measured",
    description: JSON.stringify({ ...drawn, strokes: drawn.strokes.length }),
  });
  expect(drawn.tree.scrollWidth).toBe(drawn.tree.clientWidth);
  expect(drawn.page.scrollWidth).toBe(drawn.page.clientWidth);
  for (const [i, stroke] of drawn.strokes.entries()) {
    expect(stroke.start, `stroke ${i + 1} start`).toBe(16);
    expect(stroke.end, `stroke ${i + 1} end`).toBe(16);
  }
});
