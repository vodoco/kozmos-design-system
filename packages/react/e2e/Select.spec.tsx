import { test, expect } from "@playwright/experimental-ct-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../src/components/Select";
import { ThemeProvider } from "../src/components/ThemeProvider";
import React from "react";

test.describe("Select Behavioral CT", () => {
  test("dropdown opens, item selection updates value, error prop sets aria-invalid", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <Select>
        <SelectTrigger error={true}>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = component.locator('button[role="combobox"]');
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await trigger.click();
    await page.locator("text=Option 1").click();
    await expect(trigger).toContainText("Option 1");
  });

  // GAP-164: a count at the option's end, before its check, and never in
  // the closed select.
  test("an option shows its count at its end and the closed select its words alone", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ThemeProvider theme="light">
        <Select defaultValue="poi">
          <SelectTrigger aria-label="Content">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" count={128}>
              Everything
            </SelectItem>
            <SelectItem value="poi" count={96}>
              POI
            </SelectItem>
          </SelectContent>
        </Select>
      </ThemeProvider>,
    );
    const trigger = component.locator('button[role="combobox"]');
    await expect(trigger).toHaveText("POI");
    await trigger.click();
    const option = page.getByRole("option", { name: "POI, 96" });
    await expect(option).toBeVisible();
    // The list zooms in as it opens: measure it at rest.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    const count = (await option
      .locator('[data-slot="counter"]')
      .boundingBox())!;
    const check = (await option.locator(".kozmos-option-check").boundingBox())!;
    const words = (await option
      .locator(".kozmos-option-content")
      .boundingBox())!;
    expect(count.height).toBe(20);
    expect(count.x).toBeGreaterThanOrEqual(words.x + words.width);
    expect(check.x).toBeGreaterThanOrEqual(count.x + count.width);
    await page.getByRole("option", { name: "Everything, 128" }).click();
    await expect(trigger).toHaveText("Everything");
  });

  // Decision 1: the counts form one column. Every row keeps the check's
  // place, so each count ends at the same edge, and a new choice moves none.
  for (const dir of ["ltr", "rtl"] as const) {
    test(`the counts form one column that a new choice does not move, ${dir}`, async ({
      mount,
      page,
    }) => {
      const component = await mount(
        <ThemeProvider theme="light">
          <div dir={dir}>
            <Select defaultValue="poi" dir={dir}>
              <SelectTrigger aria-label="Content" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" count={1234}>
                  Everything
                </SelectItem>
                <SelectItem value="poi" count={96}>
                  POI
                </SelectItem>
                <SelectItem value="virtual" count={4}>
                  Virtual
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ThemeProvider>,
      );
      const trigger = component.locator('button[role="combobox"]');
      const ends = async () => {
        await trigger.click();
        await expect(page.getByRole("option").first()).toBeVisible();
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished)),
        );
        const edges: number[] = [];
        for (const option of await page.getByRole("option").all()) {
          const box = (await option
            .locator('[data-slot="counter"]')
            .boundingBox())!;
          // The count's end: its right edge, or its left right to left.
          edges.push(dir === "ltr" ? box.x + box.width : box.x);
        }
        return edges;
      };
      const before = await ends();
      expect(new Set(before).size).toBe(1);
      await page.getByRole("option", { name: /^Virtual/ }).click();
      await expect(trigger).toHaveText("Virtual");
      const after = await ends();
      expect(after).toEqual(before);
    });
  }
});
