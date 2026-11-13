import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TableFramedFixture } from "./TableFramed.fixture";

// Decision 159: a framed Table draws a 1px border and the control radius, 16,
// round its scroller, which clips the header and the rows inside the corners,
// and its caption keeps 16 above the frame's foot. Unframed, the scroller
// draws none of it, as before.
async function measure(
  component: Awaited<
    ReturnType<Parameters<Parameters<typeof test>[1]>[0]["mount"]>
  >,
) {
  return component.evaluate((host) => {
    const table = host.querySelector("table")!;
    const frame = table.parentElement!;
    const style = getComputedStyle(frame);
    const caption = table.querySelector("caption")!.getBoundingClientRect();
    const outer = frame.getBoundingClientRect();
    return {
      border: style.borderTopWidth,
      borderColour: style.borderTopColor,
      radius: style.borderTopLeftRadius,
      overflow: style.overflowX,
      captionToFoot:
        Math.round(
          (outer.bottom -
            parseFloat(style.borderBottomWidth) -
            caption.bottom) *
            10,
        ) / 10,
    };
  });
}

test("framed: a 1px border, corners of 16, the rows clipped, the caption 16 above the foot", async ({
  mount,
}) => {
  const m = await measure(await mount(<TableFramedFixture framed />));
  expect(m.border).toBe("1px");
  expect(m.borderColour).not.toBe("rgba(0, 0, 0, 0)");
  expect(m.radius).toBe("16px");
  expect(m.overflow).not.toBe("visible");
  expect(m.captionToFoot).toBe(16);
});

test("unframed by default: no border, no corners", async ({ mount }) => {
  const m = await measure(await mount(<TableFramedFixture />));
  expect(m.border).toBe("0px");
  expect(m.radius).toBe("0px");
});
