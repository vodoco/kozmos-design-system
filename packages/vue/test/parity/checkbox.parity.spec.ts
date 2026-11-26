// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosCheckbox,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * The stories parity check draws React's args stories in both; this draws
 * the edges React's tests cover (Checkbox.test.tsx): the mixed state and its
 * dash, checked and unchecked, disabled, required, an error as a flag and as
 * words, a description, a caller's aria-describedby and aria-invalid joined
 * with its own, an app's id, class and wrapper class, and the form's hidden
 * input. Then, mounted, what a server render cannot show: a press toggles
 * it, v-model:checked hears what onCheckedChange hears, `checkbox_toggled`
 * is reported, a mixed box checks, a controlled box waits for its owner, a
 * press of the label toggles it, Enter does not, a prevented click does
 * nothing, and inside a form the hidden input follows it.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const checkbox = (props: Record<string, unknown>): Drawn => {
  const { className, ...rest } = props;
  return {
    react: KozmosReact.Checkbox,
    vue: KozmosCheckbox,
    props,
    vueProps: className === undefined ? rest : { ...rest, class: className },
  };
};
const both = (tree: Drawn, keepIds: string[] = []) =>
  renderBoth(inTheme(tree), { keepIds });
const label = "Accept terms and conditions";

describe("KozmosCheckbox draws what React's Checkbox draws", () => {
  it.each([
    ["unchecked, by default", {}],
    ["checked", { checked: true }],
    ["unchecked, held", { checked: false }],
    ["mixed, with a dash for its mark", { checked: "indeterminate" }],
    ["checked by default", { defaultChecked: true }],
    // React draws the dash from the `checked` prop, so a box that starts
    // mixed uncontrolled draws a tick (recorded in the port's report).
    ["mixed by default", { defaultChecked: "indeterminate" }],
    ["disabled", { disabled: true }],
    ["disabled and checked", { disabled: true, checked: true }],
    ["required", { required: true }],
    ["not required", { required: false }],
    ["in error", { error: true }],
    ["in error, in words", { error: "You must accept the terms" }],
    ["in error, in no words", { error: "" }],
    ["described", { description: "Tell me when a faster route opens" }],
    [
      "described, in error, in words",
      { description: "Tell me when a faster route opens", error: "Required" },
    ],
    ["with a name and a value", { name: "terms", value: "yes" }],
    ["in a form by its id", { form: "signup", name: "terms" }],
    ["an app's class over the recipe's", { className: "h-6 kozmos-parity" }],
    ["an app's wrapper class", { wrapperClassName: "w-auto kozmos-parity" }],
    ["an app's aria-label", { "aria-label": "Terms", label: undefined }],
    ["an app's role", { role: "switch" }],
  ] as const)("a checkbox: %s", async (_name, props) => {
    const { react, vue } = await both(checkbox({ label, ...props }));
    expect(vue).toBe(react);
  });

  it("draws the dash for the mixed state, and reads it as mixed", async () => {
    const { react, vue, raw } = await both(
      checkbox({ label, checked: "indeterminate" }),
    );
    expect(raw.react).toContain('aria-checked="mixed"');
    expect(raw.react).toContain('data-state="indeterminate"');
    // Minus's one stroke, where Check draws a tick.
    expect(raw.react).toContain('d="M5 12H19"');
    expect(vue).toBe(react);
  });

  it("takes the app's id, and its label is for it", async () => {
    const { react, vue } = await both(checkbox({ label, id: "terms" }), [
      "terms",
    ]);
    expect(react).toContain('for="terms"');
    expect(vue).toBe(react);
  });

  it("joins the caller's aria-describedby, its description and the error, in that order", async () => {
    const { react, vue } = await both(
      element("div", {}, [
        element("p", { id: "hint" }, ["Read them first"]),
        checkbox({
          label,
          description: "Tell me when a faster route opens",
          error: "Required",
          "aria-describedby": "hint",
        }),
      ]),
      ["hint"],
    );
    expect(react).toMatch(/aria-describedby="hint id-\d id-\d"/);
    expect(vue).toBe(react);
  });

  it.each([
    ["an app's aria-invalid with no error", { "aria-invalid": "true" }],
    ["an app's aria-invalid=false with no error", { "aria-invalid": "false" }],
    [
      "an app's aria-invalid=false with an error",
      { "aria-invalid": "false", error: true },
    ],
  ] as const)("keeps its error state: %s", async (_name, props) => {
    const { react, vue } = await both(checkbox({ label, ...props }));
    expect(vue).toBe(react);
  });
});

describe("KozmosCheckbox, mounted, as React's", () => {
  // jsdom has no ResizeObserver, which Radix's hidden input measures the
  // box with inside a form: a stand-in that never reports, in both.
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
  });
  const host = () => document.body.appendChild(document.createElement("div"));
  const snapshot = (root: HTMLElement) => normalizeHtml(root.innerHTML);
  const box = (root: HTMLElement) =>
    root.querySelector<HTMLButtonElement>('[role="checkbox"]')!;
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

  /** Both, uncontrolled, in an analytics provider, with what each heard. */
  async function drawBoth(props: Record<string, unknown>, inForm = false) {
    const heard = {
      react: {
        changes: [] as unknown[][],
        events: [] as KozmosAnalyticsEvent[],
      },
      vue: { changes: [] as unknown[][], events: [] as KozmosAnalyticsEvent[] },
    };
    const reactPart = React.createElement(KozmosReact.Checkbox, {
      label,
      ...props,
      onCheckedChange: (...args: unknown[]) => heard.react.changes.push(args),
    });
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
          const part = h(KozmosCheckbox, {
            label,
            ...props,
            "onUpdate:checked": (...args: unknown[]) =>
              heard.vue.changes.push(args),
          });
          return [inForm ? h("form", null, [part]) : part];
        },
      ),
    );
    return { heard, reactHost, vueHost };
  }

  it("a press toggles it, and v-model:checked hears what onCheckedChange hears", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    const seen = [{ react: snapshot(reactHost), vue: snapshot(vueHost) }];
    for (let i = 0; i < 2; i++) {
      await act2(() => box(reactHost).click());
      await act2(() => box(vueHost).click());
      seen.push({ react: snapshot(reactHost), vue: snapshot(vueHost) });
    }
    await settle();
    expect(heard.react.changes).toEqual([[true], [false]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toEqual([
      {
        component: "Checkbox",
        eventName: "checkbox_toggled",
        properties: { checked: true },
      },
      {
        component: "Checkbox",
        eventName: "checkbox_toggled",
        properties: { checked: false },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    // Outside a form, the hidden input is gone once it mounts.
    expect(seen[0].react).not.toContain("<input");
    expect(seen[1].react).toContain('aria-checked="true"');
    for (const { react, vue } of seen) expect(vue).toBe(react);
  });

  it("a press of a mixed box checks it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      defaultChecked: "indeterminate",
    });
    expect(box(reactHost).getAttribute("aria-checked")).toBe("mixed");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => box(reactHost).click());
    await act2(() => box(vueHost).click());
    expect(heard.react.changes).toEqual([[true]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a controlled box waits for its owner, and follows it", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const drawReact = (checked: boolean | "indeterminate") =>
      React.createElement(KozmosReact.Checkbox, {
        label,
        checked,
        onCheckedChange: (...args: unknown[]) => heard.react.push(args),
      });
    const reactHost = await mountReact(drawReact("indeterminate"));
    const checked = ref<boolean | "indeterminate">("indeterminate");
    const vueHost = await mountVue(() =>
      h(KozmosCheckbox, {
        label,
        checked: checked.value,
        "onUpdate:checked": (...args: unknown[]) => heard.vue.push(args),
      }),
    );
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => box(reactHost).click());
    await act2(() => box(vueHost).click());
    expect(heard.react).toEqual([[true]]);
    expect(heard.vue).toEqual(heard.react);
    // Neither changes on its own.
    expect(box(reactHost).getAttribute("aria-checked")).toBe("mixed");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    for (const next of [true, false, "indeterminate"] as const) {
      await act(async () => reactRoot!.render(drawReact(next)));
      checked.value = next;
      await nextTick();
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    }
  });

  it("v-model:checked binds both ways", async () => {
    const checked = ref<boolean | "indeterminate">(false);
    const vueHost = await mountVue(() =>
      h(KozmosCheckbox, {
        label,
        checked: checked.value,
        "onUpdate:checked": (value: boolean | "indeterminate") =>
          (checked.value = value),
      }),
    );
    await act2(() => box(vueHost).click());
    expect(checked.value).toBe(true);
    expect(box(vueHost).getAttribute("aria-checked")).toBe("true");
    checked.value = "indeterminate";
    await nextTick();
    expect(box(vueHost).getAttribute("aria-checked")).toBe("mixed");
  });

  it("a press of its label toggles it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    await act2(() => reactHost.querySelector("label")!.click());
    await act2(() => vueHost.querySelector("label")!.click());
    expect(heard.react.changes).toEqual([[true]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
  });

  it("Enter does not toggle it, and is prevented, as Radix's", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    const enter = (root: HTMLElement) => {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      box(root).dispatchEvent(event);
      return event.defaultPrevented;
    };
    let prevented = { react: false, vue: false };
    await act2(() => {
      prevented = { react: enter(reactHost), vue: enter(vueHost) };
    });
    expect(prevented).toEqual({ react: true, vue: true });
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
  });

  it("an app's click that prevents the default leaves it as it is", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      onClick: (event: Event) => event.preventDefault(),
    });
    await act2(() => box(reactHost).click());
    await act2(() => box(vueHost).click());
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a disabled box is not pressed", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({ disabled: true });
    await act2(() => box(reactHost).click());
    await act2(() => box(vueHost).click());
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
  });

  it("inside a form, its hidden input stays and follows it, and a reset restores it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth(
      { name: "terms" },
      true,
    );
    const input = (root: HTMLElement) =>
      root.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const clicks = { react: 0, vue: 0 };
    reactHost
      .querySelector("form")!
      .addEventListener("click", () => clicks.react++);
    vueHost
      .querySelector("form")!
      .addEventListener("click", () => clicks.vue++);
    expect(input(reactHost)).not.toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => box(reactHost).click());
    await act2(() => box(vueHost).click());
    expect(input(reactHost).checked).toBe(true);
    expect(input(vueHost).checked).toBe(input(reactHost).checked);
    // Radix stops the button's click so a form hears the hidden input's
    // alone. Vue's listener is the button's own, so its form hears one;
    // React stops it only at its root, which the form sits inside, so a
    // native listener on React's form hears both.
    expect(clicks.vue).toBe(1);
    expect(clicks.react).toBe(2);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => reactHost.querySelector("form")!.reset());
    await act2(() => vueHost.querySelector("form")!.reset());
    expect(heard.react.changes).toEqual([[true], [false]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });
});
