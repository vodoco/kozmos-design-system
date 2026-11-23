// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, type App } from "vue";
import {
  KozmosMetaStrip,
  KozmosMetaStripItem,
  KozmosThemeProvider,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import { element, slotted } from "./slotted";

/**
 * React's MetaStrip stories draw their tiles with their own render, so the
 * stories parity check cannot draw them from args: here is each, drawn in
 * both. Icon has no native Vue port yet, so the same element stands in for
 * it in both. Then, mounted, what a server render cannot show: the strip's
 * arrow keys scroll it while it has focus, after an app's own keydown
 * listener, as React's runs its onKeyDown first.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const strip = (props: Record<string, unknown>, tiles: Drawn[]) =>
  slotted(KozmosReact.MetaStrip, KozmosMetaStrip, props, { default: tiles });
const tile = (props: Record<string, unknown>, value: string, icon?: Drawn) =>
  slotted(KozmosReact.MetaStripItem, KozmosMetaStripItem, props, {
    default: [value],
    ...(icon ? { icon: [icon] } : {}),
  });

const both = (tree: Drawn) => renderBoth(inTheme(tree));
const about = { "aria-label": "About this place" };

describe("KozmosMetaStrip draws what React's MetaStrip draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both(
      strip(about, [
        tile(
          { label: "Travel time" },
          "12 min",
          element("svg", { className: "clock" }),
        ),
        tile({ label: "Distance" }, "210 m"),
        tile({ label: "Price band" }, "$$$$"),
      ]),
    );
    expect(react).toContain('tabindex="0"');
    expect(react).toContain("kozmos-meta-label-hidden");
    expect(react).toContain('aria-hidden="true" class="kozmos-meta-icon"');
    expect(vue).toBe(react);
  });

  it("WithVisibleLabels: draws what React's story draws", async () => {
    const { react, vue } = await both(
      strip(about, [
        tile({ label: "Travel time", showLabel: true }, "12 min"),
        tile({ label: "Distance", showLabel: true }, "210 m"),
        tile({ label: "Wait", showLabel: true }, "25 min"),
      ]),
    );
    expect(react).not.toContain("kozmos-meta-label-hidden");
    expect(vue).toBe(react);
  });

  it("Overflowing: draws what React's story draws", async () => {
    const facts: [string, string][] = [
      ["Travel time", "12 min"],
      ["Distance", "210 m"],
      ["Rating", "4.5"],
      ["Price band", "$$$$"],
      ["Crowd level", "Busy"],
      ["Occupancy", "Occupied"],
    ];
    const { react, vue } = await both(
      element("div", { className: "max-w-sm" }, [
        strip(
          about,
          facts.map(([label, value]) => tile({ label }, value)),
        ),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("an app's tabindex and class over the strip's own", async () => {
    const { react, vue } = await both(
      slotted(
        KozmosReact.MetaStrip,
        KozmosMetaStrip,
        { tabIndex: -1, className: "kozmos-parity" },
        { default: [tile({ label: "Distance" }, "210 m")] },
        { tabindex: -1, class: "kozmos-parity" },
      ),
    );
    expect(react).toContain('tabindex="-1"');
    expect(vue).toBe(react);
  });
});

describe("KozmosMetaStrip scrolls with its keys as React's does", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  const host = () => document.body.appendChild(document.createElement("div"));
  /** A strip 200 wide over 600 of tiles, with its scrolling recorded. */
  const measured = (dl: HTMLElement) => {
    const scrollBy = vi.fn();
    const scrollTo = vi.fn();
    Object.defineProperties(dl, {
      clientWidth: { value: 200 },
      scrollWidth: { value: 600 },
      scrollBy: { value: scrollBy },
      scrollTo: { value: scrollTo },
    });
    return { scrollBy, scrollTo };
  };

  /** What each key does to each strip, with the app's listener's calls. */
  async function press(keys: KeyboardEventInit[], prevent = false) {
    const heard: string[] = [];
    const listener =
      (framework: string) =>
      (event: { key: string; preventDefault(): void }) => {
        heard.push(`${framework} ${event.key}`);
        if (prevent) event.preventDefault();
      };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.MetaStrip,
          { onKeyDown: listener("react") },
          React.createElement(
            KozmosReact.MetaStripItem,
            { label: "Distance" },
            "210 m",
          ),
        ),
      ),
    );
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(
          KozmosMetaStrip,
          { onKeydown: listener("vue") },
          {
            default: () => [
              h(KozmosMetaStripItem, { label: "Distance" }, () => "210 m"),
            ],
          },
        ),
    });
    vueApp.mount(vueHost);
    const done: Record<string, unknown> = {};
    for (const [framework, root] of [
      ["react", reactHost],
      ["vue", vueHost],
    ] as const) {
      const dl = root.querySelector("dl")!;
      const calls = measured(dl);
      for (const key of keys)
        await act(async () => {
          dl.dispatchEvent(
            new KeyboardEvent("keydown", {
              bubbles: true,
              cancelable: true,
              ...key,
            }),
          );
        });
      done[framework] = {
        scrollBy: calls.scrollBy.mock.calls,
        scrollTo: calls.scrollTo.mock.calls,
      };
    }
    return { done, heard };
  }

  it("ArrowRight, ArrowLeft, Home and End scroll it; a modified key does not", async () => {
    const { done, heard } = await press([
      { key: "ArrowRight" },
      { key: "ArrowLeft" },
      { key: "End" },
      { key: "Home" },
      { key: "ArrowRight", shiftKey: true },
    ]);
    expect(done.react).toEqual({
      scrollBy: [
        [{ left: 40, behavior: "auto" }],
        [{ left: -40, behavior: "auto" }],
      ],
      scrollTo: [
        [{ left: 400, behavior: "auto" }],
        [{ left: 0, behavior: "auto" }],
      ],
    });
    expect(done.vue).toEqual(done.react);
    // The app's listener heard every key, in both.
    expect(heard.filter((h) => h.startsWith("vue"))).toHaveLength(5);
    expect(heard.filter((h) => h.startsWith("react"))).toHaveLength(5);
  });

  it("an app's listener runs first, and its preventDefault stops the scroll", async () => {
    const { done, heard } = await press([{ key: "ArrowRight" }], true);
    expect(done.react).toEqual({ scrollBy: [], scrollTo: [] });
    expect(done.vue).toEqual(done.react);
    expect(heard).toEqual(["react ArrowRight", "vue ArrowRight"]);
  });
});
