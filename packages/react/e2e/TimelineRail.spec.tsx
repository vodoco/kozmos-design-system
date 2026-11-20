import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TimelineRailFixture } from "./TimelineRail.fixture";

// GAP-247: Timeline drew its rail as the list's left border, so it ran the
// full height of the last item, under its dot, as if a step followed. The
// rail ends at the last item's marker now, and still runs from the first
// marker to the last. Read from what is drawn, so it holds however the rail
// is made.

type Read = { between: number; below: number; belowRows: number };

for (const theme of ["light", "dark"] as const)
  for (const density of ["default", "compact"] as const)
    test(`${theme}, ${density}: the rail runs between the markers and ends at the last`, async ({
      mount,
    }) => {
      const component = await mount(
        <TimelineRailFixture density={density} theme={theme} />,
      );
      // The host, 16 round the list: the markers stand 11 out past its edge.
      const host = component.locator("[data-host]");
      const png = (await host.screenshot()).toString("base64");
      const read: Read = await host.evaluate(async (frame, png) => {
        const ol = frame.querySelector("ol")!;
        const list = ol.getBoundingClientRect();
        const box = frame.getBoundingClientRect();
        const markers = [
          ...ol.querySelectorAll<HTMLElement>("[data-timeline-marker]"),
        ].map((marker) => marker.getBoundingClientRect());
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const scale = image.width / box.width;
        // The rail is a 1 px line through the markers' centres: how far the
        // pixels across it, 2 either side, differ, at a row of the list.
        const x = markers[0].left + markers[0].width / 2 - box.left;
        const spread = (y: number) => {
          const sums = [-2, -1, 0, 1, 2].map((dx) => {
            const [r, g, b] = context.getImageData(
              Math.round((x + dx) * scale),
              Math.round(y * scale),
              1,
              1,
            ).data;
            return r + g + b;
          });
          return Math.max(...sums) - Math.min(...sums);
        };
        // Between the first two markers, clear of their 8 rings.
        const between = spread(
          (markers[0].bottom + markers[1].top) / 2 - box.top,
        );
        // Under the last marker and its ring, to the list's foot.
        const last = markers[markers.length - 1];
        let below = 0;
        let belowRows = 0;
        for (
          let y = last.bottom + 10 - box.top;
          y < list.bottom - box.top - 1;
          y += 1
        ) {
          below = Math.max(below, spread(y));
          belowRows += 1;
        }
        return { between, below, belowRows };
      }, png);
      test.info().annotations.push({
        type: "measured",
        description: JSON.stringify(read),
      });
      // The last step's body runs well past its marker.
      expect(read.belowRows).toBeGreaterThan(20);
      expect(read.between, "the rail between markers").toBeGreaterThan(20);
      expect(read.below, "the rail under the last marker").toBeLessThan(8);
    });
