// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import {
  KozmosButton,
  KozmosSpinner,
  KozmosThemeProvider,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Spinner stories draw with their own render: here are each, as
 * its render draws it, and the arc inside a loading Button. A server render
 * draws the status empty; mounted, its label is put in after the region, a
 * moment later in both (GAP-226).
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const spinner = (props: Record<string, unknown> = {}): Drawn => ({
  react: KozmosReact.Spinner,
  vue: KozmosSpinner,
  props,
});
const inTheme = (...children: Drawn[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children,
  });

describe("KozmosSpinner draws what React's Spinner draws", () => {
  it.each([
    ["Default", {}],
    ["Small", { size: "sm" }],
    ["Large", { size: "lg" }],
  ] as const)("%s: draws what React's story draws", async (_name, props) => {
    const { react, vue } = await inTheme(spinner({ ...props }));
    expect(react).toContain('role="status"');
    expect(react).toContain("kozmos-spinner-arc");
    expect(vue).toBe(react);
  });

  it("EverySize: draws what React's story draws", async () => {
    const { react, vue } = await inTheme({
      react: "div",
      vue: "div",
      props: { className: "flex items-end gap-4" },
      vueProps: { class: "flex items-end gap-4" },
      children: [
        spinner({ size: "sm", label: "Loading, small" }),
        spinner({ size: "md", label: "Loading, medium" }),
        spinner({ size: "lg", label: "Loading, large" }),
        spinner({ size: "xl", label: "Loading, extra large" }),
      ],
    });
    expect(react).toContain('width="48"');
    expect(vue).toBe(react);
  });

  it("InAButton: draws what React's story draws", async () => {
    const { react, vue } = await inTheme({
      react: KozmosReact.Button,
      vue: KozmosButton,
      props: { isLoading: true },
      children: ["Saving"],
    });
    expect(react).toContain("kozmos-spinner-arc");
    expect(vue).toBe(react);
  });

  it("a class over the box's, and the status role an app overrides", async () => {
    const { react, vue } = await inTheme({
      ...spinner({ className: "justify-start", role: "img" }),
      vueProps: { class: "justify-start", role: "img" },
    });
    expect(react).toContain('role="img"');
    expect(vue).toBe(react);
  });
});

let reactRoot: Root | undefined;
let vueApp: App | undefined;
afterEach(() => {
  act(() => reactRoot?.unmount());
  vueApp?.unmount();
  reactRoot = undefined;
  vueApp = undefined;
  document.body.replaceChildren();
});
const host = () => document.body.appendChild(document.createElement("div"));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const said = (element: HTMLElement) =>
  element.querySelector(".sr-only")?.textContent;

describe("KozmosSpinner says its label as React's does", () => {
  it("mounts its status empty, and puts the label in a moment later", async () => {
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.Spinner, { label: "Loading places" }),
      ),
    );
    const vueHost = host();
    vueApp = createApp({
      render: () => h(KozmosSpinner, { label: "Loading places" }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    expect(said(reactHost)).toBe("");
    expect(said(vueHost)).toBe("");
    await act(() => wait(150));
    await nextTick();
    expect(said(reactHost)).toBe("Loading places");
    expect(said(vueHost)).toBe("Loading places");
    expect(normalizeHtml(vueHost.innerHTML)).toBe(
      normalizeHtml(reactHost.innerHTML),
    );
  });
});
