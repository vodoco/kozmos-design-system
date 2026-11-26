// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref } from "vue";
import { KozmosMultiSelect, KozmosThemeProvider } from "../../src/index";
import { renderBoth, type Drawn } from "./render";
import {
  inBoth,
  keyOn,
  standIns,
  typeInto,
  unmountBoth,
  type Model,
} from "./mounted-both";

/**
 * MultiSelect, drawn in both: React's stories (their options are named
 * constants, so the stories check cannot read them), closed as a server
 * renders them, and the edges React's tests cover (MultiSelect.test.tsx):
 * chosen values and their clear, disabled and read-only, required, helper
 * text and each status, a limit, an app's class, id and description, a
 * mixed field.
 *
 * Then, mounted, each alone in the document: focus opens the list in the
 * theme's portal; typing filters it and makes the first match active; the
 * arrows skip what cannot be chosen; Enter toggles, keeping the list open
 * and the option active once the text clears; Backspace in the empty input
 * removes the last chip; a chip's remove; the clear, which leaves the list
 * closed; a press on a row, outside, and the open button; Escape in the
 * input and on the field's buttons; the limit, said once; a mixed field's
 * choice and reset; made disabled while open; a refused search kept; and
 * v-model, v-model:search-value and analytics hearing what React's do.
 */
const options = [
  { value: "filters", label: "Filters", description: "Show saved filters" },
  { value: "layers", label: "Layers", description: "Map and data layers" },
  { value: "routes", label: "Routes", description: "Route overlays" },
  { value: "alerts", label: "Alerts", description: "Operational notices" },
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
const asVue = ({ className, value, ...rest }: Props) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
  ...(value === undefined ? {} : { modelValue: value }),
});
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const w96 = (...children: Drawn[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className: "w-96" },
  vueProps: { class: "w-96" },
  children,
});
const both = (props: Props) =>
  renderBoth(
    inTheme(
      w96({
        react: KozmosReact.MultiSelect,
        vue: KozmosMultiSelect,
        props,
        vueProps: asVue(props),
      }),
    ),
  );

describe("KozmosMultiSelect draws what React's MultiSelect draws, closed", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await both({ label: "Tools", options });
    expect(react).toContain('role="combobox"');
    expect(vue).toBe(react);
  });

  it("WithSelectedValues: draws what React's story draws", async () => {
    const { react, vue } = await both({
      label: "Visible layers",
      options,
      defaultValue: ["filters", "routes"],
      helperText: "Choose up to three layers.",
      maxSelected: 3,
    });
    expect(react).toContain("Remove Filters");
    expect(vue).toBe(react);
  });

  it("Grouped: draws what React's story draws, closed", async () => {
    const { react, vue } = await both({
      label: "Content types",
      options: contentTypes,
      defaultValue: ["office-desk"],
    });
    expect(vue).toBe(react);
  });

  it.each([
    ["chosen values, with their clear", { value: ["cherry", "apple"] }],
    ["a chosen value no option has", { value: ["kiwi", "date"] }],
    ["not clearable", { value: ["cherry"], clearable: false }],
    ["disabled", { value: ["cherry"], disabled: true }],
    ["read-only", { value: ["cherry"], readOnly: true }],
    ["required", { required: true }],
    ["helper text", { helperText: "Pick fruit" }],
    ["a warning", { status: "warning", helperText: "Seasonal" }],
    ["a success", { status: "success" }],
    ["a boolean error", { error: true }],
    ["an error", { error: "Pick one", helperText: "Pick fruit" }],
    ["its own placeholder", { placeholder: "Find fruit" }],
    ["a limit", { maxSelected: 1, value: ["apple"] }],
    [
      "an app's class, id, title and description",
      {
        className: "px-4",
        id: "fruit",
        title: "Fruit",
        "aria-describedby": "fruit-note",
        wrapperClassName: "kozmos-parity",
      },
    ],
    ["named by aria-label alone", { label: undefined, "aria-label": "Fruit" }],
    ["mixed, its own label", { mixed: true, mixedLabel: "Several" }],
    ["mixed, its values dropped", { mixed: true, value: ["apple"] }],
    ["a held search", { searchValue: "ch" }],
    ["a default search", { defaultSearchValue: "a" }],
  ] as const)("a multi-select: %s", async (_name, props) => {
    const { react, vue } = await both({
      label: "Fruit",
      options: fruit,
      ...props,
    });
    expect(vue).toBe(react);
  });

  it("an edited mixed field offers its reset", async () => {
    const { react, vue } = await both({
      label: "Fruit",
      options: fruit,
      value: ["apple"],
      onResetMixed: () => {},
    });
    expect(react).toContain("Reset to multiple values");
    expect(vue).toBe(react);
  });
});

describe("KozmosMultiSelect, mounted, as React's", () => {
  beforeAll(standIns);
  afterEach(unmountBoth);
  const input = () =>
    document.querySelector<HTMLInputElement>("input[role=combobox]")!;
  const key = (name: string, init: KeyboardEventInit = {}) =>
    keyOn(input(), name, init);
  const row = (label: string) =>
    [...document.querySelectorAll<HTMLElement>("[role=option]")].find(
      (option) => option.textContent?.includes(label),
    )!;
  const button = (label: string) =>
    document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const value = (start: unknown = [], own = false): Model => ({
    prop: "value",
    callback: "onValueChange",
    vueProp: "modelValue",
    listener: "onUpdate:modelValue",
    start,
    own,
  });
  const search = (start = "", own = true): Model => ({
    prop: "searchValue",
    callback: "onSearchValueChange",
    vueProp: "searchValue",
    listener: "onUpdate:searchValue",
    start,
    own,
  });

  /** Runs the steps in both, holding the documents and what each heard equal. */
  async function compare(
    props: Props,
    steps: (() => unknown)[],
    models: Model[] = [value(), search()],
    setLater: Parameters<typeof inBoth>[0]["setLater"] = {},
  ) {
    const result = await inBoth({
      react: KozmosReact.MultiSelect,
      vue: KozmosMultiSelect,
      props: { label: "Fruit", options: fruit, ...props },
      vueProps: asVue({ label: "Fruit", options: fruit, ...props }),
      models,
      listeners:
        props.mixed !== undefined ? [["onResetMixed", "onResetMixed"]] : [],
      steps,
      setLater,
    });
    const { heard, shots } = result;
    for (const [index, shot] of shots.react.entries())
      expect(shots.vue[index], `after step ${index}`).toBe(shot);
    expect(heard.vue.models).toEqual(heard.react.models);
    expect(heard.vue.other).toEqual(heard.react.other);
    expect(heard.vue.events).toEqual(heard.react.events);
    return result;
  }

  it("focus opens the list in the theme's portal; typing filters it; Enter toggles the active option, keeping it active", async () => {
    const { heard, shots } = await compare({}, [
      () => input().focus(),
      () => typeInto(input(), "e"),
      () => key("Enter"),
      () => key("ArrowDown"),
      () => key("Enter"),
      () => key("Enter"),
    ]);
    expect(shots.react[1]).toContain("data-radix-popper-content-wrapper");
    expect(shots.react[1]).toContain('aria-multiselectable="true"');
    expect(heard.react.models.value.map(([next]) => next)).toEqual([
      ["apple"],
      ["apple", "cherry"],
      ["apple"],
    ]);
    expect(heard.react.events.map((event) => event.eventName)).toEqual([
      "option_selected",
      "option_selected",
      "option_removed",
    ]);
  });

  it("a choice made while text is typed stays active in the full list that comes back", async () => {
    const { heard } = await compare({}, [
      () => input().focus(),
      () => typeInto(input(), "ch"),
      () => key("Enter"),
      () => key("Enter"),
    ]);
    expect(heard.react.models.value.map(([next]) => next)).toEqual([
      ["cherry"],
      [],
    ]);
  });

  it("the arrows skip what cannot be chosen; Escape closes, and an arrow opens it again", async () => {
    await compare({}, [
      () => input().focus(),
      () => key("ArrowDown"),
      () => key("ArrowDown"),
      () => key("ArrowUp"),
      () => key("Escape"),
      () => key("ArrowUp"),
    ]);
  });

  it("Backspace in the empty input removes the last chip, focus staying; a chip's remove removes its own", async () => {
    const { heard } = await compare(
      {},
      [
        () => input().focus(),
        () => key("Backspace"),
        () => button("Remove Apple").click(),
      ],
      [value(["apple", "cherry", "date"]), search()],
    );
    expect(heard.react.models.value.map(([next]) => next)).toEqual([
      ["apple", "cherry"],
      ["cherry"],
    ]);
  });

  it("the clear empties the choice and the text, its list closed, reported as selection_cleared", async () => {
    const { heard, shots } = await compare(
      {},
      [
        () => input().focus(),
        () => typeInto(input(), "ch"),
        () => button("Clear selected options").click(),
      ],
      [value(["apple"]), search()],
    );
    expect(shots.react[3]).not.toContain('role="listbox"');
    expect(heard.react.events.at(-1)?.eventName).toBe("selection_cleared");
  });

  it("a press on a row toggles it; a press outside closes; the open button opens and closes", async () => {
    await compare({}, [
      () => input().focus(),
      () => row("Date").click(),
      () => row("Banana").click(),
      () =>
        document.body.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true }),
        ),
      () => button("Open options").click(),
      () => button("Close options").click(),
    ]);
  });

  it("Escape on a chip's remove closes the list, as React's layer does", async () => {
    await compare(
      {},
      [() => input().focus(), () => keyOn(button("Remove Apple"), "Escape")],
      [value(["apple"]), search()],
    );
  });

  it("at its limit, the options not chosen cannot be chosen, and the limit is said once", async () => {
    const { shots } = await compare({ maxSelected: 2 }, [
      () => input().focus(),
      () => key("Enter"),
      () => key("ArrowDown"),
      () => key("Enter"),
      () => key("ArrowDown"),
      () => key("Enter"),
      () => row("Date").click(),
    ]);
    expect(shots.react[4]).toContain("Limit of 2 reached");
  });

  it("mixed, a choice is the edit and the reset takes it back", async () => {
    const { heard } = await compare(
      { mixed: true },
      [() => input().focus(), () => key("Enter")],
      [value([]), search()],
      { 1: { react: { mixed: false }, vue: { mixed: false } } },
    );
    expect(heard.react.models.value).toEqual([[["apple"], [fruit[0]]]]);
  });

  it("made disabled while open, it closes, and stays closed", async () => {
    await compare(
      {},
      [() => input().focus(), () => {}, () => {}],
      [value(), search()],
      {
        0: { react: { disabled: true }, vue: { disabled: true } },
        1: { react: { disabled: false }, vue: { disabled: false } },
      },
    );
  });

  it("a held search the app refuses is taken back", async () => {
    await compare(
      {},
      [() => input().focus(), () => typeInto(input(), "zz")],
      [
        value(),
        {
          ...search(),
          own: false,
          // The owner keeps "" whatever is typed.
          callback: "onSearchValueChange",
        },
      ],
      {
        1: { react: { searchValue: "" }, vue: { searchValue: "" } },
      },
    );
  });

  it("v-model and v-model:search-value bind both ways, and the reset is heard", async () => {
    const chosen = ref<string[]>(["apple"]);
    const query = ref("");
    const heard: unknown[][] = [];
    let resets = 0;
    const host = document.body.appendChild(document.createElement("div"));
    const app = createApp({
      render: () =>
        h(KozmosThemeProvider, null, () =>
          h(KozmosMultiSelect, {
            label: "Fruit",
            options: fruit,
            modelValue: chosen.value,
            searchValue: query.value,
            "onUpdate:modelValue": (...args: unknown[]) => {
              heard.push(args);
              chosen.value = args[0] as string[];
            },
            "onUpdate:searchValue": (next: string) => (query.value = next),
            onResetMixed: () => (resets += 1),
          }),
        ),
    });
    app.mount(host);
    await nextTick();
    input().focus();
    typeInto(input(), "ch");
    await nextTick();
    expect(query.value).toBe("ch");
    key("Enter");
    await nextTick();
    expect(heard).toEqual([
      [
        ["apple", "cherry"],
        [fruit[0], fruit[2]],
      ],
    ]);
    expect(query.value).toBe("");
    chosen.value = [];
    await nextTick();
    expect(document.querySelectorAll("[data-slot=chip]")).toHaveLength(0);
    document
      .querySelector<HTMLButtonElement>("[data-slot=reset-mixed]")
      ?.click();
    expect(resets).toBe(1);
    app.unmount();
  });
});
