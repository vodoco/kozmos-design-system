// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosTag,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Tag stories draw with their own render, so the stories parity
 * check cannot draw them from args: here are Default, Removable and
 * Emotions as their renders draw them, each variant with and without an
 * emotion, the remove button on and off the theme fill, and an app's style
 * over the emotion's. Mounted, a press of the remove button emits `remove`
 * as React's calls `onRemove`, and reports the same `tag_removed`.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const tag = (
  props: Record<string, unknown>,
  label: string,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Tag,
  vue: KozmosTag,
  props,
  vueProps,
  children: [label],
});
const element = (className: string, children: Drawn[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className },
  vueProps: { class: className },
  children,
});
const inTheme = (...children: Drawn[]) =>
  renderBoth({
    react: KozmosReact.ThemeProvider,
    vue: KozmosThemeProvider,
    children,
  });
const remove = () => {};

describe("KozmosTag draws what React's Tag draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await inTheme(tag({}, "Tag"));
    expect(react).toContain("rounded-pill");
    expect(react).not.toContain("<button");
    expect(vue).toBe(react);
  });

  it("Removable: draws what React's story draws", async () => {
    const { react, vue } = await inTheme(
      tag({ onRemove: remove }, "Removable Tag"),
    );
    expect(react).toContain("kozmos-tag-remove");
    expect(react).toContain('"Remove"');
    expect(vue).toBe(react);
  });

  it("Emotions: draws what React's story draws", async () => {
    const row = (variant?: string) =>
      element(
        "flex flex-wrap items-center gap-2",
        (
          [
            ["neutral", "Neutral"],
            ["themed", "Themed"],
            ["success", "Open"],
            ["danger", "Closed"],
            ["informative", "Info"],
            ["alert", "Delayed"],
          ] as const
        ).map(([emotion, label]) =>
          tag(variant ? { emotion, variant } : { emotion }, label),
        ),
      );
    const { react, vue } = await inTheme(
      element("flex flex-col gap-3", [row(), row("outline")]),
    );
    expect(react).toContain(
      "--kz-emotion-surface:var(--semantics-emotion-alert-surface)",
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["secondary", { variant: "secondary" }],
    ["destructive", { variant: "destructive" }],
    ["outline", { variant: "outline" }],
    ["a filled emotion", { variant: "secondary", emotion: "danger" }],
    ["an outlined emotion", { variant: "outline", emotion: "informative" }],
    [
      "removable off the theme fill, with its own label",
      { variant: "outline", onRemove: remove, removeLabel: "Kaldır" },
    ],
    ["removable with an emotion", { emotion: "success", onRemove: remove }],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await inTheme(tag({ ...props }, "Label"));
    expect(vue).toBe(react);
  });

  it("puts an app's style over the emotion's properties", async () => {
    const { react, vue } = await inTheme(
      tag(
        {
          emotion: "alert",
          style: { "--kz-emotion-text": "red", marginTop: 2 },
        },
        "Delayed",
        {
          emotion: "alert",
          style: { "--kz-emotion-text": "red", marginTop: "2px" },
        },
      ),
    );
    expect(react).toContain("--kz-emotion-text:red");
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
const read = (batches: KozmosAnalyticsEvent[][]) =>
  batches.flat().map(({ timestamp: _timestamp, ...event }) => event);

describe("KozmosTag's remove", () => {
  it("remove fires as React's onRemove, and reports the same tag_removed", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const batches = {
      react: [] as KozmosAnalyticsEvent[][],
      vue: [] as KozmosAnalyticsEvent[][],
    };

    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 5,
            onDispatch: (events) => batches.react.push(events),
          },
          React.createElement(
            KozmosReact.Tag,
            { onRemove: () => heard.react.push("remove") },
            "Gate A12",
          ),
          React.createElement(
            KozmosReact.Tag,
            { onRemove: () => heard.react.push("remove") },
            React.createElement("b", null, "Gate"),
          ),
        ),
      ),
    );
    await act(async () => {
      for (const button of reactHost.querySelectorAll("button")) button.click();
    });
    await act(() => wait(20));

    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(
          KozmosAnalyticsProvider,
          {
            batchDelayMs: 5,
            onDispatch: (events: KozmosAnalyticsEvent[]) =>
              batches.vue.push(events),
          },
          () => [
            h(
              KozmosTag,
              { onRemove: () => heard.vue.push("remove") },
              () => "Gate A12",
            ),
            h(KozmosTag, { onRemove: () => heard.vue.push("remove") }, () => [
              h("b", "Gate"),
            ]),
          ],
        ),
    });
    vueApp.mount(vueHost);
    await nextTick();
    for (const button of vueHost.querySelectorAll("button")) button.click();
    await wait(20);

    expect(heard.react).toEqual(["remove", "remove"]);
    expect(heard.vue).toEqual(heard.react);
    expect(read(batches.react)).toEqual([
      {
        component: "Tag",
        eventName: "tag_removed",
        properties: { label: "Gate A12" },
      },
      { component: "Tag", eventName: "tag_removed", properties: undefined },
    ]);
    expect(read(batches.vue)).toEqual(read(batches.react));
  });

  it("draws no remove button with no listener", async () => {
    const vueHost = host();
    vueApp = createApp({ render: () => h(KozmosTag, null, () => "Tag") });
    vueApp.mount(vueHost);
    expect(vueHost.querySelector("button")).toBeNull();
  });
});
