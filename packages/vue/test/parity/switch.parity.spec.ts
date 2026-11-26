// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosAnalyticsProvider,
  KozmosSwitch,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import { normalizeHtml } from "./normalize-html";
import { renderBoth, type Drawn } from "./render";
import { element } from "./slotted";

/**
 * React's Switch stories are each their own render of one switch, drawn
 * here in both from the same props; then the edges React's tests cover
 * (Switch.test.tsx): checked and unchecked, disabled, required, an error as
 * a flag and as words, a description and the state words, a caller's
 * aria-describedby and aria-invalid joined with its own, an app's id, class,
 * role and wrapper class, the form's hidden input, and the mixed state
 * (decisions 188 and 189). Then, mounted, what a server render cannot
 * show: a press toggles it, v-model:checked hears what onCheckedChange
 * hears, `switch_toggled` is reported, the state words follow it, a
 * controlled switch waits for its owner, a press of the label toggles it, a
 * prevented click does nothing, a mixed switch turns on, the reset brings
 * the mixed state back with focus on the switch, and inside a form the
 * hidden input follows it.
 */
const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const toggle = (props: Record<string, unknown>): Drawn => {
  const { className, ...rest } = props;
  return {
    react: KozmosReact.Switch,
    vue: KozmosSwitch,
    props,
    vueProps: className === undefined ? rest : { ...rest, class: className },
  };
};
const both = (tree: Drawn, keepIds: string[] = []) =>
  renderBoth(inTheme(tree), { keepIds });
const label = "Airplane Mode";

describe("KozmosSwitch draws React's Switch stories", () => {
  it.each([
    ["Default", { id: "airplane-mode", label }],
    ["Checked", { id: "airplane-mode-checked", label, defaultChecked: true }],
    ["Disabled", { id: "airplane-mode-disabled", label, disabled: true }],
    ["Error", { id: "airplane-mode-error", label, error: "Required field" }],
    [
      "WithDescription",
      {
        id: "gate-alerts",
        label: "Gate alerts",
        description: "Sends a push when your gate changes",
        defaultChecked: true,
      },
    ],
    [
      "StateLabel",
      {
        id: "gate-alerts-state",
        label: "Gate alerts",
        description: "Sends a push when your gate changes",
        showStateLabel: true,
      },
    ],
  ] as const)("%s", async (_name, props) => {
    const { react, vue } = await both(toggle(props), [props.id]);
    expect(react).toContain('role="switch"');
    expect(vue).toBe(react);
  });
});

describe("KozmosSwitch draws what React's Switch draws", () => {
  it.each([
    ["unchecked, by default", {}],
    ["checked", { checked: true }],
    ["unchecked, held", { checked: false }],
    ["checked by default", { defaultChecked: true }],
    ["disabled", { disabled: true }],
    ["disabled and checked", { disabled: true, checked: true }],
    ["required", { required: true }],
    ["not required", { required: false }],
    ["in error", { error: true }],
    ["in error, checked", { error: true, checked: true }],
    ["in error, in words", { error: "Required field" }],
    ["in error, in no words", { error: "" }],
    ["described", { description: "Sends a push when your gate changes" }],
    [
      "described, in error, in words",
      { description: "Sends a push", error: "Required" },
    ],
    ["with its state in words, off", { showStateLabel: true }],
    [
      "with its state in words of its own, on",
      { showStateLabel: true, checked: true, onLabel: "Yes", offLabel: "No" },
    ],
    ["with a name and a value", { name: "alerts", value: "yes" }],
    ["in a form by its id", { form: "settings", name: "alerts" }],
    ["an app's class over the recipe's", { className: "h-8 kozmos-parity" }],
    ["an app's wrapper class", { wrapperClassName: "w-auto kozmos-parity" }],
    ["an app's aria-label", { "aria-label": "Wi-Fi", label: undefined }],
    ["an app's role", { role: "checkbox" }],
    ["mixed", { mixed: true }],
    ["mixed, held on", { mixed: true, checked: true }],
    ["mixed, in error", { mixed: true, error: "Choose one" }],
    [
      "mixed, with its state in words",
      { mixed: true, showStateLabel: true, mixedLabel: "Some on" },
    ],
    ["mixed, described", { mixed: true, description: "Sends a push" }],
  ] as const)("a switch: %s", async (_name, props) => {
    const { react, vue } = await both(toggle({ label, ...props }));
    expect(vue).toBe(react);
  });

  it("draws the mixed dash in place of the thumb, said as Multiple values", async () => {
    const { react, vue, raw } = await both(toggle({ label, mixed: true }));
    expect(raw.react).toContain('data-slot="mixed-dash"');
    expect(raw.react).toContain('data-mixed=""');
    expect(raw.react).toContain('aria-checked="false"');
    expect(vue).toBe(react);
  });

  it("takes the app's id, and its label is for it", async () => {
    const { react, vue } = await both(toggle({ label, id: "wifi" }), ["wifi"]);
    expect(react).toContain('for="wifi"');
    expect(vue).toBe(react);
  });

  it("joins the caller's aria-describedby, its description, the mixed words and the error, in that order", async () => {
    const { react, vue } = await both(
      element("div", {}, [
        element("p", { id: "hint" }, ["Read them first"]),
        toggle({
          label,
          description: "Sends a push",
          mixed: true,
          error: "Required",
          "aria-describedby": "hint",
        }),
      ]),
      ["hint"],
    );
    expect(react).toMatch(/aria-describedby="hint id-\d id-\d id-\d"/);
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
    const { react, vue } = await both(toggle({ label, ...props }));
    expect(vue).toBe(react);
  });
});

describe("KozmosSwitch, mounted, as React's", () => {
  // jsdom has no ResizeObserver, which Radix's hidden input measures the
  // track with inside a form: a stand-in that never reports, in both.
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
  const track = (root: HTMLElement) =>
    root.querySelector<HTMLButtonElement>('[role="switch"]')!;
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
    const reactPart = React.createElement(KozmosReact.Switch, {
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
          const part = h(KozmosSwitch, {
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

  it("a press toggles it, v-model:checked hears what onCheckedChange hears, and its words follow", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      showStateLabel: true,
    });
    const seen = [{ react: snapshot(reactHost), vue: snapshot(vueHost) }];
    for (let i = 0; i < 2; i++) {
      await act2(() => track(reactHost).click());
      await act2(() => track(vueHost).click());
      seen.push({ react: snapshot(reactHost), vue: snapshot(vueHost) });
    }
    await settle();
    expect(heard.react.changes).toEqual([[true], [false]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(read(heard.react.events)).toEqual([
      {
        component: "Switch",
        eventName: "switch_toggled",
        properties: { checked: true },
      },
      {
        component: "Switch",
        eventName: "switch_toggled",
        properties: { checked: false },
      },
    ]);
    expect(read(heard.vue.events)).toEqual(read(heard.react.events));
    // Outside a form, the hidden input is gone once it mounts.
    expect(seen[0].react).not.toContain("<input");
    expect(seen[1].react).toContain('aria-checked="true"');
    expect(seen[1].react).toContain('"On"');
    for (const { react, vue } of seen) expect(vue).toBe(react);
  });

  it("a controlled switch waits for its owner, and follows it", async () => {
    const heard = { react: [] as unknown[][], vue: [] as unknown[][] };
    const drawReact = (checked: boolean) =>
      React.createElement(KozmosReact.Switch, {
        label,
        checked,
        showStateLabel: true,
        onCheckedChange: (...args: unknown[]) => heard.react.push(args),
      });
    const reactHost = await mountReact(drawReact(false));
    const checked = ref(false);
    const vueHost = await mountVue(() =>
      h(KozmosSwitch, {
        label,
        checked: checked.value,
        showStateLabel: true,
        "onUpdate:checked": (...args: unknown[]) => heard.vue.push(args),
      }),
    );
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(heard.react).toEqual([[true]]);
    expect(heard.vue).toEqual(heard.react);
    // Neither changes on its own.
    expect(track(reactHost).getAttribute("aria-checked")).toBe("false");
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    for (const next of [true, false]) {
      await act(async () => reactRoot!.render(drawReact(next)));
      checked.value = next;
      await nextTick();
      expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    }
  });

  it("v-model:checked binds both ways", async () => {
    const checked = ref(false);
    const vueHost = await mountVue(() =>
      h(KozmosSwitch, {
        label,
        checked: checked.value,
        "onUpdate:checked": (value: boolean) => (checked.value = value),
      }),
    );
    await act2(() => track(vueHost).click());
    expect(checked.value).toBe(true);
    expect(track(vueHost).getAttribute("aria-checked")).toBe("true");
    checked.value = false;
    await nextTick();
    expect(track(vueHost).getAttribute("aria-checked")).toBe("false");
  });

  it("a press of its label toggles it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({});
    await act2(() => reactHost.querySelector("label")!.click());
    await act2(() => vueHost.querySelector("label")!.click());
    expect(heard.react.changes).toEqual([[true]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
  });

  it("an app's click that prevents the default leaves it as it is", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      onClick: (event: Event) => event.preventDefault(),
    });
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("a disabled switch is not pressed", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({ disabled: true });
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(heard.react.changes).toEqual([]);
    expect(heard.vue.changes).toEqual([]);
  });

  it("a mixed switch turns on at a click, uncontrolled, whatever it started from", async () => {
    const { heard, reactHost, vueHost } = await drawBoth({
      mixed: true,
      defaultChecked: true,
      showStateLabel: true,
    });
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(heard.react.changes).toEqual([[true]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("offers the reset once edited; pressed, focus goes to the switch and resetMixed fires", async () => {
    const heard = { react: 0, vue: 0 };
    const reactMixed = { current: true };
    const drawReact = () =>
      React.createElement(KozmosReact.Switch, {
        label,
        mixed: reactMixed.current,
        checked: true,
        onCheckedChange: () => {
          reactMixed.current = false;
          reactRoot!.render(drawReact());
        },
        onResetMixed: () => {
          heard.react++;
          reactMixed.current = true;
          reactRoot!.render(drawReact());
        },
      });
    const reactHost = await mountReact(drawReact());
    const mixed = ref(true);
    const vueHost = await mountVue(() =>
      h(KozmosSwitch, {
        label,
        mixed: mixed.value,
        checked: true,
        "onUpdate:checked": () => (mixed.value = false),
        onResetMixed: () => {
          heard.vue++;
          mixed.value = true;
        },
      }),
    );
    const reset = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('[data-slot="reset-mixed"]');
    // No reset while mixed.
    expect(reset(reactHost)).toBeNull();
    expect(reset(vueHost)).toBeNull();
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(reset(reactHost)).not.toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
    await act2(() => reset(reactHost)!.click());
    expect(document.activeElement).toBe(track(reactHost));
    await act2(() => reset(vueHost)!.click());
    expect(document.activeElement).toBe(track(vueHost));
    expect(heard).toEqual({ react: 1, vue: 1 });
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("never offers the reset while disabled", async () => {
    const reactHost = await mountReact(
      React.createElement(KozmosReact.Switch, {
        label,
        disabled: true,
        onResetMixed: () => {},
      }),
    );
    const vueHost = await mountVue(() =>
      h(KozmosSwitch, { label, disabled: true, onResetMixed: () => {} }),
    );
    expect(reactHost.querySelector('[data-slot="reset-mixed"]')).toBeNull();
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });

  it("inside a form, its hidden input stays and follows it", async () => {
    const { heard, reactHost, vueHost } = await drawBoth(
      { name: "alerts" },
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
    await act2(() => track(reactHost).click());
    await act2(() => track(vueHost).click());
    expect(heard.react.changes).toEqual([[true]]);
    expect(heard.vue.changes).toEqual(heard.react.changes);
    expect(input(reactHost).checked).toBe(true);
    expect(input(vueHost).checked).toBe(input(reactHost).checked);
    // Radix stops the button's click so a form hears the hidden input's
    // alone. Vue's listener is the button's own, so its form hears one;
    // React stops it only at its root, which the form sits inside, so a
    // native listener on React's form hears both.
    expect(clicks.vue).toBe(1);
    expect(clicks.react).toBe(2);
    expect(snapshot(vueHost)).toBe(snapshot(reactHost));
  });
});
