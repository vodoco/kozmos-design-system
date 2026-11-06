// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createApp, h, ref, type App, type Component } from "vue";
import React from "react";
import { RadioGroupItem } from "@kozmos-ds/react";
import * as Bridge from "./index";
import { createVueWrapper } from "./react-adapter";

// v-model and attributes through the React bridge (react-adapter.ts); the
// attributes are at the end. Each wrapper names
// its models: React's prop for the value, and the callback that reports a
// change. While the parent listens, React is given that callback, beside any
// handler of its name the user gave; while nobody listens, it is given
// nothing, and the part keeps the state it has of its own.
//
// Until then, a wrapper declared `update:modelValue`, and Vue keeps a
// declared event's listener out of `attrs`, so React never heard of it:
// v-model changed nothing, and a controlled field took its old value back.
// The first fix (#488's) handed React an emitter for every declared event,
// read through DOM `onChange` as well: it took Combobox's own `onChange`,
// so typing stopped filtering, typed MultiSelect's array into a string, and
// dropped a user's `@change`.

beforeAll(() => {
  // Radix measures through ResizeObserver, which jsdom does not have.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

async function until<T>(read: () => T | null | undefined | false) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("timed out");
}

/** Lets React and Vue finish what a change started. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

/** Types into a field React controls, as a browser's input event does. */
function type(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const { set } = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(field),
    "value",
  )!;
  set!.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Chooses files in a file input, as the browser's picker does. */
function choose(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const press = (element: Element, key: string) =>
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

const $ = <E extends Element = HTMLElement>(selector: string) =>
  document.querySelector<E>(selector);
const $$ = <E extends Element = HTMLElement>(selector: string) => [
  ...document.querySelectorAll<E>(selector),
];
const byText = (selector: string, text: string) =>
  $$(selector).find((element) => element.textContent?.trim() === text);
const texts = (selector: string) =>
  $$(selector).map((element) => element.textContent?.trim());

// Whatever React, Radix or Vue says fails the test that made it say it: an
// unknown event handler on a DOM element, a field switching between
// controlled and uncontrolled, a value React cannot take. One thing is said
// that is not about the bridge:
const UNRELATED = [
  // Analytics with no provider, once per run, at the first tracked change.
  /No <AnalyticsProvider> found/,
];
let said: string[] = [];
beforeEach(() => {
  said = [];
  for (const level of ["error", "warn"] as const)
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      const text = `console.${level}: ${args.map(String).join(" ")}`;
      if (!UNRELATED.some((pattern) => pattern.test(text))) said.push(text);
    });
});

let app: App | null = null;
afterEach(() => {
  app?.unmount();
  app = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  expect(said).toEqual([]);
});

function mount(render: () => ReturnType<typeof h>) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({ setup: () => render });
  app.mount(host);
  return host;
}

const fruit = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];
const plan = new File(["%PDF"], "plan.pdf", { type: "application/pdf" });

// --------------------------------------------------------------------------
// Every wrapper with a v-model, and how a visitor changes it.
// --------------------------------------------------------------------------

interface Part {
  /** The bridge's export. */
  name: keyof typeof Bridge;
  /** The model, as Vue names it: `modelValue` is `v-model`. */
  model?: string;
  /** What the part needs to draw. */
  props?: Record<string, unknown>;
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
  /** The part's own callback for the change, which a user may listen to as well. */
  listener: string;
  /**
   * What it shows after the change without v-model, for a part with a value
   * of its own. Unset for one the product always controls (Rating,
   * FloorSelector), which draws what it is given.
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
    listener: "onValueChange",
    alone: "#abc",
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
        React.createElement(RadioGroupItem, {
          key: value,
          value,
          label: value,
        }),
      ),
    },
    start: "walk",
    field: () => $("[role=radio][value=drive]"),
    change: (radio) => radio.click(),
    next: "drive",
    shown: () => $("[role=radio][aria-checked=true]")?.getAttribute("value"),
    shows: "drive",
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
    listener: "onValueChange",
    alone: "Apple",
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
    listener: "onValueChange",
    alone: ["Banana"],
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
    listener: "onDestinationChange",
    alone: "Lounge",
  },
];

const PARTS_BY = Object.fromEntries(
  PARTS.filter((part) => !part.model).map((part) => [part.name, part]),
) as Record<string, Part>;

/**
 * Mounts a part from Vue, with `v-model` (`model` and its `update:` listener)
 * if asked, and a listener of the part's own if given.
 */
function mountPart(
  part: Part,
  { vModel, listener }: { vModel?: boolean; listener?: () => void },
) {
  const name = part.model ?? "modelValue";
  const model = ref(part.start);
  const emitted: unknown[] = [];
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

const label = (part: Part) =>
  part.model ? `${part.name} v-model:${part.model}` : part.name;

describe("every wrapper with a v-model", () => {
  it("is in the table, with each of its models", () => {
    const declared = Object.entries(Bridge).flatMap(([name, component]) => {
      const emits = (component as { emits?: unknown }).emits;
      return Array.isArray(emits)
        ? emits.map((event: string) =>
            event === "update:modelValue"
              ? name
              : `${name} v-model:${event.slice("update:".length)}`,
          )
        : [];
    });
    expect(PARTS.map(label).sort()).toEqual(declared.sort());
  });

  describe.each(PARTS.map((part) => [label(part), part] as const))(
    "%s",
    (_, part) => {
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
    },
  );
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

  for (const name of ["KozmosCheckbox", "KozmosSwitch"] as const)
    it(`${name} takes v-model:checked as well`, async () => {
      const checked = ref(false);
      const emitted: unknown[] = [];
      mount(() =>
        h(Bridge[name], {
          "aria-label": "Option",
          checked: checked.value,
          "onUpdate:checked": (next: boolean) => {
            emitted.push(next);
            checked.value = next;
          },
        }),
      );
      const control = await until(() => $("button"));
      control.click();
      await settle();
      expect(emitted).toEqual([true]);
      expect(control.getAttribute("aria-checked")).toBe("true");
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

  it("hears a listener by each name Vue's emit calls", async () => {
    for (const key of ["onUpdate:modelValue", "onUpdate:model-value"]) {
      const listener = vi.fn();
      mount(() => h(Wrapper, { [key]: listener }));
      await settle();
      expect(given.value, key).toBe("");
      (given.onValueChange as (value: string) => void)("b");
      expect(listener, key).toHaveBeenCalledWith("b");
      app!.unmount();
      app = null;
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
});
