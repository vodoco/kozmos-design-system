// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, defineComponent, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosThemeProvider,
  KozmosOTPInput,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's OTPInput stories draw with their own render, so the stories
 * parity check cannot draw them from args: here each is, drawn in both,
 * with the field's edges (a length, a code in another script, read only,
 * disabled). Then, mounted, what a server render cannot show: typing moves
 * on, a digit replaces a filled cell's, Backspace goes back, a paste fills
 * the code, letters are dropped, and `update:modelValue` hears what
 * React's onChange hears; a completed code is reported once.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const otp = (props: Record<string, unknown>): Drawn => {
  const vueProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props))
    vueProps[
      key === "className" ? "class" : key === "value" ? "modelValue" : key
    ] = value;
  return { react: KozmosReact.OTPInput, vue: KozmosOTPInput, props, vueProps };
};
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const box = (className: string, ...children: Drawn[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className },
  vueProps: { class: className },
  children,
});

describe("KozmosOTPInput draws what React's OTPInput draws", () => {
  it.each([
    [
      "Default",
      {
        helperText: "Enter the code we sent.",
        label: "Verification code",
        length: 6,
        value: "135826",
      },
    ],
    [
      "WithError",
      {
        error: "Invalid security code.",
        label: "Verification code",
        length: 6,
        value: "135826",
      },
    ],
    [
      "WithDefaultValue",
      {
        defaultValue: "135826",
        helperText: "We filled in the code from your message.",
        label: "Verification code",
        length: 6,
      },
    ],
  ] as const)("%s: draws what React's story draws", async (_name, args) => {
    const { react, vue } = await renderBoth(inTheme(box("w-80", otp(args))));
    expect(react).toContain('value="5"');
    expect(vue).toBe(react);
  });

  it("ValidationStates: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-80 gap-4",
          otp({
            helperText: "Use the latest code.",
            label: "Default",
            length: 6,
            value: "135826",
          }),
          otp({
            helperText: "This code expires soon.",
            label: "Warning",
            length: 6,
            status: "warning",
            value: "135826",
          }),
          otp({
            helperText: "Code verified.",
            label: "Success",
            length: 6,
            status: "success",
            value: "135826",
          }),
          otp({ error: "Invalid security code.", label: "Error", length: 6 }),
        ),
      ),
    );
    expect(vue).toBe(react);
  });

  it("draws what React's OTPInput draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(otp({ label: "Code", length: 4 })),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["its own id on the first cell", { id: "code", length: 4 }],
    ["a code in Arabic-Indic digits", { value: "١٢٣٤", length: 4 }],
    ["a code longer than its cells", { value: "1234567", length: 4 }],
    ["letters dropped from its code", { defaultValue: "1a2b", length: 4 }],
    ["a length that is no number", { length: Number.NaN }],
    ["disabled", { disabled: true, value: "12", length: 4 }],
    ["read only", { readOnly: true, value: "12", length: 4 }],
    ["a boolean error", { error: true, length: 4 }],
    [
      "an app's attributes on the row",
      { length: 4, "data-test": "code", role: "group" },
    ],
    [
      "a wrapper class and its own class",
      { wrapperClassName: "mt-4", className: "justify-center", length: 4 },
    ],
  ] as const)("%s", async (_name, given) => {
    const { react, vue } = await renderBoth(
      inTheme(otp({ label: "Code", ...given })),
      { keepIds: ["code", "code-2", "code-3", "code-4"] },
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosOTPInput, mounted", () => {
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
    vueApp = createApp({ render });
    vueApp.mount(at);
    await nextTick();
    return at;
  };
  const cells = (at: HTMLElement) => [
    ...at.querySelectorAll<HTMLInputElement>("input"),
  ];
  /** A key typed into a cell: its keydown, then its input, unless refused. */
  const typeKey = (
    cell: HTMLInputElement,
    key: string,
    set?: (text: string) => void,
  ) => {
    const down = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    cell.dispatchEvent(down);
    if (down.defaultPrevented) return;
    if (key === "Backspace") return;
    (set ?? ((text: string) => (cell.value = text)))(key);
    cell.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: key,
        inputType: "insertText",
      }),
    );
  };
  const paste = (cell: HTMLInputElement, text: string) => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.assign(event, { clipboardData: { getData: () => text } });
    cell.dispatchEvent(event);
  };

  it("update:modelValue hears what React's onChange hears, and the focus moves as React's", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const focus = { react: [] as string[], vue: [] as string[] };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.OTPInput, {
          length: 4,
          onChange: (value: string) => heard.react.push(value),
        }),
      ),
    );
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!;
    const reactCells = cells(reactHost);
    const step = (cell: HTMLInputElement, key: string) =>
      act(() => typeKey(cell, key, (text) => set!.call(cell, text)));
    const focused = () =>
      document.activeElement?.getAttribute("aria-label") ?? "none";
    reactCells[0].focus();
    step(reactCells[0], "1");
    focus.react.push(focused());
    step(reactCells[1], "a");
    focus.react.push(focused());
    step(reactCells[1], "2");
    focus.react.push(focused());
    // A digit typed into a filled cell replaces its digit and moves on.
    reactCells[0].focus();
    step(reactCells[0], "9");
    focus.react.push(focused());
    act(() => paste(reactCells[0], "4 3 2 1"));
    const reactDigits = reactCells.map((cell) => cell.value).join("");
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();

    const vueHost = await mountVue(() =>
      h(KozmosOTPInput, {
        length: 4,
        "onUpdate:modelValue": (value: string) => heard.vue.push(value),
      }),
    );
    const vueCells = cells(vueHost);
    const vueStep = async (cell: HTMLInputElement, key: string) => {
      typeKey(cell, key);
      await nextTick();
      await nextTick();
    };
    vueCells[0].focus();
    await vueStep(vueCells[0], "1");
    focus.vue.push(focused());
    await vueStep(vueCells[1], "a");
    focus.vue.push(focused());
    expect(vueCells[1].value).toBe("");
    await vueStep(vueCells[1], "2");
    focus.vue.push(focused());
    vueCells[0].focus();
    await vueStep(vueCells[0], "9");
    focus.vue.push(focused());
    paste(vueCells[0], "4 3 2 1");
    await nextTick();

    expect(heard.react).toEqual(["1", "12", "92", "4321"]);
    expect(heard.vue).toEqual(heard.react);
    expect(focus.vue).toEqual(focus.react);
    expect(vueCells.map((cell) => cell.value).join("")).toBe(reactDigits);
  });

  it("Backspace in an empty cell goes back, and a cleared cell is heard", async () => {
    const heard: string[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosOTPInput, {
        length: 4,
        defaultValue: "12",
        "onUpdate:modelValue": (value: string) => heard.push(value),
      }),
    );
    const [first, second, third] = cells(vueHost);
    third.focus();
    typeKey(third, "Backspace");
    expect(document.activeElement).toBe(second);
    second.value = "";
    second.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "deleteContentBackward",
      }),
    );
    await nextTick();
    expect(heard).toEqual(["1"]);
    expect(first.value).toBe("1");
  });

  it("a controlled code follows the model, and read only takes nothing", async () => {
    const code = ref("12");
    const readOnly = ref(false);
    const heard: string[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosOTPInput, {
        length: 4,
        modelValue: code.value,
        readOnly: readOnly.value,
        "onUpdate:modelValue": (value: string) => heard.push(value),
      }),
    );
    const vueCells = cells(vueHost);
    expect(vueCells.map((cell) => cell.value)).toEqual(["1", "2", "", ""]);
    code.value = "9876";
    await nextTick();
    expect(vueCells.map((cell) => cell.value)).toEqual(["9", "8", "7", "6"]);
    readOnly.value = true;
    await nextTick();
    expect(vueCells[0].readOnly).toBe(true);
    paste(vueCells[0], "1111");
    vueCells[1].value = "5";
    vueCells[1].dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: "5",
      }),
    );
    await nextTick();
    await nextTick();
    expect(heard).toEqual([]);
    expect(vueCells.map((cell) => cell.value)).toEqual(["9", "8", "7", "6"]);
  });

  it("takes a template's kebab-case props, and readonly, leaving none on the page (GAP-238)", async () => {
    const at = host();
    vueApp = createApp(
      defineComponent({
        components: { KozmosOTPInput },
        template: `<KozmosOTPInput aria-label="Code" default-value="1234" helper-text="Sent by SMS" readonly />`,
      }),
    );
    vueApp.mount(at);
    await nextTick();
    expect(
      cells(at)
        .map((cell) => cell.value)
        .join(""),
    ).toBe("1234");
    expect(cells(at).every((cell) => cell.readOnly)).toBe(true);
    expect(at.textContent).toContain("Sent by SMS");
    for (const name of ["default-value", "helper-text", "readonly"])
      expect(at.querySelector(`div[${name}]`)).toBeNull();
  });

  it("autofocus focuses the first empty cell", async () => {
    const vueHost = await mountVue(() =>
      h(KozmosOTPInput, { length: 4, defaultValue: "12", autofocus: true }),
    );
    expect(document.activeElement).toBe(cells(vueHost)[2]);
    expect(vueHost.querySelector("[autofocus]")).toBeNull();
  });

  it("reports otp_code_completed once, when the user fills the last cell", async () => {
    vi.useFakeTimers();
    try {
      const dispatched: unknown[] = [];
      const vueHost = await mountVue(() =>
        h(
          KozmosAnalyticsProvider,
          {
            batchDelayMs: 10,
            onDispatch: (events: unknown[]) => dispatched.push(...events),
          },
          {
            default: () =>
              h(KozmosOTPInput, { length: 4, defaultValue: "123" }),
          },
        ),
      );
      const last = cells(vueHost)[3];
      last.focus();
      typeKey(last, "4");
      await nextTick();
      // Editing a full code is the same completion.
      typeKey(last, "5");
      await nextTick();
      await vi.advanceTimersByTimeAsync(50);
      const completions = (
        dispatched as { eventName?: string; properties?: unknown }[]
      ).filter((event) => event.eventName === "otp_code_completed");
      expect(completions).toHaveLength(1);
      expect(completions[0].properties).toEqual({ length: 4 });
    } finally {
      vi.useRealTimers();
    }
  });
});
