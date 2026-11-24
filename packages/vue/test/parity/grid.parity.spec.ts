// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import { KozmosThemeProvider, KozmosBox, KozmosGrid } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Grid stories draw their items as JSX, and Virtualized's
 * `renderItem` is a function, Vue's `render-item` slot, so the stories
 * parity check cannot draw them from args: here is each, as React's draws
 * it, server-rendered in both. Then a virtualized Grid (GAP-172) mounted in
 * both, scrolled, resized and focused as React's own tests do
 * (`Grid.virtualized.test.tsx`), comparing the drawn trees and what each
 * reports through `onRangeChange` and `@range-change`.
 */
const ITEM_CLASS =
  "p-4 bg-theme-fill text-theme-fill-foreground rounded flex items-center justify-center";

const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const item = (text: string): Drawn => ({
  react: KozmosReact.Box,
  vue: KozmosBox,
  props: { className: ITEM_CLASS },
  vueProps: { class: ITEM_CLASS },
  children: [text],
});
const grid = (
  props: Record<string, unknown>,
  children: (Drawn | string)[],
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Grid,
  vue: KozmosGrid,
  props,
  vueProps,
  children,
});

/**
 * A virtualized Grid whose items are drawn by `renderItem` in React and the
 * `render-item` slot in Vue, each drawing `draw(index)`.
 */
const virtual = (
  props: Record<string, unknown>,
  draw: (index: number) => Drawn | string,
  vueProps: Record<string, unknown> = props,
): Drawn => ({
  react: (reactProps: Record<string, unknown>) =>
    React.createElement(KozmosReact.Grid, {
      ...reactProps,
      renderItem: (index: number) => toReactNode(draw(index)),
    }),
  vue: {
    setup:
      (_: unknown, { attrs }: { attrs: Record<string, unknown> }) =>
      () =>
        h(KozmosGrid, attrs, {
          renderItem: ({ index }: { index: number }) => [
            toVueNode(draw(index)),
          ],
        }),
  },
  props,
  vueProps,
});
const toReactNode = (node: Drawn | string): React.ReactNode =>
  typeof node === "string"
    ? node
    : React.createElement(
        node.react,
        node.props ?? {},
        ...(node.children ?? []).map(toReactNode),
      );
const toVueNode = (node: Drawn | string): ReturnType<typeof h> | string =>
  typeof node === "string"
    ? node
    : typeof node.vue === "string"
      ? h(
          node.vue,
          node.vueProps ?? node.props ?? {},
          (node.children ?? []).map(toVueNode),
        )
      : h(node.vue, node.vueProps ?? node.props ?? {}, {
          default: () => (node.children ?? []).map(toVueNode),
        });

describe("KozmosGrid draws what React's Grid draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        grid(
          { cols: 3, gap: 4 },
          ["1", "2", "3", "4", "5", "6"].map((text) => item(text)),
        ),
      ),
    );
    expect(react).toContain("grid grid-cols-3 grid-flow-row gap-4");
    expect(vue).toBe(react);
  });

  it("Virtualized: draws what React's story draws", async () => {
    const props = {
      virtualized: true,
      cols: 3,
      gap: 4,
      itemCount: 300,
      rowHeight: 72,
      "aria-label": "Sites",
    };
    const { react, vue } = await renderBoth(
      inTheme(
        virtual(
          { ...props, style: { height: 320 } },
          (index) => item(`Site ${index + 1}`),
          { ...props, style: { height: "320px" } },
        ),
      ),
    );
    // A server render has no size: the overscan's two rows, of three.
    expect(react).toContain('role="list"');
    expect(react).toContain('aria-setsize="300"');
    expect(react).toContain("Site 6");
    expect(react).not.toContain("Site 7");
    expect(vue).toBe(react);
  });

  it.each([
    ["rows, a column flow and no gap", { rows: 2, flow: "col", gap: 0 }],
    [
      "dense flow, centred, between",
      { flow: "row-dense", align: "center", justify: "between" },
    ],
    ["its own axes' gaps", { cols: 12, xGap: 2, yGap: 8 }],
    ["no columns", { cols: "none", flow: "col-dense", align: "baseline" }],
    [
      "at the end, around, rows none",
      { align: "end", justify: "around", rows: "none", cols: 5 },
    ],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await renderBoth(
      inTheme(grid({ ...props }, [item("A"), item("B")])),
    );
    expect(vue).toBe(react);
  });

  it("an app's class over the recipe's, and as-child on its one child", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        grid({ className: "gap-0 grid-cols-2", cols: 4 }, ["Merged"], {
          class: "gap-0 grid-cols-2",
          cols: 4,
        }),
        grid({ asChild: true, cols: 2 }, [
          {
            react: "ul",
            vue: "ul",
            props: { className: "m-0" },
            vueProps: { class: "m-0" },
            children: ["List"],
          },
        ]),
      ),
    );
    expect(react).toContain("<ul");
    expect(vue).toBe(react);
  });

  it("a virtualized Grid's children, without render-item, are drawn as given", async () => {
    const props = { virtualized: true, cols: 2, itemCount: 10, rowHeight: 50 };
    const { react, vue } = await renderBoth(
      inTheme(
        grid(props, [
          {
            react: "div",
            vue: "div",
            props: { role: "listitem" },
            children: ["Caller's own item"],
          },
        ]),
      ),
    );
    expect(react).toContain("Caller's own item");
    expect(vue).toBe(react);
  });

  it("a virtualized Grid fits columns of min-column-width, in one column before it is measured", async () => {
    const props = {
      virtualized: true,
      minColumnWidth: 240,
      itemCount: 50,
      rowHeight: 100,
      overscan: 1,
      gap: 0,
      className: "h-80",
      tabIndex: -1,
    };
    const { className, tabIndex, ...rest } = props;
    const { react, vue } = await renderBoth(
      inTheme(
        virtual(props, (index) => `Site ${index + 1}`, {
          ...rest,
          class: className,
          tabindex: tabIndex,
        }),
      ),
    );
    expect(react).toContain("repeat(1, minmax(0, 1fr))");
    expect(vue).toBe(react);
  });
});

/*
 * Mounted: jsdom lays nothing out, so the scroller's size is given, as
 * React's own test gives it.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let viewport = { width: 960, height: 300 };
let reactRoot: Root | undefined;
let vueApp: App | undefined;
beforeEach(() => {
  viewport = { width: 960, height: 300 };
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.virtualScroller !== undefined ? viewport.height : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.virtualScroller !== undefined ? viewport.width : 0;
    },
  );
});
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function host() {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

/** A virtualized Grid mounted in both, each listening for its range. */
async function mountBoth(
  props: Record<string, unknown>,
  card: "button" | "caller" = "button",
) {
  const heard = { react: [] as unknown[], vue: [] as unknown[] };
  const reactHost = host();
  reactRoot = createRoot(reactHost);
  await act(async () =>
    reactRoot!.render(
      React.createElement(
        KozmosReact.Grid,
        {
          ...props,
          onRangeChange: (range: unknown) => heard.react.push(range),
          ...(card === "button"
            ? {
                renderItem: (index: number) =>
                  React.createElement("button", null, `Site ${index + 1}`),
              }
            : {}),
        },
        card === "caller"
          ? React.createElement(
              "div",
              { role: "listitem" },
              "Caller's own item",
            )
          : undefined,
      ),
    ),
  );
  const vueHost = host();
  vueApp = createApp({
    render: () =>
      h(
        KozmosGrid,
        {
          ...props,
          onRangeChange: (range: unknown) => heard.vue.push(range),
        },
        card === "button"
          ? {
              renderItem: ({ index }: { index: number }) => [
                h("button", `Site ${index + 1}`),
              ],
            }
          : {
              default: () => [
                h("div", { role: "listitem" }, "Caller's own item"),
              ],
            },
      ),
  });
  vueApp.mount(vueHost);
  await nextTick();
  const scroller = (root: HTMLElement) =>
    root.querySelector("[data-virtual-scroller]") as HTMLElement;
  return {
    heard,
    react: reactHost,
    vue: vueHost,
    drawn: () => ({
      react: normalizeHtml(reactHost.innerHTML),
      vue: normalizeHtml(vueHost.innerHTML),
    }),
    async scrollTo(top: number) {
      for (const root of [reactHost, vueHost]) {
        scroller(root).scrollTop = top;
        await act(async () => {
          scroller(root).dispatchEvent(new Event("scroll"));
        });
      }
      await nextTick();
    },
    scroller,
  };
}

const listItems = (root: HTMLElement) =>
  [...root.querySelectorAll("[role=listitem]")].map(
    (element) => element.textContent,
  );

describe("a virtualized KozmosGrid, mounted, does what React's does (GAP-172)", () => {
  it("draws only the rows in view and two past them, as tall as the whole list", async () => {
    const both = await mountBoth({
      virtualized: true,
      cols: 3,
      gap: 0,
      itemCount: 300,
      rowHeight: 100,
      "aria-label": "Sites",
    });
    // 300 / 100 = 3 rows in view, and 2 below: 5 rows of 3.
    expect(listItems(both.react)).toHaveLength(15);
    expect(listItems(both.vue)).toEqual(listItems(both.react));
    const { react, vue } = both.drawn();
    expect(react).toContain("height:10000px");
    expect(vue).toBe(react);
  });

  it("draws the rows a scroll brings into view, each said in the whole list", async () => {
    const both = await mountBoth({
      virtualized: true,
      cols: 3,
      gap: 0,
      itemCount: 300,
      rowHeight: 100,
    });
    await both.scrollTo(1000);
    // Rows 10 to 12 in view, 2 above and 2 below: rows 8 to 14.
    const drawn = listItems(both.vue);
    expect(drawn).toHaveLength(21);
    expect(drawn[0]).toBe("Site 25");
    expect(drawn[20]).toBe("Site 45");
    const { react, vue } = both.drawn();
    expect(react).toContain("translateY(800px)");
    expect(vue).toBe(react);
  });

  it("rangeChange fires as React's onRangeChange", async () => {
    const both = await mountBoth(
      { virtualized: true, cols: 4, gap: 0, itemCount: 100, rowHeight: 150 },
      "caller",
    );
    // 300 / 150 = 2 rows in view, 2 below: 4 rows of 4.
    expect(both.heard.react.at(-1)).toEqual({ start: 0, end: 16 });
    // Children are the caller's window, drawn as given.
    expect(listItems(both.vue)).toEqual(["Caller's own item"]);
    // Rows 10 and 11 in view, 2 above and 2 below: rows 8 to 13.
    await both.scrollTo(1500);
    expect(both.heard.react.at(-1)).toEqual({ start: 32, end: 56 });
    // Rows 9 to 11 in view, 2 above and 2 below; then a scroll that draws
    // the same rows reports nothing.
    await both.scrollTo(1400);
    expect(both.heard.react.at(-1)).toEqual({ start: 28, end: 56 });
    const heard = both.heard.react.length;
    await both.scrollTo(1410);
    expect(both.heard.react).toHaveLength(heard);
    expect(both.heard.vue).toEqual(both.heard.react);
    expect(both.drawn().vue).toBe(both.drawn().react);
  });

  it("fits as many columns of min-column-width as the width holds", async () => {
    viewport = { width: 1000, height: 300 };
    const both = await mountBoth({
      virtualized: true,
      gap: 0,
      minColumnWidth: 240,
      itemCount: 50,
      rowHeight: 100,
    });
    const { react, vue } = both.drawn();
    expect(react).toContain("repeat(4, minmax(0, 1fr))");
    expect(listItems(both.vue)).toHaveLength(20);
    expect(vue).toBe(react);
  });

  it("counts the gap between rows", async () => {
    const both = await mountBoth({
      virtualized: true,
      cols: 2,
      gap: 4,
      itemCount: 20,
      rowHeight: 84,
    });
    // gap-4 is 16: 10 rows of 84 and 9 gaps of 16.
    const { react, vue } = both.drawn();
    expect(react).toContain(`height:${10 * 84 + 9 * 16}px`);
    expect(vue).toBe(react);
  });

  it("keeps the keyboard: a focused card that scrolls away hands focus to the scroller", async () => {
    const both = await mountBoth({
      virtualized: true,
      cols: 3,
      gap: 0,
      itemCount: 300,
      rowHeight: 100,
    });
    for (const root of [both.react, both.vue]) {
      expect(both.scroller(root).getAttribute("tabindex")).toBe("0");
      const first = [...root.querySelectorAll("button")].find(
        (button) => button.textContent === "Site 1",
      )!;
      await act(async () => first.focus());
      expect(document.activeElement).toBe(first);
      const scroller = both.scroller(root);
      scroller.scrollTop = 5000;
      await act(async () => {
        scroller.dispatchEvent(new Event("scroll"));
      });
      await nextTick();
      expect(
        [...root.querySelectorAll("button")].some(
          (button) => button.textContent === "Site 1",
        ),
      ).toBe(false);
      expect(document.activeElement).toBe(both.scroller(root));
    }
  });

  it("an app's scroll and focus listeners still fire, beside the Grid's own", async () => {
    const onScroll = { react: vi.fn(), vue: vi.fn() };
    const onFocus = { react: vi.fn(), vue: vi.fn() };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    const props = { virtualized: true, cols: 1, itemCount: 10, rowHeight: 50 };
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.Grid, {
          ...props,
          onScroll: onScroll.react,
          onFocus: onFocus.react,
        }),
      ),
    );
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosGrid, {
          ...props,
          onScroll: onScroll.vue,
          onFocus: onFocus.vue,
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    for (const [root, side] of [
      [reactHost, "react"],
      [vueHost, "vue"],
    ] as const) {
      const scroller = root.querySelector(
        "[data-virtual-scroller]",
      ) as HTMLElement;
      await act(async () => {
        scroller.dispatchEvent(new Event("scroll"));
        scroller.focus();
      });
      expect(onScroll[side]).toHaveBeenCalledTimes(1);
      expect(onFocus[side]).toHaveBeenCalledTimes(1);
    }
  });
});
