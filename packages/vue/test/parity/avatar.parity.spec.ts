// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import {
  KozmosAvatar,
  KozmosAvatarFallback,
  KozmosAvatarImage,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Avatar stories draw with their own render: here are Default and
 * Fallback, as their renders draw them, and each size. A server render
 * draws the fallback, as no image has loaded. Mounted, with an image that
 * loads (or fails) in the document, the image replaces the fallback in
 * both, `loadingStatusChange` reports what React's `onLoadingStatusChange`
 * reports, and `delay-ms` holds the fallback back alike.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const avatar = (
  props: Record<string, unknown>,
  ...children: Drawn[]
): Drawn => ({
  react: KozmosReact.Avatar,
  vue: KozmosAvatar,
  props,
  children,
});
const image = (props: Record<string, unknown>): Drawn => ({
  react: KozmosReact.AvatarImage,
  vue: KozmosAvatarImage,
  props,
});
const fallback = (text: string, className?: string): Drawn => ({
  react: KozmosReact.AvatarFallback,
  vue: KozmosAvatarFallback,
  props: className ? { className } : {},
  vueProps: className ? { class: className } : {},
  children: [text],
});
const inTheme = (...children: Drawn[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children,
  });

describe("KozmosAvatar draws what React's Avatar draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await inTheme(
      avatar(
        {},
        image({ src: "https://github.com/shadcn.png", alt: "@shadcn" }),
        fallback("CN"),
      ),
    );
    expect(react).toContain("h-10 w-10");
    expect(react).toContain('"CN"');
    expect(vue).toBe(react);
  });

  it("Fallback: draws what React's story draws", async () => {
    const { react, vue } = await inTheme(avatar({}, fallback("CN")));
    expect(vue).toBe(react);
  });

  it.each([
    ["sm, 24 (decision 221)", { size: "sm" }],
    ["a class over the recipe's", { className: "h-12 w-12" }],
  ] as const)("%s", async (_name, props) => {
    const { className, ...rest } = props as Record<string, unknown>;
    const { react, vue } = await inTheme({
      ...avatar(props, fallback("AA", "bg-primary")),
      vueProps: className ? { ...rest, class: className } : rest,
    } as Drawn);
    expect(vue).toBe(react);
  });
});

/** An image that loads when its src ends in .png, and fails otherwise. */
class LoadingImage extends EventTarget {
  #src = "";
  complete = false;
  naturalWidth = 0;
  referrerPolicy = "";
  crossOrigin: string | null = null;
  get src() {
    return this.#src;
  }
  set src(value: string) {
    this.#src = value;
    setTimeout(() => {
      const ok = value.endsWith(".png");
      this.complete = ok;
      this.naturalWidth = ok ? 40 : 0;
      this.dispatchEvent(new Event(ok ? "load" : "error"));
    }, 5);
  }
}

let reactRoot: Root | undefined;
let vueApp: App | undefined;
const realImage = window.Image;
beforeEach(() => {
  window.Image = LoadingImage as unknown as typeof Image;
});
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
  window.Image = realImage;
});
const host = () => document.body.appendChild(document.createElement("div"));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** What each framework draws once its image has loaded or failed, and what it heard. */
async function mounted(src: string, delayMs?: number) {
  const heard = { react: [] as string[], vue: [] as string[] };
  const reactHost = host();
  reactRoot = createRoot(reactHost);
  await act(async () =>
    reactRoot!.render(
      React.createElement(
        KozmosReact.Avatar,
        null,
        React.createElement(KozmosReact.AvatarImage, {
          src,
          alt: "Ada",
          className: "object-cover",
          onLoadingStatusChange: (status: string) => heard.react.push(status),
        }),
        React.createElement(KozmosReact.AvatarFallback, { delayMs }, "AL"),
      ),
    ),
  );
  const reactEarly = normalizeHtml(reactHost.innerHTML);
  await act(() => wait(30));
  const react = normalizeHtml(reactHost.innerHTML);

  const vueHost = host();
  vueApp = createApp({
    render: () =>
      h(KozmosAvatar, null, () => [
        h(KozmosAvatarImage, {
          src,
          alt: "Ada",
          class: "object-cover",
          onLoadingStatusChange: (status: string) => heard.vue.push(status),
        }),
        h(KozmosAvatarFallback, { delayMs }, () => "AL"),
      ]),
  });
  vueApp.mount(vueHost);
  await nextTick();
  const vueEarly = normalizeHtml(vueHost.innerHTML);
  await wait(30);
  await nextTick();
  const vue = normalizeHtml(vueHost.innerHTML);
  return { react, vue, reactEarly, vueEarly, heard };
}

describe("KozmosAvatarImage loads as React's AvatarImage", () => {
  it("draws the image in place of the fallback once it loads, and loadingStatusChange fires as React's onLoadingStatusChange", async () => {
    const { react, vue, reactEarly, vueEarly, heard } = await mounted(
      "https://example.com/ada.png",
    );
    expect(reactEarly).toContain('"AL"');
    expect(vueEarly).toBe(reactEarly);
    expect(react).toContain("<img");
    expect(react).not.toContain('"AL"');
    expect(vue).toBe(react);
    expect(heard.react).toEqual(["loading", "loaded"]);
    expect(heard.vue).toEqual(heard.react);
  });

  it("keeps the fallback when the image fails", async () => {
    const { react, vue, heard } = await mounted("https://example.com/missing");
    expect(react).not.toContain("<img");
    expect(react).toContain('"AL"');
    expect(vue).toBe(react);
    expect(heard.vue).toEqual(heard.react);
    expect(heard.react).toEqual(["loading", "error"]);
  });

  it("holds the fallback back for delay-ms, as React's delayMs", async () => {
    const { react, vue, reactEarly, vueEarly } = await mounted(
      "https://example.com/missing",
      15,
    );
    expect(reactEarly).not.toContain('"AL"');
    expect(vueEarly).toBe(reactEarly);
    expect(react).toContain('"AL"');
    expect(vue).toBe(react);
  });
});
