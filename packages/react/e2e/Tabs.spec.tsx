import { test, expect } from "@playwright/experimental-ct-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../src/components/Tabs";
import { ThemeProvider } from "../src/components/ThemeProvider";
import React from "react";

test.describe("Tabs Behavioral CT", () => {
  test("clicking tab switches content, active tab has aria-selected=true", async ({
    mount,
  }) => {
    const component = await mount(
      <Tabs defaultValue="1">
        <TabsList>
          <TabsTrigger value="1">Tab 1</TabsTrigger>
          <TabsTrigger value="2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="1">Panel 1</TabsContent>
        <TabsContent value="2">Panel 2</TabsContent>
      </Tabs>,
    );

    await expect(component.locator("text=Panel 1")).toBeVisible(); // Default visible

    const t2 = component.locator('button[role="tab"]', { hasText: "Tab 2" });
    await t2.click();
    await expect(t2).toHaveAttribute("aria-selected", "true");
    await expect(component.locator("text=Panel 2")).toBeVisible();
    await expect(component.locator("text=Panel 1")).not.toBeVisible(); // Others hidden
  });

  test("ArrowRight moves focus seamlessly natively", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <Tabs defaultValue="1">
        <TabsList>
          <TabsTrigger value="1">T1</TabsTrigger>
          <TabsTrigger value="2">T2</TabsTrigger>
        </TabsList>
      </Tabs>,
    );

    const t1 = component.locator("text=T1");
    const t2 = component.locator("text=T2");

    await t1.focus();
    await expect(t1).toBeFocused();

    await page.keyboard.press("ArrowRight");

    // Evaluate Radix accessibility Native physical transfer inherently
    await expect(t2).toBeFocused();
  });

  // GAP-152: an icon over a tab's words, in a track that grows to hold it,
  // left to right and right to left.
  for (const dir of ["ltr", "rtl"] as const) {
    test(`an icon stacks centred over its words, ${dir}`, async ({ mount }) => {
      const icon = (
        <svg viewBox="0 0 24 24" data-testid="icon">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
      const component = await mount(
        <ThemeProvider theme="light">
          <div dir={dir}>
            <Tabs defaultValue="poi" dir={dir}>
              <TabsList data-testid="stacked">
                <TabsTrigger value="all" icon={icon}>
                  Everything
                </TabsTrigger>
                <TabsTrigger value="poi" icon={icon}>
                  POI
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="a" dir={dir}>
              <TabsList data-testid="words">
                <TabsTrigger value="a">Account</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ThemeProvider>,
      );
      const tab = component.getByRole("tab", { name: "POI" });
      const iconBox = (await tab
        .locator('[data-slot="tabs-trigger-icon"]')
        .boundingBox())!;
      const tabBox = (await tab.boundingBox())!;
      const words = await tab.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el.lastChild as Node);
        const r = range.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width };
      });
      expect(iconBox.width).toBe(20);
      expect(iconBox.height).toBe(20);
      // 6 above the icon, then its 20, then the words under it.
      expect(iconBox.y - tabBox.y).toBe(6);
      expect(words.top).toBeGreaterThanOrEqual(iconBox.y + iconBox.height + 4);
      // Both centred on the tab.
      const centre = tabBox.x + tabBox.width / 2;
      expect(
        Math.abs(iconBox.x + iconBox.width / 2 - centre),
      ).toBeLessThanOrEqual(0.5);
      expect(
        Math.abs(words.left + words.width / 2 - centre),
      ).toBeLessThanOrEqual(0.5);
      // 6 + 20 + 4 + 20 + 6, in a track 4 bigger on each side.
      expect(tabBox.height).toBe(56);
      const stacked = (await component.getByTestId("stacked").boundingBox())!;
      expect(stacked.height).toBe(64);
      // A list of words alone keeps its 40.
      const plain = (await component.getByTestId("words").boundingBox())!;
      expect(plain.height).toBe(40);
      // The active tab is still the raised segment.
      const shadow = await tab.evaluate((el) => getComputedStyle(el).boxShadow);
      expect(shadow).not.toBe("none");
    });
  }

  // Decision 3: once one tab has an icon, every tab in the list is the
  // stacked height, so the raised segment fills the track whichever tab is
  // active, and a tab of words alone centres them.
  for (const dir of ["ltr", "rtl"] as const) {
    test(`a tab of words beside an icon tab takes the stacked height, ${dir}`, async ({
      mount,
    }) => {
      const component = await mount(
        <ThemeProvider theme="light">
          <div dir={dir}>
            <Tabs defaultValue="all" dir={dir}>
              <TabsList data-testid="mixed">
                <TabsTrigger value="all">Everything</TabsTrigger>
                <TabsTrigger
                  value="poi"
                  icon={
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  }
                >
                  POI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ThemeProvider>,
      );
      const list = (await component.getByTestId("mixed").boundingBox())!;
      const words = component.getByRole("tab", { name: "Everything" });
      const box = (await words.boundingBox())!;
      // The active tab is the word tab: its segment fills the 64 track.
      expect(list.height).toBe(64);
      expect(box.height).toBe(56);
      expect(box.y - list.y).toBe(4);
      const text = await words.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });
      // Its words sit in the middle of it.
      expect(
        Math.abs((text.top + text.bottom) / 2 - (box.y + box.height / 2)),
      ).toBeLessThanOrEqual(1);
    });
  }

  // A caller's own height class still sizes the list, with or without an
  // icon in it.
  test("a caller's height class wins over the list's own", async ({
    mount,
  }) => {
    const component = await mount(
      <ThemeProvider theme="light">
        <div>
          <Tabs defaultValue="a">
            <TabsList data-testid="words" className="h-12">
              <TabsTrigger value="a">Account</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue="poi">
            <TabsList data-testid="stacked" className="h-20">
              <TabsTrigger
                value="poi"
                icon={
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              >
                POI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </ThemeProvider>,
    );
    expect((await component.getByTestId("words").boundingBox())!.height).toBe(
      48,
    );
    expect((await component.getByTestId("stacked").boundingBox())!.height).toBe(
      80,
    );
  });

  // An asChild tab with an icon is still the caller's element, a tab the
  // arrow keys reach and choose.
  test("an asChild tab with an icon stays the caller's element and a tab", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ThemeProvider theme="light">
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Account</TabsTrigger>
            <TabsTrigger
              value="b"
              asChild
              icon={
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
            >
              <a href="#b">Billing</a>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
          <TabsContent value="b">Panel B</TabsContent>
        </Tabs>
      </ThemeProvider>,
    );
    const billing = component.getByRole("tab", { name: "Billing" });
    expect(await billing.evaluate((el) => el.tagName)).toBe("A");
    await expect(
      billing.locator('[data-slot="tabs-trigger-icon"]'),
    ).toHaveCount(1);
    await component.getByRole("tab", { name: "Account" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(billing).toBeFocused();
    await expect(billing).toHaveAttribute("aria-selected", "true");
    await expect(component.getByText("Panel B")).toBeVisible();
  });
});
