import {
  test,
  expect,
  type Locator,
  type Page,
} from "@playwright/experimental-ct-react";
import React from "react";
import { StatusTones } from "./StatusTones.fixture";
import { EMOTIONS } from "../src/utils/emotion";

type RGBA = [number, number, number, number];

function parse(colour: string): RGBA {
  const rgb =
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(colour);
  if (rgb)
    return [+rgb[1], +rgb[2], +rgb[3], rgb[4] === undefined ? 1 : +rgb[4]];
  const srgb =
    /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(colour);
  if (srgb)
    return [
      +srgb[1] * 255,
      +srgb[2] * 255,
      +srgb[3] * 255,
      srgb[4] === undefined ? 1 : +srgb[4],
    ];
  throw new Error(`unparsed colour ${colour}`);
}

function luminance([r, g, b]: RGBA) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(a: string, b: string) {
  const [x, y] = [luminance(parse(a)), luminance(parse(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const style = (locator: Locator, property: string) =>
  locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name),
    property,
  );

async function still(page: Page) {
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; }",
  });
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme}`, () => {
    // GAP-213, decision 194.
    test("an EmptyState in each tone is its emotion's surface and edge, its words 4.5:1 and its icon 3:1", async ({
      mount,
    }) => {
      const component = await mount(<StatusTones theme={theme} />);
      for (const emotion of EMOTIONS) {
        const card = component.getByTestId(`empty-${emotion}`);
        const surface = await style(card, "background-color");
        const edge = await style(card, "border-top-color");
        expect(parse(surface)[3], `${emotion} surface is opaque`).toBe(1);
        expect(await style(card, "border-top-width")).toBe("1px");
        expect(surface, `${emotion} has an edge of its own`).not.toBe(edge);
        for (const words of [`Title ${emotion}`, `Description ${emotion}`]) {
          const ink = await style(component.getByText(words), "color");
          expect(
            ratio(ink, surface),
            `${theme} ${emotion} "${words}"`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        const disc = component.getByTestId(`icon-${emotion}`).locator("..");
        const discFill = await style(disc, "background-color");
        const glyph = await style(disc, "color");
        expect(
          ratio(glyph, discFill),
          `${theme} ${emotion} icon`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    // GAP-170, decision 200.
    test("a Chip in each emotion reads 4.5:1 at rest and selected", async ({
      mount,
    }) => {
      const component = await mount(<StatusTones theme={theme} />);
      for (const emotion of EMOTIONS) {
        for (const state of ["Rest", "Selected"]) {
          const chip = component.locator('[data-slot="chip"]', {
            hasText: `${state} ${emotion}`,
          });
          const fill = await style(chip, "background-color");
          const ink = await style(chip, "color");
          expect(parse(fill)[3]).toBe(1);
          expect(
            ratio(ink, fill),
            `${theme} ${state} ${emotion}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    // GAP-251 and decision 173: the remove button's hover shows on a hovered
    // chip. The chip went to the hover fill under the pointer and so did the
    // button, a fill on itself. An emotion chip's hover deepens its tint
    // instead, as the neutral emotion's surface in dark is the hover fill.
    test("a removable chip's remove hover shows on the hovered chip", async ({
      mount,
      page,
    }) => {
      const component = await mount(<StatusTones theme={theme} />);
      await still(page);
      const away = () =>
        component.getByTestId("page").hover({ position: { x: 1, y: 1 } });
      const hoverFill = await style(
        component.getByTestId("hover-probe"),
        "background-color",
      );
      for (const label of ["Plain", ...EMOTIONS.map((e) => `Rest ${e}`)]) {
        const remove = component.getByRole("button", {
          name: `Remove ${label}`,
        });
        const chip = component
          .locator('[data-slot="chip"]', { hasText: label })
          .first();
        const atRest = await style(chip, "background-color");
        await chip.getByText(label).hover();
        const chipHovered = await style(chip, "background-color");
        expect(
          chipHovered,
          `${theme} ${label}: the chip shows its hover`,
        ).not.toBe(atRest);
        if (label === "Plain") expect(chipHovered).toBe(hoverFill);
        else
          expect(
            ratio(await style(chip, "color"), chipHovered),
            `${theme} ${label}: its words on its hover`,
          ).toBeGreaterThanOrEqual(4.5);
        await away();
        await remove.hover();
        const button = await style(remove, "background-color");
        const behind = await style(chip, "background-color");
        expect(
          button,
          `${theme} ${label}: the button takes the chip's hover`,
        ).toBe(chipHovered);
        expect(behind, `${theme} ${label}: the chip is back at rest`).toBe(
          atRest,
        );
        expect(button).not.toBe(behind);
        expect(
          ratio(await style(remove, "color"), button),
          `${theme} ${label}: the remove glyph on its hover`,
        ).toBeGreaterThanOrEqual(3);
        await away();
      }
      for (const emotion of EMOTIONS) {
        const remove = component.getByRole("button", {
          name: `Remove Selected ${emotion}`,
        });
        const chip = component.locator('[data-slot="chip"]', {
          hasText: `Selected ${emotion}`,
        });
        const fill = await style(chip, "background-color");
        await remove.hover();
        const button = await style(remove, "background-color");
        expect(await style(chip, "background-color")).toBe(fill);
        expect(button).not.toBe(fill);
        expect(
          ratio(await style(remove, "color"), button),
        ).toBeGreaterThanOrEqual(3);
        await away();
      }
    });

    // Decision 210.
    test("PageHeader's title addon sits on the title's line, and wraps under it with no room", async ({
      mount,
    }) => {
      const component = await mount(<StatusTones theme={theme} />);
      for (const [width, wraps] of [
        ["wide", false],
        ["narrow", true],
      ] as const) {
        const header = component.getByTestId(width);
        const heading = header.getByRole("heading", { level: 1 });
        const addon = header.locator('[data-slot="page-header-title-addon"]');
        const h = (await heading.boundingBox())!;
        const a = (await addon.boundingBox())!;
        if (wraps) {
          expect(a.y, "under the title").toBeGreaterThanOrEqual(h.y + h.height);
          expect(Math.abs(a.x - h.x), "at the title's start").toBeLessThan(1);
        } else {
          expect(a.x).toBeGreaterThanOrEqual(h.x + h.width);
          const centre = (box: { y: number; height: number }) =>
            box.y + box.height / 2;
          expect(
            Math.abs(centre(a) - centre(h)),
            "centred on the title's line",
          ).toBeLessThan(1);
        }
        await expect(heading).toHaveText(
          width === "wide" ? "Map Content" : "Map Content Overview",
        );
      }
    });

    // Decision 151, CLOUD-UI-009.
    test("Select's ghost trigger draws no edge or fill at rest and the hover fill under the pointer", async ({
      mount,
      page,
    }) => {
      const component = await mount(<StatusTones theme={theme} />);
      await still(page);
      const hoverFill = await style(
        component.getByTestId("hover-probe"),
        "background-color",
      );
      const trigger = component.getByRole("combobox", { name: "Level" });
      expect(parse(await style(trigger, "background-color"))[3]).toBe(0);
      expect(parse(await style(trigger, "border-top-color"))[3]).toBe(0);
      const box = (await trigger.boundingBox())!;
      expect(box.width).toBeLessThan(200);
      await trigger.hover();
      expect(await style(trigger, "background-color")).toBe(hoverFill);
    });
  });
}
