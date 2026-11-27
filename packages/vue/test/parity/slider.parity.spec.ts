// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App, type VNode } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosSlider,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * React's Slider stories are each their own render, drawn here in both from
 * the same props, React's `formatValue` as Vue's `#formatValue` slot; then
 * the edges React's tests cover (Slider.test.tsx): a label and an
 * aria-label, a caller's aria-labelledby and aria-describedby on the
 * thumbs, a range's thumbs and their names, thumbs reserved before a value,
 * an error as a flag and as words, disabled, vertical, inverted, right to
 * left, a readout, a format in words and in nodes, an app's class on the
 * slider or the row, and the form's inputs. Then, mounted: the thumbs find
 * their places, the keys move a thumb and commit, v-model hears what
 * onValueChange hears and valueCommit what onValueCommit hears,
 * `slider_value_changed` is reported, a controlled slider waits for its
 * owner, the bubble shows on focus, and the readout follows.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
/** A slider in both; `format` is React's formatValue and Vue's slot. */
const slider = (
  props: Record<string, unknown>,
  format?: (value: number) => string | VNode,
): Drawn => {
  const { className, value, ...rest } = props;
  const vueProps: Record<string, unknown> = { ...rest };
  if (className !== undefined) vueProps.class = className;
  if (value !== undefined) vueProps.modelValue = value;
  return {
    react: (own: Record<string, unknown>) =>
      React.createElement(KozmosReact.Slider, {
        ...props,
        ...own,
        ...(format
          ? {
              formatValue: (n: number) => {
                const out = format(n);
                return typeof out === "string"
                  ? out
                  : React.createElement("b", null, String(n));
              },
            }
          : {}),
      }),
    vue: {
      setup:
        (_: unknown, { attrs }: { attrs: Record<string, unknown> }) =>
        () =>
          h(
            KozmosSlider,
            { ...vueProps, ...attrs } as never,
            format
              ? {
                  formatValue: ({ value: n }: { value: number }) => [format(n)],
                }
              : undefined,
          ),
    } as Drawn["vue"],
  };
};
const both = (tree: Drawn, keepIds: string[] = []) =>
  renderBoth(inTheme(tree), { keepIds });
const percent = (value: number) => `${value}%`;

describe("KozmosSlider draws React's Slider stories", () => {
  it("Default", async () => {
    const { react, vue } = await both(
      slider({
        label: "Volume",
        defaultValue: [50],
        max: 100,
        step: 1,
        className: "w-3/5",
      }),
    );
    expect(react).toContain('role="slider"');
    expect(vue).toBe(react);
  });

  it("Range", async () => {
    const { react, vue } = await both(
      slider({ defaultValue: [20, 80], max: 100, step: 1, className: "w-3/5" }),
    );
    expect(vue).toBe(react);
  });

  it("WithReadout", async () => {
    const { react, vue } = await both(
      element("div", { className: "grid w-3/5 gap-6" }, [
        slider(
          {
            label: "Floor-plan opacity",
            defaultValue: [60],
            max: 100,
            step: 5,
            showValue: true,
          },
          percent,
        ),
        slider({
          label: "Price",
          defaultValue: [20, 80],
          max: 100,
          showValue: true,
          thumbLabels: ["Lowest price", "Highest price"],
        }),
      ]),
    );
    expect(react).toContain("kozmos-slider-readout");
    expect(vue).toBe(react);
  });
});

describe("KozmosSlider draws what React's Slider draws", () => {
  it.each([
    ["with nothing given", {}],
    ["labelled", { label: "Volume" }],
    ["named by an aria-label", { "aria-label": "Volume" }],
    ["held", { value: [30] }],
    ["a range", { defaultValue: [20, 80] }],
    ["three thumbs", { defaultValue: [10, 50, 90] }],
    ["thumbs reserved", { thumbCount: 2, min: 2, max: 8 }],
    ["thumbs named", { defaultValue: [1, 9], thumbLabels: ["From", "To"] }],
    ["between a min and a max", { min: 10, max: 20, defaultValue: [15] }],
    ["in error", { error: true }],
    ["in error, in words", { error: "Too loud", label: "Volume" }],
    ["disabled", { disabled: true, defaultValue: [40] }],
    ["vertical", { orientation: "vertical", defaultValue: [40] }],
    ["vertical, given a direction", { orientation: "vertical", dir: "rtl" }],
    ["inverted", { inverted: true, defaultValue: [40] }],
    ["right to left", { dir: "rtl", defaultValue: [40] }],
    ["with a readout", { showValue: true, defaultValue: [40] }],
    [
      "with a readout and an app's class on the row",
      { showValue: true, className: "w-40 kozmos-parity" },
    ],
    ["an app's class on the slider", { className: "w-40 kozmos-parity" }],
    ["an app's wrapper class", { wrapperClassName: "w-auto kozmos-parity" }],
    ["an app's id", { id: "volume", label: "Volume" }],
    ["named for a form", { name: "volume", defaultValue: [40] }],
    ["a range named for a form", { name: "price", defaultValue: [1, 9] }],
    ["in a form by its id", { form: "settings", name: "volume" }],
    ["with its value bubble asked for", { showValueTooltip: true }],
  ] as const)("a slider: %s", async (_name, props) => {
    const { react, vue } = await both(slider(props), ["volume"]);
    expect(vue).toBe(react);
  });

  it("formats its readout in words, which the thumb says, and in nodes, which it does not", async () => {
    for (const format of [percent, (n: number) => h("b", null, String(n))]) {
      const { react, vue } = await both(
        slider({ showValue: true, defaultValue: [40] }, format),
      );
      expect(vue).toBe(react);
    }
  });

  it("puts a caller's aria-labelledby and aria-describedby on each thumb, with the error's", async () => {
    const { react, vue } = await both(
      element("div", {}, [
        element("p", { id: "name" }, ["Volume"]),
        element("p", { id: "hint" }, ["Mind the neighbours"]),
        slider({
          "aria-labelledby": "name",
          "aria-describedby": "hint",
          "aria-invalid": true,
          error: "Too loud",
          defaultValue: [1, 9],
          thumbLabels: ["Lowest"],
        }),
      ]),
      ["name", "hint"],
    );
    expect(react).toMatch(/aria-describedby="hint id-\d+"/);
    expect(vue).toBe(react);
  });
});

describe("KozmosSlider, mounted, as React's", () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  const thumbs = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLElement>('[role="slider"]'),
  ];
  const read = (events: KozmosAnalyticsEvent[]) =>
    events.map(({ timestamp: _timestamp, ...event }) => event);
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

  async function mountReact(node: React.ReactNode) {
    const element = host();
    reactRoot = createRoot(element);
    await act(async () => reactRoot!.render(node));
    return element;
  }
  async function mountVue(render: () => ReturnType<typeof h>) {
    const element = host();
    vueApp = createApp({ render });
    vueApp.mount(element);
    await nextTick();
    return element;
  }
  const press = async (key: string, shiftKey = false) => {
    await act(async () => {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          shiftKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await nextTick();
  };

  async function drawBoth(
    props: Record<string, unknown>,
    format?: (value: number) => string,
    inForm = false,
  ) {
    const heard = {
      react: {
        changes: [] as unknown[][],
        commits: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: {
        changes: [] as unknown[][],
        commits: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
    };
    const { value, ...rest } = props;
    const reactPart = React.createElement(KozmosReact.Slider, {
      label: "Volume",
      ...props,
      ...(format ? { formatValue: format } : {}),
      onValueChange: (...args: unknown[]) => heard.react.changes.push(args),
      onValueCommit: (...args: unknown[]) => heard.react.commits.push(args),
    });
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.AnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (events) => heard.react.events.push(...events),
        },
        inForm ? React.createElement("form", null, reactPart) : reactPart,
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosAnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (events: KozmosAnalyticsEvent[]) =>
            heard.vue.events.push(...events),
        },
        () => {
          const part = h(
            KozmosSlider,
            {
              label: "Volume",
              ...rest,
              ...(value !== undefined ? { modelValue: value } : {}),
              "onUpdate:modelValue": (...args: unknown[]) =>
                heard.vue.changes.push(args),
              onValueCommit: (...args: unknown[]) =>
                heard.vue.commits.push(args),
            },
            format
              ? {
                  formatValue: ({ value: n }: { value: number }) => [format(n)],
                }
              : undefined,
          );
          return [inForm ? h("form", null, [part]) : part];
        },
      ),
    );
    return { heard, reactHost, vueHost };
  }

  it("its thumbs find their places once mounted, as React's", async () => {
    const { reactHost, vueHost } = await drawBoth({
      defaultValue: [20, 80],
      showValue: true,
    });
    expect(thumbs(reactHost)[1].getAttribute("aria-valuenow")).toBe("80");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("the keys move the focused thumb and commit; each change and commit is heard, and reported", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      defaultValue: [20, 80],
      showValue: true,
    });
    const keys: [string, boolean?][] = [
      ["ArrowRight"],
      ["ArrowUp", true],
      ["PageDown"],
      ["Home"],
      ["End"],
      ["ArrowLeft"],
    ];
    for (const root of [reactHost, vueHost]) {
      thumbs(root)[0].focus();
      for (const [key, shift] of keys) await press(key, shift);
    }
    await settle();
    expect(heard.react.changes).toEqual([
      [[21, 80]],
      [[31, 80]],
      [[21, 80]],
      [[0, 80]],
      [[0, 100]],
      [[0, 99]],
    ]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(heard.vue.commits).toEqual(heard.react.commits);
    expect(heard.react.commits).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toHaveLength(6);
    expect(read(heard.react.events)[0]).toEqual({
      component: "Slider",
      eventName: "slider_value_changed",
      properties: { value: [21, 80] },
    });
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a key that moves nothing is not heard", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      defaultValue: [0],
    });
    for (const root of [reactHost, vueHost]) {
      thumbs(root)[0].focus();
      await press("ArrowLeft");
      await press("Home");
    }
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
  });

  it("a disabled slider takes no keys", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      defaultValue: [40],
      disabled: true,
    });
    for (const root of [reactHost, vueHost]) {
      thumbs(root)[0].focus();
      await press("ArrowRight");
    }
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a controlled slider waits for its owner, and follows it", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const drawReact = (value: number[]) =>
      React.createElement(KozmosReact.Slider, {
        label: "Volume",
        value,
        showValue: true,
        onValueChange: (...args: unknown[]) => heard.react.push(args),
      });
    const reactHost = await mountReact(drawReact([40]));
    const value = ref([40]);
    const vueHost = await mountVue(() =>
      h(KozmosSlider, {
        label: "Volume",
        modelValue: value.value,
        showValue: true,
        "onUpdate:modelValue": (...args: unknown[]) => heard.vue.push(args),
      }),
    );
    for (const root of [reactHost, vueHost]) {
      thumbs(root)[0].focus();
      await press("ArrowRight");
    }
    expect(heard.react).toEqual([[[41]]]);
    expect(heard.vue).toEqual(heard.react);
    expect(thumbs(reactHost)[0].getAttribute("aria-valuenow")).toBe("40");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act(async () => reactRoot!.render(drawReact([70])));
    value.value = [70];
    await nextTick();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("v-model binds both ways", async () => {
    const value = ref([40]);
    const vueHost = await mountVue(() =>
      h(KozmosSlider, {
        label: "Volume",
        modelValue: value.value,
        "onUpdate:modelValue": (next: number[]) => (value.value = next),
      }),
    );
    thumbs(vueHost)[0].focus();
    await press("ArrowRight");
    expect(value.value).toEqual([41]);
    value.value = [10];
    await nextTick();
    expect(thumbs(vueHost)[0].getAttribute("aria-valuenow")).toBe("10");
  });

  it("shows the value bubble on the focused thumb, in words, and the thumb says them", async () => {
    const { reactHost, vueHost } = await drawBoth(
      { defaultValue: [40], showValueTooltip: true },
      percent,
    );
    expect(reactHost.querySelector('[role="tooltip"]')).toBeNull();
    // One thumb holds focus at a time: each is read while it has it.
    const focused = async (root: HTMLElement) => {
      await act(async () => thumbs(root)[0].focus());
      await nextTick();
      const shown = snapshot(root);
      await press("ArrowRight");
      const moved = snapshot(root);
      await act(async () => thumbs(root)[0].blur());
      await nextTick();
      return { shown, moved, after: snapshot(root) };
    };
    const react = await focused(reactHost);
    const vue = await focused(vueHost);
    expect(react.shown).toContain('"40%"');
    expect(react.shown).toContain('aria-valuetext="40%"');
    expect(react.moved).toContain('"41%"');
    expect(react.after).not.toContain('role="tooltip"');
    expect(vue).toEqual(react);
  });

  it("inside a form, each thumb's input stays and follows it", async () => {
    const { reactHost, vueHost } = await drawBoth(
      { name: "price", defaultValue: [20, 80] },
      undefined,
      true,
    );
    const inputs = (root: HTMLElement) => [
      ...root.querySelectorAll<HTMLInputElement>("input"),
    ];
    const heard = { react: 0, vue: 0 };
    reactHost
      .querySelector("form")!
      .addEventListener("input", () => heard.react++);
    vueHost.querySelector("form")!.addEventListener("input", () => heard.vue++);
    expect(inputs(reactHost).map((input) => input.value)).toEqual(["20", "80"]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    for (const root of [reactHost, vueHost]) {
      thumbs(root)[1].focus();
      await press("ArrowLeft");
    }
    await act(async () => settle());
    expect(inputs(reactHost).map((input) => input.value)).toEqual(["20", "79"]);
    expect(inputs(vueHost).map((input) => input.value)).toEqual(
      inputs(reactHost).map((input) => input.value),
    );
    expect(heard).toEqual({ react: 1, vue: 1 });
  });
});
