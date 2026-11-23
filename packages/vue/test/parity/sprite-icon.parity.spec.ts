// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import { KozmosThemeProvider, KozmosSpriteIcon } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's SpriteIcon story draws with its own render, so the stories parity
 * check cannot draw it from args: here it is, drawn in both. A server render
 * draws each box empty, as React's does, since the atlas is read in the
 * browser; mounted, with an atlas to read, both draw the same cells, and an
 * empty box for a name the atlas does not have.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const SPRITE = "./sprite-fixture/sprite";
const NAMES = ["desk", "atm", "auditorium", "1", "not-in-the-atlas"];
const SIZES = [16, 20, 24] as const;

/** React's Default story's grid, each row a size, each cell a name. */
function story(args: Record<string, unknown> = {}): Drawn {
  return {
    react: "div",
    vue: "div",
    props: { style: { display: "grid", gap: 12 } },
    vueProps: { style: { display: "grid", gap: "12px" } },
    children: SIZES.map((size) => ({
      react: "div",
      vue: "div",
      props: { style: { display: "flex", gap: 12, alignItems: "center" } },
      vueProps: {
        style: { display: "flex", gap: "12px", alignItems: "center" },
      },
      children: NAMES.map((name) => ({
        react: KozmosReact.SpriteIcon,
        vue: KozmosSpriteIcon,
        props: {
          sprite: SPRITE,
          ...args,
          name,
          size,
          label: name === "desk" ? "Desk" : undefined,
        },
      })),
    })),
  };
}
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});

describe("KozmosSpriteIcon draws what React's SpriteIcon draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(inTheme(story()));
    expect(react).toContain('role="img"');
    expect(react).toContain('data-state="empty"');
    expect(vue).toBe(react);
  });

  it("draws what React's SpriteIcon draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.SpriteIcon,
        vue: KozmosSpriteIcon,
        props: { sprite: SPRITE, name: "atm" },
      }),
    );
    expect(vue).toBe(react);
  });

  it("keeps an app's class and style beside its own", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: KozmosReact.SpriteIcon,
        vue: KozmosSpriteIcon,
        props: {
          sprite: SPRITE,
          name: "atm",
          size: 16,
          className: "ms-1",
          style: { opacity: 0.5 },
        },
        vueProps: {
          sprite: SPRITE,
          name: "atm",
          size: 16,
          class: "ms-1",
          style: { opacity: 0.5 },
        },
      }),
    );
    expect(vue).toBe(react);
  });
});

class FakeImage {
  naturalWidth = 400;
  naturalHeight = 220;
  onload: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe("KozmosSpriteIcon, mounted with an atlas to read", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          desk: { x: 0, y: 0, width: 90, height: 90 },
          atm: { x: 90, y: 0, width: 90, height: 90 },
          auditorium: { x: 180, y: 0, width: 90, height: 90 },
          "1": { x: 270, y: 0, width: 60, height: 120 },
        }),
      })),
    );
  });
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });
  const host = () => {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
  };
  const drawnIn = (element: HTMLElement) =>
    element.querySelectorAll('[data-state="drawn"]').length;
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("draws each cell as React's does, and an empty box for a missing one", async () => {
    // Each framework reads its own atlas cache, so the URL is the same.
    const sprite = "https://cdn.test/parity/sprite";
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.ThemeProvider,
          null,
          React.createElement(
            "div",
            null,
            ...SIZES.flatMap((size) =>
              NAMES.map((name) =>
                React.createElement(KozmosReact.SpriteIcon, {
                  key: `${size}-${name}`,
                  sprite,
                  name,
                  size,
                  label: name === "desk" ? "Desk" : undefined,
                }),
              ),
            ),
          ),
        ),
      ),
    );
    await act(flush);
    const react = normalizeHtml(reactHost.innerHTML);
    expect(drawnIn(reactHost)).toBe(SIZES.length * 4);
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();

    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosThemeProvider, null, {
          default: () =>
            h(
              "div",
              SIZES.flatMap((size) =>
                NAMES.map((name) =>
                  h(KozmosSpriteIcon, {
                    sprite,
                    name,
                    size,
                    label: name === "desk" ? "Desk" : undefined,
                  }),
                ),
              ),
            ),
        }),
    });
    vueApp.mount(vueHost);
    await flush();
    await nextTick();
    expect(drawnIn(vueHost)).toBe(SIZES.length * 4);
    expect(normalizeHtml(vueHost.innerHTML)).toBe(react);
    expect(fetch).toHaveBeenCalledWith(`${sprite}.json`);
  });

  it("reads another atlas when the sprite changes", async () => {
    const vueHost = host();
    const sprite = { value: "https://cdn.test/parity/first" };
    vueApp = createApp({
      data: () => sprite,
      render() {
        return h(KozmosThemeProvider, null, {
          default: () =>
            h(KozmosSpriteIcon, { sprite: this.value, name: "atm" }),
        });
      },
    });
    const vm = vueApp.mount(vueHost) as unknown as { value: string };
    await flush();
    await nextTick();
    expect(drawnIn(vueHost)).toBe(1);
    vm.value = "https://cdn.test/parity/second";
    await nextTick();
    await flush();
    await nextTick();
    expect(fetch).toHaveBeenCalledWith("https://cdn.test/parity/second.json");
    expect(drawnIn(vueHost)).toBe(1);
  });
});
