import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { CodeBlockFixture } from "./CodeBlock.fixture";

// Forty lines of JSON, far taller than a 120 cap.
const TALL_CODE = `[\n${Array.from(
  { length: 40 },
  (_, index) => `  { "fid": "f-${1000 + index}" },`,
).join("\n")}\n]`;

// GAP-216, decision 225: the code in the mono family, 14/20, on the muted
// surface, on the control radius, 12 inside; wrapped by default, scrolling
// sideways with wrap off; a copy at the top end, the code kept clear of it.
const read = (host: HTMLElement) => {
  const block = host.querySelector(".kozmos-code-block") as HTMLElement;
  const pre = block.querySelector("pre") as HTMLElement;
  const copy = block.querySelector("button");
  const probe = document.createElement("div");
  probe.style.fontFamily = "var(--semantics-typography-family-mono)";
  probe.style.backgroundColor = "var(--primitives-colors-background-100)";
  probe.style.borderRadius = "calc(var(--semantics-radius-control) * 1px)";
  block.appendChild(probe);
  const want = getComputedStyle(probe);
  const expected = {
    font: want.fontFamily,
    fill: want.backgroundColor,
    radius: want.borderTopLeftRadius,
  };
  probe.remove();
  const style = getComputedStyle(pre);
  const blockRect = block.getBoundingClientRect();
  const copyRect = copy?.getBoundingClientRect();
  return {
    expected,
    font: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fill: getComputedStyle(block).backgroundColor,
    radius: getComputedStyle(block).borderTopLeftRadius,
    padding: style.paddingTop,
    paddingEnd: parseFloat(style.paddingRight),
    whiteSpace: style.whiteSpace,
    scrolls: pre.scrollWidth > pre.clientWidth,
    blockWidth: blockRect.width,
    lines: Math.round(pre.getBoundingClientRect().height / 20),
    copy: copyRect && {
      top: copyRect.top - blockRect.top,
      end: blockRect.right - copyRect.right,
      width: copyRect.width,
    },
  };
};

test.describe("CodeBlock (GAP-216)", () => {
  test("draws the code in the mono family on the muted surface, wrapped by default", async ({
    mount,
  }) => {
    const component = await mount(<CodeBlockFixture />);
    const m = await component.evaluate(read);
    expect(m.font).toBe(m.expected.font);
    expect(m.font).toMatch(/monospace/);
    expect(m.fontSize).toBe("14px");
    expect(m.lineHeight).toBe("20px");
    expect(m.fill).toBe(m.expected.fill);
    expect(m.fill).not.toBe("rgba(0, 0, 0, 0)");
    expect(m.radius).toBe(m.expected.radius);
    expect(m.padding).toBe("12px");
    expect(m.whiteSpace).toBe("pre-wrap");
    // The long line wraps: no sideways scroll, and more lines than four.
    expect(m.scrolls).toBe(false);
    expect(m.blockWidth).toBe(240);
    expect(m.lines).toBeGreaterThan(4);
  });

  test("keeps each line whole and scrolls sideways with wrap off, reachable by Tab", async ({
    mount,
    page,
    browserName,
  }) => {
    const component = await mount(<CodeBlockFixture wrap={false} />);
    const m = await component.evaluate(read);
    expect(m.whiteSpace).toBe("pre");
    expect(m.scrolls).toBe(true);
    expect(m.blockWidth).toBe(240);
    // Four lines and the 12s above and below.
    expect(m.lines).toBeLessThanOrEqual(5);
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(
      () => document.activeElement?.tagName ?? "",
    );
    expect(focused).toBe("PRE");
    // The arrow keys scroll it in Chromium, animated. In Playwright's WebKit
    // the arrow keys left it at 0 when this was written (18 Nov 2026), so
    // there the stop on the keyboard's way is what is held.
    if (browserName === "webkit") return;
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() =>
        component.evaluate((host) => host.querySelector("pre")!.scrollLeft),
      )
      .toBeGreaterThan(0);
  });

  test("caps its height with maxHeight and scrolls inside it, reachable by Tab", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <CodeBlockFixture code={TALL_CODE} maxHeight={120} copyable />,
    );
    const m = await component.evaluate((host) => {
      const block = host.querySelector(".kozmos-code-block") as HTMLElement;
      const pre = block.querySelector("pre") as HTMLElement;
      const copy = block.querySelector("button")!;
      return {
        block: block.getBoundingClientRect().height,
        pre: pre.getBoundingClientRect().height,
        scrolls: pre.scrollHeight > pre.clientHeight,
        overflowY: getComputedStyle(pre).overflowY,
        copyTop:
          copy.getBoundingClientRect().top - block.getBoundingClientRect().top,
      };
    });
    expect(m.block).toBe(120);
    expect(m.pre).toBe(120);
    expect(m.scrolls).toBe(true);
    expect(m.overflowY).toBe("auto");
    // The copy stays at the block's top end, out of the scroll.
    expect(m.copyTop).toBe(4);
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement?.tagName ?? ""),
    ).toBe("PRE");
  });

  test("is as tall as its code without maxHeight", async ({ mount }) => {
    const component = await mount(<CodeBlockFixture code={TALL_CODE} />);
    const height = await component.evaluate(
      (host) =>
        host.querySelector(".kozmos-code-block")!.getBoundingClientRect()
          .height,
    );
    // 42 lines of 20 and the 12s above and below.
    expect(height).toBe(42 * 20 + 24);
  });

  test("puts the copy at the top end and keeps the code clear of it", async ({
    mount,
  }) => {
    const component = await mount(<CodeBlockFixture copyable />);
    const m = await component.evaluate(read);
    expect(m.copy).toBeTruthy();
    expect(m.copy!.top).toBe(4);
    expect(m.copy!.end).toBe(4);
    // The code's end padding is the button and the 4 beside it.
    expect(m.paddingEnd).toBe(m.copy!.width + 4);
  });
});
