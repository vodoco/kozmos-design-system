import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import {
  DescriptionListFixture,
  ListboxEmbeddedFixture,
  TableHighlightFixture,
  TreeBandFixture,
} from "./ListsWaveB1.fixture";

const TRANSPARENT = "rgba(0, 0, 0, 0)";

// GAP-217 (decision 196): rowFill="band" draws the selected fill as a band
// with no corners from one panel edge to the other, through the bleed.
test.describe("Tree band rows (GAP-217)", () => {
  for (const divided of [false, true]) {
    test(`a selected band runs the panel's width with no corners${divided ? ", divided" : ""}`, async ({
      mount,
    }) => {
      const component = await mount(
        <TreeBandFixture rowFill="band" divided={divided} />,
      );
      const m = await component.evaluate((host) => {
        const panel = host.querySelector("[data-panel]")!;
        const row = host.querySelector('[role="treeitem"]')!;
        const band = row.parentElement!;
        const fill = (el: Element) => getComputedStyle(el).backgroundColor;
        return {
          panel: panel.getBoundingClientRect().width,
          band: band.getBoundingClientRect().width,
          bandFill: fill(band),
          rowFill: fill(row),
          radius: getComputedStyle(row).borderTopLeftRadius,
          hoverFill: getComputedStyle(document.documentElement)
            .getPropertyValue("--semantics-hover-fill")
            .trim(),
        };
      });
      expect(m.band).toBe(m.panel);
      expect(m.bandFill).not.toBe(TRANSPARENT);
      expect(m.rowFill).toBe(TRANSPARENT);
      expect(m.radius).toBe("0px");
    });
  }

  test("inset, the default, keeps the pill inside the row", async ({
    mount,
  }) => {
    const component = await mount(<TreeBandFixture />);
    const m = await component.evaluate((host) => {
      const row = host.querySelector('[role="treeitem"]')!;
      return {
        fill: getComputedStyle(row).backgroundColor,
        radius: getComputedStyle(row).borderTopLeftRadius,
        width: row.getBoundingClientRect().width,
        panel: host.querySelector("[data-panel]")!.getBoundingClientRect()
          .width,
      };
    });
    expect(m.fill).not.toBe("rgba(0, 0, 0, 0)");
    expect(m.radius).not.toBe("0px");
    expect(m.width).toBe(m.panel - 32);
  });
});

// GAP-276 (decision 186): highlight="new" shows the informative surface,
// holds it, then fades it; under reduced motion it clears with no fade.
test.describe("TableRow highlight (GAP-276)", () => {
  const read = (host: HTMLElement) => {
    const row = host.querySelector('[data-highlight="new"]')!;
    const animation = row.getAnimations()[0] as CSSAnimation | undefined;
    const surface = document.createElement("div");
    surface.style.backgroundColor =
      "var(--semantics-emotion-informative-surface)";
    host.appendChild(surface);
    const informative = getComputedStyle(surface).backgroundColor;
    surface.remove();
    const at = (time: number) => {
      animation!.pause();
      animation!.currentTime = time;
      return getComputedStyle(row).backgroundColor;
    };
    return {
      informative,
      name: animation?.animationName,
      duration: animation?.effect?.getComputedTiming().duration,
      start: at(0),
      held: at(1300),
      fading: at(1650),
      after: (() => {
        animation!.finish();
        return getComputedStyle(row).backgroundColor;
      })(),
      other: getComputedStyle(host.querySelectorAll("tr")[1]).backgroundColor,
    };
  };

  test("tints in the informative surface, holds 3 × deliberate, fades over 1 × deliberate", async ({
    mount,
  }) => {
    const m = await (await mount(<TableHighlightFixture />)).evaluate(read);
    expect(m.name).toBe("kozmos-table-row-highlight");
    expect(m.duration).toBe(1840);
    expect(m.start).toBe(m.informative);
    expect(m.held).toBe(m.informative);
    expect(m.fading).not.toBe(m.informative);
    expect(m.fading).not.toBe(TRANSPARENT);
    expect(m.after).toBe(TRANSPARENT);
    expect(m.other).toBe(TRANSPARENT);
  });

  test.describe("reduced motion", () => {
    // Said to the page itself: test.use's reducedMotion does not reach the
    // component page (Progress.spec).
    test("shows and clears with no fade", async ({ mount, page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const m = await (await mount(<TableHighlightFixture />)).evaluate(read);
      expect(m.start).toBe(m.informative);
      expect(m.fading).toBe(m.informative);
      expect(m.after).toBe(TRANSPARENT);
    });

    test("the design config's reduced motion does the same", async ({
      mount,
    }) => {
      const m = await (
        await mount(<TableHighlightFixture motion="reduced" />)
      ).evaluate(read);
      expect(m.start).toBe(m.informative);
      expect(m.fading).toBe(m.informative);
      expect(m.after).toBe(TRANSPARENT);
    });
  });
});

// GAP-271 (decision 186): an embedded Listbox draws no box of its own.
test.describe("Listbox embedded (GAP-271)", () => {
  const read = (host: HTMLElement) => {
    const list = host.querySelector('[role="listbox"]') as HTMLElement;
    const style = getComputedStyle(list);
    const first = list.querySelector('[role="option"]')!;
    return {
      border: style.borderTopWidth,
      fill: style.backgroundColor,
      shadow: style.boxShadow,
      padding: style.paddingTop,
      inset:
        first.getBoundingClientRect().left - list.getBoundingClientRect().left,
    };
  };
  test("no border, surface, shadow or padding; the rows at its edge", async ({
    mount,
  }) => {
    const component = await mount(<ListboxEmbeddedFixture embedded />);
    const m = await component.evaluate(read);
    expect(m.border).toBe("0px");
    expect(m.fill).toBe(TRANSPARENT);
    expect(m.padding).toBe("0px");
    expect(m.inset).toBe(0);
    expect(m.shadow.includes("rgba(0, 0, 0, 0)") || m.shadow === "none").toBe(
      true,
    );
    // The focus ring still shows.
    await component.getByRole("listbox").focus();
    await component.page().keyboard.press("ArrowDown");
    await component.page().keyboard.press("ArrowUp");
    const ring = await component.evaluate(
      (host) =>
        getComputedStyle(host.querySelector('[role="listbox"]')!).boxShadow,
    );
    expect(ring).toMatch(/2px|4px/);
  });

  test("its own panel by default", async ({ mount }) => {
    const m = await (await mount(<ListboxEmbeddedFixture />)).evaluate(read);
    expect(m.border).toBe("1px");
    expect(m.fill).not.toBe(TRANSPARENT);
    expect(m.padding).toBe("12px");
  });
});

// GAP-221 (decision 199): DescriptionList, a label over its value with no
// field chrome.
test.describe("DescriptionList (GAP-221)", () => {
  const read = (host: HTMLElement) => {
    const list = host.querySelector("dl")!;
    const items = Array.from(list.children) as HTMLElement[];
    const label = items[0].querySelector("dt")!;
    const value = items[0].querySelector("dd")!;
    const box = (el: Element) => el.getBoundingClientRect();
    const fid = items[2].querySelector("dd")!;
    return {
      labelSize: getComputedStyle(label).fontSize,
      labelLine: getComputedStyle(label).lineHeight,
      valueSize: getComputedStyle(value).fontSize,
      valueLine: getComputedStyle(value).lineHeight,
      labelToValue: box(value).top - box(label).bottom,
      itemTops: items.map((item) => Math.round(box(item).top)),
      itemGap: box(items[1]).top - box(items[0]).bottom,
      border: getComputedStyle(value).borderTopWidth,
      fill: getComputedStyle(value).backgroundColor,
      fidHeight: box(fid).height,
      labelColour: getComputedStyle(label).color,
      valueColour: getComputedStyle(value).color,
    };
  };
  test("stacked: 12/16 label over a 14/20 value, 4 apart, 16 between items, no chrome", async ({
    mount,
  }) => {
    const m = await (await mount(<DescriptionListFixture />)).evaluate(read);
    expect(m.labelSize).toBe("12px");
    expect(m.labelLine).toBe("16px");
    expect(m.valueSize).toBe("14px");
    expect(m.valueLine).toBe("20px");
    expect(m.labelToValue).toBe(4);
    expect(m.itemGap).toBe(16);
    expect(m.border).toBe("0px");
    expect(m.fill).toBe(TRANSPARENT);
    // The Copy action keeps the value's line: the item is no taller for it.
    expect(m.fidHeight).toBe(20);
    expect(m.labelColour).not.toBe(m.valueColour);
  });

  test("row: the items side by side on one line", async ({ mount }) => {
    const m = await (
      await mount(<DescriptionListFixture layout="row" />)
    ).evaluate(read);
    expect(new Set(m.itemTops).size).toBe(1);
  });
});
