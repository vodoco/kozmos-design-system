// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createApp, h, type App, type VNode } from "vue";
import * as KozmosReact from "@kozmos-ds/react";
import {
  KozmosAnalyticsProvider,
  KozmosDensityScope,
  KozmosLink,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { renderBoth } from "./render";

/**
 * React's Link stories drawn with their own render, in both: the external
 * link in running text at both densities, and right to left with the
 * product's own words. Text and Stack are the same plain elements in
 * both (their own parity specs hold them), so what is compared is the
 * link's own drawing; the new-tab icon is `@kozmos-ds/icons`' in React and
 * `@kozmos-ds/icons/vue`'s in Vue.
 *
 * Then mounted, as a click is not in a server render: each click reports
 * React's `link_clicked`, with its href, to the nearest provider, and the
 * app's own listener runs.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const R = React.createElement;

const pair = (
  react: () => React.ReactNode,
  vue: () => VNode | VNode[],
  provider: Record<string, unknown> = {},
) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    props: provider,
    children: [{ react: () => react(), vue: { setup: () => vue } }],
  });

/** Text's `sm` paragraph, 208 wide: the same element in both. */
const TEXT = "kozmos-reset kozmos-text kozmos-text-sm";

describe("KozmosLink draws what React's Link draws", () => {
  it("ExternalInText: draws what React's story draws", async () => {
    const paragraph = {
      react: () =>
        R(
          "p",
          { className: TEXT, style: { width: 208 } },
          "Read our ",
          R(
            KozmosReact.Link,
            { href: "https://example.com/privacy", external: true },
            "Privacy Policy",
          ),
          " and the ",
          R(
            KozmosReact.Link,
            {
              href: "https://example.com/terms",
              external: true,
              variant: "subtle",
            },
            "Terms of Service",
          ),
          " before you continue.",
        ),
      vue: () =>
        h("p", { class: TEXT, style: { width: "208px" } }, [
          "Read our ",
          h(
            KozmosLink,
            { href: "https://example.com/privacy", external: true },
            () => "Privacy Policy",
          ),
          " and the ",
          h(
            KozmosLink,
            {
              href: "https://example.com/terms",
              external: true,
              variant: "subtle",
            },
            () => "Terms of Service",
          ),
          " before you continue.",
        ]),
    };
    const { react, vue } = await pair(
      () =>
        R(
          "div",
          { className: "flex flex-row gap-6" },
          paragraph.react(),
          R(
            KozmosReact.DensityScope,
            { density: "compact" },
            paragraph.react(),
          ),
        ),
      () =>
        h("div", { class: "flex flex-row gap-6" }, [
          paragraph.vue(),
          h(KozmosDensityScope, { density: "compact" }, () => [
            paragraph.vue(),
          ]),
        ]),
    );
    expect(react).toContain('target="_blank"');
    expect(react).toContain("opens in a new tab");
    expect(vue).toBe(react);
  });

  it("ExternalRightToLeft: draws what React's story draws", async () => {
    const { react, vue } = await pair(
      () =>
        R(
          "p",
          { className: TEXT, style: { width: 208 } },
          "اقرأ ",
          R(
            KozmosReact.Link,
            {
              href: "https://example.com/privacy",
              external: true,
              externalLabel: "يفتح في علامة تبويب جديدة",
            },
            "سياسة الخصوصية",
          ),
          " قبل المتابعة.",
        ),
      () =>
        h("p", { class: TEXT, style: { width: "208px" } }, [
          "اقرأ ",
          h(
            KozmosLink,
            {
              href: "https://example.com/privacy",
              external: true,
              externalLabel: "يفتح في علامة تبويب جديدة",
            },
            () => "سياسة الخصوصية",
          ),
          " قبل المتابعة.",
        ]),
      { dir: "rtl", theme: "light" },
    );
    expect(react).toContain('dir="rtl"');
    expect(vue).toBe(react);
  });

  it.each([
    ["an app's target that keeps it in this tab", { target: "_self" }],
    ["an empty target, this tab too", { target: "" }],
    ["an app's rel over the new tab's", { rel: "noopener" }],
    ["no words after its name", { externalLabel: "" }],
  ] as const)("external, with %s", async (_name, props) => {
    const { react, vue } = await pair(
      () =>
        R(
          KozmosReact.Link,
          { href: "https://example.com", external: true, ...props },
          "Example",
        ),
      () =>
        h(
          KozmosLink,
          { href: "https://example.com", external: true, ...props },
          () => "Example",
        ),
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosLink reports a click as React's Link does", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const read = (batches: KozmosAnalyticsEvent[][]) =>
    batches.flat().map(({ timestamp: _, ...event }) => event);

  it("link_clicked, with its href, and the app's own listener too", async () => {
    const heard: { react: string[]; vue: string[] } = { react: [], vue: [] };
    const batches: {
      react: KozmosAnalyticsEvent[][];
      vue: KozmosAnalyticsEvent[][];
    } = { react: [], vue: [] };

    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        R(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 10,
            onDispatch: (events) => {
              heard.react.push("dispatch");
              batches.react.push(events);
            },
          },
          R(
            KozmosReact.Link,
            {
              href: "#gate-4",
              onClick: () => heard.react.push("click"),
            },
            "Gate 4",
          ),
        ),
      ),
    );

    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(
          KozmosAnalyticsProvider,
          {
            batchDelayMs: 10,
            onDispatch: (events: KozmosAnalyticsEvent[]) => {
              heard.vue.push("dispatch");
              batches.vue.push(events);
            },
          },
          () => [
            h(
              KozmosLink,
              { href: "#gate-4", onClick: () => heard.vue.push("click") },
              () => "Gate 4",
            ),
          ],
        ),
    });
    vueApp.mount(vueHost);

    await act(async () => reactHost.querySelector("a")!.click());
    vueHost.querySelector("a")!.click();
    await act(async () => wait(40));

    expect(read(batches.react)).toEqual([
      {
        component: "Link",
        eventName: "link_clicked",
        properties: { href: "#gate-4" },
      },
    ]);
    expect(read(batches.vue)).toEqual(read(batches.react));
    expect(heard.vue).toEqual(heard.react);
  });
});
