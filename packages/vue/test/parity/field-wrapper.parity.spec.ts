// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosThemeProvider,
  KozmosFieldWrapper,
  KozmosInput,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's FieldWrapper stories draw with their own render, so the stories
 * parity check cannot draw them from args: here each is, drawn in both,
 * with the field's edges (a group, a hidden label, optional words or an
 * action at the label's end, a count beside a message or alone, mixed and
 * its reset). Then, mounted, the reset: focus goes to the field `input-id`
 * names, then `resetMixed` is heard, as React's onResetMixed.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const placeholder = (): Drawn => ({
  react: KozmosReact.Input,
  vue: KozmosInput,
  props: { placeholder: "Placeholder" },
});
/** React's node props are Vue's slots of the same name. */
const SLOTS = ["description", "labelAction", "count"];
const field = (
  props: Record<string, unknown>,
  children: (Drawn | string)[] = [placeholder()],
): Drawn => {
  const vueProps: Record<string, unknown> = {};
  const vueSlots: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    if (SLOTS.includes(key)) vueSlots[key] = String(value);
    else vueProps[key === "className" ? "class" : key] = value;
  }
  return {
    react: KozmosReact.FieldWrapper,
    vue: KozmosFieldWrapper,
    props,
    vueProps,
    vueSlots,
    children,
  };
};

describe("KozmosFieldWrapper draws what React's FieldWrapper draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        field({
          description: "Use supporting guidance when the field needs it.",
          helperText: "Helper text",
          label: "Label",
          required: true,
          status: "default",
          className: "w-80",
        }),
      ),
    );
    expect(react).toContain('data-slot="required-mark"');
    expect(vue).toBe(react);
  });

  it("ValidationStates: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme({
        react: "div",
        vue: "div",
        props: { className: "grid w-80 gap-5" },
        vueProps: { class: "grid w-80 gap-5" },
        children: [
          field({
            label: "Default",
            helperText: "Helper text",
            status: "default",
          }),
          field({ label: "Error", error: "This field is required." }),
          field({
            label: "Warning",
            helperText: "Check this value.",
            status: "warning",
          }),
          field({
            label: "Success",
            helperText: "Looks good.",
            status: "success",
          }),
        ],
      }),
    );
    expect(react).toContain('role="alert"');
    expect(vue).toBe(react);
  });

  it("draws what React's FieldWrapper draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(field({ label: "Name", inputId: "name" })),
      { keepIds: ["name"] },
    );
    expect(react).toContain('for="name"');
    expect(vue).toBe(react);
  });

  it.each([
    ["a group of controls", { label: "Days", group: true }],
    ["a group with no label", { group: true }],
    ["a hidden label", { label: "Name", hideLabel: true, required: true }],
    ["optional words", { label: "Name", optionalText: "Optional" }],
    [
      "no optional words when required",
      { label: "Name", optionalText: "Optional", required: true },
    ],
    [
      "an action at the label's end",
      { label: "Name", labelAction: "Edit", optionalText: "Optional" },
    ],
    [
      "a description with its id",
      { label: "Name", description: "Shown on the map", descriptionId: "desc" },
    ],
    ["a boolean error", { label: "Name", error: true, helperText: "Helper" }],
    ["an empty error", { label: "Name", error: "", helperText: "Helper" }],
    ["a count alone", { label: "Name", count: "4/512", countId: "count" }],
    [
      "a count beside a message",
      { label: "Name", count: "4/512", error: "Too short", errorId: "err" },
    ],
    [
      "mixed, its words hidden",
      { label: "Name", mixed: true, mixedId: "mixed" },
    ],
    [
      "mixed in the caller's words",
      { label: "Name", mixed: true, mixedId: "mixed", mixedLabel: "Several" },
    ],
    ["mixed with no id, drawing none", { label: "Name", mixed: true }],
    [
      "an app's role over the group's",
      { label: "Days", group: true, role: "radiogroup" },
    ],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await renderBoth(inTheme(field(props)), {
      keepIds: ["desc", "count", "err", "mixed"],
    });
    expect(vue).toBe(react);
  });

  it.each([
    ["its reset, not mixed", {}],
    ["its reset in the caller's words", { resetMixedLabel: "Undo" }],
    ["no reset while mixed", { mixed: true }],
  ] as const)("%s", async (_name, props) => {
    const given = {
      label: "Name",
      inputId: "name",
      onResetMixed: () => {},
      ...props,
    };
    const { react, vue } = await renderBoth(inTheme(field(given)), {
      keepIds: ["name"],
    });
    expect(vue).toBe(react);
  });
});

describe("KozmosFieldWrapper's reset, mounted", () => {
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

  it("resetMixed fires as React's onResetMixed, after focus goes to the field", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.ThemeProvider,
          null,
          React.createElement(
            KozmosReact.FieldWrapper,
            {
              label: "Name",
              inputId: "react-name",
              onResetMixed: () =>
                heard.react.push(`focus on ${document.activeElement?.id}`),
            },
            React.createElement("input", { id: "react-name" }),
          ),
        ),
      ),
    );
    act(() =>
      reactHost
        .querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]')!
        .click(),
    );

    const mixed = ref(false);
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosThemeProvider, null, {
          default: () =>
            h(
              KozmosFieldWrapper,
              {
                label: "Name",
                inputId: "vue-name",
                mixed: mixed.value,
                onResetMixed: () => {
                  heard.vue.push(`focus on ${document.activeElement?.id}`);
                  mixed.value = true;
                },
              },
              { default: () => h("input", { id: "vue-name" }) },
            ),
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    vueHost
      .querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]')!
      .click();
    await nextTick();
    expect(heard.react).toEqual(["focus on react-name"]);
    expect(heard.vue).toEqual(["focus on vue-name"]);
    // Mixed again, the reset goes.
    expect(vueHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
  });

  it("draws no reset with nothing listening", async () => {
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosFieldWrapper, { label: "Name" }, { default: () => h("input") }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    expect(vueHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
  });
});
