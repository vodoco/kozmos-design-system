import { test, expect, type Locator } from "@playwright/experimental-ct-react";
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import {
  ControlledFamilyTabs,
  FamilyTabs,
  FittingTabs,
  HiddenFamilyTabs,
} from "./TabsScroll.fixture";

// GAP-254, decision 182: a Tabs list wider than its space scrolls sideways
// inside its own track, with no scroll bar, its selected tab kept in view;
// a list that fits is unchanged.

/** Whether a tab lies wholly inside its list's track, 4px in from its edges. */
async function inTrack(tab: Locator, list: Locator) {
  const t = (await tab.boundingBox())!;
  const l = (await list.boundingBox())!;
  return t.x >= l.x + 4 - 0.5 && t.x + t.width <= l.x + l.width - 4 + 0.5;
}

/** How far the page and the list are scrolled, and how wide the page is. */
const scrolls = (list: Locator) =>
  list.evaluate((el) => ({
    pageWidth: document.documentElement.scrollWidth,
    pageX: window.scrollX,
    pageY: window.scrollY,
    listX: el.scrollLeft,
  }));

test.describe("Tabs wider than their space (GAP-254)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`scroll inside the track at 320, the page never widening, ${dir}`, async ({
      mount,
      page,
    }) => {
      const component = await mount(
        <FamilyTabs dir={dir} defaultValue="structural" />,
      );
      const list = component.getByTestId("list");
      const column = component.getByTestId("column");
      // The page stays the phone's width; the track is its column's.
      expect((await scrolls(list)).pageWidth).toBeLessThanOrEqual(320);
      const box = (await list.boundingBox())!;
      const space = (await column.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(space.width + 0.5);
      expect(box.width).toBeGreaterThan(space.width - 0.5);
      // The track is the scrollport, still the stacked 64 high.
      expect(box.height).toBe(64);
      const style = await list.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          scrollable: el.hasAttribute("data-scrollable"),
          overflowX: s.overflowX,
          scrollbarWidth: s.scrollbarWidth,
          overflows: el.scrollWidth > el.clientWidth,
          // No scroll bar takes room from the track.
          bar: el.offsetHeight - el.clientHeight,
        };
      });
      expect(style).toEqual({
        scrollable: true,
        overflowX: "auto",
        scrollbarWidth: "none",
        overflows: true,
        bar: 0,
      });
      // The tabs keep their natural width: no word cut off or wrapped.
      for (const tab of await list.getByRole("tab").all()) {
        const fits = await tab.evaluate(
          (el) => el.scrollWidth <= el.clientWidth,
        );
        expect(fits).toBe(true);
        expect((await tab.boundingBox())!.height).toBe(56);
      }
      // Structural, the fourth, is in view without the user scrolling.
      const selected = list.getByRole("tab", { name: "Structural" });
      await expect(selected).toHaveAttribute("aria-selected", "true");
      expect(await inTrack(selected, list)).toBe(true);
      // Still one tablist; the scrollport is the tablist, with no role or
      // tab stop of its own beyond Radix's, which hands focus to the tab.
      await expect(component.getByRole("tablist")).toHaveCount(1);
      await page.keyboard.press("Tab");
      await expect(selected).toBeFocused();
    });

    test(`start at the inline start and scroll mirrored, ${dir}`, async ({
      mount,
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const component = await mount(<FamilyTabs dir={dir} />);
      const list = component.getByTestId("list");
      const tabs = list.getByRole("tab");
      // The first tab sits at the start: the left in ltr, the right in rtl.
      expect((await scrolls(list)).listX).toBe(0);
      const first = (await tabs.first().boundingBox())!;
      const box = (await list.boundingBox())!;
      if (dir === "ltr") expect(first.x).toBeCloseTo(box.x + 4, 0);
      else expect(first.x + first.width).toBeCloseTo(box.x + box.width - 4, 0);
      expect(await inTrack(tabs.last(), list)).toBe(false);
      // Arrow keys along the tabs bring each into view, the list scrolling
      // towards the end, mirrored in rtl; the page never moves.
      await tabs.first().focus();
      const next = dir === "ltr" ? "ArrowRight" : "ArrowLeft";
      for (let i = 1; i < 5; i++) {
        await page.keyboard.press(next);
        await expect(tabs.nth(i)).toBeFocused();
        await expect.poll(() => inTrack(tabs.nth(i), list)).toBe(true);
      }
      await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
      const after = await scrolls(list);
      expect(after.pageX).toBe(0);
      expect(after.pageY).toBe(0);
      if (dir === "ltr") expect(after.listX).toBeGreaterThan(0);
      else expect(after.listX).toBeLessThan(0);
    });
  }

  test("a tab focused out of view comes into view, with manual activation", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const component = await mount(<FamilyTabs activationMode="manual" />);
    const list = component.getByTestId("list");
    const last = list.getByRole("tab", { name: "Virtual" });
    expect(await inTrack(last, list)).toBe(false);
    // Focus alone, the selection staying on the first tab, and with
    // preventScroll, so the browser's own focus scroll does not do it.
    await last.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
    await expect.poll(() => inTrack(last, list)).toBe(true);
    await expect(last).toHaveAttribute("aria-selected", "false");
    expect((await scrolls(list)).pageY).toBe(0);
  });

  test("a selection moved from outside brings its tab into view, animated", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const component = await mount(<ControlledFamilyTabs width={300} />);
    const list = component.getByTestId("list");
    const last = list.getByRole("tab", { name: "Virtual" });
    expect(await inTrack(last, list)).toBe(false);
    // Smooth: the list passes through offsets on its way, where a jump
    // fires one scroll event at the end.
    await list.evaluate((el) => {
      const seen = new Set<number>();
      (el as HTMLElement & { offsets?: Set<number> }).offsets = seen;
      el.addEventListener("scroll", () => seen.add(el.scrollLeft));
    });
    await component.getByRole("button", { name: "Show virtual" }).click();
    await expect(last).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => inTrack(last, list)).toBe(true);
    const offsets = await list.evaluate(
      (el) => (el as HTMLElement & { offsets?: Set<number> }).offsets!.size,
    );
    expect(offsets).toBeGreaterThan(1);
  });

  test("a list first laid out at no width shows its selected tab when shown", async ({
    mount,
  }) => {
    const component = await mount(<HiddenFamilyTabs width={300} />);
    await component.getByRole("button", { name: "Show" }).click();
    const list = component.getByTestId("list");
    const last = list.getByRole("tab", { name: "Virtual" });
    await expect.poll(() => inTrack(last, list)).toBe(true);
    // The track kept its column's width and scrolled to the last tab.
    await expect(list).toHaveAttribute("data-scrollable", "");
    expect(await list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });

  test("passes axe's scrollable-region and tab rules", async ({
    mount,
    page,
  }) => {
    const component = await mount(<FamilyTabs defaultValue="structural" />);
    // axe-core, as vitest-axe (the unit tests' axe) brings it.
    const axe = join(
      realpathSync(join(process.cwd(), "node_modules", "vitest-axe")),
      "..",
      "axe-core",
      "axe.min.js",
    );
    await page.addScriptTag({ content: readFileSync(axe, "utf8") });
    const list = component.getByTestId("list");
    await expect(list).toHaveAttribute("data-scrollable", "");
    const result = await list.evaluate(async (el) => {
      const run = await (
        window as unknown as {
          axe: {
            run: (
              context: Element,
              options: object,
            ) => Promise<{
              violations: { id: string }[];
              passes: { id: string }[];
            }>;
          };
        }
      ).axe.run(el, {
        runOnly: [
          "scrollable-region-focusable",
          "aria-required-children",
          "aria-required-parent",
          "nested-interactive",
        ],
      });
      return {
        violations: run.violations.map((v) => v.id),
        passes: run.passes.map((p) => p.id),
      };
    });
    expect(result.violations).toEqual([]);
    expect(result.passes).toContain("scrollable-region-focusable");
  });
});

test.describe("Tabs that fit (GAP-254)", () => {
  test("are drawn as before: no scrollport, natural width, centred", async ({
    mount,
  }) => {
    const component = await mount(<FittingTabs />);
    for (const id of ["plain", "wide", "grid"]) {
      const state = await component.getByTestId(id).evaluate((el) => ({
        scrollable: el.hasAttribute("data-scrollable"),
        overflowX: getComputedStyle(el).overflowX,
        overflowY: getComputedStyle(el).overflowY,
      }));
      // Not a scrollport, so the raised tab's shadow is not clipped.
      expect(state).toEqual({
        scrollable: false,
        overflowX: "visible",
        overflowY: "visible",
      });
    }
    // The plain list is as wide as its tabs and its 4px padding.
    const plain = component.getByTestId("plain");
    const tabs = await plain.getByRole("tab").all();
    const widths = await Promise.all(
      tabs.map(async (t) => (await t.boundingBox())!.width),
    );
    expect((await plain.boundingBox())!.width).toBeCloseTo(
      widths.reduce((a, b) => a + b, 0) + 8,
      0,
    );
    expect((await plain.boundingBox())!.height).toBe(40);
    // A list a caller made wide keeps its tabs centred.
    const wide = component.getByTestId("wide");
    const w = (await wide.boundingBox())!;
    const first = (await wide.getByRole("tab").first().boundingBox())!;
    const last = (await wide.getByRole("tab").last().boundingBox())!;
    expect(first.x - w.x).toBeGreaterThan(4);
    expect(first.x - w.x).toBeCloseTo(w.x + w.width - (last.x + last.width), 0);
    // The grid's two tabs share its width.
    const grid = component.getByTestId("grid");
    const g = (await grid.boundingBox())!;
    for (const tab of await grid.getByRole("tab").all())
      expect((await tab.boundingBox())!.width).toBeCloseTo(
        (g.width - 8) / 2,
        0,
      );
  });
});
