// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosThemeProvider, KozmosPasswordInput } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's RightToLeft story draws with its own render, so the stories
 * parity check cannot draw it from args: here it is, drawn in both, with
 * the field's edges. Then, mounted, the reveal and typing:
 * `update:visible` hears what React's onVisibleChange hears, a controlled
 * `visible` waits for the parent, and `update:modelValue` hears each
 * change, as React's onChange.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const ARGS = {
  label: "Password",
  placeholder: "Enter password",
  helperText: "Use at least 12 characters.",
};
const password = (
  props: Record<string, unknown>,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.PasswordInput,
  vue: KozmosPasswordInput,
  props,
  vueProps: vueProps ?? props,
});

describe("KozmosPasswordInput draws what React's PasswordInput draws", () => {
  it("RightToLeft: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth({
      react: KozmosReact.ThemeProvider,
      vue: KozmosThemeProvider,
      props: { dir: "rtl", theme: "light" },
      children: [
        {
          react: "div",
          vue: "div",
          props: { style: { width: 220 } },
          vueProps: { style: { width: "220px" } },
          children: [password(ARGS)],
        },
      ],
    });
    expect(react).toContain('dir="rtl"');
    expect(vue).toBe(react);
  });

  it.each([
    ["shown, controlled", { visible: true }],
    [
      "hidden, controlled over its default",
      { visible: false, defaultVisible: true },
    ],
    [
      "the reveal in the caller's words",
      { showPasswordLabel: "Göster", hidePasswordLabel: "Gizle" },
    ],
    ["disabled", { disabled: true }],
    [
      "a caller's description beside its helper",
      { "aria-describedby": "hint" },
    ],
    ["a warning", { status: "warning" }],
    ["a boolean error", { error: true }],
    ["a controlled value", { value: "hunter2" }],
    [
      "a wrapper class and its own class",
      { wrapperClassName: "mt-4", className: "px-6" },
    ],
  ] as const)("%s", async (_name, given) => {
    const props: Record<string, unknown> = { ...ARGS, ...given };
    const vueProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props))
      vueProps[
        key === "className" ? "class" : key === "value" ? "modelValue" : key
      ] = value;
    if ("value" in props) props.onChange = () => {};
    const { react, vue } = await renderBoth(
      {
        react: KozmosReact.ThemeProvider,
        vue: KozmosThemeProvider,
        children: [password(props, vueProps)],
      },
      { keepIds: ["hint"] },
    );
    expect(vue).toBe(react);
  });
});

describe("KozmosPasswordInput, mounted", () => {
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

  it("update:visible fires as React's onVisibleChange, and the field shows what is typed", async () => {
    const heard = { react: [] as boolean[], vue: [] as boolean[] };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(
          KozmosReact.ThemeProvider,
          null,
          React.createElement(KozmosReact.PasswordInput, {
            ...ARGS,
            onVisibleChange: (visible: boolean) => heard.react.push(visible),
          }),
        ),
      ),
    );
    act(() => reactHost.querySelector("button")!.click());
    act(() => reactHost.querySelector("button")!.click());
    act(() => reactHost.querySelector("button")!.click());
    const reactShown = normalizeHtml(reactHost.innerHTML);
    act(() => reactRoot?.unmount());
    reactRoot = undefined;
    document.body.replaceChildren();

    const vueHost = await mountVue(() =>
      h(KozmosPasswordInput, {
        ...ARGS,
        "onUpdate:visible": (visible: boolean) => heard.vue.push(visible),
      }),
    );
    for (let i = 0; i < 3; i++) {
      vueHost.querySelector("button")!.click();
      await nextTick();
    }
    expect(heard.react).toEqual([true, false, true]);
    expect(heard.vue).toEqual(heard.react);
    expect(vueHost.querySelector("input")!.type).toBe("text");
    expect(normalizeHtml(vueHost.innerHTML)).toBe(reactShown);
  });

  it("a controlled visible waits for the parent, as React's", async () => {
    const visible = ref(false);
    const asked: boolean[] = [];
    const vueHost = await mountVue(() =>
      h(KozmosPasswordInput, {
        ...ARGS,
        visible: visible.value,
        "onUpdate:visible": (next: boolean) => asked.push(next),
      }),
    );
    const button = vueHost.querySelector("button")!;
    button.click();
    await nextTick();
    expect(asked).toEqual([true]);
    expect(vueHost.querySelector("input")!.type).toBe("password");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    visible.value = true;
    await nextTick();
    expect(vueHost.querySelector("input")!.type).toBe("text");
    expect(button.getAttribute("aria-label")).toBe("Hide password");
  });

  it("update:modelValue hears each change, and a disabled field's reveal is disabled", async () => {
    const value = ref("hunte");
    const disabled = ref(false);
    const vueHost = await mountVue(() =>
      h(KozmosPasswordInput, {
        ...ARGS,
        disabled: disabled.value,
        modelValue: value.value,
        "onUpdate:modelValue": (next: string) => (value.value = next),
      }),
    );
    const field = vueHost.querySelector("input")!;
    expect(field.value).toBe("hunte");
    field.value = "hunter";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(value.value).toBe("hunter");
    disabled.value = true;
    await nextTick();
    expect(field.disabled).toBe(true);
    expect(vueHost.querySelector("button")!.disabled).toBe(true);
  });
});
