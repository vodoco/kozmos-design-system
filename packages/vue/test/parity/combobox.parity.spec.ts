// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosCombobox,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * Combobox, drawn in both: React's stories (their options are named
 * constants, so the stories check cannot read them), closed as a server
 * renders them, and the edges React's tests cover (Combobox.test.tsx, its
 * layers and status tests): a chosen value and its clear, disabled and
 * read-only, required, helper text and each status, an app's class, id and
 * name, the inline popup, a mixed field.
 *
 * Then, mounted, each alone in the document: focus opens the list in the
 * theme's portal, placed as Radix's popper places it (`alike` makes Radix's
 * geometry one); typing filters it and makes the first match active; the
 * arrows skip what cannot be chosen, Home and End; Enter chooses, Escape
 * and a press outside close it; the clear; commands after the options,
 * never run by Enter on text that matches nothing; the empty text said by
 * the field's status; a mixed field's query, choice and reset; a value the
 * app sets and a rename while the visitor's text is kept (GAP-232); and
 * v-model, v-model:input-value and analytics hearing what React's do.
 */
const options = [
  {
    value: "overview",
    label: "Overview",
    description: "Summary and key signals",
  },
  {
    value: "details",
    label: "Details",
    description: "Full record information",
  },
  {
    value: "activity",
    label: "Activity",
    description: "Recent changes and updates",
  },
];
const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
  { value: "standing-desk", label: "Standing Desk", group: "Interior Asset" },
  { value: "meeting-room", label: "Meeting Room", group: "POI" },
];
const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana", disabled: true },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

type Props = Record<string, unknown>;
/** React's props as Vue writes them: `className` is `class`, `value` the model. */
const asVue = ({ className, value, readOnly, ...rest }: Props) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
  ...(value === undefined ? {} : { modelValue: value }),
  ...(readOnly === undefined ? {} : { readonly: readOnly }),
});
const combobox = (props: Props): Drawn => ({
  react: KozmosReact.Combobox,
  vue: KozmosCombobox,
  props,
  vueProps: asVue(props),
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const w80 = (...children: Drawn[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className: "w-80" },
  vueProps: { class: "w-80" },
  children,
});
const both = (props: Props) => renderBoth(inTheme(w80(combobox(props))));

describe("KozmosCombobox draws what React's Combobox draws, closed", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both({ label: "View", options });
    expect(react).toContain('role="combobox"');
    expect(vue).toBe(react);
  });

  it("WithValidation: draws what React's story draws", async () => {
    const { react, vue } = await both({
      label: "Project",
      options,
      error: "Choose a project before continuing.",
    });
    expect(react).toContain('aria-invalid="true"');
    expect(vue).toBe(react);
  });

  it("Grouped: draws what React's story draws", async () => {
    const { react, vue } = await both({
      label: "Content type",
      options: contentTypes,
      defaultInputValue: "desk",
    });
    expect(react).toContain('value="desk"');
    expect(vue).toBe(react);
  });

  it("MixedValue: draws what React's story draws", async () => {
    const field = (label: string, edited?: string) =>
      combobox({
        label,
        options: contentTypes,
        mixed: edited === undefined,
        value: edited ?? "",
        onValueChange: () => {},
        onResetMixed: () => {},
      });
    const tree = (...children: Drawn[]): Drawn => ({
      react: "div",
      vue: "div",
      props: { className: "grid w-80 gap-4" },
      vueProps: { class: "grid w-80 gap-4" },
      children,
    });
    const { react, vue } = await renderBoth(
      inTheme(
        tree(
          {
            ...field("Content type"),
            vueProps: {
              ...asVue(field("Content type").props!),
              "onUpdate:modelValue": () => {},
            },
          },
          {
            ...field("Replaced by", "meeting-room"),
            vueProps: {
              ...asVue(field("Replaced by", "meeting-room").props!),
              "onUpdate:modelValue": () => {},
            },
          },
        ),
      ),
    );
    expect(react).toContain('placeholder="Multiple values"');
    expect(react).toContain("Reset to multiple values");
    expect(vue).toBe(react);
  });

  it.each([
    ["a chosen value, with its clear", { value: "cherry" }],
    ["a default value", { defaultValue: "date" }],
    ["not clearable", { value: "cherry", clearable: false }],
    ["disabled", { value: "cherry", disabled: true }],
    ["read-only", { value: "cherry", readOnly: true }],
    ["required", { required: true }],
    ["helper text", { helperText: "Pick a fruit" }],
    ["a warning", { status: "warning", helperText: "Seasonal" }],
    ["a success", { status: "success" }],
    ["a boolean error", { error: true }],
    ["the error is the empty text", { error: "No results found" }],
    [
      "its own words",
      {
        clearLabel: "Clear",
        openLabel: "Open",
        closeLabel: "Close",
        placeholder: "Find a fruit",
        value: "apple",
      },
    ],
    [
      "an app's class, id, name and description",
      {
        className: "px-4",
        id: "fruit",
        name: "fruit",
        "aria-describedby": "fruit-note",
        wrapperClassName: "kozmos-parity",
      },
    ],
    ["named by aria-label alone", { label: undefined, "aria-label": "Fruit" }],
    ["the inline popup", { popupLayout: "inline" }],
    ["mixed, its own label", { mixed: true, mixedLabel: "Several" }],
    ["a held query", { inputValue: "ch" }],
  ] as const)("a combobox: %s", async (_name, props) => {
    const { react, vue } = await both({
      label: "Fruit",
      options: fruit,
      ...props,
    });
    expect(vue).toBe(react);
  });
});

describe("KozmosCombobox, mounted, as React's", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  beforeAll(() => {
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Element.prototype.scrollIntoView ??= function () {};
  });
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const wait = async () => {
    for (let i = 0; i < 4; i++) {
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };
  let inReact = false;
  const settle = () => (inReact ? act(wait) : wait());

  /**
   * The document as each draws it, with the popper's geometry made one:
   * where Radix's floating-ui and this port's placement put the popup in
   * jsdom, which lays nothing out, differs, so each geometric declaration
   * is kept by name; and the declarations sorted.
   */
  const GEOMETRY = /^(transform|left|top|z-index|--radix-popper-[\w-]+)$/;
  const alike = (html: string) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    for (const element of document.body.querySelectorAll("[style]")) {
      const declarations = element
        .getAttribute("style")!
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const name = part.slice(0, part.indexOf(":")).trim();
          return GEOMETRY.test(name) ? `${name}:*` : part;
        })
        .sort();
      element.setAttribute("style", declarations.join(";"));
    }
    for (const element of document.body.querySelectorAll("[data-v-app]"))
      element.removeAttribute("data-v-app");
    return normalizeHtml(document.body.innerHTML);
  };
  const body = () => alike(document.body.innerHTML);
  const input = () =>
    document.querySelector<HTMLInputElement>("input[role=combobox]")!;
  const key = (name: string, init: KeyboardEventInit = {}) =>
    input().dispatchEvent(
      new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );
  // Through the element's own setter, as typing sets it: React's value
  // tracker reads a value set on the element as its own.
  const type = (text: string) => {
    const field = input();
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(field, text);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const row = (label: string) =>
    [...document.querySelectorAll<HTMLElement>("[role=option]")].find(
      (option) => option.textContent?.includes(label),
    )!;
  const read = (events: KozmosAnalyticsEvent[]) =>
    events.map(({ timestamp: _timestamp, ...event }) => event);

  interface Heard {
    values: unknown[][];
    inputs: unknown[];
    resets: number;
    events: KozmosAnalyticsEvent[];
  }
  const hearing = (): Heard => ({
    values: [],
    inputs: [],
    resets: 0,
    events: [],
  });

  /**
   * Draws React's part, runs `steps`, reading the document after each, then
   * Vue's, and compares what each drew and heard. Each owns its value (and,
   * with `holdInput`, its text) as an app would, unless `own` says the part
   * holds them.
   */
  async function inBoth(
    props: Props,
    steps: ((step: number) => Promise<void> | void)[],
    {
      own = false,
      holdInput = false,
      start,
      setLater,
    }: {
      own?: boolean;
      holdInput?: boolean;
      start?: string;
      /** What the app does to its props after a step: by step, the props it sets. */
      setLater?: Record<number, Props>;
    } = {},
  ) {
    // A test may draw more than one: each starts on an empty document.
    vueApp?.unmount();
    vueApp = undefined;
    document.body.replaceChildren();
    const heard = { react: hearing(), vue: hearing() };
    const shots = { react: [] as string[], vue: [] as string[] };
    let setReact: (next: Props) => void = () => {};
    function Owner() {
      const [value, setValue] = React.useState(start ?? "");
      const [text, setText] = React.useState("");
      const [extra, setExtra] = React.useState<Props>({});
      setReact = (next) => setExtra((current) => ({ ...current, ...next }));
      return React.createElement(KozmosReact.Combobox, {
        ...props,
        ...(own ? {} : { value }),
        ...(holdInput ? { inputValue: text } : {}),
        ...extra,
        onValueChange: (...args: unknown[]) => {
          heard.react.values.push(args);
          setValue(args[0] as string);
        },
        onInputValueChange: (next: string) => {
          heard.react.inputs.push(next);
          setText(next);
        },
        onResetMixed:
          props.mixed === undefined
            ? undefined
            : () => {
                heard.react.resets += 1;
              },
      } as never);
    }
    let host = document.body.appendChild(document.createElement("div"));
    reactRoot = createRoot(host);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.AnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events: KozmosAnalyticsEvent[]) =>
              heard.react.events.push(...events),
          },
          React.createElement(
            KozmosReact.ThemeProvider,
            null,
            React.createElement(Owner),
          ),
        ),
      ),
    );
    await act(wait);
    inReact = true;
    shots.react.push(body());
    for (const [index, step] of steps.entries()) {
      await act(async () => {
        await step(index);
      });
      await settle();
      if (setLater?.[index]) {
        await act(async () => setReact(setLater[index]));
        await settle();
      }
      shots.react.push(body());
    }
    inReact = false;
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();

    const value = ref(start ?? "");
    const text = ref("");
    const extra = ref<Props>({});
    host = document.body.appendChild(document.createElement("div"));
    vueApp = createApp({
      render: () =>
        h(
          KozmosAnalyticsProvider,
          {
            batchDelayMs: 0,
            onDispatch: (events: KozmosAnalyticsEvent[]) =>
              heard.vue.events.push(...events),
          },
          () =>
            h(KozmosThemeProvider, null, () =>
              h(KozmosCombobox, {
                ...(asVue(props) as { options: [] }),
                ...(own ? {} : { modelValue: value.value }),
                ...(holdInput ? { inputValue: text.value } : {}),
                ...asVue(extra.value),
                "onUpdate:modelValue": (...args: unknown[]) => {
                  heard.vue.values.push(args);
                  value.value = args[0] as string;
                },
                "onUpdate:inputValue": (next: string) => {
                  heard.vue.inputs.push(next);
                  text.value = next;
                },
                onResetMixed:
                  props.mixed === undefined
                    ? undefined
                    : () => (heard.vue.resets += 1),
              }),
            ),
        ),
    });
    vueApp.mount(host);
    await wait();
    shots.vue.push(body());
    for (const [index, step] of steps.entries()) {
      await step(index);
      await settle();
      if (setLater?.[index]) {
        extra.value = { ...extra.value, ...setLater[index] };
        await settle();
      }
      shots.vue.push(body());
    }
    for (const [index, shot] of shots.react.entries())
      expect(shots.vue[index], `after step ${index}`).toBe(shot);
    expect(heard.vue.values).toEqual(heard.react.values);
    expect(heard.vue.inputs).toEqual(heard.react.inputs);
    expect(heard.vue.resets).toBe(heard.react.resets);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    return { heard, shots };
  }

  it("focus opens the list in the theme's portal; typing filters it; Enter chooses the first match", async () => {
    const { heard, shots } = await inBoth({ label: "Fruit", options: fruit }, [
      () => input().focus(),
      () => type("a"),
      () => key("Enter"),
    ]);
    expect(shots.react[1]).toContain("data-radix-popper-content-wrapper");
    expect(shots.react[1]).toContain("data-kozmos-portal");
    expect(heard.react.values.map(([value]) => value)).toEqual(["apple"]);
    expect(read(heard.react.events)).toEqual([
      {
        component: "Combobox",
        eventName: "option_selected",
        properties: { value: "apple" },
      },
    ]);
  });

  it("the arrows skip what cannot be chosen, Home and End go to the ends, and Escape closes", async () => {
    const { shots } = await inBoth({ label: "Fruit", options: fruit }, [
      () => input().focus(),
      () => key("ArrowDown"),
      () => key("ArrowDown"),
      () => key("ArrowUp"),
      () => key("End"),
      () => key("Home"),
      () => key("Escape"),
      () => key("ArrowDown"),
    ]);
    expect(shots.react[2]).toContain('aria-activedescendant="');
  });

  it("a press on a row chooses it; a press outside closes the list", async () => {
    const { heard } = await inBoth({ label: "Fruit", options: fruit }, [
      () => input().focus(),
      () => row("Date").click(),
      () => input().focus(),
      () =>
        document.body.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true }),
        ),
    ]);
    expect(heard.react.values.map(([value]) => value)).toEqual(["date"]);
  });

  it("the clear empties the choice and the text, reported as selection_cleared", async () => {
    const { heard } = await inBoth(
      { label: "Fruit", options: fruit },
      [
        () =>
          document
            .querySelector<HTMLButtonElement>(
              'button[aria-label="Clear selection"]',
            )!
            .click(),
      ],
      { start: "cherry" },
    );
    expect(heard.react.values).toEqual([["", undefined]]);
  });

  it("the open button opens and closes the list; disabled, it opens nothing", async () => {
    await inBoth({ label: "Fruit", options: fruit }, [
      () =>
        document
          .querySelector<HTMLButtonElement>(
            'button[aria-label="Open options"]',
          )!
          .click(),
      () =>
        document
          .querySelector<HTMLButtonElement>(
            'button[aria-label="Close options"]',
          )!
          .click(),
    ]);
    await inBoth({ label: "Fruit", options: fruit, disabled: true }, [
      () => input().focus(),
      () => key("ArrowDown"),
    ]);
  });

  it("made disabled while open, it closes, and stays closed when free again", async () => {
    await inBoth(
      { label: "Fruit", options: fruit },
      [() => input().focus(), () => {}, () => {}],
      { setLater: { 0: { disabled: true }, 1: { disabled: false } } },
    );
  });

  it("lists commands after the options, runs one by the keys, and never by Enter on text that matches nothing", async () => {
    const ran: string[] = [];
    const popupActions = [
      {
        id: "here",
        label: "Current position",
        onAction: () => ran.push("here"),
      },
      {
        id: "map",
        label: "Select from map",
        disabled: true,
        onAction: () => ran.push("map"),
      },
      { id: "dup", label: "One", onAction: () => {} },
      { id: "dup", label: "Two", onAction: () => {} },
    ];
    await inBoth({ label: "Place", options: fruit, popupActions }, [
      () => input().focus(),
      () => type("zz"),
      () => key("Enter"),
      () => key("ArrowDown"),
      () => key("Enter"),
    ]);
    expect(ran).toEqual(["here", "here"]);
  });

  it("says its empty text through the field's status, not the popup", async () => {
    const { shots } = await inBoth({ label: "Fruit", options: fruit }, [
      () => input().focus(),
      () => type("zz"),
    ]);
    expect(shots.react[2]).toContain('aria-live="polite"');
    expect(shots.react[2]).toContain("No results found");
  });

  it("a mixed field keeps a query mixed, a choice edits it, and its reset is heard", async () => {
    const { heard } = await inBoth(
      { label: "Type", options: contentTypes, mixed: true },
      [() => input().focus(), () => type("desk"), () => key("Enter")],
    );
    expect(heard.react.values.map(([value]) => value)).toEqual(["office-desk"]);
    await inBoth(
      { label: "Type", options: contentTypes, mixed: false },
      [
        () =>
          document
            .querySelector<HTMLButtonElement>("[data-slot=reset-mixed]")!
            .click(),
      ],
      { start: "hot-desk" },
    );
  });

  it("draws options under their groups, and the inline popup in the flow", async () => {
    await inBoth(
      {
        label: "Content type",
        options: contentTypes,
        defaultInputValue: "desk",
      },
      [() => input().focus(), () => key("ArrowDown")],
    );
    await inBoth({ label: "Fruit", options: fruit, popupLayout: "inline" }, [
      () => input().focus(),
    ]);
  });

  it("keeps the visitor's text when the app clears its value as they type, and shows a value the app sets (GAP-232)", async () => {
    await inBoth(
      { label: "Fruit", options: fruit },
      [() => input().focus(), () => type("che"), () => {}],
      {
        start: "apple",
        setLater: { 1: { options: fruit.slice(2) }, 2: { value: "date" } },
      },
    );
  });

  it("holds the text the app holds, and takes back what it refuses", async () => {
    await inBoth(
      { label: "Fruit", options: fruit },
      [() => input().focus(), () => type("d")],
      { holdInput: true },
    );
  });

  it("a choice with include-value-in-analytics false reports no value", async () => {
    const { heard } = await inBoth(
      { label: "Fruit", options: fruit, includeValueInAnalytics: false },
      [() => input().focus(), () => key("Enter")],
    );
    expect(read(heard.react.events)).toEqual([
      { component: "Combobox", eventName: "option_selected" },
    ]);
  });
});
