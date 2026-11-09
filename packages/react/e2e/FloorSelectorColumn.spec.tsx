import { test, expect, type Page } from "@playwright/experimental-ct-react";
import React from "react";
import { FloorSelectorColumnFixture } from "./FloorSelectorColumn.fixture";

// GAP-233. The collapsible column's scroll affordance (`data-scrollable`, which
// gives its list `overflow-y: auto`, and the scrollbar) must be right in every
// frame the browser paints of an opening, first or again, the list
// overflowing or not. Until the fix a reopened column painted the last
// opening's value, and every opening that overflowed painted a frame or two
// with its levels spilling out of the column before the list turned
// scrollable. A frame is read in requestAnimationFrame, as it is about to be
// painted; jsdom paints nothing, so this lives here.

type Frame = {
  state: string | null;
  placed: boolean;
  scrollable: boolean;
  overflows: boolean;
};

async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const tick = () => {
      const column = document.querySelector('[role="dialog"]');
      const list = column?.querySelector(".kozmos-floor-selector-scroll");
      if (column && list) {
        w.__frames.push({
          state: column.getAttribute("data-state"),
          // Radix keeps an unplaced column off the page.
          placed: !(column.parentElement?.style.transform ?? "").includes(
            "-200%",
          ),
          scrollable: column.getAttribute("data-scrollable") === "true",
          overflows: list.scrollHeight > list.clientHeight,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** The open, placed frames painted since the last call. */
async function paintedOpenFrames(page: Page) {
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    return w.__frames.splice(0);
  });
  return frames.filter((frame) => frame.state === "open" && frame.placed);
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test.describe(`reduced motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion, viewport: { width: 400, height: 150 } });

    test("every painted frame of an opening draws its own scroll affordance", async ({
      mount,
      page,
    }) => {
      const component = await mount(<FloorSelectorColumnFixture />);
      await recordFrames(page);
      const tile = component.getByRole("button", { name: "First floor" });
      const column = page.getByRole("dialog", { name: "Floor selector" });

      const openings = [
        { name: "first opening, overflowing", overflows: true },
        { name: "reopened, overflowing", overflows: true },
        { name: "reopened after the list shrank", overflows: false },
      ];
      for (const [index, opening] of openings.entries()) {
        if (index === 2) {
          await component.getByRole("button", { name: "Fewer levels" }).click();
        }
        // Only this opening's frames: the last one's run until it closed.
        await paintedOpenFrames(page);
        await tile.click();
        await expect(column).toBeVisible();
        await page.waitForTimeout(500);
        const frames = await paintedOpenFrames(page);
        expect(frames.length, opening.name).toBeGreaterThan(0);
        expect(
          frames.filter((frame) => frame.scrollable !== frame.overflows),
          opening.name,
        ).toEqual([]);
        expect(frames.every((f) => f.overflows === opening.overflows)).toBe(
          true,
        );
        await page.keyboard.press("Escape");
        await expect(column).toHaveCount(0);
        await expect(tile).toBeFocused();
      }
    });

    test("a closing column is inert, and focus goes back to the tile once it is gone", async ({
      mount,
      page,
    }) => {
      const component = await mount(<FloorSelectorColumnFixture />);
      const tile = component.getByRole("button", { name: "First floor" });
      await tile.click();
      const column = page.locator('[role="dialog"]');
      await expect(column).toBeVisible();
      await expect(
        column.getByRole("button", { name: "First floor" }),
      ).toBeFocused();
      const closing = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')!;
        const level = dialog.querySelector<HTMLButtonElement>(
          '[aria-label="Ground floor"]',
        )!;
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        return new Promise<{
          drawn: boolean;
          state: string | null;
          inert: boolean;
          levelTakesFocus: boolean;
        }>((resolve) =>
          requestAnimationFrame(() => {
            level.focus();
            resolve({
              drawn: dialog.isConnected,
              state: dialog.getAttribute("data-state"),
              inert: dialog.hasAttribute("inert"),
              levelTakesFocus: document.activeElement === level,
            });
          }),
        );
      });
      // Still drawn, closing, it is inert: a level in it can no longer
      // take focus. With motion it is drawn through its exit animation.
      if (reducedMotion === "no-preference") expect(closing.drawn).toBe(true);
      if (closing.drawn)
        expect(closing).toEqual({
          drawn: true,
          state: "closed",
          inert: true,
          levelTakesFocus: false,
        });
      await expect(column).toHaveCount(0);
      await expect(tile).toBeFocused();
    });
  });
}
