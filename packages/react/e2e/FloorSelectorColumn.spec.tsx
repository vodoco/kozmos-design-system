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

    test("a closing column is inert, and focus is on the tile in every frame of its exit", async ({
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
        const tile = document.querySelector<HTMLButtonElement>(
          '[role="group"] > button[aria-haspopup="dialog"]',
        )!;
        const level = dialog.querySelector<HTMLButtonElement>(
          '[aria-label="Ground floor"]',
        )!;
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        // Every frame until the column is gone: where focus is, and whether
        // the column is drawn, closing and inert.
        const frames: {
          drawn: boolean;
          state: string | null;
          inert: boolean;
          focus: string;
        }[] = [];
        let levelTookFocus = false;
        return new Promise<{ frames: typeof frames; levelTookFocus: boolean }>(
          (resolve) => {
            const tick = () => {
              const focused = document.activeElement;
              frames.push({
                drawn: dialog.isConnected,
                state: dialog.getAttribute("data-state"),
                inert: dialog.hasAttribute("inert"),
                focus:
                  focused === tile
                    ? "tile"
                    : focused === document.body
                      ? "body"
                      : dialog.contains(focused)
                        ? "column"
                        : "elsewhere",
              });
              if (frames.length === 1) {
                level.focus();
                levelTookFocus = document.activeElement === level;
              }
              if (dialog.isConnected && frames.length < 120)
                requestAnimationFrame(tick);
              else resolve({ frames, levelTookFocus });
            };
            requestAnimationFrame(tick);
          },
        );
      });
      // The first frame after Escape: the column is still drawn, closing,
      // and inert, so a level in it cannot take focus; focus is on the tile.
      expect(closing.frames[0]).toEqual({
        drawn: true,
        state: "closed",
        inert: true,
        focus: "tile",
      });
      expect(closing.levelTookFocus).toBe(false);
      // And on the tile in every frame of the exit, never on the page.
      expect(closing.frames.map((frame) => frame.focus)).toEqual(
        closing.frames.map(() => "tile"),
      );
      await expect(column).toHaveCount(0);
      await expect(tile).toBeFocused();
    });

    test("opened again before it is gone, focus goes to the current level", async ({
      mount,
      page,
    }) => {
      const component = await mount(<FloorSelectorColumnFixture />);
      await component.getByRole("button", { name: "First floor" }).click();
      const column = page.locator('[role="dialog"]');
      await expect(column).toBeVisible();
      const reopened = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')!;
        const tile = document.querySelector<HTMLButtonElement>(
          '[role="group"] > button[aria-haspopup="dialog"]',
        )!;
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        return new Promise<{
          closing: string | null;
          same: boolean;
          state: string | null;
          inert: boolean;
          focus: string | null;
        }>((resolve) =>
          requestAnimationFrame(() => {
            const closing = dialog.getAttribute("data-state");
            // Enter on the tile again, while the column fades: the tile
            // has focus and is clicked.
            tile.focus();
            tile.click();
            requestAnimationFrame(() => {
              const now = document.querySelector('[role="dialog"]');
              resolve({
                closing,
                same: now === dialog,
                state: dialog.getAttribute("data-state"),
                inert: dialog.hasAttribute("inert"),
                focus:
                  document.activeElement?.closest('[role="dialog"]') === dialog
                    ? document.activeElement.getAttribute("aria-label")
                    : null,
              });
            });
          }),
        );
      });
      expect(reopened).toEqual({
        closing: "closed",
        same: true,
        state: "open",
        inert: false,
        focus: "First floor",
      });
    });
  });
}
