import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { WayfindingInputRowFixture } from "./WayfindingInputRow.fixture";

// The row the native rows are measured against: a rail of a 10 ring, a line
// and a 16 pin, two 300 × 40 fields 8 apart and 28 in, and a 32 swap button
// 12 in from their end, centred between them.
async function measure(
  component: Awaited<
    ReturnType<Parameters<Parameters<typeof test>[1]>[0]["mount"]>
  >,
) {
  return component.evaluate((host) => {
    const row = host.querySelector(
      "[data-kozmos-root] > div > div",
    ) as HTMLElement;
    const origin = row.getBoundingClientRect();
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [r.x - origin.x, r.y - origin.y, r.width, r.height].map(
        (v) => Math.round(v * 10) / 10,
      );
    };
    const rail = row.children[0];
    const inputs = row.querySelectorAll("input");
    return {
      row: box(row),
      ring: box(rail.children[0]),
      line: box(rail.children[1]),
      pin: box(rail.children[2]),
      origin: box(inputs[0]),
      destination: box(inputs[1]),
      swap: box(row.querySelector("button")!),
    };
  });
}

// Until 2026-09-22 the rail's line was `h-full` in a column that could not
// hold it, and flexbox took the difference from the ring and the pin: the ring
// drew 10 × 8.2, the pin 11.2 high. The rail follows the row's height, so this
// holds whatever the fields measure.
test("the rail keeps its ring round and its pin whole", async ({ mount }) => {
  const b = await measure(await mount(<WayfindingInputRowFixture />));
  const rowHeight = b.row[3];
  expect(b.ring).toEqual([3, 12, 10, 10]);
  expect(b.pin).toEqual([0, rowHeight - 12 - 16, 16, 16]);
  expect(b.line).toEqual([7, 22, 2, rowHeight - 12 - 16 - 22]);
});

test("the fields are 40 high and 8 apart, with the swap centred at their end", async ({
  mount,
  browserName,
}) => {
  // WebKit before Safari 26.4 does not apply @scope rules to inputs, so the
  // row's utilities (h-10, pe-12, border-none, shadow-raised, bg-muted/50)
  // lose to the input recipe there: 44 high, bordered, white. Known, and pinned
  // by the `test.fail` below: it fails loudly once WebKit is fixed, so the
  // expectation can be dropped.
  test.fail(
    browserName === "webkit",
    "WebKit < 26.4 drops @scope rules on inputs",
  );
  const b = await measure(await mount(<WayfindingInputRowFixture />));
  expect(b.origin).toEqual([28, 0, 300, 40]);
  expect(b.destination).toEqual([28, 48, 300, 40]);
  expect(b.swap).toEqual([284, 28, 32, 32]);
});
