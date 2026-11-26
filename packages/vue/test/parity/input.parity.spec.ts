// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { Star01 as ReactStar } from "@kozmos-ds/icons";
import { Star01 } from "@kozmos-ds/icons/vue";
import { createApp, defineComponent, h, nextTick, ref, type App } from "vue";
import { KozmosThemeProvider, KozmosInput } from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Input stories draw with their own render, so the stories parity
 * check cannot draw them from args: here each is, drawn in both, with the
 * field's edges (a count, a caller's description, invalid, disabled and
 * read only, a copy, a toggle and an edit at its end, mixed). Then,
 * mounted, what a server render cannot show: typing (v-model, React's
 * onChange), a copy that says "Copied", a toggle, an edit, and the mixed
 * field's reset, each heard in both.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** React's props and Vue's, where they are spelled differently. */
const input = (
  props: Record<string, unknown>,
  vueProps?: Record<string, unknown>,
): Drawn => ({
  react: KozmosReact.Input,
  vue: KozmosInput,
  props,
  vueProps: vueProps ?? props,
});
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
const STORY_BOX = "grid w-full max-w-sm items-center gap-1.5 align-middle";
const FID = "5f0c2a7e-91d4-4b1e-a0f3-6c8e2d1b9a47";

describe("KozmosInput draws what React's Input draws", () => {
  it("Default: draws what React's story draws", async () => {
    const props = {
      type: "email",
      id: "email",
      label: "Email",
      placeholder: "Email",
    };
    const { react, vue } = await renderBoth(
      inTheme(box(STORY_BOX, input(props))),
      {
        keepIds: ["email"],
      },
    );
    expect(react).toContain('for="email"');
    expect(vue).toBe(react);
  });

  it("WithHelperText: draws what React's story draws", async () => {
    const props = {
      type: "email",
      id: "email-helper",
      label: "Email",
      placeholder: "Email",
      helperText: "Use your work email address.",
    };
    const { react, vue } = await renderBoth(
      inTheme(box(STORY_BOX, input(props))),
      { keepIds: ["email-helper"] },
    );
    expect(react).toContain("aria-describedby");
    expect(vue).toBe(react);
  });

  it("WithError: draws what React's story draws", async () => {
    const props = {
      type: "email",
      id: "email-error",
      label: "Email",
      placeholder: "Email",
      error: "Invalid email address.",
    };
    const { react, vue } = await renderBoth(
      inTheme(box(STORY_BOX, input(props))),
      { keepIds: ["email-error"] },
    );
    expect(react).toContain('role="alert"');
    expect(react).toContain('aria-invalid="true"');
    expect(vue).toBe(react);
  });

  it("ValidationStates: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-full max-w-sm items-center gap-4 align-middle",
          input({
            label: "Default",
            placeholder: "Placeholder",
            helperText: "Helper text",
          }),
          input({
            label: "Warning",
            placeholder: "Placeholder",
            status: "warning",
            helperText: "Check this value.",
          }),
          input({
            label: "Success",
            placeholder: "Placeholder",
            status: "success",
            helperText: "Looks good.",
          }),
          input(
            {
              label: "Readonly",
              placeholder: "Placeholder",
              readOnly: true,
              helperText: "This value cannot be edited.",
            },
            {
              label: "Readonly",
              placeholder: "Placeholder",
              readonly: true,
              helperText: "This value cannot be edited.",
            },
          ),
        ),
      ),
    );
    expect(react).toContain("readonly");
    expect(vue).toBe(react);
  });

  it("Actions: draws what React's story draws", async () => {
    const toggle = {
      kind: "toggle",
      label: "Featured",
      pressed: true,
      onPressedChange: () => {},
    };
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-full max-w-sm gap-4",
          input(
            {
              label: "FID",
              readOnly: true,
              defaultValue: FID,
              action: { kind: "copy", label: "Copy FID" },
            },
            {
              label: "FID",
              readonly: true,
              defaultValue: FID,
              action: { kind: "copy", label: "Copy FID" },
            },
          ),
          input(
            {
              label: "Name",
              defaultValue: "Gate B12",
              action: {
                ...toggle,
                icon: React.createElement(ReactStar, { "aria-hidden": "true" }),
              },
            },
            {
              label: "Name",
              defaultValue: "Gate B12",
              action: {
                ...toggle,
                icon: h(Star01, { "aria-hidden": "true" }),
              },
            },
          ),
        ),
      ),
    );
    expect(react).toContain('aria-label="Copy FID"');
    expect(react).toContain('aria-pressed="true"');
    expect(react).toContain(`value="${FID}"`);
    expect(vue).toBe(react);
  });

  it("EditAction: draws what React's story draws", async () => {
    const both = (props: Record<string, unknown>) =>
      input(props, {
        ...props,
        readOnly: undefined,
        readonly: props.readOnly,
      });
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-full max-w-sm gap-4",
          both({
            label: "ID",
            readOnly: true,
            defaultValue: "staff",
            action: { kind: "edit", label: "Edit ID", onEdit: () => {} },
          }),
          both({
            label: "Map Style",
            readOnly: true,
            defaultValue: "https://styles.example.com/persona/staff.json",
            action: {
              kind: "edit",
              label: "Edit Map Style",
              onEdit: () => {},
            },
          }),
        ),
      ),
    );
    expect(react).toContain('aria-label="Edit Map Style"');
    expect(vue).toBe(react);
  });

  it("MixedValue: draws what React's story draws", async () => {
    const field = (label: string, edit: string | undefined) =>
      input(
        {
          label,
          mixed: edit === undefined,
          value: edit ?? "",
          onChange: () => {},
          onResetMixed: () => {},
        },
        {
          label,
          mixed: edit === undefined,
          modelValue: edit ?? "",
          "onUpdate:modelValue": () => {},
          onResetMixed: () => {},
        },
      );
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-80 gap-4",
          field("Name", undefined),
          field("Description", "Gate seating"),
        ),
      ),
    );
    expect(react).toContain('placeholder="Multiple values"');
    expect(react).toContain("data-mixed");
    expect(react).toContain("Reset to multiple values");
    expect(vue).toBe(react);
  });

  it("draws what React's Input draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(input({ label: "Name", placeholder: "Your name" })),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["a boolean error, no message", { error: true }],
    ["an empty error, the helper kept", { error: "", helperText: "Helper" }],
    [
      "a caller's description beside its error",
      { "aria-describedby": "hint", error: "Required" },
    ],
    [
      "a caller's description beside its helper",
      { "aria-describedby": "hint", helperText: "Helper" },
    ],
    ["a caller's aria-invalid with no error", { "aria-invalid": true }],
    [
      "aria-invalid false under an error",
      { "aria-invalid": false, error: "Required" },
    ],
    ["error as a status", { status: "error" }],
    ["disabled", { disabled: true, value: "Gate", onChange: () => {} }],
    [
      "a wrapper class and its own class",
      { wrapperClassName: "mt-4", className: "px-6" },
    ],
    [
      "a count, empty",
      { count: { limit: 512, minimum: 50 }, defaultValue: "" },
    ],
    [
      "a count, too short",
      { count: { limit: 512, minimum: 50 }, defaultValue: "Too short" },
    ],
    [
      "a count, over the limit",
      { count: { limit: 4 }, defaultValue: "Gate B12" },
    ],
    [
      "a count in the caller's words",
      {
        count: {
          limit: 10,
          label: (n: number, max: number) => `${n} of ${max}`,
          overLimit: "Too long",
        },
        defaultValue: "Gate B12 and more",
      },
    ],
    [
      "a count beside a helper",
      { count: { limit: 20 }, helperText: "Helper", defaultValue: "Gate" },
    ],
    [
      "a count beside the caller's error",
      { count: { limit: 2 }, error: "Mine", defaultValue: "Gate" },
    ],
    [
      "a copy, disabled",
      { action: { kind: "copy" }, disabled: true, defaultValue: "a" },
    ],
    [
      "a copy, mixed",
      { action: { kind: "copy" }, mixed: true, defaultValue: "a" },
    ],
    [
      "an edit in its default words",
      { action: { kind: "edit", onEdit: () => {} } },
    ],
    [
      "mixed in the caller's words",
      { mixed: true, mixedLabel: "Several", placeholder: "Name" },
    ],
    [
      "mixed, uncontrolled, with a default",
      { mixed: true, defaultValue: "Gate" },
    ],
    [
      "the reset in the caller's words",
      {
        value: "Gate",
        onChange: () => {},
        onResetMixed: () => {},
        resetMixedLabel: "Undo",
      },
    ],
    [
      "no reset while read only",
      {
        value: "Gate",
        onChange: () => {},
        onResetMixed: () => {},
        readOnly: true,
      },
    ],
    [
      "no reset while disabled",
      {
        value: "Gate",
        onChange: () => {},
        onResetMixed: () => {},
        disabled: true,
      },
    ],
  ] as const)("%s", async (_name, given) => {
    const props = { label: "Name", ...given } as Record<string, unknown>;
    const vueProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (key === "className") vueProps.class = value;
      else if (key === "readOnly") vueProps.readonly = value;
      else if (key === "value") vueProps.modelValue = value;
      else if (key === "onChange") vueProps["onUpdate:modelValue"] = value;
      else vueProps[key] = value;
    }
    const { react, vue } = await renderBoth(inTheme(input(props, vueProps)), {
      keepIds: ["hint"],
    });
    expect(vue).toBe(react);
  });
});

describe("KozmosInput, mounted", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
    vi.useRealTimers();
  });
  const host = () => {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
  };
  /** Types `text` into the field, as a browser's input event says it. */
  const type = (field: HTMLInputElement, text: string) => {
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const reactType = (field: HTMLInputElement, text: string) => {
    // React tracks the value it last set: a native setter makes the change
    // one it hears.
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!;
    act(() => {
      set!.call(field, text);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };
  const mountReact = async (element: React.ReactElement) => {
    const at = host();
    reactRoot = createRoot(at);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.ThemeProvider, null, element),
      ),
    );
    return at;
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

  it("update:modelValue hears each change, as React's onChange", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const reactHost = await mountReact(
      React.createElement(KozmosReact.Input, {
        "aria-label": "Name",
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          heard.react.push(event.target.value),
      }),
    );
    reactType(reactHost.querySelector("input")!, "Ada");
    const name = ref("");
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        "aria-label": "Name",
        modelValue: name.value,
        "onUpdate:modelValue": (next: string) => {
          heard.vue.push(next);
          name.value = next;
        },
      }),
    );
    const field = vueHost.querySelector("input")!;
    type(field, "Ada");
    await nextTick();
    expect(heard.vue).toEqual(heard.react);
    expect(name.value).toBe("Ada");
    expect(field.value).toBe("Ada");
  });

  it("an uncontrolled field keeps what is typed, and its count follows it", async () => {
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        label: "Note",
        count: { limit: 5 },
        defaultValue: "Gate",
      }),
    );
    const field = vueHost.querySelector("input")!;
    expect(field.value).toBe("Gate");
    expect(vueHost.textContent).toContain("4/5");
    type(field, "Gate B12");
    await nextTick();
    expect(field.value).toBe("Gate B12");
    expect(vueHost.textContent).toContain("8/5");
    expect(vueHost.querySelector('[role="alert"]')?.textContent).toContain(
      "Maximum character limit exceeded",
    );
    expect(field.getAttribute("aria-invalid")).toBe("true");
  });

  it("takes back a change the parent refuses, and shows one it changes", async () => {
    const value = ref("ADA");
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        "aria-label": "Code",
        modelValue: value.value,
        "onUpdate:modelValue": (next: string) => {
          if (/^[A-Za-z]*$/.test(next)) value.value = next.toUpperCase();
        },
      }),
    );
    const field = vueHost.querySelector("input")!;
    type(field, "ADA1");
    await nextTick();
    await nextTick();
    expect(field.value).toBe("ADA");
    type(field, "ADA1");
    await nextTick();
    await nextTick();
    expect(field.value).toBe("ADA");
    type(field, "ADAl");
    await nextTick();
    expect(value.value).toBe("ADAL");
    expect(field.value).toBe("ADAL");
  });

  it("v-model.trim keeps a typed space, and a commit trims the field", async () => {
    const name = ref("Ada");
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        "aria-label": "Name",
        modelValue: name.value,
        modelModifiers: { trim: true },
        "onUpdate:modelValue": (next: string) => (name.value = next),
      }),
    );
    const field = vueHost.querySelector("input")!;
    type(field, "Ada L ");
    await nextTick();
    await nextTick();
    expect(name.value).toBe("Ada L");
    expect(field.value).toBe("Ada L ");
    expect(field.getAttributeNames()).not.toContain("modelmodifiers");
    field.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
    expect(field.value).toBe("Ada L");
    name.value = "Grace";
    await nextTick();
    expect(field.value).toBe("Grace");
  });

  it("takes a template's spellings: default-value, read-only, a bare error", async () => {
    const at = host();
    vueApp = createApp(
      defineComponent({
        components: { KozmosInput },
        template: `<KozmosInput aria-label="Name" default-value="Gate" read-only error />`,
      }),
    );
    vueApp.mount(at);
    await nextTick();
    const field = at.querySelector("input")!;
    expect(field.value).toBe("Gate");
    expect(field.readOnly).toBe(true);
    // A bare error is the empty message, no error, as the bridge read it.
    expect(field.getAttribute("aria-invalid")).toBeNull();
    for (const name of ["default-value", "defaultvalue", "read-only"])
      expect(field.hasAttribute(name)).toBe(false);
  });

  it("an app's @input and @change still reach the field", async () => {
    const input = vi.fn();
    const change = vi.fn();
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        "aria-label": "Name",
        onInput: input,
        onChange: change,
      }),
    );
    const field = vueHost.querySelector("input")!;
    type(field, "A");
    field.dispatchEvent(new Event("change", { bubbles: true }));
    expect(input).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  describe("the copy", () => {
    const writeText = vi.fn();
    beforeEach(() => {
      writeText.mockReset().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
    });
    const settle = async () => {
      await Promise.resolve();
      await Promise.resolve();
      await nextTick();
    };

    it("copies the value and says so, as React's, and forgets it after 2 s", async () => {
      vi.useFakeTimers();
      const heard = { react: [] as string[], vue: [] as string[] };
      const reactHost = await mountReact(
        React.createElement(KozmosReact.Input, {
          label: "FID",
          readOnly: true,
          defaultValue: FID,
          action: {
            kind: "copy",
            label: "Copy FID",
            onCopy: (value: string) => heard.react.push(value),
          },
        }),
      );
      reactHost.querySelector("button")!.click();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      const reactCopied = normalizeHtml(reactHost.innerHTML);
      act(() => reactRoot?.unmount());
      reactRoot = undefined;
      document.body.replaceChildren();

      const vueHost = await mountVue(() =>
        h(KozmosInput, {
          label: "FID",
          readonly: true,
          defaultValue: FID,
          action: {
            kind: "copy",
            label: "Copy FID",
            onCopy: (value: string) => heard.vue.push(value),
          },
        }),
      );
      const said = () => vueHost.querySelector('[role="status"]')?.textContent;
      vueHost.querySelector("button")!.click();
      await settle();
      expect(heard.vue).toEqual([FID]);
      expect(heard.vue).toEqual(heard.react);
      expect(normalizeHtml(vueHost.innerHTML)).toBe(reactCopied);
      expect(said()).toBe("Copied");
      vueHost.querySelector("button")!.click();
      await settle();
      expect(said()).toBe("Copied ");
      await vi.advanceTimersByTimeAsync(2000);
      await nextTick();
      expect(said()).toBe("");
    });

    it("says nothing when the clipboard refuses", async () => {
      writeText.mockRejectedValue(new Error("denied"));
      const onCopy = vi.fn();
      const vueHost = await mountVue(() =>
        h(KozmosInput, {
          "aria-label": "FID",
          defaultValue: FID,
          action: { kind: "copy", onCopy },
        }),
      );
      vueHost.querySelector("button")!.click();
      await settle();
      expect(onCopy).not.toHaveBeenCalled();
      expect(vueHost.querySelector('[role="status"]')?.textContent).toBe("");
    });
  });

  it("a toggle calls onPressedChange with the next state, and an edit onEdit", async () => {
    const pressed = vi.fn();
    const edit = vi.fn();
    const vueHost = await mountVue(() =>
      h("div", [
        h(KozmosInput, {
          "aria-label": "Name",
          action: {
            kind: "toggle",
            label: "Featured",
            icon: Star01,
            pressed: false,
            onPressedChange: pressed,
          },
        }),
        h(KozmosInput, {
          "aria-label": "ID",
          readonly: true,
          action: { kind: "edit", onEdit: edit },
        }),
      ]),
    );
    const [toggle, pencil] = vueHost.querySelectorAll("button");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.querySelector("svg")).not.toBeNull();
    toggle.click();
    // Read only does not disable the edit.
    expect(pencil.disabled).toBe(false);
    pencil.click();
    expect(pressed).toHaveBeenCalledWith(true);
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it("keeps the same input, its focus and its value, as an action comes and goes", async () => {
    const action = ref<Record<string, unknown> | undefined>(undefined);
    const vueHost = await mountVue(() =>
      h(KozmosInput, { "aria-label": "Name", action: action.value as never }),
    );
    const field = vueHost.querySelector("input")!;
    field.focus();
    type(field, "Gate");
    await nextTick();
    action.value = { kind: "copy" };
    await nextTick();
    expect(vueHost.querySelector("input")).toBe(field);
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe("Gate");
  });

  it("resetMixed: focus goes to the field, an uncontrolled one is emptied, then the product hears it", async () => {
    const order: string[] = [];
    const mixed = ref(false);
    const vueHost = await mountVue(() =>
      h(KozmosInput, {
        id: "name",
        label: "Name",
        defaultValue: "Gate",
        mixed: mixed.value,
        onResetMixed: () => {
          order.push(`reset, focus on ${document.activeElement?.id}`);
          mixed.value = true;
        },
      }),
    );
    const field = vueHost.querySelector("input")!;
    vueHost
      .querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]')!
      .click();
    await nextTick();
    expect(order).toEqual(["reset, focus on name"]);
    expect(field.value).toBe("");
    expect(field.placeholder).toBe("Multiple values");
    expect(vueHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
  });
});
