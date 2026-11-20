// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, defineComponent, h, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosButton,
  useKozmosAnalytics,
  type KozmosAnalyticsEvent,
} from "../../src/index";

/**
 * Vue's KozmosAnalyticsProvider batches as React's AnalyticsProvider does
 * (GAP-230, decision 172): the same events, from the same presses, handed
 * on in the same batches, `batchDelayMs` after the first event of each, and
 * what is left when the provider unmounts. A press of Vue's KozmosButton is
 * the `button_clicked` React's Button reports, and a product's own event
 * (`useKozmosAnalytics`) joins the parts' batch.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

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
/** The events of each batch, without the time each was made. */
const read = (batches: KozmosAnalyticsEvent[][]) =>
  batches.map((batch) =>
    batch.map(({ timestamp, ...event }) => {
      expect(typeof timestamp).toBe("number");
      return event;
    }),
  );

/** A product's own event, sent beside the parts'. */
const OWN = ["Map", "level_changed", { level: 2 }] as const;

async function inReact(delay: number) {
  const batches: KozmosAnalyticsEvent[][] = [];
  function Own() {
    const { trackEvent } = KozmosReact.useKozmosAnalytics();
    return React.createElement(
      "button",
      { "data-own": "", onClick: () => trackEvent(...OWN) },
      "Own",
    );
  }
  const element = host();
  reactRoot = createRoot(element);
  await act(async () =>
    reactRoot!.render(
      React.createElement(
        KozmosReact.AnalyticsProvider,
        {
          batchDelayMs: delay,
          onDispatch: (events) => batches.push(events),
        },
        React.createElement(
          KozmosReact.Button,
          { variant: "primary", emotion: "success" },
          "Save",
        ),
        React.createElement(Own),
      ),
    ),
  );
  return { element, batches };
}

async function inVue(delay: number) {
  const batches: KozmosAnalyticsEvent[][] = [];
  const Own = defineComponent({
    setup() {
      const { trackEvent } = useKozmosAnalytics();
      return () =>
        h("button", { "data-own": "", onClick: () => trackEvent(...OWN) }, [
          "Own",
        ]);
    },
  });
  const element = host();
  vueApp = createApp({
    render: () =>
      h(
        KozmosAnalyticsProvider,
        {
          batchDelayMs: delay,
          onDispatch: (events: KozmosAnalyticsEvent[]) => batches.push(events),
        },
        () => [
          h(KozmosButton, { variant: "primary", emotion: "success" }, () => [
            "Save",
          ]),
          h(Own),
        ],
      ),
  });
  vueApp.mount(element);
  return { element, batches };
}

const press = async (element: HTMLElement) => {
  await act(async () => {
    element.querySelector<HTMLElement>("button:not([data-own])")!.click();
    element.querySelector<HTMLElement>("[data-own]")!.click();
  });
};

describe("KozmosAnalyticsProvider batches as React's AnalyticsProvider", () => {
  it("hands on one batch of the same events, batchDelayMs after the first", async () => {
    const react = await inReact(30);
    const vue = await inVue(30);
    await press(react.element);
    await press(vue.element);
    // Nothing before the delay.
    expect(react.batches).toEqual([]);
    expect(vue.batches).toEqual([]);
    await wait(60);
    expect(read(react.batches)).toEqual([
      [
        {
          eventName: "button_clicked",
          component: "Button",
          properties: { variant: "primary", emotion: "success" },
        },
        { eventName: OWN[1], component: OWN[0], properties: OWN[2] },
      ],
    ]);
    expect(read(vue.batches)).toEqual(read(react.batches));
  });

  it("hands on what is left when it unmounts", async () => {
    const react = await inReact(60_000);
    const vue = await inVue(60_000);
    await press(react.element);
    await press(vue.element);
    act(() => reactRoot!.unmount());
    vueApp!.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    expect(read(react.batches)).toHaveLength(1);
    expect(read(vue.batches)).toEqual(read(react.batches));
  });
});
