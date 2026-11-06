// @vitest-environment jsdom
import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defineComponent,
  h,
  mergeProps,
  nextTick,
  ref,
  type Component,
} from "vue";
import React from "react";
import ts from "typescript";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  RadioGroupItem,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kozmos-ds/react";
import * as Bridge from "./index";
import { createVueWrapper, modelsOf, RADIX_MODELS } from "./react-adapter";
import {
  $,
  $$,
  byText,
  choose,
  commit,
  heard,
  mount,
  press,
  select,
  settle,
  texts,
  type,
  unmount,
  until,
} from "../../test/react-bridge-harness";
import { planOf, reactSides } from "../../test/contract/read-contract";

// v-model and attributes through the React bridge (react-adapter.ts); the
// attributes are at the end, the listeners in Listeners.spec.ts. Each
// wrapper names its models: React's prop for the value, the callback that
// reports a change, and what React is given while the model is null. While
// the parent passes the value and listens, React's part is controlled, and
// given that callback beside any handler of its name the user gave; with a
// listener alone, it keeps a value of its own and reports each change.
//
// Until then, a wrapper declared `update:modelValue`, and Vue keeps a
// declared event's listener out of `attrs`, so React never heard of it:
// v-model changed nothing, and a controlled field took its old value back.
// The first fix (#488's) handed React an emitter for every declared event,
// read through DOM `onChange` as well: it took Combobox's own `onChange`,
// so typing stopped filtering, typed MultiSelect's array into a string, and
// dropped a user's `@change`.

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];
const plan = new File(["%PDF"], "plan.pdf", { type: "application/pdf" });
const tree = [
  { id: "1", name: "src", children: [{ id: "2", name: "a.ts" }] },
  { id: "3", name: "b.ts" },
];
const photos = ["a", "b", "c"].map((id) => ({
  id,
  src: "data:,",
  alt: id.toUpperCase(),
}));
const e = React.createElement;

/** A property of every element, stubbed for one part and put back. */
function stub(property: "clientWidth" | "clientHeight", value: number) {
  const own = Object.getOwnPropertyDescriptor(Element.prototype, property)!;
  Object.defineProperty(Element.prototype, property, {
    configurable: true,
    get: () => value,
  });
  return () => Object.defineProperty(Element.prototype, property, own);
}

// --------------------------------------------------------------------------
// Every model of every wrapper, and how a visitor changes it.
// --------------------------------------------------------------------------

interface Part {
  /** The bridge's export. */
  name: keyof typeof Bridge;
  /** The model, as Vue names it: `modelValue` is `v-model`. */
  model?: string;
  /** One of every wrapper's (RADIX_MODELS), not a model the wrapper names. */
  implicit?: boolean;
  /** What the part needs to draw. */
  props?: Record<string, unknown>;
  /** What the page needs for it to draw (jsdom lays nothing out); undone after. */
  env?: () => () => void;
  /** The model before the change. */
  start: unknown;
  /** The element a visitor uses, once React has drawn it. */
  field: () => Element | null | undefined;
  /** What the visitor does with it: types, clicks, presses a key. */
  change: (field: any) => void | Promise<void>;
  /** The model after the change, of the type the part reports. */
  next: unknown;
  /** What the DOM shows of the value. */
  shown: () => unknown;
  /** What it shows after the change, with v-model. */
  shows: unknown;
  /** What it shows while the model is null: nothing chosen. */
  nothing: unknown;
  /** The model, and what it shows, after the same change from null; unset, `next` and `shows`. */
  fromNothing?: { next: unknown; shows: unknown };
  /** The part's own callback for the change, which a user may listen to as well. */
  listener: string;
  /**
   * What it shows after the change without v-model, for a part with a value
   * of its own. Unset for one the product always controls (Rating,
   * FloorSelector, MapControlsGroup), which draws what it is given.
   */
  alone?: unknown;
}

const textField = (
  name: keyof typeof Bridge,
  selector: string,
  start: string,
  next: string,
): Part => ({
  name,
  props: { "aria-label": "Field" },
  start,
  field: () => $<HTMLInputElement>(selector),
  change: (field) => type(field, next),
  next,
  shown: () => $<HTMLInputElement>(selector)?.value,
  shows: next,
  nothing: "",
  listener: "onChange",
  alone: next,
});

const PARTS: Part[] = [
  textField("KozmosInput", "input", "Ada", "Ada L"),
  textField("KozmosTextarea", "textarea", "Gate 4", "Gate 42"),
  textField("KozmosSearch", "input[type=search]", "caf", "cafe"),
  textField("KozmosPasswordInput", "input[type=password]", "hunte", "hunter"),
  textField("KozmosDatePicker", "input[type=date]", "2026-11-01", "2026-11-06"),
  textField("KozmosTimePicker", "input[type=time]", "09:00", "09:30"),
  {
    // Its onChange reports the text, not an event.
    ...textField("KozmosSearchBar", "input", "Gat", "Gate"),
    props: { placeholder: "Where to?" },
  },
  {
    // A number, from onValueChange: its DOM onChange reports a string.
    name: "KozmosNumberInput",
    props: { "aria-label": "Guests" },
    start: 1,
    field: () => $("input[type=number]"),
    change: (field) => type(field, "42"),
    next: 42,
    shown: () => $<HTMLInputElement>("input[type=number]")?.value,
    shows: "42",
    nothing: "",
    listener: "onValueChange",
    alone: "42",
  },
  {
    name: "KozmosOTPInput",
    props: { length: 4 },
    start: "12",
    field: () => $$("input")[2],
    change: (field) => type(field, "3"),
    next: "123",
    shown: () => $$<HTMLInputElement>("input").map((cell) => cell.value),
    shows: ["1", "2", "3", ""],
    nothing: ["", "", "", ""],
    // OTPInput reports its cells joined, so a digit typed in the third of
    // four empty cells is the code "3", and React's part keeps it drawn
    // where it was typed: it redraws its cells only for another code.
    fromNothing: { next: "3", shows: ["", "", "3", ""] },
    listener: "onChange",
    alone: ["", "", "3", ""],
  },
  {
    // A colour typed whole is normalised; onValueChange reports it.
    name: "KozmosColorPicker",
    props: { label: "Brand" },
    start: "#135BEC",
    field: () => $("input[type=text]"),
    change: (field) => type(field, "#abc"),
    next: "#AABBCC",
    shown: () => $<HTMLInputElement>("input[type=text]")?.value,
    shows: "#AABBCC",
    nothing: "",
    listener: "onValueChange",
    alone: "#abc",
  },
  {
    name: "KozmosColorPicker",
    model: "alpha",
    props: { label: "Brand", open: true },
    start: 100,
    field: () => $("input[aria-label=Opacity]"),
    change: (range) => type(range, "40"),
    next: 40,
    shown: () => $<HTMLInputElement>("input[aria-label=Opacity]")?.value,
    shows: "40",
    // Its own default, 100.
    nothing: "100",
    listener: "onAlphaChange",
    alone: "40",
  },
  {
    name: "KozmosColorPicker",
    model: "format",
    props: { label: "Brand", open: true },
    start: "hsl",
    field: () => $("select[aria-label='Color format']"),
    change: (menu) => select(menu, "hex"),
    next: "hex",
    shown: () =>
      $<HTMLSelectElement>("select[aria-label='Color format']")?.value,
    shows: "hex",
    // Its own default, HSL.
    nothing: "hsl",
    listener: "onFormatChange",
    alone: "hex",
  },
  {
    name: "KozmosColorPicker",
    model: "open",
    implicit: true,
    props: { label: "Brand" },
    start: false,
    field: () => $("button[aria-expanded]"),
    change: (toggle) => toggle.click(),
    next: true,
    shown: () => $("button[aria-expanded]")?.getAttribute("aria-expanded"),
    shows: "true",
    nothing: "false",
    listener: "onOpenChange",
    alone: "true",
  },
  {
    name: "KozmosSlider",
    props: { "aria-label": "Volume", max: 10 },
    start: [3],
    field: () => $("[role=slider]"),
    change: (thumb) => press(thumb, "ArrowRight"),
    next: [4],
    shown: () => $("[role=slider]")?.getAttribute("aria-valuenow"),
    shows: "4",
    // Where it starts with nothing given: its minimum.
    nothing: "0",
    fromNothing: { next: [1], shows: "1" },
    listener: "onValueChange",
    alone: "1",
  },
  {
    name: "KozmosRating",
    props: { label: "Your visit" },
    start: 2,
    field: () => $$("[role=radio]")[3],
    change: (star) => star.click(),
    next: 4,
    shown: () =>
      $$("[role=radio]").findIndex(
        (star) => star.getAttribute("aria-checked") === "true",
      ) + 1,
    shows: 4,
    nothing: 0,
    listener: "onChange",
  },
  {
    name: "KozmosFloorSelector",
    props: { floors: ["1", "2", "3"], label: "Floor" },
    start: "1",
    field: () => byText("button", "2"),
    change: (floor) => floor.click(),
    next: "2",
    shown: () => $("button[aria-pressed=true]")?.textContent?.trim(),
    shows: "2",
    nothing: undefined,
    listener: "onFloorSelect",
  },
  {
    name: "KozmosFileUpload",
    props: { label: "Floor plan" },
    start: [],
    field: () => $("input[type=file]"),
    change: (input) => choose(input, [plan]),
    next: [plan],
    shown: () => texts("li p:first-child"),
    shows: ["plan.pdf"],
    nothing: [],
    listener: "onFilesChange",
    alone: ["plan.pdf"],
  },
  {
    // Its items cannot be KozmosRadioGroupItems: each wrapper is a React
    // root of its own, and Radix's items must share their group's (GAP-016).
    // React's items, handed over as `children`, share it.
    name: "KozmosRadioGroup",
    props: {
      "aria-label": "Mode",
      children: ["walk", "drive"].map((value) =>
        e(RadioGroupItem, { key: value, value, label: value }),
      ),
    },
    start: "walk",
    field: () => $("[role=radio][value=drive]"),
    change: (radio) => radio.click(),
    next: "drive",
    shown: () => $("[role=radio][aria-checked=true]")?.getAttribute("value"),
    shows: "drive",
    nothing: undefined,
    listener: "onValueChange",
    alone: "drive",
  },
  {
    name: "KozmosSegmentedControl",
    props: {
      label: "Mode",
      items: [
        { value: "walk", label: "Walk" },
        { value: "drive", label: "Drive" },
      ],
    },
    start: "walk",
    field: () => byText("[role=radio]", "Drive"),
    change: (segment) => segment.click(),
    next: "drive",
    shown: () => $("[role=radio][aria-checked=true]")?.textContent?.trim(),
    shows: "Drive",
    nothing: undefined,
    listener: "onValueChange",
    alone: "Drive",
  },
  {
    // The choice is the value; what is typed is only the query.
    name: "KozmosCombobox",
    props: { options: fruit, label: "Fruit" },
    start: "banana",
    field: () => $("input"),
    change: async (input) => {
      input.focus();
      type(input, "Ap");
      (await until(() => byText("[role=option]", "Apple")))!.click();
    },
    next: "apple",
    shown: () => $<HTMLInputElement>("input")?.value,
    shows: "Apple",
    nothing: "",
    listener: "onValueChange",
    alone: "Apple",
  },
  {
    name: "KozmosCombobox",
    model: "inputValue",
    props: { options: fruit, label: "Fruit" },
    start: "",
    field: () => $("input"),
    change: (input) => {
      input.focus();
      type(input, "Ap");
    },
    next: "Ap",
    shown: () => $<HTMLInputElement>("input")?.value,
    shows: "Ap",
    nothing: "",
    listener: "onInputValueChange",
    alone: "Ap",
  },
  {
    name: "KozmosListbox",
    props: { options: fruit, "aria-label": "Fruit" },
    start: "apple",
    field: () => byText("[role=option]", "Banana"),
    change: (option) => option.click(),
    next: "banana",
    shown: () => texts("[role=option][aria-selected=true]"),
    shows: ["Banana"],
    nothing: [],
    listener: "onValueChange",
    alone: ["Banana"],
  },
  {
    // Several options: nothing is an empty array (`empty` reads `multiple`).
    name: "KozmosListbox",
    props: { options: fruit, "aria-label": "Fruit", multiple: true },
    start: ["apple"],
    field: () => byText("[role=option]", "Banana"),
    change: (option) => option.click(),
    next: ["apple", "banana"],
    shown: () => texts("[role=option][aria-selected=true]"),
    shows: ["Apple", "Banana"],
    nothing: [],
    fromNothing: { next: ["banana"], shows: ["Banana"] },
    listener: "onValueChange",
    alone: ["Banana"],
  },
  {
    // An array, from onValueChange: typing in its search never reaches it.
    name: "KozmosMultiSelect",
    props: { options: fruit, label: "Fruit" },
    start: ["apple"],
    field: () => $("input"),
    change: async (input) => {
      input.focus();
      type(input, "Ba");
      (await until(() => byText("[role=option]", "Banana")))!.click();
    },
    next: ["apple", "banana"],
    shown: () => texts('[data-slot="chip-label"]'),
    shows: ["Apple", "Banana"],
    nothing: [],
    fromNothing: { next: ["banana"], shows: ["Banana"] },
    listener: "onValueChange",
    alone: ["Banana"],
  },
  {
    name: "KozmosMultiSelect",
    model: "searchValue",
    props: { options: fruit, label: "Fruit" },
    start: "",
    field: () => $("input"),
    change: (input) => {
      input.focus();
      type(input, "Ba");
    },
    next: "Ba",
    shown: () => $<HTMLInputElement>("input")?.value,
    shows: "Ba",
    nothing: "",
    listener: "onSearchValueChange",
    alone: "Ba",
  },
  {
    name: "KozmosDateRangePicker",
    props: { label: "Stay" },
    start: { start: "2026-11-01", end: "2026-11-05" },
    field: () => $$("input[type=date]")[1],
    change: (end) => type(end, "2026-11-09"),
    next: { start: "2026-11-01", end: "2026-11-09" },
    shown: () => $$<HTMLInputElement>("input[type=date]").map((f) => f.value),
    shows: ["2026-11-01", "2026-11-09"],
    nothing: ["", ""],
    fromNothing: {
      next: { start: "", end: "2026-11-09" },
      shows: ["", "2026-11-09"],
    },
    listener: "onValueChange",
    alone: ["", "2026-11-09"],
  },
  {
    // `v-model` is Radix's `checked`, as `v-model:checked` is.
    name: "KozmosCheckbox",
    props: { "aria-label": "Accept" },
    start: false,
    field: () => $("[role=checkbox]"),
    change: (box) => box.click(),
    next: true,
    shown: () => $("[role=checkbox]")?.getAttribute("aria-checked"),
    shows: "true",
    nothing: "false",
    listener: "onCheckedChange",
    alone: "true",
  },
  {
    name: "KozmosCheckbox",
    model: "checked",
    implicit: true,
    props: { "aria-label": "Accept" },
    start: false,
    field: () => $("[role=checkbox]"),
    change: (box) => box.click(),
    next: true,
    shown: () => $("[role=checkbox]")?.getAttribute("aria-checked"),
    shows: "true",
    nothing: "false",
    listener: "onCheckedChange",
    alone: "true",
  },
  {
    name: "KozmosSwitch",
    props: { "aria-label": "Wi-Fi" },
    start: false,
    field: () => $("[role=switch]"),
    change: (toggle) => toggle.click(),
    next: true,
    shown: () => $("[role=switch]")?.getAttribute("aria-checked"),
    shows: "true",
    nothing: "false",
    listener: "onCheckedChange",
    alone: "true",
  },
  {
    name: "KozmosSwitch",
    model: "checked",
    implicit: true,
    props: { "aria-label": "Wi-Fi" },
    start: false,
    field: () => $("[role=switch]"),
    change: (toggle) => toggle.click(),
    next: true,
    shown: () => $("[role=switch]")?.getAttribute("aria-checked"),
    shows: "true",
    nothing: "false",
    listener: "onCheckedChange",
    alone: "true",
  },
  {
    name: "KozmosWayfindingInputRow",
    model: "originValue",
    start: "Entrance A",
    field: () => $$("input")[0],
    change: (origin) => type(origin, "Gate 42"),
    next: "Gate 42",
    shown: () => $$<HTMLInputElement>("input")[0]?.value,
    shows: "Gate 42",
    nothing: "",
    listener: "onOriginChange",
    alone: "Gate 42",
  },
  {
    name: "KozmosWayfindingInputRow",
    model: "destinationValue",
    start: "Apple Store",
    field: () => $$("input")[1],
    change: (destination) => type(destination, "Lounge"),
    next: "Lounge",
    shown: () => $$<HTMLInputElement>("input")[1]?.value,
    shows: "Lounge",
    nothing: "",
    listener: "onDestinationChange",
    alone: "Lounge",
  },
  {
    // Radix's Select, opened and chosen from with the keyboard; its parts
    // below the root are React's, handed over as `children` (GAP-016).
    name: "KozmosSelect",
    props: {
      children: [
        e(
          SelectTrigger,
          { key: "trigger", "aria-label": "Fruit" },
          e(SelectValue, { placeholder: "Pick one" }),
        ),
        e(
          SelectContent,
          { key: "content" },
          ["apple", "banana"].map((value) =>
            e(SelectItem, { key: value, value }, value),
          ),
        ),
      ],
    },
    start: "apple",
    field: () => $("[role=combobox]"),
    change: async (trigger) => {
      trigger.focus();
      press(trigger, "Enter");
      press(await until(() => byText("[role=option]", "banana"))!, "Enter");
    },
    next: "banana",
    shown: () => $("[role=combobox]")?.textContent,
    shows: "banana",
    // Its placeholder.
    nothing: "Pick one",
    listener: "onValueChange",
    alone: "banana",
  },
  {
    name: "KozmosAccordion",
    props: {
      type: "single",
      collapsible: true,
      children: ["a", "b"].map((value) =>
        e(
          AccordionItem,
          { key: value, value },
          e(AccordionTrigger, null, `Item ${value}`),
          e(AccordionContent, null, `Body ${value}`),
        ),
      ),
    },
    start: "a",
    field: () => byText("button", "Item b"),
    change: (trigger) => trigger.click(),
    next: "b",
    shown: () => texts("button[aria-expanded=true]"),
    shows: ["Item b"],
    nothing: [],
    listener: "onValueChange",
    alone: ["Item b"],
  },
  {
    // Radix's Tabs choose a tab on mousedown.
    name: "KozmosTabs",
    props: {
      children: [
        e(
          TabsList,
          { key: "list" },
          ["a", "b"].map((value) =>
            e(TabsTrigger, { key: value, value }, `Tab ${value}`),
          ),
        ),
        ...["a", "b"].map((value) =>
          e(TabsContent, { key: value, value }, `Panel ${value}`),
        ),
      ],
    },
    start: "a",
    field: () => byText("[role=tab]", "Tab b"),
    change: (tab) =>
      tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
    next: "b",
    shown: () => $("[role=tab][aria-selected=true]")?.textContent,
    shows: "Tab b",
    nothing: undefined,
    listener: "onValueChange",
    alone: "Tab b",
  },
  {
    name: "KozmosToggleButton",
    model: "pressed",
    props: { "aria-label": "Bold" },
    start: false,
    field: () => $("button"),
    change: (button) => button.click(),
    next: true,
    shown: () => $("button")?.getAttribute("aria-pressed"),
    shows: "true",
    nothing: "false",
    listener: "onPressedChange",
    alone: "true",
  },
  {
    // Drawn only with a listener: the product always holds it.
    name: "KozmosMapControlsGroup",
    model: "stepFree",
    start: false,
    field: () => $("[data-map-control=step-free]"),
    change: (button) => button.click(),
    next: true,
    shown: () =>
      $("[data-map-control=step-free]")?.getAttribute("aria-pressed"),
    shows: "true",
    nothing: "false",
    listener: "onStepFreeChange",
  },
  {
    name: "KozmosPOIMediaGallery",
    model: "activeIndex",
    props: {
      label: "Photos",
      positionLabel: (current: number, total: number) =>
        `${current} of ${total}`,
      media: photos,
    },
    start: 0,
    field: () => $("button[aria-label='Next image']"),
    change: (next) => next.click(),
    next: 1,
    shown: () => $("p[aria-live]")?.textContent,
    shows: "2 of 3",
    // Its first image, its default.
    nothing: "1 of 3",
    listener: "onActiveIndexChange",
    alone: "2 of 3",
  },
  {
    name: "KozmosPasswordInput",
    model: "visible",
    props: { "aria-label": "Password" },
    start: false,
    field: () => $("button[aria-label='Show password']"),
    change: (button) => button.click(),
    next: true,
    shown: () => $("input")?.getAttribute("type"),
    shows: "text",
    nothing: "password",
    listener: "onVisibleChange",
    alone: "text",
  },
  {
    // Clicking a parent selects and opens it.
    name: "KozmosTree",
    model: "expandedIds",
    props: { data: tree },
    start: [],
    field: () => byText("[role=treeitem]", "src"),
    change: (item) => item.click(),
    next: ["1"],
    shown: () => texts("[role=treeitem][aria-expanded=true]"),
    shows: ["src"],
    nothing: [],
    listener: "onExpandedChange",
    alone: ["src"],
  },
  {
    // Tree reports the item; the model is its id.
    name: "KozmosTree",
    model: "selectedId",
    props: { data: tree },
    start: "1",
    field: () => byText("[role=treeitem]", "b.ts"),
    change: (item) => item.click(),
    next: "3",
    shown: () => texts("[role=treeitem][aria-selected=true]"),
    shows: ["b.ts"],
    nothing: [],
    listener: "onSelectionChange",
    alone: ["b.ts"],
  },
  {
    // A phone-sized shell, so the sheet and its handle are drawn.
    name: "KozmosAdaptiveMapShell",
    model: "panelDetent",
    props: { panel: "Gate 4" },
    env: () => {
      const undo = [stub("clientWidth", 390), stub("clientHeight", 844)];
      return () => undo.forEach((step) => step());
    },
    start: "medium",
    field: () => $("[role=slider]"),
    change: (handle) => press(handle, "ArrowUp"),
    next: "large",
    shown: () => $("aside")?.getAttribute("data-detent"),
    shows: "Expanded",
    // Where it rests unless told: medium.
    nothing: "Half height",
    listener: "onPanelDetentChange",
    alone: "Expanded",
  },
];

const label = (part: Part) =>
  part.model
    ? `${part.name} v-model:${part.model}`
    : `${part.name}${part.props?.multiple ? " (multiple)" : ""}`;
const PARTS_BY = Object.fromEntries(
  PARTS.map((part) => [label(part), part]),
) as Record<string, Part>;

/**
 * Mounts a part from Vue, with `v-model` (`model` and its `update:` listener)
 * if asked, and a listener of the part's own if given.
 */
function mountPart(
  part: Part,
  {
    vModel,
    listener,
    start = part.start,
  }: { vModel?: boolean; listener?: () => void; start?: unknown },
) {
  const name = part.model ?? "modelValue";
  const model = ref(start);
  const emitted: unknown[] = [];
  const undo = part.env?.();
  if (undo) onTeardown.push(undo);
  mount(() =>
    h(Bridge[part.name] as Component, {
      ...part.props,
      ...(vModel && {
        [name]: model.value,
        [`onUpdate:${name}`]: (next: unknown) => {
          emitted.push(next);
          model.value = next;
        },
      }),
      ...(listener && { [part.listener]: listener }),
    }),
  );
  return { model, emitted };
}
const onTeardown: (() => void)[] = [];
afterEach(() => {
  while (onTeardown.length) onTeardown.pop()!();
});

describe("every wrapper with a v-model", () => {
  it("is in the table, with each of its models", () => {
    const named = Object.entries(Bridge).flatMap(([name, component]) =>
      Object.keys(
        (component && typeof component === "object" && modelsOf(component)) ||
          {},
      ).map((model) =>
        model === "modelValue" ? name : `${name} v-model:${model}`,
      ),
    );
    const listed = PARTS.filter((part) => !part.implicit).map((part) =>
      part.model ? `${part.name} v-model:${part.model}` : part.name,
    );
    expect([...new Set(listed)].sort()).toEqual(named.sort());
  });

  describe.each(PARTS.map((part) => [label(part), part] as const))(
    "%s",
    (_, part) => {
      const from = part.fromNothing ?? { next: part.next, shows: part.shows };

      it(`with v-model: the change reaches the model once, as ${JSON.stringify(part.next)}, never on mount, and the field shows it`, async () => {
        const { model, emitted } = mountPart(part, { vModel: true });
        const field = await until(part.field);
        await settle();
        expect(emitted).toEqual([]);
        await part.change(field);
        await settle();
        expect(emitted).toEqual([part.next]);
        expect(model.value).toEqual(part.next);
        expect(part.shown()).toEqual(part.shows);
      });

      it(`with v-model: its own ${part.listener} is called as well`, async () => {
        const listener = vi.fn();
        const { emitted } = mountPart(part, { vModel: true, listener });
        await part.change(await until(part.field));
        await settle();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([part.next]);
      });

      it(`without v-model: its own ${part.listener} is called`, async () => {
        const listener = vi.fn();
        mountPart(part, { listener });
        await part.change(await until(part.field));
        await settle();
        expect(listener).toHaveBeenCalledTimes(1);
      });

      if (part.alone !== undefined)
        it("without v-model: it keeps a value of its own, as on main", async () => {
          mountPart(part, {});
          await part.change(await until(part.field));
          await settle();
          expect(part.shown()).toEqual(part.alone);
        });

      it(`a model that starts null shows nothing (${JSON.stringify(part.nothing)}), and takes a change`, async () => {
        const { model, emitted } = mountPart(part, {
          vModel: true,
          start: null,
        });
        const field = await until(part.field);
        await settle();
        expect(part.shown()).toEqual(part.nothing);
        await part.change(field);
        await settle();
        expect(emitted).toEqual([from.next]);
        expect(model.value).toEqual(from.next);
        expect(part.shown()).toEqual(from.shows);
      });

      it("a model reset to null after a change shows nothing", async () => {
        const { model } = mountPart(part, { vModel: true, start: null });
        await part.change(await until(part.field));
        await settle();
        expect(part.shown()).toEqual(from.shows);
        model.value = null;
        await settle();
        expect(part.shown()).toEqual(part.nothing);
        model.value = part.start;
        await settle();
        model.value = undefined;
        await settle();
        expect(part.shown()).toEqual(part.nothing);
      });
    },
  );
});

// --------------------------------------------------------------------------
// Every controlled pair a React part has is a model of its wrapper. The
// pairs are read from React's built types, by the rule the Vue ports' API
// contract uses (decision 160: a prop with an `on…Change`, or `value` with
// Kozmos's own `onChange`, or a form field's value), and by its other
// sign, a `default…` beside the prop. So a pair a part gains fails here
// until its wrapper names a model for it.
// --------------------------------------------------------------------------

/** What React part each adapter in index.ts draws: its props are typed `any`. */
const ADAPTERS: Record<string, string> = {
  AvatarAdapter: "Avatar",
  AlertAdapter: "Alert",
  BackdropAdapter: "Backdrop",
  TourStepAdapter: "TourStep",
  AnchoredPopoverAdapter: "Popover",
};

/** Pairs that are not a value the visitor changes, each with why. */
const NOT_MODELS: Record<string, string> = {
  // The product's minimum padding; the callback reports the insets the
  // shell measured, which the product never sets back.
  "KozmosAdaptiveMapShell collisionInsets":
    "an input and a measurement, not a value",
};

/** Each `Kozmos*` export of index.ts, with the React export it wraps. */
function wrappedParts(): [string, string][] {
  const file = `${__dirname}/index.ts`;
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const imported = new Map<string, string>();
  const parts: [string, string][] = [];
  for (const node of source.statements) {
    if (
      ts.isImportDeclaration(node) &&
      (node.moduleSpecifier as ts.StringLiteral).text === "@kozmos-ds/react"
    )
      for (const element of (
        node.importClause!.namedBindings as ts.NamedImports
      ).elements)
        imported.set(
          element.name.text,
          (element.propertyName ?? element.name).text,
        );
    if (!ts.isVariableStatement(node)) continue;
    for (const declaration of node.declarationList.declarations) {
      const name = declaration.name.getText();
      if (!name.startsWith("Kozmos")) continue;
      let wrapped: string | null = null;
      declaration.forEachChild(function find(child): void {
        if (
          ts.isCallExpression(child) &&
          child.expression.getText() === "createVueWrapper"
        )
          wrapped = child.arguments[0].getText();
        else child.forEachChild(find);
      });
      if (wrapped)
        parts.push([name, imported.get(wrapped) ?? ADAPTERS[wrapped] ?? ""]);
    }
  }
  return parts;
}

describe("every controlled pair is a model", () => {
  const parts = wrappedParts();

  it("has a model for each pair each React part has", () => {
    // Every wrapper's React part is read, and every exception says why.
    expect(parts.length).toBeGreaterThan(90);
    expect(parts.filter(([, react]) => !react)).toEqual([]);
    for (const [pair, reason] of Object.entries(NOT_MODELS))
      expect(reason, pair).toMatch(/\w/);
    const side = reactSides();
    const missing: string[] = [];
    for (const [wrapper, react] of parts) {
      const reactSide = side(react);
      const props = new Set(reactSide.react.map((member) => member.name));
      // The contract's rule, as the Vue ports' models are found.
      const pairs = new Map(
        [
          ...planOf(reactSide as Parameters<typeof planOf>[0]).models.values(),
        ].map((model) => [model.react, model.change ?? "onChange"]),
      );
      // A prop with a `default…` beside it is controlled as well, whatever
      // reports its change (Tree's `selectedId`, by `onSelectionChange`).
      for (const prop of props) {
        const controlled = /^default([A-Z].*)$/.exec(prop)?.[1];
        const name =
          controlled && controlled[0].toLowerCase() + controlled.slice(1);
        if (name && props.has(name) && !pairs.has(name)) pairs.set(name, "");
      }
      const models = Object.values(
        modelsOf(Bridge[wrapper as keyof typeof Bridge] as object) ?? {},
      );
      for (const [prop, callback] of pairs) {
        if (NOT_MODELS[`${wrapper} ${prop}`]) continue;
        const covered =
          models.some(
            (model) =>
              model.prop === prop && (!callback || model.callback === callback),
          ) ||
          Object.values(RADIX_MODELS).some(
            (model) => model.prop === prop && model.callback === callback,
          );
        if (!covered)
          missing.push(`${wrapper}: ${prop}${callback ? `/${callback}` : ""}`);
      }
    }
    expect(missing).toEqual([]);
  }, 60_000);
});

// --------------------------------------------------------------------------
// What a query is, beside a value.
// --------------------------------------------------------------------------

describe("a typed query is not the value", () => {
  it("KozmosCombobox without v-model filters as you type", async () => {
    mount(() => h(Bridge.KozmosCombobox, { options: fruit, label: "Fruit" }));
    const input = await until(() => $<HTMLInputElement>("input"));
    input.focus();
    type(input, "Ap");
    await settle();
    expect(input.value).toBe("Ap");
    expect(texts("[role=option]")).toEqual(["Apple"]);
  });

  it("KozmosCombobox with v-model filters as you type, and emits only a choice", async () => {
    const { model, emitted } = mountPart(PARTS_BY.KozmosCombobox, {
      vModel: true,
    });
    const input = await until(() => $<HTMLInputElement>("input"));
    input.focus();
    type(input, "Ap");
    await settle();
    expect(input.value).toBe("Ap");
    expect(texts("[role=option]")).toEqual(["Apple"]);
    expect(emitted).toEqual([]);
    expect(model.value).toBe("banana");
  });

  it("KozmosMultiSelect with v-model filters as you type, and keeps its array", async () => {
    const { model, emitted } = mountPart(PARTS_BY.KozmosMultiSelect, {
      vModel: true,
    });
    const input = await until(() => $<HTMLInputElement>("input"));
    input.focus();
    type(input, "Ba");
    await settle();
    expect(texts("[role=option]")).toEqual(["Banana"]);
    expect(emitted).toEqual([]);
    expect(model.value).toEqual(["apple"]);
  });
});

// --------------------------------------------------------------------------
// The rest of each part's model: other changes, empty values, v-model:checked.
// --------------------------------------------------------------------------

describe("each model's other changes", () => {
  it("KozmosInput keeps its caret where the visitor typed", async () => {
    mountPart(PARTS_BY.KozmosInput, { vModel: true });
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    // "Ada" with an "n" typed after the "A".
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!;
    set!.call(input, "Anda");
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(input.value).toBe("Anda");
    expect(input.selectionStart).toBe(2);
  });

  it("KozmosInput shows the model when the parent refuses a change, or changes it", async () => {
    const value = ref("ADA");
    mount(() =>
      h(Bridge.KozmosInput, {
        modelValue: value.value,
        // Capitals only: anything else is refused.
        "onUpdate:modelValue": (next: string) => {
          if (/^[A-Za-z]*$/.test(next)) value.value = next.toUpperCase();
        },
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "ADA1");
    await settle();
    expect(input.value).toBe("ADA");
    type(input, "ADAl");
    await settle();
    expect(value.value).toBe("ADAL");
    expect(input.value).toBe("ADAL");
  });

  it("KozmosNumberInput's steppers emit a number, and a cleared field null", async () => {
    const { emitted } = mountPart(PARTS_BY.KozmosNumberInput, {
      vModel: true,
    });
    const input = await until(() => $<HTMLInputElement>("input"));
    $<HTMLButtonElement>("button[aria-label='Increase value']")!.click();
    await settle();
    expect(emitted).toEqual([2]);
    expect(input.value).toBe("2");
    type(input, "");
    await settle();
    expect(emitted).toEqual([2, null]);
    expect(input.value).toBe("");
  });

  it("KozmosSegmentedControl's choice taken back is undefined, and the control holds nothing", async () => {
    const { emitted } = mountPart(PARTS_BY.KozmosSegmentedControl, {
      vModel: true,
    });
    (await until(() => byText("[role=radio]", "Walk")))!.click();
    await settle();
    expect(emitted).toEqual([undefined]);
    expect($("[role=radio][aria-checked=true]")).toBeNull();
  });

  it("an empty model leaves a text field controlled", async () => {
    const value = ref<string | undefined>(undefined);
    mount(() =>
      h(Bridge.KozmosInput, {
        modelValue: value.value,
        "onUpdate:modelValue": (next: string) => (value.value = next),
      }),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "A");
    await settle();
    expect(value.value).toBe("A");
    expect(input.value).toBe("A");
  });

  it("KozmosCombobox chosen twice and reset to null shows nothing, not its first choice", async () => {
    const { model } = mountPart(PARTS_BY.KozmosCombobox, {
      vModel: true,
      start: null,
    });
    for (const label of ["Apple", "Banana"]) {
      const input = await until(() => $<HTMLInputElement>("input"));
      input.focus();
      type(input, label.slice(0, 2));
      (await until(() => byText("[role=option]", label)))!.click();
      await settle();
    }
    expect(model.value).toBe("banana");
    model.value = null;
    await settle();
    expect($<HTMLInputElement>("input")!.value).toBe("");
  });
});

// --------------------------------------------------------------------------
// The adapter itself, with a React part that records what it is given.
// --------------------------------------------------------------------------

describe("createVueWrapper's models", () => {
  let given: Record<string, unknown> = {};
  const Probe = (props: Record<string, unknown>) => {
    given = props;
    return null;
  };
  const Wrapper = createVueWrapper(Probe, {
    modelValue: { prop: "value", callback: "onValueChange", empty: "" },
  });

  it("gives React no callback while nobody listens", async () => {
    mount(() => h(Wrapper, { modelValue: "a" }));
    await settle();
    expect(given).toEqual({ value: "a" });
  });

  it("hears a listener by each name Vue's emit calls; with no value given, React keeps its own", async () => {
    for (const key of [
      "onUpdate:modelValue",
      "onUpdate:model-value",
      "onUpdate:modelValueOnce",
      "onUpdate:model-valueOnce",
    ]) {
      const listener = vi.fn();
      mount(() => h(Wrapper, { [key]: listener }));
      await settle();
      expect(given, key).not.toHaveProperty("value");
      (given.onValueChange as (value: string) => void)("b");
      expect(listener, key).toHaveBeenCalledWith("b");
      unmount();
    }
  });

  it("keeps the user's handler of the callback's name beside the model's", async () => {
    const listener = vi.fn();
    const own = vi.fn();
    mount(() =>
      h(Wrapper, {
        modelValue: "a",
        "onUpdate:modelValue": listener,
        onValueChange: own,
      }),
    );
    await settle();
    (given.onValueChange as (value: string) => void)("b");
    expect(own).toHaveBeenCalledWith("b");
    expect(listener).toHaveBeenCalledWith("b");
  });

  it("takes v-model:open and v-model:checked as Radix's pairs, beside the user's handlers", async () => {
    const opened = vi.fn();
    const ownOpen = vi.fn();
    const checked = vi.fn();
    mount(() =>
      h(createVueWrapper(Probe), {
        open: true,
        "onUpdate:open": opened,
        onOpenChange: ownOpen,
        checked: false,
        "onUpdate:checked": checked,
      }),
    );
    await settle();
    expect(given.open).toBe(true);
    expect(given.checked).toBe(false);
    expect(given).not.toHaveProperty("onUpdate:open");
    (given.onOpenChange as (value: boolean) => void)(false);
    (given.onCheckedChange as (value: boolean) => void)(true);
    expect(ownOpen).toHaveBeenCalledWith(false);
    expect(opened).toHaveBeenCalledWith(false);
    expect(checked).toHaveBeenCalledWith(true);
  });

  it("a wrapper with no model gives React neither modelValue nor its listener, and says so", async () => {
    const listener = vi.fn();
    mount(() =>
      h(createVueWrapper(Probe), {
        "model-value": "a",
        modelModifiers: { trim: true },
        "onUpdate:modelValue": listener,
        "onUpdate:pressed": listener,
        title: "kept",
      }),
    );
    await settle();
    expect(given).toEqual({ title: "kept" });
    expect(heard()).toEqual([
      expect.stringContaining(
        "Probe has no v-model: its value and listener are not given to React.",
      ),
      expect.stringContaining(
        "Probe has no v-model:pressed: its listener is not given to React.",
      ),
    ]);
  });

  it("KozmosBadge with v-model draws no modelvalue attribute, and says it has no v-model", async () => {
    mount(() =>
      h(
        Bridge.KozmosBadge,
        { id: "badge", modelValue: "a", "onUpdate:modelValue": () => {} },
        { default: () => "New" },
      ),
    );
    const badge = await until(() => $("[id=badge]"));
    await settle();
    expect(badge.getAttributeNames()).not.toContain("modelvalue");
    expect(heard()).toEqual([expect.stringContaining("Badge has no v-model")]);
  });
});

// --------------------------------------------------------------------------
// Every spelling of a model, as Vue's templates and render functions write
// it. The wrapper declares each model and its listeners as props, so Vue
// reads them all, and none reaches React as an attribute.
// --------------------------------------------------------------------------

describe("every spelling of a model", () => {
  /** A template, compiled at runtime as an SFC's is at build. */
  const page = (template: string, state: Record<string, unknown>) =>
    defineComponent({
      components: Bridge as Record<string, Component>,
      setup: () => state,
      template,
    });

  const name = ref("Bob");
  const spellings = {
    "h() camelCase": () =>
      h(Bridge.KozmosInput, {
        "aria-label": "Name",
        modelValue: name.value,
        "onUpdate:modelValue": (next: string) => (name.value = next),
      }),
    "h() kebab-case": () =>
      h(Bridge.KozmosInput, {
        "aria-label": "Name",
        "model-value": name.value,
        "onUpdate:model-value": (next: string) => (name.value = next),
      }),
    "h() kebab-case value, camelCase listener": () =>
      h(Bridge.KozmosInput, {
        "aria-label": "Name",
        "model-value": name.value,
        "onUpdate:modelValue": (next: string) => (name.value = next),
      }),
  };

  for (const [spelling, render] of Object.entries(spellings))
    it(`${spelling}: the field shows the model and takes a change`, async () => {
      name.value = "Bob";
      mount(render);
      const input = await until(() => $<HTMLInputElement>("input"));
      await settle();
      expect(input.value).toBe("Bob");
      type(input, "Bobby");
      await settle();
      expect(name.value).toBe("Bobby");
      expect(input.value).toBe("Bobby");
      expect(input.getAttributeNames()).toEqual(
        expect.not.arrayContaining(["model-value", "modelvalue"]),
      );
    });

  it("a template's :model-value and @update:model-value", async () => {
    const state = { name: ref("Bob") };
    mount(
      page(
        `<KozmosInput aria-label="Name" :model-value="name" @update:model-value="(next) => (name = next)" />`,
        state,
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    await settle();
    expect(input.value).toBe("Bob");
    type(input, "Bobby");
    await settle();
    expect(state.name.value).toBe("Bobby");
    expect(input.value).toBe("Bobby");
    expect(input.getAttributeNames()).not.toContain("model-value");
  });

  it("a template's v-model:origin-value on KozmosWayfindingInputRow", async () => {
    const state = { origin: ref("Entrance A") };
    mount(
      page(`<KozmosWayfindingInputRow v-model:origin-value="origin" />`, state),
    );
    const input = await until(() => $$<HTMLInputElement>("input")[0]);
    await settle();
    expect(input.value).toBe("Entrance A");
    type(input, "Gate 42");
    await settle();
    expect(state.origin.value).toBe("Gate 42");
    expect(input.value).toBe("Gate 42");
    expect(input.getAttributeNames()).not.toContain("origin-value");
  });

  it("@update:model-value.once is called once, beside v-model", async () => {
    const once = vi.fn();
    const state = { name: ref("Bob"), once };
    mount(
      page(
        `<KozmosInput aria-label="Name" v-model="name" @update:model-value.once="once" />`,
        state,
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Bobb");
    await settle();
    type(input, "Bobby");
    await settle();
    expect(state.name.value).toBe("Bobby");
    expect(once).toHaveBeenCalledTimes(1);
    expect(once).toHaveBeenCalledWith("Bobb");
  });

  it("@update:model-value.once alone is called once, and then the parent holds the model", async () => {
    const state = { name: ref("Bob") };
    mount(
      page(
        `<KozmosInput aria-label="Name" :model-value="name" @update:model-value.once="(next) => (name = next)" />`,
        state,
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Bobb");
    await settle();
    expect(state.name.value).toBe("Bobb");
    type(input, "Bobby");
    await settle();
    expect(state.name.value).toBe("Bobb");
    expect(input.value).toBe("Bobb");
  });
});

// --------------------------------------------------------------------------
// `.trim`, `.number` and `.lazy`, as `v-model` on an `<input>` takes them:
// the field keeps what was typed, the model gets the trimmed or numeric
// value, and the field shows the model's when it commits (`change`) or the
// parent sets another.
// --------------------------------------------------------------------------

describe("v-model's modifiers", () => {
  const page = (template: string, state: Record<string, unknown>) =>
    defineComponent({
      components: Bridge as Record<string, Component>,
      setup: () => state,
      template,
    });

  it(".trim: the field keeps a typed space, the model is trimmed, and a commit trims the field", async () => {
    const state = { name: ref("Ada") };
    mount(page(`<KozmosInput aria-label="Name" v-model.trim="name" />`, state));
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Ada ");
    await settle();
    expect(state.name.value).toBe("Ada");
    expect(input.value).toBe("Ada ");
    type(input, "Ada L ");
    await settle();
    expect(state.name.value).toBe("Ada L");
    expect(input.value).toBe("Ada L ");
    commit(input);
    await settle();
    expect(input.value).toBe("Ada L");
    state.name.value = "Grace";
    await settle();
    expect(input.value).toBe("Grace");
    expect(input.getAttributeNames()).not.toContain("modelmodifiers");
  });

  it(".trim on a named model, v-model:origin-value.trim", async () => {
    const state = { origin: ref("") };
    mount(
      page(
        `<KozmosWayfindingInputRow v-model:origin-value.trim="origin" />`,
        state,
      ),
    );
    const input = await until(() => $$<HTMLInputElement>("input")[0]);
    type(input, " Gate 4 ");
    await settle();
    expect(state.origin.value).toBe("Gate 4");
    expect(input.value).toBe(" Gate 4 ");
  });

  it(".number: the model is a number, and the field keeps what was typed", async () => {
    const state = { guests: ref<unknown>(1) };
    mount(
      page(
        `<KozmosInput aria-label="Guests" v-model.number="guests" />`,
        state,
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "42");
    await settle();
    expect(state.guests.value).toBe(42);
    type(input, "4.");
    await settle();
    expect(state.guests.value).toBe(4);
    expect(input.value).toBe("4.");
    commit(input);
    await settle();
    expect(input.value).toBe("4");
    type(input, "four");
    await settle();
    // What parseFloat cannot read stays as typed, as Vue's looseToNumber leaves it.
    expect(state.guests.value).toBe("four");
    expect(input.getAttributeNames()).not.toContain("modelmodifiers");
  });

  it(".lazy is passed on and does nothing, as on any component's v-model", async () => {
    const state = { name: ref("Ada") };
    mount(page(`<KozmosInput aria-label="Name" v-model.lazy="name" />`, state));
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Ada L");
    await settle();
    expect(state.name.value).toBe("Ada L");
    expect(input.getAttributeNames()).not.toContain("modelmodifiers");
  });
});

// --------------------------------------------------------------------------
// A handler given as an array: Vue merges a parent's and a root component's
// listeners of one name into one, `[inner, outer]`, and calls each.
// --------------------------------------------------------------------------

describe("handlers given as an array", () => {
  it("KozmosInput's @change and @update:model-value, each an array, call every handler once", async () => {
    const inner = vi.fn();
    const outer = vi.fn();
    const first = vi.fn();
    const value = ref("Ada");
    mount(() =>
      h(
        Bridge.KozmosInput,
        mergeProps(
          {
            "aria-label": "Name",
            modelValue: value.value,
            onChange: inner,
            "onUpdate:modelValue": first,
          },
          {
            onChange: outer,
            "onUpdate:modelValue": (next: string) => (value.value = next),
          },
        ),
      ),
    );
    const input = await until(() => $<HTMLInputElement>("input"));
    type(input, "Ada L");
    await settle();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith("Ada L");
    expect(value.value).toBe("Ada L");
    expect(input.value).toBe("Ada L");
  });

  it("KozmosCombobox's @value-change as an array, beside v-model", async () => {
    const inner = vi.fn();
    const outer = vi.fn();
    const { emitted } = mountPart(
      {
        ...PARTS_BY.KozmosCombobox,
        props: {
          ...PARTS_BY.KozmosCombobox.props,
          onValueChange: [inner, outer],
        },
      },
      { vModel: true },
    );
    await PARTS_BY.KozmosCombobox.change(await until(() => $("input")));
    await settle();
    // Combobox reports the option beside its value.
    expect(inner).toHaveBeenCalledWith("apple", fruit[0]);
    expect(outer).toHaveBeenCalledWith("apple", fruit[0]);
    expect(emitted).toEqual(["apple"]);
  });
});

// --------------------------------------------------------------------------
// A listener added or taken away after mount. The model's listeners are
// declared as props, not `emits`: Vue leaves a declared event's listener out
// of what it compares, so a wrapper whose listener came or went alone was
// never drawn again, and React kept the callback it had.
// --------------------------------------------------------------------------

describe("a listener that comes and goes after mount", () => {
  /** A Listbox bound to "apple", with the listener `listeners` gives it now. */
  const listbox = (
    listeners: (listen: (next: string) => void) => Record<string, unknown>,
  ) => {
    const value = ref("apple");
    const emitted: unknown[] = [];
    const listen = (next: string) => {
      emitted.push(next);
      value.value = next;
    };
    mount(() =>
      h(Bridge.KozmosListbox, {
        options: fruit,
        "aria-label": "Fruit",
        modelValue: value.value,
        ...listeners(listen),
      }),
    );
    return { value, emitted };
  };
  const choose = async (label: string) => {
    (await until(() => byText("[role=option]", label)))!.click();
    await settle();
  };
  const chosen = () => texts("[role=option][aria-selected=true]");

  it("as a key that is there or not", async () => {
    const listening = ref(false);
    const { emitted } = listbox((listen) =>
      listening.value ? { "onUpdate:modelValue": listen } : {},
    );
    await choose("Banana");
    expect(emitted).toEqual([]);
    expect(chosen()).toEqual(["Apple"]);
    listening.value = true;
    await settle();
    await choose("Banana");
    expect(emitted).toEqual(["banana"]);
    expect(chosen()).toEqual(["Banana"]);
    listening.value = false;
    await settle();
    await choose("Cherry");
    expect(emitted).toEqual(["banana"]);
    expect(chosen()).toEqual(["Banana"]);
  });

  // The key stays; only its value changes. Under `emits`, Vue skipped the
  // wrapper for the camelCase key, the one templates compile to.
  for (const key of ["onUpdate:modelValue", "onUpdate:model-value"])
    it(`as \`"${key}": listening ? fn : undefined\``, async () => {
      const listening = ref(false);
      const { emitted } = listbox((listen) => ({
        [key]: listening.value ? listen : undefined,
      }));
      await choose("Banana");
      expect(emitted).toEqual([]);
      listening.value = true;
      await settle();
      await choose("Banana");
      expect(emitted).toEqual(["banana"]);
      listening.value = false;
      await settle();
      await choose("Cherry");
      expect(emitted).toEqual(["banana"]);
      expect(chosen()).toEqual(["Banana"]);
    });

  for (const event of ["update:modelValue", "update:model-value"])
    it(`as a template's v-on="listening ? { '${event}': listen } : {}"`, async () => {
      const state = {
        fruit,
        value: ref("apple"),
        listening: ref(false),
        emitted: [] as string[],
      };
      mount(
        defineComponent({
          components: { KozmosListbox: Bridge.KozmosListbox },
          setup: () => ({
            ...state,
            listen: (next: string) => {
              state.emitted.push(next);
              state.value.value = next;
            },
          }),
          template: `<KozmosListbox :options="fruit" aria-label="Fruit" :model-value="value" v-on="listening ? { '${event}': listen } : {}" />`,
        }),
      );
      await choose("Banana");
      expect(state.emitted).toEqual([]);
      state.listening.value = true;
      await nextTick();
      await settle();
      await choose("Banana");
      expect(state.emitted).toEqual(["banana"]);
      state.listening.value = false;
      await settle();
      await choose("Cherry");
      expect(state.emitted).toEqual(["banana"]);
    });
});

// --------------------------------------------------------------------------
// Attributes are React's alone. Vue also wrote each onto the wrapper's own
// box (`display: contents`): an id was in the page twice, an aria-label and
// a class sat on a box that draws nothing, and `@click` was a listener there
// as well as React's, so one click ran it twice. A `style` string reached
// React as a string, which React refuses.
// --------------------------------------------------------------------------

describe("attributes reach React alone", () => {
  it("every Kozmos* wrapper hands its attrs to React only", () => {
    const inherits = Object.entries(Bridge)
      .filter(([name]) => name.startsWith("Kozmos"))
      .filter(
        ([, component]) =>
          (component as { inheritAttrs?: boolean }).inheritAttrs !== false,
      )
      .map(([name]) => name);
    expect(inherits).toEqual([]);
  });

  // One part of each kind, as React draws its attributes: the property
  // above holds for every wrapper, and these show what React does with them.
  const KINDS: {
    name: keyof typeof Bridge;
    kind: string;
    props?: Record<string, unknown>;
    slot?: string;
  }[] = [
    { name: "KozmosBadge", kind: "a plain element", slot: "New" },
    { name: "KozmosCard", kind: "a box drawing a Vue slot", slot: "Gate 4" },
    {
      name: "KozmosAlert",
      kind: "an adapter of several React parts",
      props: { title: "Saved" },
    },
    {
      name: "KozmosLink",
      kind: "a wrapper with props declared",
      props: { href: "#gate" },
      slot: "Gate",
    },
    { name: "KozmosInput", kind: "a field, its <input> React's element" },
    {
      name: "KozmosSearchBar",
      kind: "a field with a model, inside a row of its own",
    },
    { name: "KozmosCheckbox", kind: "a Radix part with a model" },
  ];

  // Every element with the id. jsdom reads `#probe` through getElementById,
  // which finds one, the first, however many carry it.
  const PROBE = "[id=probe]";

  /**
   * The wrapper's own boxes, which draw nothing, and the element React drew
   * with the id inside the second of them, the box React draws in.
   */
  async function drawnByReact(host: HTMLElement) {
    const [own] = host.children;
    const [container] = own.children;
    const element = await until(() =>
      container.querySelector<HTMLElement>(PROBE),
    );
    await settle();
    return { boxes: [own, container], element };
  }

  describe.each(KINDS.map((part) => [part.name, part.kind, part] as const))(
    "%s, %s",
    (_, __, part) => {
      it("draws its id once; class, aria-* and data-* on React's element only; style; one click heard once", async () => {
        const onClick = vi.fn();
        const host = mount(() =>
          h(
            Bridge[part.name] as Component,
            {
              ...part.props,
              id: "probe",
              class: "probe",
              "aria-label": "Probe",
              "data-testid": "probe",
              // An object, which React took before as well: a string is
              // the test below.
              style: { color: "rgb(255, 0, 0)", "--probe-gap": "4px" },
              onClick,
            },
            part.slot ? { default: () => part.slot } : undefined,
          ),
        );
        const { boxes, element } = await drawnByReact(host);
        element.click();
        await settle();
        // Each is said, so a run shows every way the part goes wrong.
        expect.soft(onClick).toHaveBeenCalledTimes(1);
        expect.soft($$(PROBE)).toHaveLength(1);
        expect.soft($$(".probe")).toEqual([element]);
        expect.soft($$("[aria-label=Probe]")).toEqual([element]);
        expect.soft($$("[data-testid=probe]")).toEqual([element]);
        for (const box of boxes)
          expect.soft(box.getAttributeNames()).toEqual(["style"]);
        expect.soft(element.style.color).toBe("rgb(255, 0, 0)");
        expect.soft(element.style.getPropertyValue("--probe-gap")).toBe("4px");
      });
    },
  );

  // Each with a kebab-case name of its own: React warns of one only once a
  // run, so a name the cases shared would be heard in the first alone.
  it.each([
    [
      "a string",
      "color: rgb(255, 0, 0); background-color: rgb(0, 0, 255)",
      "backgroundColor",
    ],
    [
      "an object",
      { color: "rgb(255, 0, 0)", "border-top-color": "rgb(0, 0, 255)" },
      "borderTopColor",
    ],
    [
      "an array",
      ["outline-color: rgb(0, 0, 255)", { color: "rgb(255, 0, 0)" }],
      "outlineColor",
    ],
  ] as const)("takes style as %s", async (_, style, name) => {
    const host = mount(() =>
      h(Bridge.KozmosBadge, { id: "probe", style }, { default: () => "New" }),
    );
    const { element } = await drawnByReact(host);
    expect(element.style.color).toBe("rgb(255, 0, 0)");
    expect(element.style[name]).toBe("rgb(0, 0, 255)");
  });

  it("keeps a declaration given !important, without it, and says so", async () => {
    const host = mount(() =>
      h(
        Bridge.KozmosBadge,
        {
          id: "probe",
          style:
            "color: rgb(255, 0, 0) !important; column-rule-color: rgb(0, 0, 255)",
        },
        { default: () => "New" },
      ),
    );
    const { element } = await drawnByReact(host);
    expect(element.style.color).toBe("rgb(255, 0, 0)");
    expect(element.style.columnRuleColor).toBe("rgb(0, 0, 255)");
    expect(heard()).toEqual([
      expect.stringContaining(
        "Badge's style color is given to React without !important",
      ),
    ]);
  });
});
