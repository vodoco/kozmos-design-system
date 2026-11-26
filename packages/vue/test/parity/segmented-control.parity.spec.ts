// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosSegmentedControl,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * React's SegmentedControl stories draw from the meta's `items`, a module
 * constant the stories reader cannot read: each is drawn here in both from
 * the same args. Then the edges React's tests cover
 * (SegmentedControl.test.tsx, mixed-group.test.tsx): sizes, full width, a
 * label and an aria-label, an error as a flag and as words, a disabled
 * control and a disabled segment, a held value, `null`, an app's class, id
 * and attributes, and the mixed state with its line. Then, mounted: a
 * press chooses and a second takes the choice back as `undefined`,
 * `segmented_control_toggled` is reported only for a choice, the arrows
 * move focus, a held empty choice holds, a focused segment is scrolled into
 * view, and the mixed control's reset.
 */
const items = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const control = (props: Record<string, unknown>): Drawn => {
  const { className, value, ...rest } = props;
  const vueProps: Record<string, unknown> = { items, ...rest };
  if (className !== undefined) vueProps.class = className;
  if (value !== undefined) vueProps.modelValue = value;
  return {
    react: KozmosReact.SegmentedControl,
    vue: KozmosSegmentedControl,
    props: { items, ...props },
    vueProps,
  };
};
const both = (tree: Drawn, keepIds: string[] = []) =>
  renderBoth(inTheme(tree), { keepIds });

describe("KozmosSegmentedControl draws React's SegmentedControl stories", () => {
  it.each([
    ["Default", {}],
    ["FullWidth", { fullWidth: true }],
    [
      "Error",
      { error: "Choose a section before continuing.", value: "details" },
    ],
    ["Disabled", { disabled: true, value: "overview" }],
  ] as const)("%s", async (_name, args) => {
    const { react, vue } = await both(
      control({ defaultValue: "overview", ...args }),
    );
    expect(react).toContain('role="group"');
    expect(vue).toBe(react);
  });
});

describe("KozmosSegmentedControl draws what React's SegmentedControl draws", () => {
  it.each([
    ["nothing chosen", {}],
    ["chosen by default", { defaultValue: "details" }],
    ["held", { value: "activity" }],
    ["held empty, null", { value: null, defaultValue: "details" }],
    ["small", { size: "sm" }],
    ["large", { size: "lg" }],
    ["large, full width", { size: "lg", fullWidth: true }],
    ["labelled", { label: "Section" }],
    ["named by an aria-label", { "aria-label": "Section" }],
    ["in error", { error: true }],
    ["in error, in no words", { error: "" }],
    ["disabled", { disabled: true }],
    ["an app's id", { id: "section" }],
    ["an app's class", { className: "w-full kozmos-parity" }],
    ["an app's wrapper class", { wrapperClassName: "w-auto kozmos-parity" }],
    ["vertical", { orientation: "vertical" }],
    ["right to left", { dir: "rtl" }],
    ["without roving focus", { rovingFocus: false, defaultValue: "details" }],
    ["mixed", { mixed: true, defaultValue: "details", label: "Section" }],
    ["mixed, held", { mixed: true, value: "details" }],
    ["mixed, in error", { mixed: true, error: "Choose one" }],
    ["not mixed", { mixed: false, defaultValue: "details" }],
  ] as const)("a control: %s", async (_name, props) => {
    const { react, vue } = await both(control(props), ["section"]);
    expect(vue).toBe(react);
  });

  it.each([
    [
      "a disabled segment",
      [
        { value: "walk", label: "Walk" },
        { value: "drive", label: "Drive", disabled: true },
      ],
    ],
    [
      "every segment disabled, which keeps a Tab stop",
      [
        { value: "walk", label: "Walk", disabled: true },
        { value: "drive", label: "Drive", disabled: true },
      ],
    ],
  ] as const)("%s", async (_name, own) => {
    const { react, vue } = await both({
      ...control({ defaultValue: "walk" }),
      props: { items: own, defaultValue: "walk" },
      vueProps: { items: own, defaultValue: "walk" },
    });
    expect(vue).toBe(react);
  });

  it("joins the caller's aria-describedby, the mixed words and the error, in that order", async () => {
    const { react, vue } = await both(
      element("div", {}, [
        element("p", { id: "hint" }, ["Read them first"]),
        control({
          mixed: true,
          error: "Required",
          "aria-describedby": "hint",
        }),
      ]),
      ["hint"],
    );
    expect(react).toMatch(/aria-describedby="hint id-\d+ id-\d+"/);
    expect(vue).toBe(react);
  });
});

describe("KozmosSegmentedControl, mounted, as React's", () => {
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
  const segments = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
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
  const act2 = async (fn: () => void) => {
    await act(async () => fn());
    await nextTick();
  };

  async function drawBoth(props: Record<string, unknown>) {
    const heard = {
      react: {
        changes: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: { changes: [] as unknown[][], events: [] as KozmosAnalyticsEvent[] },
    };
    const { value, ...rest } = props;
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.AnalyticsProvider,
        {
          batchDelayMs: 0,
          onDispatch: (events) => heard.react.events.push(...events),
        },
        React.createElement(KozmosReact.SegmentedControl, {
          label: "Section",
          items,
          ...props,
          onValueChange: (...args: unknown[]) => heard.react.changes.push(args),
        }),
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
        () => [
          h(KozmosSegmentedControl, {
            label: "Section",
            items,
            ...rest,
            ...(value !== undefined ? { modelValue: value } : {}),
            "onUpdate:modelValue": (...args: unknown[]) =>
              heard.vue.changes.push(args),
          }),
        ],
      ),
    );
    return { heard, reactHost, vueHost };
  }

  it("draws what React's draws once mounted: the group a Tab stop", async () => {
    const { reactHost, vueHost } = await drawBoth({ defaultValue: "details" });
    expect(
      reactHost.querySelector('[role="group"]')!.getAttribute("tabindex"),
    ).toBe("0");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a press chooses and is reported; a second takes it back as undefined, unreported", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    for (const index of [1, 1, 2]) {
      await act2(() => segments(reactHost)[index].click());
      await act2(() => segments(vueHost)[index].click());
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    }
    await settle();
    expect(heard.react.changes).toEqual([
      ["details"],
      [undefined],
      ["activity"],
    ]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toEqual([
      {
        component: "SegmentedControl",
        eventName: "segmented_control_toggled",
        properties: { value: "details" },
      },
      {
        component: "SegmentedControl",
        eventName: "segmented_control_toggled",
        properties: { value: "activity" },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
  });

  it("held empty with null, it holds whatever is pressed, until its owner changes it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({ value: null });
    await act2(() => segments(reactHost)[0].click());
    await act2(() => segments(vueHost)[0].click());
    expect(heard.react.changes).toEqual([["overview"]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(
      segments(reactHost).some(
        (segment) => segment.getAttribute("aria-checked") === "true",
      ),
    ).toBe(false);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("v-model binds both ways, and an undefined model leaves the choice to the control", async () => {
    const value = ref<string | undefined>(undefined);
    const vueHost = await mountVue(() =>
      h(KozmosSegmentedControl, {
        label: "Section",
        items,
        defaultValue: "overview",
        modelValue: value.value,
        "onUpdate:modelValue": (next: string | undefined) =>
          (value.value = next),
      }),
    );
    const checked = () =>
      segments(vueHost).map((segment) => segment.getAttribute("aria-checked"));
    expect(checked()).toEqual(["true", "false", "false"]);
    await act2(() => segments(vueHost)[2].click());
    expect(value.value).toBe("activity");
    expect(checked()).toEqual(["false", "false", "true"]);
    value.value = "details";
    await nextTick();
    expect(checked()).toEqual(["false", "true", "false"]);
  });

  it("the arrows move focus along the segments and go round, as Radix's", async () => {
    const { reactHost, vueHost } = await drawBoth({ defaultValue: "overview" });
    const walk = async (root: HTMLElement) => {
      segments(root)[0].focus();
      const seen: number[] = [];
      for (const key of ["ArrowRight", "ArrowRight", "ArrowRight", "End"]) {
        await act(async () => {
          document.activeElement!.dispatchEvent(
            new KeyboardEvent("keydown", {
              key,
              bubbles: true,
              cancelable: true,
            }),
          );
          await settle();
        });
        await nextTick();
        seen.push(
          segments(root).indexOf(document.activeElement as HTMLButtonElement),
        );
      }
      return seen;
    };
    const reactWalk = await walk(reactHost);
    expect(reactWalk).toEqual([1, 2, 0, 2]);
    expect(await walk(vueHost)).toEqual(reactWalk);
  });

  it("a focused segment is scrolled into view, nearest, as React's", async () => {
    const scrolled: unknown[] = [];
    // jsdom has no scrollIntoView of its own: a stand-in that hears it.
    const prototype = HTMLElement.prototype as {
      scrollIntoView?: (options?: unknown) => void;
    };
    prototype.scrollIntoView = vi.fn((options?: unknown) =>
      scrolled.push(options),
    );
    const { reactHost, vueHost } = await drawBoth({});
    await act2(() => segments(reactHost)[1].focus());
    await act2(() => segments(vueHost)[1].focus());
    expect(scrolled).toEqual([
      { block: "nearest", inline: "nearest" },
      { block: "nearest", inline: "nearest" },
    ]);
    delete prototype.scrollIntoView;
  });

  it("a mixed control chooses nothing; a choice ends it, and the reset brings it back with focus on a segment", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    const reactEdit = { current: undefined as string | undefined };
    const drawReact = (): React.ReactElement =>
      React.createElement(KozmosReact.SegmentedControl, {
        label: "Section",
        items,
        mixed: reactEdit.current === undefined,
        value: reactEdit.current ?? "overview",
        onValueChange: (next: string | undefined) => {
          heard.react.push(next);
          reactEdit.current = next;
          reactRoot!.render(drawReact());
        },
        onResetMixed: () => {
          heard.react.push("reset");
          reactEdit.current = undefined;
          reactRoot!.render(drawReact());
        },
      });
    const reactHost = await mountReact(drawReact());
    const edit = ref<string | undefined>(undefined);
    const vueHost = await mountVue(() =>
      h(KozmosSegmentedControl, {
        label: "Section",
        items,
        mixed: edit.value === undefined,
        modelValue: edit.value ?? "overview",
        "onUpdate:modelValue": (next: string | undefined) => {
          heard.vue.push(next);
          edit.value = next;
        },
        onResetMixed: () => {
          heard.vue.push("reset");
          edit.value = undefined;
        },
      }),
    );
    const reset = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]');
    expect(reactHost.querySelector('[data-slot="mixed-label"]')).not.toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => segments(reactHost)[2].click());
    await act2(() => segments(vueHost)[2].click());
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => reset(reactHost)!.click());
    const reactFocus = segments(reactHost).indexOf(
      document.activeElement as HTMLButtonElement,
    );
    await act2(() => reset(vueHost)!.click());
    const vueFocus = segments(vueHost).indexOf(
      document.activeElement as HTMLButtonElement,
    );
    expect(reactFocus).toBeGreaterThanOrEqual(0);
    expect(vueFocus).toBe(reactFocus);
    expect(heard.react).toEqual(["activity", "reset"]);
    expect(heard.vue).toEqual(heard.react);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("never offers the reset while disabled", async () => {
    const reactHost = await mountReact(
      React.createElement(KozmosReact.SegmentedControl, {
        items,
        mixed: false,
        disabled: true,
        onResetMixed: () => {},
      }),
    );
    const vueHost = await mountVue(() =>
      h(KozmosSegmentedControl, {
        items,
        mixed: false,
        disabled: true,
        onResetMixed: () => {},
      }),
    );
    expect(reactHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });
});
