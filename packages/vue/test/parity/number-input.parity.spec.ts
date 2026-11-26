// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosThemeProvider, KozmosNumberInput } from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's NumberInput stories draw with their own render, so the stories
 * parity check cannot draw them from args: here each is, drawn in both,
 * with the field's edges (a unit and its spoken name, a wide unit, mixed,
 * read only, disabled). Then, mounted, what a server render cannot show:
 * the steppers and typing emit the number, a cleared field null, as
 * React's onValueChange, a mixed field's typing and its reset.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** React's props, and Vue's: `value` is `modelValue`, `readOnly` `readonly`. */
const number = (props: Record<string, unknown>): Drawn => {
  const vueProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "onValueChange") vueProps["onUpdate:modelValue"] = value;
    else
      vueProps[
        key === "className"
          ? "class"
          : key === "value"
            ? "modelValue"
            : key === "readOnly"
              ? "readonly"
              : key
      ] = value;
  }
  return {
    react: KozmosReact.NumberInput,
    vue: KozmosNumberInput,
    props,
    vueProps,
  };
};
const box = (
  className: string | null,
  style: Record<string, string> | null,
  ...children: Drawn[]
): Drawn => ({
  react: "div",
  vue: "div",
  props: {
    ...(className ? { className } : {}),
    ...(style ? { style: { width: 220 } } : {}),
  },
  vueProps: {
    ...(className ? { class: className } : {}),
    ...(style ? { style } : {}),
  },
  children,
});
const inTheme = (
  props: Record<string, unknown> | null,
  ...children: Drawn[]
): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  props: props ?? undefined,
  children,
});
const RTL = { dir: "rtl", theme: "light" };
const NARROW = { width: "220px" };

describe("KozmosNumberInput draws what React's NumberInput draws", () => {
  const each = [
    [
      "Default",
      inTheme(
        null,
        box(
          "w-80",
          null,
          number({ defaultValue: 3, label: "Floors", min: 0, step: 1 }),
        ),
      ),
    ],
    [
      "WithHelperText",
      inTheme(
        null,
        box(
          "w-80",
          null,
          number({
            defaultValue: 12,
            helperText: "Use a whole number.",
            label: "Capacity",
            min: 0,
          }),
        ),
      ),
    ],
    [
      "ValidationStates",
      inTheme(
        null,
        box(
          "grid w-80 gap-4",
          null,
          number({
            defaultValue: 8,
            helperText: "Default numeric field.",
            label: "Default",
          }),
          number({
            defaultValue: 2,
            helperText: "Check the selected value.",
            label: "Warning",
            status: "warning",
          }),
          number({
            defaultValue: 16,
            helperText: "Value is available.",
            label: "Success",
            status: "success",
          }),
          number({
            error: "Enter a value between 1 and 10.",
            label: "Error",
            min: 1,
            max: 10,
          }),
        ),
      ),
    ],
    [
      "WithoutSteppers",
      inTheme(
        null,
        box(
          "w-80",
          null,
          number({ defaultValue: 24, label: "Radius", showSteppers: false }),
        ),
      ),
    ],
    [
      "WithUnit",
      inTheme(
        null,
        box(
          "grid w-80 gap-4",
          null,
          number({
            defaultValue: 15,
            label: "Width",
            min: 0,
            unit: "m",
            unitLabel: "metres",
          }),
          number({
            defaultValue: 20,
            label: "Height",
            min: 0,
            showSteppers: false,
            unit: "m",
            unitLabel: "metres",
          }),
        ),
      ),
    ],
    [
      "WithUnitRightToLeft",
      inTheme(
        RTL,
        box(
          "grid gap-4",
          NARROW,
          number({ label: "Width", defaultValue: 15, unit: "m" }),
          number({
            label: "Height",
            defaultValue: 20,
            showSteppers: false,
            unit: "m",
          }),
        ),
      ),
    ],
    [
      "RightToLeft",
      inTheme(
        RTL,
        box(
          null,
          NARROW,
          number({
            label: "Floors",
            defaultValue: 3,
            status: "warning",
            helperText: "Narrow RTL field",
          }),
        ),
      ),
    ],
    [
      "MixedValue",
      inTheme(
        null,
        box(
          "grid w-80 gap-4",
          null,
          number({
            label: "Height (m)",
            min: 0,
            mixed: true,
            value: "",
            onValueChange: () => {},
            onResetMixed: () => {},
          }),
          number({
            label: "Capacity",
            min: 0,
            mixed: false,
            value: 12,
            onValueChange: () => {},
            onResetMixed: () => {},
          }),
        ),
      ),
    ],
  ] as const;
  it.each(each)("%s: draws what React's story draws", async (_name, tree) => {
    const { react, vue } = await renderBoth(tree as Drawn);
    expect(react).toContain('type="number"');
    expect(vue).toBe(react);
  });

  it("draws what React's NumberInput draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(null, number({ label: "Floors", defaultValue: 3 })),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["read only, controlled", { value: 3, readOnly: true }],
    ["disabled, with a unit", { defaultValue: 3, disabled: true, unit: "%" }],
    [
      "a wide unit, before it is measured",
      { defaultValue: 30, unit: "平方米" },
    ],
    [
      "a long unit, before it is measured",
      { defaultValue: 30, unit: "km/h", unitLabel: "kilometres an hour" },
    ],
    [
      "a caller's description beside the unit",
      { defaultValue: 3, unit: "m", "aria-describedby": "hint" },
    ],
    ["a boolean error", { error: true }],
    [
      "mixed in the caller's words",
      { mixed: true, mixedLabel: "Several", defaultValue: 4 },
    ],
    [
      "mixed, its reset never drawn",
      {
        mixed: true,
        value: "",
        onValueChange: () => {},
        onResetMixed: () => {},
      },
    ],
    [
      "no reset while read only",
      {
        value: 3,
        readOnly: true,
        onValueChange: () => {},
        onResetMixed: () => {},
      },
    ],
    [
      "a wrapper class and its own class",
      { wrapperClassName: "mt-4", className: "text-end" },
    ],
  ] as const)("%s", async (_name, given) => {
    const { react, vue } = await renderBoth(
      inTheme(null, number({ label: "Floors", ...given })),
      { keepIds: ["hint"] },
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosNumberInput, mounted", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
  };
  const mountVue = async (render: () => ReturnType<typeof h>) => {
    const at = host();
    vueApp = createApp({
      render: () => h(KozmosThemeProvider, null, { default: render }),
    });
    vueApp.mount(at);
    await nextTick();
    return at;
  };
  const press = (at: HTMLElement, name: string) =>
    at
      .querySelector<HTMLButtonElement>(`button[aria-label='${name}']`)!
      .click();
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };

  it("update:modelValue hears what React's onValueChange hears: steps, a typed number, a cleared field", async () => {
    const heard = {
      react: [] as (number | null)[],
      vue: [] as (number | null)[],
    };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.NumberInput, {
          "aria-label": "Floors",
          defaultValue: 3,
          min: 0,
          onValueChange: (value: number | null) => heard.react.push(value),
        }),
      ),
    );
    act(() => press(reactHost, "Increase value"));
    act(() => press(reactHost, "Decrease value"));
    act(() => press(reactHost, "Decrease value"));
    const reactField = reactHost.querySelector("input")!;
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!;
    for (const text of ["7", ""])
      act(() => {
        set!.call(reactField, text);
        reactField.dispatchEvent(new Event("input", { bubbles: true }));
      });

    const vueHost = await mountVue(() =>
      h(KozmosNumberInput, {
        "aria-label": "Floors",
        defaultValue: 3,
        min: 0,
        "onUpdate:modelValue": (value: number | null) => heard.vue.push(value),
      }),
    );
    const field = vueHost.querySelector("input")!;
    press(vueHost, "Increase value");
    await nextTick();
    expect(field.value).toBe("4");
    press(vueHost, "Decrease value");
    await nextTick();
    press(vueHost, "Decrease value");
    await nextTick();
    expect(field.value).toBe("2");
    type(field, "7");
    await nextTick();
    type(field, "");
    await nextTick();
    expect(heard.react).toEqual([4, 3, 2, 7, null]);
    expect(heard.vue).toEqual(heard.react);
  });

  it("a controlled field shows a step only once the parent takes it", async () => {
    const value = ref<number | null>(3);
    const asked: (number | null)[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosNumberInput, {
        "aria-label": "Floors",
        modelValue: value.value,
        "onUpdate:modelValue": (next: number | null) => asked.push(next),
      }),
    );
    const field = vueHost.querySelector("input")!;
    press(vueHost, "Increase value");
    await nextTick();
    expect(asked).toEqual([4]);
    expect(field.value).toBe("3");
    value.value = 4;
    await nextTick();
    expect(field.value).toBe("4");
  });

  it('step="any" steps by 1, keeping the value\'s decimals (GAP-257)', async () => {
    const heard: (number | null)[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosNumberInput, {
        "aria-label": "Height",
        step: "any",
        defaultValue: 2.5,
        max: 4,
        "onUpdate:modelValue": (value: number | null) => heard.push(value),
      }),
    );
    press(vueHost, "Increase value");
    await nextTick();
    press(vueHost, "Increase value");
    await nextTick();
    expect(heard).toEqual([3.5, 4]);
  });

  it("disabled and read-only fields' steppers are disabled", async () => {
    const vueHost = await mountVue(() =>
      h("div", [
        h(KozmosNumberInput, { "aria-label": "A", disabled: true }),
        h(KozmosNumberInput, { "aria-label": "B", readonly: true }),
      ]),
    );
    const buttons = [...vueHost.querySelectorAll("button")];
    expect(buttons).toHaveLength(4);
    expect(buttons.every((button) => button.disabled)).toBe(true);
  });

  it("mixed: a text field whose steppers wait, a typed number edits it, and the reset takes it back", async () => {
    const edit = ref<number | null | undefined>(undefined);
    const reset: string[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosNumberInput, {
        id: "height",
        label: "Height",
        min: 0,
        mixed: edit.value === undefined,
        modelValue: edit.value ?? "",
        "onUpdate:modelValue": (next: number | null) => (edit.value = next),
        onResetMixed: () => {
          reset.push(`focus on ${document.activeElement?.id}`);
          edit.value = undefined;
        },
      }),
    );
    const field = vueHost.querySelector("input")!;
    expect(field.type).toBe("text");
    expect(field.getAttribute("inputmode")).toBe("decimal");
    expect(field.placeholder).toBe("Multiple values");
    expect(vueHost.querySelector<HTMLButtonElement>("button")!.disabled).toBe(
      true,
    );
    // "-" says no number yet: the product keeps every feature's own.
    type(field, "-");
    await nextTick();
    expect(edit.value).toBeUndefined();
    type(field, "-5");
    await nextTick();
    expect(edit.value).toBe(-5);
    // Still a text field, holding what was typed, until it loses focus.
    expect(field.type).toBe("text");
    expect(field.value).toBe("-5");
    field.dispatchEvent(new Event("blur"));
    await nextTick();
    expect(field.type).toBe("number");
    expect(field.value).toBe("-5");
    vueHost
      .querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]')!
      .click();
    await nextTick();
    expect(reset).toEqual(["focus on height"]);
    expect(field.value).toBe("");
    expect(field.type).toBe("text");
  });
});
