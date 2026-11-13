import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { ProgressSweepFixture } from "./Progress.fixture";

// GAP-159, in a browser: the stylesheet draws the sweep, so jsdom cannot
// prove it. The segment is a quarter of the track, enters wholly before the
// inline start and leaves wholly past the inline end every 2 s, linear;
// right to left it runs from the right; under reduced motion it stands still
// in the middle. The top bar is 4 tall, square and edge to edge at y 0.

type Host = Awaited<
  ReturnType<Parameters<Parameters<typeof test>[1]>[0]["mount"]>
>;

/** The segment's span across the inline bar, at `ms` into the sweep. */
function segmentAt(host: Host, ms: number | null) {
  return host.evaluate((root, at) => {
    const bar = root.querySelector('[data-testid="inline"]') as HTMLElement;
    const segment = bar.firstElementChild as HTMLElement;
    const animations = segment.getAnimations();
    if (at !== null)
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = at;
      }
    const track = bar.getBoundingClientRect();
    const box = segment.getBoundingClientRect();
    const style = getComputedStyle(segment);
    return {
      start: Math.round(box.left - track.left),
      end: Math.round(box.right - track.left),
      width: Math.round(box.width),
      animations: animations.length,
      name: style.animationName,
      duration: style.animationDuration,
      timing: style.animationTimingFunction,
      count: style.animationIterationCount,
    };
  }, ms);
}

for (const dir of ["ltr", "rtl"] as const) {
  test.describe(`${dir}`, () => {
    test("the segment sweeps a quarter of the track every 2 s, linear", async ({
      mount,
    }) => {
      const host = await mount(<ProgressSweepFixture dir={dir} />);
      const first = await segmentAt(host, 0);
      expect(first).toMatchObject({
        width: 100,
        animations: 1,
        name: "kozmos-progress-sweep",
        duration: "2s",
        timing: "linear",
        count: "infinite",
      });
      // Wholly before the inline start, then a quarter of the way.
      if (dir === "ltr") {
        expect(first).toMatchObject({ start: -100, end: 0 });
        expect(await segmentAt(host, 500)).toMatchObject({
          start: 25,
          end: 125,
        });
        // The last frame before it starts again: wholly past the end.
        expect(await segmentAt(host, 1999)).toMatchObject({ start: 400 });
      } else {
        expect(first).toMatchObject({ start: 400, end: 500 });
        expect(await segmentAt(host, 500)).toMatchObject({
          start: 275,
          end: 375,
        });
        expect(await segmentAt(host, 1999)).toMatchObject({ end: 0 });
      }
    });

    test.describe("reduced motion", () => {
      // Said to the page itself: test.use's reducedMotion did not reach the
      // component page (matchMedia read false).
      test("the segment stands still in the middle", async ({
        mount,
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const host = await mount(<ProgressSweepFixture dir={dir} />);
        expect(await segmentAt(host, null)).toMatchObject({
          animations: 0,
          start: 150,
          end: 250,
        });
      });
    });

    test("the top bar is 4 tall, square, edge to edge at the top", async ({
      mount,
      page,
    }) => {
      const host = await mount(<ProgressSweepFixture dir={dir} />);
      const viewport = page.viewportSize()!;
      const top = await host.evaluate((root) => {
        const bar = root.querySelector('[data-testid="top"]') as HTMLElement;
        const box = bar.getBoundingClientRect();
        const style = getComputedStyle(bar);
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          radius: style.borderTopLeftRadius,
          position: style.position,
        };
      });
      expect(top).toEqual({
        x: 0,
        y: 0,
        width: viewport.width,
        height: 4,
        radius: "0px",
        position: "fixed",
      });
    });
  });
}
