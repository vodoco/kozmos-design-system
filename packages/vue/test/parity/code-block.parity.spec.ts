// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import { KozmosThemeProvider, KozmosCodeBlock } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's CodeBlock stories draw with their own render, so the stories
 * parity check cannot draw them from args: here each is, drawn in both, with
 * the block's edges (a capped height, its copy's own words). Then, mounted,
 * a copy: React's onCopy and Vue's `copy` hear the code, and both say
 * "Copied" and draw the check, which a server render cannot show.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const MERGED_UNIT = `{
  "mergedUnit": {
    "fid": "f-1209",
    "name": "Bean & Leaf Café",
    "sources": ["f-1042", "f-1043"],
    "mergedAt": "2026-10-29T09:41:00Z",
    "geometry": { "type": "Polygon", "levels": [1] }
  }
}`;

const block = (
  props: Record<string, unknown>,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.CodeBlock,
  vue: KozmosCodeBlock,
  props,
  vueProps,
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const sized = (maxWidth: number, child: Drawn): Drawn => ({
  react: "div",
  vue: "div",
  props: { style: { maxWidth } },
  vueProps: { style: { maxWidth: `${maxWidth}px` } },
  children: [child],
});

describe("KozmosCodeBlock draws what React's CodeBlock draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        sized(
          480,
          block({
            label: "mergedUnit JSON",
            code: MERGED_UNIT,
            copyable: true,
          }),
        ),
      ),
    );
    expect(react).toContain('aria-label="Copy"');
    expect(react).toContain('role="status"');
    expect(vue).toBe(react);
  });

  it("Scroll: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        sized(
          320,
          block({ label: "mergedUnit JSON", code: MERGED_UNIT, wrap: false }),
        ),
      ),
    );
    expect(react).toContain('data-wrap="false"');
    expect(react).toContain('tabindex="0"');
    expect(vue).toBe(react);
  });

  it("draws what React's CodeBlock draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(block({ label: "JSON", code: "{}" })),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["a height capped in pixels", { maxHeight: 120 }],
    ["a height capped in any length", { maxHeight: "12rem" }],
    ["a height capped at nothing", { maxHeight: 0 }],
    [
      "its copy in the product's words",
      { copyable: true, copyLabel: "Copy JSON", copiedLabel: "JSON copied" },
    ],
    ["a class over the recipe's", { className: "mt-4" }],
  ] as const)("%s", async (_name, props) => {
    const { className, ...rest } = props as Record<string, unknown>;
    const base = { label: "JSON", code: '{ "fid": "f-1209" }' };
    const { react, vue } = await renderBoth(
      inTheme(
        block(
          { ...base, ...props },
          className === undefined
            ? { ...base, ...rest }
            : { ...base, ...rest, class: className },
        ),
      ),
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosCodeBlock's copy, mounted", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  const writeText = vi.fn();
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });

  const host = () => {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
  };
  const props = { label: "JSON", code: '{ "fid": "f-1209" }', copyable: true };
  /** Clicks the copy and lets the clipboard's promise settle. */
  const copy = async (element: HTMLElement, settle: () => Promise<void>) => {
    element.querySelector<HTMLButtonElement>("button")!.click();
    await settle();
  };

  it("copy fires as React's onCopy, and both say they copied", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };

    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.ThemeProvider,
          null,
          React.createElement(KozmosReact.CodeBlock, {
            ...props,
            onCopy: (code: string) => heard.react.push(code),
          }),
        ),
      ),
    );
    await copy(reactHost, () =>
      act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      }),
    );
    const reactSaid = reactHost.querySelector('[role="status"]')?.textContent;
    const reactCopied = normalizeHtml(reactHost.innerHTML);
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();

    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosThemeProvider, null, {
          default: () =>
            h(KozmosCodeBlock, {
              ...props,
              onCopy: (code: string) => heard.vue.push(code),
            }),
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    await copy(vueHost, async () => {
      await Promise.resolve();
      await nextTick();
    });
    const vueCopied = normalizeHtml(vueHost.innerHTML);

    expect(heard.react).toEqual(['{ "fid": "f-1209" }']);
    expect(heard.vue).toEqual(heard.react);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(reactSaid).toBe("Copied");
    expect(vueCopied).toBe(reactCopied);
  });

  it("hears nothing when the clipboard refuses, as React's", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const heard: string[] = [];
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosThemeProvider, null, {
          default: () =>
            h(KozmosCodeBlock, {
              ...props,
              onCopy: (code: string) => heard.push(code),
            }),
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    await copy(vueHost, async () => {
      await Promise.resolve();
      await Promise.resolve();
      await nextTick();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(heard).toEqual([]);
    expect(vueHost.querySelector('[role="status"]')?.textContent).toBe("");
  });

  it("says it again after a second copy, and forgets it after 2 s", async () => {
    vi.useFakeTimers();
    try {
      const vueHost = host();
      vueApp = createApp({
        render: () =>
          h(KozmosThemeProvider, null, {
            default: () => h(KozmosCodeBlock, props),
          }),
      });
      vueApp.mount(vueHost);
      await nextTick();
      const said = () => vueHost.querySelector('[role="status"]')?.textContent;
      const settle = async () => {
        await Promise.resolve();
        await nextTick();
      };
      await copy(vueHost, settle);
      expect(said()).toBe("Copied");
      await copy(vueHost, settle);
      // The same words twice are not read twice: a no-break space differs.
      expect(said()).toBe("Copied\u00a0");
      await vi.advanceTimersByTimeAsync(2000);
      await nextTick();
      expect(said()).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});
