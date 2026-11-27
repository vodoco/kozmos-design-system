// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import * as ReactIcons from "@kozmos-ds/icons";
import * as VueIcons from "@kozmos-ds/icons/vue";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosBox,
  KozmosGrid,
  KozmosIcon,
  KozmosRadioGroup,
  KozmosRadioGroupItem,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import {
  renderBoth,
  toReact as toReactNode,
  toVue as toVueNode,
  type Drawn,
} from "./render";
import { element } from "./slotted";

/**
 * React's RadioGroup stories are each their own render of a group and its
 * items, drawn here in both from the same tree; then the edges React's
 * tests cover (Radio.test.tsx, Radio.cards.test.tsx, mixed-group.test.tsx):
 * a label, an error on the group and on an item, descriptions, cards and
 * tiles with and without titles, a disabled item, a caller's
 * aria-describedby, an app's class, id and role, an orientation, the
 * form's hidden inputs, and the mixed state with its line. Then, mounted,
 * what a server render cannot show: a press chooses, v-model hears what
 * onValueChange hears, `radio_selection_changed` is reported, the group is
 * one Tab stop that sends focus to the chosen option, the arrows move and
 * choose (and pass a disabled option), Enter does not choose, a controlled
 * group waits for its owner, a mixed group drops its choice and the reset
 * brings it back with focus on an option, and an untitled card warns once.
 */
const inTheme = (...children: (Drawn | string)[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
/** A part in both: React's props, and Vue's spelling of them. */
const part = (
  react: React.ElementType,
  vue: Drawn["vue"],
  props: Record<string, unknown>,
  children: (Drawn | string)[] = [],
): Drawn => {
  const { className, tabIndex, value, ...rest } = props;
  const vueProps: Record<string, unknown> = { ...rest };
  if (className !== undefined) vueProps.class = className;
  if (tabIndex !== undefined) vueProps.tabindex = tabIndex;
  // A group's `value` is its v-model; an item's is its own.
  if (value !== undefined)
    vueProps[vue === KozmosRadioGroup ? "modelValue" : "value"] = value;
  return { react, vue, props, vueProps, children };
};
const group = (props: Record<string, unknown>, items: (Drawn | string)[]) =>
  part(KozmosReact.RadioGroup, KozmosRadioGroup, props, items);
const item = (props: Record<string, unknown>) =>
  part(KozmosReact.RadioGroupItem, KozmosRadioGroupItem, props);
/** An item with nodes for its media: React's `media`, Vue's `#media` slot. */
const boxed = (props: Record<string, unknown>, media: Drawn): Drawn => ({
  react: (reactProps: Record<string, unknown>) =>
    React.createElement(KozmosReact.RadioGroupItem, {
      ...props,
      ...reactProps,
      media: toReactNode(media),
    }),
  vue: {
    setup:
      (_: unknown, { attrs }: { attrs: Record<string, unknown> }) =>
      () =>
        h(KozmosRadioGroupItem, { ...props, ...attrs } as never, {
          media: () => [toVueNode(media)],
        }),
  } as Drawn["vue"],
});
/** A Kozmos icon in both: React's glyph and Vue's, by name. */
const icon = (name: keyof typeof ReactIcons, props: Record<string, unknown>) =>
  ({
    react: KozmosReact.Icon,
    vue: KozmosIcon,
    props: { icon: ReactIcons[name], ...props },
    vueProps: {
      icon: (VueIcons as Record<string, unknown>)[name],
      ...props,
    },
  }) as Drawn;
const box = (className: string, children: Drawn[]) =>
  part(KozmosReact.Box, KozmosBox, { className }, children);
const grid = (props: Record<string, unknown>, children: Drawn[]) =>
  part(KozmosReact.Grid, KozmosGrid, props, children);

const both = (tree: Drawn, keepIds: string[] = []) =>
  renderBoth(inTheme(tree), { keepIds });

const transitions = [
  ["fade", "Fade", "Contrast01"],
  ["slide", "Slide", "ArrowNarrowRight"],
  ["move", "Move", "Move"],
  ["zoom-in", "Zoom in", "ZoomIn"],
  ["zoom-out", "Zoom out", "ZoomOut"],
  ["grow", "Grow", "Expand01"],
  ["shrink", "Shrink", "Minimize01"],
  ["follow", "Follow route", "Route"],
  ["sparkle", "Sparkle", "Stars02"],
] as const;

describe("KozmosRadioGroup draws React's RadioGroup stories", () => {
  it("Default", async () => {
    const { react, vue } = await both(
      group({ defaultValue: "option-one" }, [
        item({ value: "option-one", id: "option-one", label: "Option One" }),
        item({ value: "option-two", id: "option-two", label: "Option Two" }),
      ]),
      ["option-one", "option-two"],
    );
    expect(react).toContain('role="radiogroup"');
    expect(vue).toBe(react);
  });

  it("Disabled", async () => {
    const { react, vue } = await both(
      group({ defaultValue: "option-one", disabled: true }, [
        item({
          value: "option-one",
          id: "option-disabled-one",
          label: "Option One",
        }),
        item({
          value: "option-two",
          id: "option-disabled-two",
          label: "Option Two",
        }),
      ]),
      ["option-disabled-one", "option-disabled-two"],
    );
    expect(vue).toBe(react);
  });

  it("Error", async () => {
    const { react, vue } = await both(
      group({ defaultValue: "option-one", error: "Selection required" }, [
        item({
          value: "option-one",
          id: "option-error-one",
          label: "Option One",
          error: true,
        }),
        item({
          value: "option-two",
          id: "option-error-two",
          label: "Option Two",
          error: true,
        }),
      ]),
      ["option-error-one", "option-error-two"],
    );
    expect(vue).toBe(react);
  });

  it("WithDescription", async () => {
    const { react, vue } = await both(
      group({ "aria-label": "Levels shown", defaultValue: "all" }, [
        item({
          value: "all",
          label: "All levels",
          description: "Every level of the building, stacked",
        }),
        item({
          value: "current",
          label: "Current level",
          description: "Only the level you are on",
        }),
      ]),
    );
    expect(vue).toBe(react);
  });

  it("Cards", async () => {
    const card = (
      value: string,
      label: string,
      description: string,
      media: Drawn,
    ) => boxed({ value, variant: "card", label, description }, media);
    const { react, vue } = await both(
      element("div", { className: "flex flex-col gap-6" }, [
        group({ "aria-label": "Map style", defaultValue: "vector" }, [
          grid({ cols: 2, gap: 2 }, [
            card(
              "vector",
              "Vector",
              "Drawn from the building's plans",
              box("flex h-20 w-full items-center justify-center bg-muted", [
                icon("Map01", { size: "xl", color: "muted" }),
              ]),
            ),
            card(
              "satellite",
              "Satellite",
              "Aerial imagery under the plans",
              box("flex h-20 w-full items-center justify-center bg-muted", [
                icon("Globe01", { size: "xl", color: "muted" }),
              ]),
            ),
          ]),
        ]),
        group({ "aria-label": "Geometry", defaultValue: "auto" }, [
          grid({ cols: 2, gap: 2 }, [
            card(
              "auto",
              "Auto-generate",
              "Kozmos traces the outline from the floor plan",
              icon("MagicWand02", { size: "lg", color: "primary" }),
            ),
            card(
              "manual",
              "Draw manually",
              "Draw the outline point by point",
              icon("Edit05", { size: "lg", color: "primary" }),
            ),
          ]),
        ]),
      ]),
    );
    expect(react).toContain('data-variant="card"');
    expect(vue).toBe(react);
  });

  it("Tiles", async () => {
    const { react, vue } = await both(
      group({ "aria-label": "Transition", defaultValue: "slide" }, [
        grid(
          { cols: 3, gap: 2 },
          transitions.map(([value, label, glyph]) =>
            boxed(
              { value, variant: "tile", label },
              icon(glyph, { size: "lg" }),
            ),
          ),
        ),
      ]),
    );
    expect(react).toContain('data-slot="check"');
    expect(vue).toBe(react);
  });
});

const levels = (props: Record<string, unknown> = {}) => [
  item({ value: "1", label: "Level 1", ...props }),
  item({ value: "2", label: "Level 2" }),
];

describe("KozmosRadioGroup draws what React's RadioGroup draws", () => {
  it.each([
    ["nothing chosen", {}],
    ["chosen by default", { defaultValue: "2" }],
    ["held", { value: "1" }],
    ["held, with nothing chosen", { value: "" }],
    ["labelled", { label: "Level", defaultValue: "1" }],
    ["in error", { error: true }],
    ["in error, in words", { error: "Choose a level" }],
    ["in error, in no words", { error: "" }],
    ["disabled", { disabled: true, defaultValue: "1" }],
    ["required", { required: true }],
    ["named for a form", { name: "level", defaultValue: "1" }],
    ["vertical", { orientation: "vertical" }],
    ["right to left", { dir: "rtl", defaultValue: "1" }],
    ["an app's class", { className: "gap-4 kozmos-parity" }],
    ["an app's wrapper class", { wrapperClassName: "w-auto kozmos-parity" }],
    ["an app's role", { role: "group" }],
    ["mixed", { mixed: true, defaultValue: "1", label: "Level" }],
    ["mixed, held", { mixed: true, value: "1" }],
    ["mixed, in words of its own", { mixed: true, mixedLabel: "Several" }],
    ["mixed, in error", { mixed: true, error: "Choose one" }],
    ["not mixed", { mixed: false, defaultValue: "2" }],
  ] as const)("a group: %s", async (_name, props) => {
    const { react, vue } = await both(group(props, levels()));
    expect(vue).toBe(react);
  });

  it.each([
    ["in error", { error: true }],
    ["described", { description: "Every level, stacked" }],
    ["described, in error", { description: "Every level", error: true }],
    ["disabled on its own", { disabled: true }],
    ["checked on its own", { checked: true }],
    ["required on its own", { required: true }],
    ["an app's class over the recipe's", { className: "h-6 kozmos-parity" }],
    ["an app's role", { role: "menuitemradio" }],
    ["an app's tabindex", { tabIndex: 0 }],
    ["with no label", { label: undefined, "aria-label": "Level 1" }],
    ["a card", { variant: "card", description: "Every level" }],
    ["a card in error", { variant: "card", error: true }],
    ["a tile", { variant: "tile", description: "Every level" }],
    ["a tile in error", { variant: "tile", error: true }],
    ["an untitled tile", { variant: "tile", label: undefined }],
    [
      "a card with a caller's description",
      {
        variant: "card",
        description: "Every level",
        "aria-describedby": "hint",
      },
    ],
  ] as const)("an item: %s", async (_name, props) => {
    const { react, vue } = await both(
      group({ defaultValue: "1" }, levels(props)),
      ["hint"],
    );
    expect(vue).toBe(react);
  });

  it("takes the item's id, and its label is for it", async () => {
    const { react, vue } = await both(
      group({ defaultValue: "1" }, levels({ id: "level-one" })),
      ["level-one", "level-one-title", "level-one-description"],
    );
    expect(react).toContain('for="level-one"');
    expect(vue).toBe(react);
  });

  it("joins the caller's aria-describedby, the mixed words and the error, in that order", async () => {
    const { react, vue } = await both(
      element("div", {}, [
        element("p", { id: "hint" }, ["Read them first"]),
        group(
          { mixed: true, error: "Required", "aria-describedby": "hint" },
          levels(),
        ),
      ]),
      ["hint"],
    );
    expect(react).toMatch(/aria-describedby="hint id-\d+ id-\d+"/);
    expect(vue).toBe(react);
  });
});

describe("KozmosRadioGroup, mounted, as React's", () => {
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
    vi.restoreAllMocks();
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  const radios = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ];
  const radiogroup = (root: HTMLElement) =>
    root.querySelector<HTMLElement>('[role="radiogroup"]')!;
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
  const options = [
    { value: "1", label: "Level 1" },
    { value: "2", label: "Level 2", disabled: true },
    { value: "3", label: "Level 3" },
  ];
  const reactItems = () =>
    options.map((option) =>
      React.createElement(KozmosReact.RadioGroupItem, {
        key: option.value,
        ...option,
      }),
    );
  const vueItems = () =>
    options.map((option) =>
      h(KozmosRadioGroupItem, { key: option.value, ...option }),
    );

  /** Both, uncontrolled, in an analytics provider, with what each heard. */
  async function drawBoth(props: Record<string, unknown>, inForm = false) {
    const heard = {
      react: {
        changes: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: { changes: [] as unknown[][], events: [] as KozmosAnalyticsEvent[] },
    };
    const reactPart = React.createElement(
      KozmosReact.RadioGroup,
      {
        "aria-label": "Level",
        ...props,
        onValueChange: (...args: unknown[]) => heard.react.changes.push(args),
      },
      reactItems(),
    );
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
            KozmosRadioGroup,
            {
              "aria-label": "Level",
              ...props,
              "onUpdate:modelValue": (...args: unknown[]) =>
                heard.vue.changes.push(args),
            },
            () => vueItems(),
          );
          return [inForm ? h("form", null, [part]) : part];
        },
      ),
    );
    return { heard, reactHost, vueHost };
  }

  it("draws what React's draws once mounted: the group a Tab stop, its hidden inputs gone", async () => {
    const { reactHost, vueHost } = await drawBoth({ defaultValue: "1" });
    expect(radiogroup(reactHost).getAttribute("tabindex")).toBe("0");
    expect(reactHost.innerHTML).not.toContain("<input");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a press chooses, v-model hears what onValueChange hears, and it is reported", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    for (const index of [0, 0, 2]) {
      await act2(() => radios(reactHost)[index].click());
      await act2(() => radios(vueHost)[index].click());
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    }
    await settle();
    // Choosing what is chosen says nothing.
    expect(heard.react.changes).toEqual([["1"], ["3"]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toEqual([
      {
        component: "RadioGroup",
        eventName: "radio_selection_changed",
        properties: { value: "1" },
      },
      {
        component: "RadioGroup",
        eventName: "radio_selection_changed",
        properties: { value: "3" },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
  });

  it("a press of an option's label chooses it; a disabled option is not chosen", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    const labels = (root: HTMLElement) => [...root.querySelectorAll("label")];
    await act2(() => labels(reactHost)[2].click());
    await act2(() => labels(vueHost)[2].click());
    await act2(() => radios(reactHost)[1].click());
    await act2(() => radios(vueHost)[1].click());
    expect(heard.react.changes).toEqual([["3"]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
  });

  it("is one Tab stop: focus on the group goes to the chosen option, else the first usable one", async () => {
    for (const defaultValue of ["3", undefined]) {
      const { reactHost, vueHost } = await drawBoth({ defaultValue });
      await act2(() => radiogroup(reactHost).focus());
      const reactFocus = radios(reactHost).indexOf(
        document.activeElement as HTMLButtonElement,
      );
      await act2(() => radiogroup(vueHost).focus());
      const vueFocus = radios(vueHost).indexOf(
        document.activeElement as HTMLButtonElement,
      );
      expect(reactFocus).toBe(defaultValue ? 2 : 0);
      expect(vueFocus).toBe(reactFocus);
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
      act(() => reactRoot!.unmount());
      vueApp!.unmount();
      reactRoot = undefined;
      vueApp = undefined;
      document.body.replaceChildren();
    }
  });

  it("the arrows move focus and choose, passing a disabled option and going round; Enter is prevented and chooses nothing", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({ defaultValue: "1" });
    const press = async (root: HTMLElement, key: string) => {
      const target = document.activeElement as HTMLElement;
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        target.dispatchEvent(event);
      });
      // Radix moves focus a task later.
      await act(async () => {
        await settle();
      });
      await act(async () => {
        target.dispatchEvent(
          new KeyboardEvent("keyup", { key, bubbles: true }),
        );
      });
      await nextTick();
      return {
        prevented: event.defaultPrevented,
        at: radios(root).indexOf(document.activeElement as HTMLButtonElement),
      };
    };
    const walk = async (root: HTMLElement) => {
      radios(root)[0].focus();
      const seen = [];
      for (const key of ["ArrowDown", "ArrowRight", "ArrowUp", "Enter"])
        seen.push(await press(root, key));
      return seen;
    };
    const reactWalk = await walk(reactHost);
    const vueWalk = await walk(vueHost);
    expect(reactWalk).toEqual([
      { prevented: true, at: 2 },
      { prevented: true, at: 0 },
      { prevented: true, at: 2 },
      { prevented: true, at: 2 },
    ]);
    expect(vueWalk).toEqual(reactWalk);
    expect(heard.react.changes).toEqual([["3"], ["1"], ["3"]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a controlled group waits for its owner, and follows it", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const drawReact = (value: string) =>
      React.createElement(
        KozmosReact.RadioGroup,
        {
          "aria-label": "Level",
          value,
          onValueChange: (...args: unknown[]) => heard.react.push(args),
        },
        reactItems(),
      );
    const reactHost = await mountReact(drawReact("1"));
    const value = ref("1");
    const vueHost = await mountVue(() =>
      h(
        KozmosRadioGroup,
        {
          "aria-label": "Level",
          modelValue: value.value,
          "onUpdate:modelValue": (...args: unknown[]) => heard.vue.push(args),
        },
        () => vueItems(),
      ),
    );
    await act2(() => radios(reactHost)[2].click());
    await act2(() => radios(vueHost)[2].click());
    expect(heard.react).toEqual([["3"]]);
    expect(heard.vue).toEqual(heard.react);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act(async () => reactRoot!.render(drawReact("3")));
    value.value = "3";
    await nextTick();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("v-model binds both ways", async () => {
    const value = ref("1");
    const vueHost = await mountVue(() =>
      h(
        KozmosRadioGroup,
        {
          "aria-label": "Level",
          modelValue: value.value,
          "onUpdate:modelValue": (next: string) => (value.value = next),
        },
        () => vueItems(),
      ),
    );
    await act2(() => radios(vueHost)[2].click());
    expect(value.value).toBe("3");
    value.value = "1";
    await nextTick();
    expect(radios(vueHost)[0].getAttribute("aria-checked")).toBe("true");
  });

  it("a mixed group chooses nothing; a choice ends it, and the reset brings it back with focus on an option", async () => {
    const heard = { react: [] as unknown[], vue: [] as unknown[] };
    const reactEdit = { current: undefined as string | undefined };
    const drawReact = (): React.ReactElement =>
      React.createElement(
        KozmosReact.RadioGroup,
        {
          label: "Opening",
          mixed: reactEdit.current === undefined,
          value: reactEdit.current ?? "1",
          onValueChange: (next: string) => {
            heard.react.push(next);
            reactEdit.current = next;
            reactRoot!.render(drawReact());
          },
          onResetMixed: () => {
            heard.react.push("reset");
            reactEdit.current = undefined;
            reactRoot!.render(drawReact());
          },
        },
        reactItems(),
      );
    const reactHost = await mountReact(drawReact());
    const edit = ref<string | undefined>(undefined);
    const vueHost = await mountVue(() =>
      h(
        KozmosRadioGroup,
        {
          label: "Opening",
          mixed: edit.value === undefined,
          modelValue: edit.value ?? "1",
          "onUpdate:modelValue": (next: string) => {
            heard.vue.push(next);
            edit.value = next;
          },
          onResetMixed: () => {
            heard.vue.push("reset");
            edit.value = undefined;
          },
        },
        () => vueItems(),
      ),
    );
    const reset = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]');
    expect(
      radios(reactHost).some((r) => r.getAttribute("aria-checked") === "true"),
    ).toBe(false);
    expect(reactHost.querySelector('[data-slot="mixed-label"]')).not.toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => radios(reactHost)[2].click());
    await act2(() => radios(vueHost)[2].click());
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => reset(reactHost)!.click());
    const reactFocus = radios(reactHost).indexOf(
      document.activeElement as HTMLButtonElement,
    );
    await act2(() => reset(vueHost)!.click());
    const vueFocus = radios(vueHost).indexOf(
      document.activeElement as HTMLButtonElement,
    );
    // An option of the group, the one holding its Tab stop, else the first.
    expect(reactFocus).toBeGreaterThanOrEqual(0);
    expect(vueFocus).toBe(reactFocus);
    expect(heard.react).toEqual(["3", "reset"]);
    expect(heard.vue).toEqual(heard.react);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("uncontrolled and mixed, it drops its default, shows the visitor's choice once it is not, and drops it again on the reset", async () => {
    const reactState = { mixed: true };
    const drawReact = (): React.ReactElement =>
      React.createElement(
        KozmosReact.RadioGroup,
        {
          "aria-label": "Level",
          mixed: reactState.mixed,
          defaultValue: "1",
          onValueChange: () => {
            reactState.mixed = false;
            reactRoot!.render(drawReact());
          },
          onResetMixed: () => {
            reactState.mixed = true;
            reactRoot!.render(drawReact());
          },
        },
        reactItems(),
      );
    const reactHost = await mountReact(drawReact());
    const mixed = ref(true);
    const vueHost = await mountVue(() =>
      h(
        KozmosRadioGroup,
        {
          "aria-label": "Level",
          mixed: mixed.value,
          defaultValue: "1",
          "onUpdate:modelValue": () => (mixed.value = false),
          onResetMixed: () => (mixed.value = true),
        },
        () => vueItems(),
      ),
    );
    const checked = (root: HTMLElement) =>
      radios(root).map((radio) => radio.getAttribute("aria-checked"));
    expect(checked(reactHost)).toEqual(["false", "false", "false"]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => radios(reactHost)[2].click());
    await act2(() => radios(vueHost)[2].click());
    expect(checked(reactHost)).toEqual(["false", "false", "true"]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    const reset = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]')!;
    await act2(() => reset(reactHost).click());
    await act2(() => reset(vueHost).click());
    // The choice held before it turned mixed again is dropped.
    expect(checked(reactHost)).toEqual(["false", "false", "false"]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("mixed, a choice its owner does not answer is dropped, as React's", async () => {
    const drawReact = (mixed: boolean) =>
      React.createElement(
        KozmosReact.RadioGroup,
        { "aria-label": "Level", mixed },
        reactItems(),
      );
    const reactHost = await mountReact(drawReact(true));
    const mixed = ref(true);
    const vueHost = await mountVue(() =>
      h(KozmosRadioGroup, { "aria-label": "Level", mixed: mixed.value }, () =>
        vueItems(),
      ),
    );
    await act2(() => radios(reactHost)[2].click());
    await act2(() => radios(vueHost)[2].click());
    await act(async () => reactRoot!.render(drawReact(false)));
    mixed.value = false;
    await nextTick();
    expect(
      radios(reactHost).map((radio) => radio.getAttribute("aria-checked")),
    ).toEqual(["false", "false", "false"]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("never offers the reset while disabled", async () => {
    const reactHost = await mountReact(
      React.createElement(
        KozmosReact.RadioGroup,
        {
          "aria-label": "Level",
          mixed: false,
          disabled: true,
          onResetMixed: () => {},
        },
        reactItems(),
      ),
    );
    const vueHost = await mountVue(() =>
      h(
        KozmosRadioGroup,
        {
          "aria-label": "Level",
          mixed: false,
          disabled: true,
          onResetMixed: () => {},
        },
        () => vueItems(),
      ),
    );
    expect(reactHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("inside a form, each option's hidden input stays and follows it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth(
      { name: "level", defaultValue: "1" },
      true,
    );
    const inputs = (root: HTMLElement) => [
      ...root.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    ];
    expect(inputs(reactHost)).toHaveLength(3);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => radios(reactHost)[2].click());
    await act2(() => radios(vueHost)[2].click());
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(inputs(reactHost).map((input) => input.checked)).toEqual([
      false,
      false,
      true,
    ]);
    expect(inputs(vueHost).map((input) => input.checked)).toEqual(
      inputs(reactHost).map((input) => input.checked),
    );
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("an untitled card says so once in development, as React's", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await mountVue(() =>
      h(KozmosRadioGroup, { "aria-label": "Style" }, () => [
        h(KozmosRadioGroupItem, { value: "a", variant: "card" }),
        h(KozmosRadioGroupItem, { value: "b", variant: "tile" }),
        h(KozmosRadioGroupItem, {
          value: "c",
          variant: "tile",
          "aria-label": "Named",
        }),
      ]),
    );
    expect(warn.mock.calls).toEqual([
      [
        "RadioGroupItem: a card has no label and no aria-label, so nothing names it to a screen reader; its description is never its name. Pass label, or aria-label for an icon-only tile.",
      ],
    ]);
  });
});
